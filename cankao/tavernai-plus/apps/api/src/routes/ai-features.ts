import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { guidanceService } from '../services/guidance'
import { summonService } from '../services/summon'
import { worldInfoService } from '../services/worldinfo'
import { storybookService } from '../services/storybook'
import { characterGeneratorService } from '../services/character-generator'
import { prisma } from '../server'

const router = Router()

// ==================== 指导回复 API ====================

/**
 * 应用指导回复
 */
router.post('/guidance/apply', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId, messageId, guidance } = req.body

    // 构建指导提示
    const guidancePrompt = guidanceService.buildGuidancePrompt({
      sessionId,
      messageId,
      guidance
    })

    // 保存指导历史
    if (messageId) {
      await guidanceService.saveGuidanceHistory(sessionId, messageId, guidance)
    }

    res.json({
      success: true,
      guidancePrompt,
      message: '指导已应用，将影响下一条AI回复'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取指导建议
 */
router.get('/guidance/suggestions/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params

    // 获取会话上下文
    const recentMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const context = recentMessages.map(m => m.content).join(' ')
    const suggestions = await guidanceService.getSuggestions(sessionId, context)

    res.json({
      success: true,
      suggestions
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取指导模板
 */
router.get('/guidance/templates', authenticate, async (req: AuthRequest, res) => {
  const templates = guidanceService.getGuidanceTemplates()

  res.json({
    success: true,
    templates
  })
})

// ==================== 召唤角色 API ====================

/**
 * 召唤角色
 */
router.post('/summon/character', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId, characterId, summonType, context } = req.body

    const result = await summonService.summonCharacter({
      sessionId,
      characterId,
      summonType,
      context
    })

    res.json({
      success: true,
      result
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取可召唤的角色
 */
router.get('/summon/available/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params
    const characters = await summonService.getSummonableCharacters(
      sessionId,
      req.user!.id
    )

    res.json({
      success: true,
      characters
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取自动召唤建议
 */
router.post('/summon/suggestions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId, context } = req.body
    const suggestions = await summonService.getAutoSummonSuggestions(sessionId, context)

    res.json({
      success: true,
      suggestions
    })
  } catch (error) {
    next(error)
  }
})

// ==================== 世界观/知识库 API ====================

/**
 * 创建世界观
 */
router.post('/worldinfo/create', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const worldInfo = await worldInfoService.createWorldInfo(
      req.user!.id,
      req.body
    )

    res.json({
      success: true,
      worldInfo
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 添加知识条目
 */
router.post('/worldinfo/:worldInfoId/entry', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { worldInfoId } = req.params
    const entry = await worldInfoService.addEntry(worldInfoId, req.body)

    res.json({
      success: true,
      entry
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 扫描并激活知识
 */
router.post('/worldinfo/scan', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { worldInfoId, messages, settings } = req.body
    const activatedEntries = await worldInfoService.scanAndActivate(
      worldInfoId,
      messages,
      settings
    )

    res.json({
      success: true,
      activatedEntries
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 导入世界观
 */
router.post('/worldinfo/import', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { data, format } = req.body
    const worldInfo = await worldInfoService.importWorldInfo(
      req.user!.id,
      data,
      format
    )

    res.json({
      success: true,
      worldInfo
    })
  } catch (error) {
    next(error)
  }
})

// ==================== 故事书 API ====================

/**
 * 创建故事书
 */
router.post('/storybook/create', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { characterId, ...data } = req.body
    const storybook = await storybookService.createStorybook(characterId, data)

    res.json({
      success: true,
      storybook
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 检查并激活故事条目
 */
router.post('/storybook/check', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const context = {
      ...req.body,
      flags: new Set(req.body.flags || []),
      activationCount: new Map()
    }

    const entry = await storybookService.checkAndActivate(context)

    if (entry) {
      const formattedMessage = storybookService.formatEntryAsMessage(entry)

      res.json({
        success: true,
        activated: true,
        entry,
        message: formattedMessage
      })
    } else {
      res.json({
        success: true,
        activated: false
      })
    }
  } catch (error) {
    next(error)
  }
})

/**
 * 生成分支选项
 */
router.post('/storybook/branches', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { entry, context } = req.body
    const options = await storybookService.generateBranchingOptions(
      entry,
      {
        ...context,
        flags: new Set(context.flags || []),
        activationCount: new Map()
      }
    )

    res.json({
      success: true,
      options
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取故事书模板
 */
router.get('/storybook/templates', authenticate, async (req: AuthRequest, res) => {
  const templates = storybookService.getTemplates()

  res.json({
    success: true,
    templates
  })
})

// ==================== AI 角色生成 API ====================

/**
 * 生成角色
 */
router.post('/generate/character', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const character = await characterGeneratorService.generateCharacter(
      req.body,
      req.user!.id
    )

    res.json({
      success: true,
      character
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 生成开场白
 */
router.post('/generate/first-message', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { character, context } = req.body
    const message = await characterGeneratorService.generateFirstMessage(
      character,
      context
    )

    res.json({
      success: true,
      message
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 优化角色设定
 */
router.post('/generate/enhance', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { character, aspects } = req.body
    const enhanced = await characterGeneratorService.enhanceCharacter(
      character,
      aspects
    )

    res.json({
      success: true,
      character: enhanced
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 生成角色头像
 */
router.post('/generate/avatar', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { character, style } = req.body
    const avatar = await characterGeneratorService.generateAvatar(character, style)

    res.json({
      success: true,
      avatar
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取生成模板
 */
router.get('/generate/templates', authenticate, async (req: AuthRequest, res) => {
  const templates = characterGeneratorService.getTemplates()

  res.json({
    success: true,
    templates
  })
})

export default router
