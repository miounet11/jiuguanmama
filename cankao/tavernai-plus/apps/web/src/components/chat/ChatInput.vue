<template>
  <div class="chat-input" :class="inputClasses">
    <!-- 输入区域 -->
    <div class="input-container">
      <!-- 快捷操作按钮 -->
      <div class="input-actions" role="toolbar" aria-label="输入操作">
        <el-button
          type="text"
          size="small"
          @click="toggleEmojiPicker"
          :title="showEmojiPicker ? '关闭表情选择器' : '打开表情选择器'"
          :aria-expanded="showEmojiPicker"
          aria-controls="emoji-picker"
          class="action-btn emoji-btn"
          :class="{ 'is-active': showEmojiPicker }"
        >
          <span class="emoji-icon">😊</span>
        </el-button>

        <el-button
          type="text"
          size="small"
          @click="handleFileUpload"
          title="上传文件"
          :disabled="isLoading"
          class="action-btn"
        >
          <el-icon><Upload /></el-icon>
        </el-button>

        <el-button
          type="text"
          size="small"
          @click="toggleVoiceInput"
          :title="isVoiceRecording ? '停止录音' : '语音输入'"
          :disabled="isLoading"
          class="action-btn"
          :class="{ 'is-danger': isVoiceRecording }"
        >
          <el-icon>
            <component :is="isVoiceRecording ? 'VideoPlay' : 'Microphone'" />
          </el-icon>
        </el-button>

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
            <el-button
              type="text"
              size="small"
              @click="hideSuggestions"
              title="关闭建议"
              class="suggestion-close-btn"
            >
              <el-icon><Close /></el-icon>
            </el-button>
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
        <el-button
          v-if="isLoading"
          @click="stopGeneration"
          type="danger"
          title="停止生成"
          aria-label="停止消息生成"
          class="send-btn stop-btn"
          circle
        >
          <el-icon><Close /></el-icon>
        </el-button>
        <el-button
          v-else
          @click="sendMessage"
          type="primary"
          :disabled="!canSend"
          :title="canSend ? '发送消息 (Enter)' : sendDisabledReason"
          :aria-label="canSend ? '发送消息' : sendDisabledReason"
          class="send-btn"
          :class="{ 'is-ready': canSend }"
          circle
        >
          <el-icon><Promotion /></el-icon>
        </el-button>
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
        <el-button
          type="text"
          size="small"
          @click="toggleEmojiPicker"
          title="关闭表情选择器"
          class="emoji-close-btn"
        >
          <el-icon><Close /></el-icon>
        </el-button>
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
      <el-icon class="error-icon"><WarningFilled /></el-icon>
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
            <el-button type="text" size="small" @click="closeVoiceDialog" class="modal-close-btn">
              <el-icon><Close /></el-icon>
            </el-button>
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
import {
  Upload,
  Microphone,
  VideoPlay,
  Close,
  Promotion,
  WarningFilled
} from '@element-plus/icons-vue'
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
@import '@/styles/variables.scss';

