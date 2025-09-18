<template>
  <div class="smart-chat-input">
    <!-- 输入框容器 -->
    <div class="input-container">
      <el-input
        v-model="message"
        type="textarea"
        :placeholder="placeholder"
        :autosize="{ minRows: 1, maxRows: 6 }"
        :disabled="disabled"
        @keydown="handleKeydown"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        class="message-textarea"
        resize="none"
      >
        <!-- 前置工具栏 -->
        <template #prepend>
          <div class="input-toolbar">
            <el-button-group>
              <el-tooltip content="上传图片" placement="top">
                <el-button
                  @click="triggerFileUpload"
                  :icon="PictureRounded"
                  type="text"
                  size="small"
                />
              </el-tooltip>

              <el-tooltip content="语音输入" placement="top">
                <el-button
                  @click="startVoiceInput"
                  :icon="Microphone"
                  type="text"
                  size="small"
                  :class="{ 'voice-active': isRecording }"
                />
              </el-tooltip>

              <el-tooltip content="表情" placement="top">
                <el-button
                  @click="toggleEmojiPicker"
                  :icon="icon_Smile"
                  type="text"
                  size="small"
                />
              </el-tooltip>

              <el-tooltip content="AI助手" placement="top">
                <el-button
                  @click="openAIAssistant"
                  :icon="Robot"
                  type="text"
                  size="small"
                />
              </el-tooltip>
            </el-button-group>
          </div>
        </template>

        <!-- 后置发送区域 -->
        <template #append>
          <div class="send-area">
            <!-- 字数统计 -->
            <div class="char-count" v-if="showCharCount">
              <el-text size="small" :type="isOverLimit ? 'danger' : 'info'">
                {{ message.length }}{{ maxLength ? `/${maxLength}` : '' }}
              </el-text>
            </div>

            <!-- 发送按钮 -->
            <el-button
              @click="handleSend"
              :disabled="!canSend"
              :loading="sending"
              type="primary"
              size="large"
              class="send-button"
            >
              <el-icon size="18">
                <component :is="sending ? 'Loading' : 'Promotion'" />
              </el-icon>
            </el-button>
          </div>
        </template>
      </el-input>

      <!-- 隐藏的文件上传输入 -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- 智能建议栏 -->
    <div v-if="showSuggestions && suggestions.length" class="suggestions-bar">
      <div class="suggestions-scroll">
        <el-tag
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="applySuggestion(suggestion)"
          class="suggestion-tag"
          effect="plain"
          size="small"
        >
          {{ suggestion.text }}
        </el-tag>
      </div>
    </div>

    <!-- @提及面板 -->
    <el-popover
      v-model:visible="showMentions"
      placement="top-start"
      :width="320"
      :trigger="'manual' as any"
      popper-class="mention-popover"
    >
      <div class="mention-panel">
        <div class="mention-header">
          <el-text size="small" type="info">提及角色</el-text>
        </div>
        <div class="mention-list">
          <div
            v-for="char in filteredMentions"
            :key="char.id"
            @click="insertMention(char)"
            class="mention-item"
          >
            <el-avatar :src="char.avatar" size="small" />
            <div class="mention-info">
              <div class="mention-name">{{ char.name }}</div>
              <div class="mention-desc">{{ char.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-popover>

    <!-- 表情选择器 -->
    <EmojiPicker
      v-if="showEmojiPicker"
      @select="insertEmoji"
      @close="showEmojiPicker = false"
    />

    <!-- AI写作助手 -->
    <AIWritingAssistant
      v-model:visible="showAIAssistant"
      :context="message"
      @apply="applyAIText"
    />

    <!-- 语音输入对话框 -->
    <VoiceInputDialog
      v-model:visible="showVoiceDialog"
      @result="handleVoiceResult"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  PictureRounded,
  Microphone,
  User as Robot  // 使用 User 图标替代不存在的 Robot
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 定义icon_Smile（Element Plus可能没有这个图标）
const icon_Smile = 'User' // 临时使用其他图标

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
}

interface Suggestion {
  text: string
  type: 'continue' | 'emotion' | 'question' | 'action'
}

interface Props {
  modelValue: string
  character?: Character
  disabled?: boolean
  maxLength?: number
  placeholder?: string
  suggestions?: Suggestion[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'send', message: string): void
  (e: 'upload', files: FileList): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxLength: 2000,
  placeholder: '输入消息... (支持 @提及、表情、图片)',
  suggestions: () => []
})

