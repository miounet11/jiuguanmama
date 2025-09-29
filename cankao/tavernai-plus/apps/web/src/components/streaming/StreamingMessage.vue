<template>
  <div class="streaming-message" :class="messageClasses">
    <div class="message-header" v-if="showHeader">
      <div class="message-meta">
        <span class="message-time">{{ formattedTime }}</span>
        <span class="message-type" v-if="message.type !== 'data'">{{ message.type }}</span>
      </div>
      <div class="message-actions">
        <el-button
          v-if="canInterrupt && isStreaming"
          type="danger"
          size="small"
          icon="el-icon-close"
          @click="handleInterrupt"
          :loading="interrupting"
        >
          {{ $t('streaming.interrupt') }}
        </el-button>
      </div>
    </div>

    <div class="message-content" ref="contentRef">
      <div v-if="message.type === 'error'" class="error-content">
        <el-alert
          :title="$t('streaming.error')"
          type="error"
          :description="displayContent"
          show-icon
          :closable="false"
        />
      </div>

      <div v-else-if="message.type === 'complete'" class="complete-content">
        <el-alert
          :title="$t('streaming.completed')"
          type="success"
          :description="displayContent"
          show-icon
          :closable="false"
        />
      </div>

      <div v-else class="text-content">
        <div
          class="typewriter-text"
          :class="{ 'typing': isTyping }"
          v-html="renderedContent"
        ></div>

        <div v-if="isTyping" class="typing-indicator">
          <span class="cursor"></span>
        </div>
      </div>
    </div>

    <div class="message-footer" v-if="showFooter">
      <div class="message-stats">
        <span v-if="message.executionTime" class="stat">
          <i class="el-icon-time"></i>
          {{ message.executionTime }}ms
        </span>
        <span v-if="message.memoryUsed" class="stat">
          <i class="el-icon-cpu"></i>
          {{ formatBytes(message.memoryUsed) }}
        </span>
        <span v-if="message.tokens" class="stat">
          <i class="el-icon-document"></i>
          {{ message.tokens }} tokens
        </span>
      </div>

      <div class="message-controls">
        <el-button
          size="mini"
          icon="el-icon-copy-document"
          @click="copyToClipboard"
          :title="$t('common.copy')"
        />
        <el-button
          size="mini"
          icon="el-icon-refresh"
          @click="regenerateMessage"
          :title="$t('streaming.regenerate')"
          v-if="canRegenerate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface StreamingMessage {
  id: string
  type: 'data' | 'heartbeat' | 'error' | 'complete'
  data: any
  timestamp: Date
  connectionId: string
  executionTime?: number
  memoryUsed?: number
  tokens?: number
}

interface Props {
  message: StreamingMessage
  showHeader?: boolean
  showFooter?: boolean
  typewriterEffect?: boolean
  typewriterSpeed?: number
  canInterrupt?: boolean
  canRegenerate?: boolean
  autoScroll?: boolean
  highlightCode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showFooter: true,
  typewriterEffect: true,
  typewriterSpeed: 30,
  canInterrupt: true,
  canRegenerate: false,
  autoScroll: true,
  highlightCode: true
})

const emit = defineEmits<{
  interrupt: [messageId: string]
  regenerate: [messageId: string]
  contentUpdate: [content: string]
}>()

const { t } = useI18n()

// Refs
const contentRef = ref<HTMLElement>()
const displayedContent = ref('')
const isTyping = ref(false)
const interrupting = ref(false)
const typewriterTimer = ref<number | null>(null)

// Computed
const messageClasses = computed(() => ({
  [`message-${props.message.type}`]: true,
  'has-header': props.showHeader,
  'has-footer': props.showFooter,
  'streaming': isStreaming.value
}))

const isStreaming = computed(() => {
  return props.message.type === 'data' && isTyping.value
})

const displayContent = computed(() => {
  if (typeof props.message.data === 'string') {
    return props.message.data
  } else if (props.message.data?.content) {
    return props.message.data.content
  } else if (props.message.data?.message) {
    return props.message.data.message
  }
  return JSON.stringify(props.message.data)
})

const renderedContent = computed(() => {
  if (!displayedContent.value) return ''

  try {
    // Parse markdown and sanitize HTML
    const html = marked.parse(displayedContent.value)
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
      ALLOWED_ATTR: ['class']
    })
  } catch (error) {
    console.error('Error rendering content:', error)
    return displayedContent.value
  }
})

const formattedTime = computed(() => {
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(props.message.timestamp)
})

