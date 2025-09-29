import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database';
import { logger } from '../../utils/logger';
import { streamingService, StreamingMessage } from './StreamingService';

export interface WebSocketConnection {
  id: string;
  userId: string;
  sessionId?: string;
  socket: Socket;
  isAuthenticated: boolean;
  connectedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface WebSocketMessage {
  id: string;
  type: 'chat' | 'typing' | 'status' | 'system' | 'error';
  data: any;
  timestamp: Date;
  userId: string;
  sessionId?: string;
}

export interface WebSocketStats {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  messagesReceived: number;
  roomCounts: Record<string, number>;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connections: Map<string, WebSocketConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private sessionRooms: Map<string, Set<string>> = new Map();
  private stats: WebSocketStats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    roomCounts: {}
  };

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.setupMiddleware();

    // Integration with StreamingService
    streamingService.on('messageSent', (message: StreamingMessage) => {
      this.handleSSEMessage(message);
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * Setup Socket.IO middleware
   */
  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          throw new Error('No authentication token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, email: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        socket.data.userId = user.id;
        socket.data.user = user;
        next();
      } catch (error) {
        logger.warn('WebSocket authentication failed', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : String(error)
        });
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const rateLimitKey = `ws_rate_${socket.data.userId}`;
      // Simple in-memory rate limiting (in production, use Redis)
      // This is a simplified implementation
      next();
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket): void {
    const connectionId = uuidv4();
    const userId = socket.data.userId;
    const now = new Date();

    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      socket,
      isAuthenticated: true,
      connectedAt: now,
      lastActivity: now
    };

    this.connections.set(connectionId, connection);
    this.stats.totalConnections++;
    this.stats.activeConnections++;

    // Track user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Store connection ID in socket data
    socket.data.connectionId = connectionId;

    logger.info('WebSocket connection established', {
      connectionId,
      userId,
      socketId: socket.id,
      totalConnections: this.stats.totalConnections
    });

    // Setup socket event handlers
    this.setupSocketHandlers(socket, connection);

    // Send welcome message
    socket.emit('connected', {
      connectionId,
      timestamp: now.toISOString(),
      user: socket.data.user
    });
  }

  /**
   * Setup individual socket event handlers
   */
  private setupSocketHandlers(socket: Socket, connection: WebSocketConnection): void {
    // Join session room
    socket.on('joinSession', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;

        // Verify session access
        const session = await prisma.streamingSession.findFirst({
          where: {
            id: sessionId,
            userId: connection.userId
          }
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found or access denied' });
          return;
        }

        // Join room
        socket.join(`session:${sessionId}`);
        connection.sessionId = sessionId;

        // Track session rooms
        if (!this.sessionRooms.has(sessionId)) {
          this.sessionRooms.set(sessionId, new Set());
        }
        this.sessionRooms.get(sessionId)!.add(connection.id);

        // Update stats
        this.stats.roomCounts[sessionId] = this.sessionRooms.get(sessionId)!.size;

        socket.emit('sessionJoined', { sessionId });

        // Notify others in the session
        socket.to(`session:${sessionId}`).emit('userJoined', {
          userId: connection.userId,
          user: socket.data.user,
          timestamp: new Date().toISOString()
        });

        logger.debug('User joined session room', {
          connectionId: connection.id,
          userId: connection.userId,
          sessionId
        });
      } catch (error) {
        logger.error('Failed to join session', {
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error)
        });
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Leave session room
    socket.on('leaveSession', (data: { sessionId: string }) => {
      this.handleLeaveSession(socket, connection, data.sessionId);
    });

    // Chat message
    socket.on('chatMessage', async (data: {
      sessionId: string;
      message: string;
      characterId?: string;
      metadata?: Record<string, any>;
    }) => {
      try {
        const messageId = uuidv4();
        const timestamp = new Date();

        const wsMessage: WebSocketMessage = {
          id: messageId,
          type: 'chat',
          data: {
            message: data.message,
            characterId: data.characterId,
            metadata: data.metadata
          },
          timestamp,
          userId: connection.userId,
          sessionId: data.sessionId
        };

        // Store message in database
        await prisma.message.create({
          data: {
            id: messageId,
            content: data.message,
            userId: connection.userId,
            characterId: data.characterId,
            sessionId: data.sessionId,
            metadata: data.metadata || {}
          }
        });

        // Broadcast to session room
        this.io.to(`session:${data.sessionId}`).emit('chatMessage', wsMessage);

        this.stats.messagesReceived++;
        this.stats.messagesSent += this.getSessionRoomSize(data.sessionId);

        connection.lastActivity = timestamp;

        logger.debug('Chat message processed', {
          messageId,
          userId: connection.userId,
          sessionId: data.sessionId
        });
      } catch (error) {
        logger.error('Failed to process chat message', {
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error)
        });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
      socket.to(`session:${data.sessionId}`).emit('userTyping', {
        userId: connection.userId,
        user: socket.data.user,
        isTyping: data.isTyping,
        timestamp: new Date().toISOString()
      });

      connection.lastActivity = new Date();
    });

    // Status update
    socket.on('statusUpdate', (data: { status: string; metadata?: Record<string, any> }) => {
      // Broadcast status to all user's connections
      this.broadcastToUser(connection.userId, 'statusUpdate', {
        userId: connection.userId,
        status: data.status,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      });

      connection.lastActivity = new Date();
    });

    // Heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
      connection.lastActivity = new Date();
    });

