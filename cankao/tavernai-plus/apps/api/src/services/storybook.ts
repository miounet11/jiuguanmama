import { prisma } from '../server'

export interface StorybookEntry {
  id: string
  trigger: {
    type: 'keyword' | 'emotion' | 'action' | 'random'
    keywords?: string[]
    emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'romantic'
    action?: string
    probability?: number
  }
  content: {
    type: 'dialogue' | 'action' | 'narration' | 'thought'
    text: string
    speaker?: string  // 角色名称
    emotion?: string
    effects?: {
      sound?: string
      visual?: string
      transition?: string
    }
  }
  conditions?: {
    minAffection?: number    // 最小好感度
    maxAffection?: number
    requiresFlags?: string[] // 需要的剧情标记
    excludeFlags?: string[]  // 排除的剧情标记
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
    location?: string
  }
  outcomes?: {
    affectionChange?: number
    setFlags?: string[]
    removeFlags?: string[]
    nextEntry?: string      // 下一个故事条目ID
  }
  priority: number
  repeatLimit?: number      // 重复次数限制
  cooldown?: number         // 冷却时间（消息数）
}

export interface Storybook {
  id: string
  name: string
  description: string
  characterId: string
  entries: StorybookEntry[]
  settings: {
    enabled: boolean
    activationRate: number    // 激活频率 0-1
    narrativeStyle: 'first-person' | 'third-person' | 'mixed'
    emotionalDepth: 'light' | 'moderate' | 'deep'
    allowBranching: boolean
  }
  metadata: {
    author?: string
    version?: string
    tags?: string[]
    createdAt: Date
    updatedAt: Date
  }
}

interface StoryContext {
  sessionId: string
  characterId: string
  affection: number
  flags: Set<string>
  messageHistory: Array<{ role: string; content: string }>
  lastActivation?: Date
  activationCount: Map<string, number>
}

class StorybookService {
  /**
   * 创建故事书
   */
  async createStorybook(
    characterId: string,
    data: Partial<Storybook>
  ): Promise<Storybook> {
    const storybook: Storybook = {
      id: this.generateId(),
      name: data.name || '角色故事书',
      description: data.description || '',
      characterId,
      entries: data.entries || [],
      settings: {
        enabled: true,
        activationRate: 0.3,
        narrativeStyle: 'mixed',
        emotionalDepth: 'moderate',
        allowBranching: true,
        ...data.settings
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data.metadata
      }
    }

    // TODO: 保存到数据库
    return storybook
  }

  /**
   * 检查并激活故事条目
   */
  async checkAndActivate(
    context: StoryContext
  ): Promise<StorybookEntry | null> {
    // 获取角色的故事书
    const storybook = await this.getCharacterStorybook(context.characterId)
    if (!storybook || !storybook.settings.enabled) {
      return null
    }

    // 检查激活率
    if (Math.random() > storybook.settings.activationRate) {
      return null
    }

    // 获取最新消息内容
    const recentMessages = context.messageHistory.slice(-5)
    const recentText = recentMessages.map(m => m.content).join(' ')

    // 筛选可激活的条目
    const activatableEntries = storybook.entries.filter(entry => {
      // 检查重复限制
      const count = context.activationCount.get(entry.id) || 0
      if (entry.repeatLimit && count >= entry.repeatLimit) {
        return false
      }

      // 检查条件
      if (!this.checkConditions(entry, context)) {
        return false
      }

      // 检查触发器
      return this.checkTrigger(entry, recentText, context)
    })

    // 按优先级排序并选择
    if (activatableEntries.length === 0) {
      return null
    }

    activatableEntries.sort((a, b) => b.priority - a.priority)

    // 加入一些随机性
    const topEntries = activatableEntries.slice(0, 3)
    const selected = topEntries[Math.floor(Math.random() * topEntries.length)]

    // 应用效果
    if (selected.outcomes) {
      await this.applyOutcomes(selected.outcomes, context)
    }

    // 更新激活计数
    context.activationCount.set(
      selected.id,
      (context.activationCount.get(selected.id) || 0) + 1
    )

    return selected
  }

  /**
   * 检查触发条件
   */
  private checkTrigger(
    entry: StorybookEntry,
    recentText: string,
    context: StoryContext
  ): boolean {
    const { trigger } = entry

    switch (trigger.type) {
      case 'keyword':
        if (!trigger.keywords) return false
        return trigger.keywords.some(keyword =>
          recentText.toLowerCase().includes(keyword.toLowerCase())
        )

      case 'emotion':
        // 分析文本情感
        const detectedEmotion = this.detectEmotion(recentText)
        return detectedEmotion === trigger.emotion

      case 'action':
        // 检查动作触发
        return recentText.includes(trigger.action || '')

      case 'random':
        // 随机触发
        return Math.random() < (trigger.probability || 0.1)

      default:
        return false
    }
  }

  /**
   * 检查条件
   */
  private checkConditions(
    entry: StorybookEntry,
    context: StoryContext
  ): boolean {
    const { conditions } = entry
    if (!conditions) return true

    // 检查好感度
    if (conditions.minAffection !== undefined &&
        context.affection < conditions.minAffection) {
      return false
    }
    if (conditions.maxAffection !== undefined &&
        context.affection > conditions.maxAffection) {
      return false
    }

    // 检查剧情标记
    if (conditions.requiresFlags) {
      const hasAllFlags = conditions.requiresFlags.every(flag =>
        context.flags.has(flag)
      )
      if (!hasAllFlags) return false
    }

    if (conditions.excludeFlags) {
      const hasExcludedFlag = conditions.excludeFlags.some(flag =>
        context.flags.has(flag)
      )
      if (hasExcludedFlag) return false
    }

    return true
  }