// Methods
const startTypewriter = (content: string) => {
  if (!props.typewriterEffect) {
    displayedContent.value = content
    return
  }

  isTyping.value = true
  displayedContent.value = ''
  let currentIndex = 0

  const typeNextChar = () => {
    if (currentIndex < content.length) {
      displayedContent.value += content[currentIndex]
      currentIndex++

      emit('contentUpdate', displayedContent.value)

      typewriterTimer.value = setTimeout(typeNextChar, props.typewriterSpeed)
    } else {
      isTyping.value = false
      typewriterTimer.value = null
    }
  }

  typeNextChar()
}

const stopTypewriter = () => {
  if (typewriterTimer.value) {
    clearTimeout(typewriterTimer.value)
    typewriterTimer.value = null
  }
  isTyping.value = false
  displayedContent.value = displayContent.value
}

const handleInterrupt = async () => {
  if (interrupting.value) return

  interrupting.value = true
  try {
    emit('interrupt', props.message.id)
    stopTypewriter()
    ElMessage.success(t('streaming.interrupted'))
  } catch (error) {
    console.error('Failed to interrupt streaming:', error)
    ElMessage.error(t('streaming.interruptFailed'))
  } finally {
    interrupting.value = false
  }
}

const regenerateMessage = () => {
  emit('regenerate', props.message.id)
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(displayedContent.value)
    ElMessage.success(t('common.copied'))
  } catch (error) {
    console.error('Failed to copy:', error)
    ElMessage.error(t('common.copyFailed'))
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const scrollToBottom = () => {
  if (props.autoScroll && contentRef.value) {
    nextTick(() => {
      contentRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
  }
}

// Watchers
watch(() => props.message.data, (newData, oldData) => {
  if (newData !== oldData) {
    const content = displayContent.value
    if (props.typewriterEffect && props.message.type === 'data') {
      startTypewriter(content)
    } else {
      displayedContent.value = content
    }
  }
}, { immediate: true })

watch(displayedContent, () => {
  scrollToBottom()
})

// Lifecycle
onMounted(() => {
  if (props.message.type === 'data' && props.typewriterEffect) {
    startTypewriter(displayContent.value)
  } else {
    displayedContent.value = displayContent.value
  }
})

onUnmounted(() => {
  if (typewriterTimer.value) {
    clearTimeout(typewriterTimer.value)
  }
})

// Expose methods for parent component
defineExpose({
  startTypewriter,
  stopTypewriter,
  copyToClipboard
})
</script>

<style scoped lang="scss">
.streaming-message {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden;
  transition: all 0.3s ease;

  &:hover {
    @apply shadow-md;
  }

  &.streaming {
    @apply ring-2 ring-blue-500 ring-opacity-20;
  }

  &.message-error {
    @apply border-red-300 dark:border-red-600;
  }

  &.message-complete {
    @apply border-green-300 dark:border-green-600;
  }
}

.message-header {
  @apply flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600;

  .message-meta {
    @apply flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400;

    .message-type {
      @apply px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium uppercase;
    }
  }

  .message-actions {
    @apply flex items-center space-x-2;
  }
}

.message-content {
  @apply p-4;

  .text-content {
    @apply relative;

    .typewriter-text {
      @apply prose dark:prose-invert max-w-none;
      line-height: 1.6;

      &.typing {
        @apply relative;
      }

      :deep(pre) {
        @apply bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-x-auto;
      }

      :deep(code) {
        @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm;
      }

      :deep(blockquote) {
        @apply border-l-4 border-blue-500 pl-4 italic;
      }
    }

    .typing-indicator {
      @apply inline-block ml-1;

      .cursor {
        @apply inline-block w-2 h-5 bg-blue-500;
        animation: blink 1s infinite;
      }
    }
  }

  .error-content,
  .complete-content {
    :deep(.el-alert__description) {
      @apply font-mono text-sm;
    }
  }
}

.message-footer {
  @apply flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600;

  .message-stats {
    @apply flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400;

    .stat {
      @apply flex items-center space-x-1;

      i {
        @apply text-xs;
      }
    }
  }

  .message-controls {
    @apply flex items-center space-x-1;
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

// Dark mode adjustments
.dark {
  .streaming-message {
    &.message-error {
      .error-content :deep(.el-alert) {
        @apply bg-red-900 border-red-700;
      }
    }

    &.message-complete {
      .complete-content :deep(.el-alert) {
        @apply bg-green-900 border-green-700;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .message-header {
    @apply flex-col items-start space-y-2;

    .message-meta {
      @apply order-2;
    }

    .message-actions {
      @apply order-1 self-end;
    }
  }

  .message-footer {
    @apply flex-col items-start space-y-2;

    .message-stats {
      @apply order-2;
    }

    .message-controls {
      @apply order-1 self-end;
    }
  }
}
</style>