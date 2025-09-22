<template>
  <div class="mobile-chat-interface" ref="chatContainer">
    <!-- 聊天头部 -->
    <div class="chat-header" :class="{ 'header-hidden': hideHeader }">
      <div class="header-content">
        <!-- 返回按钮 -->
        <TouchGestureHandler
          @tap="handleBack"
          class="back-btn-container"
        >
          <el-button
            :icon="ArrowLeft"
            type="text"
            size="large"
            class="back-btn"
          />
        </TouchGestureHandler>

        <!-- 角色信息 -->
        <div class="character-info" @click="showCharacterDetails">
          <div class="character-avatar">
            <LazyImage
              :src="character?.avatar"
              :alt="character?.name"
              :fallback="getAvatarFallback()"
              class="avatar-image"
            />
            <div
              v-if="isTyping"
              class="typing-indicator"
              title="正在输入..."
            >
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div class="character-details">
            <h2 class="character-name">{{ character?.name || '未知角色' }}</h2>
            <p class="character-status">
              {{ getCharacterStatus() }}
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="header-actions">
          <el-dropdown @command="handleHeaderAction" trigger="click">
            <el-button
              :icon="MoreFilled"
              type="text"
              size="large"
              class="more-btn"
            />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="voice" :disabled="!enableVoice">
                  <el-icon><Microphone /></el-icon>
                  语音模式
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  聊天设置
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <el-icon><Download /></el-icon>
                  导出对话
                </el-dropdown-item>
                <el-dropdown-item command="clear" divided>
                  <el-icon><Delete /></el-icon>
                  清空对话
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 消息列表容器 -->
    <div
      class="messages-container"
      ref="messagesContainer"
      :style="{ paddingBottom: `${keyboardHeight + inputHeight + 20}px` }"
    >
      <!-- 加载历史消息 -->
      <div
        v-if="hasOlderMessages && !loadingOlder"
        @click="loadOlderMessages"
        class="load-older-trigger"
      >
        <el-button type="text" size="small">
          <el-icon><ArrowUp /></el-icon>
          加载更多历史消息
        </el-button>
      </div>

      <div v-if="loadingOlder" class="loading-older">
        <el-icon class="animate-spin"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 消息列表 -->
      <div class="messages-list">
        <TransitionGroup name="message" tag="div">
          <div
            v-for="(message, index) in displayMessages"
            :key="message.id"
            class="message-wrapper"
            :class="{
              'user-message': message.role === 'user',
              'assistant-message': message.role === 'assistant',
              'system-message': message.role === 'system',
              'grouped': isGroupedMessage(message, index),
              'last-in-group': isLastInGroup(message, index)
            }"
          >
            <MobileMessageBubble
              :message="message"
              :character="character"
              :show-avatar="!isGroupedMessage(message, index)"
              :show-timestamp="isLastInGroup(message, index)"
              @retry="handleRetryMessage"
              @copy="handleCopyMessage"
              @edit="handleEditMessage"
              @delete="handleDeleteMessage"
              @reaction="handleMessageReaction"
            />
          </div>
        </TransitionGroup>

        <!-- 正在输入指示器 -->
        <div
          v-if="isTyping"
          class="typing-message"
        >
          <MobileMessageBubble
            :message="typingMessage"
            :character="character"
            :show-avatar="true"
            :is-typing="true"
          />
        </div>
      </div>

      <!-- 滚动到底部按钮 -->
      <Transition name="fade">
        <TouchGestureHandler
          v-if="showScrollToBottom"
          @tap="scrollToBottom"
          class="scroll-to-bottom"
        >
          <el-button
            type="primary"
            :icon="ArrowDown"
            circle
            size="large"
            class="scroll-btn"
          >
            <el-badge
              v-if="unreadCount > 0"
              :value="unreadCount"
              :max="99"
              class="unread-badge"
            />
          </el-button>
        </TouchGestureHandler>
      </Transition>
    </div>

    <!-- 移动端输入区域 -->
    <div
      class="mobile-input-container"
      ref="inputContainer"
      :style="{ bottom: `${keyboardHeight}px` }"
    >
      <MobileChatInput
        v-model="inputMessage"
        :placeholder="inputPlaceholder"
        :disabled="isLoading"
        :character="character"
        :enable-voice="enableVoice"
        :enable-image="enableImage"
        :max-length="maxMessageLength"
        @send="handleSendMessage"
        @voice-start="handleVoiceStart"
        @voice-end="handleVoiceEnd"
        @image-upload="handleImageUpload"
        @input="handleInputChange"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @height-change="handleInputHeightChange"
      />
    </div>

    <!-- 快速回复建议 -->
    <Transition name="slide-up">
      <div
        v-if="showQuickReplies && quickReplies.length"
        class="quick-replies"
        :style="{ bottom: `${keyboardHeight + inputHeight + 10}px` }"
      >
        <div class="quick-replies-container">
          <el-tag
            v-for="(reply, index) in quickReplies"
            :key="index"
            @click="selectQuickReply(reply)"
            class="quick-reply-tag"
            type="info"
            effect="plain"
            size="small"
          >
            {{ reply }}
          </el-tag>
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
            <div class="voice-wave" :class="{ 'active': isListening }">
              <span v-for="i in 5" :key="i" class="wave-bar"></span>
            </div>
          </div>

          <h3 class="voice-title">
            {{ isListening ? '正在听取您的话...' : '点击说话' }}
          </h3>

          <p class="voice-instruction">
            {{ voiceInstruction }}
          </p>

          <div class="voice-controls">
            <TouchGestureHandler
              @tap="toggleVoiceListening"
              @long-press="startContinuousListening"
            >
              <el-button
                :type="isListening ? 'danger' : 'primary'"
                :icon="isListening ? 'Close' : 'Microphone'"
                size="large"
                circle
                class="voice-btn"
              />
            </TouchGestureHandler>

            <el-button
              @click="exitVoiceMode"
              type="text"
              size="small"
              class="exit-voice-btn"
            >
              退出语音模式
            </el-button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useVirtualKeyboard } from '@/composables/useVirtualKeyboard'
