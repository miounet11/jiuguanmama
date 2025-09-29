import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { validationResult } from 'express-validator';

export function validateSchema(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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

export function validateQueryParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
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
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

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
