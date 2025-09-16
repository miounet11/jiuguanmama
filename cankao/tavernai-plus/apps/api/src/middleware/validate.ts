import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const field = err.path.join('.')
          if (!acc[field]) {
            acc[field] = []
          }
          acc[field].push(err.message)
          return acc
        }, {} as Record<string, string[]>)
        
        return res.status(422).json({
          success: false,
          message: 'Validation failed',
          errors
        })
      }
      next(error)
    }
  }
}