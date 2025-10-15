<template>
  <div class="immersive-chat-input" :class="inputClasses">
    <!-- 输入区域容器 -->
    <div class="input-container">
      <!-- 左侧功能按钮 -->
      <div class="input-sidebar left-sidebar">
        <div class="sidebar-actions">
          <TavernButton
            variant="ghost"
            size="md"
            @click="toggleAttachMenu"
            :disabled="isLoading"
            title="附件"
            class="sidebar-btn"
          >
            <TavernIcon name="paperclip" />
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="md"
            @click="toggleEmojiPicker"
            title="表情"
            class="sidebar-btn"
          >
            <span class="emoji-icon">😊</span>
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="md"
            @click="toggleVoiceInput"
            :variant="isVoiceRecording ? 'danger' : 'ghost'"
            :disabled="isLoading"
            :title="isVoiceRecording ? '停止录音' : '语音输入'"
            class="sidebar-btn"
          >
            <TavernIcon :name="isVoiceRecording ? 'stop' : 'microphone'" />
          </TavernButton>
        </div>

        <!-- 附件菜单 -->
        <Transition name="slide-up">
          <div v-if="showAttachMenu" class="attach-menu">
            <div class="attach-options">
              <button @click="selectFile('image')" class="attach-option">
                <TavernIcon name="photo" />
                <span>图片</span>
              </button>
              <button @click="selectFile('document')" class="attach-option">
                <TavernIcon name="document" />
                <span>文档</span>
              </button>
              <button @click="selectFile('audio')" class="attach-option">
                <TavernIcon name="musical-note" />
                <span>音频</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 中央输入区域 -->
      <div class="input-main">
        <div class="input-wrapper">
          <!-- 输入框 -->
          <div class="input-field-wrapper">
            <textarea
              ref="inputRef"
              v-model="inputMessage"
              @keydown="handleKeyDown"
              @input="handleInput"
              @paste="handlePaste"
              @focus="handleFocus"
              @blur="handleBlur"
              @compositionstart="handleCompositionStart"
              @compositionend="handleCompositionEnd"
              :placeholder="computedPlaceholder"
              :disabled="isLoading || disabled"
              :maxlength="maxLength"
              :rows="inputRows"
              class="message-input"
              :style="{ height: inputHeight }"
            />

            <!-- 输入状态指示器 -->
            <div class="input-indicators">
              <!-- 字数统计 -->
              <div
                v-if="showCharCount"
                class="char-count"
                :class="{ 'count-warning': isNearLimit, 'count-error': isOverLimit }"
              >
                {{ inputMessage.length }}/{{ maxLength }}
              </div>

              <!-- 输入状态 -->
              <div class="input-status">
                <div v-if="isComposing" class="composing-indicator">
                  <TavernIcon name="language" size="xs" />
                  <span>输入法</span>
                </div>
                <div v-else-if="isAnalyzing" class="analyzing-indicator">
                  <TavernIcon name="cpu-chip" size="xs" />
                  <span>分析中</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 智能建议栏 -->
          <Transition name="slide-down">
            <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-bar">
              <div class="suggestions-header">
                <TavernIcon name="sparkles" size="xs" />
                <span>智能建议</span>
                <TavernButton
                  variant="ghost"
                  size="xs"
                  @click="hideSuggestions"
                  title="关闭建议"
                >
                  <TavernIcon name="x-mark" size="xs" />
                </TavernButton>
              </div>
              <div class="suggestions-list">
                <button
                  v-for="(suggestion, index) in displaySuggestions"
                  :key="index"
                  @click="applySuggestion(suggestion)"
                  class="suggestion-item"
                >
                  <TavernIcon name="lightbulb" size="xs" />
                  <span>{{ suggestion }}</span>
                </button>
              </div>
            </div>
          </Transition>

          <!-- 快捷回复栏 -->
          <Transition name="slide-down">
            <div v-if="showQuickReplies && quickReplies.length > 0" class="quick-replies-bar">
              <div class="quick-replies-list">
                <button
                  v-for="reply in quickReplies"
                  :key="reply"
                  @click="sendQuickReply(reply)"
                  class="quick-reply-item"
                >
                  {{ reply }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 右侧发送按钮 -->
      <div class="input-sidebar right-sidebar">
        <div class="send-actions">
          <!-- 停止生成按钮 -->
          <TavernButton
            v-if="isLoading"
            @click="stopGeneration"
            variant="danger"
            size="lg"
            title="停止生成"
            class="send-btn stop-btn"
          >
            <TavernIcon name="stop" />
          </TavernButton>

          <!-- 发送按钮 -->
          <TavernButton
            v-else
            @click="sendMessage"
            :variant="canSend ? 'primary' : 'ghost'"
            :disabled="!canSend"
            size="lg"
            :title="canSend ? '发送消息 (Enter)' : sendDisabledReason"
            class="send-btn"
            :class="{ 'send-ready': canSend }"
          >
            <TavernIcon name="paper-airplane" />
          </TavernButton>
        </div>

        <!-- 高级功能按钮 -->
        <div class="advanced-actions">
          <TavernButton
            variant="ghost"
            size="sm"
            @click="toggleAdvancedPanel"
            title="高级选项"
            class="advanced-btn"
          >
            <TavernIcon name="cog-6-tooth" />
          </TavernButton>
        </div>
      </div>
    </div>

    <!-- 表情选择器 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click="closeEmojiPicker">
          <div class="emoji-picker-panel" @click.stop>
            <div class="emoji-picker-header">
              <span>选择表情</span>
              <TavernButton
                variant="ghost"
                size="sm"
                @click="closeEmojiPicker"
              >
                <TavernIcon name="x-mark" />
              </TavernButton>
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
                class="emoji-search-input"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 语音输入对话框 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showVoiceDialog" class="voice-dialog-overlay" @click="closeVoiceDialog">
          <div class="voice-dialog-panel" @click.stop>
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
      </Transition>
    </Teleport>

    <!-- 高级设置面板 -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="showAdvancedPanel" class="advanced-panel-overlay" @click="closeAdvancedPanel">
          <div class="advanced-panel" @click.stop>
            <div class="advanced-header">
              <h3>高级选项</h3>
              <TavernButton
                variant="ghost"
                size="sm"
                @click="closeAdvancedPanel"
              >
                <TavernIcon name="x-mark" />
              </TavernButton>
            </div>
            <div class="advanced-content">
              <div class="setting-group">
                <label>创造性 ({{ temperature }})</label>
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
                <label>最大长度 ({{ maxTokens }})</label>
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
import { ref, reactive, computed, nextTick, watch, onMounted, onUnmounted, type PropType } from 'vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import VoiceInput from '@/components/voice/VoiceInput.vue'

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
  isTyping: {
    type: Boolean,
    default: false
  },
  suggestions: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  quickReplies: {
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
const isAnalyzing = ref(false)

// UI 状态
const showAttachMenu = ref(false)
const showEmojiPicker = ref(false)
const showVoiceDialog = ref(false)
const showAdvancedPanel = ref(false)
const showSuggestions = ref(false)
const showQuickReplies = ref(false)

// 语音状态
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
  { name: 'smileys', icon: '😊', emojis: ['😊', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇'] },
  { name: 'people', icon: '👋', emojis: ['👋', '🤝', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉'] },
  { name: 'animals', icon: '🐶', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'] },
  { name: 'food', icon: '🍎', emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭'] },
  { name: 'activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓'] },
  { name: 'objects', icon: '💡', emojis: ['💡', '🔦', '🕯️', '💥', '🔥', '💧', '🌊', '🌈', '⭐', '✨', '💫', '☄️'] }
]

// 计算属性
const inputClasses = computed(() => [
  'immersive-chat-input',
  {
    'input-focused': isFocused.value,
    'input-loading': props.isLoading,
    'input-disabled': props.disabled,
    'has-suggestions': showSuggestions.value,
    'has-quick-replies': showQuickReplies.value,
    'voice-recording': isVoiceRecording.value
  }
])

const inputRows = computed(() => {
  const lines = Math.max(1, inputMessage.value.split('\n').length)
  return Math.min(lines, 6)
})

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

const sendDisabledReason = computed(() => {
  if (!inputMessage.value.trim()) return '请输入消息内容'
  if (props.isLoading) return '正在生成回复...'
  if (props.disabled) return '输入已禁用'
  if (inputMessage.value.length > props.maxLength) return '消息长度超出限制'
  return '发送消息'
})

const isNearLimit = computed(() => {
  const threshold = props.maxLength * 0.9
  return inputMessage.value.length >= threshold && inputMessage.value.length <= props.maxLength
})

const isOverLimit = computed(() => {
  return inputMessage.value.length > props.maxLength
})

const displaySuggestions = computed(() => {
  return props.suggestions.slice(0, 4)
})

const currentEmojis = computed(() => {
  const category = emojiCategories.find(c => c.name === activeEmojiCategory.value)
  if (!category) return []

  if (emojiSearch.value) {
    return category.emojis.filter(emoji =>
      emoji.includes(emojiSearch.value) ||
      getEmojiName(emoji).includes(emojiSearch.value.toLowerCase())
    )
  }

  return category.emojis
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

watch(() => props.quickReplies, (newReplies) => {
  showQuickReplies.value = newReplies.length > 0 && !props.isLoading
})

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
    // ESC 关闭面板
    showAttachMenu.value = false
    showEmojiPicker.value = false
    showSuggestions.value = false
  } else if (event.ctrlKey || event.metaKey) {
    // Ctrl/Cmd 快捷键
    switch (event.key) {
      case 'v':
        // 处理粘贴
        setTimeout(() => {
          adjustInputHeight()
        }, 0)
        break
      case 'Enter':
        event.preventDefault()
        sendMessage()
        break
    }
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  inputMessage.value = target.value
}

const handleInputChange = () => {
  // 清除错误状态
  if (isOverLimit.value) {
    // 可以在这里显示错误提示
  }

  // 触发建议分析
  if (props.enableSuggestions && inputMessage.value.length > 0) {
    analyzeInput()
  }
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

  // 延迟调整高度以确保内容已更新
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

const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = () => {
  isComposing.value = false
  adjustInputHeight()
}

const adjustInputHeight = () => {
  if (!inputRef.value) return

  // 重置高度
  inputRef.value.style.height = 'auto'

  // 计算新高度
  const scrollHeight = inputRef.value.scrollHeight
  const maxHeight = 200 // 最大高度
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
    showQuickReplies.value = false

    // 重置输入框高度
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

    // 恢复光标位置
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

  if (isVoiceRecording.value) {
    closeVoiceDialog()
  } else {
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

  nextTick(() => {
    inputRef.value?.focus()
    adjustInputHeight()
  })
}

const handleVoiceRecordingStart = () => {
  isVoiceRecording.value = true
}

const handleVoiceRecordingStop = () => {
  isVoiceRecording.value = false
}

const handleVoiceError = (error: string) => {
  console.error('语音输入错误:', error)
  isVoiceRecording.value = false
  showVoiceDialog.value = false
}

// 高级设置
const toggleAdvancedPanel = () => {
  showAdvancedPanel.value = !showAdvancedPanel.value
  closeOtherPanels()
}

const closeAdvancedPanel = () => {
  showAdvancedPanel.value = false

  // 发送设置变更
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

const sendQuickReply = (reply: string) => {
  emit('send', reply)
  showQuickReplies.value = false
}

const analyzeInput = async () => {
  if (isAnalyzing.value) return

  isAnalyzing.value = true

  try {
    // 这里可以集成AI来分析输入内容并提供智能建议
    // 模拟分析延迟
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isAnalyzing.value = false
  }
}

// 工具方法
const closeOtherPanels = () => {
  showAttachMenu.value = false
  showEmojiPicker.value = false
  showAdvancedPanel.value = false
}

const getEmojiName = (emoji: string): string => {
  // 简单的emoji名称映射，实际应用中可以使用更完整的映射
  const emojiNames: Record<string, string> = {
    '😊': 'smile',
    '😄': 'happy',
    '😁': 'grin',
    '😆': 'laugh',
    '😅': 'sweat_smile',
    '🤣': 'rolling_on_floor_laughing',
    '😂': 'joy',
    '🙂': 'slight_smile',
    '🙃': 'upside_down_face',
    '😉': 'wink'
  }
  return emojiNames[emoji] || emoji
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

.immersive-chat-input {
  background: rgba($dark-bg-secondary, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba($primary-500, 0.2);
  border-radius: 24px;
  padding: 16px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.input-focused {
    border-color: $primary-500;
    box-shadow: 0 0 0 3px rgba($primary-500, 0.1), 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  &.input-loading {
    opacity: 0.9;
    border-color: rgba($warning-color, 0.5);
  }

  &.input-disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  &.voice-recording {
    border-color: $error-color;
    animation: recordingPulse 2s ease-in-out infinite;
  }
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;

  &.left-sidebar {
    align-items: flex-start;
  }

  &.right-sidebar {
    align-items: flex-end;
  }
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .sidebar-btn {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: rgba($gray-700, 0.2);
    border: 1px solid rgba($gray-600, 0.3);
    color: $text-secondary;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background: rgba($gray-700, 0.3);
      color: $text-primary;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .emoji-icon {
      font-size: 20px;
    }
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
  margin-bottom: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;

  .attach-options {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .attach-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba($gray-700, 0.2);
      border: 1px solid rgba($gray-600, 0.3);
      border-radius: 12px;
      color: $text-secondary;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      min-width: 120px;

      &:hover {
        background: rgba($gray-700, 0.3);
        color: $text-primary;
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

.input-main {
  flex: 1;
  min-width: 0;
}

.input-wrapper {
  position: relative;
}

.input-field-wrapper {
  position: relative;
  background: rgba($gray-900, 0.6);
  border: 2px solid rgba($gray-600, 0.3);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: $primary-500;
    background: rgba($gray-900, 0.8);
  }
}

.message-input {
  width: 100%;
  min-height: 52px;
  max-height: 200px;
  padding: 16px 20px;
  background: transparent;
  border: none;
  outline: none;
  color: $text-primary;
  font-size: 16px;
  line-height: 1.5;
  font-family: inherit;
  resize: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: $text-muted;
    font-style: italic;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  // iOS Safari 修复
  @supports (-webkit-touch-callout: none) {
    font-size: 16px; // 防止缩放
  }
}

.input-indicators {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;

  .char-count {
    font-size: 11px;
    color: $text-muted;
    font-variant-numeric: tabular-nums;
    background: rgba($gray-800, 0.8);
    padding: 2px 6px;
    border-radius: 8px;

    &.count-warning {
      color: $warning-color;
      background: rgba($warning-color, 0.1);
    }

    &.count-error {
      color: $error-color;
      background: rgba($error-color, 0.1);
    }
  }

  .input-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: $text-muted;

    .composing-indicator,
    .analyzing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba($gray-800, 0.8);
      padding: 2px 6px;
      border-radius: 8px;
    }

    .composing-indicator {
      color: $primary-400;
    }

    .analyzing-indicator {
      color: $warning-color;
    }
  }
}

.suggestions-bar,
.quick-replies-bar {
  margin-top: 12px;
  background: rgba($gray-800, 0.4);
  border: 1px solid rgba($gray-600, 0.2);
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(10px);
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: $text-secondary;
  font-weight: 500;
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
  }
}

.quick-replies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .quick-reply-item {
    padding: 6px 12px;
    background: rgba($primary-500, 0.1);
    border: 1px solid rgba($primary-500, 0.3);
    border-radius: 16px;
    color: $primary-300;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($primary-500, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($primary-500, 0.2);
    }
  }
}

.send-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .send-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.send-ready {
      background: linear-gradient(135deg, $primary-500 0%, $primary-600 100%);
      box-shadow: 0 4px 16px rgba($primary-500, 0.3);
      transform: scale(1.05);

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba($primary-500, 0.4);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    &.stop-btn {
      background: linear-gradient(135deg, $error-color 0%, $error-color-dark 100%);
      animation: stopPulse 1s ease-in-out infinite;
    }
  }
}

.advanced-actions {
  .advanced-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: rgba($gray-700, 0.2);
    border: 1px solid rgba($gray-600, 0.3);
    color: $text-tertiary;

    &:hover {
      background: rgba($gray-700, 0.3);
      color: $text-secondary;
    }
  }
}

// 表情选择器
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
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
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
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
  font-weight: 600;
}

.emoji-categories {
  display: flex;
  padding: 12px 20px;
  gap: 8px;
  border-bottom: 1px solid rgba($gray-600, 0.2);

  .category-btn {
    width: 40px;
    height: 40px;
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
    width: 36px;
    height: 36px;
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

  .emoji-search-input {
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

// 语音对话框
.voice-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.voice-dialog-panel {
  background: $dark-bg-secondary;
  border: 1px solid rgba($gray-600, 0.3);
  border-radius: 20px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  padding: 24px;
}

// 高级设置面板
.advanced-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
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
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
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
    font-size: 18px;
    font-weight: 600;
  }
}

.advanced-content {
  padding: 24px;
  overflow-y: auto;
  max-height: 50vh;

  .setting-group {
    margin-bottom: 24px;

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: $text-secondary;
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
      }

      &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary-500;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .setting-checkbox {
        width: 18px;
        height: 18px;
        accent-color: $primary-500;
      }
    }
  }
}

// 动画
@keyframes recordingPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba($error-color, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba($error-color, 0);
  }
}

@keyframes stopPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
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
  .immersive-chat-input {
    padding: 12px;
    border-radius: 20px;
  }

  .input-container {
    gap: 8px;
  }

  .sidebar-actions .sidebar-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .send-actions .send-btn {
    width: 44px;
    height: 44px;
  }

  .message-input {
    min-height: 44px;
    padding: 12px 16px;
    font-size: 16px; // 防止iOS缩放
  }

  .emoji-picker-panel {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px;
  }

  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .emoji-item {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}

// 无障碍支持
@media (prefers-reduced-motion: reduce) {
  .immersive-chat-input,
  .sidebar-btn,
  .send-btn,
  .message-input {
    transition: none;
  }

  @keyframes recordingPulse,
  @keyframes stopPulse {
    display: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .immersive-chat-input {
    border-width: 2px;
  }

  .input-field-wrapper {
    border-width: 2px;
  }

  .sidebar-btn,
  .send-btn {
    border-width: 2px;
  }
}
</style>