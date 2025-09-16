import axios from 'axios'
import { prisma } from '../server'

// NewAPI 配置
const NEWAPI_BASE_URL = process.env.NEWAPI_BASE_URL || 'https://ttkk.inping.com/v1'
const NEWAPI_KEY = process.env.NEWAPI_KEY || 'sk-ap3W4RSYQgxXsatCrAog6dZwYKnxs12rHcyokvjIkPmgGZuY'
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'grok-3'

// 创建 axios 实例
const aiClient = axios.create({
  baseURL: NEWAPI_BASE_URL,
  headers: {
    'Authorization': `Bearer ${NEWAPI_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60秒超时
})

export interface GenerateOptions {
  sessionId: string
  userId: string
  characterId?: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

class AIService {
  // 生成聊天回复
  async generateChatResponse(options: GenerateOptions) {
    const {
      sessionId,
      userId,
      characterId,
      messages,
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 1000,
      stream = true
    } = options
    
    try {
      // 获取角色信息来构建系统提示
      let systemPrompt = '你是一个友好的AI助手。'
      
      if (characterId) {
        const character = await prisma.character.findUnique({
          where: { id: characterId }
        })
        
        if (character) {
          systemPrompt = this.buildCharacterPrompt(character)
        }
      }
      
      // 构建消息列表
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
      
      // 调用 NewAPI
      const response = await aiClient.post('/chat/completions', {
        model,
        messages: apiMessages,
        temperature,
        max_tokens: maxTokens,
        stream
      })
      
      if (stream) {
        // 返回流式响应
        return response.data
      } else {
        // 返回完整响应
        const content = response.data.choices[0]?.message?.content || ''
        return {
          content,
          model: response.data.model,
          usage: response.data.usage
        }
      }
    } catch (error: any) {
      console.error('AI生成失败:', error.response?.data || error.message)
      throw new Error('AI生成失败: ' + (error.response?.data?.error?.message || error.message))
    }
  }
  
  // 流式生成聊天回复
  async *generateChatStream(options: GenerateOptions) {
    const {
      sessionId,
      userId,
      characterId,
      messages,
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 1000
    } = options
    
    try {
      // 获取角色信息
      let systemPrompt = '你是一个友好的AI助手。'
      
      if (characterId) {
        const character = await prisma.character.findUnique({
          where: { id: characterId }
        })
        
        if (character) {
          systemPrompt = this.buildCharacterPrompt(character)
        }
      }
      
      // 构建消息列表
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
      ]
      
      // 调用 NewAPI 流式接口
      const response = await aiClient.post('/chat/completions', {
        model,
        messages: apiMessages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      }, {
        responseType: 'stream'
      })
      
      // 处理流式响应
      const stream = response.data
      let buffer = ''
      
      for await (const chunk of stream) {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              return
            }
            
            try {
              const parsed = JSON.parse(data) as StreamChunk
              const content = parsed.choices[0]?.delta?.content
              
              if (content) {
                yield content
              }
            } catch (e) {
              console.error('解析流数据失败:', e)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('流式生成失败:', error)
      throw new Error('流式生成失败: ' + error.message)
    }
  }
  
  // 构建角色提示词
  private buildCharacterPrompt(character: any): string {
    let prompt = `你是${character.name}。`
    
    if (character.description) {
      prompt += `\n\n角色描述：${character.description}`
    }
    
    if (character.personality) {
      prompt += `\n\n性格特征：${character.personality}`
    }
    
    if (character.backstory) {
      prompt += `\n\n背景故事：${character.backstory}`
    }
    
    if (character.speakingStyle) {
      prompt += `\n\n说话风格：${character.speakingStyle}`
    }
    
    if (character.systemPrompt) {
      prompt += `\n\n${character.systemPrompt}`
    }
    
    prompt += '\n\n请根据以上角色设定进行对话，保持角色的一致性。'
    
    return prompt
  }
  
  // 生成角色设定
  async generateCharacterProfile(name: string, tags: string[] = []) {
    try {
      const prompt = `请为一个名为"${name}"的AI角色生成详细的角色设定。
标签：${tags.join('、') || '无特定标签'}

请生成以下内容：
1. 角色描述（50-100字）
2. 性格特征（30-50字）
3. 背景故事（100-200字）
4. 说话风格（30-50字）
5. 初始消息（一句友好的问候）

请以JSON格式返回，包含以下字段：
- description
- personality
- backstory
- speakingStyle
- firstMessage`
      
      const response = await aiClient.post('/chat/completions', {
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的角色设计师，擅长创建有趣且独特的AI角色。请直接返回JSON格式的内容，不要包含任何其他说明。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
      
      const content = response.data.choices[0]?.message?.content || '{}'
      
      try {
        // 尝试解析JSON
        const parsed = JSON.parse(content)
        return parsed
      } catch (e) {
        // 如果解析失败，返回默认值
        console.error('解析角色设定JSON失败:', e)
        return {
          description: `${name}是一个独特而有趣的AI角色。`,
          personality: '友好、聪明、富有同情心',
          backstory: `${name}来自一个充满想象力的世界，拥有丰富的经历和故事。`,
          speakingStyle: '温和友善，偶尔幽默',
          firstMessage: `你好！我是${name}，很高兴认识你！有什么我可以帮助你的吗？`
        }
      }
    } catch (error: any) {
      console.error('生成角色设定失败:', error)
      throw new Error('生成角色设定失败')
    }
  }
  
  // 检查API状态
  async checkAPIStatus() {
    try {
      const response = await aiClient.get('/models')
      return {
        available: true,
        models: response.data.data || []
      }
    } catch (error) {
      return {
        available: false,
        error: 'API不可用'
      }
    }
  }
  
  // 计算tokens数量（简单估算）
  estimateTokens(text: string): number {
    // 中文大约1.5个字符一个token，英文大约4个字符一个token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishChars = text.length - chineseChars
    return Math.ceil(chineseChars / 1.5 + englishChars / 4)
  }
}

export const aiService = new AIService()