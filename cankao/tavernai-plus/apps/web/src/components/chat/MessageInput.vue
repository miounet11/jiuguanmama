<template>
  <div class="message-input-container" :class="containerClasses">
    <!-- 快捷操作栏 -->
    <div v-if="showQuickActions && quickActions.length > 0" class="quick-actions">
      <div class="quick-actions-scroll">
        <TavernButton
          v-for="action in quickActions"
          :key="action.id"
          variant="ghost"
          size="sm"
          class="quick-action-btn"
          @click="insertQuickAction(action)"
        >
          <TavernIcon :name="action.icon" />
          <span>{{ action.label }}</span>
        </TavernButton>
      </div>
    </div>

    <!-- 主输入区域 -->
    <div class="input-wrapper">
      <!-- 角色选择器 (多角色模式) -->
      <div v-if="multiCharacterMode && availableCharacters.length > 1" class="character-selector">
        <select
          v-model="selectedCharacterId"
          class="character-select"
          @change="handleCharacterChange"
        >
          <option
            v-for="char in availableCharacters"
            :key="char.id"
            :value="char.id"
          >
            {{ char.name }}
          </option>
        </select>
      </div>

      <!-- 文本输入区域 -->
      <div class="input-text-area">
        <!-- 文件预览 -->
        <div v-if="attachedFiles.length > 0" class="attached-files">
          <div
            v-for="file in attachedFiles"
            :key="file.id"
            class="attached-file"
          >
            <TavernIcon :name="getFileIcon(file.type)" />
            <span class="file-name">{{ file.name }}</span>
            <TavernButton
              variant="ghost"
              size="xs"
              @click="removeFile(file.id)"
            >
              <TavernIcon name="close" />
            </TavernButton>
          </div>
        </div>

        <!-- 主输入框 -->
        <TavernInput
          ref="inputRef"
          v-model="inputText"
          type="textarea"
          :placeholder="getPlaceholder()"
          :auto-resize="true"
          :maxlength="maxLength"
          :show-char-count="showCharCount"
          :disabled="disabled || isSending"
          class="message-input"
          @keydown="handleKeydown"
          @paste="handlePaste"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="handleInput"
        />

        <!-- 输入提示 -->
        <div v-if="showSuggestions && suggestions.length > 0" class="input-suggestions">
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            class="suggestion-item"
            :class="{ 'suggestion-active': activeSuggestionIndex === index }"
            @click="applySuggestion(suggestion)"
          >
            <TavernIcon :name="suggestion.icon || 'lightbulb'" />
            <span>{{ suggestion.text }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧操作按钮组 -->
      <div class="input-actions">
        <!-- 语音输入 -->
        <TavernButton
          v-if="enableVoice"
          variant="ghost"
          size="sm"
          :class="{ 'recording': isRecording }"
          :disabled="disabled"
          @click="toggleVoiceInput"
          :title="isRecording ? '停止录音' : '语音输入'"
        >
          <TavernIcon :name="isRecording ? 'microphone-slash' : 'microphone'" />
        </TavernButton>

        <!-- 文件上传 -->
        <TavernButton
          v-if="enableFileUpload"
          variant="ghost"
          size="sm"
          :disabled="disabled"
          @click="triggerFileUpload"
          title="上传文件"
        >
          <TavernIcon name="paperclip" />
        </TavernButton>

        <!-- 表情选择器 -->
        <TavernButton
          v-if="enableEmoji"
          variant="ghost"
          size="sm"
          :disabled="disabled"
          @click="toggleEmojiPicker"
          title="表情符号"
        >
          <TavernIcon name="smile" />
        </TavernButton>

        <!-- AI助手建议 -->
        <TavernButton
          v-if="enableAiSuggestions"
          variant="ghost"
          size="sm"
          :disabled="disabled"
          @click="getAiSuggestions"
          title="AI建议"
        >
          <TavernIcon name="sparkles" />
        </TavernButton>

        <!-- 发送按钮 -->
        <TavernButton
          variant="primary"
          size="sm"
          :disabled="!canSend"
          :loading="isSending"
          @click="sendMessage"
          :title="getSendButtonTitle()"
          class="send-button"
        >
          <TavernIcon :name="isSending ? 'spinner' : 'send'" />
        </TavernButton>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      :accept="acceptedFileTypes"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- 表情选择器 -->
    <div v-if="showEmojiPicker" class="emoji-picker" ref="emojiPickerRef">
      <div class="emoji-categories">
        <TavernButton
          v-for="category in emojiCategories"
          :key="category.name"
          variant="ghost"
          size="xs"
          :class="{ 'active': activeEmojiCategory === category.name }"
          @click="activeEmojiCategory = category.name"
        >
          {{ category.icon }}
        </TavernButton>
      </div>
      <div class="emoji-grid">
        <button
          v-for="emoji in currentCategoryEmojis"
          :key="emoji"
          @click="insertEmoji(emoji)"
          class="emoji-btn"
          :title="getEmojiTitle(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>

    <!-- 语音录制界面 -->
    <div v-if="showVoiceRecorder" class="voice-recorder" ref="voiceRecorderRef">
      <div class="voice-recorder-content">
        <div class="recording-indicator">
          <div class="recording-dot" />
          <span>正在录音...</span>
        </div>
        <div class="recording-duration">{{ formatDuration(recordingDuration) }}</div>
        <div class="recording-actions">
          <TavernButton
            variant="ghost"
            size="sm"
            @click="cancelRecording"
          >
            取消
          </TavernButton>
          <TavernButton
            variant="primary"
            size="sm"
            @click="stopRecording"
          >
            完成
          </TavernButton>
        </div>
      </div>
    </div>

    <!-- AI建议面板 -->
    <div v-if="showAiSuggestions && aiSuggestions.length > 0" class="ai-suggestions">
      <div class="ai-suggestions-header">
        <TavernIcon name="sparkles" />
        <span>AI助手建议</span>
        <TavernButton variant="ghost" size="xs" @click="closeAiSuggestions">
          <TavernIcon name="close" />
        </TavernButton>
      </div>
      <div class="ai-suggestions-list">
        <div
          v-for="suggestion in aiSuggestions"
          :key="suggestion.id"
          class="ai-suggestion-item"
          @click="applySuggestion(suggestion)"
        >
          <div class="suggestion-text">{{ suggestion.text }}</div>
          <div class="suggestion-meta">{{ suggestion.type }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import TavernInput from '@/components/design-system/TavernInput.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'

// Types
export interface MessageInputProps {
  // 基础配置
  modelValue?: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  isSending?: boolean

  // 功能开关
  enableVoice?: boolean
  enableFileUpload?: boolean
  enableEmoji?: boolean
  enableAiSuggestions?: boolean
  showCharCount?: boolean
  showQuickActions?: boolean

  // 多角色模式
  multiCharacterMode?: boolean
  selectedCharacter?: any
  availableCharacters?: any[]

  // 样式配置
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'expanded'

  // 文件上传
  acceptedFileTypes?: string
  maxFileSize?: number
  maxFiles?: number

  // 自定义快捷操作
  customActions?: QuickAction[]
}

interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
  template?: string
}

interface AttachedFile {
  id: string
  name: string
  type: string
  size: number
  file: File
}

interface Suggestion {
  id?: string
  text: string
  icon?: string
  type?: string
}

// Props
const props = withDefaults(defineProps<MessageInputProps>(), {
  placeholder: '输入消息...',
  maxLength: 2000,
  disabled: false,
  isSending: false,
  enableVoice: true,
  enableFileUpload: true,
  enableEmoji: true,
  enableAiSuggestions: true,
  showCharCount: true,
  showQuickActions: true,
  multiCharacterMode: false,
  availableCharacters: () => [],
  size: 'md',
  variant: 'default',
  acceptedFileTypes: 'image/*,audio/*,video/*,.txt,.pdf,.doc,.docx',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  customActions: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': [content: string, options?: any]
  'voice-start': []
  'voice-stop': [audioBlob: Blob]
  'file-upload': [files: File[]]
  'character-change': [characterId: string]
  'focus': []
  'blur': []
}>()

// Refs
const inputRef = ref<InstanceType<typeof TavernInput> | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const emojiPickerRef = ref<HTMLElement | null>(null)
const voiceRecorderRef = ref<HTMLElement | null>(null)

// State
const inputText = ref(props.modelValue || '')
const attachedFiles = ref<AttachedFile[]>([])
const selectedCharacterId = ref(props.selectedCharacter?.id || '')
const showEmojiPicker = ref(false)
const showVoiceRecorder = ref(false)
const showAiSuggestions = ref(false)
const showSuggestions = ref(false)
const isRecording = ref(false)
const recordingDuration = ref(0)
const activeSuggestionIndex = ref(-1)
const activeEmojiCategory = ref('smileys')
const suggestions = ref<Suggestion[]>([])
const aiSuggestions = ref<Suggestion[]>([])

// Voice recording
let mediaRecorder: MediaRecorder | null = null
let recordingInterval: number | null = null
let audioChunks: Blob[] = []

// Computed
const containerClasses = computed(() => [
  `message-input--${props.size}`,
  `message-input--${props.variant}`,
  {
    'message-input--disabled': props.disabled,
    'message-input--sending': props.isSending,
    'message-input--has-files': attachedFiles.value.length > 0,
    'message-input--multi-character': props.multiCharacterMode
  }
])

const canSend = computed(() => {
  const hasContent = inputText.value.trim().length > 0 || attachedFiles.value.length > 0
  return hasContent && !props.disabled && !props.isSending
})

const quickActions = computed(() => {
  const defaultActions: QuickAction[] = [
    {
      id: 'greeting',
      label: '打招呼',
      icon: 'hand-wave',
      action: () => insertText('你好！很高兴见到你！'),
      template: '你好！很高兴见到你！'
    },
    {
      id: 'question',
      label: '提问',
      icon: 'question-circle',
      action: () => insertText('我想问一个问题：'),
      template: '我想问一个问题：'
    },
    {
      id: 'compliment',
      label: '夸奖',
      icon: 'heart',
      action: () => insertText('你真的很棒！'),
      template: '你真的很棒！'
    },
    {
      id: 'continue',
      label: '继续',
      icon: 'arrow-right',
      action: () => insertText('请继续说下去...'),
      template: '请继续说下去...'
    }
  ]

  return [...defaultActions, ...props.customActions]
})

const emojiCategories = computed(() => [
  { name: 'smileys', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'] },
  { name: 'gestures', icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐'] },
  { name: 'hearts', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { name: 'objects', icon: '🎉', emojis: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🎄', '🎃', '🎆', '🎇', '🧨', '✨', '🎯', '🎪', '🎨', '🎭', '🎪', '🎫', '🎟️'] }
])

const currentCategoryEmojis = computed(() => {
  const category = emojiCategories.value.find(c => c.name === activeEmojiCategory.value)
  return category?.emojis || []
})

// Methods
const getPlaceholder = () => {
  if (props.multiCharacterMode && selectedCharacterId.value) {
    const character = props.availableCharacters.find(c => c.id === selectedCharacterId.value)
    return `与 ${character?.name || 'AI'} 对话...`
  }
  return props.placeholder
}

const getSendButtonTitle = () => {
  if (props.isSending) return '发送中...'
  if (!canSend.value) return '输入内容后发送'
  return 'Enter 发送，Shift+Enter 换行'
}

const handleInput = () => {
  inputText.value = inputRef.value?.getValue() || ''
  emit('update:modelValue', inputText.value)

  // 检查是否需要显示建议
  if (inputText.value.endsWith('/')) {
    showSuggestions.value = true
    generateSuggestions()
  } else {
    showSuggestions.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // 发送消息: Enter (不含 Shift)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (canSend.value) {
      sendMessage()
    }
  }

  // 建议导航
  if (showSuggestions.value && suggestions.value.length > 0) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      activeSuggestionIndex.value = Math.max(0, activeSuggestionIndex.value - 1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      activeSuggestionIndex.value = Math.min(suggestions.value.length - 1, activeSuggestionIndex.value + 1)
    } else if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault()
      if (activeSuggestionIndex.value >= 0) {
        applySuggestion(suggestions.value[activeSuggestionIndex.value])
      }
    } else if (event.key === 'Escape') {
      showSuggestions.value = false
      activeSuggestionIndex.value = -1
    }
  }

  // 表情选择器快捷键
  if (event.key === ':' && event.ctrlKey) {
    event.preventDefault()
    toggleEmojiPicker()
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  const files: File[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    // 处理粘贴的文件
    if (item.kind === 'file' && props.enableFileUpload) {
      const file = item.getAsFile()
      if (file) {
        files.push(file)
      }
    }
  }

  if (files.length > 0) {
    event.preventDefault()
    await addFiles(files)
  }
}

const handleFocus = () => {
  emit('focus')
}

const handleBlur = () => {
  emit('blur')
  // 延迟隐藏建议，以便用户可以点击
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const handleCharacterChange = () => {
  emit('character-change', selectedCharacterId.value)
}

const sendMessage = () => {
  if (!canSend.value) return

  const content = inputText.value.trim()
  const options = {
    characterId: selectedCharacterId.value,
    files: attachedFiles.value.map(f => f.file)
  }

  emit('send', content, options)

  // 清空输入
  inputText.value = ''
  attachedFiles.value = []
  emit('update:modelValue', '')

  // 重新聚焦
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const insertText = (text: string) => {
  const currentValue = inputText.value
  const cursorPosition = inputRef.value?.getCursorPosition() || currentValue.length

  const newValue = currentValue.slice(0, cursorPosition) + text + currentValue.slice(cursorPosition)
  inputText.value = newValue
  emit('update:modelValue', newValue)

  nextTick(() => {
    inputRef.value?.setCursorPosition(cursorPosition + text.length)
  })
}

const insertQuickAction = (action: QuickAction) => {
  if (action.template) {
    insertText(action.template)
  }
  action.action()
}

// 语音录制功能
const toggleVoiceInput = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      emit('voice-stop', audioBlob)

      // 清理资源
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true
    showVoiceRecorder.value = true
    recordingDuration.value = 0

    // 开始计时
    recordingInterval = window.setInterval(() => {
      recordingDuration.value += 1
    }, 1000)

    emit('voice-start')
  } catch (error) {
    console.error('Failed to start recording:', error)
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    showVoiceRecorder.value = false

    if (recordingInterval) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }
  }
}

const cancelRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    showVoiceRecorder.value = false

    if (recordingInterval) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }

    // 不发送录音数据
    audioChunks = []
  }
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 文件上传功能
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addFiles(files)

  // 清空文件输入
  target.value = ''
}

