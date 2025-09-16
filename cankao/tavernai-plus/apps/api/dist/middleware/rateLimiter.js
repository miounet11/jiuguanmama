"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 最多100个请求
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later',
            retryAfter: req.rateLimit?.resetTime
        });
    },
    skip: (req) => {
        // 跳过健康检查和静态资源
        return req.path === '/health' || req.path.startsWith('/uploads');
    }
});
// 严格限制的速率限制（用于认证相关路由）
exports.strictRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5个请求
    message: 'Too many attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // 成功的请求不计入限制
});
//# sourceMappingURL=rateLimiter.js.map