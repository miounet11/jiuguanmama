"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ai_1 = require("./services/ai");
// 配置环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// 基础中间件
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json());
// 健康检查
app.get('/health', async (req, res) => {
    try {
        const aiStatus = await ai_1.aiService.checkAPIStatus();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            ai: aiStatus
        });
    }
    catch (error) {
        res.json({
            status: 'partial',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            ai: { available: false, error: 'Check failed' }
        });
    }
});
// AI 测试端点
app.post('/api/ai/test', async (req, res) => {
    try {
        const { message = '你好，请简单回复测试连接' } = req.body;
        const result = await ai_1.aiService.generateChatResponse({
            sessionId: 'test-session',
            userId: 'test-user',
            messages: [
                { role: 'user', content: message }
            ],
            stream: false
        });
        res.json({
            success: true,
            content: result.content,
            model: result.model,
            usage: result.usage
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// 启动服务器
app.listen(PORT, () => {
    console.log('🚀 最小化 AI 服务器启动成功');
    console.log(`   端口: ${PORT}`);
    console.log(`   健康检查: http://localhost:${PORT}/health`);
    console.log(`   AI 测试: POST http://localhost:${PORT}/api/ai/test`);
    console.log('');
    console.log('🧪 测试命令:');
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/ai/test -H "Content-Type: application/json" -d '{"message":"测试消息"}'`);
});
//# sourceMappingURL=minimal-server.js.map