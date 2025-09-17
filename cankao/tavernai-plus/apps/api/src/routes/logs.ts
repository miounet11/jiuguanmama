import { Router } from 'express'
import { errorLogger } from '../utils/errorLogger'
import fs from 'fs'
import path from 'path'

const router = Router()

// 获取最近的错误日志
router.get('/errors', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines as string) || 100
    const logs = errorLogger.getRecentLogs(lines)

    res.json({
      success: true,
      logs,
      count: logs.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error logs'
    })
  }
})

// 获取所有日志文件列表
router.get('/files', async (req, res) => {
  try {
    const logsDir = path.join(process.cwd(), 'logs')

    if (!fs.existsSync(logsDir)) {
      return res.json({
        success: true,
        files: []
      })
    }

    const files = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(logsDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime
        }
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime())

    res.json({
      success: true,
      files
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch log files'
    })
  }
})

// 清理旧日志
router.delete('/clean', async (req, res) => {
  try {
    errorLogger.cleanOldLogs()
    res.json({
      success: true,
      message: 'Old logs cleaned successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clean old logs'
    })
  }
})

export default router