.chat-input {
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 16px;
  padding: 16px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);

  &--focused {
    border-color: $primary-500;
    box-shadow: 0 0 0 3px rgba($primary-500, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &--loading {
    opacity: 0.9;
    border-color: rgba($warning-color, 0.5);
  }

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  &--compact {
    padding: 12px;

    .message-input {
      min-height: 40px;
    }
  }
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: center;

  .action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: rgba($gray-700, 0.3);
      border-color: rgba($gray-600, 0.5);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &.is-active {
      background: rgba($primary-500, 0.1);
      color: $primary-400;
      border-color: rgba($primary-500, 0.3);
    }

    &.is-danger {
      color: $error-color;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .emoji-icon {
      font-size: 18px;
      line-height: 1;
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
  min-height: 48px;
  max-height: 200px;
  padding: 14px 16px;
  border: 2px solid rgba($gray-600, 0.3);
  border-radius: 12px;
  background: rgba($gray-900, 0.6);
  color: $text-primary;
  font-family: $font-family-base;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: $text-muted;
    font-style: italic;
  }

  &:focus {
    border-color: $primary-500;
    background: rgba($gray-900, 0.8);
    box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
  }

  &:disabled {
    background: rgba($gray-700, 0.3);
    cursor: not-allowed;
    color: $text-muted;
  }

  // iOS Safari 修复
  @supports (-webkit-touch-callout: none) {
    font-size: 16px; // 防止缩放
  }
}

.input-stats {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: $text-muted;
  background: rgba($gray-800, 0.9);
  padding: 3px 6px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
  backdrop-filter: blur(4px);
}

.send-actions {
  flex-shrink: 0;

  .send-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    &.is-ready {
      background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
      box-shadow: 0 4px 12px rgba($primary-500, 0.3);
      transform: scale(1.05);

      &:hover:not(:disabled) {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba($primary-500, 0.4);
      }

      &:active:not(:disabled) {
        transform: scale(0.95);
      }
    }

    &.stop-btn {
      background: linear-gradient(135deg, $error-color 0%, #DC2626 100%);
      animation: stopPulse 1s ease-in-out infinite;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      }
    }
  }
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.emoji-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba($gray-600, 0.2);
  font-weight: $font-weight-medium;
  font-size: $font-size-sm;
  color: $text-secondary;

  .emoji-close-btn {
    color: $text-muted;

    &:hover {
      color: $text-primary;
    }
  }
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($gray-700, 0.3);
    transform: scale(1.1);
  }

  &:focus {
    outline: 2px solid $primary-500;
    outline-offset: 1px;
  }

  &:active {
    transform: scale(0.95);
  }
}

.input-suggestions {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba($gray-600, 0.2);
  font-weight: $font-weight-medium;
  font-size: $font-size-sm;
  color: $text-secondary;

  .suggestion-close-btn {
    color: $text-muted;

    &:hover {
      color: $text-primary;
    }
  }
}

.suggestions-list {
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
}

.suggestion-item {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: 4px;

  &:hover {
    background: rgba($primary-500, 0.1);
    color: $primary-300;
    transform: translateX(4px);
  }

  &:focus {
    outline: 2px solid $primary-500;
    outline-offset: 1px;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.input-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: rgba($error-color, 0.1);
  border: 1px solid rgba($error-color, 0.3);
  border-radius: 8px;
  color: $error-color;
  font-size: $font-size-sm;
  backdrop-filter: blur(4px);

  .error-icon {
    flex-shrink: 0;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.voice-dialog {
  background: $dark-bg-secondary;
  border-radius: 16px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  h3 {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $text-primary;
  }

  .modal-close-btn {
    color: $text-muted;

    &:hover {
      color: $text-primary;
    }
  }
}

.modal-content {
  padding: 20px;
}

// 动画效果
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes stopPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .chat-input {
    padding: 12px;
    border-radius: 12px;
  }

  .input-container {
    gap: 8px;
  }

  .input-actions {
    .action-btn {
      width: 32px;
      height: 32px;

      .emoji-icon {
        font-size: 16px;
      }
    }
  }

  .message-input {
    min-height: 40px;
    padding: 12px 14px;
    font-size: 16px; // 防止iOS缩放
  }

  .send-actions {
    .send-btn {
      width: 40px;
      height: 40px;
    }
  }

  .emoji-picker,
  .input-suggestions {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: 16px 16px 0 0;
    max-height: 50vh;
  }

  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);

    .emoji-btn {
      width: 36px;
      height: 36px;
      font-size: 16px;
    }
  }

  .voice-dialog {
    width: 95%;
    margin: 16px;
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
  .suggestion-item,
  .action-btn,
  .send-btn {
    transition: none;
  }

  @keyframes pulse,
  @keyframes stopPulse {
    display: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .chat-input {
    border-width: 2px;
  }

  .message-input {
    border-width: 2px;
  }

  .action-btn {
    border-width: 2px;
  }
}

// 深色主题优化
@media (prefers-color-scheme: dark) {
  .chat-input {
    // 确保在系统深色模式下的一致性
  }
}
</style>
