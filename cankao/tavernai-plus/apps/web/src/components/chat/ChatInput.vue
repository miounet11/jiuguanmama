<template>
  <div class="chat-input" :class="inputClasses">
    <!-- 输入区域 -->
    <div class="input-container">
      <!-- 快捷操作按钮 -->
      <div class="input-actions" role="toolbar" aria-label="输入操作">
        <TavernButton
          size="sm"
          variant="ghost"
          @click="toggleEmojiPicker"
          :title="showEmojiPicker ? '关闭表情选择器' : '打开表情选择器'"
          :aria-expanded="showEmojiPicker"
          aria-controls="emoji-picker"
          class="action-btn"
        >
          😊
        </TavernButton>

        <TavernButton
          size="sm"
          variant="ghost"
          @click="handleFileUpload"
          title="上传文件"
          :disabled="isLoading"
          class="action-btn"
        >
          <TavernIcon name="arrow-up-tray" size="sm" />
        </TavernButton>

        <TavernButton
          size="sm"
          @click="toggleVoiceInput"
          :variant="isVoiceRecording ? 'danger' : 'ghost'"
          :title="isVoiceRecording ? '停止录音' : '语音输入'"
          :disabled="isLoading"
          class="action-btn"
        >
          <TavernIcon :name="isVoiceRecording ? 'stop' : 'microphone'" size="sm" />
        </TavernButton>

        <!-- 插槽用于额外功能 -->
        <slot name="extra-actions" />
      </div>

      <!-- 输入框区域 -->
      <div class="input-wrapper">
        <label for="message-input" class="sr-only">输入消息</label>
        <textarea
          id="message-input"
          ref="inputRef"
          v-model="inputMessage"
          @keydown="handleKeyDown"
          @input="handleInput"
          @paste="handlePaste"
          @focus="handleFocus"
          @blur="handleBlur"
          :placeholder="placeholder"
          class="message-input"
          :rows="inputRows"
          :disabled="isLoading"
          :aria-describedby="ariaDescribedBy"
          :maxlength="maxLength"
          autocomplete="off"
          spellcheck="true"
        />

        <!-- 字数统计 -->
        <div class="input-stats" :aria-live="characterCountExceeded ? 'polite' : 'off'">
          <span :class="{ 'text-destructive': characterCountExceeded }">
            {{ inputMessage.length }}/{{ maxLength }}
          </span>
        </div>

        <!-- 输入建议 -->
        <div v-if="showSuggestions && suggestions.length > 0" class="input-suggestions">
          <div class="suggestions-header">
            <span>建议</span>
            <TavernButton
              size="sm"
              variant="ghost"
              @click="hideSuggestions"
              title="关闭建议"
            >
              <TavernIcon name="x-mark" size="xs" />
            </TavernButton>
          </div>
          <div class="suggestions-list" role="listbox" aria-label="输入建议">
            <button
              v-for="(suggestion, index) in suggestions"
              :key="index"
              @click="applySuggestion(suggestion)"
              class="suggestion-item"
              role="option"
              :aria-selected="false"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>

      <!-- 发送按钮 -->
      <div class="send-actions">
        <TavernButton
          v-if="isLoading"
          @click="stopGeneration"
          variant="danger"
          size="lg"
          title="停止生成"
          aria-label="停止消息生成"
          class="send-btn"
        >
          <TavernIcon name="x-mark" size="md" />
        </TavernButton>
        <TavernButton
          v-else
          @click="sendMessage"
          variant="primary"
          size="lg"
          :disabled="!canSend"
          :title="canSend ? '发送消息 (Enter)' : sendDisabledReason"
          :aria-label="canSend ? '发送消息' : sendDisabledReason"
          class="send-btn"
        >
          <TavernIcon name="paper-airplane" size="md" />
        </TavernButton>
      </div>
    </div>

    <!-- 表情选择器 -->
    <div
      v-if="showEmojiPicker"
      id="emoji-picker"
      class="emoji-picker"
      role="dialog"
      aria-label="表情选择器"
      :aria-expanded="showEmojiPicker"
    >
      <div class="emoji-header">
        <span>选择表情</span>
        <TavernButton
          size="sm"
          variant="ghost"
          @click="toggleEmojiPicker"
          title="关闭表情选择器"
        >
          <TavernIcon name="x-mark" size="sm" />
        </TavernButton>
      </div>
      <div class="emoji-grid" role="grid" aria-label="表情网格">
        <button
          v-for="emoji in commonEmojis"
          :key="emoji"
          @click="addEmoji(emoji)"
          class="emoji-btn"
          :aria-label="`插入表情 ${emoji}`"
          role="gridcell"
        >
          {{ emoji }}
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="input-error" role="alert" aria-live="polite">
      <TavernIcon name="warning" size="sm" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 语音输入对话框 -->
    <Teleport to="body">
      <div
        v-if="showVoiceDialog"
        class="modal-overlay"
        @click="closeVoiceDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-dialog-title"
      >
        <div class="voice-dialog" @click.stop>
          <div class="modal-header">
            <h3 id="voice-dialog-title">语音输入</h3>
            <TavernButton variant="ghost" size="sm" @click="closeVoiceDialog">
              <TavernIcon name="x-mark" />
            </TavernButton>
          </div>
          <div class="modal-content">
            <VoiceInput
              :auto-transcribe="true"
              :show-advanced="false"
              compact
              @text-ready="handleVoiceTextReady"
              @recording-start="handleVoiceRecordingStart"
              @recording-stop="handleVoiceRecordingStop"
              @error="handleVoiceError"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch, type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import VoiceInput from '@/components/voice/VoiceInput.vue'

