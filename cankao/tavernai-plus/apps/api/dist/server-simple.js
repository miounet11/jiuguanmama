"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
// 初始化并验证环境配置
const configValidator = require('./config/env.config').ConfigValidator.getInstance();
const envConfig = configValidator.validateAndLoad();
// 导入基础路由
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const character_1 = __importDefault(require("./routes/character"));
// import chatRoutes from './routes/chat' // 暂时禁用，包含复杂依赖
const models_1 = __importDefault(require("./routes/models"));
const app = (0, express_1.default)();
// 基础中间件
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: envConfig.CLIENT_URL,
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 基础路由
app.use('/api/auth', auth_1.default);
app.use('/api/users', user_1.default);
app.use('/api/characters', character_1.default);
// app.use('/api/chat', chatRoutes) // 暂时禁用
app.use('/api/models', models_1.default);
// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: envConfig.NODE_ENV,
        version: '0.1.0'
    });
});
// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});
// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
const PORT = envConfig.PORT || 3007;
app.listen(PORT, () => {
    console.log(`🚀 API服务器启动成功！`);
    console.log(`📍 运行地址: http://localhost:${PORT}`);
    console.log(`🌍 环境: ${envConfig.NODE_ENV}`);
    console.log(`🤖 AI模型: ${envConfig.DEFAULT_MODEL}`);
});
exports.default = app;
//# sourceMappingURL=server-simple.js.map