<template>
  <div class="chat-input-mobile">
    <div class="input-container p-4">
      <div class="flex items-end space-x-3">
        <!-- 左侧工具按钮 -->
        <div class="flex space-x-2 pb-2">
          <el-button
            @click="$emit('upload')"
            :icon="PictureRounded"
            type="text"
            size="small"
            class="tool-btn"
            title="上传图片"
          />
          <el-button
            @click="$emit('voice')"
            :icon="Microphone"
            type="text"
            size="small"
            class="tool-btn"
            title="语音输入"
          />
        </div>

        <!-- 输入框 -->
        <div class="flex-1 relative">
          <el-input
            v-model="localMessage"
            type="textarea"
            :placeholder="placeholder"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :disabled="disabled"
            @keydown="handleKeydown"
            @input="handleInput"
            class="message-input"
            resize="none"
          />

          <!-- 字数统计 -->
          <div
            v-if="localMessage.length > 0"
            class="absolute -top-6 right-0 text-xs text-gray-400"
          >
            {{ localMessage.length }}{{ maxLength ? `/${maxLength}` : '' }}
          </div>
        </div>

        <!-- 发送按钮 -->
        <div class="pb-1">
          <el-button
            @click="handleSend"
            :disabled="!canSend"
            :loading="disabled"
            type="primary"
            size="large"
            circle
            class="send-btn"
          >
            <el-icon size="20">
              <component :is="disabled ? 'Loading' : 'Promotion'" />
            </el-icon>
          </el-button>
        </div>
      </div>

      <!-- 快速回复建议 -->
      <div
        v-if="suggestions.length && !localMessage"
        class="suggestions mt-3"
      >
        <div class="flex flex-wrap gap-2">
          <el-tag
            v-for="(suggestion, index) in suggestions.slice(0, 3)"
            :key="index"
            @click="selectSuggestion(suggestion)"
            class="suggestion-tag cursor-pointer"
            effect="plain"
            size="small"
          >
            {{ suggestion }}
          </el-tag>
        </div>
      </div>

      <!-- 输入提示 -->
      <div
        v-if="showHints"
        class="hints mt-2 text-xs text-gray-500 flex items-center"
      >
        <el-icon class="mr-1"><InfoFilled /></el-icon>
        <span>{{ currentHint }}</span>
      </div>
    </div>

    <!-- 表情面板 -->
    <EmojiPicker
      v-if="showEmojiPicker"
      @select="insertEmoji"
      @close="showEmojiPicker = false"
    />

    <!-- @提及面板 -->
    <MentionPanel
      v-if="showMentions"
      :characters="mentionableCharacters"
      :position="mentionPosition"
      @select="insertMention"
      @close="showMentions = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  PictureRounded,
  Microphone,

  InfoFilled
} from '@element-plus/icons-vue'

interface Character {
  id: string
  name: string
  avatar?: string
}

interface Props {
  modelValue: string
  disabled?: boolean
  character?: Character
  maxLength?: number
  placeholder?: string
  suggestions?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'send', message: string): void
  (e: 'upload'): void
  (e: 'voice'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxLength: 2000,
  placeholder: '输入消息...',
  suggestions: () => ['你好！', '最近怎么样？', '聊聊天吧']
})

const emit = defineEmits<Emits>()

// 响应式数据
const localMessage = ref('')
const showEmojiPicker = ref(false)
const showMentions = ref(false)
const mentionPosition = ref({ x: 0, y: 0 })
const showHints = ref(true)

// 输入提示轮播
const hints = [
  'Enter发送，Shift+Enter换行',
  '支持@提及角色名称',
  '可以上传图片进行讨论',
  '长按语音按钮录音'
]
const currentHintIndex = ref(0)
const currentHint = computed(() => hints[currentHintIndex.value])

// 提及相关
const mentionableCharacters = ref<Character[]>([
  // 当前对话角色
  ...(props.character ? [props.character] : []),
  // 其他可提及的角色（从历史对话或收藏中获取）
])

// 计算属性
const canSend = computed(() => {
  return localMessage.value.trim().length > 0 &&
         !props.disabled &&
         localMessage.value.length <= props.maxLength
})

// 方法
const handleKeydown = (event: Event | KeyboardEvent) => {
  // 类型守卫：确保是 KeyboardEvent
  if (!(event instanceof KeyboardEvent)) return

  // Enter发送（移动端通常依赖发送按钮）
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
    event.preventDefault()
    handleSend()
  }

  // @ 提及检测
  if (event.key === '@') {
    setTimeout(() => {
      detectMention()
    }, 100)
  }
}