const addFiles = async (files: File[]) => {
  const validFiles = files.filter(file => {
    // 检查文件大小
    if (file.size > props.maxFileSize) {
      console.warn(`文件 ${file.name} 超过大小限制`)
      return false
    }

    // 检查文件数量
    if (attachedFiles.value.length >= props.maxFiles) {
      console.warn('已达到最大文件数量限制')
      return false
    }

    return true
  })

  const newAttachedFiles = validFiles.map(file => ({
    id: `${Date.now()}-${Math.random()}`,
    name: file.name,
    type: file.type,
    size: file.size,
    file
  }))

  attachedFiles.value.push(...newAttachedFiles)
  emit('file-upload', validFiles)
}

const removeFile = (fileId: string) => {
  attachedFiles.value = attachedFiles.value.filter(f => f.id !== fileId)
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('audio/')) return 'music'
  if (type.startsWith('video/')) return 'video'
  if (type.includes('pdf')) return 'file-pdf'
  if (type.includes('word')) return 'file-word'
  return 'file'
}

// 表情功能
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const insertEmoji = (emoji: string) => {
  insertText(emoji)
  showEmojiPicker.value = false
}

const getEmojiTitle = (emoji: string) => {
  // 这里可以添加表情符号的描述
  return emoji
}

// 建议功能
const generateSuggestions = () => {
  // 这里可以根据输入内容生成智能建议
  suggestions.value = [
    { text: '继续这个话题', icon: 'arrow-right' },
    { text: '换个话题', icon: 'refresh' },
    { text: '问个问题', icon: 'question-circle' }
  ]
  activeSuggestionIndex.value = 0
}

