"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamingSessionService = exports.StreamingSessionService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const StreamingService_1 = require("./StreamingService");
class StreamingSessionService {
    /**
     * Create a new streaming session
     */
    async createSession(userId, title, characterId, metadata = {}) {
        try {
            const sessionId = (0, uuid_1.v4)();
            const now = new Date();
            const session = await database_1.prisma.streamingSession.create({
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
            logger_1.logger.info('Streaming session created', {
                sessionId,
                userId,
                characterId,
                title
            });
            return this.mapPrismaSession(session);
        }
        catch (error) {
            logger_1.logger.error('Failed to create streaming session', {
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
    async getSession(sessionId) {
        try {
            const session = await database_1.prisma.streamingSession.findUnique({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get streaming session', {
                sessionId,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    /**
     * Update session status and metadata
     */
    async updateSession(sessionId, updates) {
        try {
            const session = await database_1.prisma.streamingSession.update({
                where: { id: sessionId },
                data: {
                    ...updates,
                    updatedAt: new Date(),
                    lastActivityAt: new Date()
                }
            });
            logger_1.logger.debug('Streaming session updated', {
                sessionId,
                updates
            });
            // Notify connected clients
            StreamingService_1.streamingService.broadcastToSession(sessionId, {
                type: 'data',
                data: {
                    event: 'sessionUpdated',
                    session: this.mapPrismaSession(session)
                }
            });
            return this.mapPrismaSession(session);
        }
        catch (error) {
            logger_1.logger.error('Failed to update streaming session', {
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
    async getSessions(filter = {}) {
        try {
            const { userId, characterId, status, createdAfter, createdBefore, search, limit = 20, offset = 0, sortBy = 'lastActivityAt', sortOrder = 'desc' } = filter;
            const where = {};
            if (userId)
                where.userId = userId;
            if (characterId)
                where.characterId = characterId;
            if (status && status.length > 0)
                where.status = { in: status };
            if (createdAfter || createdBefore) {
                where.createdAt = {};
                if (createdAfter)
                    where.createdAt.gte = createdAfter;
                if (createdBefore)
                    where.createdAt.lte = createdBefore;
            }
            if (search) {
                where.title = {
                    contains: search,
                    mode: 'insensitive'
                };
            }
            const [sessions, total] = await Promise.all([
                database_1.prisma.streamingSession.findMany({
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
                database_1.prisma.streamingSession.count({ where })
            ]);
            return {
                sessions: sessions.map(session => this.mapPrismaSession(session)),
                total,
                hasMore: offset + sessions.length < total
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get streaming sessions', {
                filter,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to get streaming sessions');
        }
    }
    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        try {
            await database_1.prisma.streamingSession.delete({
                where: { id: sessionId }
            });
            // Close any active connections for this session
            const connections = StreamingService_1.streamingService.getSessionConnections(sessionId);
            for (const connection of connections) {
                StreamingService_1.streamingService.closeConnection(connection.id);
            }
            logger_1.logger.info('Streaming session deleted', { sessionId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete streaming session', {
                sessionId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Batch update sessions
     */
    async batchUpdateSessions(sessionIds, updates) {
        try {
            const result = await database_1.prisma.streamingSession.updateMany({
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
                StreamingService_1.streamingService.broadcastToSession(sessionId, {
                    type: 'data',
                    data: {
                        event: 'sessionUpdated',
                        updates
                    }
                });
            }
            logger_1.logger.info('Batch updated streaming sessions', {
                count: result.count,
                sessionIds: sessionIds.length,
                updates
            });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Failed to batch update streaming sessions', {
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
    async getStats(userId) {
        try {
            const where = userId ? { userId } : {};
            const [totalSessions, activeSessions, completedSessions, aggregates] = await Promise.all([
                database_1.prisma.streamingSession.count({ where }),
                database_1.prisma.streamingSession.count({
                    where: { ...where, status: 'active' }
                }),
                database_1.prisma.streamingSession.count({
                    where: { ...where, status: 'completed' }
                }),
                database_1.prisma.streamingSession.aggregate({
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
            const sessions = await database_1.prisma.streamingSession.findMany({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get session statistics', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to get session statistics');
        }
    }
    /**
     * Cleanup old sessions
     */
    async cleanupOldSessions(maxAge = 30 * 24 * 60 * 60 * 1000) {
        try {
            const cutoffDate = new Date(Date.now() - maxAge);
            const result = await database_1.prisma.streamingSession.deleteMany({
                where: {
                    status: { in: ['completed', 'error'] },
                    updatedAt: { lt: cutoffDate }
                }
            });
            logger_1.logger.info('Cleaned up old streaming sessions', {
                count: result.count,
                cutoffDate
            });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old sessions', {
                maxAge,
                error: error instanceof Error ? error.message : String(error)
            });
            return 0;
        }
    }
    /**
     * Get active sessions for monitoring
     */
    async getActiveSessions() {
        try {
            const sessions = await database_1.prisma.streamingSession.findMany({
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
            const connectionCounts = {};
            for (const session of sessions) {
                const connections = StreamingService_1.streamingService.getSessionConnections(session.id);
                connectionCounts[session.id] = connections.length;
            }
            return {
                sessions: sessions.map(session => this.mapPrismaSession(session)),
                connectionCounts
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get active sessions', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to get active sessions');
        }
    }
    /**
     * Update session activity timestamp
     */
    async updateActivityTimestamp(sessionId) {
        try {
            await database_1.prisma.streamingSession.update({
                where: { id: sessionId },
                data: { lastActivityAt: new Date() }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update session activity timestamp', {
                sessionId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * Increment session counters
     */
    async incrementCounters(sessionId, messageCount = 0, tokenCount = 0, cost = 0) {
        try {
            await database_1.prisma.streamingSession.update({
                where: { id: sessionId },
                data: {
                    messageCount: { increment: messageCount },
                    tokenCount: { increment: tokenCount },
                    estimatedCost: { increment: cost },
                    lastActivityAt: new Date()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to increment session counters', {
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
    mapPrismaSession(session) {
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
exports.StreamingSessionService = StreamingSessionService;
// Singleton instance
exports.streamingSessionService = new StreamingSessionService();
//# sourceMappingURL=StreamingSessionService.js.map