<template>
  <div
    :class="messageClasses"
    :data-message-id="message.id"
    :data-message-role="message.role"
    role="article"
    :aria-label="ariaLabel"
  >
    <!-- 消息头像 -->
    <div
      v-if="showAvatar"
      class="message-avatar"
      :class="{ 'avatar-user': message.role === 'user' }"
    >
      <div class="avatar-container">
        <img
          v-if="message.role === 'assistant' && character?.avatar"
          :src="character.avatar"
          :alt="character.name"
          class="avatar-image"
          @error="handleAvatarError"
        />
        <div
          v-else-if="message.role === 'assistant'"
          class="assistant-avatar"
        >
          <TavernIcon name="sparkles" />
        </div>
        <div v-else class="user-avatar">
          <TavernIcon name="user" />
        </div>

        <!-- 在线状态指示器 -->
        <div
          v-if="message.role === 'assistant'"
          class="online-indicator"
          :class="{ 'online': isOnline }"
        />
      </div>
    </div>

    <!-- 消息内容区域 -->
    <div class="message-content">
      <!-- 消息头部 -->
      <div class="message-header">
        <div class="sender-info">
          <span class="sender-name">{{ senderName }}</span>
          <span class="message-time" :title="formatDateTime(message.timestamp)">
            {{ formatTime(message.timestamp) }}
          </span>
        </div>

        <!-- 消息状态 -->
        <div class="message-status">
          <div v-if="message.streaming" class="streaming-status">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="streaming-text">正在输入...</span>
          </div>
          <div v-else-if="message.error" class="error-status">
            <TavernIcon name="exclamation-triangle" size="xs" />
            <span>发送失败</span>
          </div>
          <div v-else-if="message.role === 'user'" class="delivered-status">
            <TavernIcon name="check" size="xs" />
          </div>
        </div>
      </div>

      <!-- 图像消息 -->
      <div v-if="message.imageUrl" class="message-image">
        <div class="image-container">
          <img
            :src="message.imageUrl"
            :alt="message.imagePrompt || '聊天图像'"
            class="chat-image"
            @click="previewImage"
            @error="handleImageError"
            loading="lazy"
          />
          <div class="image-overlay">
            <TavernIcon name="magnifying-glass-plus" />
          </div>
        </div>
        <div v-if="message.imagePrompt" class="image-caption">
          <TavernIcon name="photo" size="xs" />
          <span>{{ message.imagePrompt }}</span>
        </div>
      </div>

      <!-- 消息文本内容 -->
      <div class="message-text-container">
        <div
          class="message-text"
          :class="{ 'text-streaming': message.streaming }"
          v-html="formattedContent"
        />

        <!-- 流式光标 -->
        <div v-if="message.streaming" class="streaming-cursor">|</div>
      </div>

      <!-- 消息操作栏 -->
      <div v-if="showActions" class="message-actions">
        <div class="action-buttons">
          <TavernButton
            variant="ghost"
            size="xs"
            @click="copyMessage"
            title="复制"
            class="action-btn"
          >
            <TavernIcon name="document-duplicate" size="xs" />
          </TavernButton>

          <TavernButton
            v-if="message.role === 'assistant'"
            variant="ghost"
            size="xs"
            @click="regenerateMessage"
            :disabled="isLoading"
            title="重新生成"
            class="action-btn"
          >
            <TavernIcon name="arrow-path" size="xs" />
          </TavernButton>

          <TavernButton
            v-if="message.role === 'assistant'"
            variant="ghost"
            size="xs"
            @click="rateMessage"
            title="评价"
            class="action-btn"
          >
            <TavernIcon name="star" size="xs" />
          </TavernButton>

          <TavernButton
            v-if="enableVoice && message.role === 'assistant'"
            variant="ghost"
            size="xs"
            @click="toggleVoice"
            :title="isPlaying ? '停止朗读' : '朗读消息'"
            class="action-btn"
          >
            <TavernIcon :name="isPlaying ? 'speaker-x-mark' : 'speaker-wave'" size="xs" />
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="xs"
            @click="shareMessage"
            title="分享"
            class="action-btn"
          >
            <TavernIcon name="share" size="xs" />
          </TavernButton>
        </div>
      </div>

      <!-- 消息反应 -->
      <div v-if="hasReactions" class="message-reactions">
        <button
          v-for="reaction in reactions"
          :key="reaction.emoji"
          @click="toggleReaction(reaction.emoji)"
          class="reaction-btn"
          :class="{ 'reacted': reaction.hasReacted }"
        >
          <span>{{ reaction.emoji }}</span>
          <span class="reaction-count">{{ reaction.count }}</span>
        </button>
        <button @click="showEmojiPicker = true" class="add-reaction-btn">
          <TavernIcon name="face-smile" size="xs" />
        </button>
      </div>
    </div>

    <!-- 消息分隔线 -->
    <div v-if="showDateSeparator" class="date-separator">
      <div class="separator-line"></div>
      <span class="separator-text">{{ formatDate(message.timestamp) }}</span>
      <div class="separator-line"></div>
    </div>

    <!-- 表情选择器 -->
    <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click="showEmojiPicker = false">
      <div class="emoji-picker" @click.stop>
        <div class="emoji-grid">
          <button
            v-for="emoji in commonEmojis"
            :key="emoji"
            @click="addReaction(emoji)"
            class="emoji-btn"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, type PropType } from 'vue'
