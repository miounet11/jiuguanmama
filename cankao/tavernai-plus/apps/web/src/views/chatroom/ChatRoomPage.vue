<template>
  <div class="chatroom-page">
    <!-- 顶部导航栏 -->
    <div class="chatroom-header">
      <div class="header-left">
        <el-button
          @click="$router.go(-1)"
          type="text"
          :icon="ArrowLeft"
          size="large"
        >
          返回
        </el-button>
        <div class="room-info">
          <h2 class="room-name">{{ roomInfo?.name || '聊天室' }}</h2>
          <div class="room-stats">
            <span class="participant-count">
              <el-icon><User /></el-icon>
              {{ participantCount }} 位参与者
            </span>
            <span class="online-indicator" :class="{ active: connected }">
              <el-icon><Connection /></el-icon>
              {{ connected ? '已连接' : '未连接' }}
            </span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <el-button
          @click="showCharacterSummon = true"
          type="primary"
          :icon="Plus"
          size="default"
        >
          召唤角色
        </el-button>
        <el-dropdown trigger="click">
          <el-button :icon="Setting" circle />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="showRoomSettings = true">房间设置</el-dropdown-item>
              <el-dropdown-item @click="showInviteDialog = true">邀请用户</el-dropdown-item>
              <el-dropdown-item divided @click="leaveRoom">离开房间</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="chatroom-content">
      <!-- 左侧参与者列表 -->
      <div class="participants-panel" :class="{ collapsed: !showParticipants }">
        <div class="panel-header">
          <h3>参与者</h3>
          <el-button
            @click="showParticipants = !showParticipants"
            type="text"
            size="small"
            :icon="showParticipants ? ChevronLeft : ChevronRight"
          />
        </div>

        <div class="participants-list" v-show="showParticipants">
          <!-- 在线用户 -->
          <div class="participant-group">
            <div class="group-title">在线用户 ({{ onlineUsers.length }})</div>
            <div
              v-for="user in onlineUsers"
              :key="`user-${user.id}`"
              class="participant-item user-item"
              :class="{ typing: typingUsers.includes(user.id) }"
            >
              <el-avatar
                :size="32"
                :src="user.avatar"
                :alt="user.username"
              >
                {{ user.username?.[0]?.toUpperCase() }}
              </el-avatar>
              <div class="participant-info">
                <div class="participant-name">{{ user.username }}</div>
                <div class="participant-status">
                  <span v-if="typingUsers.includes(user.id)" class="typing-indicator">
                    正在输入...
                  </span>
                  <span v-else class="online-status">在线</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AI角色 -->
          <div class="participant-group">
            <div class="group-title">AI角色 ({{ aiCharacters.length }})</div>
            <div
              v-for="character in aiCharacters"
              :key="`char-${character.id}`"
              class="participant-item character-item"
            >
              <el-avatar
                :size="32"
                :src="character.avatar"
                :alt="character.name"
              >
                {{ character.name?.[0]?.toUpperCase() }}
              </el-avatar>
              <div class="participant-info">
                <div class="participant-name">{{ character.name }}</div>
                <div class="participant-status">AI角色</div>
              </div>
              <el-dropdown trigger="click">
                <el-button type="text" size="small" :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="triggerAIResponse(character.id)">
                      触发回复
                    </el-dropdown-item>
                    <el-dropdown-item
                      @click="removeCharacter(character.id)"
                      v-if="canManageRoom"
                    >
                      移除角色
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间聊天区域 -->
      <div class="chat-area">
        <!-- 消息列表 -->
        <div
          ref="messagesContainer"
          class="messages-container"
          @scroll="onScroll"
        >
          <div v-if="loading" class="loading-messages">
            <el-loading text="加载消息中..." />
          </div>

          <!-- 历史消息 -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="{
              'own-message': message.sender?.id === currentUser?.id,
              'character-message': !!message.character,
              'system-message': message.messageType === 'system',
              'action-message': message.messageType === 'action'
            }"
          >
            <div class="message-header">
              <el-avatar
                :size="28"
                :src="message.sender?.avatar || message.character?.avatar"
              >
                {{ (message.sender?.username || message.character?.name)?.[0]?.toUpperCase() }}
              </el-avatar>
              <span class="sender-name">
                {{ message.sender?.username || message.character?.name }}
              </span>
              <span class="message-time">
                {{ formatTime(message.createdAt) }}
              </span>
            </div>

            <div class="message-content">
              <!-- 回复引用 -->
              <div v-if="message.replyTo" class="reply-quote">
                <div class="reply-header">
                  回复 {{ message.replyTo.sender?.username || message.replyTo.character?.name }}:
                </div>
                <div class="reply-content">{{ message.replyTo.content }}</div>
              </div>

              <!-- 消息内容 -->
              <div class="content-text">{{ message.content }}</div>

              <!-- 消息操作 -->
              <div class="message-actions">
                <el-button
                  type="text"
                  size="small"
                  @click="replyToMessage(message)"
                >
                  回复
                </el-button>
                <el-button
                  v-if="message.sender?.id === currentUser?.id"
                  type="text"
                  size="small"
                  @click="editMessage(message)"
                >
                  编辑
                </el-button>
              </div>
            </div>
          </div>

          <!-- AI思考指示器 -->
          <div v-if="aiThinking" class="ai-thinking">
            <el-avatar :size="28" :src="aiThinking.character?.avatar">
              {{ aiThinking.character?.name?.[0]?.toUpperCase() }}
            </el-avatar>
            <div class="thinking-content">
              <div class="thinking-dots">
                <span></span><span></span><span></span>
              </div>
              <div class="thinking-text">{{ aiThinking.character?.name }} 正在思考...</div>
            </div>
          </div>
        </div>

        <!-- 消息输入框 -->
        <div class="message-input-area">
          <!-- 回复预览 -->
          <div v-if="replyingTo" class="reply-preview">
            <div class="reply-info">
              回复给 {{ replyingTo.sender?.username || replyingTo.character?.name }}:
              <span class="reply-content">{{ replyingTo.content }}</span>
              <el-button
                type="text"
                size="small"
                @click="cancelReply"
                :icon="Close"
              />
            </div>
          </div>

          <!-- 输入框 -->
          <div class="input-container">
            <el-input
              v-model="messageInput"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="输入消息..."
              @keydown="onInputKeydown"
              @input="onTyping"
              :disabled="!connected"
            />
            <div class="input-actions">
              <el-button
                type="primary"
                :disabled="!messageInput.trim() || !connected"
                @click="sendMessage"
                :icon="Promotion"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色召唤对话框 -->
    <CharacterSummonDialog
      v-model="showCharacterSummon"
      :room-id="roomId"
      @summoned="onCharacterSummoned"
    />

    <!-- 房间设置对话框 -->
    <RoomSettingsDialog
      v-model="showRoomSettings"
      :room="roomInfo"
      @updated="onRoomUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useChatRoomStore } from '@/stores/chatroom'
