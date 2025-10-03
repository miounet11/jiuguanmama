"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
exports.validateSchema = validateSchema;
exports.validateQueryParams = validateQueryParams;
exports.validateParams = validateParams;
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
// Express-validator based validation middleware
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: '验证失败',
            details: errors.array()
        });
    }
    next();
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map