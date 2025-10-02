import { Router } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { getSocket } from '../lib/socket'
import { aiService } from '../services/ai'
import { guidanceService } from '../services/guidance'
import { summonService } from '../services/summon'
import { worldInfoService } from '../services/worldinfo'
// import { characterScenarioService } from '../services/characterScenarioService' // 临时禁用

// 临时 mock characterScenarioService
const characterScenarioService = {
  resolveActiveScenarios: async () => [],
  activateWorldInfoEntries: async () => [],
  getCachedScenarios: async () => [],
  clearCache: () => {}
}

const router = Router()

// 获取用户的聊天会话列表 (兼容前端的 /api/chats 调用) - 必须在具体路由之前
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: req.user!.id,
        isArchived: false
      },
      select: {
        id: true,
        title: true,
        characterId: true,
        lastMessageAt: true,
        messageCount: true,
        updatedAt: true,
        character: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })

    res.json({
      success: true,
      sessions
    })
  } catch (error) {
    next(error)
  }
})

// 获取用户的聊天会话列表 (保持向后兼容) - 必须在具体路由之前
router.get('/sessions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: req.user!.id,
        isArchived: false
      },
      select: {
        id: true,
        title: true,
        characterId: true,
        lastMessageAt: true,
        messageCount: true,
        updatedAt: true,
        character: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })

    res.json({
      success: true,
      sessions
    })
  } catch (error) {
    next(error)
  }
})

// 创建新的聊天会话 - 必须在具体路由之前
router.post('/sessions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { characterId, title } = req.body

    const session = await prisma.chatSession.create({
      data: {
        userId: req.user!.id,
        characterId,
        title
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatar: true,
            firstMessage: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      session
    })
  } catch (error) {
    next(error)
  }
})

// 获取指定会话的聊天数据 (兼容前端的 /api/chats/{sessionId} 调用)
router.get('/session/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params

    // 查找会话
    const session = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: req.user!.id // 确保只能访问自己的会话
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatar: true,
            description: true,
            firstMessage: true,
            creator: {
              select: {
                username: true
              }
            }
          }
        }
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      })
    }

    // 获取消息
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    res.json({
      success: true,
      session: {
        ...session,
        character: {
          ...session.character,
          creator: session.character.creator.username
        }
      },
      character: {
        ...session.character,
        creator: session.character.creator.username
      },
      messages
    })
  } catch (error) {
    next(error)
  }
})

// 获取或创建与角色的聊天会话 (兼容前端的 /api/chats/{id} 调用)
// 智能检测：如果ID是会话ID格式(UUID)，则作为会话处理；否则作为角色ID处理
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // 检查ID格式，判断是会话ID还是角色ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (isUUID) {
      // 按会话ID处理
      const session = await prisma.chatSession.findUnique({
        where: {
          id: id,
          userId: req.user!.id
        },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              avatar: true,
              description: true,
              firstMessage: true,
              creator: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        })
      }

      // 获取消息
      const messages = await prisma.message.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
        take: 100
      })

      return res.json({
        success: true,
        session: {
          ...session,
          character: {
            ...session.character,
            creator: session.character.creator.username
          }
        },
        character: {
          ...session.character,
          creator: session.character.creator.username
        },
        messages
      })
    }

    // 按角色ID处理
    const characterId = id

    // 验证角色是否存在
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        name: true,
        avatar: true,
        description: true,
        firstMessage: true,
        creator: {
          select: {
            username: true
          }
        }
      }
    })

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      })
    }

    // 查找现有会话
    let session = await prisma.chatSession.findFirst({
      where: {
        userId: req.user!.id,
        characterId,
        isArchived: false
      },
      orderBy: { updatedAt: 'desc' }
    })

    // 如果没有现有会话，创建新的
    if (!session) {
      // 获取角色关联的剧本
      const activeScenarios = await characterScenarioService.resolveActiveScenarios(
        characterId,
        undefined, // 新会话还没有chatId
        {
          type: 'character_first',
          globalScenariosEnabled: true,
          maxActiveScenarios: 10
        }
      )

      // 提取活跃的世界信息
      const worldInfoEntries = await characterScenarioService.activateWorldInfoEntries(
        activeScenarios,
        [], // 新会话没有消息历史
        20
      )

      session = await prisma.chatSession.create({
        data: {
          userId: req.user!.id,
          characterId,
          title: `与${character.name}的对话`,
          metadata: JSON.stringify({
            systemPrompt: character.firstMessage || `你好！我是${character.name}`,
            temperature: 0.7,
            maxTokens: 1000,
            model: 'grok-3',
            activeScenarios: activeScenarios.map(s => s.id),
            worldInfoEntries: worldInfoEntries.map(wi => wi.id),
            inheritanceStrategy: {
              type: 'character_first',
              globalScenariosEnabled: true,
              maxActiveScenarios: 10
            }
          })
        }
      })

      // 如果角色有首条消息，添加它
      if (character.firstMessage) {
        await prisma.message.create({
          data: {
            sessionId: session.id,
            characterId,
            role: 'assistant',
            content: character.firstMessage,
            tokens: Math.ceil(character.firstMessage.length / 4)
          }
        })
      }
    }

    // 获取消息历史
    const messages = await prisma.message.findMany({
      where: {
        sessionId: session.id,
        deleted: false
      },
      orderBy: { createdAt: 'asc' },
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
      }
    })

    res.json({
      success: true,
      session: {
        ...session,
        character: {
          ...character,
          creator: character.creator.username
        }
      },
      character: {
        ...character,
        creator: character.creator.username
      },
      messages
    })
  } catch (error) {
    next(error)
  }
})