import { useMobilePerformance } from '@/composables/useMobilePerformance'
import { useTouchGestures } from '@/composables/useTouchGestures'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MoreFilled,
  Microphone,
  Setting,
  Download,
  Delete,
  Loading,
  Close
} from '@element-plus/icons-vue'

import TouchGestureHandler from './TouchGestureHandler.vue'
import LazyImage from '@/components/common/LazyImage.vue'
import MobileMessageBubble from './MobileMessageBubble.vue'
import MobileChatInput from './MobileChatInput.vue'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  characterId?: string
  isStreaming?: boolean
  isError?: boolean
  reactions?: string[]
  metadata?: Record<string, any>
}

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  isOnline?: boolean
}

interface Props {
  character?: Character
  messages?: Message[]
  isLoading?: boolean
  isTyping?: boolean
  enableVoice?: boolean
  enableImage?: boolean
  maxMessageLength?: number
  hasOlderMessages?: boolean
  autoScroll?: boolean
  showQuickReplies?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
  isLoading: false,
  isTyping: false,
  enableVoice: true,
  enableImage: true,
  maxMessageLength: 2000,
  hasOlderMessages: false,
  autoScroll: true,
  showQuickReplies: true
})

const emit = defineEmits<{
  'send-message': [content: string, metadata?: Record<string, any>]
  'retry-message': [messageId: string]
  'edit-message': [messageId: string, newContent: string]
  'delete-message': [messageId: string]
  'load-older': []
  'message-reaction': [messageId: string, reaction: string]
  'back': []
  'character-details': []
  'voice-toggle': [enabled: boolean]
  'settings': []
  'export': []
  'clear': []
}>()

const router = useRouter()

// 组合式函数
const { keyboardHeight, isKeyboardVisible, adjustInputPosition } = useVirtualKeyboard()
const { isLowEndDevice } = useMobilePerformance()

// 引用
const chatContainer = ref<HTMLElement>()
const messagesContainer = ref<HTMLElement>()
const inputContainer = ref<HTMLElement>()

// 状态
const inputMessage = ref('')
const inputHeight = ref(60)
const hideHeader = ref(false)
const showScrollToBottom = ref(false)
const unreadCount = ref(0)
const lastScrollTop = ref(0)
const loadingOlder = ref(false)
const voiceMode = ref(false)
const isListening = ref(false)

// 快速回复
const quickReplies = ref<string[]>([
  '你好！',
  '怎么了？',
  '继续说',
  '有趣！',
  '我明白了'
])

