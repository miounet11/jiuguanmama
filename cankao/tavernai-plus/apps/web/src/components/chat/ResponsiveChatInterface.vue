<template>
  <div class="responsive-chat-interface" :class="deviceClasses">
    <!-- 桌面端侧边栏 -->
    <aside
      v-if="showSidebar"
      class="chat-sidebar"
      :class="{ 'sidebar-collapsed': sidebarCollapsed }"
    >
      <div class="sidebar-header">
        <h2 class="sidebar-title">聊天列表</h2>
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
          :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <MenuIcon v-if="sidebarCollapsed" />
          <CloseIcon v-else />
        </button>
      </div>

      <div class="sidebar-content">
        <div class="chat-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索聊天..."
            class="search-input"
          />
        </div>

        <div class="chat-list">
          <div
            v-for="chat in filteredChats"
            :key="chat.id"
            class="chat-item"
            :class="{ 'chat-item-active': activeChatId === chat.id }"
            @click="selectChat(chat.id)"
          >
            <div class="chat-avatar">
              <img
                :src="chat.characterAvatar || defaultAvatar"
                :alt="chat.characterName"
                class="avatar-image"
              />
              <div v-if="chat.isOnline" class="online-indicator" />
            </div>
            <div class="chat-info">
              <h3 class="chat-name">{{ chat.characterName }}</h3>
              <p class="chat-preview">{{ chat.lastMessage }}</p>
              <span class="chat-time">{{ formatTime(chat.updatedAt) }}</span>
            </div>
            <div v-if="chat.unreadCount > 0" class="unread-badge">
              {{ chat.unreadCount }}
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="new-chat-btn" @click="createNewChat">
          <PlusIcon />
          <span v-if="!sidebarCollapsed">新建聊天</span>
        </button>
      </div>
    </aside>

    <!-- 主要聊天区域 -->
    <main class="chat-main" :class="{ 'main-full-width': !showSidebar }">
      <!-- 移动端头部 -->
      <header v-if="isMobileDevice" class="mobile-header">
        <div class="mobile-header-content">
          <button
            class="mobile-menu-btn"
            @click="toggleMobileMenu"
            :aria-label="showMobileMenu ? '关闭菜单' : '打开菜单'"
          >
            <MenuIcon />
          </button>

          <div class="mobile-character-info" @click="showCharacterDetails">
            <div class="character-avatar">
              <img
                :src="activeChat?.characterAvatar || defaultAvatar"
                :alt="activeChat?.characterName"
                class="avatar-image"
              />
              <div v-if="isTyping" class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            <div class="character-details">
              <h1 class="character-name">{{ activeChat?.characterName || '选择角色' }}</h1>
              <p class="character-status">{{ getCharacterStatus() }}</p>
            </div>
          </div>

          <button class="mobile-more-btn" @click="showMobileMenu = true">
            <MoreIcon />
          </button>
        </div>
      </header>

      <!-- 桌面端头部 -->
      <header v-else class="desktop-header">
        <div class="desktop-header-content">
          <div class="character-info">
            <div class="character-avatar">
              <img
                :src="activeChat?.characterAvatar || defaultAvatar"
                :alt="activeChat?.characterName"
                class="avatar-image"
              />
              <div v-if="isTyping" class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            <div class="character-details">
              <h1 class="character-name">{{ activeChat?.characterName || '选择角色开始聊天' }}</h1>
              <p class="character-status">{{ getCharacterStatus() }}</p>
            </div>
          </div>

          <div class="header-actions">
            <EnhancedTouchHandler
              v-for="action in headerActions"
              :key="action.key"
              class="action-btn"
              :class="{ 'action-btn-active': action.active }"
              @tap="handleHeaderAction(action.key)"
              :enable-feedback="true"
            >
              <component :is="action.icon" />
              <span class="action-tooltip">{{ action.label }}</span>
            </EnhancedTouchHandler>
          </div>
        </div>
      </header>

      <!-- 消息列表区域 -->
      <div class="messages-container" ref="messagesContainer">
        <div class="messages-content">
          <!-- 加载更多历史消息 -->
          <div
            v-if="hasOlderMessages && !loadingOlder"
            class="load-more-trigger"
            @click="loadOlderMessages"
          >
            <button class="load-more-btn">
              <ArrowUpIcon />
              加载更多历史消息
            </button>
          </div>

          <div v-if="loadingOlder" class="loading-older">
            <LoadingIcon class="animate-spin" />
            <span>加载中...</span>
          </div>

          <!-- 消息列表 -->
          <div class="messages-list">
            <TransitionGroup name="message" tag="div">
              <div
                v-for="(message, index) in displayMessages"
                :key="message.id"
                class="message-wrapper"
                :class="getMessageClasses(message, index)"
              >
                <ResponsiveMessageBubble
                  :message="message"
                  :character="activeChat"
                  :show-avatar="shouldShowAvatar(message, index)"
                  :show-timestamp="shouldShowTimestamp(message, index)"
                  :compact="isMobileDevice"
                  @retry="handleRetryMessage"
                  @copy="handleCopyMessage"
                  @edit="handleEditMessage"
                  @delete="handleDeleteMessage"
                  @reaction="handleMessageReaction"
                />
              </div>
            </TransitionGroup>

            <!-- 正在输入指示器 -->
            <div v-if="isTyping" class="typing-message">
              <ResponsiveMessageBubble
                :message="typingMessage"
                :character="activeChat"
                :show-avatar="true"
                :is-typing="true"
                :compact="isMobileDevice"
              />
            </div>
          </div>

          <!-- 滚动到底部按钮 -->
          <Transition name="fade">
            <button
              v-if="showScrollToBottom"
              class="scroll-to-bottom"
              @click="scrollToBottom"
              :aria-label="`${unreadCount} 条未读消息，滚动到底部`"
            >
              <ArrowDownIcon />
              <span v-if="unreadCount > 0" class="scroll-unread-count">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
          </Transition>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container" :class="inputContainerClasses">
        <ResponsiveChatInput
          v-model="inputMessage"
          :placeholder="inputPlaceholder"
          :disabled="isLoading"
          :compact="isMobileDevice"
          :enable-voice="enableVoice"
          :enable-image="enableImage"
          :max-length="maxMessageLength"
          :show-emoji-picker="showEmojiPicker"
          @send="handleSendMessage"
          @voice-start="handleVoiceStart"
          @voice-end="handleVoiceEnd"
          @image-upload="handleImageUpload"
          @emoji-select="handleEmojiSelect"
          @input="handleInputChange"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @height-change="handleInputHeightChange"
        />

        <!-- 快速回复建议 -->
        <Transition name="slide-up">
          <div
            v-if="showQuickReplies && quickReplies.length"
            class="quick-replies"
            :style="quickRepliesStyle"
          >
            <div class="quick-replies-container">
              <EnhancedTouchHandler
                v-for="(reply, index) in quickReplies"
                :key="index"
                class="quick-reply-item"
                @tap="selectQuickReply(reply)"
                :enable-feedback="true"
              >
                <span>{{ reply }}</span>
              </EnhancedTouchHandler>
            </div>
          </div>
        </Transition>
      </div>
    </main>

    <!-- 移动端侧边栏 (覆盖层) -->
    <Transition name="slide-right">
      <div
        v-if="isMobileDevice && showMobileMenu"
        class="mobile-sidebar-overlay"
        @click="closeMobileMenu"
      >
        <div class="mobile-sidebar" @click.stop>
          <div class="mobile-sidebar-header">
            <h2 class="mobile-sidebar-title">聊天</h2>
            <button class="mobile-sidebar-close" @click="closeMobileMenu">
              <CloseIcon />
            </button>
          </div>

          <div class="mobile-sidebar-content">
            <div class="mobile-chat-list">
              <div
                v-for="chat in filteredChats"
                :key="chat.id"
                class="mobile-chat-item"
                :class="{ 'mobile-chat-item-active': activeChatId === chat.id }"
                @click="selectMobileChat(chat.id)"
              >
                <div class="mobile-chat-avatar">
                  <img
                    :src="chat.characterAvatar || defaultAvatar"
                    :alt="chat.characterName"
                    class="avatar-image"
                  />
                  <div v-if="chat.isOnline" class="online-indicator" />
                </div>
                <div class="mobile-chat-info">
                  <h3 class="mobile-chat-name">{{ chat.characterName }}</h3>
                  <p class="mobile-chat-preview">{{ chat.lastMessage }}</p>
                </div>
                <div class="mobile-chat-meta">
                  <span class="mobile-chat-time">{{ formatTime(chat.updatedAt) }}</span>
                  <div v-if="chat.unreadCount > 0" class="mobile-unread-badge">
                    {{ chat.unreadCount }}
                  </div>
                </div>
              </div>
            </div>

            <button class="mobile-new-chat-btn" @click="createNewChat">
              <PlusIcon />
              新建聊天
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 语音模式覆盖层 -->
    <Transition name="fade">
      <div
        v-if="voiceMode"
        class="voice-overlay"
        @click="exitVoiceMode"
      >
        <div class="voice-content">
          <div class="voice-animation">
            <div class="voice-wave" :class="{ 'voice-wave-active': isListening }">
              <span v-for="i in 5" :key="i" class="wave-bar" />
            </div>
          </div>

          <h2 class="voice-title">
            {{ isListening ? '正在听取您的话...' : '点击开始语音输入' }}
          </h2>

          <p class="voice-instruction">
            {{ voiceInstruction }}
          </p>

          <div class="voice-controls">
            <EnhancedTouchHandler
              class="voice-btn"
              :class="{ 'voice-btn-listening': isListening }"
              @tap="toggleVoiceListening"
              @long-press="startContinuousListening"
              :enable-feedback="true"
              :show-long-press-indicator="true"
            >
              <MicIcon v-if="!isListening" />
              <StopIcon v-else />
            </EnhancedTouchHandler>

            <button class="voice-exit-btn" @click="exitVoiceMode">
              退出语音模式
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useEnhancedResponsive } from '@/composables/useEnhancedResponsive'
import { useVirtualKeyboard } from '@/composables/useVirtualKeyboard'
import { useMobilePerformance } from '@/composables/useMobilePerformance'