const applySuggestion = (suggestion: Suggestion) => {
  insertText(suggestion.text)
  showSuggestions.value = false
  showAiSuggestions.value = false
}

// AI建议功能
const getAiSuggestions = async () => {
  // 这里可以调用AI API获取建议
  aiSuggestions.value = [
    { id: '1', text: '可以详细解释一下吗？', type: '深入了解' },
    { id: '2', text: '这让我想起了...', type: '联想延伸' },
    { id: '3', text: '我们来换个角度看看', type: '换个视角' }
  ]
  showAiSuggestions.value = true
}

const closeAiSuggestions = () => {
  showAiSuggestions.value = false
}

// 外部点击关闭
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement

  if (showEmojiPicker.value && emojiPickerRef.value && !emojiPickerRef.value.contains(target)) {
    showEmojiPicker.value = false
  }

  if (showVoiceRecorder.value && voiceRecorderRef.value && !voiceRecorderRef.value.contains(target)) {
    // 语音录制不能通过外部点击关闭
  }
}

// Watch
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputText.value) {
    inputText.value = newValue || ''
  }
})

watch(() => props.selectedCharacter, (newCharacter) => {
  if (newCharacter?.id !== selectedCharacterId.value) {
    selectedCharacterId.value = newCharacter?.id || ''
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)

  // 清理录音资源
  if (recordingInterval) {
    clearInterval(recordingInterval)
  }

  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
  }
})
</script>

