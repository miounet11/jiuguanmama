import { api } from './api'
import type { ChatSession, Message } from '@/types/chat'

export interface CreateSessionData {
  characterIds: string[]
  title?: string
}

export interface SendMessageData {
  content: string
  characterId?: string
}

export const chatService = {
  // 获取会话列表
  async getSessions(): Promise<ChatSession[]> {
    const response = await api.get('/chat/sessions')
    return response.data.sessions
  },
  
  // 创建新会话
  async createSession(data: CreateSessionData): Promise<ChatSession> {
    const response = await api.post('/chat/sessions', data)
    return response.data.session
  },
  
  // 获取会话详情
  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await api.get(`/chat/sessions/${sessionId}`)
    return response.data.session
  },
  
  // 获取会话消息
  async getMessages(sessionId: string): Promise<Message[]> {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`)
    return response.data.messages
  },
  
  // 发送消息
  async sendMessage(sessionId: string, data: SendMessageData): Promise<Message> {
    const response = await api.post(`/chat/sessions/${sessionId}/messages`, data)
    return response.data.message
  },
  
  // 删除会话
  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/chat/sessions/${sessionId}`)
  },
  
  // 归档会话
  async archiveSession(sessionId: string): Promise<void> {
    await api.post(`/chat/sessions/${sessionId}/archive`)
  },
  
  // 编辑消息
  async editMessage(sessionId: string, messageId: string, content: string): Promise<Message> {
    const response = await api.put(`/chat/sessions/${sessionId}/messages/${messageId}`, { content })
    return response.data.message
  },
  
  // 删除消息
  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    await api.delete(`/chat/sessions/${sessionId}/messages/${messageId}`)
  },
  
  // 重新生成消息
  async regenerateMessage(sessionId: string, messageId: string): Promise<Message> {
    const response = await api.post(`/chat/sessions/${sessionId}/messages/${messageId}/regenerate`)
    return response.data.message
  },
  
  // 中止生成
  async stopGeneration(sessionId: string): Promise<void> {
    await api.post(`/chat/sessions/${sessionId}/stop`)
  },
  
  // 清空上下文
  async clearContext(sessionId: string): Promise<void> {
    await api.post(`/chat/sessions/${sessionId}/clear-context`)
  },
  
  // 更新会话设置
  async updateSessionSettings(sessionId: string, settings: any): Promise<void> {
    await api.put(`/chat/sessions/${sessionId}/settings`, settings)
  }
}