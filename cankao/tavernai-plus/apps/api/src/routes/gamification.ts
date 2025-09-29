import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

// 验证模式
const affinityUpdateSchema = z.object({
  characterId: z.string(),
  affinityPoints: z.number().min(0).max(100),
  interactionType: z.string().optional()
})

const scenarioProgressUpdateSchema = z.object({
  scenarioId: z.string(),
  progressPercentage: z.number().min(0).max(1),
  sessionTime: z.number().optional(),
  messagesCount: z.number().optional(),
  tokensUsed: z.number().optional()
})

const proficiencyUpdateSchema = z.object({
  characterId: z.string(),
  proficiencyPoints: z.number().min(0),
  interactionType: z.string(),
  success: z.boolean().optional()
})

// ==================== 亲密度系统 ====================

// 获取用户与角色的亲密度
router.get('/affinity/:characterId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params
    const userId = req.user!.id

    const affinity = await prisma.characterAffinity.findUnique({
      where: {
        userId_characterId: { userId, characterId }
      },
      include: {
        character: {
          select: {
            name: true,
            avatar: true,
            description: true
          }
        }
      }
    })

    if (!affinity) {
      // 如果不存在，创建初始亲密度记录
      const newAffinity = await prisma.characterAffinity.create({
        data: {
          userId,
          characterId,
          affinityLevel: 1,
          relationshipType: 'stranger'
        },
        include: {
          character: {
            select: {
              name: true,
              avatar: true,
              description: true
            }
          }
        }
      })

      return res.json({
        success: true,
        affinity: newAffinity
      })
    }

    res.json({
      success: true,
      affinity
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取亲密度信息失败'
    })
  }
})

// 更新角色亲密度
router.post('/affinity/update', authenticate, validate(affinityUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const { characterId, affinityPoints, interactionType } = req.body
    const userId = req.user!.id

    // 获取或创建亲密度记录
    let affinity = await prisma.characterAffinity.findUnique({
      where: {
        userId_characterId: { userId, characterId }
      }
    })

    if (!affinity) {
      affinity = await prisma.characterAffinity.create({
        data: {
          userId,
          characterId,
          affinityLevel: 1,
          affinityPoints: 0,
          relationshipType: 'stranger'
        }
      })
    }

    // 计算新的亲密度
    const newPoints = affinity.affinityPoints + affinityPoints
    const newLevel = Math.min(10, Math.floor(newPoints / 100) + 1)
    const relationshipTypes = ['stranger', 'acquaintance', 'friend', 'close_friend', 'best_friend', 'soulmate']
    const newRelationshipType = relationshipTypes[Math.min(newLevel - 1, relationshipTypes.length - 1)]

    // 更新亲密度
    const updatedAffinity = await prisma.characterAffinity.update({
      where: { id: affinity.id },
      data: {
        affinityPoints: newPoints,
        affinityLevel: newLevel,
        relationshipType: newRelationshipType,
        lastInteractionAt: new Date(),
        unlockCount: { increment: 1 }
      },
      include: {
        character: {
          select: {
            name: true,
            avatar: true
          }
        }
      }
    })

    // 检查是否解锁成就
    await checkAffinityAchievements(userId, newLevel)

    // 记录时空记忆（如果是特殊交互）
    if (interactionType === 'special_event' || affinityPoints >= 50) {
      const memories = JSON.parse(affinity.spacetimeMemories || '[]')
      memories.push({
        timestamp: new Date(),
        type: interactionType || 'interaction',
        points: affinityPoints,
        level: newLevel
      })

      await prisma.characterAffinity.update({
        where: { id: affinity.id },
        data: {
          spacetimeMemories: JSON.stringify(memories.slice(-10)) // 只保留最近10条
        }
      })
    }

    res.json({
      success: true,
      affinity: updatedAffinity,
      leveledUp: newLevel > affinity.affinityLevel
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新亲密度失败'
    })
  }
})