const emit = defineEmits<Emits>()

// 响应式数据
const message = ref('')
const sending = ref(false)
const isRecording = ref(false)
const focused = ref(false)

// UI状态
const showSuggestions = ref(false)
const showMentions = ref(false)
const showEmojiPicker = ref(false)
const showAIAssistant = ref(false)
const showVoiceDialog = ref(false)

// 引用
const fileInput = ref<HTMLInputElement | null>(null)

// 提及相关
const mentionQuery = ref('')
const mentionableCharacters = ref<Character[]>([
  // 模拟数据
  { id: '1', name: '小助手', avatar: '/avatars/assistant.png', description: '智能AI助手' },
  { id: '2', name: '艾莉', avatar: '/avatars/ellie.png', description: '活泼可爱的少女' }
])

// 计算属性
const canSend = computed(() => {
  return message.value.trim().length > 0 &&
         !props.disabled &&
         !isOverLimit.value &&
         !sending.value
})

const isOverLimit = computed(() => {
  return props.maxLength ? message.value.length > props.maxLength : false
})

const showCharCount = computed(() => {
  return message.value.length > 0 || focused.value
})

const filteredMentions = computed(() => {
  if (!mentionQuery.value) return mentionableCharacters.value

  return mentionableCharacters.value.filter(char =>
    char.name.toLowerCase().includes(mentionQuery.value.toLowerCase())
  )
})

// 方法
const handleKeydown = (event: Event | KeyboardEvent) => {
  // 类型守卫：确保是 KeyboardEvent
  if (!(event instanceof KeyboardEvent)) return
  // Ctrl/Cmd + Enter 发送
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSend()
    return
  }

  // Tab键应用第一个建议
  if (event.key === 'Tab' && props.suggestions.length > 0) {
    event.preventDefault()
    applySuggestion(props.suggestions[0])
    return
  }

  // @键触发提及
  if (event.key === '@') {
    setTimeout(() => detectMention(), 100)
  }
}

const handleInput = (value: string) => {
  message.value = value
  emit('update:modelValue', value)

  // 检测@提及
  detectMention()

  // 更新建议显示
  updateSuggestions()
}

const handleFocus = () => {
  focused.value = true
  showSuggestions.value = true
}

const handleBlur = () => {
  focused.value = false
  // 延迟隐藏，避免点击建议时立即消失
  setTimeout(() => {
    if (!focused.value) {
      showSuggestions.value = false
    }
  }, 200)
}

const handleSend = () => {
  if (!canSend.value) return

  const content = message.value.trim()
  if (content) {
    sending.value = true
    emit('send', content)
    message.value = ''
    emit('update:modelValue', '')

    // 模拟发送完成
    setTimeout(() => {
      sending.value = false
    }, 1000)
  }
}

const detectMention = () => {
  const textarea = document.activeElement as HTMLTextAreaElement
  if (!textarea) return

  const cursorPos = textarea.selectionStart
  const textBeforeCursor = message.value.substring(0, cursorPos)
  const atMatch = textBeforeCursor.match(/@(\w*)$/)

  if (atMatch) {
    mentionQuery.value = atMatch[1]
    showMentions.value = true
  } else {
    showMentions.value = false
    mentionQuery.value = ''
  }
}