// 计算属性
const displayMessages = computed(() => {
  // 在低端设备上限制显示的消息数量
  const maxMessages = isLowEndDevice.value ? 50 : 100
  return props.messages.slice(-maxMessages)
})

const inputPlaceholder = computed(() => {
  if (props.isLoading) return '请稍等...'
  if (props.isTyping) return `${props.character?.name} 正在输入...`
  return `与 ${props.character?.name || '角色'} 对话...`
})

const typingMessage = computed((): Message => ({
  id: 'typing',
  role: 'assistant',
  content: '',
  timestamp: new Date().toISOString(),
  characterId: props.character?.id,
  isStreaming: true
}))

const voiceInstruction = computed(() => {
  if (isListening.value) {
    return '说话中...松开结束录音'
  }
  return '点击开始录音，长按持续录音'
})

// 方法
const getAvatarFallback = (): string => {
  if (!props.character?.name) return ''

  const firstChar = props.character.name.charAt(0).toUpperCase()
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#6366f1"/>
      <text x="20" y="28" font-family="Arial, sans-serif" font-size="18"
            font-weight="bold" text-anchor="middle" fill="white">
        ${firstChar}
      </text>
    </svg>
  `)}`
}

const getCharacterStatus = (): string => {
  if (props.isTyping) return '正在输入...'
  if (props.character?.isOnline) return '在线'
  return '离线'
}

const isGroupedMessage = (message: Message, index: number): boolean => {
  if (index === 0) return false

  const prevMessage = displayMessages.value[index - 1]
  if (!prevMessage) return false

  // 相同角色且时间间隔小于5分钟的消息归为一组
  const timeDiff = new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()
  return message.role === prevMessage.role && timeDiff < 5 * 60 * 1000
}

const isLastInGroup = (message: Message, index: number): boolean => {
  if (index === displayMessages.value.length - 1) return true

  const nextMessage = displayMessages.value[index + 1]
  return !nextMessage || !isGroupedMessage(nextMessage, index + 1)
}

const handleBack = () => {
  emit('back')
}

const showCharacterDetails = () => {
  emit('character-details')
}

const handleHeaderAction = (command: string) => {
  switch (command) {
    case 'voice':
      toggleVoiceMode()
      break
    case 'settings':
      emit('settings')
      break
    case 'export':
      emit('export')
      break
    case 'clear':
      emit('clear')
      break
  }
}

const handleSendMessage = (content: string, metadata?: Record<string, any>) => {
  if (!content.trim()) return

  emit('send-message', content.trim(), metadata)
  inputMessage.value = ''

  // 自动滚动到底部
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

  // 检查是否接近底部
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
  showScrollToBottom.value = !isNearBottom

  // 自动隐藏/显示头部
  const isScrollingDown = scrollTop > lastScrollTop.value
  hideHeader.value = isScrollingDown && scrollTop > 50

  lastScrollTop.value = scrollTop

  // 重置未读计数
  if (isNearBottom) {
    unreadCount.value = 0
  }
}

const selectQuickReply = (reply: string) => {
  handleSendMessage(reply)
}

// 语音模式相关
const toggleVoiceMode = () => {
  voiceMode.value = !voiceMode.value
  emit('voice-toggle', voiceMode.value)
}

const exitVoiceMode = () => {
  voiceMode.value = false
  isListening.value = false
  emit('voice-toggle', false)
}

const toggleVoiceListening = () => {
  isListening.value = !isListening.value
}

const startContinuousListening = () => {
  isListening.value = true
  // 实现持续监听逻辑
}

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
}

const handleVoiceEnd = () => {
  isListening.value = false
}

const handleImageUpload = (file: File) => {
  // 处理图片上传
  console.log('Image upload:', file)
}

// 设置滚动监听
const setupScrollListener = () => {
  if (!messagesContainer.value) return

  messagesContainer.value.addEventListener('scroll', handleScroll, { passive: true })
}

// 监听消息变化
watch(() => props.messages.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    // 新消息到达
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
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mobile-chat-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page);
  position: relative;
}

