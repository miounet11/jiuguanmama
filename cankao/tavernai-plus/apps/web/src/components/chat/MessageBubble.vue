<template>
  <div
    :class="messageClasses"
    :aria-label="ariaLabel"
    role="article"
    :id="`message-${message.id}`"
  >
    <!-- 消息头像 -->
    <div class="message-avatar" :aria-hidden="true">
      <img
        v-if="message.role === 'assistant'"
        :src="character?.avatar || '/default-avatar.png'"
        :alt="`${character?.name || 'AI'} 头像`"
        class="avatar-image"
        @error="handleAvatarError"
      />
      <div v-else class="user-avatar">
        <TavernIcon name="user" size="md" />
      </div>
    </div>

    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 消息头部信息 -->
      <div class="message-header">
        <span class="message-sender" :id="`sender-${message.id}`">
          {{ senderName }}
        </span>
        <time
          class="message-time"
          :datetime="message.timestamp.toISOString()"
          :title="formatDateTime(message.timestamp)"
        >
          {{ formatTime(message.timestamp) }}
        </time>
      </div>

      <!-- 图像消息 -->
      <div
        v-if="message.imageUrl"
        class="message-image"
        role="img"
        :aria-label="message.imagePrompt || '用户发送的图像'"
      >
        <img
          :src="message.imageUrl"
          :alt="message.imagePrompt || '用户图像'"
          class="chat-image"
          @click="$emit('image-preview', { url: message.imageUrl, prompt: message.imagePrompt })"
          @error="handleImageError"
          loading="lazy"
        />
        <div v-if="message.imagePrompt" class="image-prompt">
          {{ message.imagePrompt }}
        </div>
      </div>

      <!-- 消息文本内容 -->
      <div
        class="message-text"
        :aria-describedby="`sender-${message.id}`"
        v-html="formattedContent"
      />

      <!-- 消息操作 -->
      <div v-if="showActions" class="message-actions" role="toolbar" :aria-label="actionsAriaLabel">
        <TavernButton
          @click="$emit('copy-message', message.content)"
          variant="ghost"
          size="sm"
          title="复制消息"
          :aria-label="`复制 ${senderName} 的消息`"
          class="action-btn"
        >
          <TavernIcon name="document-duplicate" size="sm" />
        </TavernButton>

        <TavernButton
          v-if="message.role === 'assistant'"
          @click="$emit('regenerate-message', message)"
          variant="ghost"
          size="sm"
          title="重新生成"
          :aria-label="`重新生成 ${senderName} 的回复`"
          :disabled="isLoading"
          class="action-btn"
        >
          <TavernIcon name="arrow-path" size="sm" />
        </TavernButton>

        <TavernButton
          v-if="message.role === 'assistant'"
          @click="$emit('rate-message', message)"
          variant="ghost"
          size="sm"
          title="评价消息"
          :aria-label="`评价 ${senderName} 的回复`"
          class="action-btn"
        >
          <TavernIcon name="star" size="sm" />
        </TavernButton>

        <TavernButton
          v-if="enableVoice && message.role === 'assistant'"
          @click="handleVoicePlay"
          variant="ghost"
          size="sm"
          :title="isPlaying ? '停止朗读' : '朗读消息'"
          :aria-label="`${isPlaying ? '停止朗读' : '朗读'} ${senderName} 的消息`"
          class="action-btn"
        >
          <TavernIcon :name="isPlaying ? 'speaker-x-mark' : 'speaker-wave'" size="sm" />
        </TavernButton>
      </div>
    </div>

    <!-- 错误状态指示器 -->
    <div v-if="hasError" class="message-error" role="alert" aria-live="polite">
      <TavernIcon name="warning" size="sm" />
      <span>消息发送失败</span>
      <TavernButton
        @click="$emit('retry-message', message)"
        variant="ghost"
        size="sm"
        title="重试发送"
      >
        重试
      </TavernButton>
    </div>

    <!-- 加载状态 -->
    <div v-if="isStreaming" class="message-streaming" aria-live="polite" aria-label="正在接收消息">
      <div class="streaming-indicator">
        <TavernIcon name="loading" size="sm" class="spinning" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
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
  error?: boolean
  streaming?: boolean
}

export interface Character {
  id: string
  name: string
  avatar?: string
}

