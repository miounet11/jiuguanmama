<template>
  <div class="modern-chat-input" :class="inputClasses">
    <!-- 主输入区域 -->
    <div class="input-area">
      <!-- 左侧工具栏 -->
      <div class="toolbar toolbar-left">
        <div class="tool-group">
          <button
            @click="toggleAttachMenu"
            :disabled="isLoading"
            class="tool-btn"
            :class="{ 'is-active': showAttachMenu }"
            data-tooltip="附件"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          <button
            @click="toggleEmojiPicker"
            class="tool-btn"
            :class="{ 'is-active': showEmojiPicker }"
            data-tooltip="表情"
          >
            <span class="emoji-indicator">😊</span>
          </button>

          <button
            @click="toggleVoiceInput"
            :disabled="isLoading"
            class="tool-btn"
            :class="{ 'is-recording': isVoiceRecording }"
            data-tooltip="语音输入"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span v-if="isVoiceRecording" class="recording-indicator"></span>
          </button>
        </div>

        <!-- 附件菜单 -->
        <Transition name="slide-up">
          <div v-if="showAttachMenu" class="attach-menu">
            <div class="attach-options">
              <button @click="selectFile('image')" class="attach-option">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>图片</span>
              </button>
              <button @click="selectFile('document')" class="attach-option">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>文档</span>
              </button>
              <button @click="selectFile('audio')" class="attach-option">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                <span>音频</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 中央输入区域 -->
      <div class="input-main">
        <div class="input-container">
          <textarea
            ref="inputRef"
            v-model="inputMessage"
            @keydown="handleKeyDown"
            @input="handleInput"
            @paste="handlePaste"
            @focus="handleFocus"
            @blur="handleBlur"
            :placeholder="computedPlaceholder"
            :disabled="isLoading || disabled"
            :maxlength="maxLength"
            class="message-input"
            :style="{ height: inputHeight }"
            rows="1"
          />

          <!-- 输入状态指示器 -->
          <div class="input-status">
            <Transition name="fade">
              <div v-if="isComposing" class="status-indicator composing">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                </svg>
                <span>输入法</span>
              </div>
            </Transition>

            <Transition name="fade">
              <div v-if="showCharCount && (isNearLimit || isOverLimit)" class="char-count" :class="charCountClass">
                {{ inputMessage.length }}/{{ maxLength }}
              </div>
            </Transition>
          </div>
        </div>

        <!-- 智能建议 -->
        <Transition name="slide-down">
          <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-bar">
            <div class="suggestions-content">
              <div class="suggestions-header">
                <svg class="icon sparkles" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>智能建议</span>
                <button @click="hideSuggestions" class="close-btn">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div class="suggestions-list">
                <button
                  v-for="(suggestion, index) in displaySuggestions"
                  :key="index"
                  @click="applySuggestion(suggestion)"
                  class="suggestion-item"
                >
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                  <span>{{ suggestion }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 右侧发送区域 -->
      <div class="toolbar toolbar-right">
        <div class="send-container">
          <!-- 停止生成按钮 -->
          <button
            v-if="isLoading"
            @click="stopGeneration"
            class="send-btn stop-btn"
            data-tooltip="停止生成"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            <span class="btn-text">停止</span>
          </button>

          <!-- 发送按钮 -->
          <button
            v-else
            @click="sendMessage"
            :disabled="!canSend"
            class="send-btn"
            :class="{ 'is-ready': canSend }"
            data-tooltip="发送消息 (Enter)"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span class="btn-text">发送</span>
          </button>
        </div>

        <!-- 高级选项 -->
        <button
          @click="toggleAdvancedPanel"
          class="tool-btn advanced-btn"
          :class="{ 'is-active': showAdvancedPanel }"
          data-tooltip="高级选项"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.96l4.24 4.24M18.46 14.04l4.24 4.24M1.54 14.04l4.24-4.24"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 表情选择器 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click="closeEmojiPicker">
          <div class="emoji-picker-panel" @click.stop>
            <div class="emoji-picker-header">
              <h3>选择表情</h3>
              <button @click="closeEmojiPicker" class="close-btn">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="emoji-categories">
              <button
                v-for="category in emojiCategories"
                :key="category.name"
                @click="activeEmojiCategory = category.name"
                :class="{ 'active': activeEmojiCategory === category.name }"
                class="category-btn"
              >
                {{ category.icon }}
              </button>
            </div>
            <div class="emoji-grid">
              <button
                v-for="emoji in currentEmojis"
                :key="emoji"
                @click="insertEmoji(emoji)"
                class="emoji-item"
              >
                {{ emoji }}
              </button>
            </div>
            <div class="emoji-search">
              <input
                v-model="emojiSearch"
                type="text"
                placeholder="搜索表情..."
                class="search-input"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 高级设置面板 -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="showAdvancedPanel" class="advanced-panel-overlay" @click="closeAdvancedPanel">
          <div class="advanced-panel" @click.stop>
            <div class="advanced-header">
              <h3>高级选项</h3>
              <button @click="closeAdvancedPanel" class="close-btn">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="advanced-content">
              <div class="setting-group">
                <label class="setting-label">
                  <span>创造性</span>
                  <span class="setting-value">{{ temperature }}</span>
                </label>
                <input
                  v-model="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="setting-slider"
                />
              </div>
              <div class="setting-group">
                <label class="setting-label">
                  <span>最大长度</span>
                  <span class="setting-value">{{ maxTokens }}</span>
                </label>
                <input
                  v-model="maxTokens"
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  class="setting-slider"
                />
              </div>
              <div class="setting-group">
                <label class="checkbox-label">
                  <input
                    v-model="enableStream"
                    type="checkbox"
                    class="setting-checkbox"
                  />
                  <span>启用流式响应</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 隐藏的文件选择器 -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="fileAccept"
      :multiple="false"
      @change="handleFileSelect"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted, type PropType } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  suggestions: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  maxLength: {
    type: Number,
    default: 2000
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '输入消息...'
  },
  showCharCount: {
    type: Boolean,
    default: true
  },
  enableSuggestions: {
    type: Boolean,
    default: true
  },
  enableVoice: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': [content: string]
  'stop': []
  'voice-text': [text: string]
  'file-upload': [files: FileList]
  'emoji-select': [emoji: string]
  'focus': []
  'blur': []
  'settings-change': [settings: Record<string, any>]
}>()