// 发送消息到指定角色会话 (兼容前端的 /api/chats/{characterId}/messages 调用)
router.post('/:characterId/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { content, settings = {}, stream = false, scenarioId } = req.body
    const { characterId } = req.params

    // 智能ID检测：判断是会话ID还是角色ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(characterId)

    let character
    let session

    if (isUUID) {
      // 传入的是会话ID，先查找会话再获取角色
      session = await prisma.chatSession.findUnique({
        where: {
          id: characterId,
          userId: req.user!.id
        },
        include: {
          character: {
            include: { creator: true }
          }
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        })
      }

      character = session.character
    } else {
      // 传入的是角色ID，验证角色是否存在
      character = await prisma.character.findUnique({
        where: { id: characterId },
        include: { creator: true }
      })

      if (!character) {
        return res.status(404).json({
          success: false,
          message: 'Character not found'
        })
      }
    }

    // 查找或创建会话 (如果传入的不是会话ID)
    if (!isUUID) {
      // 只有当传入角色ID时才需要查找或创建会话
      session = await prisma.chatSession.findFirst({
        where: {
          characterId: character.id,
          userId: req.user!.id
        }
      })

      if (!session) {
        // 获取角色关联的剧本
        const activeScenarios = await characterScenarioService.resolveActiveScenarios(
          character.id,
          undefined, // 新会话还没有chatId
          {
            type: 'character_first',
            globalScenariosEnabled: true,
            maxActiveScenarios: 10
          }
        )

        // 提取活跃的世界信息
        const worldInfoEntries = await characterScenarioService.activateWorldInfoEntries(
          activeScenarios,
          [], // 新会话没有消息历史
          20
        )

        session = await prisma.chatSession.create({
          data: {
            userId: req.user!.id,
            characterId: character.id,
            title: `与${character.name}的对话`,
            metadata: JSON.stringify({
              systemPrompt: character.firstMessage || `你好！我是${character.name}`,
              temperature: settings.temperature || 0.7,
              maxTokens: settings.maxTokens || 1000,
              model: settings.model || 'grok-3',
              activeScenarios: activeScenarios.map(s => s.id),
              worldInfoEntries: worldInfoEntries.map(wi => wi.id),
              inheritanceStrategy: {
                type: 'character_first',
                globalScenariosEnabled: true,
                maxActiveScenarios: 10
              }
            })
          }
        })
      }
    }
    // 如果传入的是会话ID，session已经在上面获取到了

    // 创建用户消息
    const userMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        userId: req.user!.id,
        role: 'user',
        content,
        tokens: Math.ceil(content.length / 4)
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // 更新会话统计
    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
        totalTokens: { increment: userMessage.tokens }
      }
    })

    // 获取历史消息作为上下文
    const recentMessages = await prisma.message.findMany({
      where: {
        sessionId: session.id,
        deleted: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        role: true,
        content: true
      }
    })

    // 构建消息历史
    const messageHistory = recentMessages
      .reverse()
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

    if (stream) {
      // 流式响应
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no'
      })

      // 发送连接确认
      res.write(`data: ${JSON.stringify({
        type: 'connected',
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          timestamp: userMessage.createdAt
        }
      })}\n\n`)

      let fullContent = ''
      let aiMessage: any = null

      try {
        // 使用流式生成
        const streamGenerator = aiService.generateChatStream({
          sessionId: session.id,
          userId: req.user!.id,
          characterId: character.id,
          scenarioId: scenarioId || session.scenarioId, // 支持通过请求体或会话中的scenarioId
          messages: messageHistory,
          model: settings.model || session.model || 'grok-3',
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxTokens || 1000
        })

        for await (const chunk of streamGenerator) {
          if (chunk && chunk.trim()) {
            fullContent += chunk
            // 发送流式数据块
            res.write(`data: ${JSON.stringify({
              type: 'chunk',
              content: chunk,
              fullContent: fullContent
            })}\n\n`)
          }
        }

        // 保存完整的AI消息
        if (fullContent.trim()) {
          aiMessage = await prisma.message.create({
            data: {
              sessionId: session.id,
              characterId: character.id,
              role: 'assistant',
              content: fullContent,
              tokens: aiService.estimateTokens(fullContent)
            }
          })

          // 更新会话统计
          await prisma.chatSession.update({
            where: { id: session.id },
            data: {
              messageCount: { increment: 1 },
              lastMessageAt: new Date(),
              totalTokens: { increment: aiMessage.tokens }
            }
          })
        }

        // 发送完成信号
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          id: aiMessage?.id || Date.now().toString(),
          content: fullContent,
          timestamp: aiMessage?.createdAt || new Date()
        })}\n\n`)

      } catch (error) {
        console.error('流式生成失败:', error)
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: '抱歉，我现在无法响应。请稍后再试。'
        })}\n\n`)
      } finally {
        res.end()
      }

    } else {
      // 非流式响应（原有逻辑）
      try {
        // 生成AI回复
        const aiResponse = await aiService.generateChatResponse({
          sessionId: session.id,
          userId: req.user!.id,
          characterId: character.id,
          scenarioId: scenarioId || session.scenarioId, // 支持通过请求体或会话中的scenarioId
          messages: messageHistory,
          model: settings.model || session.model || 'grok-3',
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxTokens || 1000,
          stream: false
        })

        // 创建AI消息
        const aiMessage = await prisma.message.create({
          data: {
            sessionId: session.id,
            characterId: character.id,
            role: 'assistant',
            content: aiResponse.content,
            tokens: aiService.estimateTokens(aiResponse.content)
          }
        })

        // 更新会话统计
        await prisma.chatSession.update({
          where: { id: session.id },
          data: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date(),
            totalTokens: { increment: aiMessage.tokens }
          }
        })

        // 返回AI回复消息给前端
        res.json({
          success: true,
          id: aiMessage.id,
          content: aiMessage.content,
          timestamp: aiMessage.createdAt,
          userMessage
        })

      } catch (aiError) {
        console.error('生成 AI 回复失败:', aiError)
        // 如果AI回复失败，至少返回成功的用户消息
        res.json({
          success: true,
          id: Date.now().toString(),
          content: '抱歉，我现在无法响应。请稍后再试。',
          timestamp: new Date(),
          userMessage
        })
      }
    }
  } catch (error) {
    if (!res.headersSent) {
      next(error)
    }
  }
})