// 图标组件 (简化示例)
const MenuIcon = 'MenuIcon'
const CloseIcon = 'CloseIcon'
const PlusIcon = 'PlusIcon'
const MoreIcon = 'MoreIcon'
const ArrowUpIcon = 'ArrowUpIcon'
const ArrowDownIcon = 'ArrowDownIcon'
const LoadingIcon = 'LoadingIcon'
const MicIcon = 'MicIcon'
const StopIcon = 'StopIcon'

// 自定义组件
import EnhancedTouchHandler from '@/components/mobile/EnhancedTouchHandler.vue'
import ResponsiveMessageBubble from '@/components/chat/ResponsiveMessageBubble.vue'
import ResponsiveChatInput from '@/components/chat/ResponsiveChatInput.vue'

// 接口定义
interface Chat {
  id: string
  characterId: string
  characterName: string
  characterAvatar?: string
  lastMessage: string
  updatedAt: string
  unreadCount: number
  isOnline: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isStreaming?: boolean
  isError?: boolean
  reactions?: string[]
}

interface HeaderAction {
  key: string
  label: string
  icon: string
  active?: boolean
}

// Props定义
interface Props {
  chats?: Chat[]
  messages?: Message[]
  activeChatId?: string
  isLoading?: boolean
  isTyping?: boolean
  enableVoice?: boolean
  enableImage?: boolean
  maxMessageLength?: number
  showQuickReplies?: boolean
  quickReplies?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  chats: () => [],
  messages: () => [],
  isLoading: false,
  isTyping: false,
  enableVoice: true,
  enableImage: true,
  maxMessageLength: 2000,
  showQuickReplies: true,
  quickReplies: () => [],
})