  /**
   * 应用故事效果
   */
  private async applyOutcomes(
    outcomes: StorybookEntry['outcomes'],
    context: StoryContext
  ) {
    if (!outcomes) return

    // 更新好感度
    if (outcomes.affectionChange) {
      context.affection += outcomes.affectionChange
      // TODO: 保存到数据库
    }

    // 设置剧情标记
    if (outcomes.setFlags) {
      outcomes.setFlags.forEach(flag => context.flags.add(flag))
    }

    // 移除剧情标记
    if (outcomes.removeFlags) {
      outcomes.removeFlags.forEach(flag => context.flags.delete(flag))
    }

    // TODO: 保存标记到数据库
  }

  /**
   * 格式化故事条目为消息
   */
  formatEntryAsMessage(entry: StorybookEntry): string {
    const { content } = entry
    let message = ''

    // 添加效果描述
    if (content.effects?.visual) {
      message += `*${content.effects.visual}*\n\n`
    }

    // 根据类型格式化
    switch (content.type) {
      case 'dialogue':
        // 对话
        const speaker = content.speaker || '角色'
        message += `${speaker}: "${content.text}"`
        break

      case 'action':
        // 动作描述
        message += `*${content.text}*`
        break

      case 'narration':
        // 旁白
        message += `【${content.text}】`
        break

      case 'thought':
        // 内心独白
        message += `（${content.text}）`
        break

      default:
        message += content.text
    }

    // 添加情感标记
    if (content.emotion) {
      message += ` [${content.emotion}]`
    }

    return message
  }

  /**
   * 生成分支剧情选项
   */
  async generateBranchingOptions(
    entry: StorybookEntry,
    context: StoryContext
  ): Promise<Array<{ id: string; text: string; preview: string }>> {
    // TODO: 基于当前条目生成多个可能的剧情分支
    const options = []

    // 示例分支
    options.push({
      id: 'branch_1',
      text: '安慰她',
      preview: '温柔地抱住她，告诉她一切都会好起来的...'
    })

    options.push({
      id: 'branch_2',
      text: '开个玩笑',
      preview: '试图用幽默化解紧张的气氛...'
    })

    options.push({
      id: 'branch_3',
      text: '保持沉默',
      preview: '静静地陪在她身边，什么也不说...'
    })

    return options
  }

  /**
   * 导入故事书（支持 JSON 格式）
   */
  async importStorybook(
    characterId: string,
    data: string
  ): Promise<Storybook> {
    const parsed = JSON.parse(data)

    // 验证格式
    if (!parsed.entries || !Array.isArray(parsed.entries)) {
      throw new Error('无效的故事书格式')
    }

    return this.createStorybook(characterId, parsed)
  }

  /**
   * 获取故事书模板
   */
  getTemplates() {
    return {
      romance: {
        name: '浪漫故事线',
        entries: [
          {
            id: 'rom_1',
            trigger: {
              type: 'keyword' as const,
              keywords: ['喜欢', '爱', '心动']
            },
            content: {
              type: 'dialogue' as const,
              text: '我...我也有同样的感觉...',
              emotion: 'shy'
            },
            conditions: {
              minAffection: 50
            },
            outcomes: {
              affectionChange: 10,
              setFlags: ['confession_made']
            },
            priority: 80
          }
        ]
      },
      adventure: {
        name: '冒险故事线',
        entries: [
          {
            id: 'adv_1',
            trigger: {
              type: 'keyword' as const,
              keywords: ['冒险', '探索', '出发']
            },
            content: {
              type: 'action' as const,
              text: '拿起背包，准备踏上新的旅程',
              effects: {
                visual: '阳光洒在远方的道路上'
              }
            },
            priority: 70
          }
        ]
      }
    }
  }

  /**
   * 情感检测（简单实现）
   */
  private detectEmotion(text: string): string {
    const emotions = {
      happy: ['开心', '快乐', '高兴', '笑', '哈哈'],
      sad: ['难过', '悲伤', '哭', '伤心', '难受'],
      angry: ['生气', '愤怒', '讨厌', '烦', '可恶'],
      surprised: ['惊讶', '震惊', '天啊', '不敢相信'],
      romantic: ['爱', '喜欢', '心动', '温柔', '拥抱']
    }

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return emotion
      }
    }

    return 'neutral'
  }

  /**
   * 获取角色故事书（模拟）
   */
  private async getCharacterStorybook(characterId: string): Promise<Storybook | null> {
    // TODO: 从数据库获取
    // 这里返回模拟数据
    return {
      id: 'mock_storybook',
      name: '默认故事书',
      description: '角色的故事集',
      characterId,
      entries: this.getMockEntries(),
      settings: {
        enabled: true,
        activationRate: 0.3,
        narrativeStyle: 'mixed',
        emotionalDepth: 'moderate',
        allowBranching: true
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  private getMockEntries(): StorybookEntry[] {
    return [
      {
        id: 'entry_1',
        trigger: {
          type: 'keyword',
          keywords: ['你好', 'hello', '嗨']
        },
        content: {
          type: 'dialogue',
          text: '哦，你来了！我正在想你呢～',
          emotion: 'happy'
        },
        priority: 50,
        repeatLimit: 3
      },
      {
        id: 'entry_2',
        trigger: {
          type: 'emotion',
          emotion: 'romantic'
        },
        content: {
          type: 'action',
          text: '脸颊微微泛红，不自觉地靠近了一些',
          effects: {
            visual: '夕阳的余晖洒在两人身上'
          }
        },
        conditions: {
          minAffection: 30
        },
        outcomes: {
          affectionChange: 5
        },
        priority: 70
      }
    ]
  }

  private generateId(): string {
    return `sb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const storybookService = new StorybookService()