const handleInput = (value: string) => {
  localMessage.value = value
  emit('update:modelValue', value)

  // 检测@ 提及
  detectMention()
}

const handleSend = () => {
  if (!canSend.value) return

  const message = localMessage.value.trim()
  if (message) {
    emit('send', message)
    localMessage.value = ''

    // 触觉反馈（如果支持）
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }
}

const selectSuggestion = (suggestion: string) => {
  localMessage.value = suggestion
  emit('update:modelValue', suggestion)
  handleSend()
}

const insertEmoji = (emoji: string) => {
  const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || localMessage.value.length
  const before = localMessage.value.substring(0, cursorPos)
  const after = localMessage.value.substring(cursorPos)
  localMessage.value = before + emoji + after
  emit('update:modelValue', localMessage.value)
  showEmojiPicker.value = false
}

const detectMention = () => {
  const textarea = document.activeElement as HTMLTextAreaElement
  if (!textarea) return

  const cursorPos = textarea.selectionStart
  const textBeforeCursor = localMessage.value.substring(0, cursorPos)
  const atMatch = textBeforeCursor.match(/@(\w*)$/)

  if (atMatch) {
    // 显示提及面板
    showMentions.value = true
    // 计算面板位置（简化版）
    mentionPosition.value = { x: 50, y: 100 }
  } else {
    showMentions.value = false
  }
}

const insertMention = (character: Character) => {
  const textarea = document.activeElement as HTMLTextAreaElement
  if (!textarea) return

  const cursorPos = textarea.selectionStart
  const textBeforeCursor = localMessage.value.substring(0, cursorPos)
  const textAfterCursor = localMessage.value.substring(cursorPos)

  // 替换@部分
  const atMatch = textBeforeCursor.match(/@(\w*)$/)
  if (atMatch) {
    const beforeAt = textBeforeCursor.substring(0, atMatch.index)
    localMessage.value = beforeAt + `@${character.name} ` + textAfterCursor
    emit('update:modelValue', localMessage.value)
  }

  showMentions.value = false
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localMessage.value) {
    localMessage.value = newValue
  }
})

// 提示轮播
let hintInterval: NodeJS.Timeout
const startHintRotation = () => {
  hintInterval = setInterval(() => {
    currentHintIndex.value = (currentHintIndex.value + 1) % hints.length
  }, 3000)
}

const stopHintRotation = () => {
  if (hintInterval) {
    clearInterval(hintInterval)
  }
}

// 在有内容时隐藏提示
watch(localMessage, (newValue) => {
  if (newValue.trim()) {
    showHints.value = false
    stopHintRotation()
  } else {
    showHints.value = true
    startHintRotation()
  }
})

// 组件挂载时开始提示轮播
nextTick(() => {
  startHintRotation()
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.chat-input-mobile {
  background: var(--surface);
  border-top: 1px solid var(--border-light);
}

.input-container {
  // 安全区域适配
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

.message-input {
  :deep(.el-textarea__inner) {
    border: 2px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 12px 16px;
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    resize: none;
    transition: var(--transition-colors);

    // 防止iOS缩放
    font-size: 16px;

    &:focus {
      border-color: var(--tavern-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    &::placeholder {
      color: var(--text-muted);
    }
  }
}

.tool-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  color: var(--text-secondary);

  &:hover {
    background: var(--surface-muted);
    color: var(--tavern-primary);
  }
}

.send-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--tavern-primary) 0%, var(--tavern-secondary) 100%);
  border: none;
  box-shadow: var(--shadow-md);
  transition: var(--transition-all);

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: var(--shadow-lg);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.suggestions {
  .suggestion-tag {
    background: var(--surface-muted);
    border: 1px solid var(--border-light);
    color: var(--text-secondary);
    transition: var(--transition-colors);

    &:hover {
      background: var(--tavern-primary);
      color: white;
      border-color: var(--tavern-primary);
    }
  }
}

.hints {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// 响应式调整
@media (max-width: 640px) {
  .tool-btn {
    width: 32px;
    height: 32px;
  }

  .send-btn {
    width: 44px;
    height: 44px;
  }
}

// 支持iPhone X等设备的安全区域
@supports (padding: max(0px)) {
  .input-container {
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
  }
}
</style>