// 响应式数据
const inputRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const inputMessage = ref(props.modelValue)
const inputHeight = ref('auto')
const isFocused = ref(false)
const isComposing = ref(false)

// UI 状态
const showAttachMenu = ref(false)
const showEmojiPicker = ref(false)
const showAdvancedPanel = ref(false)
const showSuggestions = ref(false)
const isVoiceRecording = ref(false)

// 表情选择器
const activeEmojiCategory = ref('smileys')
const emojiSearch = ref('')

// 高级设置
const temperature = ref(0.7)
const maxTokens = ref(1000)
const enableStream = ref(true)

// 表情分类
const emojiCategories = [
  { name: 'smileys', icon: '😊', emojis: ['😊', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉'] },
  { name: 'people', icon: '👋', emojis: ['👋', '🤝', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙'] },
  { name: 'animals', icon: '🐶', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'] },
  { name: 'food', icon: '🍎', emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒'] }
]

// 计算属性
const inputClasses = computed(() => [
  'modern-chat-input',
  {
    'is-focused': isFocused.value,
    'is-loading': props.isLoading,
    'is-disabled': props.disabled,
    'has-suggestions': showSuggestions.value,
    'is-recording': isVoiceRecording.value
  }
])

const computedPlaceholder = computed(() => {
  if (props.disabled) return '输入已禁用'
  if (props.isLoading) return '正在生成回复...'
  if (isVoiceRecording.value) return '正在录音...'
  return props.placeholder
})

const canSend = computed(() => {
  return inputMessage.value.trim() &&
         !props.isLoading &&
         !props.disabled &&
         inputMessage.value.length <= props.maxLength
})

const isNearLimit = computed(() => {
  const threshold = props.maxLength * 0.9
  return inputMessage.value.length >= threshold && inputMessage.value.length <= props.maxLength
})

const isOverLimit = computed(() => {
  return inputMessage.value.length > props.maxLength
})

const charCountClass = computed(() => {
  if (isOverLimit.value) return 'error'
  if (isNearLimit.value) return 'warning'
  return ''
})

const displaySuggestions = computed(() => {
  return props.suggestions.slice(0, 3)
})

const currentEmojis = computed(() => {
  const category = emojiCategories.find(c => c.name === activeEmojiCategory.value)
  if (!category) return []

  if (emojiSearch.value) {
    return category.emojis.filter(emoji =>
      emoji.includes(emojiSearch.value)
    )
  }

  return category.emojis
})

const fileAccept = computed(() => {
  return 'image/*,audio/*,video/*,.pdf,.doc,.docx,.txt'
})

// 监听器
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputMessage.value) {
    inputMessage.value = newValue
    adjustInputHeight()
  }
})

watch(inputMessage, (newValue) => {
  emit('update:modelValue', newValue)
  adjustInputHeight()
  handleInputChange()
})

watch(() => props.suggestions, (newSuggestions) => {
  if (props.enableSuggestions && newSuggestions.length > 0 && inputMessage.value.length > 0) {
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
})

// 方法
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      return
    } else {
      event.preventDefault()
      sendMessage()
    }
  } else if (event.key === 'Escape') {
    showAttachMenu.value = false
    showEmojiPicker.value = false
    showSuggestions.value = false
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  inputMessage.value = target.value
}

const handleInputChange = () => {
  // 输入变化处理逻辑
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          emit('file-upload', dataTransfer.files)
        }
        break
      }
    }
  }
  setTimeout(adjustInputHeight, 0)
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