.chat-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  transition: transform $transition-base;

  // 支持安全区域
  padding-top: max(8px, env(safe-area-inset-top));

  &.header-hidden {
    transform: translateY(-100%);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    min-height: 60px;
  }

  .back-btn-container {
    .back-btn {
      color: var(--el-text-color-primary);
      font-size: 20px;

      &:hover {
        color: $primary-500;
      }
    }
  }

  .character-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-3;
    cursor: pointer;
    min-width: 0;

    .character-avatar {
      position: relative;
      width: 40px;
      height: 40px;
      flex-shrink: 0;

      .avatar-image {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .typing-indicator {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: $primary-500;
        border-radius: 50%;
        border: 2px solid var(--el-bg-color);

        .typing-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;

          span {
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            margin: 0 1px;
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
        margin: 0;
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        color: var(--el-text-color-primary);
        @include text-truncate;
      }

      .character-status {
        margin: 0;
        font-size: $font-size-sm;
        color: var(--el-text-color-secondary);
        @include text-truncate;
      }
    }
  }

  .header-actions {
    .more-btn {
      color: var(--el-text-color-primary);
      font-size: 20px;

      &:hover {
        color: $primary-500;
      }
    }
  }
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;

  .load-older-trigger,
  .loading-older {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-4;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }

  .messages-list {
    padding: $spacing-4 $spacing-4 $spacing-8;

    .message-wrapper {
      margin-bottom: $spacing-2;

      &.grouped {
        margin-bottom: $spacing-1;
      }

      &.last-in-group {
        margin-bottom: $spacing-4;
      }
    }

    .typing-message {
      margin-bottom: $spacing-4;
    }
  }
}

.scroll-to-bottom {
  position: fixed;
  bottom: 120px;
  right: $spacing-4;
  z-index: 50;

  .scroll-btn {
    backdrop-filter: blur(10px);
    box-shadow: var(--el-box-shadow);

    .unread-badge {
      position: absolute;
      top: -8px;
      right: -8px;
    }
  }
}

.mobile-input-container {
  position: fixed;
  left: 0;
  right: 0;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  transition: bottom $transition-base;
  z-index: 90;

  // 支持安全区域
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.quick-replies {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 80;
  padding: 0 $spacing-4;

  .quick-replies-container {
    display: flex;
    gap: $spacing-2;
    overflow-x: auto;
    padding: $spacing-2 0;
    @include custom-scrollbar;

    .quick-reply-tag {
      cursor: pointer;
      white-space: nowrap;
      transition: all $transition-fast;

      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--el-box-shadow-light);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

.voice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(black, 0.8);
  backdrop-filter: blur(10px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;

  .voice-content {
    text-align: center;
    color: white;
    padding: $spacing-8;

    .voice-animation {
      margin-bottom: $spacing-6;

      .voice-wave {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        height: 60px;

        .wave-bar {
          width: 4px;
          height: 20px;
          background: rgba(white, 0.3);
          border-radius: 2px;
          transition: all 0.3s ease;

          &:nth-child(odd) {
            animation-delay: 0.1s;
          }

          &:nth-child(even) {
            animation-delay: 0.2s;
          }
        }

        &.active .wave-bar {
          background: $primary-500;
          animation: wave-animation 1s infinite ease-in-out;
        }
      }
    }

    .voice-title {
      margin-bottom: $spacing-3;
      font-size: $font-size-2xl;
      font-weight: $font-weight-semibold;
    }

    .voice-instruction {
      margin-bottom: $spacing-6;
      color: rgba(white, 0.8);
    }

    .voice-controls {
      .voice-btn {
        width: 80px;
        height: 80px;
        margin-bottom: $spacing-4;
        font-size: 24px;
      }

      .exit-voice-btn {
        color: rgba(white, 0.6);

        &:hover {
          color: white;
        }
      }
    }
  }
}

// 动画
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

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
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

// 移动端优化
@include mobile-only {
  .chat-header .header-content {
    padding: $spacing-2 $spacing-3;
    min-height: 50px;

    .character-info .character-details .character-name {
      font-size: $font-size-base;
    }
  }

  .messages-container .messages-list {
    padding: $spacing-3 $spacing-3 $spacing-6;
  }

  .scroll-to-bottom {
    bottom: 100px;
    right: $spacing-3;

    .scroll-btn {
      width: 48px;
      height: 48px;
    }
  }

  .voice-overlay .voice-content {
    padding: $spacing-6;

    .voice-controls .voice-btn {
      width: 70px;
      height: 70px;
      font-size: 20px;
    }
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .message-enter-active,
  .message-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }

  .typing-dots span {
    animation: none;
  }

  .voice-wave.active .wave-bar {
    animation: none;
  }
}
</style>