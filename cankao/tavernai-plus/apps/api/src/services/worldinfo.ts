import { prisma } from '../server'
import { embedText, findSimilar } from './embedding' // 需要实现向量嵌入

export interface WorldInfoEntry {
  id: string
  name: string
  triggers: string[]        // 触发词
  content: string          // 知识内容
  category: string         // 分类：location, character, item, lore, custom
  priority: number         // 优先级 0-100
  isActive: boolean
  context: {
    always: boolean        // 始终激活
    minDepth?: number     // 最小对话深度激活
    maxDepth?: number     // 最大对话深度
    probability?: number  // 激活概率 0-1
  }
  metadata?: {
    author?: string
    source?: string
    tags?: string[]
    embedding?: number[]  // 向量嵌入
  }
}

export interface WorldInfo {
  id: string
  name: string
  description: string
  creatorId: string
  isPublic: boolean
  entries: WorldInfoEntry[]
  settings: {
    maxEntries: number           // 最大同时激活条目数
    scanDepth: number           // 扫描深度（最近N条消息）
    insertionStrategy: 'before' | 'after' | 'mixed'
    budgetCap: number          // token预算上限
    recursiveScanning: boolean  // 递归扫描
  }
}

class WorldInfoService {
  /**
   * 创建世界观设定
   */
  async createWorldInfo(
    userId: string,
    data: Partial<WorldInfo>
  ): Promise<WorldInfo> {
    const worldInfo: WorldInfo = {
      id: this.generateId(),
      name: data.name || '新世界观',
      description: data.description || '',
      creatorId: userId,
      isPublic: data.isPublic || false,
      entries: data.entries || [],
      settings: {
        maxEntries: 20,
        scanDepth: 10,
        insertionStrategy: 'before',
        budgetCap: 2000,
        recursiveScanning: true,
        ...data.settings
      }
    }

    // TODO: 保存到数据库
    // 这里需要创建 WorldInfo 表

    return worldInfo
  }

  /**
   * 添加知识条目
   */
  async addEntry(
    worldInfoId: string,
    entry: Omit<WorldInfoEntry, 'id'>
  ): Promise<WorldInfoEntry> {
    const newEntry: WorldInfoEntry = {
      id: this.generateId(),
      ...entry,
      priority: entry.priority || 50,
      isActive: entry.isActive !== false,
      context: {
        ...entry.context,
        probability: entry.context?.probability ?? 1,
        always: entry.context?.always ?? false
      }
    }

    // 生成向量嵌入（用于语义搜索）
    if (entry.content) {
      // newEntry.metadata = {
      //   ...newEntry.metadata,
      //   embedding: await embedText(entry.content)
      // }
    }

    // TODO: 保存到数据库

    return newEntry
  }

  /**
   * 扫描消息并激活相关知识
   */
  async scanAndActivate(
    worldInfoId: string,
    messages: Array<{ role: string; content: string }>,
    settings?: WorldInfo['settings']
  ): Promise<WorldInfoEntry[]> {
    // 获取世界观信息
    // const worldInfo = await this.getWorldInfo(worldInfoId)

    const activatedEntries: WorldInfoEntry[] = []
    const scanDepth = settings?.scanDepth || 10
    const maxEntries = settings?.maxEntries || 20

    // 获取需要扫描的消息
    const messagesToScan = messages.slice(-scanDepth)
    const scanText = messagesToScan.map(m => m.content).join(' ')

    // 模拟知识条目（实际应从数据库获取）
    const allEntries = this.getMockEntries()

    // 1. 关键词匹配激活
    for (const entry of allEntries) {
      if (entry.context.always) {
        activatedEntries.push(entry)
        continue
      }

      // 检查触发词
      const triggered = entry.triggers.some(trigger =>
        scanText.toLowerCase().includes(trigger.toLowerCase())
      )

      if (triggered) {
        // 检查概率
        if (!entry.context.probability || Math.random() < entry.context.probability) {
          activatedEntries.push(entry)
        }
      }
    }

    // 2. 语义相似度激活（需要向量数据库）
    // const semanticMatches = await this.findSemanticMatches(scanText, allEntries)
    // activatedEntries.push(...semanticMatches)

    // 3. 递归扫描（激活的条目可能触发其他条目）
    if (settings?.recursiveScanning) {
      const recursiveEntries = await this.recursiveScan(
        activatedEntries,
        allEntries,
        new Set(activatedEntries.map(e => e.id))
      )
      activatedEntries.push(...recursiveEntries)
    }

    // 4. 按优先级排序并限制数量
    activatedEntries.sort((a, b) => b.priority - a.priority)
    return activatedEntries.slice(0, maxEntries)
  }

  /**
   * 递归扫描（激活的条目可能触发其他条目）
   */
  private async recursiveScan(
    activatedEntries: WorldInfoEntry[],
    allEntries: WorldInfoEntry[],
    processedIds: Set<string>
  ): Promise<WorldInfoEntry[]> {
    const additionalEntries: WorldInfoEntry[] = []
    const activatedText = activatedEntries.map(e => e.content).join(' ')

    for (const entry of allEntries) {
      if (processedIds.has(entry.id)) continue

      const triggered = entry.triggers.some(trigger =>
        activatedText.toLowerCase().includes(trigger.toLowerCase())
      )

      if (triggered) {
        additionalEntries.push(entry)
        processedIds.add(entry.id)
      }
    }

    // 继续递归，直到没有新的激活
    if (additionalEntries.length > 0) {
      const moreEntries = await this.recursiveScan(
        additionalEntries,
        allEntries,
        processedIds
      )
      additionalEntries.push(...moreEntries)
    }

    return additionalEntries
  }

