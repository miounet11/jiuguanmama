import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/services/api'

export interface ChatRoom {
  id: string
  name: string
  description?: string
  ownerId: string
  maxParticipants: number
  isPrivate: boolean
  allowSpectators: boolean
  roomType: string
  lastMessageAt?: string
  messageCount: number
  totalTokens: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    username: string
    avatar?: string
  }
  participants: Array<{
    id: string
    userId?: string
    characterId?: string
    role: string
    joinedAt: string
    isActive: boolean
    user?: {
      id: string
      username: string
      avatar?: string
    }
    character?: {
      id: string
      name: string
      avatar?: string
      personality?: string
    }
  }>
  _count?: {
    messages: number
  }
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId?: string
  characterId?: string
  content: string
  messageType: string
  replyToId?: string
  tokens: number
  isEdited: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  sender?: {
    id: string
    username: string
    avatar?: string
  }
  character?: {
    id: string
    name: string
    avatar?: string
  }
  replyTo?: ChatMessage
}

export interface CreateRoomData {
  name: string
  description?: string
  maxParticipants?: number
  isPrivate?: boolean
  allowSpectators?: boolean
  roomType?: string
}

export const useChatRoomStore = defineStore('chatroom', () => {
  // 状态
  const rooms = ref<ChatRoom[]>([])
  const currentRoom = ref<ChatRoom | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const roomCount = computed(() => rooms.value.length)
  const publicRooms = computed(() => rooms.value.filter(room => !room.isPrivate))
  const privateRooms = computed(() => rooms.value.filter(room => room.isPrivate))

  // 创建聊天室
  const createRoom = async (data: CreateRoomData): Promise<ChatRoom> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.post('/api/chatrooms/create', data)

      if (response.data.success) {
        const newRoom = response.data.room
        rooms.value.unshift(newRoom)
        return newRoom
      } else {
        throw new Error(response.data.error || '创建聊天室失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '创建聊天室失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 获取聊天室列表
  const getRooms = async (page = 1, limit = 20): Promise<ChatRoom[]> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.get('/api/chatrooms/list', {
        params: { page, limit }
      })

      if (response.data.success) {
        const roomList = response.data.rooms

        if (page === 1) {
          rooms.value = roomList
        } else {
          rooms.value.push(...roomList)
        }

        return roomList
      } else {
        throw new Error(response.data.error || '获取聊天室列表失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '获取聊天室列表失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 获取聊天室详情
  const getRoomDetails = async (roomId: string): Promise<ChatRoom> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.get(`/api/chatrooms/${roomId}`)

      if (response.data.success) {
        const roomData = response.data.room
        currentRoom.value = roomData

        // 更新rooms列表中的对应房间
        const roomIndex = rooms.value.findIndex(r => r.id === roomId)
        if (roomIndex !== -1) {
          rooms.value[roomIndex] = roomData
        }

        return roomData
      } else {
        throw new Error(response.data.error || '获取聊天室详情失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '获取聊天室详情失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 加入聊天室
  const joinRoom = async (roomId: string, characterId?: string): Promise<any> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.post(`/api/chatrooms/${roomId}/join`, {
        roomId,
        characterId
      })

      if (response.data.success) {
        return response.data.participant
      } else {
        throw new Error(response.data.error || '加入聊天室失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '加入聊天室失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 离开聊天室
  const leaveRoom = async (roomId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.post(`/api/chatrooms/${roomId}/leave`)

      if (response.data.success) {
        // 从当前房间清除
        if (currentRoom.value?.id === roomId) {
          currentRoom.value = null
          messages.value = []
        }
      } else {
        throw new Error(response.data.error || '离开聊天室失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '离开聊天室失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 发送消息
  const sendMessage = async (roomId: string, content: string, messageType = 'text', replyToId?: string): Promise<ChatMessage> => {
    try {
      error.value = null

      const response = await apiClient.post(`/api/chatrooms/${roomId}/messages`, {
        content,
        messageType,
        replyToId
      })

      if (response.data.success) {
        const message = response.data.message
        messages.value.push(message)
        return message
      } else {
        throw new Error(response.data.error || '发送消息失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '发送消息失败'
      error.value = message
      throw new Error(message)
    }
  }

  // 获取消息历史
  const getMessages = async (roomId: string, page = 1, limit = 50): Promise<ChatMessage[]> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.get(`/api/chatrooms/${roomId}/messages`, {
        params: { page, limit }
      })

      if (response.data.success) {
        const messageList = response.data.messages

        if (page === 1) {
          messages.value = messageList
        } else {
          // 历史消息插入到前面
          messages.value.unshift(...messageList)
        }

        return messageList
      } else {
        throw new Error(response.data.error || '获取消息失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '获取消息失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 召唤角色
  const summonCharacter = async (roomId: string, characterId: string, customPrompt?: string): Promise<any> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.post(`/api/chatrooms/${roomId}/summon`, {
        characterId,
        customPrompt
      })

      if (response.data.success) {
        // 添加加入消息
        if (response.data.joinMessage) {
          messages.value.push(response.data.joinMessage)
        }

        return response.data
      } else {
        throw new Error(response.data.error || '召唤角色失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '召唤角色失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 触发AI回复
  const triggerAIResponse = async (roomId: string, characterId: string, trigger?: string): Promise<ChatMessage> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.post(`/api/chatrooms/${roomId}/characters/${characterId}/respond`, {
        trigger
      })

      if (response.data.success) {
        const message = response.data.message
        messages.value.push(message)
        return message
      } else {
        throw new Error(response.data.error || '触发AI回复失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '触发AI回复失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 移除角色
  const removeCharacter = async (roomId: string, characterId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.delete(`/api/chatrooms/${roomId}/characters/${characterId}`)

      if (!response.data.success) {
        throw new Error(response.data.error || '移除角色失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '移除角色失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 更新房间设置
  const updateRoomSettings = async (roomId: string, settings: any): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const response = await apiClient.patch(`/api/chatrooms/${roomId}/settings`, settings)

      if (response.data.success) {
        // 更新当前房间信息
        if (currentRoom.value?.id === roomId) {
          currentRoom.value = { ...currentRoom.value, ...settings }
        }
      } else {
        throw new Error(response.data.error || '更新房间设置失败')
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || '更新房间设置失败'
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 添加消息到本地（用于WebSocket）
  const addMessage = (message: ChatMessage) => {
    messages.value.push(message)
  }

  // 更新参与者列表
  const updateParticipants = (roomId: string, participants: any[]) => {
    if (currentRoom.value?.id === roomId) {
      currentRoom.value.participants = participants
    }

    // 更新rooms列表中的对应房间
    const roomIndex = rooms.value.findIndex(r => r.id === roomId)
    if (roomIndex !== -1) {
      rooms.value[roomIndex].participants = participants
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 重置状态
  const reset = () => {
    rooms.value = []
    currentRoom.value = null
    messages.value = []
    loading.value = false
    error.value = null
  }

  return {
    // 状态
    rooms,
    currentRoom,
    messages,
    loading,
    error,

    // 计算属性
    roomCount,
    publicRooms,
    privateRooms,

    // 方法
    createRoom,
    getRooms,
    getRoomDetails,
    joinRoom,
    leaveRoom,
    sendMessage,
    getMessages,
    summonCharacter,
    triggerAIResponse,
    removeCharacter,
    updateRoomSettings,
    addMessage,
    updateParticipants,
    clearError,
    reset
  }
})