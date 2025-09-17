import { Request, Response } from 'express'
import { prisma } from '../../server'

export const getSystemInfo = async (req: Request, res: Response) => {
  try {
    res.status(501).json({ message: 'Not implemented yet' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}