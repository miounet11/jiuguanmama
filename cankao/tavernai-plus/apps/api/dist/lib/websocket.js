"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = exports.getWebSocketManager = exports.initializeWebSocket = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("./redis");
const logger_1 = require("../services/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class WebSocketManager {
    io = null;
    activeSessions = new Map();
    userSockets = new Map();
    rooms = new Map();
    heartbeatInterval = null;
    /**
     * Initialize WebSocket server with enhanced features
     */
    async initialize(httpServer) {
        try {
            this.io = new socket_io_1.Server(httpServer, {
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
            logger_1.logger.info('WebSocket server initialized with enhanced features');
            return this.io;
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize WebSocket server:', error);
            throw error;
        }
    }
    /**
     * Setup Redis adapter for horizontal scaling
     */
    async setupRedisAdapter() {
        try {
            const redisClient = (0, redis_1.getRedisClient)();
            if (redisClient && this.io) {
                // Create Redis adapter for Socket.IO clustering
                const pubClient = redisClient.duplicate();
                const subClient = redisClient.duplicate();
                const adapter = (0, redis_adapter_1.createAdapter)(pubClient, subClient);
                this.io.adapter(adapter);
                logger_1.logger.info('Redis adapter configured for Socket.IO clustering');
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to setup Redis adapter, continuing without clustering:', error);
        }
    }
    /**
     * Setup authentication middleware
     */
    setupAuthentication() {
        if (!this.io)
            return;
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
                if (!token) {
                    // Allow anonymous connections for public features
                    socket.data.user = null;
                    return next();
                }
                // Verify JWT token
                const decoded = jsonwebtoken_1.default.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'your-secret-key');
                // Store user data in socket
                socket.data.user = {
                    id: decoded.userId,
                    username: decoded.username,
                    avatar: decoded.avatar,
                    role: decoded.role,
                };
                logger_1.logger.debug(`Socket authenticated for user: ${decoded.username}`);
                next();
            }
            catch (error) {
                logger_1.logger.error('Socket authentication failed:', error);
                next(new Error('Authentication failed'));
            }
        });
    }
    /**
     * Setup connection event handlers
     */
    setupConnectionHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    /**
     * Handle new socket connection
     */
    handleConnection(socket) {
        const user = socket.data.user;
        logger_1.logger.info(`Socket connected: ${socket.id}${user ? ` (user: ${user.username})` : ' (anonymous)'}`);
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
    setupSocketEventHandlers(socket) {
        const user = socket.data.user;
        // Chat session management
        socket.on('join_session', (data) => {
            this.handleJoinSession(socket, data.sessionId, data.metadata);
        });
        socket.on('leave_session', (sessionId) => {
            this.handleLeaveSession(socket, sessionId);
        });
        // Real-time messaging
        socket.on('send_message', (data) => {
            this.handleSendMessage(socket, data);
        });
        // User status updates
        socket.on('update_status', (status) => {
            this.handleStatusUpdate(socket, status);
        });
        // Extension communication
        socket.on('extension_event', (data) => {
            this.handleExtensionEvent(socket, data);
        });
        // Typing indicators
        socket.on('typing_start', (sessionId) => {
            this.handleTypingStart(socket, sessionId);
        });
        socket.on('typing_stop', (sessionId) => {
            this.handleTypingStop(socket, sessionId);
        });
        // Admin events (if user is admin)
        if (user?.role === 'admin') {
            socket.on('admin_broadcast', (data) => {
                this.handleAdminBroadcast(socket, data);
            });
            socket.on('admin_user_action', (data) => {
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
    handleJoinSession(socket, sessionId, metadata) {
        const user = socket.data.user;
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
            const room = this.rooms.get(roomName);
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
            logger_1.logger.debug(`Socket ${socket.id} joined session ${sessionId}`);
        }
        catch (error) {
            logger_1.logger.error('Error joining session:', error);
            socket.emit('error', { message: 'Failed to join session' });
        }
    }
    /**
     * Handle leaving a session
     */
    handleLeaveSession(socket, sessionId) {
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
            logger_1.logger.debug(`Socket ${socket.id} left session ${sessionId}`);
        }
        catch (error) {
            logger_1.logger.error('Error leaving session:', error);
        }
    }
    /**
     * Handle sending a message
     */
    handleSendMessage(socket, data) {
        const user = socket.data.user;
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
            this.io.to(roomName).emit('new_message', messageData);
            logger_1.logger.debug(`Message sent in session ${data.sessionId} by ${user?.username || 'anonymous'}`);
        }
        catch (error) {
            logger_1.logger.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    }
    /**
     * Handle status updates
     */
    handleStatusUpdate(socket, status) {
        const user = socket.data.user;
        if (!user)
            return;
        try {
            // Broadcast status to all user's sockets
            const userSockets = this.userSockets.get(user.id);
            if (userSockets) {
                userSockets.forEach(socketId => {
                    this.io.to(socketId).emit('user_status_updated', {
                        userId: user.id,
                        status,
                        timestamp: new Date(),
                    });
                });
            }
            logger_1.logger.debug(`User ${user.username} status updated: ${status}`);
        }
        catch (error) {
            logger_1.logger.error('Error updating status:', error);
        }
    }
    /**
     * Handle extension events
     */
    handleExtensionEvent(socket, data) {
        try {
            const roomName = `extension:${data.extensionId}`;
            // Broadcast to extension subscribers
            socket.to(roomName).emit('extension_event', {
                extensionId: data.extensionId,
                event: data.event,
                data: data.data,
                timestamp: new Date(),
            });
            logger_1.logger.debug(`Extension event ${data.event} for ${data.extensionId}`);
        }
        catch (error) {
            logger_1.logger.error('Error handling extension event:', error);
        }
    }
    /**
     * Handle typing indicators
     */
    handleTypingStart(socket, sessionId) {
        const user = socket.data.user;
        const roomName = `session:${sessionId}`;
        socket.to(roomName).emit('user_typing', {
            user: user ? { id: user.id, username: user.username } : null,
            isTyping: true,
        });
    }
    handleTypingStop(socket, sessionId) {
        const user = socket.data.user;
        const roomName = `session:${sessionId}`;
        socket.to(roomName).emit('user_typing', {
            user: user ? { id: user.id, username: user.username } : null,
            isTyping: false,
        });
    }
    /**
     * Handle admin broadcasts
     */
    handleAdminBroadcast(socket, data) {
        const user = socket.data.user;
        if (!user || user.role !== 'admin') {
            socket.emit('error', { message: 'Unauthorized' });
            return;
        }
        try {
            this.io.emit('admin_announcement', {
                message: data.message,
                type: data.type,
                from: user.username,
                timestamp: new Date(),
            });
            logger_1.logger.info(`Admin broadcast by ${user.username}: ${data.message}`);
        }
        catch (error) {
            logger_1.logger.error('Error sending admin broadcast:', error);
        }
    }
    /**
     * Handle admin user actions
     */
    handleAdminUserAction(socket, data) {
        const admin = socket.data.user;
        if (!admin || admin.role !== 'admin') {
            socket.emit('error', { message: 'Unauthorized' });
            return;
        }
        try {
            // Get target user's sockets
            const targetSockets = this.userSockets.get(data.targetUserId);
            if (targetSockets) {
                targetSockets.forEach(socketId => {
                    this.io.to(socketId).emit('admin_action', {
                        action: data.action,
                        reason: data.reason,
                        by: admin.username,
                        timestamp: new Date(),
                    });
                    // Disconnect if action is ban/kick
                    if (data.action === 'ban' || data.action === 'kick') {
                        this.io.sockets.sockets.get(socketId)?.disconnect(true);
                    }
                });
            }
            logger_1.logger.info(`Admin action by ${admin.username}: ${data.action} on user ${data.targetUserId}`);
        }
        catch (error) {
            logger_1.logger.error('Error handling admin action:', error);
        }
    }
    /**
     * Handle socket disconnection
     */
    handleDisconnection(socket, reason) {
        const user = socket.data.user;
        logger_1.logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})${user ? ` (user: ${user.username})` : ''}`);
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
        }
        catch (error) {
            logger_1.logger.error('Error handling disconnection:', error);
        }
    }
    /**
     * Track user connection
     */
    trackUserConnection(userId, socketId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socketId);
    }
    /**
     * Clean up user connection
     */
    cleanupUserConnection(userId, socketId) {
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
    setupHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.performCleanup();
        }, 60000); // Every minute
    }
    /**
     * Perform periodic cleanup
     */
    performCleanup() {
        try {
            const now = new Date();
            const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
            // Clean up inactive sessions
            this.activeSessions.forEach((session, socketId) => {
                if (now.getTime() - session.lastActivity.getTime() > inactiveThreshold) {
                    this.activeSessions.delete(socketId);
                    logger_1.logger.debug(`Cleaned up inactive session: ${socketId}`);
                }
            });
            // Log statistics
            logger_1.logger.debug(`WebSocket stats: ${this.activeSessions.size} active sessions, ${this.rooms.size} rooms, ${this.userSockets.size} users`);
        }
        catch (error) {
            logger_1.logger.error('Error during cleanup:', error);
        }
    }
    /**
     * Get WebSocket server instance
     */
    getIO() {
        return this.io;
    }
    /**
     * Send message to specific user
     */
    sendToUser(userId, event, data) {
        try {
            const userSockets = this.userSockets.get(userId);
            if (userSockets && userSockets.size > 0) {
                userSockets.forEach(socketId => {
                    this.io.to(socketId).emit(event, data);
                });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error sending message to user:', error);
            return false;
        }
    }
    /**
     * Broadcast to all connected clients
     */
    broadcast(event, data) {
        try {
            this.io.emit(event, data);
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting message:', error);
        }
    }
    /**
     * Get connection statistics
     */
    getStats() {
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
    async shutdown() {
        try {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            if (this.io) {
                await new Promise((resolve) => {
                    this.io.close(resolve);
                });
            }
            logger_1.logger.info('WebSocket server shut down gracefully');
        }
        catch (error) {
            logger_1.logger.error('Error during WebSocket shutdown:', error);
        }
    }
}
// Global WebSocket manager instance
let wsManager = null;
/**
 * Initialize WebSocket manager
 */
const initializeWebSocket = async (httpServer) => {
    if (!wsManager) {
        wsManager = new WebSocketManager();
    }
    return await wsManager.initialize(httpServer);
};
exports.initializeWebSocket = initializeWebSocket;
/**
 * Get WebSocket manager instance
 */
const getWebSocketManager = () => {
    return wsManager;
};
exports.getWebSocketManager = getWebSocketManager;
/**
 * Get Socket.IO server instance
 */
const getSocketIO = () => {
    return wsManager?.getIO() || null;
};
exports.getSocketIO = getSocketIO;
exports.default = wsManager;
//# sourceMappingURL=websocket.js.map