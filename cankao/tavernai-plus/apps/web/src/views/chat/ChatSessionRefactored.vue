<template>
  <div class="chat-session" :class="sessionClasses">
    <!-- 错误边界 -->
    <ErrorBoundary @error="handleError">
      <!-- 移动端遮罩层 -->
      <div
        v-if="!sidebarCollapsed && isMobile"
        class="mobile-overlay"
        @click="sidebarCollapsed = true"
        aria-label="关闭侧边栏"
      />

      <!-- 侧边栏 -->
      <aside
        class="chat-sidebar"
        :class="{ 'sidebar-collapsed': sidebarCollapsed }"
        :aria-hidden="sidebarCollapsed"
      >
        <ChatSidebar
          :character="character"
          :settings="settings"
          :collapsed="sidebarCollapsed"
          :is-online="isOnline"
          :can-regenerate="canRegenerate"
          @toggle-sidebar="toggleSidebar"
          @regenerate="regenerateLastMessage"
          @export="exportChat"
          @clear="clearChatWithConfirm"
          @settings-change="handleSettingsChange"
        />
      </aside>

      <!-- 主聊天区域 -->
      <main class="chat-main" role="main">
        <!-- 聊天顶部栏 -->
        <header class="chat-header">
          <div class="chat-header-info">
            <h1 class="session-title">与 {{ character?.name || '...' }} 的对话</h1>
            <div class="message-count" aria-live="polite">
              {{ messageCountText }}
            </div>
          </div>
          <div class="chat-header-actions">
            <TavernButton
              variant="ghost"
              size="sm"
              @click="toggleSound"
              :title="soundEnabled ? '关闭消息提示音' : '开启消息提示音'"
              :aria-pressed="soundEnabled"
            >
              <TavernIcon :name="soundEnabled ? 'speaker-wave' : 'speaker-x-mark'" />
            </TavernButton>
            <TavernButton
              variant="ghost"
              size="sm"
              @click="toggleFullscreen"
              :title="fullscreen ? '退出全屏' : '全屏模式'"
              :aria-pressed="fullscreen"
            >
              <TavernIcon :name="fullscreen ? 'arrows-pointing-in' : 'arrows-pointing-out'" />
            </TavernButton>
          </div>
        </header>

        <!-- 聊天消息区域 -->
        <section
          ref="messagesContainer"
          class="chat-messages"
          role="log"
          aria-live="polite"
          aria-label="聊天消息"
          @scroll="handleScroll"
        >
          <!-- 空状态 -->
          <EmptyState
            v-if="messages.length === 0"
            :character="character"
            :suggestions="suggestedMessages"
            @send-suggestion="sendSuggestedMessage"
          />

          <!-- 虚拟滚动消息列表 -->
          <div v-else class="virtual-message-list">
            <!-- 上方填充空间 -->
            <div v-if="spacerTop > 0" :style="{ height: spacerTop + 'px' }" class="virtual-spacer" />

            <!-- 可见消息 -->
            <MessageBubble
              v-for="message in visibleMessages"
              :key="message.id"
              :message="message"
              :character="character"
              :is-loading="isLoading"
              :enable-voice="settings.enableVoice"
              :is-playing="playingMessageId === message.id"
              :data-virtual-item="true"
              :data-virtual-item-id="message.id"
              @copy-message="copyMessage"
              @regenerate-message="regenerateMessage"
              @rate-message="rateMessage"
              @voice-play="handleVoicePlay"
              @voice-stop="handleVoiceStop"
              @image-preview="handleImagePreview"
            />

            <!-- 下方填充空间 -->
            <div v-if="spacerBottom > 0" :style="{ height: spacerBottom + 'px' }" class="virtual-spacer" />
          </div>

          <!-- 输入指示器 -->
          <TypingIndicator
            v-if="isTyping"
            :character="character"
            :show-animation="settings.enableTyping"
          />

          <!-- 滚动到底部按钮 -->
          <TavernButton
            v-if="showScrollToBottom"
            @click="scrollToBottom"
            variant="primary"
            size="sm"
            class="scroll-to-bottom"
            :aria-label="`滚动到底部，有 ${newMessageCount} 条新消息`"
          >
            <TavernIcon name="arrow-down" />
            <span v-if="newMessageCount > 0">{{ newMessageCount }}</span>
          </TavernButton>
        </section>

        <!-- 输入区域 -->
        <footer class="chat-input-area">
          <ChatInput
            v-model="inputMessage"
            :is-loading="isLoading"
            :suggestions="inputSuggestions"
            :options="inputOptions"
            @send-message="sendMessage"
            @stop-generation="stopGeneration"
            @file-upload="handleFileUpload"
            @voice-text="handleVoiceText"
            @input-focus="handleInputFocus"
            @input-blur="handleInputBlur"
          >
            <template #extra-actions>
              <!-- 简化的图像功能 -->
              <SimplifiedChatImageFeatures
                :current-character="character"
                :messages="messages"
                @image-generated="handleImageGenerated"
                @image-message="handleImageMessage"
              />
            </template>
          </ChatInput>
        </footer>
      </main>

      <!-- 底部语音功能区域 -->
      <aside v-if="!isMobile" class="chat-voice-panel">
        <ChatVoiceFeatures
          :messages="messages"
          :current-character="character"
          :is-mobile="isMobile"
          @voice-text-ready="handleVoiceText"
          @voice-message-play="handleVoicePlay"
          @voice-message-stop="handleVoiceStop"
          @auto-voice-toggle="handleAutoVoiceToggle"
        />
      </aside>

      <!-- 图像预览对话框 -->
      <ImagePreviewDialog
        v-model:show="showImagePreview"
        :image-data="previewImageData"
      />

      <!-- 全局加载遮罩 -->
      <LoadingOverlay v-if="isInitializing" />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useChatDateFormatter } from '@/composables/useDateFormatter'
