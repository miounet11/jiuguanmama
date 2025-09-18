import { Router } from 'express'
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../server'

const router = Router()

// 预设配置接口
interface ChatPreset {
  id: string
  name: string
  description: string
  isPublic: boolean
  createdBy: string
  parameters: {
    temperature: number
    topP: number
    topK?: number
    frequencyPenalty: number
    presencePenalty: number
    maxTokens: number
    stopSequences: string[]
    repetitionPenalty?: number
    minLength?: number
    doSample?: boolean
    seed?: number
  }
  metadata: {
    category: string
    tags: string[]
    useCase: string
    aiModel: string
    version: number
  }
}

// SillyTavern经典预设
const BUILTIN_PRESETS: Omit<ChatPreset, 'id' | 'createdBy'>[] = [
  {
    name: "Creative Writing",
    description: "高创意写作模式，适合故事创作和诗歌",
    isPublic: true,
    parameters: {
      temperature: 0.9,
      topP: 0.9,
      topK: 40,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      maxTokens: 2048,
      stopSequences: [],
      repetitionPenalty: 1.02,
      minLength: 10
    },
    metadata: {
      category: "creative",
      tags: ["写作", "创意", "故事"],
      useCase: "creative_writing",
      aiModel: "any",
      version: 1
    }
  },
  {
    name: "Roleplay Enhanced",
    description: "角色扮演增强模式，保持角色一致性",
    isPublic: true,
    parameters: {
      temperature: 0.8,
      topP: 0.85,
      topK: 35,
      frequencyPenalty: 0.05,
      presencePenalty: 0.05,
      maxTokens: 1024,
      stopSequences: ["\\n\\n\\n"],
      repetitionPenalty: 1.05,
      minLength: 5
    },
    metadata: {
      category: "roleplay",
      tags: ["角色扮演", "对话", "一致性"],
      useCase: "character_roleplay",
      aiModel: "any",
      version: 1
    }
  },
  {
    name: "Precise Assistant",
    description: "精确助手模式，准确回答问题",
    isPublic: true,
    parameters: {
      temperature: 0.3,
      topP: 0.6,
      topK: 20,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      maxTokens: 1024,
      stopSequences: [],
      repetitionPenalty: 1.0,
      minLength: 1
    },
    metadata: {
      category: "assistant",
      tags: ["精确", "助手", "问答"],
      useCase: "qa_assistant",
      aiModel: "any",
      version: 1
    }
  },
  {
    name: "Dynamic Conversation",
    description: "动态对话模式，富有变化的交流",
    isPublic: true,
    parameters: {
      temperature: 0.85,
      topP: 0.9,
      topK: 50,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
      maxTokens: 1536,
      stopSequences: [],
      repetitionPenalty: 1.08,
      minLength: 8
    },
    metadata: {
      category: "conversation",
      tags: ["对话", "动态", "变化"],
      useCase: "dynamic_chat",
      aiModel: "any",
      version: 1
    }
  },
  {
    name: "Logical Thinking",
    description: "逻辑思维模式，适合推理和分析",
    isPublic: true,
    parameters: {
      temperature: 0.4,
      topP: 0.7,
      topK: 25,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      maxTokens: 2048,
      stopSequences: ["结论:", "总结:"],
      repetitionPenalty: 1.0,
      minLength: 20
    },
    metadata: {
      category: "analytical",
      tags: ["逻辑", "推理", "分析"],
      useCase: "logical_analysis",
      aiModel: "any",
      version: 1
    }
  },
  {
    name: "Emotional Support",
    description: "情感支持模式，温暖和共情",
    isPublic: true,
    parameters: {
      temperature: 0.7,
      topP: 0.8,
      topK: 30,
      frequencyPenalty: 0.0,
      presencePenalty: 0.05,
      maxTokens: 1024,
      stopSequences: [],
      repetitionPenalty: 1.03,
      minLength: 15
    },
    metadata: {
      category: "support",
      tags: ["情感", "支持", "共情"],
      useCase: "emotional_support",
      aiModel: "any",
      version: 1
    }
  }
]

// 获取所有预设
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, aiModel, includePrivate = false } = req.query

    // 构建查询条件
    const where: any = {}

    if (!includePrivate || !req.user) {
      where.OR = [
        { isPublic: true },
        { createdBy: req.user?.id || 'system' }
      ]
    }

    if (category) {
      where.metadata = {
        path: ['category'],
        equals: category
      }
    }

    // 获取用户自定义预设（如果存在数据库表）
    const customPresets: any[] = [] // TODO: 从数据库获取

    // 合并内置预设和用户预设
    const builtinWithIds = BUILTIN_PRESETS.map((preset, index) => ({
      id: `builtin_${index}`,
      createdBy: 'system',
      ...preset
    }))

    let allPresets = [...builtinWithIds, ...customPresets]

    // 过滤
    if (category) {
      allPresets = allPresets.filter(p => p.metadata.category === category)
    }

    if (aiModel) {
      allPresets = allPresets.filter(p =>
        p.metadata.aiModel === 'any' || p.metadata.aiModel === aiModel
      )
    }

    res.json({
      success: true,
      presets: allPresets,
      categories: ['creative', 'roleplay', 'assistant', 'conversation', 'analytical', 'support'],
      total: allPresets.length
    })
  } catch (error) {
    next(error)
  }
})

