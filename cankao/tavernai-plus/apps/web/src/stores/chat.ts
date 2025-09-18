import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  characterId?: string
  characterName?: string
  characterAvatar?: string
  timestamp: string
  isStreaming?: boolean
  isError?: boolean
  metadata?: Record<string, any>
}

export interface ChatSession {
  id: string
  characterId: string
  characterName: string
  characterAvatar?: string
  userId: string
  messages: Message[]
  title?: string
  summary?: string
  createdAt: string
  updatedAt: string
  settings?: ChatSettings
}

export interface ChatSettings {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  systemPrompt?: string
}

export const useChatStore = defineStore('chat', () => {
  // 状态
  const sessions = ref<ChatSession[]>([])
  const currentSession = ref<ChatSession | null>(null)
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  // WebSocket连接
  const wsConnection = ref<WebSocket | null>(null)
  const wsConnected = ref(false)

  // 输入状态
  const inputMessage = ref('')
  const isTyping = ref(false)

  // 计算属性
  const hasMessages = computed(() => messages.value.length > 0)

  const lastMessage = computed(() =>
    messages.value.length > 0 ? messages.value[messages.value.length - 1] : null
  )

  const sessionCount = computed(() => sessions.value.length)

  // 获取会话列表
  const fetchSessions = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get('/chat/sessions')

      if (response.success) {
        sessions.value = response.sessions
      } else {
        throw new Error(response.message || 'Failed to fetch sessions')
      }
    } catch (err: any) {
      error.value = err.message || '获取会话列表失败'
      console.error('Error fetching sessions:', err)
      sessions.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 创建新会话
  const createSession = async (characterId: string, characterName: string, characterAvatar?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('/chat/sessions', {
        characterId,
        title: `与 ${characterName} 的对话`
      })

      if (response.success) {
        const newSession: ChatSession = {
          ...response.session,
          characterName,
          characterAvatar,
          messages: []
        }

        sessions.value.unshift(newSession)
        currentSession.value = newSession
        messages.value = []

        return newSession
      } else {
        throw new Error(response.message || 'Failed to create session')
      }
    } catch (err: any) {
      error.value = err.message || '创建会话失败'
      console.error('Error creating session:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 加载会话
  const loadSession = async (sessionId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get(`/chat/sessions/${sessionId}`)

      if (response.success) {
        currentSession.value = response.session
        messages.value = response.session.messages || []

        return response.session
      } else {
        throw new Error(response.message || 'Failed to load session')
      }
    } catch (err: any) {
      error.value = err.message || '加载会话失败'
      console.error('Error loading session:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 发送消息
  const sendMessage = async (content: string, options?: {
    useGuidance?: boolean
    guidanceOptions?: any
  }) => {
    if (!currentSession.value) {
      error.value = '请先选择一个角色开始对话'
      return
    }

    if (!content.trim()) {
      return
    }

    // 添加用户消息
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }

    messages.value.push(userMessage)
    inputMessage.value = ''

    // 添加AI消息占位符
    const aiMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      characterId: currentSession.value.characterId,
      characterName: currentSession.value.characterName,
      characterAvatar: currentSession.value.characterAvatar,
      timestamp: new Date().toISOString(),
      isStreaming: true
    }

    messages.value.push(aiMessage)
    isStreaming.value = true
    error.value = null

    try {
      // 构建请求数据
      const requestData: any = {
        sessionId: currentSession.value.id,
        message: content.trim(),
        settings: currentSession.value.settings
      }

      // 如果使用指导回复
      if (options?.useGuidance && options.guidanceOptions) {
        requestData.guidance = options.guidanceOptions
      }

      // 发送消息到后端
      const response = await api.post('/chat/send', requestData)

      if (response.success) {
        // 更新AI消息
        aiMessage.content = response.reply
        aiMessage.isStreaming = false

        // 更新会话
        if (response.session) {
          currentSession.value = response.session
        }
      } else {
        throw new Error(response.message || 'Failed to send message')
      }
    } catch (err: any) {
      error.value = err.message || '发送消息失败'
      console.error('Error sending message:', err)

      // 标记AI消息为错误
      aiMessage.content = '抱歉，发送消息时出现错误。请稍后重试。'
      aiMessage.isError = true
      aiMessage.isStreaming = false
    } finally {
      isStreaming.value = false
    }
  }

  // 流式发送消息（使用WebSocket）
  const sendStreamingMessage = async (content: string) => {
    if (!currentSession.value || !wsConnected.value) {
      error.value = '连接未建立，请稍后重试'
      return
    }

    if (!content.trim()) {
      return
    }

    // 添加用户消息
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }

    messages.value.push(userMessage)
    inputMessage.value = ''

    // 添加AI消息占位符
    const aiMessageId = `msg-${Date.now() + 1}`
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      characterId: currentSession.value.characterId,
      characterName: currentSession.value.characterName,
      characterAvatar: currentSession.value.characterAvatar,
      timestamp: new Date().toISOString(),
      isStreaming: true
    }

    messages.value.push(aiMessage)
    isStreaming.value = true

    // 通过WebSocket发送
    if (wsConnection.value) {
      wsConnection.value.send(JSON.stringify({
        type: 'message',
        sessionId: currentSession.value.id,
        content: content.trim(),
        messageId: aiMessageId
      }))
    }
  }

  // 建立WebSocket连接
  const connectWebSocket = () => {
    if (wsConnection.value) {
      return
    }

    const token = localStorage.getItem('token')
    const wsUrl = `ws://localhost:3001/ws?token=${token}`

    wsConnection.value = new WebSocket(wsUrl)

    wsConnection.value.onopen = () => {
      wsConnected.value = true
      console.log('WebSocket connected')
    }

    wsConnection.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'stream':
            // 更新流式消息
            const msg = messages.value.find(m => m.id === data.messageId)
            if (msg) {
              msg.content += data.content
            }
            break

          case 'complete':
            // 完成流式消息
            const completeMsg = messages.value.find(m => m.id === data.messageId)
            if (completeMsg) {
              completeMsg.isStreaming = false
            }
            isStreaming.value = false
            break

          case 'error':
            error.value = data.message
            isStreaming.value = false
            break

          case 'typing':
            // 处理对方正在输入
            isTyping.value = data.isTyping
            break
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    }

    wsConnection.value.onclose = () => {
      wsConnected.value = false
      wsConnection.value = null
      console.log('WebSocket disconnected')

      // 5秒后尝试重连
      setTimeout(() => {
        if (!wsConnection.value) {
          connectWebSocket()
        }
      }, 5000)
    }

    wsConnection.value.onerror = (error) => {
      console.error('WebSocket error:', error)
      wsConnected.value = false
    }
  }

  // 断开WebSocket连接
  const disconnectWebSocket = () => {
    if (wsConnection.value) {
      wsConnection.value.close()
      wsConnection.value = null
      wsConnected.value = false
    }
  }

  // 删除消息
  const deleteMessage = async (messageId: string) => {
    const index = messages.value.findIndex(m => m.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }

  // 编辑消息
  const editMessage = async (messageId: string, newContent: string) => {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.content = newContent
    }
  }

  // 重新生成回复
  const regenerateReply = async (messageId: string) => {
    const index = messages.value.findIndex(m => m.id === messageId)
    if (index === -1 || messages.value[index].role !== 'assistant') {
      return
    }

    // 找到对应的用户消息
    const userMessage = messages.value[index - 1]
    if (!userMessage || userMessage.role !== 'user') {
      return
    }

    // 删除当前AI回复
    messages.value.splice(index, 1)

    // 重新发送
    await sendMessage(userMessage.content)
  }

  // 清空当前会话
  const clearSession = () => {
    messages.value = []
    if (currentSession.value) {
      currentSession.value.messages = []
    }
  }

  // 删除会话
  const deleteSession = async (sessionId: string) => {
    try {
      const response = await api.delete(`/chat/sessions/${sessionId}`)

      if (response.success) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId)

        if (currentSession.value?.id === sessionId) {
          currentSession.value = null
          messages.value = []
        }

        return true
      }
      return false
    } catch (err: any) {
      error.value = err.message || '删除会话失败'
      console.error('Error deleting session:', err)
      return false
    }
  }

  return {
    // 状态
    sessions,
    currentSession,
    messages,
    isLoading,
    isStreaming,
    error,
    wsConnected,
    inputMessage,
    isTyping,

    // 计算属性
    hasMessages,
    lastMessage,
    sessionCount,

    // 方法
    fetchSessions,
    createSession,
    loadSession,
    sendMessage,
    sendStreamingMessage,
    connectWebSocket,
    disconnectWebSocket,
    deleteMessage,
    editMessage,
    regenerateReply,
    clearSession,
    deleteSession
  }
})
