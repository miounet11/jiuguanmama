import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    username: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      username: string
    }
    
    // 验证用户是否存在且有效
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true
      }
    })
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication'
      })
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    }
    
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      })
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    })
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string
        email: string
        username: string
      }
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true
        }
      })
      
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username
        }
      }
    }
    
    next()
  } catch (error) {
    // 忽略错误，继续处理请求
    next()
  }
}