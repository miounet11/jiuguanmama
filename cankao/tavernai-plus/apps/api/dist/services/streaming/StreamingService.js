"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamingService = exports.StreamingService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
class StreamingService extends events_1.EventEmitter {
    connections = new Map();
    heartbeatInterval = null;
    cleanupInterval = null;
    stats = {
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
    createConnection(userId, response, sessionId, metadata) {
        const connectionId = (0, uuid_1.v4)();
        // Configure SSE headers
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });
        const connection = {
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
            logger_1.logger.error('SSE connection error:', { connectionId, error: error.message });
            this.closeConnection(connectionId);
        });
        // Send initial connection message
        this.sendMessage(connectionId, {
            type: 'data',
            data: { status: 'connected', connectionId }
        });
        this.emit('connectionCreated', connection);
        logger_1.logger.info('SSE connection created', {
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
    sendMessage(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection || !connection.isActive) {
            logger_1.logger.warn('Attempt to send message to inactive connection', { connectionId });
            return false;
        }
        try {
            const fullMessage = {
                id: (0, uuid_1.v4)(),
                type: message.type || 'data',
                data: message.data,
                timestamp: new Date(),
                connectionId
            };
            const sseData = this.formatSSEMessage(fullMessage);
            connection.response.write(sseData);
            this.stats.messagesSent++;
            this.emit('messageSent', fullMessage);
            logger_1.logger.debug('Message sent to SSE connection', {
                connectionId,
                messageType: fullMessage.type,
                messageId: fullMessage.id
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send SSE message', {
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
    broadcastToUser(userId, message) {
        let sentCount = 0;
        for (const connection of this.connections.values()) {
            if (connection.userId === userId && connection.isActive) {
                if (this.sendMessage(connection.id, message)) {
                    sentCount++;
                }
            }
        }
        logger_1.logger.debug('Broadcast message to user', { userId, sentCount });
        return sentCount;
    }
    /**
     * Broadcast message to all connections in a session
     */
    broadcastToSession(sessionId, message) {
        let sentCount = 0;
        for (const connection of this.connections.values()) {
            if (connection.sessionId === sessionId && connection.isActive) {
                if (this.sendMessage(connection.id, message)) {
                    sentCount++;
                }
            }
        }
        logger_1.logger.debug('Broadcast message to session', { sessionId, sentCount });
        return sentCount;
    }
    /**
     * Close specific connection
     */
    closeConnection(connectionId) {
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
            logger_1.logger.info('SSE connection closed', {
                connectionId,
                userId: connection.userId,
                duration: Date.now() - connection.createdAt.getTime()
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error closing SSE connection', {
                connectionId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Get connection by ID
     */
    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }
    /**
     * Get all connections for a user
     */
    getUserConnections(userId) {
        return Array.from(this.connections.values())
            .filter(conn => conn.userId === userId && conn.isActive);
    }
    /**
     * Get all connections for a session
     */
    getSessionConnections(sessionId) {
        return Array.from(this.connections.values())
            .filter(conn => conn.sessionId === sessionId && conn.isActive);
    }
    /**
     * Get streaming statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get detailed connection status
     */
    getConnectionStatus() {
        const byUser = {};
        const bySession = {};
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
    interruptStreaming(connectionId, reason = 'User requested') {
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
        logger_1.logger.info('Streaming interrupted', { connectionId, reason });
        return true;
    }
    /**
     * Cleanup inactive connections
     */
    cleanup() {
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
            logger_1.logger.info('Cleaned up inactive connections', { count: cleanedCount });
        }
    }
    /**
     * Shutdown the streaming service
     */
    shutdown() {
        logger_1.logger.info('Shutting down streaming service');
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
    formatSSEMessage(message) {
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
    startHeartbeat() {
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
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // Every minute
    }
}
exports.StreamingService = StreamingService;
// Singleton instance
exports.streamingService = new StreamingService();
// Graceful shutdown
process.on('SIGTERM', () => {
    exports.streamingService.shutdown();
});
process.on('SIGINT', () => {
    exports.streamingService.shutdown();
});
//# sourceMappingURL=StreamingService.js.map