// 类型定义
export interface ChatInputOptions {
  enableEmoji?: boolean
  enableVoice?: boolean
  enableFileUpload?: boolean
  enableSuggestions?: boolean
  maxLength?: number
  placeholder?: string
}

// Props 定义
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  options: {
    type: Object as PropType<ChatInputOptions>,
    default: () => ({})
  },
  suggestions: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  compact: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send-message': [content: string]
  'stop-generation': []
  'file-upload': [files: FileList]
  'voice-text': [text: string]
  'input-focus': []
  'input-blur': []
}>()

// 响应式数据
const inputRef = ref<HTMLTextAreaElement | null>(null)
const inputMessage = ref(props.modelValue)
const showEmojiPicker = ref(false)
const showVoiceDialog = ref(false)
const isVoiceRecording = ref(false)
const showSuggestions = ref(false)
const isFocused = ref(false)
const errorMessage = ref('')

// 配置选项
const defaultOptions: Required<ChatInputOptions> = {
  enableEmoji: true,
  enableVoice: true,
  enableFileUpload: true,
  enableSuggestions: true,
  maxLength: 2000,
  placeholder: '输入消息...'
}

const options = computed(() => ({ ...defaultOptions, ...props.options }))

// 常用表情
const commonEmojis = [
  '😊', '😄', '🤔', '👍', '❤️', '😂', '🥺', '😮',
  '🎉', '🤗', '😘', '😎', '🔥', '✨', '🚀', '💡'
]

// 计算属性
const inputClasses = computed(() => [
  'chat-input',
  {
    'chat-input--compact': props.compact,
    'chat-input--loading': props.isLoading,
    'chat-input--focused': isFocused.value,
    'chat-input--disabled': props.disabled
  }
])

const inputRows = computed(() => {
  const lines = inputMessage.value.split('\n').length
  return Math.min(Math.max(lines, 1), props.compact ? 3 : 5)
})

const characterCountExceeded = computed(() => {
  return inputMessage.value.length > options.value.maxLength
})

const canSend = computed(() => {
  return inputMessage.value.trim() &&
         !props.isLoading &&
         !characterCountExceeded.value &&
         !props.disabled
})

const sendDisabledReason = computed(() => {
  if (!inputMessage.value.trim()) return '请输入消息内容'
  if (props.isLoading) return '正在生成回复...'
  if (characterCountExceeded.value) return '消息长度超出限制'
  if (props.disabled) return '输入已禁用'
  return '发送消息'
})

const placeholder = computed(() => {
  if (props.disabled) return '输入已禁用'
  if (props.isLoading) return '正在生成回复...'
  return options.value.placeholder
})

const maxLength = computed(() => options.value.maxLength)

const ariaDescribedBy = computed(() => {
  const ids = []
  if (characterCountExceeded.value) ids.push('character-count-error')
  if (errorMessage.value) ids.push('input-error')
  return ids.join(' ') || undefined
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputMessage.value) {
    inputMessage.value = newValue
  }
})

// 监听 inputMessage 变化
watch(inputMessage, (newValue) => {
  emit('update:modelValue', newValue)

  // 自动显示建议
  if (options.value.enableSuggestions && props.suggestions.length > 0 && newValue.length > 0) {
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
}, { immediate: true })

// 方法
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
  } else if (event.key === 'Escape') {
    // ESC 关闭表情选择器和建议
    showEmojiPicker.value = false
    showSuggestions.value = false
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  inputMessage.value = target.value

  // 清除错误消息
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  // 处理粘贴的文件
  const items = event.clipboardData?.items
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          handleFileUpload(dataTransfer.files)
        }
        break
      }
    }
  }
}

