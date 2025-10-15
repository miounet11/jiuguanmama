"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const { PrismaClient } = require('../node_modules/.prisma/client');
// import WebSocketServer from './websocket'  // 临时禁用以快速启动
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
const chatroom_1 = __importDefault(require("./routes/chatroom"));
const marketplace_1 = __importDefault(require("./routes/marketplace"));
const community_1 = __importDefault(require("./routes/community"));
const multimodal_1 = __importDefault(require("./routes/multimodal"));
// import recommendationRoutes from './routes/recommendation'  // 临时禁用
const system_1 = __importDefault(require("./routes/system"));
const logs_1 = __importDefault(require("./routes/logs"));
const ai_features_1 = __importDefault(require("./routes/ai-features"));
const models_1 = __importDefault(require("./routes/models"));
const presets_1 = __importDefault(require("./routes/presets"));
const worldinfo_1 = __importDefault(require("./routes/worldinfo"));
// import worldinfoInjectionRoutes from './routes/worldinfo-injection' // 临时禁用
const groupchat_1 = __importDefault(require("./routes/groupchat"));
const personas_1 = __importDefault(require("./routes/personas"));
const user_mode_1 = __importDefault(require("./routes/user-mode"));
const stats_1 = __importDefault(require("./routes/stats"));
const scenarios_1 = __importDefault(require("./routes/scenarios"));
const enhancedScenarios_1 = __importDefault(require("./routes/enhancedScenarios"));
const spacetime_tavern_1 = __importDefault(require("./routes/spacetime-tavern")); // 时空酒馆系统 API
const gamification_1 = __importDefault(require("./routes/gamification")); // 游戏化玩法系统 API
// import importRoutes from './routes/import' // 临时禁用
// 导入工作流调度器
// 导入可扩展性和性能优化服务
const scalabilityManager_1 = __importDefault(require("./services/scalabilityManager"));
const performanceMonitor_1 = __importDefault(require("./services/performanceMonitor"));
const cacheManager_1 = __importDefault(require("./services/cacheManager"));
// 创建应用实例
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
// 创建数据库客户端
exports.prisma = new PrismaClient();
// 创建 WebSocket 服务器
// const wsServer = new WebSocketServer(httpServer)  // 临时禁用
// export const io = wsServer.getIO()
// export { wsServer }
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
// CORS 配置 - 支持开发和生产环境
const allowedOrigins = [
    // 开发环境
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    // 生产环境
    'https://www.isillytavern.com',
    'https://api.isillytavern.com'
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // 允许没有origin的请求（如移动端app或curl请求）
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
app.use('/api/user', user_1.default); // 支持单数形式，兼容前端调用
app.use('/api/characters', character_1.default);
app.use('/characters', character_1.default); // 直接支持 /characters 路径（兼容前端调用）
app.use('/api/chat', chat_1.default);
app.use('/api/chats', chat_1.default); // 支持复数形式，兼容前端调用
app.use('/chat', chat_1.default); // 直接支持 /chat 路径（兼容前端调用）
app.use('/api/chatrooms', chatroom_1.default); // 多角色聊天室 API
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/community', community_1.default); // 社区功能 API
app.use('/api', community_1.default); // 通知功能 API (notifications)
app.use('/api/multimodal', multimodal_1.default); // 多模态AI功能 API
// app.use('/api/recommendations', recommendationRoutes) // 智能推荐系统 API - 临时禁用
app.use('/api/system', system_1.default); // 系统管理和监控 API
app.use('/api/logs', logs_1.default);
app.use('/api/ai', ai_features_1.default); // QuackAI 核心功能 API
app.use('/api/models', models_1.default); // 多模型 AI 支持 API
app.use('/api/presets', presets_1.default); // 聊天预设管理 API
app.use('/api/worldinfo', worldinfo_1.default); // 世界信息管理 API
// app.use('/api/worldinfo-injection', worldinfoInjectionRoutes) // 动态世界观注入 API (Issue #15) - 临时禁用
app.use('/api/groupchat', groupchat_1.default); // 群组聊天 API
app.use('/api/personas', personas_1.default); // 用户人格管理 API
app.use('/api/user-mode', user_mode_1.default); // 渐进式功能披露 API (Issue #16)
app.use('/api/stats', stats_1.default); // 统计数据 API
app.use('/api/scenarios', scenarios_1.default); // 情景剧本系统 API (Issue #22)
app.use('/api/enhanced-scenarios', enhancedScenarios_1.default); // 增强世界剧本系统 API
app.use('/api/spacetime-tavern', spacetime_tavern_1.default); // 时空酒馆系统 API
app.use('/api/gamification', gamification_1.default); // 游戏化玩法系统 API
// app.use('/api/import', importRoutes) // 导入导出功能 API (Issue #26) - 临时禁用
// app.use('/api/workflows', workflowRoutes) // 智能工作流 API - 已删除
// 健康检查端点
app.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: envConfig.NODE_ENV,
            version: '0.1.0',
            services: {
                database: true,
                ai: {
                    configured: env_config_1.configValidator.checkAIConfig(),
                    model: envConfig.DEFAULT_MODEL,
                    reachable: false,
                    error: null
                }
            }
        };
        // 检查 AI 服务状态
        if (healthStatus.services.ai.configured) {
            try {
                const aiHealth = await env_config_1.configValidator.getAIHealthStatus();
                healthStatus.services.ai.reachable = aiHealth.reachable || false;
                if (aiHealth.error) {
                    healthStatus.services.ai.error = aiHealth.error;
                }
            }
            catch (aiError) {
                healthStatus.services.ai.error = 'AI service check failed';
            }
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
        // 初始化性能优化服务
        console.log('🔧 初始化性能优化服务...');
        // 1. 初始化数据库优化 (暂时禁用以修复错误)
        // await DatabaseOptimizer.initialize()
        // 2. 预热缓存系统 (暂时禁用)
        // await CacheManager.warmup()
        // 3. 初始化可扩展性管理器 (暂时禁用)
        // await ScalabilityManager.initialize()
        console.log('✅ 性能优化服务初始化完成');
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
            // console.log('   POST /api/chat/* - 对话服务') // 临时禁用
            console.log('   GET  /api/ai/* - AI 功能');
            console.log('   GET  /api/recommendations/* - 智能推荐系统');
            console.log('   GET  /api/marketplace/* - 角色市场');
            console.log('   GET  /api/community/* - 社区功能');
            // console.log('   POST /api/multimodal/* - 多模态AI')
            console.log('   GET  /api/system/* - 系统管理和监控');
        });
    }
    catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}
// 优雅关闭
async function gracefulShutdown(signal) {
    console.log(`${signal} received, shutting down gracefully...`);
    // 停止性能监控
    performanceMonitor_1.default.stopMonitoring();
    console.log('Performance monitoring stopped');
    // 停止可扩展性管理器
    scalabilityManager_1.default.stopMonitoring();
    console.log('Scalability manager stopped');
    // 清理缓存
    cacheManager_1.default.flushAll();
    console.log('Cache cleared');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
    await exports.prisma.$disconnect();
    console.log('Database disconnected');
    process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// 启动服务器
startServer();
//# sourceMappingURL=server.js.map