// 获取单个预设
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // 检查是否是内置预设
    if (id.startsWith('builtin_')) {
      const index = parseInt(id.replace('builtin_', ''))
      const preset = BUILTIN_PRESETS[index]

      if (!preset) {
        return res.status(404).json({
          success: false,
          message: '预设不存在'
        })
      }

      res.json({
        success: true,
        preset: {
          id,
          createdBy: 'system',
          ...preset
        }
      })
      return
    }

    // TODO: 从数据库获取用户自定义预设
    res.status(404).json({
      success: false,
      message: '预设不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 创建新预设
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      name,
      description,
      isPublic = false,
      parameters,
      metadata
    } = req.body

    // 验证参数
    if (!name || !parameters || !metadata) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      })
    }

    // 验证参数范围
    const errors = []
    if (parameters.temperature < 0 || parameters.temperature > 2) {
      errors.push('temperature必须在0-2之间')
    }
    if (parameters.topP < 0 || parameters.topP > 1) {
      errors.push('topP必须在0-1之间')
    }
    if (parameters.frequencyPenalty < -2 || parameters.frequencyPenalty > 2) {
      errors.push('frequencyPenalty必须在-2到2之间')
    }
    if (parameters.presencePenalty < -2 || parameters.presencePenalty > 2) {
      errors.push('presencePenalty必须在-2到2之间')
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors
      })
    }

    // TODO: 保存到数据库
    const newPreset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      isPublic,
      createdBy: req.user!.id,
      parameters,
      metadata: {
        ...metadata,
        version: 1
      },
      createdAt: new Date().toISOString()
    }

    res.json({
      success: true,
      preset: newPreset,
      message: '预设创建成功'
    })
  } catch (error) {
    next(error)
  }
})

// 更新预设
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // 不允许修改内置预设
    if (id.startsWith('builtin_')) {
      return res.status(403).json({
        success: false,
        message: '不能修改内置预设'
      })
    }

    // TODO: 从数据库查找并更新预设
    res.status(404).json({
      success: false,
      message: '预设不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 删除预设
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // 不允许删除内置预设
    if (id.startsWith('builtin_')) {
      return res.status(403).json({
        success: false,
        message: '不能删除内置预设'
      })
    }

    // TODO: 从数据库删除预设
    res.status(404).json({
      success: false,
      message: '预设不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 复制预设
router.post('/:id/clone', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    let sourcePreset

    // 获取源预设
    if (id.startsWith('builtin_')) {
      const index = parseInt(id.replace('builtin_', ''))
      sourcePreset = BUILTIN_PRESETS[index]
    } else {
      // TODO: 从数据库获取
      return res.status(404).json({
        success: false,
        message: '源预设不存在'
      })
    }

    if (!sourcePreset) {
      return res.status(404).json({
        success: false,
        message: '源预设不存在'
      })
    }

    // 创建副本
    const clonedPreset = {
      id: `custom_${Date.now()}`,
      name: name || `${sourcePreset.name} (副本)`,
      description: description || `${sourcePreset.description} (副本)`,
      isPublic: false,
      createdBy: req.user!.id,
      parameters: { ...sourcePreset.parameters },
      metadata: {
        ...sourcePreset.metadata,
        version: 1
      },
      createdAt: new Date().toISOString()
    }

    res.json({
      success: true,
      preset: clonedPreset,
      message: '预设克隆成功'
    })
  } catch (error) {
    next(error)
  }
})

// 测试预设
router.post('/:id/test', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const { message = "你好，请简单介绍一下自己。" } = req.body

    // 获取预设
    let preset
    if (id.startsWith('builtin_')) {
      const index = parseInt(id.replace('builtin_', ''))
      preset = BUILTIN_PRESETS[index]
    } else {
      // TODO: 从数据库获取
      return res.status(404).json({
        success: false,
        message: '预设不存在'
      })
    }

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: '预设不存在'
      })
    }

    // TODO: 使用预设参数调用AI
    const testResult = {
      presetName: preset.name,
      parameters: preset.parameters,
      testMessage: message,
      response: "测试响应：根据当前预设参数生成的AI回复...",
      timestamp: new Date().toISOString(),
      responseTime: 1500
    }

    res.json({
      success: true,
      test: testResult
    })
  } catch (error) {
    next(error)
  }
})

export default router