const adjustInputHeight = () => {
  if (!inputRef.value) return

  inputRef.value.style.height = 'auto'
  const scrollHeight = inputRef.value.scrollHeight
  const maxHeight = 120
  const newHeight = Math.min(scrollHeight, maxHeight)
  inputHeight.value = `${newHeight}px`
}

const sendMessage = () => {
  if (!canSend.value) return

  const content = inputMessage.value.trim()
  if (content) {
    emit('send', content)
    inputMessage.value = ''
    showSuggestions.value = false

    nextTick(() => {
      adjustInputHeight()
    })
  }
}

const stopGeneration = () => {
  emit('stop')
}

// 附件相关
const toggleAttachMenu = () => {
  showAttachMenu.value = !showAttachMenu.value
  closeOtherPanels()
}

const selectFile = (type: string) => {
  const acceptMap = {
    image: 'image/*',
    document: '.pdf,.doc,.docx,.txt',
    audio: 'audio/*'
  }

  fileInputRef.value?.setAttribute('accept', acceptMap[type] || '*')
  fileInputRef.value?.click()
  showAttachMenu.value = false
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    emit('file-upload', target.files)
  }
}

// 表情相关
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
  closeOtherPanels()
}

const closeEmojiPicker = () => {
  showEmojiPicker.value = false
}

const insertEmoji = (emoji: string) => {
  const textarea = inputRef.value
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = inputMessage.value.substring(0, start) + emoji + inputMessage.value.substring(end)
    inputMessage.value = newValue

    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  } else {
    inputMessage.value += emoji
  }

  emit('emoji-select', emoji)
  closeEmojiPicker()
}

// 语音相关
const toggleVoiceInput = () => {
  if (!props.enableVoice) return
  isVoiceRecording.value = !isVoiceRecording.value
}

// 高级设置
const toggleAdvancedPanel = () => {
  showAdvancedPanel.value = !showAdvancedPanel.value
  closeOtherPanels()
}

const closeAdvancedPanel = () => {
  showAdvancedPanel.value = false
  emit('settings-change', {
    temperature: temperature.value,
    maxTokens: maxTokens.value,
    enableStream: enableStream.value
  })
}

// 建议相关
const hideSuggestions = () => {
  showSuggestions.value = false
}

const applySuggestion = (suggestion: string) => {
  inputMessage.value = suggestion
  showSuggestions.value = false

  nextTick(() => {
    inputRef.value?.focus()
    adjustInputHeight()
  })
}

// 工具方法
const closeOtherPanels = () => {
  showAttachMenu.value = false
  showEmojiPicker.value = false
  showAdvancedPanel.value = false
}

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: () => {
    inputMessage.value = ''
    adjustInputHeight()
  }
})

