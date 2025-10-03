"use strict";
/**
 * Application Export (for testing)
 * This file exports the Express app without starting the server
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const { PrismaClient } = require('../node_modules/.prisma/client');
// Configure environment variables
dotenv_1.default.config();
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const rateLimiter_1 = require("./middleware/rateLimiter");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const character_1 = __importDefault(require("./routes/character"));
const chat_1 = __importDefault(require("./routes/chat"));
const chatroom_1 = __importDefault(require("./routes/chatroom"));
const marketplace_1 = __importDefault(require("./routes/marketplace"));
const community_1 = __importDefault(require("./routes/community"));
const multimodal_1 = __importDefault(require("./routes/multimodal"));
const system_1 = __importDefault(require("./routes/system"));
const logs_1 = __importDefault(require("./routes/logs"));
const ai_features_1 = __importDefault(require("./routes/ai-features"));
const models_1 = __importDefault(require("./routes/models"));
const presets_1 = __importDefault(require("./routes/presets"));
const worldinfo_1 = __importDefault(require("./routes/worldinfo"));
const groupchat_1 = __importDefault(require("./routes/groupchat"));
const personas_1 = __importDefault(require("./routes/personas"));
const user_mode_1 = __importDefault(require("./routes/user-mode"));
const stats_1 = __importDefault(require("./routes/stats"));
const scenarios_1 = __importDefault(require("./routes/scenarios"));
const enhancedScenarios_1 = __importDefault(require("./routes/enhancedScenarios"));
const spacetime_tavern_1 = __importDefault(require("./routes/spacetime-tavern"));
const gamification_1 = __importDefault(require("./routes/gamification"));
// UX System Routes (New)
const features_1 = __importDefault(require("./routes/features"));
const onboarding_1 = __importDefault(require("./routes/onboarding"));
const tutorials_1 = __importDefault(require("./routes/tutorials"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const creator_studio_1 = __importDefault(require("./routes/creator-studio"));
const admin_console_1 = __importDefault(require("./routes/admin-console"));
const gamification_dashboard_1 = __importDefault(require("./routes/gamification-dashboard"));
// Create application instance
const app = (0, express_1.default)();
// Create database client
exports.prisma = new PrismaClient();
// Basic middleware - Security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", 'data:', 'https:', 'http:'],
            connectSrc: ["'self'", 'ws:', 'wss:', 'https:'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(requestLogger_1.requestLogger);
// Rate limiting
app.use('/api', rateLimiter_1.rateLimiter);
// Static file serving
app.use('/uploads', express_1.default.static('uploads'));
// API routes - Existing
app.use('/api/auth', auth_1.default);
app.use('/api/users', user_1.default);
app.use('/api/user', user_1.default);
app.use('/api/characters', character_1.default);
app.use('/characters', character_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/chats', chat_1.default);
app.use('/chat', chat_1.default);
app.use('/api/chatrooms', chatroom_1.default);
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/community', community_1.default);
app.use('/api', community_1.default);
app.use('/api/multimodal', multimodal_1.default);
app.use('/api/system', system_1.default);
app.use('/api/logs', logs_1.default);
app.use('/api/ai', ai_features_1.default);
app.use('/api/models', models_1.default);
app.use('/api/presets', presets_1.default);
app.use('/api/worldinfo', worldinfo_1.default);
app.use('/api/groupchat', groupchat_1.default);
app.use('/api/personas', personas_1.default);
app.use('/api/user-mode', user_mode_1.default);
app.use('/api/stats', stats_1.default);
app.use('/api/scenarios', scenarios_1.default);
app.use('/api/enhanced-scenarios', enhancedScenarios_1.default);
app.use('/api/spacetime-tavern', spacetime_tavern_1.default);
app.use('/api/gamification', gamification_1.default);
// API routes - UX System (New)
app.use('/api/v1/features', features_1.default);
app.use('/api/v1/onboarding', onboarding_1.default);
app.use('/api/v1/tutorials', tutorials_1.default);
app.use('/api/v1/notifications', notifications_1.default);
app.use('/api/v1/creator-studio', creator_studio_1.default);
app.use('/api/v1/admin-console', admin_console_1.default);
app.use('/api/v1/gamification', gamification_dashboard_1.default);
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '0.1.0',
            services: {
                database: true,
            },
        };
        res.json(healthStatus);
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=index.js.map