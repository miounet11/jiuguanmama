import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// 用户人格接口
interface UserPersona {
  id: string
  userId: string
  name: string
  description: string
  avatar?: string
  personality: string
  background: string
  speakingStyle: string
  interests: string[]
  traits: string[]
  systemPrompt: string
  isDefault: boolean
  isActive: boolean
  metadata: {
    category: string
    tags: string[]
    useCount: number
    lastUsed?: string
  }
  createdAt: string
  updatedAt: string
}

// 内置人格模板
const BUILTIN_PERSONAS: Omit<UserPersona, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "默认用户",
    description: "标准用户人格，适合大多数对话场景",
    personality: "友好、好奇、善于交流",
    background: "一个对世界充满好奇心的普通用户",
    speakingStyle: "自然、轻松、偶尔幽默",
    interests: ["技术", "娱乐", "学习"],
    traits: ["好奇", "友善", "开放"],
    systemPrompt: "你是一个友好、好奇的用户，喜欢与AI角色进行有趣的对话。",
    isDefault: true,
    isActive: true,
    metadata: {
      category: "general",
      tags: ["默认", "通用"],
      useCount: 0
    }
  },
  {
    name: "学者型",
    description: "喜欢深入研究和学术讨论的知识分子",
    personality: "理性、严谨、求知欲强",
    background: "拥有丰富学术背景，热爱学习和研究",
    speakingStyle: "正式、精确、逻辑清晰",
    interests: ["科学", "哲学", "历史", "文学"],
    traits: ["理性", "严谨", "博学"],
    systemPrompt: "你是一个学者型的用户，喜欢深入的学术讨论，总是以理性和逻辑的方式思考问题。",
    isDefault: false,
    isActive: true,
    metadata: {
      category: "academic",
      tags: ["学术", "知识", "理性"],
      useCount: 0
    }
  },
  {
    name: "创意艺术家",
    description: "富有创造力和想象力的艺术工作者",
    personality: "感性、创新、热情",
    background: "从事创意工作，对美和艺术有独特见解",
    speakingStyle: "富有诗意、感性、充满想象力",
    interests: ["艺术", "设计", "音乐", "文学"],
    traits: ["创意", "感性", "独特"],
    systemPrompt: "你是一个富有创造力的艺术家，总是从独特的角度看待世界，喜欢用富有想象力的方式表达自己。",
    isDefault: false,
    isActive: true,
    metadata: {
      category: "creative",
      tags: ["艺术", "创意", "想象力"],
      useCount: 0
    }
  },
  {
    name: "科技极客",
    description: "对新技术充满热情的技术爱好者",
    personality: "逻辑性强、追求效率、喜欢探索",
    background: "技术背景深厚，对最新科技发展了如指掌",
    speakingStyle: "技术用词准确、逻辑清晰、偶尔使用专业术语",
    interests: ["编程", "AI", "科技产品", "创新"],
    traits: ["逻辑", "专业", "创新"],
    systemPrompt: "你是一个科技爱好者，对新技术充满热情，喜欢从技术角度分析问题，经常使用准确的专业术语。",
    isDefault: false,
    isActive: true,
    metadata: {
      category: "technology",
      tags: ["科技", "技术", "创新"],
      useCount: 0
    }
  },
  {
    name: "冒险探索者",
    description: "热爱冒险和探索未知世界的勇敢者",
    personality: "勇敢、冒险、乐观",
    background: "经历过各种冒险，对未知世界充满向往",
    speakingStyle: "充满活力、积极向上、偶尔夸张",
    interests: ["旅行", "探险", "户外运动", "文化"],
    traits: ["勇敢", "乐观", "好奇"],
    systemPrompt: "你是一个热爱冒险的探索者，对新的体验和未知的领域充满热情，总是积极向上。",
    isDefault: false,
    isActive: true,
    metadata: {
      category: "adventure",
      tags: ["冒险", "探索", "积极"],
      useCount: 0
    }
  },
  {
    name: "温暖治愈师",
    description: "善于倾听和提供情感支持的温暖存在",
    personality: "温和、善解人意、富有同情心",
    background: "拥有丰富的人生阅历，善于理解他人的情感",
    speakingStyle: "温和、关怀、富有同理心",
    interests: ["心理学", "人际关系", "情感交流", "成长"],
    traits: ["温暖", "善解人意", "有耐心"],
    systemPrompt: "你是一个温暖的人，善于倾听和理解他人，总是能够提供情感支持和关怀。",
    isDefault: false,
    isActive: true,
    metadata: {
      category: "supportive",
      tags: ["温暖", "治愈", "支持"],
      useCount: 0
    }
  }
]

// 获取用户的所有人格
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { includeBuiltin = true } = req.query

    // TODO: 从数据库获取用户自定义人格
    const customPersonas: UserPersona[] = []

    let allPersonas: UserPersona[] = [...customPersonas]

    // 添加内置人格模板
    if (includeBuiltin) {
      const builtinWithIds = BUILTIN_PERSONAS.map((persona, index) => ({
        id: `builtin_${index}`,
        userId: req.user!.id,
        ...persona,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      allPersonas = [...builtinWithIds, ...customPersonas]
    }

    res.json({
      success: true,
      personas: allPersonas,
      total: allPersonas.length,
      categories: ['general', 'academic', 'creative', 'technology', 'adventure', 'supportive']
    })
  } catch (error) {
    next(error)
  }
})