const handleFocus = () => {
  isFocused.value = true
  emit('input-focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('input-blur')
}

const sendMessage = () => {
  if (!canSend.value) return

  const content = inputMessage.value.trim()
  if (content) {
    emit('send-message', content)
    inputMessage.value = ''
    showEmojiPicker.value = false
    showSuggestions.value = false
  }
}

const stopGeneration = () => {
  emit('stop-generation')
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
  if (showEmojiPicker.value) {
    showSuggestions.value = false
  }
}

const addEmoji = (emoji: string) => {
  const textarea = inputRef.value
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = inputMessage.value.substring(0, start) + emoji + inputMessage.value.substring(end)
    inputMessage.value = newValue

    // 恢复光标位置
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  } else {
    inputMessage.value += emoji
  }

  showEmojiPicker.value = false
}

const handleFileUpload = (files?: FileList) => {
  if (!options.value.enableFileUpload) return

  if (files) {
    emit('file-upload', files)
  } else {
    // 创建文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*,audio/*,video/*,.pdf,.doc,.docx,.txt'
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files) {
        emit('file-upload', target.files)
      }
    }
    input.click()
  }
}

const toggleVoiceInput = () => {
  if (!options.value.enableVoice) return

  if (isVoiceRecording.value) {
    // 停止录音
    isVoiceRecording.value = false
    showVoiceDialog.value = false
  } else {
    // 开始语音输入
    showVoiceDialog.value = true
  }
}

const closeVoiceDialog = () => {
  showVoiceDialog.value = false
  isVoiceRecording.value = false
}

const handleVoiceTextReady = (text: string) => {
  inputMessage.value = text
  showVoiceDialog.value = false
  isVoiceRecording.value = false
  emit('voice-text', text)

  // 聚焦到输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleVoiceRecordingStart = () => {
  isVoiceRecording.value = true
}

const handleVoiceRecordingStop = () => {
  isVoiceRecording.value = false
}

const handleVoiceError = (error: string) => {
  errorMessage.value = `语音输入错误: ${error}`
  isVoiceRecording.value = false
  showVoiceDialog.value = false
}

const applySuggestion = (suggestion: string) => {
  inputMessage.value = suggestion
  showSuggestions.value = false

  nextTick(() => {
    inputRef.value?.focus()
  })
}

const hideSuggestions = () => {
  showSuggestions.value = false
}

// 焦点管理
const focusInput = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 暴露方法给父组件
defineExpose({
  focus: focusInput,
  clear: () => { inputMessage.value = '' }
})

// 生命周期
onMounted(() => {
  // 键盘快捷键
  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + / 聚焦输入框
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault()
      focusInput()
    }
  }

  document.addEventListener('keydown', handleGlobalKeyDown)

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleGlobalKeyDown)
  })
})
</script>

<style lang="scss" scoped>
.chat-input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  position: relative;
  transition: all 0.2s ease;

  &--focused {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-subtle);
  }

  &--loading {
    opacity: 0.8;
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &--compact {
    padding: var(--space-3);

    .message-input {
      min-height: 36px;
    }
  }
}

.input-container {
  display: flex;
  gap: var(--space-3);
  align-items: flex-end;
}

.input-actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;

  .action-btn {
    min-width: auto;
    padding: var(--space-2);

    &:hover {
      background: var(--color-muted);
    }
  }
}

.input-wrapper {
  flex: 1;
  position: relative;
  min-width: 0;
}

.message-input {
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: inherit;
  font-size: var(--text-base);
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: var(--color-muted-foreground);
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-subtle);
  }

  &:disabled {
    background: var(--color-muted);
    cursor: not-allowed;
  }
}

.input-stats {
  position: absolute;
  bottom: var(--space-1);
  right: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-muted-foreground);
  background: var(--color-background);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
}

.send-actions {
  flex-shrink: 0;

  .send-btn {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-2);
  z-index: 10;
}

.emoji-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: var(--space-1);
  padding: var(--space-3);
  max-height: 200px;
  overflow-y: auto;
}

.emoji-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--color-muted);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }
}

.input-suggestions {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-2);
  z-index: 10;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.suggestions-list {
  max-height: 150px;
  overflow-y: auto;
  padding: var(--space-2);
}

.suggestion-item {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  text-align: left;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: var(--text-sm);
  color: var(--color-foreground);

  &:hover {
    background: var(--color-muted);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }
}

.input-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-2);
  background: var(--color-destructive-subtle);
  border: 1px solid var(--color-destructive);
  border-radius: var(--radius-md);
  color: var(--color-destructive-foreground);
  font-size: var(--text-sm);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.voice-dialog {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
  }
}

.modal-content {
  padding: var(--space-4);
}

// 响应式设计
@media (max-width: 768px) {
  .chat-input {
    padding: var(--space-3);
  }

  .input-container {
    gap: var(--space-2);
  }

  .emoji-picker,
  .input-suggestions {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
}

// 无障碍支持
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .chat-input,
  .message-input,
  .emoji-btn,
  .suggestion-item {
    transition: none;
  }
}
</style>