import { useChatVirtualScroll } from '@/composables/useVirtualScroll'
import { useResponsive } from '@/composables/useResponsive'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { http } from '@/utils/axios'

// 组件导入
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import EmptyState from '@/components/chat/EmptyState.vue'
import ImagePreviewDialog from '@/components/chat/ImagePreviewDialog.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import ChatVoiceFeatures from '@/components/voice/ChatVoiceFeatures.vue'
import SimplifiedChatImageFeatures from '@/components/image/SimplifiedChatImageFeatures.vue'

// 类型定义
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  imageUrl?: string
  imagePrompt?: string
  error?: boolean
  streaming?: boolean
}

interface Character {
  id: string
  name: string
  avatar?: string
  creator?: string
  chatCount?: number
  rating?: number
}

interface ChatSettings {
  model: string
  temperature: number
  maxTokens: number
  enableStream: boolean
  enableTyping: boolean
  enableVoice: boolean
}

// 路由和组合式函数
const route = useRoute()
const { formatDateTime } = useChatDateFormatter()
const { isMobile } = useResponsive()
const { handleError } = useErrorHandler()

// 响应式数据
const character = ref<Character | null>(null)
const messages = ref<Message[]>([])
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const isTyping = ref(false)
const isInitializing = ref(true)
const isOnline = ref(true)
const playingMessageId = ref<string | null>(null)

// UI 状态
const sidebarCollapsed = ref(false)
const soundEnabled = ref(true)
const fullscreen = ref(false)
const showImagePreview = ref(false)
const previewImageData = ref<{url: string, prompt?: string} | null>(null)
const newMessageCount = ref(0)

// 虚拟滚动
const {
  visibleItems: visibleMessages,
  spacerTop,
  spacerBottom,
  isAtBottom,
  scrollToBottom,
  enableAutoScroll
} = useChatVirtualScroll(messages, messagesContainer)

// 设置
const settings = reactive<ChatSettings>({
  model: 'grok-3',
  temperature: 0.7,
  maxTokens: 1000,
  enableStream: true,
  enableTyping: true,
  enableVoice: true
})

// 建议消息
const suggestedMessages = ref([
  '你好！很高兴认识你',
  '能告诉我更多关于你的事情吗？',
  '你今天过得怎么样？',
  '我们聊聊你的兴趣爱好吧'
])

const inputSuggestions = ref<string[]>([])

// 计算属性
const sessionClasses = computed(() => [
  'chat-session',
  {
    'chat-session--mobile': isMobile.value,
    'chat-session--fullscreen': fullscreen.value,
    'chat-session--sidebar-collapsed': sidebarCollapsed.value
  }
])

const messageCountText = computed(() => {
  const count = messages.value.length
  return count === 0 ? '暂无消息' : `${count} 条消息`
})

const canRegenerate = computed(() => {
  return messages.value.length > 0 &&
         messages.value[messages.value.length - 1].role === 'assistant' &&
         !isLoading.value
})

const showScrollToBottom = computed(() => {
  return !isAtBottom.value || newMessageCount.value > 0
})

const inputOptions = computed(() => ({
  enableEmoji: true,
  enableVoice: settings.enableVoice,
  enableFileUpload: true,
  enableSuggestions: true,
  maxLength: 2000,
  placeholder: isLoading.value ? '正在生成回复...' : '输入消息...'
}))