    // Disconnect handler
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, connection, reason);
    });

    // Error handler
    socket.on('error', (error: Error) => {
      logger.error('WebSocket error', {
        connectionId: connection.id,
        socketId: socket.id,
        error: error.message
      });
    });
  }

  /**
   * Handle session leave
   */
  private handleLeaveSession(socket: Socket, connection: WebSocketConnection, sessionId: string): void {
    socket.leave(`session:${sessionId}`);

    if (connection.sessionId === sessionId) {
      connection.sessionId = undefined;
    }

    // Update session rooms tracking
    if (this.sessionRooms.has(sessionId)) {
      this.sessionRooms.get(sessionId)!.delete(connection.id);
      if (this.sessionRooms.get(sessionId)!.size === 0) {
        this.sessionRooms.delete(sessionId);
        delete this.stats.roomCounts[sessionId];
      } else {
        this.stats.roomCounts[sessionId] = this.sessionRooms.get(sessionId)!.size;
      }
    }

    // Notify others in the session
    socket.to(`session:${sessionId}`).emit('userLeft', {
      userId: connection.userId,
      user: socket.data.user,
      timestamp: new Date().toISOString()
    });

    socket.emit('sessionLeft', { sessionId });

    logger.debug('User left session room', {
      connectionId: connection.id,
      userId: connection.userId,
      sessionId
    });
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(socket: Socket, connection: WebSocketConnection, reason: string): void {
    // Clean up session rooms
    if (connection.sessionId) {
      this.handleLeaveSession(socket, connection, connection.sessionId);
    }

    // Remove from connections
    this.connections.delete(connection.id);
    this.stats.activeConnections--;

    // Remove from user connections
    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connection.id);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    logger.info('WebSocket connection closed', {
      connectionId: connection.id,
      userId: connection.userId,
      socketId: socket.id,
      reason,
      duration: Date.now() - connection.connectedAt.getTime()
    });
  }

  /**
   * Handle SSE message integration
   */
  private handleSSEMessage(message: StreamingMessage): void {
    // Convert SSE message to WebSocket format and broadcast
    if (message.type === 'data' && message.data?.sessionId) {
      this.io.to(`session:${message.data.sessionId}`).emit('sseMessage', {
        id: message.id,
        type: message.type,
        data: message.data,
        timestamp: message.timestamp
      });
    }
  }

  /**
   * Broadcast message to all user connections
   */
  public broadcastToUser(userId: string, event: string, data: any): number {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return 0;

    let sentCount = 0;
    for (const connectionId of userConnections) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.socket.connected) {
        connection.socket.emit(event, data);
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to session room
   */
  public broadcastToSession(sessionId: string, event: string, data: any): number {
    const room = this.io.sockets.adapter.rooms.get(`session:${sessionId}`);
    if (!room) return 0;

    this.io.to(`session:${sessionId}`).emit(event, data);
    return room.size;
  }

  /**
   * Get connection statistics
   */
  public getStats(): WebSocketStats {
    return { ...this.stats };
  }

  /**
   * Get active connections
   */
  public getActiveConnections(): {
    total: number;
    byUser: Record<string, number>;
    bySessions: Record<string, number>;
  } {
    const byUser: Record<string, number> = {};
    const bySessions: Record<string, number> = {};

    for (const [userId, connectionIds] of this.userConnections.entries()) {
      byUser[userId] = connectionIds.size;
    }

    for (const [sessionId, connectionIds] of this.sessionRooms.entries()) {
      bySessions[sessionId] = connectionIds.size;
    }

    return {
      total: this.connections.size,
      byUser,
      bySessions
    };
  }

  /**
   * Get session room size
   */
  private getSessionRoomSize(sessionId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`session:${sessionId}`);
    return room ? room.size : 0;
  }

  /**
   * Close connection
   */
  public closeConnection(connectionId: string, reason: string = 'Server request'): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    connection.socket.emit('forceDisconnect', { reason });
    connection.socket.disconnect(true);

    return true;
  }

  /**
   * Cleanup inactive connections
   */
  public cleanup(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    let cleanedCount = 0;

    for (const [connectionId, connection] of this.connections.entries()) {
      if (!connection.socket.connected ||
          now - connection.lastActivity.getTime() > timeout) {
        this.closeConnection(connectionId, 'Cleanup: Inactive connection');
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up inactive WebSocket connections', { count: cleanedCount });
    }
  }

  /**
   * Shutdown the WebSocket service
   */
  public shutdown(): void {
    logger.info('Shutting down WebSocket service');

    // Close all connections
    for (const connection of this.connections.values()) {
      connection.socket.emit('serverShutdown', {
        message: 'Server is shutting down'
      });
      connection.socket.disconnect(true);
    }

    this.io.close();
  }
}

// Export singleton instance (will be initialized when server starts)
export let webSocketService: WebSocketService;

export function initializeWebSocketService(httpServer: HttpServer): WebSocketService {
  webSocketService = new WebSocketService(httpServer);
  return webSocketService;
}