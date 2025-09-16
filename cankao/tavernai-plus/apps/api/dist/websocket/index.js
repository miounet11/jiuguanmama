"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
class WebSocketServer {
    io;
    userSockets = new Map(); // userId -> Set<socketId>
    socketUsers = new Map(); // socketId -> userId
    constructor(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.initialize();
    }
    initialize() {
        // 认证中间件
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }
                // 验证 JWT
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                // 获取用户信息
                const user = await server_1.prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                });
                if (!user) {
                    return next(new Error('User not found'));
                }
                // 将用户信息附加到 socket
                socket.data.user = user;
                next();
            }
            catch (error) {
                next(new Error('Authentication failed'));
            }
        });
        // 连接处理
        this.io.on('connection', (socket) => {
            const userId = socket.data.user.id;
            console.log(`User ${socket.data.user.username} connected`);
            // 记录用户连接
            this.addUserSocket(userId, socket.id);
            // 加入用户专属房间
            socket.join(`user:${userId}`);
            // 处理事件
            this.handleEvents(socket);
            // 断开连接处理
            socket.on('disconnect', () => {
                console.log(`User ${socket.data.user.username} disconnected`);
                this.removeUserSocket(userId, socket.id);
            });
        });
    }
    handleEvents(socket) {
        const userId = socket.data.user.id;
        // 加入聊天会话
        socket.on('join', async (data) => {
            try {
                // 验证用户是否有权限访问该会话
                const session = await server_1.prisma.chatSession.findFirst({
                    where: {
                        id: data.sessionId,
                        userId: userId
                    }
                });
                if (session) {
                    socket.join(`session:${data.sessionId}`);
                    socket.emit('joined', {
                        sessionId: data.sessionId,
                        success: true
                    });
                }
                else {
                    socket.emit('error', {
                        message: 'Session not found or access denied'
                    });
                }
            }
            catch (error) {
                console.error('Join session error:', error);
                socket.emit('error', {
                    message: 'Failed to join session'
                });
            }
        });
        // 离开聊天会话
        socket.on('leave', (data) => {
            socket.leave(`session:${data.sessionId}`);
            socket.emit('left', {
                sessionId: data.sessionId,
                success: true
            });
        });
        // 发送消息（可选的实时消息处理）
        socket.on('send_message', async (data) => {
            try {
                // 验证会话权限
                const session = await server_1.prisma.chatSession.findFirst({
                    where: {
                        id: data.sessionId,
                        userId: userId
                    }
                });
                if (!session) {
                    socket.emit('error', {
                        message: 'Session not found'
                    });
                    return;
                }
                // 创建消息
                const message = await server_1.prisma.message.create({
                    data: {
                        sessionId: data.sessionId,
                        userId: userId,
                        content: data.content,
                        role: 'user',
                        tokens: Math.ceil(data.content.length / 4)
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                });
                // 广播给会话中的所有用户
                this.io.to(`session:${data.sessionId}`).emit('message', {
                    type: 'user_message',
                    sessionId: data.sessionId,
                    message
                });
            }
            catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', {
                    message: 'Failed to send message'
                });
            }
        });
        // 用户状态更新
        socket.on('typing', (data) => {
            // 广播给会话中的其他用户
            socket.to(`session:${data.sessionId}`).emit('user_typing', {
                userId: userId,
                username: socket.data.user.username,
                isTyping: data.isTyping
            });
        });
        // 用户在线状态
        socket.on('online_status', async () => {
            const onlineUsers = Array.from(this.userSockets.keys());
            socket.emit('online_users', {
                users: onlineUsers,
                count: onlineUsers.length
            });
        });
    }
    // 用户连接管理
    addUserSocket(userId, socketId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socketId);
        this.socketUsers.set(socketId, userId);
        // 通知其他用户该用户上线
        this.io.emit('user_online', { userId });
    }
    removeUserSocket(userId, socketId) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
                // 通知其他用户该用户下线
                this.io.emit('user_offline', { userId });
            }
        }
        this.socketUsers.delete(socketId);
    }
    // 公共方法：发送消息到特定用户
    sendToUser(userId, event, data) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.forEach(socketId => {
                this.io.to(socketId).emit(event, data);
            });
        }
    }
    // 公共方法：发送消息到会话
    sendToSession(sessionId, event, data) {
        this.io.to(`session:${sessionId}`).emit(event, data);
    }
    // 公共方法：广播消息
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    // 获取 Socket.IO 实例
    getIO() {
        return this.io;
    }
    // 获取在线用户数
    getOnlineUserCount() {
        return this.userSockets.size;
    }
    // 检查用户是否在线
    isUserOnline(userId) {
        return this.userSockets.has(userId);
    }
}
exports.WebSocketServer = WebSocketServer;
exports.default = WebSocketServer;
//# sourceMappingURL=index.js.map