// Emits定义
const emit = defineEmits<{
  'chat-select': [chatId: string]
  'chat-create': []
  'send-message': [content: string, metadata?: Record<string, any>]
  'retry-message': [messageId: string]
  'edit-message': [messageId: string, newContent: string]
  'delete-message': [messageId: string]
  'message-reaction': [messageId: string, reaction: string]
  'load-older': []
  'character-details': []
  'voice-start': []
  'voice-end': []
  'image-upload': [file: File]
  'emoji-select': [emoji: string]
}>()

// 响应式Hook
const {
  isMobileDevice,
  isTablet,
  isDesktop,
  deviceType,
  currentBreakpoint,
  getTouchSize,
  getSafeAreaInsets,
} = useEnhancedResponsive()

const { keyboardHeight, isKeyboardVisible } = useVirtualKeyboard()
const { isLowEndDevice, optimizeImage } = useMobilePerformance()

// 引用
const messagesContainer = ref<HTMLElement>()

// 状态管理
const sidebarCollapsed = ref(false)
const showMobileMenu = ref(false)
const showEmojiPicker = ref(false)
const voiceMode = ref(false)
const isListening = ref(false)
const inputMessage = ref('')
const searchQuery = ref('')
const loadingOlder = ref(false)
const inputHeight = ref(60)
const showScrollToBottom = ref(false)
const unreadCount = ref(0)
const lastScrollTop = ref(0)

