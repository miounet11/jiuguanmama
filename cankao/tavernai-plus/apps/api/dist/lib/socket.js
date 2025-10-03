"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
exports.getSocket = getSocket;
const socket_io_1 = require("socket.io");
// 创建Socket.IO实例，但先不设置服务器
let io = null;
function initializeSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    // Socket.IO 连接处理
    io.on('connection', (socket) => {
        console.log(`🔌 用户连接: ${socket.id}`);
        // 加入聊天会话房间
        socket.on('join_session', (sessionId) => {
            socket.join(`session:${sessionId}`);
            console.log(`用户 ${socket.id} 加入会话 ${sessionId}`);
        });
        // 离开聊天会话房间
        socket.on('leave_session', (sessionId) => {
            socket.leave(`session:${sessionId}`);
            console.log(`用户 ${socket.id} 离开会话 ${sessionId}`);
        });
        // 用户断开连接
        socket.on('disconnect', () => {
            console.log(`🔌 用户断开连接: ${socket.id}`);
        });
    });
    return io;
}
function getSocket() {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Call initializeSocket first.');
    }
    return io;
}
//# sourceMappingURL=socket.js.map