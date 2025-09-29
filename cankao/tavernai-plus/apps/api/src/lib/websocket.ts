import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as HttpServer } from 'http';
import { getRedisClient } from './redis';
import { logger } from '../services/logger';
import jwt from 'jsonwebtoken';

interface SocketUser {
  id: string;
  username: string;
  avatar?: string;
  role: string;
}

interface SocketSession {
  userId: string;
  sessionId: string;
  joinedAt: Date;
  lastActivity: Date;
}

interface RoomInfo {
  name: string;
  type: 'chat' | 'session' | 'extension' | 'admin';
  participants: Set<string>;
  createdAt: Date;
  metadata?: Record<string, any>;
}

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private activeSessions = new Map<string, SocketSession>();
  private userSockets = new Map<string, Set<string>>();
  private rooms = new Map<string, RoomInfo>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server with enhanced features
   */
  async initialize(httpServer: HttpServer): Promise<SocketIOServer> {
    try {
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.CLIENT_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'],
        allowEIO3: true,
      });

      // Setup Redis adapter for clustering
      await this.setupRedisAdapter();

      // Setup authentication middleware
      this.setupAuthentication();

      // Setup connection handlers
      this.setupConnectionHandlers();

      // Setup periodic cleanup
      this.setupHeartbeat();

      logger.info('WebSocket server initialized with enhanced features');
      return this.io;

    } catch (error) {
      logger.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Setup Redis adapter for horizontal scaling
   */
  private async setupRedisAdapter(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      if (redisClient && this.io) {
        // Create Redis adapter for Socket.IO clustering
        const pubClient = redisClient.duplicate();
        const subClient = redisClient.duplicate();

        const adapter = createAdapter(pubClient, subClient);
        this.io.adapter(adapter);

        logger.info('Redis adapter configured for Socket.IO clustering');
      }
    } catch (error) {
      logger.warn('Failed to setup Redis adapter, continuing without clustering:', error);
    }
  }

  /**
   * Setup authentication middleware
   */
  private setupAuthentication(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

        if (!token) {
          // Allow anonymous connections for public features
          socket.data.user = null;
          return next();
        }

        // Verify JWT token
        const decoded = jwt.verify(
          token.replace('Bearer ', ''),
          process.env.JWT_SECRET || 'your-secret-key'
        ) as any;

        // Store user data in socket
        socket.data.user = {
          id: decoded.userId,
          username: decoded.username,
          avatar: decoded.avatar,
          role: decoded.role,
        } as SocketUser;

        logger.debug(`Socket authenticated for user: ${decoded.username}`);
        next();

      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    const user = socket.data.user as SocketUser | null;

    logger.info(`Socket connected: ${socket.id}${user ? ` (user: ${user.username})` : ' (anonymous)'}`);

    // Track user connections
    if (user) {
      this.trackUserConnection(user.id, socket.id);
    }

    // Setup event handlers
    this.setupSocketEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  /**
   * Setup event handlers for a socket
   */
  private setupSocketEventHandlers(socket: Socket): void {
    const user = socket.data.user as SocketUser | null;

    // Chat session management
    socket.on('join_session', (data: { sessionId: string; metadata?: any }) => {
      this.handleJoinSession(socket, data.sessionId, data.metadata);
    });

    socket.on('leave_session', (sessionId: string) => {
      this.handleLeaveSession(socket, sessionId);
    });

    // Real-time messaging
    socket.on('send_message', (data: {
      sessionId: string;
      message: string;
      type?: string;
      metadata?: any;
    }) => {
      this.handleSendMessage(socket, data);
    });

    // User status updates
    socket.on('update_status', (status: string) => {
      this.handleStatusUpdate(socket, status);
    });

    // Extension communication
    socket.on('extension_event', (data: {
      extensionId: string;
      event: string;
      data: any;
    }) => {
      this.handleExtensionEvent(socket, data);
    });

    // Typing indicators
    socket.on('typing_start', (sessionId: string) => {
      this.handleTypingStart(socket, sessionId);
    });

    socket.on('typing_stop', (sessionId: string) => {
      this.handleTypingStop(socket, sessionId);
    });

    // Admin events (if user is admin)
    if (user?.role === 'admin') {
      socket.on('admin_broadcast', (data: { message: string; type: string }) => {
        this.handleAdminBroadcast(socket, data);
      });

      socket.on('admin_user_action', (data: {
        targetUserId: string;
        action: string;
        reason?: string;
      }) => {
        this.handleAdminUserAction(socket, data);
      });
    }

    // Heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  }

  /**
   * Handle joining a session
   */
  private handleJoinSession(socket: Socket, sessionId: string, metadata?: any): void {
    const user = socket.data.user as SocketUser | null;
    const roomName = `session:${sessionId}`;

    try {
      // Join the room
      socket.join(roomName);

      // Track session
      if (user) {
        this.activeSessions.set(socket.id, {
          userId: user.id,
          sessionId,
          joinedAt: new Date(),
          lastActivity: new Date(),
        });
      }

      // Update or create room info
      if (!this.rooms.has(roomName)) {
        this.rooms.set(roomName, {
          name: roomName,
          type: 'session',
          participants: new Set(),
          createdAt: new Date(),
          metadata,
        });
      }

      const room = this.rooms.get(roomName)!;
      room.participants.add(socket.id);

      // Notify other participants
      socket.to(roomName).emit('user_joined', {
        socketId: socket.id,
        user: user ? { id: user.id, username: user.username, avatar: user.avatar } : null,
        timestamp: new Date(),
      });

      // Send current room info to the new participant
      socket.emit('session_joined', {
        sessionId,
        participants: Array.from(room.participants).length,
        metadata: room.metadata,
      });

      logger.debug(`Socket ${socket.id} joined session ${sessionId}`);

    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  }

  /**
   * Handle leaving a session
   */
  private handleLeaveSession(socket: Socket, sessionId: string): void {
    const roomName = `session:${sessionId}`;

    try {
      socket.leave(roomName);

      // Remove from room participants
      const room = this.rooms.get(roomName);
      if (room) {
        room.participants.delete(socket.id);

        // Clean up empty rooms
        if (room.participants.size === 0) {
          this.rooms.delete(roomName);
        }
      }

      // Remove session tracking
      this.activeSessions.delete(socket.id);

      // Notify other participants
      socket.to(roomName).emit('user_left', {
        socketId: socket.id,
        timestamp: new Date(),
      });

      logger.debug(`Socket ${socket.id} left session ${sessionId}`);

    } catch (error) {
      logger.error('Error leaving session:', error);
    }
  }

  /**
   * Handle sending a message
   */
  private handleSendMessage(socket: Socket, data: {
    sessionId: string;
    message: string;
    type?: string;
    metadata?: any;
  }): void {
    const user = socket.data.user as SocketUser | null;
    const roomName = `session:${data.sessionId}`;

    try {
      // Update last activity
      const session = this.activeSessions.get(socket.id);
      if (session) {
        session.lastActivity = new Date();
      }

      // Prepare message data
      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: data.sessionId,
        message: data.message,
        type: data.type || 'text',
        sender: user ? {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        } : null,
        timestamp: new Date(),
        metadata: data.metadata,
      };

      // Broadcast to session participants
      this.io!.to(roomName).emit('new_message', messageData);

      logger.debug(`Message sent in session ${data.sessionId} by ${user?.username || 'anonymous'}`);

    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle status updates
   */
  private handleStatusUpdate(socket: Socket, status: string): void {
    const user = socket.data.user as SocketUser | null;

    if (!user) return;

    try {
      // Broadcast status to all user's sockets
      const userSockets = this.userSockets.get(user.id);
      if (userSockets) {
        userSockets.forEach(socketId => {
          this.io!.to(socketId).emit('user_status_updated', {
            userId: user.id,
            status,
            timestamp: new Date(),
          });
        });
      }

      logger.debug(`User ${user.username} status updated: ${status}`);

    } catch (error) {
      logger.error('Error updating status:', error);
    }
  }

  /**
   * Handle extension events
   */
  private handleExtensionEvent(socket: Socket, data: {
    extensionId: string;
    event: string;
    data: any;
  }): void {
    try {
      const roomName = `extension:${data.extensionId}`;

      // Broadcast to extension subscribers
      socket.to(roomName).emit('extension_event', {
        extensionId: data.extensionId,
        event: data.event,
        data: data.data,
        timestamp: new Date(),
      });

      logger.debug(`Extension event ${data.event} for ${data.extensionId}`);

    } catch (error) {
      logger.error('Error handling extension event:', error);
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingStart(socket: Socket, sessionId: string): void {
    const user = socket.data.user as SocketUser | null;
    const roomName = `session:${sessionId}`;

    socket.to(roomName).emit('user_typing', {
      user: user ? { id: user.id, username: user.username } : null,
      isTyping: true,
    });
  }

  private handleTypingStop(socket: Socket, sessionId: string): void {
    const user = socket.data.user as SocketUser | null;
    const roomName = `session:${sessionId}`;

    socket.to(roomName).emit('user_typing', {
      user: user ? { id: user.id, username: user.username } : null,
      isTyping: false,
    });
  }

  /**
   * Handle admin broadcasts
   */
  private handleAdminBroadcast(socket: Socket, data: { message: string; type: string }): void {
    const user = socket.data.user as SocketUser | null;

    if (!user || user.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      this.io!.emit('admin_announcement', {
        message: data.message,
        type: data.type,
        from: user.username,
        timestamp: new Date(),
      });

      logger.info(`Admin broadcast by ${user.username}: ${data.message}`);

    } catch (error) {
      logger.error('Error sending admin broadcast:', error);
    }
  }

  /**
   * Handle admin user actions
   */
  private handleAdminUserAction(socket: Socket, data: {
    targetUserId: string;
    action: string;
    reason?: string;
  }): void {
    const admin = socket.data.user as SocketUser | null;

    if (!admin || admin.role !== 'admin') {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Get target user's sockets
      const targetSockets = this.userSockets.get(data.targetUserId);

      if (targetSockets) {
        targetSockets.forEach(socketId => {
          this.io!.to(socketId).emit('admin_action', {
            action: data.action,
            reason: data.reason,
            by: admin.username,
            timestamp: new Date(),
          });

          // Disconnect if action is ban/kick
          if (data.action === 'ban' || data.action === 'kick') {
            this.io!.sockets.sockets.get(socketId)?.disconnect(true);
          }
        });
      }

      logger.info(`Admin action by ${admin.username}: ${data.action} on user ${data.targetUserId}`);

    } catch (error) {
      logger.error('Error handling admin action:', error);
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    const user = socket.data.user as SocketUser | null;

    logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})${user ? ` (user: ${user.username})` : ''}`);

    try {
      // Clean up user connections
      if (user) {
        this.cleanupUserConnection(user.id, socket.id);
      }

      // Clean up sessions
      this.activeSessions.delete(socket.id);

      // Clean up room participants
      this.rooms.forEach((room, roomName) => {
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);

          // Notify other participants
          socket.to(roomName).emit('user_left', {
            socketId: socket.id,
            timestamp: new Date(),
          });

          // Clean up empty rooms
          if (room.participants.size === 0) {
            this.rooms.delete(roomName);
          }
        }
      });

    } catch (error) {
      logger.error('Error handling disconnection:', error);
    }
  }

  /**
   * Track user connection
   */
  private trackUserConnection(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Clean up user connection
   */
  private cleanupUserConnection(userId: string, socketId: string): void {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Setup periodic heartbeat and cleanup
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Every minute
  }

  /**
   * Perform periodic cleanup
   */
  private performCleanup(): void {
    try {
      const now = new Date();
      const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

      // Clean up inactive sessions
      this.activeSessions.forEach((session, socketId) => {
        if (now.getTime() - session.lastActivity.getTime() > inactiveThreshold) {
          this.activeSessions.delete(socketId);
          logger.debug(`Cleaned up inactive session: ${socketId}`);
        }
      });

      // Log statistics
      logger.debug(`WebSocket stats: ${this.activeSessions.size} active sessions, ${this.rooms.size} rooms, ${this.userSockets.size} users`);

    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  /**
   * Get WebSocket server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any): boolean {
    try {
      const userSockets = this.userSockets.get(userId);
      if (userSockets && userSockets.size > 0) {
        userSockets.forEach(socketId => {
          this.io!.to(socketId).emit(event, data);
        });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error sending message to user:', error);
      return false;
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    try {
      this.io!.emit(event, data);
    } catch (error) {
      logger.error('Error broadcasting message:', error);
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    authenticatedUsers: number;
    activeSessions: number;
    activeRooms: number;
  } {
    return {
      totalConnections: this.io?.sockets.sockets.size || 0,
      authenticatedUsers: this.userSockets.size,
      activeSessions: this.activeSessions.size,
      activeRooms: this.rooms.size,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      if (this.io) {
        await new Promise<void>((resolve) => {
          this.io!.close(resolve);
        });
      }

      logger.info('WebSocket server shut down gracefully');
    } catch (error) {
      logger.error('Error during WebSocket shutdown:', error);
    }
  }
}

// Global WebSocket manager instance
let wsManager: WebSocketManager | null = null;

/**
 * Initialize WebSocket manager
 */
export const initializeWebSocket = async (httpServer: HttpServer): Promise<SocketIOServer> => {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return await wsManager.initialize(httpServer);
};

/**
 * Get WebSocket manager instance
 */
export const getWebSocketManager = (): WebSocketManager | null => {
  return wsManager;
};

/**
 * Get Socket.IO server instance
 */
export const getSocketIO = (): SocketIOServer | null => {
  return wsManager?.getIO() || null;
};

export default wsManager;