// 获取单个人格详情
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // 检查是否是内置人格
    if (id.startsWith('builtin_')) {
      const index = parseInt(id.replace('builtin_', ''))
      const persona = BUILTIN_PERSONAS[index]

      if (!persona) {
        return res.status(404).json({
          success: false,
          message: '人格不存在'
        })
      }

      res.json({
        success: true,
        persona: {
          id,
          userId: req.user!.id,
          ...persona,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
      return
    }

    // TODO: 从数据库获取用户自定义人格
    res.status(404).json({
      success: false,
      message: '人格不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 创建新人格
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      name,
      description,
      personality,
      background,
      speakingStyle,
      interests = [],
      traits = [],
      systemPrompt,
      isDefault = false,
      metadata = {}
    } = req.body

    // 验证必要字段
    if (!name || !personality || !systemPrompt) {
      return res.status(400).json({
        success: false,
        message: '名称、性格描述和系统提示词不能为空'
      })
    }

    // 如果设置为默认人格，需要将其他人格的默认状态取消
    if (isDefault) {
      // TODO: 更新数据库中其他人格的isDefault为false
    }

    const newPersona: UserPersona = {
      id: `persona_${Date.now()}`,
      userId: req.user!.id,
      name,
      description: description || '',
      personality,
      background: background || '',
      speakingStyle: speakingStyle || '',
      interests,
      traits,
      systemPrompt,
      isDefault,
      isActive: true,
      metadata: {
        category: metadata.category || 'custom',
        tags: metadata.tags || [],
        useCount: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // TODO: 保存到数据库

    res.json({
      success: true,
      persona: newPersona,
      message: '用户人格创建成功'
    })
  } catch (error) {
    next(error)
  }
})

// 更新人格
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // 不允许修改内置人格
    if (id.startsWith('builtin_')) {
      return res.status(403).json({
        success: false,
        message: '不能修改内置人格'
      })
    }

    // TODO: 验证人格存在和所有权
    // TODO: 更新数据库

    res.status(404).json({
      success: false,
      message: '人格不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 删除人格
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // 不允许删除内置人格
    if (id.startsWith('builtin_')) {
      return res.status(403).json({
        success: false,
        message: '不能删除内置人格'
      })
    }

    // TODO: 验证人格存在和所有权
    // TODO: 检查是否是默认人格（不能删除默认人格）
    // TODO: 从数据库删除

    res.status(404).json({
      success: false,
      message: '人格不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 设置默认人格
router.post('/:id/set-default', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // TODO: 验证人格存在
    // TODO: 将当前默认人格设为非默认
    // TODO: 设置新的默认人格

    res.json({
      success: true,
      message: '默认人格设置成功'
    })
  } catch (error) {
    next(error)
  }
})

// 克隆人格
router.post('/:id/clone', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    let sourcePersona

    // 获取源人格
    if (id.startsWith('builtin_')) {
      const index = parseInt(id.replace('builtin_', ''))
      sourcePersona = BUILTIN_PERSONAS[index]
    } else {
      // TODO: 从数据库获取
      return res.status(404).json({
        success: false,
        message: '源人格不存在'
      })
    }

    if (!sourcePersona) {
      return res.status(404).json({
        success: false,
        message: '源人格不存在'
      })
    }

    // 创建副本
    const clonedPersona: UserPersona = {
      id: `persona_${Date.now()}`,
      userId: req.user!.id,
      name: name || `${sourcePersona.name} (副本)`,
      description: description || `${sourcePersona.description} (副本)`,
      personality: sourcePersona.personality,
      background: sourcePersona.background,
      speakingStyle: sourcePersona.speakingStyle,
      interests: [...sourcePersona.interests],
      traits: [...sourcePersona.traits],
      systemPrompt: sourcePersona.systemPrompt,
      isDefault: false,
      isActive: true,
      metadata: {
        ...sourcePersona.metadata,
        category: 'custom',
        useCount: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // TODO: 保存到数据库

    res.json({
      success: true,
      persona: clonedPersona,
      message: '人格克隆成功'
    })
  } catch (error) {
    next(error)
  }
})

// 获取当前激活的人格
router.get('/active/current', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // TODO: 从用户设置或会话中获取当前激活的人格
    // 如果没有设置，返回默认人格

    const defaultPersona = {
      id: 'builtin_0',
      userId: req.user!.id,
      ...BUILTIN_PERSONAS[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    res.json({
      success: true,
      persona: defaultPersona
    })
  } catch (error) {
    next(error)
  }
})

// 激活人格（用于当前会话）
router.post('/:id/activate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // TODO: 验证人格存在
    // TODO: 在会话中设置激活的人格ID
    // TODO: 更新使用计数

    res.json({
      success: true,
      message: '人格激活成功'
    })
  } catch (error) {
    next(error)
  }
})

export default router
