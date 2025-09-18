"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorTracker = exports.ApiUsageLogger = exports.requestLogger = exports.logger = void 0;
const winston_1 = require("winston");
// 延迟加载配置以避免循环依赖
let config = null;
const getConfig = () => {
    if (!config) {
        try {
            const { getEnvConfig } = require('../config/env.config');
            config = getEnvConfig();
        }
        catch (error) {
            // 如果配置未初始化，使用默认值
            config = {
                NODE_ENV: process.env.NODE_ENV || 'development'
            };
        }
    }
    return config;
};
// 创建 Winston 日志器
exports.logger = (0, winston_1.createLogger)({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json(), winston_1.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        });
    })),
    defaultMeta: {
        service: 'tavernai-plus-api',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // 控制台输出
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${level}]: ${message} ${metaStr}`;
            }))
        }),
        // 错误日志文件
        new winston_1.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // 所有日志文件
        new winston_1.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        })
    ]
});
// 请求日志中间件
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id
        };
        if (res.statusCode >= 400) {
            exports.logger.warn('HTTP Request', logData);
        }
        else {
            exports.logger.info('HTTP Request', logData);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
// API 使用日志记录器
class ApiUsageLogger {
    static async logApiCall(data) {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            await prisma.usageLog.create({
                data: {
                    userId: data.userId || null,
                    endpoint: data.endpoint,
                    method: data.method,
                    statusCode: data.statusCode,
                    responseTime: data.responseTime,
                    ip: data.ip || null,
                    userAgent: data.userAgent || null
                }
            });
            await prisma.$disconnect();
        }
        catch (error) {
            exports.logger.error('Failed to log API usage', { error });
        }
    }
    static async getUsageStats(timeframe = 'day') {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const now = new Date();
            let startDate = new Date();
            switch (timeframe) {
                case 'hour':
                    startDate.setHours(now.getHours() - 1);
                    break;
                case 'day':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }
            const stats = await prisma.usageLog.groupBy({
                by: ['endpoint', 'method'],
                where: {
                    createdAt: {
                        gte: startDate
                    }
                },
                _count: {
                    id: true
                },
                _avg: {
                    responseTime: true
                }
            });
            await prisma.$disconnect();
            return stats;
        }
        catch (error) {
            exports.logger.error('Failed to get usage stats', { error });
            return [];
        }
    }
}
exports.ApiUsageLogger = ApiUsageLogger;
// 错误追踪器
class ErrorTracker {
    static async trackError(error, context) {
        const errorData = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };
        exports.logger.error('Application Error', errorData);
        // 在生产环境中，可以发送到错误追踪服务如 Sentry
        if (process.env.NODE_ENV === 'production') {
            // TODO: 集成 Sentry 或其他错误追踪服务
        }
    }
    static async createAlert(data) {
        try {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            await prisma.alert.create({
                data: {
                    type: data.type,
                    severity: data.severity,
                    title: data.title,
                    message: data.message,
                    source: data.source || 'system',
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null
                }
            });
            await prisma.$disconnect();
            exports.logger.warn('System Alert Created', data);
        }
        catch (error) {
            exports.logger.error('Failed to create alert', { error });
        }
    }
}
exports.ErrorTracker = ErrorTracker;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map