// 设置角色收藏
router.post('/affinity/:characterId/favorite', authenticate, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params
    const { favorite } = req.body
    const userId = req.user!.id

    const affinity = await prisma.characterAffinity.upsert({
      where: {
        userId_characterId: { userId, characterId }
      },
      update: {
        favorite: favorite,
        lastInteractionAt: new Date()
      },
      create: {
        userId,
        characterId,
        favorite: favorite
      },
      include: {
        character: {
          select: {
            name: true,
            avatar: true
          }
        }
      }
    })

    res.json({
      success: true,
      affinity
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '设置收藏失败'
    })
  }
})

// ==================== 剧本进度系统 ====================

// 获取剧本进度
router.get('/scenario-progress/:scenarioId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { scenarioId } = req.params
    const userId = req.user!.id

    const progress = await prisma.scenarioProgress.findUnique({
      where: {
        userId_scenarioId: { userId, scenarioId }
      },
      include: {
        scenario: {
          select: {
            name: true,
            description: true,
            contentRating: true,
            complexity: true
          }
        }
      }
    })

    if (!progress) {
      return res.json({
        success: true,
        progress: null
      })
    }

    res.json({
      success: true,
      progress
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取剧本进度失败'
    })
  }
})

// 更新剧本进度
router.post('/scenario-progress/update', authenticate, validate(scenarioProgressUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const { scenarioId, progressPercentage, sessionTime, messagesCount, tokensUsed } = req.body
    const userId = req.user!.id

    // 获取或创建进度记录
    let progress = await prisma.scenarioProgress.findUnique({
      where: {
        userId_scenarioId: { userId, scenarioId }
      }
    })

    const isFirstTime = !progress
    const oldProgress = progress?.progressPercentage || 0

    if (!progress) {
      progress = await prisma.scenarioProgress.create({
        data: {
          userId,
          scenarioId,
          status: 'in_progress',
          startedAt: new Date()
        }
      })
    }

    // 计算新的统计数据
    const newTotalSessions = progress.totalSessions + 1
    const newTotalMessages = progress.totalMessages + (messagesCount || 0)
    const newTotalTokens = progress.totalTokens + (tokensUsed || 0)
    const newAverageSessionTime = sessionTime
      ? Math.round((progress.averageSessionTime * progress.totalSessions + sessionTime) / newTotalSessions)
      : progress.averageSessionTime

    // 计算熟练度
    const newProficiencyPoints = progress.proficiencyPoints + Math.floor((progressPercentage - oldProgress) * 1000)
    const newProficiencyLevel = Math.min(20, Math.floor(newProficiencyPoints / 100) + 1)

    // 更新状态
    let newStatus = progress.status
    if (progressPercentage >= 1.0 && progress.status !== 'completed') {
      newStatus = 'completed'
    } else if (progress.status === 'not_started') {
      newStatus = 'in_progress'
    }

    const updatedProgress = await prisma.scenarioProgress.update({
      where: { id: progress.id },
      data: {
        status: newStatus,
        progressPercentage,
        totalSessions: newTotalSessions,
        totalMessages: newTotalMessages,
        totalTokens: newTotalTokens,
        averageSessionTime: newAverageSessionTime,
        proficiencyLevel: newProficiencyLevel,
        proficiencyPoints: newProficiencyPoints,
        lastPlayedAt: new Date(),
        ...(newStatus === 'completed' && !progress.completedAt ? { completedAt: new Date() } : {})
      },
      include: {
        scenario: {
          select: {
            name: true,
            description: true
          }
        }
      }
    })

    // 检查成就
    if (newStatus === 'completed') {
      await checkScenarioCompletionAchievements(userId, scenarioId, newProficiencyLevel)
    }

    // 检查熟练度升级
    const leveledUp = newProficiencyLevel > progress.proficiencyLevel

    res.json({
      success: true,
      progress: updatedProgress,
      completed: newStatus === 'completed' && oldProgress < 1.0,
      leveledUp,
      isFirstTime
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新剧本进度失败'
    })
  }
})

// ==================== 熟练度系统 ====================

