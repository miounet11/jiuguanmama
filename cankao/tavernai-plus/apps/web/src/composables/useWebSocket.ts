import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useUserStore } from "@/stores/user"
import { ElMessage, ElNotification } from 'element-plus'

// WebSocket连接状态
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

// 事件类型定义
export interface ChatMessage {
  id: string
  roomId: string
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
  content: string
  messageType: string
  replyTo?: any
  attachments?: any[]
  tokens: number
  createdAt: string
}

export interface TypingUser {
  userId: string
  username: string
  isTyping: boolean
  timestamp: string
}

export interface OnlineUser {
  userId: string
  username: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  activity?: string
  lastSeen?: string
}

export interface AIStreamData {
  sessionId: string
  type: 'text' | 'voice' | 'image'
  stage?: 'start' | 'progress' | 'end' | 'error'
  data?: any
  progress?: number
  error?: string
  result?: any
  timestamp: string
}

export interface CommunityPost {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  type: 'text' | 'image' | 'character_share'
  attachments?: any[]
  createdAt: string
  likeCount: number
  commentCount: number
  isLiked: boolean
}

export interface Notification {
  id: string
  type: 'ai_complete' | 'community_interaction' | 'system_announcement' | 'usage_alert'
  title: string
  message: string
  data?: any
  priority: 'low' | 'medium' | 'high' | 'urgent'
  persistent?: boolean
  read?: boolean
  createdAt: string
}

export interface VoiceCallEvent {
  callId: string
  callerId?: string
  callerName?: string
  targetUserId?: string
  accepted?: boolean
  roomId?: string
  timestamp: string
}