// 计算属性
const deviceClasses = computed(() => ({
  'device-mobile': isMobileDevice.value,
  'device-tablet': isTablet.value,
  'device-desktop': isDesktop.value,
  'keyboard-visible': isKeyboardVisible.value,
  'voice-mode': voiceMode.value,
}))

const showSidebar = computed(() => isDesktop.value || isTablet.value)

const activeChat = computed(() =>
  props.chats.find(chat => chat.id === props.activeChatId)
)

const filteredChats = computed(() => {
  if (!searchQuery.value.trim()) return props.chats

  return props.chats.filter(chat =>
    chat.characterName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const displayMessages = computed(() => {
  // 在低端设备上限制显示的消息数量
  const maxMessages = isLowEndDevice.value ? 50 : 100
  return props.messages.slice(-maxMessages)
})

const inputPlaceholder = computed(() => {
  if (props.isLoading) return '请稍等...'
  if (props.isTyping) return `${activeChat.value?.characterName} 正在输入...`
  return `与 ${activeChat.value?.characterName || '角色'} 对话...`
})

const typingMessage = computed((): Message => ({
  id: 'typing',
  role: 'assistant',
  content: '',
  timestamp: new Date().toISOString(),
  isStreaming: true
}))

const inputContainerClasses = computed(() => ({
  'input-container-mobile': isMobileDevice.value,
  'input-container-keyboard': isKeyboardVisible.value,
  'input-container-voice': voiceMode.value,
}))

const quickRepliesStyle = computed(() => ({
  bottom: isKeyboardVisible.value
    ? `${keyboardHeight.value + inputHeight.value + 10}px`
    : `${inputHeight.value + 10}px`,
}))

const headerActions = computed((): HeaderAction[] => [
  {
    key: 'voice',
    label: '语音模式',
    icon: MicIcon,
    active: voiceMode.value,
  },
  {
    key: 'image',
    label: '发送图片',
    icon: 'ImageIcon',
    active: false,
  },
  {
    key: 'settings',
    label: '聊天设置',
    icon: 'SettingsIcon',
    active: false,
  },
  {
    key: 'export',
    label: '导出对话',
    icon: 'ExportIcon',
    active: false,
  },
  {
    key: 'clear',
    label: '清空对话',
    icon: 'TrashIcon',
    active: false,
  },
])

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiM2MzY2ZjEiLz4KPHRleHQgeD0iMjAiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+QTwvdGV4dD4KPC9zdmc+'

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const selectChat = (chatId: string) => {
  emit('chat-select', chatId)
}

const selectMobileChat = (chatId: string) => {
  selectChat(chatId)
  closeMobileMenu()
}

const createNewChat = () => {
  emit('chat-create')
  closeMobileMenu()
}

const handleHeaderAction = (actionKey: string) => {
  switch (actionKey) {
    case 'voice':
      toggleVoiceMode()
      break
    case 'image':
      // 触发图片上传
      break
    case 'settings':
      // 显示设置面板
      break
    case 'export':
      // 导出对话
      break
    case 'clear':
      // 清空对话
      break
  }
}

const getCharacterStatus = (): string => {
  if (props.isTyping) return '正在输入...'
  if (activeChat.value?.isOnline) return '在线'
  return '离线'
}

const getMessageClasses = (message: Message, index: number) => {
  return {
    'message-user': message.role === 'user',
    'message-assistant': message.role === 'assistant',
    'message-system': message.role === 'system',
    'message-grouped': isGroupedMessage(message, index),
    'message-last-in-group': isLastInGroup(message, index),
  }
}

const isGroupedMessage = (message: Message, index: number): boolean => {
  if (index === 0) return false

  const prevMessage = displayMessages.value[index - 1]
  if (!prevMessage) return false

  const timeDiff = new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()
  return message.role === prevMessage.role && timeDiff < 5 * 60 * 1000
}

const isLastInGroup = (message: Message, index: number): boolean => {
  if (index === displayMessages.value.length - 1) return true

  const nextMessage = displayMessages.value[index + 1]
  return !nextMessage || !isGroupedMessage(nextMessage, index + 1)
}

const shouldShowAvatar = (message: Message, index: number): boolean => {
  return !isGroupedMessage(message, index)
}

const shouldShowTimestamp = (message: Message, index: number): boolean => {
  return isLastInGroup(message, index)
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`
  return date.toLocaleDateString()
}

const handleSendMessage = (content: string, metadata?: Record<string, any>) => {
  if (!content.trim()) return

  emit('send-message', content.trim(), metadata)
  inputMessage.value = ''

  if (props.autoScroll) {
    nextTick(() => {
      scrollToBottom(true)
    })
  }
}

const handleRetryMessage = (messageId: string) => {
  emit('retry-message', messageId)
}

const handleCopyMessage = (content: string) => {
  navigator.clipboard?.writeText(content)
}

const handleEditMessage = (messageId: string, newContent: string) => {
  emit('edit-message', messageId, newContent)
}

const handleDeleteMessage = (messageId: string) => {
  emit('delete-message', messageId)
}

const handleMessageReaction = (messageId: string, reaction: string) => {
  emit('message-reaction', messageId, reaction)
}

const loadOlderMessages = async () => {
  if (loadingOlder.value) return

  loadingOlder.value = true
  try {
    emit('load-older')
  } finally {
    setTimeout(() => {
      loadingOlder.value = false
    }, 1000)
  }
}

const scrollToBottom = (smooth = true) => {
  if (!messagesContainer.value) return

  messagesContainer.value.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })

  showScrollToBottom.value = false
  unreadCount.value = 0
}

const handleScroll = () => {
  if (!messagesContainer.value) return

  const container = messagesContainer.value
  const { scrollTop, scrollHeight, clientHeight } = container

  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
  showScrollToBottom.value = !isNearBottom

  if (isNearBottom) {
    unreadCount.value = 0
  }
}

const selectQuickReply = (reply: string) => {
  handleSendMessage(reply)
}

const showCharacterDetails = () => {
  emit('character-details')
}

// 语音模式相关
const toggleVoiceMode = () => {
  voiceMode.value = !voiceMode.value
}

const exitVoiceMode = () => {
  voiceMode.value = false
  isListening.value = false
}

const toggleVoiceListening = () => {
  isListening.value = !isListening.value

  if (isListening.value) {
    emit('voice-start')
  } else {
    emit('voice-end')
  }
}

const startContinuousListening = () => {
  isListening.value = true
  emit('voice-start')
}

const voiceInstruction = computed(() => {
  if (isListening.value) {
    return '说话中...松开结束录音'
  }
  return '点击开始录音，长按持续录音'
})

// 输入相关
const handleInputChange = (value: string) => {
  inputMessage.value = value
}

const handleInputFocus = () => {
  if (props.autoScroll) {
    setTimeout(() => {
      scrollToBottom(true)
    }, 300)
  }
}

const handleInputBlur = () => {
  // 输入框失焦处理
}

const handleInputHeightChange = (height: number) => {
  inputHeight.value = height
}

const handleVoiceStart = () => {
  isListening.value = true
  emit('voice-start')
}

const handleVoiceEnd = () => {
  isListening.value = false
  emit('voice-end')
}

const handleImageUpload = (file: File) => {
  emit('image-upload', file)
}

const handleEmojiSelect = (emoji: string) => {
  inputMessage.value += emoji
  showEmojiPicker.value = false
}

// 设置滚动监听
const setupScrollListener = () => {
  if (!messagesContainer.value) return

  messagesContainer.value.addEventListener('scroll', handleScroll, { passive: true })
}

// 监听消息变化
watch(() => props.messages.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    const isAtBottom = showScrollToBottom.value === false

    if (isAtBottom && props.autoScroll) {
      nextTick(() => {
        scrollToBottom(true)
      })
    } else {
      unreadCount.value++
    }
  }
})

// 监听输入框高度变化
watch(inputHeight, () => {
  if (props.autoScroll && !showScrollToBottom.value) {
    nextTick(() => {
      scrollToBottom(false)
    })
  }
})

// 生命周期
onMounted(() => {
  setupScrollListener()

  nextTick(() => {
    if (props.autoScroll) {
      scrollToBottom(false)
    }
  })
})

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/responsive.scss';

.responsive-chat-interface {
  display: flex;
  height: 100vh;
  background: var(--surface-0);
  color: var(--text-primary);
  position: relative;
}

// 侧边栏样式
.chat-sidebar {
  width: 300px;
  background: var(--surface-1);
  border-right: 1px solid var(--border-secondary);
  display: flex;
  flex-direction: column;
  transition: all $transition-base;

  &.sidebar-collapsed {
    width: 60px;

    .sidebar-title,
    .sidebar-content,
    .sidebar-footer {
      display: none;
    }
  }

  @include tablet-only {
    width: 250px;
  }

  @include mobile-only {
    display: none;
  }
}

.sidebar-header {
  padding: $spacing-lg;
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  margin: 0;
}

.sidebar-toggle {
  @include touch-button(32px);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: $border-radius-base;

  &:hover {
    background: var(--surface-2);
    color: var(--text-primary);
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
}

.chat-search {
  margin-bottom: $spacing-md;

  .search-input {
    width: 100%;
    padding: $spacing-sm $spacing-md;
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    border-radius: $border-radius-base;
    color: var(--text-primary);
    font-size: $font-size-sm;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(var(--primary-color), 0.1);
    }
  }
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: var(--surface-2);
  }

  &.chat-item-active {
    background: var(--primary-color);
    color: white;
  }
}

.chat-avatar {
  position: relative;
  flex-shrink: 0;

  .avatar-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .online-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: $success-color;
    border: 2px solid var(--surface-1);
    border-radius: 50%;
  }
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-name {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  margin: 0 0 $spacing-xs;
  @include text-truncate;
}

.chat-preview {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  margin: 0;
  @include text-truncate;
}

.chat-time {
  font-size: $font-size-xs;
  color: var(--text-tertiary);
}

.unread-badge {
  background: var(--error-color);
  color: white;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  padding: 2px 6px;
  border-radius: $border-radius-full;
  min-width: 18px;
  text-align: center;
}

.sidebar-footer {
  padding: $spacing-md;
  border-top: 1px solid var(--border-secondary);
}

.new-chat-btn {
  @include touch-button(40px);
  width: 100%;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: $border-radius-base;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  font-weight: $font-weight-medium;
  transition: all $transition-base;

  &:hover {
    background: darken(var(--primary-color), 10%);
  }
}

// 主要聊天区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  &.main-full-width {
    width: 100%;
  }
}

// 移动端头部
.mobile-header {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-secondary);
  @include safe-area-padding($spacing-sm, 0, 0, 0);

  .mobile-header-content {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    min-height: 56px;
  }

  .mobile-menu-btn,
  .mobile-more-btn {
    @include touch-button(40px);
    background: transparent;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: $border-radius-base;

    &:hover {
      background: var(--surface-2);
    }
  }

  .mobile-character-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;
    min-width: 0;

    .character-avatar {
      position: relative;

      .avatar-image {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
      }

      .typing-indicator {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 14px;
        height: 14px;
        background: var(--primary-color);
        border: 2px solid var(--surface-1);
        border-radius: 50%;

        .typing-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          gap: 1px;

          span {
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: typing-animation 1.4s infinite ease-in-out;

            &:nth-child(2) {
              animation-delay: 0.2s;
            }

            &:nth-child(3) {
              animation-delay: 0.4s;
            }
          }
        }
      }
    }

    .character-details {
      flex: 1;
      min-width: 0;

      .character-name {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
        margin: 0;
        @include text-truncate;
      }

      .character-status {
        font-size: $font-size-sm;
        color: var(--text-secondary);
        margin: 0;
        @include text-truncate;
      }
    }
  }
}

// 桌面端头部
.desktop-header {
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-secondary);
  position: sticky;
  top: 0;
  z-index: $z-sticky;

  .desktop-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-lg $spacing-xl;
    max-width: 1200px;
    margin: 0 auto;
  }

  .character-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .character-avatar {
      position: relative;

      .avatar-image {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .character-details {
      .character-name {
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
        margin: 0 $spacing-xs 0 0;
      }

      .character-status {
        font-size: $font-size-sm;
        color: var(--text-secondary);
        margin: 0;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: $spacing-sm;
  }

  .action-btn {
    @include touch-button(40px);
    position: relative;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: $border-radius-base;
    transition: all $transition-fast;

    &:hover {
      background: var(--surface-2);
      color: var(--text-primary);
    }

    &.action-btn-active {
      color: var(--primary-color);
      background: rgba(var(--primary-color), 0.1);
    }

    .action-tooltip {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--surface-3);
      color: var(--text-primary);
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-base;
      font-size: $font-size-xs;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity $transition-fast;
    }

    &:hover .action-tooltip {
      opacity: 1;
    }
  }
}

// 消息容器
.messages-container {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;
  @include mobile-performance-optimization;
}

.messages-content {
  max-width: 800px;
  margin: 0 auto;
  padding: $spacing-lg;

  @include mobile-only {
    padding: $spacing-md;
  }
}

.load-more-trigger,
.loading-older {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-lg;
  color: var(--text-secondary);
  font-size: $font-size-sm;

  .load-more-btn {
    @include touch-button(36px);
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    color: var(--text-primary);
    border-radius: $border-radius-base;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    transition: all $transition-fast;

    &:hover {
      background: var(--surface-3);
      border-color: var(--border-primary);
    }
  }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.message-wrapper {
  transition: all $transition-fast;

  &.message-user {
    align-self: flex-end;
  }

  &.message-assistant,
  &.message-system {
    align-self: flex-start;
  }

  &.message-grouped {
    margin-bottom: $spacing-xs;
  }

  &.message-last-in-group {
    margin-bottom: $spacing-lg;
  }
}

.typing-message {
  margin-bottom: $spacing-lg;
}

.scroll-to-bottom {
  position: fixed;
  bottom: 120px;
  right: $spacing-lg;
  @include touch-button(48px);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: $shadow-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-fixed;

  @include mobile-only {
    bottom: 100px;
    right: $spacing-md;
  }

  .scroll-unread-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--error-color);
    color: white;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    padding: 2px 6px;
    border-radius: $border-radius-full;
    min-width: 18px;
    text-align: center;
  }
}

// 输入容器
.input-container {
  background: var(--surface-1);
  border-top: 1px solid var(--border-secondary);
  position: relative;
  @include safe-area-padding(0, 0, $spacing-md, 0);

  &.input-container-keyboard {
    // 键盘显示时的特殊处理
  }

  &.input-container-voice {
    // 语音模式时的特殊处理
  }
}

// 快速回复
.quick-replies {
  position: absolute;
  left: 0;
  right: 0;
  background: var(--surface-2);
  border: 1px solid var(--border-secondary);
  border-bottom: none;
  border-radius: $border-radius-base $border-radius-base 0 0;
  z-index: $z-dropdown;
}

.quick-replies-container {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm;
  overflow-x: auto;
  @include custom-scrollbar;
}

.quick-reply-item {
  flex-shrink: 0;
  padding: $spacing-sm $spacing-md;
  background: var(--surface-3);
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-full;
  color: var(--text-primary);
  font-size: $font-size-sm;
  cursor: pointer;
  white-space: nowrap;
  transition: all $transition-fast;

  &:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}

// 移动端侧边栏
.mobile-sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-modal;
  @include safe-area-padding(0, 0, 0, 0);
}

.mobile-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 80%;
  max-width: 320px;
  background: var(--surface-1);
  display: flex;
  flex-direction: column;
}

.mobile-sidebar-header {
  padding: $spacing-lg $spacing-md;
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  @include safe-area-padding($spacing-md, 0, 0, 0);

  .mobile-sidebar-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    margin: 0;
  }

  .mobile-sidebar-close {
    @include touch-button(32px);
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
  }
}

.mobile-sidebar-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.mobile-chat-list {
  flex: 1;
  padding: $spacing-md;
}

.mobile-chat-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: $border-radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: var(--surface-2);
  }

  &.mobile-chat-item-active {
    background: var(--primary-color);
    color: white;
  }
}

.mobile-chat-avatar {
  position: relative;
  flex-shrink: 0;

  .avatar-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .online-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background: $success-color;
    border: 2px solid var(--surface-1);
    border-radius: 50%;
  }
}

.mobile-chat-info {
  flex: 1;
  min-width: 0;

  .mobile-chat-name {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    margin: 0 0 $spacing-xs;
    @include text-truncate;
  }

  .mobile-chat-preview {
    font-size: $font-size-sm;
    color: var(--text-secondary);
    margin: 0;
    @include text-truncate;
  }
}

.mobile-chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: $spacing-xs;

  .mobile-chat-time {
    font-size: $font-size-xs;
    color: var(--text-tertiary);
  }

  .mobile-unread-badge {
    background: var(--error-color);
    color: white;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    padding: 2px 6px;
    border-radius: $border-radius-full;
    min-width: 18px;
    text-align: center;
  }
}

.mobile-new-chat-btn {
  @include touch-button(48px);
  margin: $spacing-md;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: $border-radius-base;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  font-weight: $font-weight-medium;
}

// 语音模式覆盖层
.voice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-content {
  text-align: center;
  color: white;
  padding: $spacing-2xl;

  .voice-animation {
    margin-bottom: $spacing-xl;

    .voice-wave {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: 60px;

      .wave-bar {
        width: 4px;
        height: 20px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        transition: all 0.3s ease;

        &:nth-child(odd) {
          animation-delay: 0.1s;
        }

        &:nth-child(even) {
          animation-delay: 0.2s;
        }
      }

      &.voice-wave-active .wave-bar {
        background: var(--primary-color);
        animation: wave-animation 1s infinite ease-in-out;
      }
    }
  }

  .voice-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    margin: 0 0 $spacing-md;
  }

  .voice-instruction {
    font-size: $font-size-base;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 $spacing-xl;
  }

  .voice-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-lg;

    .voice-btn {
      @include touch-button(80px);
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: all $transition-base;

      &.voice-btn-listening {
        background: var(--error-color);
        animation: voice-pulse 1s infinite;
      }
    }

    .voice-exit-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      font-size: $font-size-sm;
      padding: $spacing-sm $spacing-md;
      border-radius: $border-radius-base;
      transition: all $transition-fast;

      &:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

// 动画定义
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes typing-animation {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes wave-animation {
  0%, 100% {
    height: 20px;
  }
  50% {
    height: 40px;
  }
}

@keyframes voice-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

// 响应式调整
@include mobile-only {
  .responsive-chat-interface {
    .chat-main {
      .desktop-header {
        display: none;
      }
    }
  }

  .messages-content {
    padding: $spacing-sm;
  }

  .message-wrapper {
    &.message-user,
    &.message-assistant {
      max-width: 85%;
    }
  }
}

@include tablet-only {
  .chat-sidebar {
    width: 280px;
  }

  .mobile-sidebar {
    width: 60%;
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .message-enter-active,
  .message-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }

  .voice-btn {
    animation: none;
  }

  .typing-dots span {
    animation: none;
  }

  .voice-wave-active .wave-bar {
    animation: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .chat-sidebar,
  .mobile-header,
  .desktop-header,
  .input-container {
    border-width: 2px;
  }

  .message-wrapper {
    border: 1px solid var(--border-primary);
  }
}

// 打印样式
@media print {
  .responsive-chat-interface {
    .chat-sidebar,
    .mobile-header,
    .desktop-header,
    .input-container {
      display: none;
    }

    .chat-main {
      width: 100%;
    }

    .messages-content {
      max-width: none;
      padding: 0;
    }
  }
}
</style>