// 获取会话的消息历史
router.get('/sessions/:sessionId/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user!.id
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    const messages = await prisma.message.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { createdAt: 'asc' },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    res.json({
      success: true,
      messages
    })
  } catch (error) {
    next(error)
  }
})

// 发送消息
router.post('/sessions/:sessionId/messages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { content, characterId } = req.body

    // 验证会话所有权
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user!.id
      },
      include: {
        character: true
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    // 创建用户消息
    const userMessage = await prisma.message.create({
      data: {
        sessionId: req.params.sessionId,
        userId: req.user!.id,
        role: 'user',
        content,
        tokens: Math.ceil(content.length / 4) // 简单估算
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // 更新会话统计
    await prisma.chatSession.update({
      where: { id: req.params.sessionId },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
        totalTokens: { increment: userMessage.tokens }
      }
    })

    // 通过 WebSocket 广播用户消息
    const io = getSocket()
    io.to(`session:${req.params.sessionId}`).emit('message', {
      type: 'user_message',
      sessionId: req.params.sessionId,
      message: userMessage
    })

    // 异步生成 AI 回复
    setImmediate(async () => {
      try {
        const character = session.character

        // 获取历史消息作为上下文
        const recentMessages = await prisma.message.findMany({
          where: {
            sessionId: req.params.sessionId,
            deleted: false
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            role: true,
            content: true
          }
        })

        // 构建消息历史（倒序排列）
        const messageHistory = recentMessages
          .reverse()
          .slice(0, -1) // 排除刚发送的消息（已在上面）
          .map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }))

        // 添加最新的用户消息
        messageHistory.push({
          role: 'user' as const,
          content
        })

        // 使用流式生成
        const generator = aiService.generateChatStream({
          sessionId: req.params.sessionId,
          userId: req.user!.id,
          characterId: character?.id,
          scenarioId: session.scenarioId, // 从会话中获取scenarioId
          messages: messageHistory,
          model: session.model || 'grok-3',
          temperature: 0.7,
          maxTokens: 1000
        })

        let fullContent = ''
        let chunkCount = 0

        // 先创建消息记录
        const aiMessage = await prisma.message.create({
          data: {
            sessionId: req.params.sessionId,
            characterId: character?.id,
            role: 'assistant',
            content: '',
            tokens: 0
          },
          include: {
            character: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        })

        // 流式发送内容
        for await (const chunk of generator) {
          fullContent += chunk
          chunkCount++

          // 每收到一定数量的块就发送一次
          if (chunkCount % 3 === 0) {
            const io = getSocket()
            io.to(`session:${req.params.sessionId}`).emit('message_chunk', {
              sessionId: req.params.sessionId,
              messageId: aiMessage.id,
              chunk,
              partial: fullContent
            })
          }
        }

        // 更新消息内容
        const finalMessage = await prisma.message.update({
          where: { id: aiMessage.id },
          data: {
            content: fullContent,
            tokens: aiService.estimateTokens(fullContent)
          },
          include: {
            character: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        })

        // 更新会话统计
        await prisma.chatSession.update({
          where: { id: req.params.sessionId },
          data: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date(),
            totalTokens: { increment: finalMessage.tokens }
          }
        })

        // 游戏化：更新亲密度和熟练度
        try {
          const totalMessages = session.messageCount + 2 // 用户消息 + AI回复
          const affinityPoints = Math.floor(5 + Math.random() * 15) // 5-20点随机亲密度

          // 更新角色亲密度
          const affinity = await prisma.characterAffinity.upsert({
            where: {
              userId_characterId: {
                userId: req.user!.id,
                characterId: character.id
              }
            },
            update: {
              affinityPoints: { increment: affinityPoints },
              unlockCount: { increment: 1 },
              lastInteractionAt: new Date()
            },
            create: {
              userId: req.user!.id,
              characterId: character.id,
              affinityPoints,
              affinityLevel: 1,
              relationshipType: 'stranger'
            }
          })

          // 计算新的亲密度等级
          const newAffinityLevel = Math.min(10, Math.floor(affinity.affinityPoints / 100) + 1)
          const relationshipTypes = ['stranger', 'acquaintance', 'friend', 'close_friend', 'best_friend', 'soulmate']
          const newRelationshipType = relationshipTypes[Math.min(newAffinityLevel - 1, relationshipTypes.length - 1)]

          if (newAffinityLevel > affinity.affinityLevel) {
            await prisma.characterAffinity.update({
              where: { id: affinity.id },
              data: {
                affinityLevel: newAffinityLevel,
                relationshipType: newRelationshipType
              }
            })
          }

          // 更新角色熟练度
          const proficiencyPoints = Math.floor(10 + Math.random() * 40) // 10-50点
          const proficiency = await prisma.characterProficiency.upsert({
            where: {
              userId_characterId: {
                userId: req.user!.id,
                characterId: character.id
              }
            },
            update: {
              proficiencyPoints: { increment: proficiencyPoints },
              totalInteractions: { increment: 1 },
              lastInteractionAt: new Date()
            },
            create: {
              userId: req.user!.id,
              characterId: character.id,
              proficiencyPoints,
              proficiencyLevel: 1,
              masteryAreas: '[]',
              skillTreeUnlocked: '["basic_dialogue"]',
              activeSkills: '[]',
              spacetimeAdaptation: '{}',
              dialogueMastery: '{}',
              characterInsights: '[]'
            }
          })

          // 计算新的熟练度等级
          const newProficiencyLevel = Math.min(50, Math.floor(proficiency.proficiencyPoints / 200) + 1)
          if (newProficiencyLevel > proficiency.proficiencyLevel) {
            await prisma.characterProficiency.update({
              where: { id: proficiency.id },
              data: { proficiencyLevel: newProficiencyLevel }
            })
          }

          // 如果有剧本，更新剧本进度
          if (session.worldInfoId) {
            const progressIncrement = Math.random() * 0.05 // 每次对话增加0-5%进度
            await prisma.scenarioProgress.upsert({
              where: {
                userId_scenarioId: {
                  userId: req.user!.id,
                  scenarioId: session.worldInfoId
                }
              },
              update: {
                progressPercentage: { increment: progressIncrement },
                totalSessions: { increment: 1 },
                totalMessages: { increment: 2 },
                totalTokens: { increment: userMessage.tokens + finalMessage.tokens },
                lastPlayedAt: new Date()
              },
              create: {
                userId: req.user!.id,
                scenarioId: session.worldInfoId,
                status: 'in_progress',
                progressPercentage: progressIncrement,
                totalSessions: 1,
                totalMessages: 2,
                totalTokens: userMessage.tokens + finalMessage.tokens,
                proficiencyLevel: 1,
                proficiencyPoints: 0,
                difficulty: 'normal',
                startedAt: new Date(),
                lastPlayedAt: new Date()
              }
            })
          }
        } catch (gamificationError) {
          console.error('游戏化数据更新失败:', gamificationError)
          // 不影响主流程
        }

        // 发送完整消息
        const io = getSocket()
        io.to(`session:${req.params.sessionId}`).emit('message', {
          type: 'assistant_message',
          sessionId: req.params.sessionId,
          message: finalMessage
        })
      } catch (error) {
        console.error('生成 AI 回复失败:', error)
        const io = getSocket()
        io.to(`session:${req.params.sessionId}`).emit('error', {
          message: '生成回复失败',
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    })

    res.json({
      success: true,
      message: userMessage
    })
  } catch (error) {
    next(error)
  }
})

// 获取会话详情
router.get('/sessions/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user!.id
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatar: true,
            description: true
          }
        }
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    res.json({
      success: true,
      session
    })
  } catch (error) {
    next(error)
  }
})