// WebSocket连接管理
export function useWebSocket() {
  const authStore = useUserStore()

  // 连接状态
  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const socket = ref<Socket | null>(null)
  const lastConnected = ref<Date | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10

  // 服务器信息
  const serverInfo = reactive({
    version: '',
    features: [] as string[],
    connected: false
  })

  // 连接统计
  const connectionStats = reactive({
    totalMessages: 0,
    messagesReceived: 0,
    messagesSent: 0,
    latency: 0,
    uptime: 0
  })

  // 房间状态
  const currentRooms = ref<Set<string>>(new Set())
  const roomUsers = reactive<Map<string, OnlineUser[]>>(new Map())
  const typingUsers = reactive<Map<string, TypingUser[]>>(new Map())

  // AI流状态
  const activeAIStreams = reactive<Map<string, AIStreamData>>(new Map())
  const aiQueue = reactive<Map<string, any>>(new Map())

  // 社区状态
  const communityFeed = ref<CommunityPost[]>([])
  const onlineUsersGlobal = ref<OnlineUser[]>([])

  // 通知状态
  const notifications = ref<Notification[]>([])
  const unreadNotificationCount = ref(0)

  // 协作状态
  const collaborationSessions = reactive<Map<string, any>>(new Map())

  // 语音通话状态
  const incomingCall = ref<VoiceCallEvent | null>(null)
  const activeCall = ref<VoiceCallEvent | null>(null)

  // 初始化WebSocket连接
  const connect = (namespace: string = '') => {
    if (!authStore.token) {
      console.warn('No auth token available for WebSocket connection')
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3009'
    const fullUrl = namespace ? `${wsUrl}${namespace}` : wsUrl

    try {
      connectionStatus.value = 'connecting'

      socket.value = io(fullUrl, {
        auth: {
          token: authStore.token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxHttpBufferSize: 1e8 // 100MB
      })

      setupEventHandlers()

    } catch (error) {
      console.error('WebSocket connection error:', error)
      connectionStatus.value = 'error'
    }
  }

  // 设置事件处理器
  const setupEventHandlers = () => {
    if (!socket.value) return

    // 连接事件
    socket.value.on('connect', () => {
      connectionStatus.value = 'connected'
      lastConnected.value = new Date()
      reconnectAttempts.value = 0

      console.log('WebSocket connected:', socket.value?.id)
      ElMessage.success('连接成功')
    })

    socket.value.on('connected', (data) => {
      serverInfo.version = data.serverInfo?.version || ''
      serverInfo.features = data.serverInfo?.features || []
      serverInfo.connected = true

      console.log('Server info received:', data.serverInfo)
    })

    socket.value.on('disconnect', (reason) => {
      connectionStatus.value = 'disconnected'
      serverInfo.connected = false

      console.log('WebSocket disconnected:', reason)

      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要重新连接
        ElMessage.warning('连接已断开，正在重连...')
      }
    })

    socket.value.on('connect_error', (error) => {
      connectionStatus.value = 'error'
      reconnectAttempts.value++

      console.error('WebSocket connection error:', error)

      if (reconnectAttempts.value >= maxReconnectAttempts) {
        ElMessage.error('连接失败，请检查网络连接')
      }
    })

    socket.value.on('reconnect', (attemptNumber) => {
      connectionStatus.value = 'connected'
      console.log('WebSocket reconnected after', attemptNumber, 'attempts')
      ElMessage.success('重连成功')
    })

    socket.value.on('reconnecting', (attemptNumber) => {
      connectionStatus.value = 'reconnecting'
      console.log('WebSocket reconnecting, attempt:', attemptNumber)
    })

    // 认证和错误处理
    socket.value.on('auth_error', (data) => {
      console.error('Authentication error:', data.message)
      ElMessage.error('认证失败，请重新登录')
      authStore.logout()
    })

    socket.value.on('error', (error) => {
      console.error('Socket error:', error)
      ElMessage.error('连接出现错误')
    })

    socket.value.on('rate_limit_exceeded', (data) => {
      ElMessage.warning(`操作过于频繁，请稍后再试 (${data.action})`)
    })

    // 心跳
    socket.value.on('pong', (data) => {
      const now = new Date().getTime()
      const serverTime = new Date(data.timestamp).getTime()
      connectionStats.latency = Math.abs(now - serverTime)
    })

    // 聊天相关事件
    setupChatEvents()

    // AI相关事件
    setupAIEvents()

    // 社区相关事件
    setupCommunityEvents()

    // 通知相关事件
    setupNotificationEvents()

    // 协作相关事件
    setupCollaborationEvents()

    // 媒体相关事件
    setupMediaEvents()

    // 用户状态事件
    setupUserStatusEvents()
  }

  // 设置聊天事件
  const setupChatEvents = () => {
    if (!socket.value) return

    socket.value.on('new_message', (message: ChatMessage) => {
      connectionStats.messagesReceived++
      // 触发消息事件，由具体页面处理
      window.dispatchEvent(new CustomEvent('ws:new_message', { detail: message }))
    })

    socket.value.on('user_joined', (data) => {
      window.dispatchEvent(new CustomEvent('ws:user_joined', { detail: data }))
    })

    socket.value.on('user_left', (data) => {
      window.dispatchEvent(new CustomEvent('ws:user_left', { detail: data }))
    })

    socket.value.on('user_typing', (data: TypingUser) => {
      const roomTyping = typingUsers.get(data.userId) || []

      if (data.isTyping) {
        if (!roomTyping.find(u => u.userId === data.userId)) {
          roomTyping.push(data)
          typingUsers.set(data.userId, roomTyping)
        }
      } else {
        const filtered = roomTyping.filter(u => u.userId !== data.userId)
        typingUsers.set(data.userId, filtered)
      }

      window.dispatchEvent(new CustomEvent('ws:typing_update', { detail: data }))
    })

    socket.value.on('messages_read', (data) => {
      window.dispatchEvent(new CustomEvent('ws:messages_read', { detail: data }))
    })

    socket.value.on('character_summoned', (data) => {
      ElNotification({
        title: '角色召唤',
        message: `${data.character.name} 已加入聊天`,
        type: 'success'
      })
      window.dispatchEvent(new CustomEvent('ws:character_summoned', { detail: data }))
    })

    socket.value.on('ai_thinking', (data) => {
      window.dispatchEvent(new CustomEvent('ws:ai_thinking', { detail: data }))
    })

    socket.value.on('ai_response_failed', (data) => {
      ElMessage.error(`AI回复失败: ${data.error}`)
      window.dispatchEvent(new CustomEvent('ws:ai_response_failed', { detail: data }))
    })

    socket.value.on('room_joined', (data) => {
      currentRooms.value.add(data.roomId)
      window.dispatchEvent(new CustomEvent('ws:room_joined', { detail: data }))
    })
  }

  // 设置AI事件
  const setupAIEvents = () => {
    if (!socket.value) return

    socket.value.on('ai_stream_started', (data) => {
      activeAIStreams.set(data.sessionId, data)
      window.dispatchEvent(new CustomEvent('ws:ai_stream_started', { detail: data }))
    })

    socket.value.on('ai_stream_data', (data: AIStreamData) => {
      activeAIStreams.set(data.sessionId, data)
      window.dispatchEvent(new CustomEvent('ws:ai_stream_data', { detail: data }))
    })

    socket.value.on('ai_stream_end', (data: AIStreamData) => {
      activeAIStreams.delete(data.sessionId)
      window.dispatchEvent(new CustomEvent('ws:ai_stream_end', { detail: data }))
    })

    socket.value.on('ai_stream_error', (data) => {
      activeAIStreams.delete(data.sessionId)
      ElMessage.error(`AI处理失败: ${data.error}`)
      window.dispatchEvent(new CustomEvent('ws:ai_stream_error', { detail: data }))
    })

    socket.value.on('ai_queue_status', (data) => {
      if (data.items) {
        data.items.forEach((item: any) => {
          aiQueue.set(item.queueId, item)
        })
      } else {
        aiQueue.set(data.queueId, data)
      }
      window.dispatchEvent(new CustomEvent('ws:ai_queue_update', { detail: data }))
    })

    // 语音合成事件
    socket.value.on('voice_synthesis_queued', (data) => {
      aiQueue.set(data.queueId, { ...data, type: 'voice_synthesis' })
      window.dispatchEvent(new CustomEvent('ws:voice_synthesis_queued', { detail: data }))
    })

    socket.value.on('voice_synthesis_progress', (data) => {
      const existing = aiQueue.get(data.queueId)
      if (existing) {
        aiQueue.set(data.queueId, { ...existing, ...data })
      }
      window.dispatchEvent(new CustomEvent('ws:voice_synthesis_progress', { detail: data }))
    })

    socket.value.on('voice_synthesis_complete', (data) => {
      aiQueue.delete(data.queueId)
      ElNotification({
        title: '语音合成完成',
        message: '您的语音已生成完成',
        type: 'success'
      })
      window.dispatchEvent(new CustomEvent('ws:voice_synthesis_complete', { detail: data }))
    })

    // 图像生成事件
    socket.value.on('image_generation_queued', (data) => {
      aiQueue.set(data.queueId, { ...data, type: 'image_generation' })
      window.dispatchEvent(new CustomEvent('ws:image_generation_queued', { detail: data }))
    })

    socket.value.on('image_generation_progress', (data) => {
      const existing = aiQueue.get(data.queueId)
      if (existing) {
        aiQueue.set(data.queueId, { ...existing, ...data })
      }
      window.dispatchEvent(new CustomEvent('ws:image_generation_progress', { detail: data }))
    })

    socket.value.on('image_generation_complete', (data) => {
      aiQueue.delete(data.queueId)
      ElNotification({
        title: '图像生成完成',
        message: '您的图像已生成完成',
        type: 'success'
      })
      window.dispatchEvent(new CustomEvent('ws:image_generation_complete', { detail: data }))
    })

    // 语音转文字事件
    socket.value.on('speech_to_text_progress', (data) => {
      window.dispatchEvent(new CustomEvent('ws:speech_to_text_progress', { detail: data }))
    })

    socket.value.on('speech_to_text_result', (data) => {
      window.dispatchEvent(new CustomEvent('ws:speech_to_text_result', { detail: data }))
    })

    socket.value.on('speech_to_text_error', (data) => {
      ElMessage.error(`语音识别失败: ${data.error}`)
      window.dispatchEvent(new CustomEvent('ws:speech_to_text_error', { detail: data }))
    })
  }

  // 设置社区事件
  const setupCommunityEvents = () => {
    if (!socket.value) return

    socket.value.on('new_community_post', (data) => {
      communityFeed.value.unshift(data.post)
      ElNotification({
        title: '新动态',
        message: `${data.post.username} 发布了新动态`,
        type: 'info'
      })
      window.dispatchEvent(new CustomEvent('ws:new_community_post', { detail: data }))
    })

    socket.value.on('like_updated', (data) => {
      window.dispatchEvent(new CustomEvent('ws:like_updated', { detail: data }))
    })

    socket.value.on('new_comment', (data) => {
      window.dispatchEvent(new CustomEvent('ws:new_comment', { detail: data }))
    })

    socket.value.on('follow_updated', (data) => {
      window.dispatchEvent(new CustomEvent('ws:follow_updated', { detail: data }))
    })

    socket.value.on('new_follower', (data) => {
      ElNotification({
        title: '新粉丝',
        message: `${data.followerName} 关注了您`,
        type: 'success'
      })
      window.dispatchEvent(new CustomEvent('ws:new_follower', { detail: data }))
    })

    socket.value.on('content_shared', (data) => {
      window.dispatchEvent(new CustomEvent('ws:content_shared', { detail: data }))
    })

    socket.value.on('community_joined', (data) => {
      window.dispatchEvent(new CustomEvent('ws:community_joined', { detail: data }))
    })
  }

  // 设置通知事件
  const setupNotificationEvents = () => {
    if (!socket.value) return

    socket.value.on('notification', (notification: Notification) => {
      notifications.value.unshift(notification)

      if (!notification.read) {
        unreadNotificationCount.value++
      }

      // 显示通知
      const notificationConfig: any = {
        title: notification.title,
        message: notification.message,
        duration: notification.priority === 'urgent' ? 0 : 4500
      }

      switch (notification.priority) {
        case 'urgent':
          notificationConfig.type = 'error'
          break
        case 'high':
          notificationConfig.type = 'warning'
          break
        case 'medium':
          notificationConfig.type = 'success'
          break
        default:
          notificationConfig.type = 'info'
      }

      ElNotification(notificationConfig)
      window.dispatchEvent(new CustomEvent('ws:notification', { detail: notification }))
    })

    socket.value.on('system_notification', (notification: Notification) => {
      ElNotification({
        title: '系统通知',
        message: notification.message,
        type: 'warning',
        duration: 0 // 系统通知需要手动关闭
      })
      window.dispatchEvent(new CustomEvent('ws:system_notification', { detail: notification }))
    })

    socket.value.on('notifications_list', (data) => {
      notifications.value = data.notifications
      unreadNotificationCount.value = data.unreadCount
      window.dispatchEvent(new CustomEvent('ws:notifications_list', { detail: data }))
    })

    socket.value.on('notifications_marked_read', (data) => {
      data.notificationIds.forEach((id: string) => {
        const notification = notifications.value.find(n => n.id === id)
        if (notification && !notification.read) {
          notification.read = true
          unreadNotificationCount.value--
        }
      })
      window.dispatchEvent(new CustomEvent('ws:notifications_marked_read', { detail: data }))
    })
  }

  // 设置协作事件
  const setupCollaborationEvents = () => {
    if (!socket.value) return

    socket.value.on('collaboration_joined', (data) => {
      collaborationSessions.set(data.documentId, data)
      window.dispatchEvent(new CustomEvent('ws:collaboration_joined', { detail: data }))
    })

    socket.value.on('user_joined_collaboration', (data) => {
      window.dispatchEvent(new CustomEvent('ws:user_joined_collaboration', { detail: data }))
    })

    socket.value.on('user_left_collaboration', (data) => {
      window.dispatchEvent(new CustomEvent('ws:user_left_collaboration', { detail: data }))
    })

    socket.value.on('collaboration_update', (data) => {
      window.dispatchEvent(new CustomEvent('ws:collaboration_update', { detail: data }))
    })

    socket.value.on('cursor_update', (data) => {
      window.dispatchEvent(new CustomEvent('ws:cursor_update', { detail: data }))
    })
  }

  // 设置媒体事件
  const setupMediaEvents = () => {
    if (!socket.value) return

    socket.value.on('screen_share_started', (data) => {
      ElNotification({
        title: '屏幕共享',
        message: `${data.username} 开始了屏幕共享`,
        type: 'info'
      })
      window.dispatchEvent(new CustomEvent('ws:screen_share_started', { detail: data }))
    })

    socket.value.on('screen_share_ended', (data) => {
      window.dispatchEvent(new CustomEvent('ws:screen_share_ended', { detail: data }))
    })

    socket.value.on('voice_call_incoming', (data: VoiceCallEvent) => {
      incomingCall.value = data
      ElNotification({
        title: '语音通话',
        message: `${data.callerName} 向您发起语音通话`,
        type: 'info',
        duration: 0
      })
      window.dispatchEvent(new CustomEvent('ws:voice_call_incoming', { detail: data }))
    })

    socket.value.on('voice_call_response', (data: VoiceCallEvent) => {
      if (data.accepted) {
        activeCall.value = data
        ElMessage.success('语音通话已接通')
      } else {
        ElMessage.info('对方拒绝了通话')
      }
      incomingCall.value = null
      window.dispatchEvent(new CustomEvent('ws:voice_call_response', { detail: data }))
    })

    socket.value.on('file_upload_started', (data) => {
      window.dispatchEvent(new CustomEvent('ws:file_upload_started', { detail: data }))
    })
  }

  // 设置用户状态事件
  const setupUserStatusEvents = () => {
    if (!socket.value) return

    socket.value.on('user_status_update', (data: OnlineUser) => {
      // 更新全局在线用户列表
      const index = onlineUsersGlobal.value.findIndex(u => u.userId === data.userId)
      if (index > -1) {
        if (data.status === 'offline') {
          onlineUsersGlobal.value.splice(index, 1)
        } else {
          onlineUsersGlobal.value[index] = data
        }
      } else if (data.status !== 'offline') {
        onlineUsersGlobal.value.push(data)
      }

      window.dispatchEvent(new CustomEvent('ws:user_status_update', { detail: data }))
    })

    socket.value.on('online_users_list', (data) => {
      if (data.roomId) {
        roomUsers.set(data.roomId, data.users)
      } else {
        onlineUsersGlobal.value = data.users
      }
      window.dispatchEvent(new CustomEvent('ws:online_users_list', { detail: data }))
    })

    socket.value.on('user_activity_update', (data) => {
      window.dispatchEvent(new CustomEvent('ws:user_activity_update', { detail: data }))
    })
  }

  // 发送消息的辅助方法
  const emit = (event: string, data?: any): boolean => {
    if (!socket.value || !socket.value.connected) {
      ElMessage.warning('连接已断开，请刷新页面重试')
      return false
    }

    try {
      socket.value.emit(event, data)
      connectionStats.messagesSent++
      return true
    } catch (error) {
      console.error('Failed to emit event:', event, error)
      return false
    }
  }

  // 聊天相关方法
  const joinRoom = (roomId: string) => {
    return emit('join_room', { roomId })
  }

  const leaveRoom = (roomId: string) => {
    currentRooms.value.delete(roomId)
    return emit('leave_room', { roomId })
  }

  const sendMessage = (data: {
    roomId: string
    content: string
    messageType?: string
    replyToId?: string
    attachments?: any[]
  }) => {
    return emit('send_message', data)
  }

  const setTyping = (roomId: string, isTyping: boolean) => {
    return emit('typing', { roomId, isTyping })
  }

  const markMessagesRead = (roomId: string, messageIds: string[]) => {
    return emit('mark_read', { roomId, messageIds })
  }

  const summonCharacter = (roomId: string, characterId: string, customPrompt?: string) => {
    return emit('summon_character', { roomId, characterId, customPrompt })
  }

  const triggerAIResponse = (roomId: string, characterId: string, trigger?: string) => {
    return emit('trigger_ai_response', { roomId, characterId, trigger })
  }

  // AI相关方法
  const startAIStream = (sessionId: string, type: 'text' | 'voice' | 'image', characterId?: string) => {
    return emit('ai_stream_start', { sessionId, type, characterId })
  }

  const requestVoiceSynthesis = (text: string, voiceId?: string, speed?: number) => {
    return emit('voice_synthesis', { text, voiceId, speed })
  }

  const requestImageGeneration = (prompt: string, style?: string, size?: string) => {
    return emit('image_generation', { prompt, style, size })
  }

  const sendSpeechToText = (audioData: ArrayBuffer, sessionId: string) => {
    return emit('speech_to_text', { audioData, sessionId })
  }

  const getAIQueueStatus = (queueId?: string) => {
    return emit('ai_queue_status', { queueId })
  }

  // 社区相关方法
  const publishPost = (content: string, type: 'text' | 'image' | 'character_share', attachments?: any[]) => {
    return emit('publish_post', { content, type, attachments })
  }

  const toggleLike = (entityType: 'post' | 'comment' | 'character', entityId: string) => {
    return emit('toggle_like', { entityType, entityId })
  }

  const addComment = (entityType: 'post' | 'character', entityId: string, content: string, parentId?: string) => {
    return emit('add_comment', { entityType, entityId, content, parentId })
  }

  const toggleFollow = (targetUserId: string) => {
    return emit('toggle_follow', { targetUserId })
  }

  const shareContent = (entityType: string, entityId: string, platform?: string) => {
    return emit('share_content', { entityType, entityId, platform })
  }

  const joinCommunity = (interests?: string[], followedUsers?: string[]) => {
    return emit('join_community', { interests, followedUsers })
  }

  // 通知相关方法
  const getNotifications = (offset?: number, limit?: number) => {
    return emit('get_notifications', { offset, limit })
  }

  const markNotificationRead = (notificationIds: string[]) => {
    unreadNotificationCount.value = Math.max(0, unreadNotificationCount.value - notificationIds.length)
    return emit('mark_notification_read', { notificationIds })
  }

  const updateNotificationSettings = (settings: any) => {
    return emit('update_notification_settings', { settings })
  }

  // 协作相关方法
  const joinCollaboration = (documentId: string, documentType: 'character' | 'story' | 'prompt') => {
    return emit('join_collaboration', { documentId, documentType })
  }

  const leaveCollaboration = (documentId: string) => {
    collaborationSessions.delete(documentId)
    return emit('leave_collaboration', { documentId })
  }

  const sendCollaborationUpdate = (documentId: string, type: string, data: any, position?: any) => {
    return emit('collaboration_update', { documentId, type, data, position })
  }

  const updateCursor = (documentId: string, position: any) => {
    return emit('cursor_update', { documentId, position })
  }

  // 媒体相关方法
  const startScreenShare = (roomId: string, quality?: string) => {
    return emit('screen_share_start', { roomId, quality })
  }

  const endScreenShare = (roomId: string) => {
    return emit('screen_share_end', { roomId })
  }

  const requestVoiceCall = (targetUserId: string, roomId?: string) => {
    return emit('voice_call_request', { targetUserId, roomId })
  }

  const respondToVoiceCall = (callId: string, accepted: boolean) => {
    if (accepted) {
      activeCall.value = incomingCall.value
    }
    incomingCall.value = null
    return emit('voice_call_response', { callId, accepted })
  }

  const notifyFileUpload = (fileName: string, fileSize: number, fileType: string, roomId?: string) => {
    return emit('file_upload', { fileName, fileSize, fileType, roomId })
  }

  // 用户状态相关方法
  const updateStatus = (status: 'online' | 'away' | 'busy', activity?: string) => {
    return emit('update_status', { status, activity })
  }

  const getOnlineUsers = (roomId?: string) => {
    return emit('get_online_users', { roomId })
  }

  const updateActivity = (activity: string) => {
    return emit('activity_update', { activity })
  }

  // 实用方法
  const ping = () => {
    return emit('ping')
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connectionStatus.value = 'disconnected'
      serverInfo.connected = false
    }
  }

  const reconnect = () => {
    if (socket.value) {
      socket.value.connect()
    } else {
      connect()
    }
  }

  // 心跳定时器
  let heartbeatInterval: NodeJS.Timeout | null = null

  onMounted(() => {
    // 如果有token，自动连接
    if (authStore.token) {
      connect()
    }

    // 启动心跳
    heartbeatInterval = setInterval(() => {
      if (socket.value?.connected) {
        ping()
        connectionStats.uptime += 5
      }
    }, 5000)

    // 监听认证状态变化
    watch(() => authStore.token, (newToken) => {
      if (newToken && connectionStatus.value === 'disconnected') {
        connect()
      } else if (!newToken && socket.value) {
        disconnect()
      }
    })
  })

  onUnmounted(() => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
    disconnect()
  })

  return {
    // 状态
    connectionStatus,
    serverInfo,
    connectionStats,
    currentRooms,
    roomUsers,
    typingUsers,
    activeAIStreams,
    aiQueue,
    communityFeed,
    onlineUsersGlobal,
    notifications,
    unreadNotificationCount,
    collaborationSessions,
    incomingCall,
    activeCall,

    // 连接管理
    connect,
    disconnect,
    reconnect,
    ping,

    // 聊天功能
    joinRoom,
    leaveRoom,
    sendMessage,
    setTyping,
    markMessagesRead,
    summonCharacter,
    triggerAIResponse,

    // AI功能
    startAIStream,
    requestVoiceSynthesis,
    requestImageGeneration,
    sendSpeechToText,
    getAIQueueStatus,

    // 社区功能
    publishPost,
    toggleLike,
    addComment,
    toggleFollow,
    shareContent,
    joinCommunity,

    // 通知功能
    getNotifications,
    markNotificationRead,
    updateNotificationSettings,

    // 协作功能
    joinCollaboration,
    leaveCollaboration,
    sendCollaborationUpdate,
    updateCursor,

    // 媒体功能
    startScreenShare,
    endScreenShare,
    requestVoiceCall,
    respondToVoiceCall,
    notifyFileUpload,

    // 用户状态
    updateStatus,
    getOnlineUsers,
    updateActivity,

    // 原始socket（谨慎使用）
    socket,
    emit
  }
}

// 创建全局WebSocket实例
let globalWebSocket: ReturnType<typeof useWebSocket> | null = null

export function useGlobalWebSocket() {
  if (!globalWebSocket) {
    globalWebSocket = useWebSocket()
  }
  return globalWebSocket
}
