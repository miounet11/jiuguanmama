import { ref, computed, onUnmounted, watch } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useUserStore } from '@/stores/user'

// 全局WebSocket状态
let socket: Socket | null = null
const connected = ref(false)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const listeners = new Map<string, Set<Function>>()

let reconnectTimer: NodeJS.Timeout | null = null

export const useWebSocket = () => {
  const userStore = useUserStore()

  const connect = () => {
    if (socket?.connected) return

    if (!userStore.token) {
      console.warn('No authentication token available for WebSocket connection')
      return
    }

    const wsUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

    socket = io(wsUrl, {
      auth: {
        token: userStore.token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false, // 手动处理重连
      autoConnect: false
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
      connected.value = true
      reconnectAttempts.value = 0

      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      connected.value = false

      // 自动重连（除非是主动断开）
      if (reason !== 'io client disconnect') {
        scheduleReconnect()
      }
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      connected.value = false
      scheduleReconnect()
    })

    socket.on('auth_error', (data) => {
      console.error('WebSocket authentication error:', data)
      connected.value = false
      // 认证失败，清除token
      userStore.logout()
    })

    // 连接成功确认
    socket.on('connected', (data) => {
      console.log('WebSocket authentication successful:', data)
    })

    socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    // 转发所有事件到监听器
    socket.onAny((event, ...args) => {
      const handlers = listeners.get(event)
      if (handlers) {
        handlers.forEach(handler => handler(...args))
      }
    })

    // 建立连接
    socket.connect()
  }

  // 调度重连
  const scheduleReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached')
      return
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
    console.log(`Scheduling reconnection attempt ${reconnectAttempts.value + 1} in ${delay}ms`)

    reconnectTimer = setTimeout(() => {
      reconnectAttempts.value++
      connect()
    }, delay)
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (socket) {
      socket.disconnect()
      socket = null
      connected.value = false
    }
  }

  const send = (event: string, data?: any) => {
    if (socket?.connected) {
      socket.emit(event, data)
      return true
    } else {
      console.warn('WebSocket not connected')
      return false
    }
  }

  const on = (event: string, handler: Function) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(handler)
  }

  const off = (event: string, handler?: Function) => {
    if (handler) {
      listeners.get(event)?.delete(handler)
    } else {
      listeners.delete(event)
    }
  }

  // 监听用户认证状态变化
  watch(() => userStore.isAuthenticated, (authenticated) => {
    if (authenticated && userStore.token) {
      connect()
    } else {
      disconnect()
    }
  }, { immediate: true })

  onUnmounted(() => {
    // 清理当前组件的所有监听器
    // 但保持连接供其他组件使用
  })

  return {
    socket: computed(() => socket),
    isConnected: computed(() => connected.value),
    reconnectAttempts: computed(() => reconnectAttempts.value),
    connect,
    disconnect,
    send,
    on,
    off
  }
}

// 聊天室WebSocket功能的封装
export const useChatRoomWebSocket = () => {
  const { socket, isConnected, send, on, off } = useWebSocket()

  // 加入聊天室
  const joinRoom = (roomId: string) => {
    return send('join_room', { roomId })
  }

  // 离开聊天室
  const leaveRoom = (roomId: string) => {
    return send('leave_room', { roomId })
  }

  // 发送消息
  const sendMessage = (roomId: string, content: string, messageType = 'text', replyToId?: string) => {
    return send('send_message', {
      roomId,
      content,
      messageType,
      replyToId
    })
  }

  // 发送输入状态
  const sendTyping = (roomId: string, isTyping: boolean) => {
    return send('typing', { roomId, isTyping })
  }

  // 召唤角色
  const summonCharacter = (roomId: string, characterId: string, customPrompt?: string) => {
    return send('summon_character', {
      roomId,
      characterId,
      customPrompt
    })
  }

  // 触发AI回复
  const triggerAIResponse = (roomId: string, characterId: string, trigger?: string) => {
    return send('trigger_ai_response', {
      roomId,
      characterId,
      trigger
    })
  }

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    summonCharacter,
    triggerAIResponse,
    on,
    off
  }
}