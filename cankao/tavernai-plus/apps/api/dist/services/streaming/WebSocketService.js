"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSocketService = exports.WebSocketService = void 0;
exports.initializeWebSocketService = initializeWebSocketService;
const socket_io_1 = require("socket.io");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../database");
const logger_1 = require("../../utils/logger");
const StreamingService_1 = require("./StreamingService");
class WebSocketService {
    io;
    connections = new Map();
    userConnections = new Map();
    sessionRooms = new Map();
    stats = {
        totalConnections: 0,
        activeConnections: 0,
        messagesSent: 0,
        messagesReceived: 0,
        roomCounts: {}
    };
    constructor(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
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
        StreamingService_1.streamingService.on('messageSent', (message) => {
            this.handleSSEMessage(message);
        });
        logger_1.logger.info('WebSocket service initialized');
    }
    /**
     * Setup Socket.IO middleware
     */
    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;
                if (!token) {
                    throw new Error('No authentication token provided');
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = await database_1.prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { id: true, username: true, email: true }
                });
                if (!user) {
                    throw new Error('User not found');
                }
                socket.data.userId = user.id;
                socket.data.user = user;
                next();
            }
            catch (error) {
                logger_1.logger.warn('WebSocket authentication failed', {
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
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    /**
     * Handle new WebSocket connection
     */
    handleConnection(socket) {
        const connectionId = (0, uuid_1.v4)();
        const userId = socket.data.userId;
        const now = new Date();
        const connection = {
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
        this.userConnections.get(userId).add(connectionId);
        // Store connection ID in socket data
        socket.data.connectionId = connectionId;
        logger_1.logger.info('WebSocket connection established', {
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
    setupSocketHandlers(socket, connection) {
        // Join session room
        socket.on('joinSession', async (data) => {
            try {
                const { sessionId } = data;
                // Verify session access
                const session = await database_1.prisma.streamingSession.findFirst({
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
                this.sessionRooms.get(sessionId).add(connection.id);
                // Update stats
                this.stats.roomCounts[sessionId] = this.sessionRooms.get(sessionId).size;
                socket.emit('sessionJoined', { sessionId });
                // Notify others in the session
                socket.to(`session:${sessionId}`).emit('userJoined', {
                    userId: connection.userId,
                    user: socket.data.user,
                    timestamp: new Date().toISOString()
                });
                logger_1.logger.debug('User joined session room', {
                    connectionId: connection.id,
                    userId: connection.userId,
                    sessionId
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to join session', {
                    connectionId: connection.id,
                    error: error instanceof Error ? error.message : String(error)
                });
                socket.emit('error', { message: 'Failed to join session' });
            }
        });
        // Leave session room
        socket.on('leaveSession', (data) => {
            this.handleLeaveSession(socket, connection, data.sessionId);
        });
        // Chat message
        socket.on('chatMessage', async (data) => {
            try {
                const messageId = (0, uuid_1.v4)();
                const timestamp = new Date();
                const wsMessage = {
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
                await database_1.prisma.message.create({
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
                logger_1.logger.debug('Chat message processed', {
                    messageId,
                    userId: connection.userId,
                    sessionId: data.sessionId
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to process chat message', {
                    connectionId: connection.id,
                    error: error instanceof Error ? error.message : String(error)
                });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Typing indicator
        socket.on('typing', (data) => {
            socket.to(`session:${data.sessionId}`).emit('userTyping', {
                userId: connection.userId,
                user: socket.data.user,
                isTyping: data.isTyping,
                timestamp: new Date().toISOString()
            });
            connection.lastActivity = new Date();
        });
        // Status update
        socket.on('statusUpdate', (data) => {
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
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, connection, reason);
        });
        // Error handler
        socket.on('error', (error) => {
            logger_1.logger.error('WebSocket error', {
                connectionId: connection.id,
                socketId: socket.id,
                error: error.message
            });
        });
    }
    /**
     * Handle session leave
     */
    handleLeaveSession(socket, connection, sessionId) {
        socket.leave(`session:${sessionId}`);
        if (connection.sessionId === sessionId) {
            connection.sessionId = undefined;
        }
        // Update session rooms tracking
        if (this.sessionRooms.has(sessionId)) {
            this.sessionRooms.get(sessionId).delete(connection.id);
            if (this.sessionRooms.get(sessionId).size === 0) {
                this.sessionRooms.delete(sessionId);
                delete this.stats.roomCounts[sessionId];
            }
            else {
                this.stats.roomCounts[sessionId] = this.sessionRooms.get(sessionId).size;
            }
        }
        // Notify others in the session
        socket.to(`session:${sessionId}`).emit('userLeft', {
            userId: connection.userId,
            user: socket.data.user,
            timestamp: new Date().toISOString()
        });
        socket.emit('sessionLeft', { sessionId });
        logger_1.logger.debug('User left session room', {
            connectionId: connection.id,
            userId: connection.userId,
            sessionId
        });
    }
    /**
     * Handle WebSocket disconnection
     */
    handleDisconnection(socket, connection, reason) {
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
        logger_1.logger.info('WebSocket connection closed', {
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
    handleSSEMessage(message) {
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
    broadcastToUser(userId, event, data) {
        const userConnections = this.userConnections.get(userId);
        if (!userConnections)
            return 0;
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
    broadcastToSession(sessionId, event, data) {
        const room = this.io.sockets.adapter.rooms.get(`session:${sessionId}`);
        if (!room)
            return 0;
        this.io.to(`session:${sessionId}`).emit(event, data);
        return room.size;
    }
    /**
     * Get connection statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get active connections
     */
    getActiveConnections() {
        const byUser = {};
        const bySessions = {};
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
    getSessionRoomSize(sessionId) {
        const room = this.io.sockets.adapter.rooms.get(`session:${sessionId}`);
        return room ? room.size : 0;
    }
    /**
     * Close connection
     */
    closeConnection(connectionId, reason = 'Server request') {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return false;
        connection.socket.emit('forceDisconnect', { reason });
        connection.socket.disconnect(true);
        return true;
    }
    /**
     * Cleanup inactive connections
     */
    cleanup() {
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
            logger_1.logger.info('Cleaned up inactive WebSocket connections', { count: cleanedCount });
        }
    }
    /**
     * Shutdown the WebSocket service
     */
    shutdown() {
        logger_1.logger.info('Shutting down WebSocket service');
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
exports.WebSocketService = WebSocketService;
function initializeWebSocketService(httpServer) {
    exports.webSocketService = new WebSocketService(httpServer);
    return exports.webSocketService;
}
//# sourceMappingURL=WebSocketService.js.map