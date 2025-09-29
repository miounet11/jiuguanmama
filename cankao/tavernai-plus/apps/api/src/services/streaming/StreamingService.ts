import { EventEmitter } from 'events';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../database';
import { logger } from '../../utils/logger';

export interface StreamingConnection {
  id: string;
  userId: string;
  sessionId?: string;
  response: Response;
  isActive: boolean;
  createdAt: Date;
  lastHeartbeat: Date;
  metadata?: Record<string, any>;
}

export interface StreamingMessage {
  id: string;
  type: 'data' | 'heartbeat' | 'error' | 'complete';
  data?: any;
  timestamp: Date;
  connectionId: string;
}

export interface StreamingStats {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  averageResponseTime: number;
  errorRate: number;
}

export class StreamingService extends EventEmitter {
  private connections: Map<string, StreamingConnection> = new Map();
  private heartbeatInterval: NodeJS.Timer | null = null;
  private cleanupInterval: NodeJS.Timer | null = null;
  private stats: StreamingStats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    averageResponseTime: 0,
    errorRate: 0
  };

  constructor() {
    super();
    this.startHeartbeat();
    this.startCleanup();
  }

  /**
   * Create a new SSE connection
   */
  public createConnection(
    userId: string,
    response: Response,
    sessionId?: string,
    metadata?: Record<string, any>
  ): string {
    const connectionId = uuidv4();

    // Configure SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const connection: StreamingConnection = {
      id: connectionId,
      userId,
      sessionId,
      response,
      isActive: true,
      createdAt: new Date(),
      lastHeartbeat: new Date(),
      metadata
    };

    this.connections.set(connectionId, connection);
    this.stats.totalConnections++;
    this.stats.activeConnections++;

    // Handle client disconnect
    response.on('close', () => {
      this.closeConnection(connectionId);
    });

    response.on('error', (error) => {
      logger.error('SSE connection error:', { connectionId, error: error.message });
      this.closeConnection(connectionId);
    });

    // Send initial connection message
    this.sendMessage(connectionId, {
      type: 'data',
      data: { status: 'connected', connectionId }
    });

    this.emit('connectionCreated', connection);

    logger.info('SSE connection created', {
      connectionId,
      userId,
      sessionId,
      totalConnections: this.stats.totalConnections
    });

    return connectionId;
  }

  /**
   * Send message to specific connection
   */
  public sendMessage(
    connectionId: string,
    message: Partial<StreamingMessage>
  ): boolean {
    const connection = this.connections.get(connectionId);

    if (!connection || !connection.isActive) {
      logger.warn('Attempt to send message to inactive connection', { connectionId });
      return false;
    }

    try {
      const fullMessage: StreamingMessage = {
        id: uuidv4(),
        type: message.type || 'data',
        data: message.data,
        timestamp: new Date(),
        connectionId
      };

      const sseData = this.formatSSEMessage(fullMessage);
      connection.response.write(sseData);

      this.stats.messagesSent++;
      this.emit('messageSent', fullMessage);

      logger.debug('Message sent to SSE connection', {
        connectionId,
        messageType: fullMessage.type,
        messageId: fullMessage.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to send SSE message', {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });

      this.stats.errorRate++;
      this.closeConnection(connectionId);
      return false;
    }
  }

  /**
   * Broadcast message to all connections for a user
   */
  public broadcastToUser(userId: string, message: Partial<StreamingMessage>): number {
    let sentCount = 0;

    for (const connection of this.connections.values()) {
      if (connection.userId === userId && connection.isActive) {
        if (this.sendMessage(connection.id, message)) {
          sentCount++;
        }
      }
    }

    logger.debug('Broadcast message to user', { userId, sentCount });
    return sentCount;
  }

  /**
   * Broadcast message to all connections in a session
   */
  public broadcastToSession(sessionId: string, message: Partial<StreamingMessage>): number {
    let sentCount = 0;

    for (const connection of this.connections.values()) {
      if (connection.sessionId === sessionId && connection.isActive) {
        if (this.sendMessage(connection.id, message)) {
          sentCount++;
        }
      }
    }

    logger.debug('Broadcast message to session', { sessionId, sentCount });
    return sentCount;
  }

  /**
   * Close specific connection
   */
  public closeConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return false;
    }

    try {
      if (connection.isActive) {
        // Send final message
        this.sendMessage(connectionId, {
          type: 'complete',
          data: { status: 'disconnected' }
        });

        connection.response.end();
        connection.isActive = false;
        this.stats.activeConnections--;
      }

      this.connections.delete(connectionId);
      this.emit('connectionClosed', connection);

      logger.info('SSE connection closed', {
        connectionId,
        userId: connection.userId,
        duration: Date.now() - connection.createdAt.getTime()
      });

      return true;
    } catch (error) {
      logger.error('Error closing SSE connection', {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get connection by ID
   */
  public getConnection(connectionId: string): StreamingConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections for a user
   */
  public getUserConnections(userId: string): StreamingConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId === userId && conn.isActive);
  }

  /**
   * Get all connections for a session
   */
  public getSessionConnections(sessionId: string): StreamingConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.sessionId === sessionId && conn.isActive);
  }

  /**
   * Get streaming statistics
   */
  public getStats(): StreamingStats {
    return { ...this.stats };
  }

  /**
   * Get detailed connection status
   */
  public getConnectionStatus(): {
    total: number;
    active: number;
    byUser: Record<string, number>;
    bySession: Record<string, number>;
  } {
    const byUser: Record<string, number> = {};
    const bySession: Record<string, number> = {};

    for (const connection of this.connections.values()) {
      if (connection.isActive) {
        byUser[connection.userId] = (byUser[connection.userId] || 0) + 1;

        if (connection.sessionId) {
          bySession[connection.sessionId] = (bySession[connection.sessionId] || 0) + 1;
        }
      }
    }

    return {
      total: this.connections.size,
      active: this.stats.activeConnections,
      byUser,
      bySession
    };
  }

  /**
   * Handle streaming interruption
   */
  public interruptStreaming(
    connectionId: string,
    reason: string = 'User requested'
  ): boolean {
    const connection = this.connections.get(connectionId);

    if (!connection || !connection.isActive) {
      return false;
    }

    this.sendMessage(connectionId, {
      type: 'error',
      data: {
        error: 'Streaming interrupted',
        reason,
        code: 'STREAMING_INTERRUPTED'
      }
    });

    this.emit('streamingInterrupted', { connectionId, reason });

    logger.info('Streaming interrupted', { connectionId, reason });
    return true;
  }

  /**
   * Cleanup inactive connections
   */
  public cleanup(): void {
    const now = new Date();
    const timeout = 30000; // 30 seconds timeout
    let cleanedCount = 0;

    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.isActive &&
          now.getTime() - connection.lastHeartbeat.getTime() > timeout) {
        this.closeConnection(connectionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up inactive connections', { count: cleanedCount });
    }
  }

  /**
   * Shutdown the streaming service
   */
  public shutdown(): void {
    logger.info('Shutting down streaming service');

    // Stop intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all connections
    for (const connectionId of this.connections.keys()) {
      this.closeConnection(connectionId);
    }

    this.removeAllListeners();
  }

  /**
   * Format message for SSE transmission
   */
  private formatSSEMessage(message: StreamingMessage): string {
    const data = JSON.stringify({
      id: message.id,
      type: message.type,
      data: message.data,
      timestamp: message.timestamp.toISOString()
    });

    return `id: ${message.id}\ndata: ${data}\n\n`;
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const connection of this.connections.values()) {
        if (connection.isActive) {
          this.sendMessage(connection.id, {
            type: 'heartbeat',
            data: { timestamp: new Date().toISOString() }
          });
          connection.lastHeartbeat = new Date();
        }
      }
    }, 15000); // Every 15 seconds
  }

  /**
   * Start cleanup mechanism
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }
}

// Singleton instance
export const streamingService = new StreamingService();

// Graceful shutdown
process.on('SIGTERM', () => {
  streamingService.shutdown();
});

process.on('SIGINT', () => {
  streamingService.shutdown();
});