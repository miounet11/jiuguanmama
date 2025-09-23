<template>
  <div
    class="message-bubble"
    :class="messageClasses"
    :data-message-id="message.id"
  >
    <!-- 角色头像 -->
    <div v-if="!isUser" class="message-avatar">
      <img
        :src="message.characterAvatar || defaultAvatar"
        :alt="message.characterName || 'AI Assistant'"
        class="avatar-image"
        @error="handleAvatarError"
      />
      <div
        class="avatar-status"
        :class="characterStatus"
        :title="getStatusTitle(characterStatus)"
      />
    </div>

    <!-- 消息内容卡片 -->
    <TavernCard
      class="message-content"
      :variant="isUser ? 'filled' : 'outlined'"
      :size="messageSize"
      :hoverable="!message.isStreaming"
      @click="handleMessageClick"
    >
      <!-- 消息头部 -->
      <template #header v-if="showHeader">
        <div class="message-header">
          <div class="message-sender-info">
            <TavernIcon
              v-if="getSenderIcon()"
              :name="getSenderIcon()!"
              class="sender-icon"
            />
            <span class="sender-name">{{ getSenderName() }}</span>
            <span v-if="message.role === 'assistant' && message.characterName"
                  class="character-indicator">
              {{ message.characterName }}
            </span>
          </div>
          <div class="message-metadata">
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            <TavernIcon
              v-if="getStatusIcon()"
              :name="getStatusIcon()!"
              :class="getStatusClass()"
              size="xs"
              class="status-icon"
            />
          </div>
        </div>
      </template>

      <!-- 消息正文 -->
      <div class="message-body">
        <!-- 打字指示器 -->
        <TypingIndicator
          v-if="message.isStreaming"
          :character-name="message.characterName"
          size="sm"
        />

        <!-- 图像内容 -->
        <div v-if="message.imageUrl" class="message-image">
          <img
            :src="message.imageUrl"
            :alt="message.imagePrompt || 'Chat image'"
            class="chat-image"
            @click="$emit('previewImage', message.imageUrl, message.imagePrompt)"
          />
          <div v-if="message.imagePrompt" class="image-prompt">
            <TavernIcon name="image" size="xs" />
            <span>{{ message.imagePrompt }}</span>
          </div>
        </div>

        <!-- 文本内容 -->
        <div
          v-if="!message.isStreaming && message.content"
          class="message-text"
          v-html="formattedContent"
        />

        <!-- 错误状态 -->
        <div v-if="message.isError" class="message-error">
          <TavernIcon name="exclamation-triangle" size="sm" />
          <span>消息发送失败</span>
        </div>
      </div>

      <!-- 消息操作栏 -->
      <template #footer v-if="showActions && !message.isStreaming">
        <div class="message-actions">
          <div class="action-buttons">
            <!-- 复制消息 -->
            <TavernButton
              variant="ghost"
              size="xs"
              @click="$emit('copy', message.content)"
              title="复制消息"
            >
              <TavernIcon name="copy" />
            </TavernButton>

            <!-- 重新生成 (仅AI消息) -->
            <TavernButton
              v-if="!isUser && !message.isError"
              variant="ghost"
              size="xs"
              @click="$emit('regenerate', message)"
              title="重新生成"
              :disabled="isRegenerating"
            >
              <TavernIcon :name="isRegenerating ? 'spinner' : 'refresh'" />
            </TavernButton>

            <!-- 编辑消息 -->
            <TavernButton
              variant="ghost"
              size="xs"
              @click="$emit('edit', message)"
              title="编辑消息"
            >
              <TavernIcon name="edit" />
            </TavernButton>

            <!-- 删除消息 -->
            <TavernButton
              variant="ghost"
              size="xs"
              @click="$emit('delete', message)"
              title="删除消息"
              class="delete-action"
            >
              <TavernIcon name="trash" />
            </TavernButton>

            <!-- 语音播放 (仅AI消息) -->
            <TavernButton
              v-if="!isUser && enableVoice"
              variant="ghost"
              size="xs"
              @click="toggleVoicePlay"
              :title="isPlaying ? '停止播放' : '语音朗读'"
            >
              <TavernIcon :name="isPlaying ? 'pause' : 'play'" />
            </TavernButton>

            <!-- 消息评分 (仅AI消息) -->
            <TavernButton
              v-if="!isUser && enableRating"
              variant="ghost"
              size="xs"
              @click="$emit('rate', message)"
              title="评价消息"
              :class="{ 'rated': message.userRating }"
            >
              <TavernIcon name="star" />
            </TavernButton>
          </div>

          <!-- 消息统计信息 -->
          <div v-if="showStats" class="message-stats">
            <span v-if="message.tokenCount" class="token-count">
              {{ message.tokenCount }} tokens
            </span>
            <span v-if="message.responseTime" class="response-time">
              {{ formatResponseTime(message.responseTime) }}
            </span>
          </div>
        </div>
      </template>
    </TavernCard>

    <!-- 用户头像 (右侧) -->
    <div v-if="isUser" class="message-avatar user-avatar">
      <div class="user-avatar-placeholder">
        <TavernIcon name="user" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TypingIndicator from './TypingIndicator.vue'

