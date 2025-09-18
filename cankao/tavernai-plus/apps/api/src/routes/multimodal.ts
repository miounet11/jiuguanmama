import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'
import multimodalAI from '../services/multimodalAI'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'

const router = Router()
const prisma = new PrismaClient()

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp')
    await fs.mkdir(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB限制
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|m4a|flac|ogg/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

// 文本生成
router.post('/text/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      prompt,
      characterId,
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt
    } = req.body

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: '提示词不能为空' })
    }

    if (prompt.length > 4000) {
      return res.status(400).json({ error: '提示词长度不能超过4000字符' })
    }

    const result = await multimodalAI.generateText(prompt, {
      userId,
      characterId,
      model,
      temperature,
      maxTokens,
      systemPrompt
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('文本生成失败:', error)
    res.status(500).json({
      error: '文本生成失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 语音合成
router.post('/voice/synthesize', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { text, characterId, voiceConfig } = req.body

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: '文本内容不能为空' })
    }

    if (text.length > 4000) {
      return res.status(400).json({ error: '文本长度不能超过4000字符' })
    }

    const result = await multimodalAI.synthesizeSpeech(text, {
      userId,
      characterId,
      voiceConfig
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('语音合成失败:', error)
    res.status(500).json({
      error: '语音合成失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 语音转文字
router.post('/voice/transcribe', authenticate, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { language } = req.body

    if (!req.file) {
      return res.status(400).json({ error: '请上传音频文件' })
    }

    const result = await multimodalAI.transcribeAudio(req.file.path, {
      userId,
      language
    })

    // 清理临时文件
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('语音转文字失败:', error)

    // 清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError)
      }
    }

    res.status(500).json({
      error: '语音转文字失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 图像生成
router.post('/image/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { prompt, characterId, imageConfig } = req.body

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: '图像描述不能为空' })
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ error: '图像描述长度不能超过1000字符' })
    }

    const result = await multimodalAI.generateImage(prompt, {
      userId,
      characterId,
      imageConfig
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('图像生成失败:', error)
    res.status(500).json({
      error: '图像生成失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 图像分析
router.post('/image/analyze', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { prompt = '请描述这张图片的内容', characterId } = req.body

    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' })
    }

    // 将本地文件转换为可访问的URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/temp/${req.file.filename}`

    const result = await multimodalAI.analyzeImage(imageUrl, prompt, {
      userId,
      characterId
    })

    // 清理临时文件
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('图像分析失败:', error)

    // 清理临时文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        console.error('清理临时文件失败:', cleanupError)
      }
    }

    res.status(500).json({
      error: '图像分析失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取可用模型列表
router.get('/models', async (req: Request, res: Response) => {
  try {
    const models = await multimodalAI.getAvailableModels()
    res.json({
      success: true,
      data: models
    })
  } catch (error) {
    console.error('获取模型列表失败:', error)
    res.status(500).json({
      error: '获取模型列表失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取使用统计
router.get('/usage', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { startDate, endDate } = req.query

    const timeRange = {
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 默认30天前
      endDate: endDate ? new Date(endDate as string) : new Date() // 默认今天
    }

    const stats = await multimodalAI.getUsageStats(userId, timeRange)
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('获取使用统计失败:', error)
    res.status(500).json({
      error: '获取使用统计失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取用户的语音配置列表
router.get('/voice/profiles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { characterId } = req.query

    const whereClause: any = {
      isActive: true
    }

    if (characterId) {
      whereClause.characterId = characterId as string
    } else {
      whereClause.userId = userId
    }

    const profiles = await prisma.voiceProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        character: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    res.json({
      success: true,
      data: profiles
    })
  } catch (error) {
    console.error('获取语音配置失败:', error)
    res.status(500).json({
      error: '获取语音配置失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 创建语音配置
router.post('/voice/profiles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { name, characterId, provider, voiceId, config, isDefault } = req.body

    if (!name || !provider || !voiceId || !config) {
      return res.status(400).json({ error: '缺少必要的配置参数' })
    }

    // 如果设置为默认，先取消其他默认配置
    if (isDefault) {
      const whereClause: any = { isDefault: true }
      if (characterId) {
        whereClause.characterId = characterId
      } else {
        whereClause.userId = userId
        whereClause.characterId = null
      }

      await prisma.voiceProfile.updateMany({
        where: whereClause,
        data: { isDefault: false }
      })
    }

    const profile = await prisma.voiceProfile.create({
      data: {
        name,
        userId: characterId ? null : userId,
        characterId,
        provider,
        voiceId,
        config: JSON.stringify(config),
        isDefault: isDefault || false
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        character: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: profile
    })
  } catch (error) {
    console.error('创建语音配置失败:', error)
    res.status(500).json({
      error: '创建语音配置失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取用户的图像生成历史
router.get('/image/generations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const { characterId, isPublic } = req.query
    const skip = (page - 1) * limit

    const whereClause: any = {
      userId
    }

    if (characterId) {
      whereClause.characterId = characterId as string
    }

    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic === 'true'
    }

    const generations = await prisma.imageGeneration.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        character: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.imageGeneration.count({
      where: whereClause
    })

    res.json({
      success: true,
      data: {
        generations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取图像生成历史失败:', error)
    res.status(500).json({
      error: '获取图像生成历史失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取AI请求历史
router.get('/requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const { type, status } = req.query
    const skip = (page - 1) * limit

    const whereClause: any = {
      userId
    }

    if (type) {
      whereClause.type = type as string
    }

    if (status) {
      whereClause.status = status as string
    }

    const requests = await prisma.aIRequest.findMany({
      where: whereClause,
      include: {
        character: {
          select: {
            id: true,
            name: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.aIRequest.count({
      where: whereClause
    })

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取AI请求历史失败:', error)
    res.status(500).json({
      error: '获取AI请求历史失败',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 健康检查
router.get('/health', async (req: Request, res: Response) => {
  try {
    const models = await multimodalAI.getAvailableModels()
    res.json({
      success: true,
      status: 'healthy',
      services: {
        text: true,
        image: true,
        speech: true,
        vision: true
      },
      models,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: '多模态AI服务不可用'
    })
  }
})

export default router
