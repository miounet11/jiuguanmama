import { prisma } from '../server'

export interface GuidanceOptions {
  sessionId: string
  messageId?: string
  guidance: {
    type: 'continue' | 'rewrite' | 'expand' | 'shorten' | 'custom'
    instruction?: string        // 用户的具体指导
    tone?: 'friendly' | 'formal' | 'casual' | 'romantic' | 'dramatic'
    direction?: string          // 故事方向提示
    keywords?: string[]         // 必须包含的关键词
    avoidWords?: string[]       // 避免使用的词汇
    length?: 'short' | 'medium' | 'long'
  }
}

export interface GuidancePrompt {
  systemAddition: string
  userInstruction: string
  constraints: string[]
}

class GuidanceService {
  /**
   * 构建指导回复的提示词
   */
  buildGuidancePrompt(options: GuidanceOptions): GuidancePrompt {
    const { guidance } = options
    const constraints: string[] = []
    let systemAddition = ''
    let userInstruction = ''

    // 根据指导类型构建提示
    switch (guidance.type) {
      case 'continue':
        userInstruction = '继续这个对话，保持风格一致。'
        break

      case 'rewrite':
        userInstruction = '重新生成这个回复，使用不同的表达方式。'
        break

      case 'expand':
        userInstruction = '扩展这个回复，添加更多细节和描述。'
        constraints.push('回复长度应该是原来的2-3倍')
        break

      case 'shorten':
        userInstruction = '缩短这个回复，保留核心内容。'
        constraints.push('回复长度不超过100字')
        break

      case 'custom':
        userInstruction = guidance.instruction || '按照用户的指导生成回复。'
        break
    }

    // 添加语气指导
    if (guidance.tone) {
      const toneMap = {
        friendly: '使用友好温暖的语气',
        formal: '使用正式严谨的语气',
        casual: '使用轻松随意的语气',
        romantic: '使用浪漫深情的语气',
        dramatic: '使用戏剧性的、充满张力的语气'
      }
      systemAddition += `\n语气要求：${toneMap[guidance.tone]}`
    }

    // 添加方向指导
    if (guidance.direction) {
      systemAddition += `\n剧情方向：${guidance.direction}`
      constraints.push(`推动剧情向"${guidance.direction}"发展`)
    }

    // 添加关键词要求
    if (guidance.keywords && guidance.keywords.length > 0) {
      constraints.push(`必须自然地包含这些关键词：${guidance.keywords.join('、')}`)
    }

    // 添加避免词汇
    if (guidance.avoidWords && guidance.avoidWords.length > 0) {
      constraints.push(`避免使用这些词汇：${guidance.avoidWords.join('、')}`)
    }

    // 添加长度要求
    if (guidance.length) {
      const lengthMap = {
        short: '50-100字',
        medium: '150-300字',
        long: '400-800字'
      }
      constraints.push(`回复长度控制在${lengthMap[guidance.length]}`)
    }

    // 添加自定义指令
    if (guidance.instruction) {
      systemAddition += `\n特别指示：${guidance.instruction}`
    }

    return {
      systemAddition,
      userInstruction,
      constraints
    }
  }

  /**
   * 应用指导到消息生成
   */
  applyGuidanceToMessages(
    messages: Array<{ role: string; content: string }>,
    guidancePrompt: GuidancePrompt
  ): Array<{ role: string; content: string }> {
    const enhancedMessages = [...messages]

    // 在最后一条用户消息后添加指导
    if (enhancedMessages.length > 0) {
      const lastUserIndex = enhancedMessages
        .map((m, i) => ({ ...m, index: i }))
        .filter(m => m.role === 'user')
        .pop()?.index

      if (lastUserIndex !== undefined) {
        // 创建指导消息
        const guidanceMessage = {
          role: 'system' as const,
          content: `【回复指导】
${guidancePrompt.userInstruction}
${guidancePrompt.systemAddition}

要求：
${guidancePrompt.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

请严格按照以上指导生成回复。`
        }

        // 插入到用户消息之后
        enhancedMessages.splice(lastUserIndex + 1, 0, guidanceMessage)
      }
    }

    return enhancedMessages
  }

  /**
   * 保存指导历史
   */
  async saveGuidanceHistory(
    sessionId: string,
    messageId: string,
    guidance: GuidanceOptions['guidance']
  ) {
    // TODO: 创建 GuidanceHistory 表来保存指导历史
    // 这样可以学习用户偏好，提供更好的默认指导

    console.log('保存指导历史:', { sessionId, messageId, guidance })
  }

  /**
   * 获取智能指导建议
   */
  async getSuggestions(
    sessionId: string,
    context: string
  ): Promise<string[]> {
    // 基于上下文提供智能建议
    const suggestions = [
      '让对话更加浪漫',
      '添加一些幽默元素',
      '深入探讨这个话题',
      '转换到新的话题',
      '让角色表现得更加主动',
      '增加一些情感描写',
      '添加环境描写',
      '引入新的剧情转折'
    ]

    // TODO: 基于历史记录和上下文，使用 AI 生成更智能的建议

    return suggestions.slice(0, 5)
  }

  /**
   * 批量应用指导模板
   */
  getGuidanceTemplates() {
    return {
      romantic: {
        tone: 'romantic' as const,
        keywords: ['爱', '心动', '温柔'],
        direction: '增加浪漫氛围'
      },
      adventure: {
        tone: 'dramatic' as const,
        keywords: ['冒险', '挑战', '勇气'],
        direction: '推动冒险剧情'
      },
      mystery: {
        tone: 'formal' as const,
        keywords: ['线索', '谜题', '真相'],
        direction: '深化悬疑氛围'
      },
      comedy: {
        tone: 'casual' as const,
        keywords: ['搞笑', '幽默', '轻松'],
        direction: '增加喜剧效果'
      }
    }
  }
}

export const guidanceService = new GuidanceService()
