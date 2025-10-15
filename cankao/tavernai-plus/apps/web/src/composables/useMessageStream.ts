import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'

// Types
export interface StreamMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  characterId?: string
  characterName?: string
  characterAvatar?: string
  isStreaming?: boolean
  isComplete?: boolean
  isError?: boolean
  tokenCount?: number
  responseTime?: number
  metadata?: Record<string, any>
}

export interface StreamOptions {
  characterId: string
  settings?: {
    model?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  }
  signal?: AbortSignal
}

export interface StreamChunk {
  type: 'connected' | 'chunk' | 'complete' | 'error'
  id?: string
  content?: string
  fullContent?: string
  userMessage?: any
  timestamp?: string
  error?: string
  message?: string
}

export interface UseMessageStreamReturn {
  // 状态
  isStreaming: Ref<boolean>
  streamingMessage: Ref<StreamMessage | null>
  error: Ref<string | null>

  // 方法
  sendStreamMessage: (content: string, options: StreamOptions) => Promise<StreamMessage>
  stopStream: () => void
  retryLastMessage: () => Promise<StreamMessage | null>

  // 事件回调
  onStreamStart: (callback: (message: StreamMessage) => void) => void
  onStreamChunk: (callback: (chunk: string, fullContent: string) => void) => void
  onStreamComplete: (callback: (message: StreamMessage) => void) => void
  onStreamError: (callback: (error: string) => void) => void
}

/**
 * 流式消息处理 Composable
 *
 * 提供完整的流式对话功能，包括：
 * - SSE (Server-Sent Events) 流式响应处理
 * - 实时消息内容更新
 * - 错误处理和重试机制
 * - 中断和恢复功能
 * - 消息状态管理
 */
