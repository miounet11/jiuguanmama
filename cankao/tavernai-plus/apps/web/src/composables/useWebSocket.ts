import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useUserStore } from '@/stores/user'

let socket: Socket | null = null
const connected = ref(false)
const listeners = new Map<string, Set<Function>>()

export const useWebSocket = () => {
  const userStore = useUserStore()
  
  const connect = () => {
    if (socket?.connected) return
    
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'
    
    socket = io(wsUrl, {
      auth: {
        token: userStore.token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })
    
    socket.on('connect', () => {
      console.log('WebSocket connected')
      connected.value = true
    })
    
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      connected.value = false
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
  }
  
  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
      connected.value = false
    }
  }
  
  const send = (event: string, data?: any) => {
    if (socket?.connected) {
      socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected')
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
  
  onUnmounted(() => {
    // 清理当前组件的所有监听器
    // 但保持连接供其他组件使用
  })
  
  return {
    connected,
    connect,
    disconnect,
    send,
    on,
    off
  }
}