<style lang="scss" scoped>
.message-input-container {
  position: relative;
  background: var(--surface-2);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-lg);
  transition: var(--transition-colors);

  &:focus-within {
    border-color: var(--tavern-primary);
    box-shadow: 0 0 0 var(--space-1) rgba(var(--brand-primary-500), 0.1);
  }

  // === 尺寸变体 ===
  &.message-input--sm {
    --input-padding: var(--space-2);
    --action-button-size: 32px;
  }

  &.message-input--md {
    --input-padding: var(--space-3);
    --action-button-size: 36px;
  }

  &.message-input--lg {
    --input-padding: var(--space-4);
    --action-button-size: 40px;
  }

  // === 样式变体 ===
  &.message-input--compact {
    .quick-actions {
      display: none;
    }
  }

  &.message-input--expanded {
    .input-wrapper {
      flex-direction: column;
      align-items: stretch;
    }

    .input-actions {
      justify-content: center;
      margin-top: var(--space-2);
    }
  }

  // === 状态样式 ===
  &.message-input--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.message-input--sending {
    .send-button {
      background: var(--tavern-secondary);
    }
  }

  &.message-input--has-files {
    .input-text-area {
      border-top: var(--space-px) solid var(--border-secondary);
    }
  }
}

// === 快捷操作栏 ===
.quick-actions {
  padding: var(--space-2);
  border-bottom: var(--space-px) solid var(--border-secondary);
  background: var(--surface-3);

  .quick-actions-scroll {
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .quick-action-btn {
    flex-shrink: 0;
    white-space: nowrap;
    font-size: var(--text-xs);
  }
}

// === 主输入区域 ===
.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--input-padding);
}