// 删除会话
router.delete('/sessions/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user!.id
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    await prisma.chatSession.delete({
      where: { id: req.params.sessionId }
    })

    res.json({
      success: true,
      message: 'Session deleted'
    })
  } catch (error) {
    next(error)
  }
})

// 归档会话
router.post('/sessions/:sessionId/archive', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user!.id
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    await prisma.chatSession.update({
      where: { id: req.params.sessionId },
      data: { isArchived: true }
    })

    res.json({
      success: true,
      message: 'Session archived'
    })
  } catch (error) {
    next(error)
  }
})

// 编辑消息
router.put('/sessions/:sessionId/messages/:messageId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { content } = req.body

    const message = await prisma.message.findFirst({
      where: {
        id: req.params.messageId,
        sessionId: req.params.sessionId,
        userId: req.user!.id
      }
    })

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      })
    }

    const updatedMessage = await prisma.message.update({
      where: { id: req.params.messageId },
      data: {
        content,
        edited: true,
        tokens: Math.ceil(content.length / 4)
      },
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
      }
    })

    res.json({
      success: true,
      message: updatedMessage
    })
  } catch (error) {
    next(error)
  }
})

// 删除消息
router.delete('/sessions/:sessionId/messages/:messageId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: req.params.messageId,
        sessionId: req.params.sessionId
      }
    })

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      })
    }

    // 软删除
    await prisma.message.update({
      where: { id: req.params.messageId },
      data: { deleted: true }
    })

    res.json({
      success: true,
      message: 'Message deleted'
    })
  } catch (error) {
    next(error)
  }
})