import { useWebSocket } from '@/composables/useWebSocket'
import { formatTime } from '@/utils/date'
import {
  ArrowLeft, User, Connection, Plus, Setting, ChevronLeft, ChevronRight,
  MoreFilled, Close, Promotion
} from '@element-plus/icons-vue'
import CharacterSummonDialog from '@/components/chatroom/CharacterSummonDialog.vue'
import RoomSettingsDialog from '@/components/chatroom/RoomSettingsDialog.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const chatRoomStore = useChatRoomStore()

const roomId = route.params.id as string
const currentUser = computed(() => userStore.user)

// 响应式数据
const roomInfo = ref<any>(null)
const messages = ref<any[]>([])
const loading = ref(false)
const connected = ref(false)
const showParticipants = ref(true)
const showCharacterSummon = ref(false)
const showRoomSettings = ref(false)
const showInviteDialog = ref(false)

// 消息输入
const messageInput = ref('')
const replyingTo = ref<any>(null)

// 参与者状态
const onlineUsers = ref<any[]>([])
const aiCharacters = ref<any[]>([])
const typingUsers = ref<string[]>([])
const aiThinking = ref<any>(null)

// 消息容器引用
const messagesContainer = ref<HTMLElement>()

// 计算属性
const participantCount = computed(() => onlineUsers.value.length + aiCharacters.value.length)
const canManageRoom = computed(() => {
  return roomInfo.value?.ownerId === currentUser.value?.id ||
         currentUser.value?.role === 'admin'
})