// 监听消息变化，更新新消息计数
watch(messages, (newMessages, oldMessages) => {
  if (newMessages.length > oldMessages.length && !isAtBottom.value) {
    newMessageCount.value += newMessages.length - oldMessages.length
  }
})

// 监听滚动到底部状态
watch(isAtBottom, (atBottom) => {
  if (atBottom) {
    newMessageCount.value = 0
  }
})

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
  // TODO: 实现音效播放
}

const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
  if (fullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const handleScroll = () => {
  // 虚拟滚动已在 useChatVirtualScroll 中处理
}

const sendMessage = async (content: string) => {
  if (isLoading.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  scrollToBottom()

  isLoading.value = true
  isTyping.value = true

  try {
    if (settings.enableStream) {
      await sendStreamingMessage(content)
    } else {
      await sendRegularMessage(content)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    handleMessageError(error as Error)
  } finally {
    isLoading.value = false
    isTyping.value = false
  }
}

const sendStreamingMessage = async (content: string) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007'

  try {
    const response = await fetch(`${API_BASE_URL}/api/chats/${route.params.characterId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        content,
        settings,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    // 创建流式消息对象
    const streamingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    }

    messages.value.push(streamingMessage)
    isTyping.value = false

    try {
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // 解析SSE数据
        buffer += new TextDecoder().decode(value)
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()

            if (dataStr === '[DONE]') {
              streamingMessage.streaming = false
              return
            }

            try {
              const data = JSON.parse(dataStr)

              if (data.type === 'chunk') {
                streamingMessage.content = data.fullContent || data.content || ''
                nextTick(() => {
                  if (enableAutoScroll) {
                    scrollToBottom()
                  }
                })
              } else if (data.type === 'complete') {
                streamingMessage.id = data.id
                streamingMessage.content = data.content
                streamingMessage.timestamp = new Date(data.timestamp)
                streamingMessage.streaming = false
              } else if (data.type === 'error') {
                throw new Error(data.message || '流式响应错误')
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError)
            }
          }
        }
      }
    } finally {
      streamingMessage.streaming = false
    }
  } catch (error) {
    // 移除失败的流式消息
    const index = messages.value.findIndex(m => m.streaming)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
    throw error
  }
}

const sendRegularMessage = async (content: string) => {
  const response = await http.post(`/api/chats/${route.params.characterId}/messages`, {
    content,
    settings
  })

  const assistantMessage: Message = {
    id: response.data.id,
    role: 'assistant',
    content: response.data.content,
    timestamp: new Date(response.data.timestamp)
  }

  messages.value.push(assistantMessage)
  scrollToBottom()
}

const stopGeneration = () => {
  // TODO: 实现停止生成逻辑
  isLoading.value = false
  isTyping.value = false
}

const sendSuggestedMessage = (suggestion: string) => {
  inputMessage.value = suggestion
  sendMessage(suggestion)
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // TODO: 显示成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const regenerateMessage = async (message: Message) => {
  if (isLoading.value) return

  // 找到要重新生成的消息位置
  const messageIndex = messages.value.findIndex(m => m.id === message.id)
  if (messageIndex === -1) return

  // 移除该消息及之后的所有消息
  messages.value = messages.value.slice(0, messageIndex)

  // 找到最后一条用户消息
  const lastUserMessage = messages.value.slice().reverse().find(m => m.role === 'user')
  if (lastUserMessage) {
    await sendMessage(lastUserMessage.content)
  }
}

const regenerateLastMessage = async () => {
  const lastMessage = messages.value[messages.value.length - 1]
  if (lastMessage && lastMessage.role === 'assistant') {
    await regenerateMessage(lastMessage)
  }
}

const rateMessage = (message: Message) => {
  // TODO: 实现消息评分功能
  console.log('Rate message:', message.id)
}

const handleVoicePlay = (message: Message) => {
  playingMessageId.value = message.id
  // TODO: 实现语音播放
}

const handleVoiceStop = (message: Message) => {
  if (playingMessageId.value === message.id) {
    playingMessageId.value = null
  }
}

const handleVoiceText = (text: string) => {
  inputMessage.value = text
}

const handleImagePreview = (data: { url: string, prompt?: string }) => {
  previewImageData.value = data
  showImagePreview.value = true
}

const handleFileUpload = (files: FileList) => {
  // TODO: 实现文件上传
  console.log('Upload files:', files)
}

const handleImageGenerated = (image: any) => {
  console.log('Image generated:', image)
}

const handleImageMessage = (imageMessage: any) => {
  const message: Message = {
    id: imageMessage.id,
    role: 'user',
    content: imageMessage.type === 'image' ?
      `[图像] ${imageMessage.prompt || '用户发送了一张图像'}` :
      imageMessage.content,
    timestamp: imageMessage.timestamp,
    imageUrl: imageMessage.type === 'image' ? imageMessage.content : undefined,
    imagePrompt: imageMessage.prompt
  }

  messages.value.push(message)
  scrollToBottom()
}

const handleAutoVoiceToggle = (enabled: boolean) => {
  settings.enableVoice = enabled
}

const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
  Object.assign(settings, newSettings)
}

const handleInputFocus = () => {
  // 移动端时收起侧边栏
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

const handleInputBlur = () => {
  // 可以在这里添加失焦处理逻辑
}

const handleMessageError = (error: Error) => {
  // 添加错误消息到聊天中
  const errorMessage: Message = {
    id: Date.now().toString(),
    role: 'system',
    content: `发生错误: ${error.message}`,
    timestamp: new Date(),
    error: true
  }

  messages.value.push(errorMessage)
  handleError(error)
}

const exportChat = () => {
  // TODO: 实现聊天导出功能
  console.log('Export chat')
}

const clearChatWithConfirm = () => {
  if (confirm('确定要清空聊天记录吗？此操作不可撤销。')) {
    messages.value = []
  }
}

// 初始化
const initializeChat = async () => {
  try {
    isInitializing.value = true

    // 加载角色信息
    const characterResponse = await http.get(`/api/characters/${route.params.characterId}`)
    character.value = characterResponse.data

    // 加载聊天历史
    const messagesResponse = await http.get(`/api/chats/${route.params.characterId}/messages`)
    messages.value = messagesResponse.data.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))

    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })

  } catch (error) {
    console.error('Failed to initialize chat:', error)
    handleError(error as Error)
  } finally {
    isInitializing.value = false
  }
}

// 提供给子组件的上下文
provide('chatContext', {
  character,
  messages,
  settings,
  isLoading,
  isTyping
})

// 生命周期
onMounted(() => {
  initializeChat()

  // 移动端检测
  const checkMobile = () => {
    const mobile = window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (mobile && !sidebarCollapsed.value) {
      sidebarCollapsed.value = true
    }
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)

  return () => {
    window.removeEventListener('resize', checkMobile)
  }
})
</script>

<style lang="scss" scoped>
.chat-session {
  display: grid;
  grid-template-columns: 300px 1fr auto;
  grid-template-rows: 1fr;
  height: 100vh;
  background: var(--color-background);
  overflow: hidden;

  &--sidebar-collapsed {
    grid-template-columns: 60px 1fr auto;
  }

  &--mobile {
    grid-template-columns: 1fr;

    .chat-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      transform: translateX(-100%);
      transition: transform 0.3s ease;

      &:not(.sidebar-collapsed) {
        transform: translateX(0);
      }
    }

    .chat-voice-panel {
      display: none;
    }
  }

  &--fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  backdrop-filter: blur(2px);
}

.chat-sidebar {
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 0.3s ease;
}

.chat-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.chat-header-info {
  flex: 1;
  min-width: 0;

  .session-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--color-foreground);
    margin: 0 0 var(--space-1) 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .message-count {
    font-size: var(--text-sm);
    color: var(--color-muted-foreground);
  }
}

.chat-header-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  position: relative;
  scroll-behavior: smooth;
}

.virtual-message-list {
  position: relative;
}

.virtual-spacer {
  flex-shrink: 0;
}

.scroll-to-bottom {
  position: absolute;
  bottom: var(--space-4);
  right: var(--space-4);
  z-index: 10;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
}

.chat-input-area {
  flex-shrink: 0;
  padding: var(--space-4);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.chat-voice-panel {
  width: 280px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  flex-shrink: 0;
}

// 响应式设计
@media (max-width: 1024px) {
  .chat-session:not(.chat-session--mobile) {
    grid-template-columns: 250px 1fr;

    .chat-voice-panel {
      display: none;
    }
  }
}

@media (max-width: 768px) {
  .chat-header {
    padding: var(--space-3);
  }

  .chat-messages {
    padding: var(--space-3);
  }

  .chat-input-area {
    padding: var(--space-3);
  }

  .session-title {
    font-size: var(--text-base) !important;
  }
}

// 深色主题支持
@media (prefers-color-scheme: dark) {
  .mobile-overlay {
    background: rgba(0, 0, 0, 0.7);
  }
}

// 高对比度支持
@media (prefers-contrast: high) {
  .chat-sidebar,
  .chat-header,
  .chat-input-area {
    border-width: 2px;
  }
}

// 减少动画支持
@media (prefers-reduced-motion: reduce) {
  .chat-session,
  .chat-sidebar,
  .scroll-to-bottom {
    transition: none;
  }

  .chat-messages {
    scroll-behavior: auto;
  }
}
</style>
