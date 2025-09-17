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
// 导入配置验证器
const env_config_1 = require("./config/env.config");
// 立即验证配置
const envConfig = env_config_1.configValidator.validateAndLoad();
// 导入中间件
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const rateLimiter_1 = require("./middleware/rateLimiter");
// 导入路由
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const character_1 = __importDefault(require("./routes/character"));
const chat_1 = __importDefault(require("./routes/chat"));
const marketplace_1 = __importDefault(require("./routes/marketplace"));
const logs_1 = __importDefault(require("./routes/logs"));
const ai_features_1 = __importDefault(require("./routes/ai-features"));
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
// 基础中间件 - 配置安全头
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "ws:", "wss:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
}));
// CORS 配置 - 简化配置以确保工作
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
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
app.use('/api/characters', character_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/chats', chat_1.default); // 支持复数形式，兼容前端调用
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/logs', logs_1.default);
app.use('/api/ai', ai_features_1.default); // QuackAI 核心功能 API
// 健康检查端点
app.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: envConfig.NODE_ENV,
            version: '0.1.0',
            services: {
                database: true, // Prisma 连接在启动时验证
                ai: {
                    configured: env_config_1.configValidator.checkAIConfig(),
                    model: envConfig.DEFAULT_MODEL
                }
            }
        };
        // 检查 AI 服务状态
        if (healthStatus.services.ai.configured) {
            const aiHealth = await env_config_1.configValidator.getAIHealthStatus();
            healthStatus.services.ai = {
                configured: healthStatus.services.ai.configured,
                model: healthStatus.services.ai.model,
                reachable: aiHealth.reachable,
                error: aiHealth.error
            };
        }
        res.json(healthStatus);
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
// WebSocket 连接已在 WebSocketServer 中处理
// 错误处理中间件（必须放在最后）
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        console.log('🚀 启动 TavernAI Plus 服务器...');
        // 连接数据库
        await exports.prisma.$connect();
        console.log('✅ 数据库连接成功');
        // 检查 AI 服务配置
        if (env_config_1.configValidator.checkAIConfig()) {
            console.log('✅ AI 服务配置检查通过');
            // 测试 AI 服务连接
            const aiHealthStatus = await env_config_1.configValidator.getAIHealthStatus();
            if (aiHealthStatus.reachable) {
                console.log('✅ Grok-3 LLM 服务连接成功');
            }
            else {
                console.log('⚠️  Grok-3 LLM 服务连接失败:', aiHealthStatus.error);
            }
        }
        else {
            console.log('❌ AI 服务配置不完整，部分功能可能不可用');
        }
        // 启动 HTTP 服务器
        httpServer.listen(envConfig.PORT, () => {
            console.log(`🚀 服务器运行在 http://${envConfig.HOST}:${envConfig.PORT}`);
            console.log(`📱 WebSocket 服务器就绪`);
            console.log(`🌍 环境: ${envConfig.NODE_ENV}`);
            console.log(`🤖 AI 模型: ${envConfig.DEFAULT_MODEL}`);
            console.log('📋 可用端点:');
            console.log('   GET  /health - 健康检查');
            console.log('   POST /api/auth/* - 认证服务');
            console.log('   GET  /api/characters/* - 角色管理');
            console.log('   POST /api/chat/* - 对话服务');
            console.log('   GET  /api/ai/* - AI 功能');
        });
    }
    catch (error) {
        console.error('❌ 服务器启动失败:', error);
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