export function useMessageStream(): UseMessageStreamReturn {
  // === 状态管理 ===
  const isStreaming = ref(false)
  const streamingMessage = ref<StreamMessage | null>(null)
  const error = ref<string | null>(null)

  // 内部状态
  const abortController = ref<AbortController | null>(null)
  const reader = ref<ReadableStreamDefaultReader | null>(null)
  const lastMessageOptions = ref<{ content: string; options: StreamOptions } | null>(null)

  // 事件回调
  const callbacks = {
    onStart: [] as Array<(message: StreamMessage) => void>,
    onChunk: [] as Array<(chunk: string, fullContent: string) => void>,
    onComplete: [] as Array<(message: StreamMessage) => void>,
    onError: [] as Array<(error: string) => void>
  }

  // === 核心方法 ===

  /**
   * 发送流式消息
   */
  const sendStreamMessage = async (content: string, options: StreamOptions): Promise<StreamMessage> => {
    try {
      // 清理错误状态
      error.value = null

      // 记录最后一次请求，用于重试
      lastMessageOptions.value = { content, options }

      // 创建新的 AbortController
      abortController.value = new AbortController()

      // 获取API基地址
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009'
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('未找到认证令牌，请重新登录')
      }

      // 发起流式请求
      const response = await fetch(`${API_BASE_URL}/api/chats/${options.characterId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          content,
          settings: options.settings,
          stream: true
        }),
        signal: abortController.value.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      if (!response.body) {
        throw new Error('响应体为空')
      }

      // 创建流式消息对象
      const message: StreamMessage = {
        id: `stream_${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        characterId: options.characterId,
        isStreaming: true,
        isComplete: false,
        isError: false
      }

      streamingMessage.value = message
      isStreaming.value = true

      // 触发开始回调
      callbacks.onStart.forEach(cb => cb(message))

      // 开始处理流式数据
      await processStream(response.body, message)

      return message

    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' ? '用户取消了请求' : err.message || '发送消息失败'

      error.value = errorMessage
      isStreaming.value = false

      if (streamingMessage.value) {
        streamingMessage.value.isError = true
        streamingMessage.value.isStreaming = false
        streamingMessage.value.content = `错误: ${errorMessage}`
      }

      // 触发错误回调
      callbacks.onError.forEach(cb => cb(errorMessage))

      throw err
    } finally {
      // 清理资源
      cleanup()
    }
  }

  /**
   * 处理流式数据
   */
  const processStream = async (body: ReadableStream, message: StreamMessage) => {
    reader.value = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.value.read()

        if (done) {
          break
        }

        // 解码数据并添加到缓冲区
        buffer += decoder.decode(value, { stream: true })

        // 按行分割数据
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一行未完整的数据

        // 处理每一行
        for (const line of lines) {
          await processStreamLine(line, message)
        }
      }

      // 处理最后的缓冲区数据
      if (buffer.trim()) {
        await processStreamLine(buffer, message)
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        throw err
      }
    } finally {
      // 释放 reader
      if (reader.value) {
        reader.value.releaseLock()
        reader.value = null
      }
    }
  }

  /**
   * 处理单行流式数据
   */
  const processStreamLine = async (line: string, message: StreamMessage) => {
    const trimmedLine = line.trim()

    if (!trimmedLine || !trimmedLine.startsWith('data: ')) {
      return
    }

    const dataStr = trimmedLine.slice(6).trim()

    // 检查结束标志
    if (dataStr === '[DONE]') {
      finalizeMessage(message)
      return
    }

    try {
      const chunk: StreamChunk = JSON.parse(dataStr)

      switch (chunk.type) {
        case 'connected':
          handleConnected(chunk, message)
          break

        case 'chunk':
          handleChunk(chunk, message)
          break

        case 'complete':
          handleComplete(chunk, message)
          break

        case 'error':
          handleError(chunk, message)
          break

        default:
          console.warn('未知的流式数据类型:', chunk.type)
      }

    } catch (parseError) {
      console.error('解析流式数据失败:', parseError, '数据:', dataStr)

      // 尝试作为纯文本处理
      if (dataStr && dataStr !== '[DONE]') {
        message.content += dataStr
        callbacks.onChunk.forEach(cb => cb(dataStr, message.content))
      }
    }
  }

  /**
   * 处理连接确认
   */
  const handleConnected = (chunk: StreamChunk, message: StreamMessage) => {
    if (chunk.userMessage?.id) {
      // 更新用户消息ID（如果需要）
      console.log('连接已建立，用户消息ID:', chunk.userMessage.id)
    }
  }

  /**
   * 处理内容块
   */
  const handleChunk = (chunk: StreamChunk, message: StreamMessage) => {
    const content = chunk.fullContent || chunk.content || ''
    const previousContent = message.content

    message.content = content

    // 触发内容更新回调
    const newChunk = content.slice(previousContent.length)
    if (newChunk) {
      callbacks.onChunk.forEach(cb => cb(newChunk, content))
    }
  }

  /**
   * 处理完成
   */
  const handleComplete = (chunk: StreamChunk, message: StreamMessage) => {
    if (chunk.id) {
      message.id = chunk.id
    }

    if (chunk.content) {
      message.content = chunk.content
    }

    if (chunk.timestamp) {
      message.timestamp = new Date(chunk.timestamp)
    }

    finalizeMessage(message)
  }

  /**
   * 处理错误
   */
  const handleError = (chunk: StreamChunk, message: StreamMessage) => {
    const errorMessage = chunk.message || chunk.error || '发生未知错误'

    message.isError = true
    message.content = `错误: ${errorMessage}`
    error.value = errorMessage

    finalizeMessage(message)

    // 触发错误回调
    callbacks.onError.forEach(cb => cb(errorMessage))
  }

  /**
   * 完成消息处理
   */
  const finalizeMessage = (message: StreamMessage) => {
    message.isStreaming = false
    message.isComplete = true
    isStreaming.value = false

    // 触发完成回调
    callbacks.onComplete.forEach(cb => cb(message))
  }

  /**
   * 停止流式传输
   */
  const stopStream = () => {
    if (abortController.value) {
      abortController.value.abort()
    }

    if (streamingMessage.value && streamingMessage.value.isStreaming) {
      streamingMessage.value.isStreaming = false
      streamingMessage.value.content += '\n\n[已停止生成]'
    }

    isStreaming.value = false
    cleanup()
  }

  /**
   * 重试最后一次消息
   */
  const retryLastMessage = async (): Promise<StreamMessage | null> => {
    if (!lastMessageOptions.value) {
      throw new Error('没有可重试的消息')
    }

    const { content, options } = lastMessageOptions.value
    return await sendStreamMessage(content, options)
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (reader.value) {
      reader.value.releaseLock()
      reader.value = null
    }

    abortController.value = null
  }

  // === 事件回调注册 ===

  const onStreamStart = (callback: (message: StreamMessage) => void) => {
    callbacks.onStart.push(callback)
  }

  const onStreamChunk = (callback: (chunk: string, fullContent: string) => void) => {
    callbacks.onChunk.push(callback)
  }

  const onStreamComplete = (callback: (message: StreamMessage) => void) => {
    callbacks.onComplete.push(callback)
  }

  const onStreamError = (callback: (error: string) => void) => {
    callbacks.onError.push(callback)
  }

  // === 生命周期 ===

  onUnmounted(() => {
    stopStream()
  })

  // === 计算属性 ===

  const canRetry = computed(() => {
    return lastMessageOptions.value !== null && !isStreaming.value
  })

  const streamingProgress = computed(() => {
    if (!streamingMessage.value || !streamingMessage.value.isStreaming) {
      return 0
    }

    // 简单的进度估算，基于内容长度
    const contentLength = streamingMessage.value.content.length
    return Math.min(Math.max(contentLength / 1000, 0.1), 0.9)
  })

  return {
    // 状态
    isStreaming,
    streamingMessage,
    error,

    // 方法
    sendStreamMessage,
    stopStream,
    retryLastMessage,

    // 事件回调
    onStreamStart,
    onStreamChunk,
    onStreamComplete,
    onStreamError
  }
}

/**
 * 简化版流式消息钩子
 * 适用于只需要基本流式功能的场景
 */
export function useSimpleMessageStream() {
  const {
    isStreaming,
    streamingMessage,
    error,
    sendStreamMessage,
    stopStream
  } = useMessageStream()

  const sendMessage = async (content: string, characterId: string) => {
    return await sendStreamMessage(content, { characterId })
  }

  return {
    isStreaming,
    streamingMessage,
    error,
    sendMessage,
    stopStream
  }
}

/**
 * 批量消息流处理
 * 支持同时处理多个流式对话
 */
export function useBatchMessageStream() {
  const streams = ref<Map<string, ReturnType<typeof useMessageStream>>>(new Map())

  const createStream = (streamId: string) => {
    const stream = useMessageStream()
    streams.value.set(streamId, stream)
    return stream
  }

  const getStream = (streamId: string) => {
    return streams.value.get(streamId)
  }

  const removeStream = (streamId: string) => {
    const stream = streams.value.get(streamId)
    if (stream) {
      stream.stopStream()
      streams.value.delete(streamId)
    }
  }

  const stopAllStreams = () => {
    streams.value.forEach(stream => stream.stopStream())
    streams.value.clear()
  }

  onUnmounted(() => {
    stopAllStreams()
  })

  return {
    createStream,
    getStream,
    removeStream,
    stopAllStreams,
    activeStreams: computed(() => Array.from(streams.value.keys()))
  }
}

export default useMessageStream