<template>
  <div class="chat-session-container">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSidebar"
        class="sidebar-toggle"
        :class="{ 'sidebar-toggle-collapsed': sidebarCollapsed }"
      >
        <el-icon>
          <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </button>

      <!-- 角色信息 -->
      <div class="character-info" v-if="!sidebarCollapsed">
        <div class="character-header">
          <div class="character-avatar-wrapper">
            <img
              :src="character?.avatar || '/default-avatar.png'"
              :alt="character?.name"
              class="character-avatar"
            />
            <div class="online-indicator" :class="{ 'online': isOnline }"></div>
          </div>
          <div class="character-details">
            <h2 class="character-name">{{ character?.name || '加载中...' }}</h2>
            <p class="character-creator">{{ character?.creator || '系统' }}</p>
            <div class="character-stats">
              <span class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                {{ formatCount(character?.chatCount || 0) }}
              </span>
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                {{ character?.rating?.toFixed(1) || '0.0' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 会话快速操作 -->
      <div class="quick-actions" v-if="!sidebarCollapsed">
        <button
          @click="regenerateLastMessage"
          :disabled="!canRegenerate"
          class="quick-action-btn"
          title="重新生成"
        >
          <el-icon><Refresh /></el-icon>
        </button>
        <button
          @click="toggleSettings"
          class="quick-action-btn"
          title="设置"
        >
          <el-icon><Setting /></el-icon>
        </button>
        <button
          @click="exportChat"
          class="quick-action-btn"
          title="导出"
        >
          <el-icon><Download /></el-icon>
        </button>
        <button
          @click="clearChatWithConfirm"
          class="quick-action-btn danger"
          title="清空"
        >
          <el-icon><Delete /></el-icon>
        </button>
      </div>

      <!-- SillyTavern 高级控制 -->
      <div class="sillytavern-controls" v-if="!sidebarCollapsed">
        <SillyTavernControls />
      </div>

      <!-- 设置面板 -->
      <div class="settings-panel" v-if="!sidebarCollapsed && showSettings">
        <h3>聊天设置</h3>
        <div class="setting-group">
          <label>AI 模型</label>
          <ModelSelector
            v-model="settings.model"
            @change="onModelChange"
            :show-details="false"
          />
        </div>

        <div class="setting-group">
          <label>创造性 ({{ settings.temperature }})</label>
          <el-slider
            v-model="settings.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            size="small"
          />
        </div>

        <div class="setting-group">
          <label>最大长度 ({{ settings.maxTokens }})</label>
          <el-slider
            v-model="settings.maxTokens"
            :min="100"
            :max="4000"
            :step="100"
            size="small"
          />
        </div>

        <div class="setting-group">
          <el-checkbox v-model="settings.enableStream">启用流式响应</el-checkbox>
        </div>

        <div class="setting-group">
          <el-checkbox v-model="settings.enableTyping">显示输入指示器</el-checkbox>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="chat-main">
      <!-- 聊天顶部栏 -->
      <div class="chat-header">
        <div class="chat-header-info">
          <span class="session-title">与 {{ character?.name || '...' }} 的对话</span>
          <span class="message-count">{{ messages.length }} 条消息</span>
        </div>
        <div class="chat-header-actions">
          <el-button
            size="small"
            :icon="soundEnabled ? 'VideoPlay' : 'VideoPause'"
            @click="toggleSound"
            title="消息提示音"
          />
          <el-button
            size="small"
            :icon="fullscreen ? 'Rank' : 'FullScreen'"
            @click="toggleFullscreen"
            title="全屏模式"
          />
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div ref="messagesContainer" class="chat-messages" @scroll="handleScroll">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <h3>开始你的对话</h3>
          <p>向 {{ character?.name || 'AI' }} 说点什么吧</p>
          <div class="suggested-messages" v-if="suggestedMessages.length > 0">
            <button
              v-for="suggestion in suggestedMessages"
              :key="suggestion"
              @click="sendSuggestedMessage(suggestion)"
              class="suggestion-btn"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-for="(message, index) in messages" :key="message.id" class="message-wrapper">
          <div :class="['message-item', message.role]">
            <!-- 消息头像 -->
            <div class="message-avatar">
              <img
                v-if="message.role === 'assistant'"
                :src="character?.avatar || '/default-avatar.png'"
                :alt="character?.name"
              />
              <div v-else class="user-avatar">
                <el-icon><User /></el-icon>
              </div>
            </div>

            <!-- 消息内容 -->
            <div class="message-content">
              <div class="message-header">
                <span class="message-sender">
                  {{ message.role === 'user' ? '你' : character?.name }}
                </span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>

              <div class="message-text" v-html="formatMessage(message.content)"></div>

              <!-- 消息操作 -->
              <div class="message-actions" v-if="message.role === 'assistant'">
                <button
                  @click="copyMessage(message.content)"
                  title="复制"
                  class="action-btn"
                >
                  <el-icon><DocumentCopy /></el-icon>
                </button>
                <button
                  @click="regenerateMessage(index)"
                  title="重新生成"
                  class="action-btn"
                  :disabled="isLoading"
                >
                  <el-icon><Refresh /></el-icon>
                </button>
                <button
                  @click="rateMessage(message)"
                  title="评价"
                  class="action-btn"
                >
                  <el-icon><Star /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入指示器（优化版） -->
        <div v-if="isTyping" class="message-wrapper">
          <div class="message-item assistant">
            <div class="message-avatar">
              <img
                :src="character?.avatar || '/default-avatar.png'"
                :alt="character?.name"
              />
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="typing-text">{{ character?.name }} 正在输入...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 滚动到底部按钮 -->
        <div v-if="showScrollToBottom" class="scroll-to-bottom" @click="scrollToBottom">
          <el-icon><ArrowDown /></el-icon>
          <span>新消息</span>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-container">
          <!-- 快捷操作 -->
          <div class="input-actions">
            <el-button
              size="small"
              @click="showEmojiPicker = !showEmojiPicker"
              title="表情"
            >
              😊
            </el-button>
            <el-button
              size="small"
              :icon="Upload"
              @click="handleFileUpload"
              title="上传文件"
              :disabled="isLoading"
            />
          </div>

          <!-- 输入框 -->
          <div class="input-wrapper">
            <textarea
              ref="inputRef"
              v-model="inputMessage"
              @keydown="handleKeyDown"
              @input="handleInput"
              placeholder="输入消息..."
              class="message-input"
              :rows="inputRows"
              :disabled="isLoading"
            />

            <!-- 字数统计 -->
            <div class="input-stats">
              <span>{{ inputMessage.length }}/2000</span>
            </div>
          </div>

          <!-- 发送按钮 -->
          <div class="send-actions">
            <el-button
              v-if="isLoading"
              @click="stopGeneration"
              type="danger"
              :icon="Close"
              size="large"
              title="停止生成"
            />
            <el-button
              v-else
              @click="sendMessage"
              type="primary"
              :icon="Position"
              size="large"
              :disabled="!canSend"
              title="发送消息"
            />
          </div>
        </div>

        <!-- 表情选择器 -->
        <div v-if="showEmojiPicker" class="emoji-picker">
          <div class="emoji-grid">
            <button
              v-for="emoji in commonEmojis"
              :key="emoji"
              @click="addEmoji(emoji)"
              class="emoji-btn"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound, Star, User, Refresh, Setting, Download, Delete,
  DocumentCopy, ArrowDown, Upload, Close, Position,
  Expand, Fold, VideoPlay, VideoPause, FullScreen, Rank
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'
import ModelSelector from '@/components/common/ModelSelector.vue'
import SillyTavernControls from '@/components/advanced/SillyTavernControls.vue'

const route = useRoute()

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 响应式数据
const character = ref<any>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const inputRef = ref<HTMLTextAreaElement>()
const messagesContainer = ref<HTMLElement>()
const isLoading = ref(false)
const isTyping = ref(false)
const isOnline = ref(true)

// UI 状态
const sidebarCollapsed = ref(false)
const showSettings = ref(false)
const showScrollToBottom = ref(false)
const showEmojiPicker = ref(false)
const soundEnabled = ref(true)
const fullscreen = ref(false)
const isMobile = ref(false)

// 移动端检测
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 设置
const settings = reactive({
  model: 'grok-3',
  temperature: 0.7,
  maxTokens: 1000,
  enableStream: true,
  enableTyping: true
})

// 建议消息
const suggestedMessages = ref([
  '你好！很高兴认识你',
  '能告诉我更多关于你的事情吗？',
  '你今天过得怎么样？',
  '我们聊聊你的兴趣爱好吧'
])

// 常用表情
const commonEmojis = ['😊', '😄', '🤔', '👍', '❤️', '😂', '🥺', '😮', '🎉', '🤗', '😘', '😎']

// 计算属性
const inputRows = computed(() => {
  const lines = inputMessage.value.split('\n').length
  return Math.min(Math.max(lines, 1), 5)
})

const canSend = computed(() => {
  return inputMessage.value.trim() && !isLoading.value && inputMessage.value.length <= 2000
})

const canRegenerate = computed(() => {
  return messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'assistant' && !isLoading.value
})

const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const formatTime = (time: Date) => {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化消息内容（支持 Markdown）
const formatMessage = (content: string) => {
  // 简单的 Markdown 格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// UI 控制方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const onModelChange = (model: any) => {
  console.log('模型已切换到:', model)
  // 根据模型配置调整设置
  if (model.maxTokens && settings.maxTokens > model.maxTokens) {
    settings.maxTokens = model.maxTokens
  }
  // 可以根据模型特性调整其他设置
  if (model.temperature) {
    settings.temperature = model.temperature
  }
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  ElMessage.success(soundEnabled.value ? '已开启消息提示音' : '已关闭消息提示音')
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
  // 实现全屏逻辑
  if (fullscreen.value) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 处理滚动
const handleScroll = () => {
  if (!messagesContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

  showScrollToBottom.value = !isNearBottom
}

// 键盘处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // Shift + Enter 换行
      return
    } else {
      // Enter 发送消息
      event.preventDefault()
      sendMessage()
    }
  }
}

const handleInput = () => {
  // 自动调整文本框高度已通过 computed 实现
}

// 消息相关方法
const sendSuggestedMessage = (suggestion: string) => {
  inputMessage.value = suggestion
  sendMessage()
}

const addEmoji = (emoji: string) => {
  inputMessage.value += emoji
  showEmojiPicker.value = false
  inputRef.value?.focus()
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const regenerateMessage = async (messageIndex: number) => {
  if (isLoading.value || messageIndex < 1) return

  // 移除该消息及之后的所有 AI 消息
  const messagesToKeep = messages.value.slice(0, messageIndex)
  const lastUserMessage = messagesToKeep[messagesToKeep.length - 1]

  if (!lastUserMessage || lastUserMessage.role !== 'user') return

  messages.value = messagesToKeep

  // 重新发送用户消息
  await sendMessageWithContent(lastUserMessage.content)
}

const regenerateLastMessage = async () => {
  const lastMessageIndex = messages.value.length - 1
  if (lastMessageIndex >= 0 && messages.value[lastMessageIndex].role === 'assistant') {
    await regenerateMessage(lastMessageIndex)
  }
}

const rateMessage = async (message: Message) => {
  try {
    const { value } = await ElMessageBox.prompt('请对这条消息评分 (1-5)', '消息评价', {
      inputType: 'number',
      inputValidator: (value: string) => {
        const num = parseInt(value)
        return num >= 1 && num <= 5 ? true : '请输入 1-5 之间的数字'
      }
    })

    // 这里可以发送评分到服务器
    ElMessage.success(`评分已提交: ${value}/5`)
  } catch (error) {
    // 用户取消评分
  }
}

const handleFileUpload = () => {
  ElMessage.info('文件上传功能暂未实现')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 流式响应支持
const streamingMessage = ref<Message | null>(null)
const streamController = ref<AbortController | null>(null)

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const messageContent = inputMessage.value
  inputMessage.value = ''
  scrollToBottom()

  isLoading.value = true
  isTyping.value = true

  // 创建流式响应处理控制器
  streamController.value = new AbortController()

  try {
    // 检查是否启用流式响应（可以根据设置决定）
    const useStream = true

    if (useStream) {
      await sendStreamingMessage(messageContent)
    } else {
      await sendRegularMessage(messageContent)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    handleMessageError()
  } finally {
    isLoading.value = false
    isTyping.value = false
    streamController.value = null
  }
}

const sendStreamingMessage = async (messageContent: string) => {
  try {
    const response = await fetch(`/api/chats/${route.params.characterId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        content: messageContent,
        settings,
        stream: true
      }),
      signal: streamController.value?.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    // 创建流式消息对象
    streamingMessage.value = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }

    messages.value.push(streamingMessage.value)
    isTyping.value = false

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // 解析SSE数据
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'connected') {
                // 连接确认，更新用户消息ID
                const lastUserMessage = messages.value[messages.value.length - 2]
                if (lastUserMessage && lastUserMessage.role === 'user') {
                  lastUserMessage.id = data.userMessage.id
                }
              } else if (data.type === 'chunk') {
                // 流式内容块
                if (streamingMessage.value) {
                  streamingMessage.value.content = data.fullContent
                  scrollToBottom()
                }
              } else if (data.type === 'complete') {
                // 流式完成
                if (streamingMessage.value) {
                  streamingMessage.value.id = data.id
                  streamingMessage.value.content = data.content
                  streamingMessage.value.timestamp = new Date(data.timestamp)
                }
              } else if (data.type === 'error') {
                // 流式错误
                if (streamingMessage.value) {
                  streamingMessage.value.content = data.message
                }
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
      streamingMessage.value = null
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Streaming aborted by user')
    } else {
      throw error
    }
  }
}

const sendRegularMessage = async (messageContent: string) => {
  const response = await http.post(`/chats/${route.params.characterId}/messages`, {
    content: messageContent,
    settings,
    stream: false
  })

  isTyping.value = false

  const assistantMessage: Message = {
    id: response.id,
    role: 'assistant',
    content: response.content,
    timestamp: new Date(response.timestamp)
  }

  messages.value.push(assistantMessage)
  scrollToBottom()
}

const handleMessageError = () => {
  isTyping.value = false

  // 移除流式消息（如果存在）
  if (streamingMessage.value) {
    const index = messages.value.findIndex(m => m === streamingMessage.value)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
    streamingMessage.value = null
  }

  // 添加错误消息
  setTimeout(() => {
    const errorMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '抱歉，我现在无法响应。请稍后再试。',
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
    scrollToBottom()
  }, 500)
}

const stopGeneration = () => {
  // 停止流式生成
  if (streamController.value) {
    streamController.value.abort()
    streamController.value = null
  }

  // 如果有正在生成的流式消息，标记为已中断
  if (streamingMessage.value) {
    streamingMessage.value.content += '\n\n[生成已停止]'
    streamingMessage.value = null
  }

  isLoading.value = false
  isTyping.value = false
}

const exportChat = () => {
  const chatData = {
    character: character.value,
    messages: messages.value,
    exportedAt: new Date()
  }

  const blob = new Blob([JSON.stringify(chatData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-${character.value?.name}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearChatWithConfirm = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有对话记录吗？此操作无法撤销。',
      '清空对话',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    messages.value = []
    ElMessage.success('对话已清空')
  } catch {
    // 用户取消
  }
}

const clearChat = () => {
  clearChatWithConfirm()
}

// 播放提示音
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {
      // 忽略播放失败
    })
  } catch (error) {
    // 忽略错误
  }
}

const fetchChatData = async () => {
  try {
    const response = await http.get(`/chats/${route.params.characterId}`)
    character.value = response.character
    messages.value = response.messages || []
  } catch (error) {
    console.error('Failed to fetch chat data:', error)
    // 模拟数据
    character.value = {
      name: '助手',
      avatar: '',
      creator: '系统'
    }
    messages.value = []
  }
}

onMounted(() => {
  fetchChatData()

  // 检测移动端
  checkMobile()

  // 监听窗口大小变化
  window.addEventListener('resize', checkMobile)

  // 移动端优化：在移动端默认折叠侧边栏
  if (isMobile.value) {
    sidebarCollapsed.value = true
    // 禁止页面缩放
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    }
  }
})

watch(messages, () => {
  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.chat-session-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  color: #e5e7eb;
}

// 侧边栏样式
.sidebar {
  width: 320px;
  background: rgba(30, 30, 40, 0.95);
  border-right: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;

  &.sidebar-collapsed {
    width: 60px;
  }

  .sidebar-toggle {
    position: absolute;
    top: 20px;
    right: -15px;
    z-index: 10;
    width: 30px;
    height: 30px;
    background: rgba(139, 92, 246, 0.2);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c084fc;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(139, 92, 246, 0.3);
      transform: scale(1.1);
    }

    &.sidebar-toggle-collapsed {
      right: -15px;
    }
  }

  .character-info {
    padding: 25px 20px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);

    .character-header {
      display: flex;
      align-items: flex-start;
      gap: 15px;

      .character-avatar-wrapper {
        position: relative;

        .character-avatar {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(139, 92, 246, 0.3);
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #6b7280;
          border: 2px solid rgba(30, 30, 40, 0.95);

          &.online {
            background: #10b981;
          }
        }
      }

      .character-details {
        flex: 1;

        .character-name {
          margin: 0 0 5px;
          font-size: 18px;
          font-weight: 600;
          color: #f3f4f6;
        }

        .character-creator {
          margin: 0 0 10px;
          font-size: 14px;
          color: #9ca3af;
        }

        .character-stats {
          display: flex;
          gap: 15px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #9ca3af;

            .el-icon {
              color: #fbbf24;
            }
          }
        }
      }
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);

    .quick-action-btn {
      width: 40px;
      height: 40px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 8px;
      color: #c084fc;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        background: rgba(139, 92, 246, 0.2);
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.danger {
        border-color: rgba(239, 68, 68, 0.3);
        color: #ef4444;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
        }
      }
    }
  }

  .sillytavern-controls {
    padding: 15px 20px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  }

  .settings-panel {
    flex: 1;
    padding: 20px;
    overflow-y: auto;

    h3 {
      margin: 0 0 20px;
      font-size: 16px;
      color: #f3f4f6;
    }

    .setting-group {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #9ca3af;
      }

      .el-select {
        width: 100%;
      }

      .el-checkbox {
        color: #d1d5db;
      }
    }
  }
}

// 主聊天区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  height: 60px;
  background: rgba(30, 30, 40, 0.95);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;

  .chat-header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .session-title {
      font-size: 16px;
      font-weight: 600;
      color: #f3f4f6;
    }

    .message-count {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .chat-header-actions {
    display: flex;
    gap: 8px;
  }
}

// 消息区域
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  position: relative;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;

      .el-icon {
        font-size: 32px;
        color: #8b5cf6;
      }
    }

    h3 {
      margin: 0 0 10px;
      font-size: 24px;
      color: #f3f4f6;
    }

    p {
      margin: 0 0 30px;
      color: #9ca3af;
      font-size: 16px;
    }

    .suggested-messages {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;

      .suggestion-btn {
        padding: 8px 16px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 20px;
        color: #c084fc;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(139, 92, 246, 0.2);
          transform: translateY(-2px);
        }
      }
    }
  }

  .message-wrapper {
    margin-bottom: 20px;

    .message-item {
      display: flex;
      gap: 12px;

      &.user {
        flex-direction: row-reverse;

        .message-content {
          background: linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%);
          color: white;
        }
      }

      &.assistant {
        .message-content {
          background: rgba(30, 30, 40, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
      }

      .message-avatar {
        width: 40px;
        height: 40px;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          border-radius: 10px;
          object-fit: cover;
        }

        .user-avatar {
          width: 100%;
          height: 100%;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c084fc;
        }
      }

      .message-content {
        max-width: 70%;
        padding: 12px 16px;
        border-radius: 16px;
        position: relative;

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 12px;

          .message-sender {
            font-weight: 600;
            color: inherit;
          }

          .message-time {
            opacity: 0.7;
          }
        }

        .message-text {
          line-height: 1.6;
          word-break: break-word;

          :deep(strong) {
            font-weight: 600;
          }

          :deep(em) {
            font-style: italic;
          }

          :deep(code) {
            background: rgba(0, 0, 0, 0.2);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9em;
          }
        }

        .message-actions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;

          .action-btn {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.1);
            border: none;
            color: inherit;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.7;
            transition: all 0.3s ease;

            &:hover {
              opacity: 1;
              background: rgba(0, 0, 0, 0.2);
            }
          }
        }

        &:hover .message-actions {
          opacity: 1;
        }
      }
    }
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;

    .typing-dots {
      display: flex;
      gap: 3px;

      span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #9ca3af;
        animation: typing-bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
          animation-delay: -0.32s;
        }

        &:nth-child(2) {
          animation-delay: -0.16s;
        }
      }
    }

    .typing-text {
      font-size: 14px;
      color: #9ca3af;
    }
  }

  .scroll-to-bottom {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(139, 92, 246, 0.9);
    color: white;
    border-radius: 20px;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

    &:hover {
      background: rgba(139, 92, 246, 1);
      transform: translateY(-2px);
    }
  }
}

// 输入区域
.chat-input-area {
  background: rgba(30, 30, 40, 0.95);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  padding: 20px;

  .input-container {
    display: flex;
    gap: 12px;
    align-items: flex-end;

    .input-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-wrapper {
      flex: 1;
      position: relative;

      .message-input {
        width: 100%;
        min-height: 44px;
        max-height: 120px;
        padding: 12px 16px;
        background: rgba(17, 24, 39, 0.8);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 12px;
        color: #f3f4f6;
        font-size: 14px;
        line-height: 1.4;
        resize: none;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        &::placeholder {
          color: #6b7280;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .input-stats {
        position: absolute;
        bottom: -20px;
        right: 0;
        font-size: 11px;
        color: #6b7280;
      }
    }

    .send-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  .emoji-picker {
    margin-top: 12px;
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 12px;
    padding: 12px;

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(32px, 1fr));
      gap: 6px;
      max-width: 300px;

      .emoji-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(139, 92, 246, 0.2);
          transform: scale(1.2);
        }
      }
    }
  }
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .sidebar {
    width: 280px;

    &.sidebar-collapsed {
      width: 50px;
    }
  }
}

@media (max-width: 768px) {
  .chat-session-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &.sidebar-collapsed {
      height: 60px;
    }

    .character-info {
      padding: 12px;

      .character-header {
        flex-direction: row;
        align-items: center;
        gap: 12px;

        .character-avatar-wrapper {
          width: 50px;
          height: 50px;
        }

        .character-details {
          .character-name {
            font-size: 16px;
          }

          .character-stats {
            font-size: 12px;
          }
        }
      }
    }

    .settings-panel {
      max-height: 150px;
      overflow-y: auto;
      padding: 12px;

      .setting-group {
        margin-bottom: 12px;

        label {
          font-size: 14px;
        }

        .el-slider {
          margin: 8px 0;
        }
      }
    }
  }

  .chat-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    padding: 12px 16px;

    .session-title {
      font-size: 16px;
    }

    .chat-header-actions {
      gap: 8px;

      .header-action-btn {
        width: 36px;
        height: 36px;
        font-size: 16px;
      }
    }
  }

  .chat-messages {
    padding: 12px;
    flex: 1;
    overflow-y: auto;

    .message-wrapper {
      .message-item {
        margin-bottom: 16px;

        .message-content {
          max-width: 90%;
          padding: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        .message-actions {
          margin-top: 8px;

          .action-btn {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }
      }
    }

    .typing-indicator {
      padding: 8px 12px;
      font-size: 14px;
    }
  }

  .chat-input-area {
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);

    .input-container {
      .input-wrapper {
        textarea {
          font-size: 16px; /* 防止iOS自动缩放 */
          line-height: 1.4;
          padding: 12px;
          border-radius: 20px;
          resize: none;
        }
      }

      .input-actions {
        margin-top: 8px;
        justify-content: space-between;

        .left-actions, .right-actions {
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          font-size: 16px;
          border-radius: 50%;
        }
      }
    }

    .message-suggestions {
      margin-top: 8px;

      .suggestion-chip {
        font-size: 12px;
        padding: 6px 12px;
        margin: 2px 4px 2px 0;
      }
    }
  }

  /* 移动端特定的触摸优化 */
  .quick-actions {
    padding: 8px;

    .quick-action-btn {
      min-height: 44px; /* iOS推荐的最小触摸目标 */
      font-size: 14px;
    }
  }

  /* 全屏模式移动端优化 */
  &.fullscreen {
    .sidebar {
      display: none;
    }

    .chat-main {
      height: 100vh;
    }

    .chat-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--el-bg-color);
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .chat-input-area {
      position: sticky;
      bottom: 0;
      z-index: 100;
    }
  }
}

/* 更小屏幕设备优化 */
@media (max-width: 480px) {
  .chat-session-container {
    height: 100vh;
    overflow: hidden;
  }

  .sidebar {
    .character-info {
      .character-header {
        .character-details {
          .character-name {
            font-size: 14px;
          }

          .character-creator {
            font-size: 11px;
          }

          .character-stats {
            font-size: 11px;
            gap: 8px;
          }
        }
      }
    }
  }

  .chat-messages {
    padding: 8px 12px;

    .message-wrapper .message-item {
      .message-content {
        font-size: 13px;
        padding: 10px;
      }
    }
  }

  .chat-input-area {
    padding: 8px 12px;

    .input-container {
      .input-wrapper textarea {
        font-size: 16px;
        padding: 10px;
      }

      .input-actions {
        .action-btn {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }
      }
    }
  }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .sidebar {
    max-height: 120px;

    &.sidebar-collapsed {
      height: 50px;
    }

    .character-info {
      .character-header {
        .character-details {
          .character-name {
            font-size: 14px;
          }
        }
      }
    }
  }
}

/* PWA和全屏应用优化 */
@media (display-mode: standalone) {
  .chat-session-container {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .chat-input-area {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}
</style>
