import { Request, Response, NextFunction } from 'express'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { ZodError } from 'zod'

export interface ApiError extends Error {
  statusCode?: number
  errors?: any
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'
  let errors = err.errors || null
  
  // 处理 Prisma 错误
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409
        const field = (err.meta?.target as string[])?.[0]
        message = `${field} already exists`
        break
      case 'P2025':
        statusCode = 404
        message = 'Record not found'
        break
      default:
        statusCode = 400
        message = 'Database operation failed'
    }
  }
  
  // 处理 Zod 验证错误
  if (err instanceof ZodError) {
    statusCode = 422
    message = 'Validation failed'
    errors = err.errors.reduce((acc, error) => {
      const field = error.path.join('.')
      if (!acc[field]) {
        acc[field] = []
      }
      acc[field].push(error.message)
      return acc
    }, {} as Record<string, string[]>)
  }
  
  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }
  
  // 开发环境下输出错误堆栈
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err)
  }
  
  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}