import { useChatDateFormatter } from '@/composables/useDateFormatter'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'

// 类型定义
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  imageUrl?: string
  imagePrompt?: string
  streaming?: boolean
  error?: boolean
  reactions?: Array<{
    emoji: string
    count: number
    hasReacted: boolean
  }>
}

export interface Character {
  id: string
  name: string
  avatar?: string
}

// Props
const props = defineProps({
  message: {
    type: Object as PropType<Message>,
    required: true
  },
  character: {
    type: Object as PropType<Character>,
    default: null
  },
  showAvatar: {
    type: Boolean,
    default: true
  },
  isStreaming: {
    type: Boolean,
    default: false
  },
  isPrevious: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  enableVoice: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  },
  showDateSeparator: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits<{
  'copy': [content: string]
  'regenerate': [message: Message]
  'rate': [message: Message]
  'voice-play': [message: Message]
  'voice-stop': [message: Message]
  'share': [message: Message]
  'preview-image': [data: { url: string; prompt?: string }]
  'reaction': [messageId: string, emoji: string, add: boolean]
}>()

// 响应式数据
const showEmojiPicker = ref(false)
const reactions = ref(props.message.reactions || [])
const showActions = ref(false)

// 组合式函数
const { formatDateTime, formatTime, formatDate } = useChatDateFormatter()

// 常用表情
const commonEmojis = [
  '👍', '❤️', '😊', '😂', '🎉', '🤔', '😍', '👏',
  '🔥', '💯', '🎯', '💡', '🌟', '🚀', '✨', '💪'
]

// 计算属性
const messageClasses = computed(() => [
  'immersive-message-bubble',
  `message-${props.message.role}`,
  {
    'message-compact': props.compact,
    'message-streaming': props.isStreaming,
    'message-error': props.message.error,
    'message-previous': props.isPrevious,
    'no-avatar': !props.showAvatar,
    'has-actions': showActions.value,
    'has-reactions': hasReactions.value
  }
])

const senderName = computed(() => {
  switch (props.message.role) {
    case 'user':
      return '你'
    case 'assistant':
      return props.character?.name || 'AI助手'
    case 'system':
      return '系统'
    default:
      return '未知'
  }
})

const hasReactions = computed(() => {
  return reactions.value && reactions.value.length > 0
})

const ariaLabel = computed(() => {
  const timeStr = formatDateTime(props.message.timestamp)
  const statusStr = props.message.streaming ? '正在输入' : props.message.error ? '发送失败' : ''
  return `${senderName.value} 于 ${timeStr} 发送的消息${statusStr ? '，' + statusStr : ''}`
})

// 格式化消息内容
const formattedContent = computed(() => {
  let content = props.message.content

  // 转义HTML
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Markdown格式化
  content = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')

  // 链接转换
  const urlRegex = /(https?:\/\/[^\s]+)/g
  content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')

  // @提及转换
  const mentionRegex = /@(\w+)/g
  content = content.replace(mentionRegex, '<span class="message-mention">@$1</span>')

  return content
})

// 方法
const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const copyMessage = () => {
  emit('copy', props.message.content)
}

const regenerateMessage = () => {
  emit('regenerate', props.message)
}

const rateMessage = () => {
  emit('rate', props.message)
}

const toggleVoice = () => {
  if (props.isPlaying) {
    emit('voice-stop', props.message)
  } else {
    emit('voice-play', props.message)
  }
}

const shareMessage = () => {
  emit('share', props.message)
}

const previewImage = () => {
  if (props.message.imageUrl) {
    emit('preview-image', {
      url: props.message.imageUrl,
      prompt: props.message.imagePrompt
    })
  }
}

// 反应相关
const toggleReaction = (emoji: string) => {
  const reaction = reactions.value.find(r => r.emoji === emoji)
  if (reaction) {
    addReaction(emoji)
  } else {
    addReaction(emoji)
  }
}

const addReaction = (emoji: string) => {
  const reaction = reactions.value.find(r => r.emoji === emoji)
  if (reaction) {
    if (reaction.hasReacted) {
      reaction.count--
      reaction.hasReacted = false
    } else {
      reaction.count++
      reaction.hasReacted = true
    }
  } else {
    reactions.value.push({
      emoji,
      count: 1,
      hasReacted: true
    })
  }

  emit('reaction', props.message.id, emoji, true)
  showEmojiPicker.value = false
}

// 显示/隐藏操作栏
const handleMouseEnter = () => {
  showActions.value = true
}

const handleMouseLeave = () => {
  showActions.value = false
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.immersive-message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  position: relative;
  animation: messageSlideIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);

  // 用户消息
  &.message-user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;

      .message-text {
        background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
        color: white;
        border-radius: 20px 20px 4px 20px;
        box-shadow: 0 4px 12px rgba($primary-500, 0.3);
      }

      .message-header .sender-name {
        color: $text-secondary;
      }
    }

    .message-avatar {
      margin-left: 0;
      margin-right: 0;
    }
  }

  // AI助手消息
  &.message-assistant {
    .message-text {
      background: rgba($dark-bg-secondary, 0.95);
      border: 1px solid rgba($primary-500, 0.2);
      border-radius: 20px 20px 20px 4px;
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  // 系统消息
  &.message-system {
    justify-content: center;
    margin: 16px 0;

    .message-content {
      .message-text {
        background: rgba($gray-600, 0.1);
        color: $text-tertiary;
        font-style: italic;
        font-size: $text-sm;
        border-radius: 12px;
        text-align: center;
        border: 1px solid rgba($gray-600, 0.2);
      }
    }
  }

  // 紧凑模式
  &.message-compact {
    margin-bottom: 12px;
    gap: 8px;

    .message-avatar {
      width: 32px;
      height: 32px;
    }

    .message-text {
      font-size: $text-sm;
      padding: 10px 14px;
    }
  }

  // 流式状态
  &.message-streaming {
    .message-text {
      border-bottom: 2px solid $primary-500;
      animation: streamingBorder 1.5s ease-in-out infinite;
    }
  }

  // 错误状态
  &.message-error {
    .message-text {
      background: rgba($error-color, 0.1);
      border-color: rgba($error-color, 0.3);
      color: $error-color;
    }
  }

  // 没有头像
  &.no-avatar {
    padding-left: 52px; // 为头像预留空间
  }

  // 悬停效果
  &:hover {
    .message-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

// 消息头像
.message-avatar {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;

  .avatar-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba($primary-500, 0.3);
    transition: all 0.3s ease;

    &:hover {
      border-color: $primary-500;
      transform: scale(1.05);
    }
  }

  .assistant-avatar,
  .user-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .assistant-avatar {
    background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
    color: white;
    border: 2px solid rgba($primary-500, 0.3);
  }

  .user-avatar {
    background: rgba($gray-600, 0.2);
    color: $text-secondary;
    border: 2px solid rgba($gray-600, 0.3);
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: $gray-500;
    border: 2px solid $dark-bg-secondary;
    transition: all 0.3s ease;

    &.online {
      background: $success-color;
      box-shadow: 0 0 8px rgba($success-color, 0.5);
    }
  }
}

// 消息内容
.message-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

// 消息头部
.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  padding: 0 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }

  .sender-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .sender-name {
      font-size: $text-xs;
      font-weight: 600;
      color: $text-secondary;
    }

    .message-time {
      font-size: $text-xs;
      color: $text-tertiary;
      font-variant-numeric: tabular-nums;
    }
  }

  .message-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: $text-xs;
    color: $text-tertiary;

    .streaming-status {
      display: flex;
      align-items: center;
      gap: 6px;
      color: $primary-400;

      .typing-dots {
        display: flex;
        gap: 2px;

        span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: $primary-400;
          animation: typingBounce 1.4s ease-in-out infinite;

          &:nth-child(1) { animation-delay: -0.32s; }
          &:nth-child(2) { animation-delay: -0.16s; }
        }
      }
    }

    .error-status {
      color: $error-color;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .delivered-status {
      color: $success-color;
    }
  }
}