// 重新生成消息
router.post('/sessions/:sessionId/messages/:messageId/regenerate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: req.params.messageId,
        sessionId: req.params.sessionId,
        role: 'assistant'
      }
    })

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      })
    }

    // TODO: 调用 AI API 重新生成
    const newContent = `重新生成的消息内容`

    const updatedMessage = await prisma.message.update({
      where: { id: req.params.messageId },
      data: {
        content: newContent,
        edited: true,
        tokens: Math.ceil(newContent.length / 4)
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: updatedMessage
    })
  } catch (error) {
    next(error)
  }
})

// 停止生成
router.post('/sessions/:sessionId/stop', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // TODO: 实现停止 AI 生成的逻辑
    const io = getSocket()
    io.to(`session:${req.params.sessionId}`).emit('generation_stopped', {
      sessionId: req.params.sessionId
    })

    res.json({
      success: true,
      message: 'Generation stopped'
    })
  } catch (error) {
    next(error)
  }
})

// 清空上下文
router.post('/sessions/:sessionId/clear-context', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user!.id
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    // 重置会话的元数据
    await prisma.chatSession.update({
      where: { id: req.params.sessionId },
      data: {
        metadata: {}
      }
    })

    res.json({
      success: true,
      message: 'Context cleared'
    })
  } catch (error) {
    next(error)
  }
})

