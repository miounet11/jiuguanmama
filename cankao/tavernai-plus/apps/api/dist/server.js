"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.wsServer = exports.io = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const client_1 = require("@prisma/client");
const websocket_1 = __importDefault(require("./websocket"));
// 配置环境变量
dotenv_1.default.config();
// 导入中间件
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const rateLimiter_1 = require("./middleware/rateLimiter");
// 导入路由
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
// import characterRoutes from './routes/character'
// import chatRoutes from './routes/chat'
const marketplace_1 = __importDefault(require("./routes/marketplace"));
// 创建应用实例
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
// 创建数据库客户端
exports.prisma = new client_1.PrismaClient();
// 创建 WebSocket 服务器
const wsServer = new websocket_1.default(httpServer);
exports.wsServer = wsServer;
exports.io = wsServer.getIO();
// 基础中间件
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 请求日志
app.use(requestLogger_1.requestLogger);
// 速率限制
app.use('/api', rateLimiter_1.rateLimiter);
// 静态文件服务
app.use('/uploads', express_1.default.static('uploads'));
// API 路由
app.use('/api/auth', auth_1.default);
app.use('/api/users', user_1.default);
app.use('/api/characters', characterRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/marketplace', marketplace_1.default);
// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// WebSocket 连接已在 WebSocketServer 中处理
// 错误处理中间件（必须放在最后）
app.use(errorHandler_1.errorHandler);
// 启动服务器
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
async function startServer() {
    try {
        // 连接数据库
        await exports.prisma.$connect();
        console.log('✅ Database connected');
        // 启动 HTTP 服务器
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://${HOST}:${PORT}`);
            console.log(`📱 WebSocket server ready`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
    await exports.prisma.$disconnect();
    console.log('Database disconnected');
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
    await exports.prisma.$disconnect();
    console.log('Database disconnected');
    process.exit(0);
});
// 启动服务器
startServer();
//# sourceMappingURL=server.js.map