// 获取角色熟练度
router.get('/proficiency/:characterId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params
    const userId = req.user!.id

    const proficiency = await prisma.characterProficiency.findUnique({
      where: {
        userId_characterId: { userId, characterId }
      },
      include: {
        character: {
          select: {
            name: true,
            avatar: true,
            personality: true
          }
        }
      }
    })

    if (!proficiency) {
      // 创建初始熟练度记录
      const newProficiency = await prisma.characterProficiency.create({
        data: {
          userId,
          characterId,
          proficiencyLevel: 1,
          masteryAreas: JSON.stringify([]),
          skillTreeUnlocked: JSON.stringify(['basic_dialogue']),
          activeSkills: JSON.stringify([]),
          spacetimeAdaptation: JSON.stringify({}),
          dialogueMastery: JSON.stringify({}),
          characterInsights: JSON.stringify([])
        },
        include: {
          character: {
            select: {
              name: true,
              avatar: true,
              personality: true
            }
          }
        }
      })

      return res.json({
        success: true,
        proficiency: newProficiency
      })
    }

    res.json({
      success: true,
      proficiency
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取熟练度信息失败'
    })
  }
})

// 更新角色熟练度
router.post('/proficiency/update', authenticate, validate(proficiencyUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const { characterId, proficiencyPoints, interactionType, success = true } = req.body
    const userId = req.user!.id

    // 获取或创建熟练度记录
    let proficiency = await prisma.characterProficiency.findUnique({
      where: {
        userId_characterId: { userId, characterId }
      }
    })

    if (!proficiency) {
      proficiency = await prisma.characterProficiency.create({
        data: {
          userId,
          characterId,
          proficiencyLevel: 1,
          proficiencyPoints: 0,
          masteryAreas: JSON.stringify([]),
          skillTreeUnlocked: JSON.stringify(['basic_dialogue']),
          activeSkills: JSON.stringify([]),
          spacetimeAdaptation: JSON.stringify({}),
          dialogueMastery: JSON.stringify({}),
          characterInsights: JSON.stringify([])
        }
      })
    }

    // 更新熟练度
    const newPoints = proficiency.proficiencyPoints + proficiencyPoints
    const newLevel = Math.min(50, Math.floor(newPoints / 200) + 1)

    const updatedProficiency = await prisma.characterProficiency.update({
      where: { id: proficiency.id },
      data: {
        proficiencyLevel: newLevel,
        proficiencyPoints: newPoints,
        totalInteractions: { increment: 1 },
        successfulOutcomes: success ? { increment: 1 } : undefined,
        lastInteractionAt: new Date()
      },
      include: {
        character: {
          select: {
            name: true,
            avatar: true
          }
        }
      }
    })

    // 更新平均评分
    const totalInteractions = updatedProficiency.totalInteractions
    const successfulOutcomes = updatedProficiency.successfulOutcomes
    const averageRating = successfulOutcomes / totalInteractions

    await prisma.characterProficiency.update({
      where: { id: proficiency.id },
      data: {
        averageRating: Math.round(averageRating * 100) / 100
      }
    })

    // 检查技能解锁
    await checkSkillUnlocks(userId, characterId, newLevel, interactionType)

    res.json({
      success: true,
      proficiency: updatedProficiency,
      leveledUp: newLevel > proficiency.proficiencyLevel
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新熟练度失败'
    })
  }
})

// ==================== 成就系统 ====================

// 获取用户成就
router.get('/achievements', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    })

    // 按稀有度分组统计
    const stats = await prisma.userAchievement.groupBy({
      by: ['rarity'],
      where: { userId },
      _count: true
    })

    res.json({
      success: true,
      achievements,
      stats: stats.reduce((acc, stat) => {
        acc[stat.rarity] = stat._count
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取成就信息失败'
    })
  }
})

// ==================== 每日任务 ====================

// 获取每日任务
router.get('/daily-quests', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const quests = await prisma.dailyQuest.findMany({
      where: {
        userId,
        createdAt: {
          gte: today
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      quests
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取每日任务失败'
    })
  }
})