// 消息图像
.message-image {
  margin-bottom: 8px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;

  .image-container {
    position: relative;
    cursor: pointer;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);

      .image-overlay {
        opacity: 1;
      }
    }

    .chat-image {
      width: 100%;
      max-width: 300px;
      height: auto;
      display: block;
      border-radius: 12px;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }

  .image-caption {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba($gray-600, 0.1);
    border-radius: 8px;
    font-size: $text-xs;
    color: $text-tertiary;
    margin-top: 6px;
  }
}

// 消息文本
.message-text-container {
  position: relative;
}

.message-text {
  padding: 14px 18px;
  border-radius: 20px;
  line-height: 1.6;
  word-wrap: break-word;
  transition: all 0.3s ease;
  position: relative;

  // 富文本样式
  :deep(strong) {
    font-weight: 600;
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(code) {
    background: rgba($gray-600, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: $font-mono;
    font-size: 0.9em;
  }

  :deep(.message-link) {
    color: $primary-400;
    text-decoration: underline;
    transition: color 0.2s ease;

    &:hover {
      color: $primary-300;
    }
  }

  :deep(.message-mention) {
    background: rgba($primary-500, 0.2);
    color: $primary-300;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
  }

  // 流式状态
  &.text-streaming {
    background-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: streamingShimmer 2s ease-in-out infinite;
  }
}

// 流式光标
.streaming-cursor {
  display: inline-block;
  color: $primary-400;
  font-weight: bold;
  animation: cursorBlink 1s ease-in-out infinite;
}

// 消息操作
.message-actions {
  margin-top: 8px;
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.3s ease;

  .action-buttons {
    display: flex;
    gap: 4px;
    padding: 0 4px;

    .action-btn {
      min-width: 32px;
      height: 32px;
      background: rgba($gray-600, 0.1);
      border: 1px solid rgba($gray-600, 0.2);
      border-radius: 16px;
      color: $text-tertiary;
      transition: all 0.2s ease;

      &:hover {
        background: rgba($gray-600, 0.2);
        color: $text-secondary;
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

// 消息反应
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding: 0 4px;

  .reaction-btn,
  .add-reaction-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba($gray-600, 0.1);
    border: 1px solid rgba($gray-600, 0.2);
    border-radius: 16px;
    font-size: $text-xs;
    color: $text-tertiary;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($gray-600, 0.2);
      color: $text-secondary;
      transform: translateY(-1px);
    }

    &.reacted {
      background: rgba($primary-500, 0.2);
      border-color: rgba($primary-500, 0.3);
      color: $primary-300;
    }

    .reaction-count {
      font-weight: 500;
    }
  }
}

// 日期分隔符
.date-separator {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  padding: 0 20px;

  .separator-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba($gray-600, 0.3),
      transparent
    );
  }

  .separator-text {
    font-size: $text-xs;
    color: $text-tertiary;
    font-weight: 500;
    white-space: nowrap;
  }
}

// 表情选择器
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-picker {
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 300px;

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;

    .emoji-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba($gray-600, 0.2);
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

// 动画
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes streamingBorder {
  0%, 100% {
    border-bottom-color: rgba($primary-500, 0.3);
  }
  50% {
    border-bottom-color: $primary-500;
  }
}

@keyframes streamingShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes cursorBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .immersive-message-bubble {
    margin-bottom: 16px;
    gap: 8px;

    .message-content {
      max-width: 85%;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
    }

    .message-text {
      padding: 12px 16px;
      font-size: $text-sm;
    }
  }
}

// 无障碍支持
@media (prefers-reduced-motion: reduce) {
  .immersive-message-bubble {
    animation: none;
  }

  .message-text,
  .message-actions,
  .message-avatar .avatar-image,
  .message-avatar .assistant-avatar,
  .message-avatar .user-avatar {
    transition: none;
  }

  .streaming-cursor {
    animation: none;
  }
}
</style>