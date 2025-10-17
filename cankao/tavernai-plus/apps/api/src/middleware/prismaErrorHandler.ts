import { Request, Response, NextFunction } from 'express'
const { Prisma } = require('../../node_modules/.prisma/client')

export const prismaErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 处理Prisma相关错误
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // 唯一约束冲突
        const target = error.meta?.target as string[]
        const field = target ? target[0] : '字段'
        return res.status(409).json({
          success: false,
          message: `${field}已存在，请使用不同的值`,
          field,
          code: 'UNIQUE_CONSTRAINT_VIOLATION'
        })

      case 'P2025':
        // 记录未找到
        return res.status(404).json({
          success: false,
          message: '请求的资源不存在',
          code: 'RECORD_NOT_FOUND'
        })

      case 'P2003':
        // 外键约束冲突
        return res.status(400).json({
          success: false,
          message: '关联的资源不存在',
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION'
        })

      case 'P2014':
        // 关联记录冲突
        return res.status(400).json({
          success: false,
          message: '无法删除，存在相关联的记录',
          code: 'RELATED_RECORDS_EXIST'
        })

      case 'P2000':
        // 值过长
        return res.status(400).json({
          success: false,
          message: '输入的值过长，请检查字段长度限制',
          code: 'VALUE_TOO_LONG'
        })

      case 'P2001':
        // 记录不存在
        return res.status(404).json({
          success: false,
          message: '指定的记录不存在',
          code: 'RECORD_DOES_NOT_EXIST'
        })

      case 'P2004':
        // 约束失败
        return res.status(400).json({
          success: false,
          message: '数据约束验证失败',
          code: 'CONSTRAINT_VALIDATION_FAILED'
        })

      case 'P2012':
        // 缺少必需值
        return res.status(400).json({
          success: false,
          message: '缺少必需的字段值',
          code: 'MISSING_REQUIRED_VALUE'
        })

      case 'P2013':
        // 缺少必需的参数
        return res.status(400).json({
          success: false,
          message: '缺少必需的参数',
          code: 'MISSING_REQUIRED_ARGUMENT'
        })

      default:
        return res.status(400).json({
          success: false,
          message: '数据库操作失败',
          code: 'DATABASE_ERROR',
          details: error.message
        })
    }
  }

  // 处理Prisma验证错误
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      details: error.message
    })
  }

  // 处理Prisma未知错误
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return res.status(500).json({
      success: false,
      message: '数据库查询异常',
      code: 'UNKNOWN_DATABASE_ERROR',
      details: error.message
    })
  }

  // 如果不是Prisma错误，交给下一个错误处理器
  next(error)
}