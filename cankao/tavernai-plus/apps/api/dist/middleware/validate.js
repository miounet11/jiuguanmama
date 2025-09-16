"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.reduce((acc, err) => {
                    const field = err.path.join('.');
                    if (!acc[field]) {
                        acc[field] = [];
                    }
                    acc[field].push(err.message);
                    return acc;
                }, {});
                return res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map