.character-selector {
  flex-shrink: 0;

  .character-select {
    padding: var(--space-2);
    background: var(--surface-4);
    border: var(--space-px) solid var(--border-secondary);
    border-radius: var(--radius-base);
    color: var(--text-primary);
    font-size: var(--text-sm);
  }
}

.input-text-area {
  flex: 1;
  position: relative;
}

.attached-files {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-2);

  .attached-file {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--surface-4);
    border-radius: var(--radius-base);
    font-size: var(--text-xs);

    .file-name {
      color: var(--text-secondary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.message-input {
  :deep(.tavern-input__field) {
    min-height: 44px;
    max-height: 120px;
    resize: none;
    border: none !important;
    background: transparent !important;

    &:focus {
      box-shadow: none !important;
    }
  }
}

// === 输入建议 ===
.input-suggestions {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: var(--surface-3);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--dropdown-shadow);
  z-index: var(--z-dropdown);
  max-height: 200px;
  overflow-y: auto;

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    cursor: pointer;
    transition: var(--transition-colors);

    &:hover,
    &.suggestion-active {
      background: var(--surface-4);
    }

    &:not(:last-child) {
      border-bottom: var(--space-px) solid var(--border-secondary);
    }
  }
}

// === 操作按钮 ===
.input-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);

  .recording {
    color: var(--error);
    animation: pulse 1.5s infinite;
  }

  .send-button {
    min-width: var(--action-button-size);
    min-height: var(--action-button-size);
  }
}

