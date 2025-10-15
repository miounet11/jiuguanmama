"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = validateSchema;
exports.validateQueryParams = validateQueryParams;
exports.validateParams = validateParams;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const express_validator_1 = require("express-validator");
function validateSchema(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                return res.status(400).json({
                    error: '数据验证失败',
                    details: validationErrors
                });
            }
            console.error('Validation middleware error:', error);
            res.status(500).json({ error: '服务器内部错误' });
        }
    };
}
function validateQueryParams(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                return res.status(400).json({
                    error: '查询参数验证失败',
                    details: validationErrors
                });
            }
            console.error('Query validation middleware error:', error);
            res.status(500).json({ error: '服务器内部错误' });
        }
    };
}
function validateParams(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                return res.status(400).json({
                    error: '路径参数验证失败',
                    details: validationErrors
                });
            }
            console.error('Params validation middleware error:', error);
            res.status(500).json({ error: '服务器内部错误' });
        }
    };
}
// Express-validator middleware for processing validation results
function validateRequest(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map(err => ({
            field: err.type === 'field' ? err.path : err.type,
            message: err.msg,
            value: err.type === 'field' ? err.value : undefined
        }));
        return res.status(400).json({
            error: '输入验证失败',
            details: validationErrors
        });
    }
    next();
}
//# sourceMappingURL=validation.js.map