const insertMention = (character: Character) => {
  const textarea = document.activeElement as HTMLTextAreaElement
  if (!textarea) return

  const cursorPos = textarea.selectionStart
  const textBeforeCursor = message.value.substring(0, cursorPos)
  const textAfterCursor = message.value.substring(cursorPos)

  const atMatch = textBeforeCursor.match(/@(\w*)$/)
  if (atMatch) {
    const beforeAt = textBeforeCursor.substring(0, atMatch.index)
    message.value = beforeAt + `@${character.name} ` + textAfterCursor
    emit('update:modelValue', message.value)
  }

  showMentions.value = false
}

const updateSuggestions = () => {
  // 根据当前输入内容更新智能建议
  // TODO: 实现智能建议逻辑
}

const applySuggestion = (suggestion: Suggestion) => {
  message.value += (message.value ? ' ' : '') + suggestion.text
  emit('update:modelValue', message.value)
  showSuggestions.value = false
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (files && files.length > 0) {
    emit('upload', files)
  }
}

const startVoiceInput = () => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    showVoiceDialog.value = true
  } else {
    ElMessage.warning('您的浏览器不支持语音输入功能')
  }
}

const handleVoiceResult = (text: string) => {
  message.value += (message.value ? ' ' : '') + text
  emit('update:modelValue', message.value)
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const insertEmoji = (emoji: string) => {
  const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || message.value.length
  const before = message.value.substring(0, cursorPos)
  const after = message.value.substring(cursorPos)
  message.value = before + emoji + after
  emit('update:modelValue', message.value)
}

const openAIAssistant = () => {
  showAIAssistant.value = true
}

const applyAIText = (text: string) => {
  message.value = text
  emit('update:modelValue', text)
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== message.value) {
    message.value = newValue
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.smart-chat-input {
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  transition: var(--transition-all);

  &:focus-within {
    box-shadow: var(--shadow-lg);
  }
}

.input-container {
  .message-textarea {
    :deep(.el-textarea__inner) {
      border: none;
      padding: var(--space-4);
      font-size: var(--text-base);
      line-height: var(--leading-normal);
      resize: none;

      &:focus {
        box-shadow: none;
      }
    }

    :deep(.el-input-group__prepend) {
      background: var(--surface-soft);
      border: none;
      padding: var(--space-2);
    }

    :deep(.el-input-group__append) {
      background: var(--surface-soft);
      border: none;
      padding: var(--space-2);
    }
  }
}

.input-toolbar {
  .el-button-group {
    .el-button {
      border: none;
      background: transparent;
      color: var(--text-secondary);

      &:hover {
        color: var(--tavern-primary);
        background: var(--surface-muted);
      }

      &.voice-active {
        color: var(--tavern-danger);
        animation: pulse 1s infinite;
      }
    }
  }
}

.send-area {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .char-count {
    min-width: 60px;
    text-align: right;
  }

  .send-button {
    background: linear-gradient(135deg, var(--tavern-primary) 0%, var(--tavern-secondary) 100%);
    border: none;
    border-radius: var(--radius-lg);

    &:hover:not(:disabled) {
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.5;
    }
  }
}

.suggestions-bar {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-light);
  background: var(--surface-soft);

  .suggestions-scroll {
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .suggestion-tag {
    flex-shrink: 0;
    cursor: pointer;
    transition: var(--transition-colors);

    &:hover {
      background: var(--tavern-primary);
      color: white;
    }
  }
}

.mention-panel {
  .mention-header {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-light);
  }

  .mention-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .mention-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    cursor: pointer;
    transition: var(--transition-colors);

    &:hover {
      background: var(--surface-muted);
    }

    .mention-info {
      flex: 1;
      min-width: 0;

      .mention-name {
        font-weight: var(--font-medium);
        color: var(--text-primary);
      }

      .mention-desc {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// 响应式适配
@media (max-width: 768px) {
  .input-toolbar {
    .el-button-group .el-button {
      padding: var(--space-1);
    }
  }

  .send-area {
    .send-button {
      padding: var(--space-2);
    }
  }
}
</style>