// 生命周期
onMounted(() => {
  // 全局快捷键
  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault()
      inputRef.value?.focus()
    }
  }

  document.addEventListener('keydown', handleGlobalKeyDown)
  onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeyDown)
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.modern-chat-input {
  background: linear-gradient(135deg, rgba($dark-bg-secondary, 0.95) 0%, rgba($dark-bg-tertiary, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba($primary-500, 0.15);
  border-radius: 20px;
  padding: 16px 20px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba($primary-500, 0.05);

  &.is-focused {
    border-color: rgba($primary-500, 0.4);
    box-shadow: 0 0 0 3px rgba($primary-500, 0.1), 0 12px 48px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }

  &.is-loading {
    border-color: rgba($warning-color, 0.4);
    animation: loadingPulse 2s ease-in-out infinite;
  }

  &.is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &.is-recording {
    border-color: rgba($error-color, 0.6);
    animation: recordingPulse 1.5s ease-in-out infinite;
  }
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;

  &.toolbar-left {
    align-items: flex-start;
  }

  &.toolbar-right {
    align-items: flex-end;
  }
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: rgba($gray-800, 0.4);
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: rgba($gray-700, 0.6);
    color: $text-primary;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &.is-active {
    background: rgba($primary-500, 0.2);
    color: $primary-300;
    border: 1px solid rgba($primary-500, 0.3);
  }

  &.is-recording {
    background: rgba($error-color, 0.2);
    color: $error-color;
    animation: recordPulse 1s ease-in-out infinite;
  }

  .icon {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }

  .emoji-indicator {
    font-size: 20px;
  }

  .recording-indicator {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 12px;
    height: 12px;
    background: $error-color;
    border-radius: 50%;
    animation: recordDot 1s ease-in-out infinite;
  }
}

.attach-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 140px;

  .attach-options {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .attach-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba($gray-700, 0.3);
      border: 1px solid rgba($gray-600, 0.2);
      border-radius: 12px;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      white-space: nowrap;

      &:hover {
        background: rgba($gray-700, 0.5);
        color: $text-primary;
        transform: translateX(4px);
      }

      .icon {
        width: 18px;
        height: 18px;
        color: $primary-400;
      }
    }
  }
}

.input-main {
  flex: 1;
  min-width: 0;
}

.input-container {
  position: relative;
  background: rgba($gray-900, 0.6);
  border: 2px solid rgba($gray-600, 0.2);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: rgba($primary-500, 0.3);
    background: rgba($gray-900, 0.8);
    box-shadow: inset 0 0 0 1px rgba($primary-500, 0.1);
  }
}

.message-input {
  width: 100%;
  min-height: 48px;
  max-height: 120px;
  padding: 16px 20px 16px 20px;
  background: transparent;
  border: none;
  outline: none;
  color: $text-primary;
  font-size: 16px;
  line-height: 1.5;
  font-family: $font-family-base;
  resize: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: $text-muted;
    font-style: normal;
    opacity: 0.7;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  @supports (-webkit-touch-callout: none) {
    font-size: 16px;
  }
}

.input-status {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: $primary-400;
    background: rgba($primary-500, 0.1);
    padding: 2px 6px;
    border-radius: 8px;

    .icon {
      width: 12px;
      height: 12px;
    }
  }

  .char-count {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    padding: 2px 6px;
    border-radius: 8px;
    background: rgba($gray-800, 0.8);
    color: $text-muted;

    &.warning {
      color: $warning-color;
      background: rgba($warning-color, 0.1);
    }

    &.error {
      color: $error-color;
      background: rgba($error-color, 0.1);
    }
  }
}

.suggestions-bar {
  margin-top: 12px;
  background: rgba($primary-500, 0.05);
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(10px);

  .suggestions-content {
    .suggestions-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 12px;
      color: $primary-300;
      font-weight: 500;

      .icon.sparkles {
        width: 14px;
        height: 14px;
        color: $primary-400;
      }

      .close-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: $text-muted;
        cursor: pointer;
        padding: 2px;

        &:hover {
          color: $text-primary;
        }

        .icon {
          width: 12px;
          height: 12px;
        }
      }
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .suggestion-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba($gray-700, 0.3);
        border: 1px solid rgba($gray-600, 0.2);
        border-radius: 12px;
        color: $text-secondary;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 13px;
        text-align: left;

        &:hover {
          background: rgba($primary-500, 0.1);
          border-color: rgba($primary-500, 0.3);
          color: $primary-300;
          transform: translateX(4px);
        }

        .icon {
          width: 14px;
          height: 14px;
          color: $primary-400;
          flex-shrink: 0;
        }
      }
    }
  }
}

