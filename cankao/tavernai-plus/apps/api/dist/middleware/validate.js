"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema, source = 'body') => {
    return async (req, res, next) => {
        try {
            let dataToValidate;
            switch (source) {
                case 'query':
                    dataToValidate = req.query;
                    break;
                case 'params':
                    dataToValidate = req.params;
                    break;
                case 'body':
                default:
                    dataToValidate = req.body;
                    break;
            }
            await schema.parseAsync(dataToValidate);
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