// 领取任务奖励
router.post('/daily-quests/:questId/claim', authenticate, async (req: AuthRequest, res) => {
  try {
    const { questId } = req.params
    const userId = req.user!.id

    const quest = await prisma.dailyQuest.findFirst({
      where: {
        id: questId,
        userId,
        isCompleted: true,
        isClaimed: false
      }
    })

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: '任务不存在或无法领取'
      })
    }

    // 更新任务状态
    await prisma.dailyQuest.update({
      where: { id: questId },
      data: {
        isClaimed: true,
        claimedAt: new Date()
      }
    })

    // 发放奖励
    if (quest.rewardType === 'credits') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: quest.rewardPoints }
        }
      })
    }

    res.json({
      success: true,
      reward: {
        type: quest.rewardType,
        points: quest.rewardPoints
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '领取奖励失败'
    })
  }
})

// ==================== 辅助函数 ====================

async function checkAffinityAchievements(userId: string, level: number) {
  const achievements = [
    { id: 'first_friend', threshold: 2, title: '初识', description: '与第一个角色成为朋友' },
    { id: 'close_buddy', threshold: 5, title: '挚友', description: '与角色达到亲密度5级' },
    { id: 'soulmate', threshold: 10, title: '灵魂伴侣', description: '与角色达到最高亲密度' }
  ]

  for (const achievement of achievements) {
    if (level >= achievement.threshold) {
      await unlockAchievement(userId, achievement.id, achievement.title, achievement.description, 'character_affinity')
    }
  }
}

async function checkScenarioCompletionAchievements(userId: string, scenarioId: string, proficiencyLevel: number) {
  // 检查完成数量
  const completedCount = await prisma.scenarioProgress.count({
    where: { userId, status: 'completed' }
  })

  const completionAchievements = [
    { id: 'first_scenario', threshold: 1, title: '冒险开始', description: '完成第一个剧本' },
    { id: 'scenario_explorer', threshold: 5, title: '剧本探索者', description: '完成5个剧本' },
    { id: 'scenario_master', threshold: 10, title: '剧本大师', description: '完成10个剧本' }
  ]

  for (const achievement of completionAchievements) {
    if (completedCount >= achievement.threshold) {
      await unlockAchievement(userId, achievement.id, achievement.title, achievement.description, 'scenario_progress')
    }
  }

  // 熟练度成就
  if (proficiencyLevel >= 10) {
    await unlockAchievement(userId, `scenario_proficiency_${scenarioId}`, '熟练掌握', '在剧本中达到10级熟练度', 'skill_mastery')
  }
}

async function checkSkillUnlocks(userId: string, characterId: string, level: number, interactionType: string) {
  const skillUnlocks = [
    { level: 5, skill: 'advanced_dialogue', name: '高级对话' },
    { level: 10, skill: 'emotional_intelligence', name: '情感洞察' },
    { level: 15, skill: 'role_immersion', name: '角色沉浸' },
    { level: 25, skill: 'storytelling_master', name: '叙事大师' }
  ]

  for (const unlock of skillUnlocks) {
    if (level >= unlock.level) {
      const proficiency = await prisma.characterProficiency.findUnique({
        where: { userId_characterId: { userId, characterId } }
      })

      if (proficiency) {
        const unlockedSkills = JSON.parse(proficiency.skillTreeUnlocked)
        if (!unlockedSkills.includes(unlock.skill)) {
          unlockedSkills.push(unlock.skill)
          await prisma.characterProficiency.update({
            where: { id: proficiency.id },
            data: {
              skillTreeUnlocked: JSON.stringify(unlockedSkills),
              skillPoints: { increment: 1 }
            }
          })
        }
      }
    }
  }
}

async function unlockAchievement(
  userId: string,
  achievementId: string,
  title: string,
  description: string,
  type: string,
  rarity: string = 'common',
  points: number = 10
) {
  try {
    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } }
    })

    if (!existing) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          title,
          description,
          achievementType: type,
          rarity,
          points,
          unlockedAt: new Date()
        }
      })

      // 增加用户积分
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: points } }
      })
    }
  } catch (error) {
    console.error('解锁成就失败:', error)
  }
}

export default router
