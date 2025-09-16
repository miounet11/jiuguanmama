import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const method = req.method
    const url = req.originalUrl
    const status = res.statusCode
    const ip = req.ip || req.connection.remoteAddress
    
    const color = status >= 500 ? '\x1b[31m' : // 红色
                  status >= 400 ? '\x1b[33m' : // 黄色
                  status >= 300 ? '\x1b[36m' : // 青色
                  status >= 200 ? '\x1b[32m' : // 绿色
                  '\x1b[0m' // 默认
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${color}${method} ${url} ${status}\x1b[0m - ${duration}ms - ${ip}`
      )
    }
  })
  
  next()
}