// Types
export interface MessageBubbleProps {
  // 消息数据
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string | Date
    characterId?: string
    characterName?: string
    characterAvatar?: string
    imageUrl?: string
    imagePrompt?: string
    isStreaming?: boolean
    isError?: boolean
    tokenCount?: number
    responseTime?: number
    userRating?: number
    metadata?: Record<string, any>
  }

  // 显示控制
  showHeader?: boolean
  showActions?: boolean
  showStats?: boolean

  // 功能开关
  enableVoice?: boolean
  enableRating?: boolean

  // 状态
  isRegenerating?: boolean
  characterStatus?: 'online' | 'typing' | 'offline'

  // 外观
  messageSize?: 'sm' | 'md' | 'lg'
  maxWidth?: string
}

// Props
const props = withDefaults(defineProps<MessageBubbleProps>(), {
  showHeader: true,
  showActions: true,
  showStats: false,
  enableVoice: true,
  enableRating: true,
  isRegenerating: false,
  characterStatus: 'online',
  messageSize: 'md',
  maxWidth: '70%'
})

// Emits
const emit = defineEmits<{
  copy: [content: string]
  regenerate: [message: any]
  edit: [message: any]
  delete: [message: any]
  rate: [message: any]
  previewImage: [imageUrl: string, prompt?: string]
  voicePlay: [message: any]
  voiceStop: [message: any]
}>()

// State
const isPlaying = ref(false)
const defaultAvatar = '/default-avatar.png'

// Computed
const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')

const messageClasses = computed(() => [
  `message-bubble--${props.message.role}`,
  {
    'message-bubble--streaming': props.message.isStreaming,
    'message-bubble--error': props.message.isError,
    'message-bubble--has-image': props.message.imageUrl,
    'message-bubble--compact': props.messageSize === 'sm'
  }
])

const formattedContent = computed(() => {
  if (!props.message.content) return ''

  // 简单的 Markdown 格式化
  return props.message.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
})