// WebSocket连接
const { socket, isConnected } = useWebSocket()

// 监听连接状态
watch(isConnected, (newVal) => {
  connected.value = newVal
  if (newVal && roomId) {
    joinRoom()
  }
})

// 页面生命周期
onMounted(async () => {
  await loadRoomData()
  setupWebSocketListeners()

  if (socket.value && isConnected.value) {
    joinRoom()
  }
})

onUnmounted(() => {
  if (socket.value && roomId) {
    socket.value.emit('leave_room', { roomId })
  }
})

// 加载房间数据
const loadRoomData = async () => {
  try {
    loading.value = true

    // 加载房间信息
    const roomData = await chatRoomStore.getRoomDetails(roomId)
    roomInfo.value = roomData

    // 分离用户和AI角色
    onlineUsers.value = roomData.participants.filter(p => p.user) || []
    aiCharacters.value = roomData.participants.filter(p => p.character) || []

    // 加载消息历史
    const messagesData = await chatRoomStore.getMessages(roomId)
    messages.value = messagesData || []

    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('加载房间数据失败:', error)
    ElMessage.error('加载房间数据失败')
  } finally {
    loading.value = false
  }
}

// 加入房间
const joinRoom = () => {
  if (socket.value && roomId) {
    socket.value.emit('join_room', { roomId })
  }
}

// 离开房间
const leaveRoom = async () => {
  if (socket.value && roomId) {
    socket.value.emit('leave_room', { roomId })
  }
  router.push('/chatrooms')
}

// 发送消息
const sendMessage = () => {
  if (!messageInput.value.trim() || !socket.value || !connected.value) return

  socket.value.emit('send_message', {
    roomId,
    content: messageInput.value.trim(),
    messageType: 'text',
    replyToId: replyingTo.value?.id
  })

  messageInput.value = ''
  replyingTo.value = null
}

// 回复消息
const replyToMessage = (message: any) => {
  replyingTo.value = message
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
}

// 编辑消息
const editMessage = (message: any) => {
  // TODO: 实现消息编辑
  console.log('编辑消息:', message)
}

// 触发AI回复
const triggerAIResponse = (characterId: string) => {
  if (socket.value && connected.value) {
    socket.value.emit('trigger_ai_response', {
      roomId,
      characterId
    })
  }
}

// 移除角色
const removeCharacter = (characterId: string) => {
  if (socket.value && connected.value) {
    socket.value.emit('remove_character', {
      roomId,
      characterId
    })
  }
}

// 输入事件处理
const onInputKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

let typingTimeout: NodeJS.Timeout | null = null
const onTyping = () => {
  if (!socket.value || !connected.value) return

  // 发送正在输入状态
  socket.value.emit('typing', { roomId, isTyping: true })

  // 清除之前的定时器
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }

  // 3秒后停止输入状态
  typingTimeout = setTimeout(() => {
    if (socket.value) {
      socket.value.emit('typing', { roomId, isTyping: false })
    }
  }, 3000)
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 滚动事件处理
const onScroll = () => {
  if (!messagesContainer.value) return

  const { scrollTop } = messagesContainer.value

  // 如果滚动到顶部，加载更多历史消息
  if (scrollTop === 0) {
    loadMoreMessages()
  }
}

// 加载更多消息
const loadMoreMessages = async () => {
  // TODO: 实现分页加载更多消息
  console.log('加载更多消息')
}

// 角色召唤成功回调
const onCharacterSummoned = (characterData: any) => {
  aiCharacters.value.push({
    id: characterData.character.id,
    name: characterData.character.name,
    avatar: characterData.character.avatar
  })
}

// 房间设置更新回调
const onRoomUpdated = (updatedRoom: any) => {
  roomInfo.value = { ...roomInfo.value, ...updatedRoom }
}

