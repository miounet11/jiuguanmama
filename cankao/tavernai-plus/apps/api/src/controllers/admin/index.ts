// Admin controllers index
export * from './user'
export * from './system'
export * from './log'
export * from './stats'
export * from './model'

// Temporary admin controller for dashboard
export const adminController = {
  getDashboard: async (req: any, res: any) => {
    res.status(501).json({ message: 'Dashboard not implemented yet' })
  }
}