// Methods
const formatTime = (timestamp: string | Date) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

  if (diffInMinutes < 1) return '刚刚'
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`

  return format(date, 'MM-dd HH:mm', { locale: zhCN })
}

const formatResponseTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const getSenderName = () => {
  if (isUser.value) return '你'
  if (isSystem.value) return '系统'
  return props.message.characterName || 'AI助手'
}

const getSenderIcon = () => {
  if (isUser.value) return 'user'
  if (isSystem.value) return 'cog'
  return 'robot'
}

const getStatusIcon = () => {
  if (props.message.isError) return 'exclamation-triangle'
  if (props.message.isStreaming) return 'spinner'
  if (isUser.value) {
    return 'check-circle' // 已发送
  }
  return null
}

const getStatusClass = () => {
  if (props.message.isError) return 'status-error'
  if (props.message.isStreaming) return 'status-streaming'
  if (isUser.value) return 'status-sent'
  return ''
}

const getStatusTitle = (status: string) => {
  switch (status) {
    case 'online': return '在线'
    case 'typing': return '正在输入...'
    case 'offline': return '离线'
    default: return ''
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = defaultAvatar
}

const handleMessageClick = () => {
  // 点击消息体的处理逻辑
  // 可以用于选择消息、展开详情等
}

const toggleVoicePlay = async () => {
  if (isPlaying.value) {
    emit('voiceStop', props.message)
    isPlaying.value = false
  } else {
    emit('voicePlay', props.message)
    isPlaying.value = true

    // 模拟播放完成后重置状态
    // 实际实现中应该监听音频播放事件
    setTimeout(() => {
      isPlaying.value = false
    }, 3000)
  }
}
</script>

<style lang="scss" scoped>
.message-bubble {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--message-gap);
  max-width: 100%;

  // === 角色样式变体 ===

  &--user {
    flex-direction: row-reverse;

    .message-content {
      background: var(--chat-user-bg);
      color: var(--chat-user-text);
      border: none;
      max-width: v-bind(maxWidth);
    }

    .message-header {
      .sender-name {
        color: var(--chat-user-text);
      }
    }

    .message-text {
      color: var(--chat-user-text);

      :deep(strong) {
        color: var(--chat-user-text);
      }

      :deep(code) {
        background: rgba(255, 255, 255, 0.2);
        color: var(--chat-user-text);
      }
    }
  }

  &--assistant {
    .message-content {
      background: var(--chat-assistant-bg);
      color: var(--chat-assistant-text);
      border: var(--space-px) solid var(--border-secondary);
      max-width: v-bind(maxWidth);
    }
  }

  &--system {
    justify-content: center;

    .message-content {
      background: var(--chat-system-bg);
      color: var(--chat-system-text);
      border: var(--space-px) solid var(--border-secondary);
      max-width: 60%;
      text-align: center;
      font-size: var(--text-sm);
    }
  }

  // === 状态样式 ===

  &--streaming {
    .message-content {
      border-color: var(--tavern-primary);
      box-shadow: 0 0 0 var(--space-1) rgba(var(--brand-primary-500), 0.1);
    }
  }

  &--error {
    .message-content {
      border-color: var(--error);
      background: rgba(248, 113, 113, 0.1);
    }
  }

  &--compact {
    margin-bottom: var(--space-2);

    .message-content {
      --card-padding: var(--space-2);
    }
  }

  &--has-image {
    .message-text {
      margin-top: var(--space-2);
    }
  }
}

// === 头像系统 ===
.message-avatar {
  flex-shrink: 0;
  position: relative;

  .avatar-image {
    width: 40px;
    height: 40px;
    border-radius: var(--avatar-radius);
    object-fit: cover;
    border: 2px solid var(--border-secondary);
    transition: var(--transition-colors);
  }

  .avatar-status {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: var(--radius-full);
    border: 2px solid var(--surface-1);
    background: var(--neutral-500);

    &.online {
      background: var(--success);
    }

    &.typing {
      background: var(--info);
      animation: pulse 1.5s infinite;
    }

    &.offline {
      background: var(--neutral-600);
    }
  }

  &.user-avatar {
    .user-avatar-placeholder {
      width: 40px;
      height: 40px;
      background: var(--brand-primary-500);
      border-radius: var(--avatar-radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--text-lg);
    }
  }
}

// === 消息头部 ===
.message-header {
  display: flex;
  justify-content: between;
  align-items: center;

  .message-sender-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;

    .sender-icon {
      color: var(--tavern-primary);
    }

    .sender-name {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }

    .character-indicator {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      background: var(--surface-4);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }
  }

  .message-metadata {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .message-time {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .status-icon {
      &.status-error {
        color: var(--error);
      }

      &.status-streaming {
        color: var(--info);
        animation: spin 1s linear infinite;
      }

      &.status-sent {
        color: var(--success);
      }
    }
  }
}

// === 消息主体 ===
.message-body {
  line-height: var(--leading-relaxed);

  .message-image {
    margin-bottom: var(--space-3);
    border-radius: var(--radius-md);
    overflow: hidden;
    max-width: 400px;

    .chat-image {
      width: 100%;
      height: auto;
      cursor: pointer;
      transition: var(--transition-transform);

      &:hover {
        transform: scale(1.02);
      }
    }

    .image-prompt {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--surface-4);
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }
  }

  .message-text {
    word-break: break-word;

    :deep(strong) {
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }

    :deep(em) {
      font-style: italic;
      color: var(--text-secondary);
    }

    :deep(code) {
      background: var(--surface-4);
      color: var(--text-primary);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.9em;
    }

    :deep(a) {
      color: var(--tavern-primary);
      text-decoration: none;
      border-bottom: var(--space-px) solid var(--tavern-primary);

      &:hover {
        color: var(--tavern-primary-hover);
        border-bottom-color: var(--tavern-primary-hover);
      }
    }
  }

  .message-error {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--error);
    font-size: var(--text-sm);
    padding: var(--space-2);
    background: rgba(248, 113, 113, 0.1);
    border-radius: var(--radius-sm);
    border: var(--space-px) solid var(--error);
  }
}

// === 消息操作 ===
.message-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0;
  transition: var(--transition-opacity);

  .action-buttons {
    display: flex;
    gap: var(--space-1);

    .delete-action {
      color: var(--error);

      &:hover {
        background: rgba(248, 113, 113, 0.1);
      }
    }

    .rated {
      color: var(--warning);
    }
  }

  .message-stats {
    display: flex;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--text-quaternary);

    .token-count,
    .response-time {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
  }
}

// 悬浮时显示操作按钮
.message-bubble:hover .message-actions {
  opacity: 1;
}

// === 动画 ===
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// === 响应式设计 ===
@media (max-width: 768px) {
  .message-bubble {
    gap: var(--space-2);

    &--user,
    &--assistant {
      .message-content {
        max-width: 85%;
      }
    }

    .message-avatar {
      .avatar-image,
      .user-avatar-placeholder {
        width: 32px;
        height: 32px;
      }

      .avatar-status {
        width: 10px;
        height: 10px;
      }
    }

    .message-header {
      .sender-name {
        font-size: var(--text-xs);
      }

      .character-indicator {
        display: none; // 移动端隐藏角色指示器
      }
    }

    .message-actions {
      opacity: 1; // 移动端始终显示操作按钮

      .message-stats {
        display: none; // 移动端隐藏统计信息
      }
    }
  }
}

// === 暗色主题优化 ===
[data-theme="dark"] {
  .message-bubble {
    &--user {
      .message-content {
        background: linear-gradient(135deg, var(--brand-primary-600), var(--brand-primary-500));
      }
    }

    &--assistant {
      .message-content {
        background: var(--surface-2);
        border-color: var(--border-primary);
      }
    }
  }

  .message-text {
    :deep(code) {
      background: var(--surface-4);
      color: var(--text-primary);
    }
  }
}
</style>