.send-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.send-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: rgba($gray-700, 0.4);
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
  position: relative;
  overflow: hidden;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &.is-ready {
    background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
    color: white;
    box-shadow: 0 4px 16px rgba($primary-500, 0.3);
    transform: scale(1.05);

    &:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: 0 6px 24px rgba($primary-500, 0.4);
      background: linear-gradient(135deg, $primary-400 0%, $primary-500 100%);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s ease;
    }

    &:hover::before {
      left: 100%;
    }
  }

  &.stop-btn {
    background: linear-gradient(135deg, $error-color 0%, #DC2626 100%);
    color: white;
    animation: stopPulse 1s ease-in-out infinite;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
    }
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  .btn-text {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.advanced-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba($gray-800, 0.4);
  color: $text-tertiary;

  &:hover {
    background: rgba($gray-700, 0.6);
    color: $text-secondary;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}

// 表情选择器
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.emoji-picker-panel {
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 20px;
  box-shadow: 0 20px 64px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.emoji-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .close-btn {
    background: none;
    border: none;
    color: $text-muted;
    cursor: pointer;
    padding: 4px;

    &:hover {
      color: $text-primary;
    }

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}

.emoji-categories {
  display: flex;
  padding: 12px 20px;
  gap: 8px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  .category-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($gray-700, 0.3);
    }

    &.active {
      background: rgba($primary-500, 0.2);
      color: $primary-300;
    }
  }
}

.emoji-grid {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;

  .emoji-item {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($gray-700, 0.3);
      transform: scale(1.2);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.emoji-search {
  padding: 12px 20px;
  border-top: 1px solid rgba($gray-600, 0.2);

  .search-input {
    width: 100%;
    padding: 8px 12px;
    background: rgba($gray-900, 0.6);
    border: 1px solid rgba($gray-600, 0.3);
    border-radius: 10px;
    color: $text-primary;
    font-size: 14px;

    &::placeholder {
      color: $text-muted;
    }

    &:focus {
      outline: none;
      border-color: $primary-500;
    }
  }
}

// 高级设置面板
.advanced-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}

.advanced-panel {
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  overflow: hidden;
}

.advanced-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .close-btn {
    background: none;
    border: none;
    color: $text-muted;
    cursor: pointer;
    padding: 4px;

    &:hover {
      color: $text-primary;
    }

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}

.advanced-content {
  padding: 24px;
  overflow-y: auto;
  max-height: 50vh;

  .setting-group {
    margin-bottom: 24px;

    .setting-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: $text-secondary;

      .setting-value {
        color: $primary-400;
        font-weight: 600;
      }
    }

    .setting-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba($gray-700, 0.5);
      outline: none;
      -webkit-appearance: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary-500;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba($primary-500, 0.5);
        }
      }

      &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary-500;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba($primary-500, 0.5);
        }
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: $text-secondary;
      font-size: 14px;

      .setting-checkbox {
        width: 18px;
        height: 18px;
        accent-color: $primary-500;
      }
    }
  }
}

// Tooltip 样式
.tool-btn[data-tooltip],
.send-btn[data-tooltip] {
  &::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba($gray-800, 0.9);
    color: $text-primary;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    margin-bottom: 6px;
    z-index: 1000;
  }

  &:hover::before {
    opacity: 1;
  }
}

// 动画
@keyframes loadingPulse {
  0%, 100% {
    border-color: rgba($warning-color, 0.4);
  }
  50% {
    border-color: rgba($warning-color, 0.6);
  }
}

@keyframes recordingPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba($error-color, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba($error-color, 0);
  }
}

@keyframes recordPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes recordDot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
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

// 过渡动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .modern-chat-input {
    padding: 12px 16px;
    border-radius: 16px;
  }

  .input-area {
    gap: 12px;
  }

  .tool-btn {
    width: 40px;
    height: 40px;

    .icon {
      width: 18px;
      height: 18px;
    }

    .emoji-indicator {
      font-size: 18px;
    }
  }

  .send-btn {
    width: 44px;
    height: 44px;

    .icon {
      width: 18px;
      height: 18px;
    }

    .btn-text {
      display: none;
    }
  }

  .message-input {
    min-height: 44px;
    padding: 12px 16px;
    font-size: 16px;
  }

  .emoji-picker-panel {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px;
  }

  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);

    .emoji-item {
      width: 28px;
      height: 28px;
      font-size: 16px;
    }
  }

  .advanced-panel {
    max-width: 100%;
  }
}

// 无障碍支持
@media (prefers-reduced-motion: reduce) {
  .modern-chat-input,
  .tool-btn,
  .send-btn,
  .message-input {
    transition: none;
  }

  @keyframes loadingPulse,
  @keyframes recordingPulse,
  @keyframes recordPulse,
  @keyframes recordDot,
  @keyframes stopPulse {
    display: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .modern-chat-input {
    border-width: 2px;
  }

  .input-container {
    border-width: 2px;
  }

  .tool-btn,
  .send-btn {
    border: 2px solid rgba($gray-600, 0.5);
  }
}
</style>