  /**
   * 将激活的知识注入到消息上下文
   */
  injectWorldInfo(
    messages: Array<{ role: string; content: string }>,
    entries: WorldInfoEntry[],
    strategy: 'before' | 'after' | 'mixed' = 'before'
  ): Array<{ role: string; content: string }> {
    if (entries.length === 0) return messages

    // 构建知识库内容
    const worldInfoContent = this.formatWorldInfo(entries)

    // 根据策略注入
    const enhancedMessages = [...messages]

    switch (strategy) {
      case 'before':
        // 在系统消息后插入
        enhancedMessages.splice(1, 0, {
          role: 'system',
          content: `【世界观设定】\n${worldInfoContent}`
        })
        break

      case 'after':
        // 在最后一条用户消息前插入
        const lastUserIndex = enhancedMessages
          .map((m, i) => ({ ...m, index: i }))
          .filter(m => m.role === 'user')
          .pop()?.index || 0

        enhancedMessages.splice(lastUserIndex, 0, {
          role: 'system',
          content: `【相关背景知识】\n${worldInfoContent}`
        })
        break

      case 'mixed':
        // 分散注入（高优先级在前，低优先级在后）
        const highPriority = entries.filter(e => e.priority >= 70)
        const lowPriority = entries.filter(e => e.priority < 70)

        if (highPriority.length > 0) {
          enhancedMessages.splice(1, 0, {
            role: 'system',
            content: `【重要设定】\n${this.formatWorldInfo(highPriority)}`
          })
        }

        if (lowPriority.length > 0) {
          enhancedMessages.push({
            role: 'system',
            content: `【补充信息】\n${this.formatWorldInfo(lowPriority)}`
          })
        }
        break
    }

    return enhancedMessages
  }

  /**
   * 格式化世界观信息
   */
  private formatWorldInfo(entries: WorldInfoEntry[]): string {
    const grouped = entries.reduce((acc, entry) => {
      const category = entry.category || 'other'
      if (!acc[category]) acc[category] = []
      acc[category].push(entry)
      return acc
    }, {} as Record<string, WorldInfoEntry[]>)

    let formatted = ''

    const categoryNames: Record<string, string> = {
      location: '地点',
      character: '人物',
      item: '物品',
      lore: '传说',
      custom: '其他'
    }

    for (const [category, categoryEntries] of Object.entries(grouped)) {
      formatted += `\n【${categoryNames[category] || category}】\n`
      for (const entry of categoryEntries) {
        formatted += `• ${entry.name}: ${entry.content}\n`
      }
    }

    return formatted.trim()
  }

  /**
   * 导入世界观设定（支持 JSON、TXT 格式）
   */
  async importWorldInfo(
    userId: string,
    data: string,
    format: 'json' | 'txt' = 'json'
  ): Promise<WorldInfo> {
    if (format === 'json') {
      const parsed = JSON.parse(data)
      return this.createWorldInfo(userId, parsed)
    } else {
      // 解析文本格式
      const entries = this.parseTextFormat(data)
      return this.createWorldInfo(userId, {
        name: '导入的世界观',
        entries
      })
    }
  }

  /**
   * 解析文本格式的世界观
   */
  private parseTextFormat(text: string): WorldInfoEntry[] {
    const entries: WorldInfoEntry[] = []
    const lines = text.split('\n')

    let currentEntry: Partial<WorldInfoEntry> | null = null

    for (const line of lines) {
      if (line.startsWith('#')) {
        // 新条目
        if (currentEntry && currentEntry.name && currentEntry.content) {
          entries.push(currentEntry as WorldInfoEntry)
        }

        const name = line.replace('#', '').trim()
        currentEntry = {
          id: this.generateId(),
          name,
          triggers: [name.toLowerCase()],
          content: '',
          category: 'custom',
          priority: 50,
          isActive: true,
          context: { always: false }
        }
      } else if (currentEntry && line.trim()) {
        currentEntry.content += line + '\n'
      }
    }

    // 添加最后一个条目
    if (currentEntry && currentEntry.name && currentEntry.content) {
      entries.push(currentEntry as WorldInfoEntry)
    }

    return entries
  }

  /**
   * 智能推荐相关知识
   */
  async recommendEntries(
    context: string,
    limit: number = 5
  ): Promise<WorldInfoEntry[]> {
    // TODO: 基于上下文智能推荐相关知识条目
    // 使用向量相似度搜索

    return []
  }

  /**
   * 获取模拟条目（开发用）
   */
  private getMockEntries(): WorldInfoEntry[] {
    return [
      {
        id: '1',
        name: '艾尔登大陆',
        triggers: ['艾尔登', '大陆', '王国'],
        content: '艾尔登大陆是一个充满魔法与冒险的奇幻世界，由五大王国组成。',
        category: 'location',
        priority: 80,
        isActive: true,
        context: { always: false, probability: 1 }
      },
      {
        id: '2',
        name: '魔法学院',
        triggers: ['魔法学院', '学院', '魔法'],
        content: '坐落在艾尔登大陆中心的魔法学院，是大陆上最古老的魔法教育机构。',
        category: 'location',
        priority: 70,
        isActive: true,
        context: { always: false, probability: 0.8 }
      },
      {
        id: '3',
        name: '圣剑',
        triggers: ['圣剑', '传说武器', '神器'],
        content: '传说中的圣剑，只有被选中的勇者才能拔出。',
        category: 'item',
        priority: 60,
        isActive: true,
        context: { always: false, probability: 0.6 }
      }
    ]
  }

  private generateId(): string {
    return `wi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const worldInfoService = new WorldInfoService()
