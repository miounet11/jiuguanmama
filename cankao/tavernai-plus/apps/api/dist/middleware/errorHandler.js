"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const library_1 = require("@prisma/client/runtime/library");
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;
    // 处理 Prisma 错误
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                statusCode = 409;
                const field = err.meta?.target?.[0];
                message = `${field} already exists`;
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found';
                break;
            default:
                statusCode = 400;
                message = 'Database operation failed';
        }
    }
    // 处理 Zod 验证错误
    if (err instanceof zod_1.ZodError) {
        statusCode = 422;
        message = 'Validation failed';
        errors = err.errors.reduce((acc, error) => {
            const field = error.path.join('.');
            if (!acc[field]) {
                acc[field] = [];
            }
            acc[field].push(error.message);
            return acc;
        }, {});
    }
    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // 开发环境下输出错误堆栈
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }
    // 发送错误响应
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map