import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../database';
import { logger } from '../../utils/logger';
import { streamingService } from './StreamingService';

export interface StreamingSession {
  id: string;
  userId: string;
  characterId?: string;
  title: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  messageCount: number;
  tokenCount: number;
  estimatedCost: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalMessages: number;
  totalTokens: number;
  averageSessionDuration: number;
  totalCost: number;
}

export interface SessionFilter {
  userId?: string;
  characterId?: string;
  status?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
}

export class StreamingSessionService {
  /**
   * Create a new streaming session
   */
  public async createSession(
    userId: string,
    title: string,
    characterId?: string,
    metadata: Record<string, any> = {}
  ): Promise<StreamingSession> {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const session = await prisma.streamingSession.create({
        data: {
          id: sessionId,
          userId,
          characterId,
          title,
          status: 'active',
          metadata,
          createdAt: now,
          updatedAt: now,
          lastActivityAt: now,
          messageCount: 0,
          tokenCount: 0,
          estimatedCost: 0
        }
      });

      logger.info('Streaming session created', {
        sessionId,
        userId,
        characterId,
        title
      });

      return this.mapPrismaSession(session);
    } catch (error) {
      logger.error('Failed to create streaming session', {
        userId,
        title,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to create streaming session');
    }
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<StreamingSession | null> {
    try {
      const session = await prisma.streamingSession.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          character: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      return session ? this.mapPrismaSession(session) : null;
    } catch (error) {
      logger.error('Failed to get streaming session', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Update session status and metadata
   */
  public async updateSession(
    sessionId: string,
    updates: {
      status?: 'active' | 'paused' | 'completed' | 'error';
      title?: string;
      metadata?: Record<string, any>;
      messageCount?: number;
      tokenCount?: number;
      estimatedCost?: number;
    }
  ): Promise<StreamingSession | null> {
    try {
      const session = await prisma.streamingSession.update({
        where: { id: sessionId },
        data: {
          ...updates,
          updatedAt: new Date(),
          lastActivityAt: new Date()
        }
      });

      logger.debug('Streaming session updated', {
        sessionId,
        updates
      });

      // Notify connected clients
      streamingService.broadcastToSession(sessionId, {
        type: 'data',
        data: {
          event: 'sessionUpdated',
          session: this.mapPrismaSession(session)
        }
      });

      return this.mapPrismaSession(session);
    } catch (error) {
      logger.error('Failed to update streaming session', {
        sessionId,
        updates,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Get sessions with filtering and pagination
   */
  public async getSessions(filter: SessionFilter = {}): Promise<{
    sessions: StreamingSession[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        userId,
        characterId,
        status,
        createdAfter,
        createdBefore,
        search,
        limit = 20,
        offset = 0,
        sortBy = 'lastActivityAt',
        sortOrder = 'desc'
      } = filter;

      const where: any = {};

      if (userId) where.userId = userId;
      if (characterId) where.characterId = characterId;
      if (status && status.length > 0) where.status = { in: status };
      if (createdAfter || createdBefore) {
        where.createdAt = {};
        if (createdAfter) where.createdAt.gte = createdAfter;
        if (createdBefore) where.createdAt.lte = createdBefore;
      }
      if (search) {
        where.title = {
          contains: search,
          mode: 'insensitive'
        };
      }

      const [sessions, total] = await Promise.all([
        prisma.streamingSession.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            },
            character: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }),
        prisma.streamingSession.count({ where })
      ]);

      return {
        sessions: sessions.map(session => this.mapPrismaSession(session)),
        total,
        hasMore: offset + sessions.length < total
      };
    } catch (error) {
      logger.error('Failed to get streaming sessions', {
        filter,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to get streaming sessions');
    }
  }

  /**
   * Delete session
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await prisma.streamingSession.delete({
        where: { id: sessionId }
      });

      // Close any active connections for this session
      const connections = streamingService.getSessionConnections(sessionId);
      for (const connection of connections) {
        streamingService.closeConnection(connection.id);
      }

      logger.info('Streaming session deleted', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to delete streaming session', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Batch update sessions
   */
  public async batchUpdateSessions(
    sessionIds: string[],
    updates: {
      status?: 'active' | 'paused' | 'completed' | 'error';
      metadata?: Record<string, any>;
    }
  ): Promise<number> {
    try {
      const result = await prisma.streamingSession.updateMany({
        where: {
          id: { in: sessionIds }
        },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      // Notify all affected sessions
      for (const sessionId of sessionIds) {
        streamingService.broadcastToSession(sessionId, {
          type: 'data',
          data: {
            event: 'sessionUpdated',
            updates
          }
        });
      }

      logger.info('Batch updated streaming sessions', {
        count: result.count,
        sessionIds: sessionIds.length,
        updates
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to batch update streaming sessions', {
        sessionIds,
        updates,
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  public async getStats(userId?: string): Promise<SessionStats> {
    try {
      const where = userId ? { userId } : {};

      const [
        totalSessions,
        activeSessions,
        completedSessions,
        aggregates
      ] = await Promise.all([
        prisma.streamingSession.count({ where }),
        prisma.streamingSession.count({
          where: { ...where, status: 'active' }
        }),
        prisma.streamingSession.count({
          where: { ...where, status: 'completed' }
        }),
        prisma.streamingSession.aggregate({
          where,
          _sum: {
            messageCount: true,
            tokenCount: true,
            estimatedCost: true
          },
          _avg: {
            messageCount: true,
            tokenCount: true,
            estimatedCost: true
          }
        })
      ]);

      // Calculate average session duration
      const sessions = await prisma.streamingSession.findMany({
        where: { ...where, status: 'completed' },
        select: {
          createdAt: true,
          updatedAt: true
        }
      });

      const totalDuration = sessions.reduce((sum, session) => {
        return sum + (session.updatedAt.getTime() - session.createdAt.getTime());
      }, 0);

      const averageSessionDuration = sessions.length > 0
        ? totalDuration / sessions.length
        : 0;

      return {
        totalSessions,
        activeSessions,
        completedSessions,
        totalMessages: aggregates._sum.messageCount || 0,
        totalTokens: aggregates._sum.tokenCount || 0,
        averageSessionDuration,
        totalCost: aggregates._sum.estimatedCost || 0
      };
    } catch (error) {
      logger.error('Failed to get session statistics', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to get session statistics');
    }
  }

  /**
   * Cleanup old sessions
   */
  public async cleanupOldSessions(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);

      const result = await prisma.streamingSession.deleteMany({
        where: {
          status: { in: ['completed', 'error'] },
          updatedAt: { lt: cutoffDate }
        }
      });

      logger.info('Cleaned up old streaming sessions', {
        count: result.count,
        cutoffDate
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old sessions', {
        maxAge,
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Get active sessions for monitoring
   */
  public async getActiveSessions(): Promise<{
    sessions: StreamingSession[];
    connectionCounts: Record<string, number>;
  }> {
    try {
      const sessions = await prisma.streamingSession.findMany({
        where: { status: 'active' },
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          },
          character: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      const connectionCounts: Record<string, number> = {};
      for (const session of sessions) {
        const connections = streamingService.getSessionConnections(session.id);
        connectionCounts[session.id] = connections.length;
      }

      return {
        sessions: sessions.map(session => this.mapPrismaSession(session)),
        connectionCounts
      };
    } catch (error) {
      logger.error('Failed to get active sessions', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to get active sessions');
    }
  }

  /**
   * Update session activity timestamp
   */
  public async updateActivityTimestamp(sessionId: string): Promise<void> {
    try {
      await prisma.streamingSession.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() }
      });
    } catch (error) {
      logger.error('Failed to update session activity timestamp', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Increment session counters
   */
  public async incrementCounters(
    sessionId: string,
    messageCount: number = 0,
    tokenCount: number = 0,
    cost: number = 0
  ): Promise<void> {
    try {
      await prisma.streamingSession.update({
        where: { id: sessionId },
        data: {
          messageCount: { increment: messageCount },
          tokenCount: { increment: tokenCount },
          estimatedCost: { increment: cost },
          lastActivityAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to increment session counters', {
        sessionId,
        messageCount,
        tokenCount,
        cost,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Map Prisma session to service interface
   */
  private mapPrismaSession(session: any): StreamingSession {
    return {
      id: session.id,
      userId: session.userId,
      characterId: session.characterId,
      title: session.title,
      status: session.status,
      metadata: session.metadata || {},
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastActivityAt: session.lastActivityAt,
      messageCount: session.messageCount,
      tokenCount: session.tokenCount,
      estimatedCost: session.estimatedCost
    };
  }
}

// Singleton instance
export const streamingSessionService = new StreamingSessionService();