// === 表情选择器 ===
.emoji-picker {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  right: var(--space-3);
  width: 320px;
  background: var(--surface-3);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--dropdown-shadow);
  z-index: var(--z-dropdown);

  .emoji-categories {
    display: flex;
    padding: var(--space-2);
    border-bottom: var(--space-px) solid var(--border-secondary);
    gap: var(--space-1);

    .active {
      background: var(--surface-4);
    }
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: var(--space-1);
    padding: var(--space-2);
    max-height: 200px;
    overflow-y: auto;

    .emoji-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: var(--radius-base);
      cursor: pointer;
      font-size: var(--text-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-colors);

      &:hover {
        background: var(--surface-4);
      }
    }
  }
}

// === 语音录制界面 ===
.voice-recorder {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-3);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--dropdown-shadow);
  z-index: var(--z-dropdown);
  padding: var(--space-4);
  min-width: 200px;

  .voice-recorder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .recording-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--error);

    .recording-dot {
      width: 8px;
      height: 8px;
      background: var(--error);
      border-radius: var(--radius-full);
      animation: pulse 1.5s infinite;
    }
  }

  .recording-duration {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    font-family: var(--font-mono);
  }

  .recording-actions {
    display: flex;
    gap: var(--space-2);
  }
}

// === AI建议面板 ===
.ai-suggestions {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  left: 0;
  right: 0;
  background: var(--surface-3);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--dropdown-shadow);
  z-index: var(--z-dropdown);

  .ai-suggestions-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border-bottom: var(--space-px) solid var(--border-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--text-primary);

    .tavern-icon {
      color: var(--tavern-primary);
    }

    span {
      flex: 1;
    }
  }

  .ai-suggestions-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .ai-suggestion-item {
    padding: var(--space-3);
    cursor: pointer;
    transition: var(--transition-colors);

    &:hover {
      background: var(--surface-4);
    }

    &:not(:last-child) {
      border-bottom: var(--space-px) solid var(--border-secondary);
    }

    .suggestion-text {
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .suggestion-meta {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }
  }
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

// === 响应式设计 ===
@media (max-width: 768px) {
  .message-input-container {
    .input-wrapper {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-2);
    }

    .input-actions {
      justify-content: space-between;
      padding-top: var(--space-2);
      border-top: var(--space-px) solid var(--border-secondary);
    }

    .emoji-picker,
    .voice-recorder,
    .ai-suggestions {
      left: var(--space-2);
      right: var(--space-2);
      width: auto;
    }

    .quick-actions {
      .quick-actions-scroll {
        padding-bottom: var(--space-1);
      }
    }
  }

  // 移动端优化文件显示
  .attached-files {
    .attached-file {
      .file-name {
        max-width: 80px;
      }
    }
  }
}

// === 暗色主题优化 ===
[data-theme="dark"] {
  .emoji-picker,
  .voice-recorder,
  .ai-suggestions,
  .input-suggestions {
    background: var(--surface-2);
    border-color: var(--border-primary);
  }
}
</style>