// WebSocket事件监听
const setupWebSocketListeners = () => {
  if (!socket.value) return

  // 房间加入成功
  socket.value.on('room_joined', (data: any) => {
    console.log('成功加入房间:', data)
  })

  // 新消息
  socket.value.on('new_message', (message: any) => {
    messages.value.push(message)
    nextTick(() => {
      scrollToBottom()
    })
  })

  // 用户加入
  socket.value.on('user_joined', (data: any) => {
    const existingUser = onlineUsers.value.find(u => u.id === data.userId)
    if (!existingUser) {
      onlineUsers.value.push({
        id: data.userId,
        username: data.username,
        avatar: data.avatar
      })
    }
  })

  // 用户离开
  socket.value.on('user_left', (data: any) => {
    onlineUsers.value = onlineUsers.value.filter(u => u.id !== data.userId)
  })

  // 角色召唤
  socket.value.on('character_summoned', (data: any) => {
    aiCharacters.value.push({
      id: data.character.id,
      name: data.character.name,
      avatar: data.character.avatar
    })

    // 添加加入消息
    if (data.joinMessage) {
      messages.value.push(data.joinMessage)
      nextTick(() => {
        scrollToBottom()
      })
    }
  })

  // 输入状态
  socket.value.on('user_typing', (data: any) => {
    if (data.isTyping) {
      if (!typingUsers.value.includes(data.userId)) {
        typingUsers.value.push(data.userId)
      }
    } else {
      typingUsers.value = typingUsers.value.filter(id => id !== data.userId)
    }
  })

  // AI思考状态
  socket.value.on('ai_thinking', (data: any) => {
    aiThinking.value = {
      character: aiCharacters.value.find(c => c.id === data.characterId)
    }
  })

  // AI回复完成
  socket.value.on('ai_response_complete', () => {
    aiThinking.value = null
  })

  // 错误处理
  socket.value.on('error', (error: any) => {
    console.error('WebSocket错误:', error)
    ElMessage.error(error.message || '操作失败')
  })
}
</script>

<style scoped>
.chatroom-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chatroom-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-info h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.room-stats {
  display: flex;
  gap: 16px;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.online-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.online-indicator.active {
  color: #67c23a;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.chatroom-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.participants-panel {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  transition: width 0.3s;
}

.participants-panel.collapsed {
  width: 48px;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.participants-list {
  padding: 16px;
  overflow-y: auto;
}

.participant-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  text-transform: uppercase;
  font-weight: 600;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: background-color 0.2s;
}

.participant-item:hover {
  background: #f0f0f0;
}

.participant-item.typing {
  background: #e3f2fd;
}

.participant-info {
  flex: 1;
  min-width: 0;
}

.participant-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participant-status {
  font-size: 12px;
  color: #666;
}

.typing-indicator {
  color: #2196f3;
  font-style: italic;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: white;
}

.message-item {
  margin-bottom: 16px;
  max-width: 70%;
}

.message-item.own-message {
  margin-left: auto;
}

.message-item.character-message .message-header {
  color: #2196f3;
}

.message-item.system-message {
  max-width: none;
  text-align: center;
}

.message-item.system-message .message-content {
  background: #f5f5f5;
  color: #666;
  font-style: italic;
  padding: 8px 16px;
  border-radius: 16px;
  display: inline-block;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.message-content {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  position: relative;
}

.own-message .message-content {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.reply-quote {
  background: rgba(0, 0, 0, 0.05);
  border-left: 3px solid #2196f3;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 13px;
}

.reply-header {
  font-weight: 600;
  margin-bottom: 4px;
}

.reply-content {
  color: #666;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-actions {
  display: none;
  position: absolute;
  top: -10px;
  right: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 2px;
}

.message-item:hover .message-actions {
  display: block;
}

.ai-thinking {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 16px;
}

.thinking-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2196f3;
  animation: thinking 1.4s infinite ease-in-out;
}

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes thinking {
  0%, 80%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.thinking-text {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.message-input-area {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px 24px;
}

.reply-preview {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 13px;
}

.reply-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-content {
  flex: 1;
  color: #666;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-container .el-textarea {
  flex: 1;
}

.loading-messages {
  text-align: center;
  padding: 40px;
}

.online-status {
  color: #67c23a;
}

.character-item {
  border-left: 3px solid #2196f3;
  padding-left: 9px;
}
</style>