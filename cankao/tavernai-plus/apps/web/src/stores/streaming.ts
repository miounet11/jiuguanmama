import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'
import type { StreamingMessage, StreamingSession, ConnectionStatus } from '@/types/streaming'

interface SSEConnection {
  id: string
  userId: string
  sessionId?: string
  eventSource: EventSource
  isActive: boolean
  createdAt: Date
  lastHeartbeat: Date
  metadata?: Record<string, any>
}

interface StreamingStats {
  totalConnections: number
  activeConnections: number
  messagesSent: number
  messagesReceived: number
  avgResponseTime: number
  uptime: number
}

interface ConnectionError {
  message: string
  code?: string
  timestamp: Date
  retryCount: number
}

export const useStreamingStore = defineStore('streaming', () => {
  // State
  const connections = ref<Map<string, SSEConnection>>(new Map())
  const sessions = ref<Map<string, StreamingSession>>(new Map())
  const messages = ref<Map<string, StreamingMessage[]>>(new Map())
  const currentSessionId = ref<string | null>(null)
  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const lastError = ref<ConnectionError | null>(null)
  const stats = ref<StreamingStats>({
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    avgResponseTime: 0,
    uptime: 0
  })

  // Auto-reconnection settings
  const autoReconnect = ref(true)
  const maxRetries = ref(5)
  const retryDelay = ref(5000)
  const currentRetries = ref(0)

  // Message queue for offline mode
  const messageQueue = ref<Array<{
    sessionId: string
    message: any
    timestamp: Date
  }>>([])

  // Auth store
  const authStore = useAuthStore()

  // Computed
  const activeConnections = computed(() => {
    return Array.from(connections.value.values()).filter(conn => conn.isActive)
  })

  const currentConnection = computed(() => {
    return activeConnections.value.find(conn => conn.sessionId === currentSessionId.value)
  })

  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return sessions.value.get(currentSessionId.value) || null
  })

  const sessionMessages = computed(() => {
    if (!currentSessionId.value) return []
    return messages.value.get(currentSessionId.value) || []
  })

  const isConnected = computed(() => {
    return connectionStatus.value === 'connected' && currentConnection.value?.isActive
  })

  const canSendMessages = computed(() => {
    return isConnected.value && currentSessionId.value
  })

  // Actions

  /**
   * Create SSE connection
   */
  const createConnection = async (sessionId?: string, metadata?: Record<string, any>): Promise<string> => {
    try {
      connectionStatus.value = 'connecting'

      const params = new URLSearchParams()
      if (sessionId) params.append('sessionId', sessionId)
      if (metadata?.characterId) params.append('characterId', metadata.characterId)

      const eventSource = new EventSource(
        `/api/stream/connect?${params.toString()}`,
        {
          withCredentials: true
        }
      )

      const connectionId = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        eventSource.onopen = () => {
          clearTimeout(timeout)
          connectionStatus.value = 'connected'
          currentRetries.value = 0
          lastError.value = null
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'connected' && data.connectionId) {
              clearTimeout(timeout)
              resolve(data.connectionId)
            } else {
              handleMessage(data)
            }
          } catch (error) {
            console.error('Failed to parse SSE message:', error)
          }
        }

        eventSource.onerror = (error) => {
          clearTimeout(timeout)
          handleConnectionError(error)
          reject(error)
        }
      })

      // Store connection
      const connection: SSEConnection = {
        id: connectionId,
        userId: authStore.user?.id || '',
        sessionId,
        eventSource,
        isActive: true,
        createdAt: new Date(),
        lastHeartbeat: new Date(),
        metadata
      }

      connections.value.set(connectionId, connection)
      stats.value.totalConnections++
      stats.value.activeConnections++

      if (sessionId) {
        currentSessionId.value = sessionId
      }

      ElMessage.success('Streaming connection established')
      return connectionId

    } catch (error) {
      connectionStatus.value = 'error'
      lastError.value = {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        retryCount: currentRetries.value
      }
      throw error
    }
  }

  /**
   * Close connection
   */
  const closeConnection = (connectionId: string): void => {
    const connection = connections.value.get(connectionId)
    if (!connection) return

    try {
      connection.eventSource.close()
      connection.isActive = false
      connections.value.delete(connectionId)
      stats.value.activeConnections--

      if (connection.sessionId === currentSessionId.value) {
        connectionStatus.value = 'disconnected'
        currentSessionId.value = null
      }

      ElMessage.info('Connection closed')
    } catch (error) {
      console.error('Failed to close connection:', error)
    }
  }

  /**
   * Send message through API
   */
  const sendMessage = async (message: any, sessionId?: string): Promise<void> => {
    const targetSessionId = sessionId || currentSessionId.value
    if (!targetSessionId) {
      throw new Error('No active session')
    }

    const connection = currentConnection.value
    if (!connection || !connection.isActive) {
      // Queue message if offline
      messageQueue.value.push({
        sessionId: targetSessionId,
        message,
        timestamp: new Date()
      })
      throw new Error('No active connection')
    }

    try {
      const response = await fetch('/api/stream/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          connectionId: connection.id,
          message,
          type: 'data'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      stats.value.messagesSent++

    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  /**
   * Interrupt streaming
   */
  const interruptStreaming = async (connectionId?: string): Promise<void> => {
    const targetConnectionId = connectionId || currentConnection.value?.id
    if (!targetConnectionId) {
      throw new Error('No connection to interrupt')
    }

    try {
      const response = await fetch(`/api/stream/interrupt/${targetConnectionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          reason: 'User requested'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to interrupt: ${response.statusText}`)
      }

    } catch (error) {
      console.error('Failed to interrupt streaming:', error)
      throw error
    }
  }

  /**
   * Create streaming session
   */
  const createSession = async (
    title: string,
    characterId?: string,
    metadata?: Record<string, any>
  ): Promise<StreamingSession> => {
    try {
      const response = await fetch('/api/stream/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          title,
          characterId,
          metadata
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      const data = await response.json()
      const session = data.session

      sessions.value.set(session.id, session)
      messages.value.set(session.id, [])

      return session

    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }

  /**
   * Get session
   */
  const getSession = async (sessionId: string): Promise<StreamingSession | null> => {
    try {
      const response = await fetch(`/api/stream/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Failed to get session: ${response.statusText}`)
      }

      const data = await response.json()
      const session = data.session

      sessions.value.set(sessionId, session)
      return session

    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Update session
   */
  const updateSession = async (
    sessionId: string,
    updates: Partial<StreamingSession>
  ): Promise<StreamingSession | null> => {
    try {
      const response = await fetch(`/api/stream/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`)
      }

      const data = await response.json()
      const session = data.session

      sessions.value.set(sessionId, session)
      return session

    } catch (error) {
      console.error('Failed to update session:', error)
      return null
    }
  }

  /**
   * Delete session
   */
  const deleteSession = async (sessionId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/stream/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`)
      }

      sessions.value.delete(sessionId)
      messages.value.delete(sessionId)

      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
      }

      return true

    } catch (error) {
      console.error('Failed to delete session:', error)
      return false
    }
  }

  /**
   * Switch to session
   */
  const switchToSession = async (sessionId: string): Promise<void> => {
    // Close current connection if any
    if (currentConnection.value) {
      closeConnection(currentConnection.value.id)
    }

    // Get session data
    const session = await getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // Create new connection
    await createConnection(sessionId, {
      characterId: session.characterId
    })

    currentSessionId.value = sessionId
  }

  /**
   * Handle incoming message
   */
  const handleMessage = (data: any): void => {
    try {
      const message: StreamingMessage = {
        id: data.id || Date.now().toString(),
        type: data.type || 'data',
        data: data.data,
        timestamp: new Date(data.timestamp || Date.now()),
        connectionId: data.connectionId || ''
      }

      // Find session for this message
      const connection = Array.from(connections.value.values())
        .find(conn => conn.id === message.connectionId)

      if (connection?.sessionId) {
        const sessionMessages = messages.value.get(connection.sessionId) || []
        sessionMessages.push(message)
        messages.value.set(connection.sessionId, sessionMessages)

        // Update heartbeat
        if (message.type === 'heartbeat') {
          connection.lastHeartbeat = message.timestamp
        }
      }

      stats.value.messagesReceived++

    } catch (error) {
      console.error('Failed to handle message:', error)
    }
  }

  /**
   * Handle connection error
   */
  const handleConnectionError = (error: Event): void => {
    console.error('SSE connection error:', error)

    connectionStatus.value = 'error'
    lastError.value = {
      message: 'Connection lost',
      timestamp: new Date(),
      retryCount: currentRetries.value
    }

    // Auto-reconnect if enabled
    if (autoReconnect.value && currentRetries.value < maxRetries.value) {
      setTimeout(() => {
        reconnect()
      }, retryDelay.value)
    }
  }

  /**
   * Reconnect
   */
  const reconnect = async (): Promise<void> => {
    if (currentRetries.value >= maxRetries.value) {
      ElMessage.error('Maximum reconnection attempts reached')
      return
    }

    currentRetries.value++
    connectionStatus.value = 'reconnecting'

    try {
      if (currentSessionId.value) {
        await createConnection(currentSessionId.value)

        // Send queued messages
        await flushMessageQueue()
      }
    } catch (error) {
      console.error('Reconnection failed:', error)
      if (currentRetries.value < maxRetries.value) {
        setTimeout(() => reconnect(), retryDelay.value)
      }
    }
  }

  /**
   * Flush message queue
   */
  const flushMessageQueue = async (): Promise<void> => {
    if (messageQueue.value.length === 0) return

    const queue = [...messageQueue.value]
    messageQueue.value = []

    for (const item of queue) {
      try {
        await sendMessage(item.message, item.sessionId)
      } catch (error) {
        console.error('Failed to send queued message:', error)
        // Re-queue failed message
        messageQueue.value.push(item)
      }
    }
  }

  /**
   * Clear error
   */
  const clearError = (): void => {
    lastError.value = null
    currentRetries.value = 0
  }

  /**
   * Disconnect all
   */
  const disconnectAll = (): void => {
    connections.value.forEach((connection) => {
      closeConnection(connection.id)
    })
    connectionStatus.value = 'disconnected'
    currentSessionId.value = null
  }

  /**
   * Get connection status
   */
  const getConnectionStatus = async (): Promise<any> => {
    try {
      const response = await fetch('/api/stream/status', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Failed to get connection status:', error)
      return null
    }
  }

  // Watch for auth changes
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth) {
      disconnectAll()
    }
  })

  return {
    // State
    connections,
    sessions,
    messages,
    currentSessionId,
    connectionStatus,
    lastError,
    stats,
    autoReconnect,
    maxRetries,
    retryDelay,
    messageQueue,

    // Computed
    activeConnections,
    currentConnection,
    currentSession,
    sessionMessages,
    isConnected,
    canSendMessages,

    // Actions
    createConnection,
    closeConnection,
    sendMessage,
    interruptStreaming,
    createSession,
    getSession,
    updateSession,
    deleteSession,
    switchToSession,
    handleMessage,
    reconnect,
    clearError,
    disconnectAll,
    getConnectionStatus
  }
})