// 更新会话设置
router.put('/sessions/:sessionId/settings', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: req.params.sessionId,
        userId: req.user!.id
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    await prisma.chatSession.update({
      where: { id: req.params.sessionId },
      data: {
        model: req.body.model || session.model,
        metadata: {
          ...session.metadata as any,
          settings: req.body
        }
      }
    })

    res.json({
      success: true,
      message: 'Settings updated'
    })
  } catch (error) {
    next(error)
  }
})

// 获取对话的活跃世界信息
router.get('/:sessionId/world-info', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params

    // 验证会话属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: req.user!.id
      },
      include: {
        character: true
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      })
    }

    // 获取消息历史用于世界信息激活
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true }
    })

    // 获取当前活跃的剧本和世界信息
    const activeScenarios = await characterScenarioService.getCachedScenarios(
      session.characterId,
      sessionId,
      {
        type: 'character_first',
        globalScenariosEnabled: true,
        maxActiveScenarios: 10
      }
    )

    const worldInfoEntries = await characterScenarioService.activateWorldInfoEntries(
      activeScenarios,
      messages,
      20
    )

    res.json({
      success: true,
      worldInfo: {
        scenarios: activeScenarios.map(s => ({
          id: s.id,
          name: s.name,
          source: s.source,
          priority: s.priority,
          worldInfoCount: s.worldInfos.length
        })),
        activeEntries: worldInfoEntries,
        totalScenarios: activeScenarios.length,
        totalEntries: worldInfoEntries.length
      }
    })
  } catch (error) {
    next(error)
  }
})

// 动态启用/禁用剧本
router.post('/:sessionId/world-info/toggle', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params
    const { scenarioId, enabled } = req.body

    // 验证会话属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: req.user!.id
      }
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      })
    }

    // 获取当前会话元数据
    const metadata = typeof session.metadata === 'string'
      ? JSON.parse(session.metadata)
      : session.metadata || {}

    const activeScenarios = metadata.activeScenarios || []
    const disabledScenarios = metadata.disabledScenarios || []

    if (enabled) {
      // 启用剧本
      if (!activeScenarios.includes(scenarioId)) {
        activeScenarios.push(scenarioId)
      }
      const disabledIndex = disabledScenarios.indexOf(scenarioId)
      if (disabledIndex > -1) {
        disabledScenarios.splice(disabledIndex, 1)
      }
    } else {
      // 禁用剧本
      const activeIndex = activeScenarios.indexOf(scenarioId)
      if (activeIndex > -1) {
        activeScenarios.splice(activeIndex, 1)
      }
      if (!disabledScenarios.includes(scenarioId)) {
        disabledScenarios.push(scenarioId)
      }
    }

    // 更新会话元数据
    const updatedMetadata = {
      ...metadata,
      activeScenarios,
      disabledScenarios
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        metadata: JSON.stringify(updatedMetadata)
      }
    })

    // 清除缓存以便重新计算
    characterScenarioService.clearCache(session.characterId)

    res.json({
      success: true,
      message: `Scenario ${enabled ? 'enabled' : 'disabled'} successfully`,
      activeScenarios,
      disabledScenarios
    })
  } catch (error) {
    next(error)
  }
})

// 更新聊天会话（固定/取消固定等）
router.patch('/:sessionId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params
    const { isPinned, title } = req.body

    // 验证会话属于当前用户
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: req.user!.id
      }
    })

    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      })
    }

    // 更新会话信息
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        ...(isPinned !== undefined && { isPinned }),
        ...(title && { title })
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    res.json({
      success: true,
      session: updatedSession
    })
  } catch (error) {
    next(error)
  }
})

export default router