// Props 定义
const props = defineProps({
  message: {
    type: Object as PropType<Message>,
    required: true
  },
  character: {
    type: Object as PropType<Character>,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  enableVoice: {
    type: Boolean,
    default: true
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
})

// Emits 定义
defineEmits<{
  'copy-message': [content: string]
  'regenerate-message': [message: Message]
  'rate-message': [message: Message]
  'retry-message': [message: Message]
  'voice-play': [message: Message]
  'voice-stop': [message: Message]
  'image-preview': [data: { url: string, prompt?: string }]
}>()

// 组合式函数
const { formatDateTime, formatTime } = useChatDateFormatter()

// 计算属性
const messageClasses = computed(() => [
  'message-bubble',
  `message-bubble--${props.message.role}`,
  {
    'message-bubble--compact': props.compact,
    'message-bubble--error': hasError.value,
    'message-bubble--streaming': isStreaming.value
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

const showActions = computed(() => {
  return !props.compact && !hasError.value && !isStreaming.value
})

const hasError = computed(() => {
  return props.message.error === true
})

const isStreaming = computed(() => {
  return props.message.streaming === true
})

const ariaLabel = computed(() => {
  const timeStr = formatDateTime(props.message.timestamp)
  return `${senderName.value} 于 ${timeStr} 发送的消息`
})

const actionsAriaLabel = computed(() => {
  return `${senderName.value} 消息的操作`
})

// 格式化消息内容（支持简单的 Markdown）
const formattedContent = computed(() => {
  let content = props.message.content

  // 转义 HTML 标签（安全考虑）
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 简单的 Markdown 格式化
  content = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
    .replace(/`(.*?)`/g, '<code>$1</code>') // 行内代码
    .replace(/\n/g, '<br>') // 换行

  // 链接检测和转换
  const urlRegex = /(https?:\/\/[^\s]+)/g
  content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')

  return content
})

// 方法
const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/default-avatar.png'
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const handleVoicePlay = () => {
  if (props.isPlaying) {
    // 停止播放
    emit('voice-stop', props.message)
  } else {
    // 开始播放
    emit('voice-play', props.message)
  }
}
</script>

<style lang="scss" scoped>
.message-bubble {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
  position: relative;

  // 悬停效果
  &:hover {
    background-color: var(--color-surface-hover);

    .message-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 用户消息
  &--user {
    flex-direction: row-reverse;

    .message-content {
      text-align: right;

      .message-text {
        background: var(--color-primary);
        color: var(--color-primary-foreground);
        margin-left: var(--space-6);
      }
    }

    .message-actions {
      justify-content: flex-end;
    }
  }

  // AI助手消息
  &--assistant {
    .message-text {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      margin-right: var(--space-6);
    }
  }

  // 系统消息
  &--system {
    justify-content: center;

    .message-content {
      text-align: center;

      .message-text {
        background: var(--color-muted);
        color: var(--color-muted-foreground);
        font-style: italic;
        font-size: var(--text-sm);
      }
    }
  }

  // 紧凑模式
  &--compact {
    padding: var(--space-2);
    margin-bottom: var(--space-2);

    .message-avatar {
      width: var(--space-8);
      height: var(--space-8);
    }

    .message-text {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
    }
  }

  // 错误状态
  &--error {
    .message-text {
      background: var(--color-destructive-subtle);
      border-color: var(--color-destructive);
    }
  }

  // 流式接收状态
  &--streaming {
    .message-text {
      border-bottom: 2px solid var(--color-primary);
      animation: pulse 1.5s ease-in-out infinite;
    }
  }
}

.message-avatar {
  width: var(--space-12);
  height: var(--space-12);
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-avatar {
    width: 100%;
    height: 100%;
    background: var(--color-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-muted-foreground);
  }
}

.message-content {
  flex: 1;
  min-width: 0; // 防止 flex 子元素溢出
}

.message-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);

  .message-sender {
    font-weight: var(--font-semibold);
    font-size: var(--text-sm);
    color: var(--color-foreground);
  }

  .message-time {
    font-size: var(--text-xs);
    color: var(--color-muted-foreground);
    font-variant-numeric: tabular-nums;
  }
}

.message-text {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  line-height: 1.6;
  word-wrap: break-word;

  // 富文本样式
  :deep(strong) {
    font-weight: var(--font-semibold);
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(code) {
    background: var(--color-muted);
    padding: 2px 4px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 0.9em;
  }

  :deep(a) {
    color: var(--color-primary);
    text-decoration: underline;

    &:hover {
      text-decoration: none;
    }
  }
}

.message-image {
  margin-bottom: var(--space-3);

  .chat-image {
    max-width: 300px;
    max-height: 300px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  .image-prompt {
    margin-top: var(--space-2);
    font-size: var(--text-xs);
    color: var(--color-muted-foreground);
    font-style: italic;
  }
}

.message-actions {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-2);
  opacity: 0;
  transform: translateY(var(--space-1));
  transition: all 0.2s ease;

  .action-btn {
    min-width: auto;
    padding: var(--space-1);

    &:hover {
      background: var(--color-muted);
    }
  }
}

.message-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-destructive-subtle);
  border: 1px solid var(--color-destructive);
  border-radius: var(--radius-md);
  color: var(--color-destructive-foreground);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.message-streaming {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-4);

  .streaming-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-primary);
  }
}

// 动画
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .message-bubble {
    padding: var(--space-3);
    gap: var(--space-2);

    .message-avatar {
      width: var(--space-10);
      height: var(--space-10);
    }

    .message-text {
      margin-left: var(--space-4);
      margin-right: var(--space-4);
    }
  }
}

// 无障碍和高对比度支持
@media (prefers-reduced-motion: reduce) {
  .message-bubble {
    transition: none;
  }

  .spinning {
    animation: none;
  }
}

@media (prefers-contrast: high) {
  .message-text {
    border-width: 2px;
  }

  .action-btn:hover {
    outline: 2px solid currentColor;
  }
}
</style>
