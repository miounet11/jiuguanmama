<template>
  <div
    class="typing-indicator"
    :class="indicatorClasses"
  >
    <!-- 打字动画点 -->
    <div class="typing-dots">
      <span
        v-for="i in 3"
        :key="i"
        class="typing-dot"
        :style="{ animationDelay: `${(i - 1) * 0.16}s` }"
      />
    </div>

    <!-- 打字文本 -->
    <div v-if="showText" class="typing-text">
      <span v-if="characterName">{{ characterName }} </span>
      正在输入...
    </div>

    <!-- 流式打字效果 -->
    <div v-if="streamingText" class="streaming-text">
      <span
        v-for="(char, index) in displayedChars"
        :key="index"
        class="streaming-char"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        {{ char }}
      </span>
      <span class="cursor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

// Types
export interface TypingIndicatorProps {
  // 显示模式
  variant?: 'dots' | 'text' | 'streaming' | 'minimal'

  // 尺寸
  size?: 'xs' | 'sm' | 'md' | 'lg'

  // 角色信息
  characterName?: string
  characterAvatar?: string

  // 流式文本
  streamingText?: string

  // 显示选项
  showText?: boolean
  showAvatar?: boolean

  // 自定义文本
  customText?: string

  // 动画速度
  animationSpeed?: 'slow' | 'normal' | 'fast'

  // 颜色主题
  theme?: 'default' | 'primary' | 'secondary' | 'muted'
}

// Props
const props = withDefaults(defineProps<TypingIndicatorProps>(), {
  variant: 'dots',
  size: 'md',
  showText: true,
  showAvatar: false,
  animationSpeed: 'normal',
  theme: 'default'
})

// State
const displayedChars = ref<string[]>([])
const streamingIndex = ref(0)
const intervalId = ref<number | null>(null)

// Computed
const indicatorClasses = computed(() => [
  `typing-indicator--${props.variant}`,
  `typing-indicator--${props.size}`,
  `typing-indicator--${props.animationSpeed}`,
  `typing-indicator--${props.theme}`,
  {
    'typing-indicator--with-avatar': props.showAvatar,
    'typing-indicator--minimal': props.variant === 'minimal'
  }
])

const animationDuration = computed(() => {
  switch (props.animationSpeed) {
    case 'slow': return '2s'
    case 'fast': return '0.8s'
    default: return '1.4s'
  }
})

const typingDelay = computed(() => {
  switch (props.animationSpeed) {
    case 'slow': return 100
    case 'fast': return 30
    default: return 50
  }
})

// Methods
const startStreamingAnimation = () => {
  if (!props.streamingText) return

  displayedChars.value = []
  streamingIndex.value = 0

  const chars = props.streamingText.split('')

  intervalId.value = window.setInterval(() => {
    if (streamingIndex.value < chars.length) {
      displayedChars.value.push(chars[streamingIndex.value])
      streamingIndex.value++
    } else {
      clearStreamingAnimation()
    }
  }, typingDelay.value)
}

const clearStreamingAnimation = () => {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

// Watchers
watch(() => props.streamingText, (newText) => {
  if (newText && props.variant === 'streaming') {
    clearStreamingAnimation()
    setTimeout(() => {
      startStreamingAnimation()
    }, 100)
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.streamingText && props.variant === 'streaming') {
    startStreamingAnimation()
  }
})

onUnmounted(() => {
  clearStreamingAnimation()
})
</script>

<style lang="scss" scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  // === 尺寸变体 ===
  &--xs {
    --typing-dot-size: 3px;
    --typing-gap: var(--space-1);
    --typing-font-size: var(--text-2xs);
  }

  &--sm {
    --typing-dot-size: 4px;
    --typing-gap: var(--space-1-5);
    --typing-font-size: var(--text-xs);
  }

  &--md {
    --typing-dot-size: 6px;
    --typing-gap: var(--space-2);
    --typing-font-size: var(--text-sm);
  }

  &--lg {
    --typing-dot-size: 8px;
    --typing-gap: var(--space-3);
    --typing-font-size: var(--text-base);
  }

  // === 主题变体 ===
  &--default {
    --typing-color: var(--text-tertiary);
    --typing-text-color: var(--text-secondary);
  }

  &--primary {
    --typing-color: var(--tavern-primary);
    --typing-text-color: var(--tavern-primary);
  }

  &--secondary {
    --typing-color: var(--tavern-secondary);
    --typing-text-color: var(--tavern-secondary);
  }

  &--muted {
    --typing-color: var(--text-quaternary);
    --typing-text-color: var(--text-quaternary);
  }

  // === 动画速度 ===
  &--slow {
    --typing-animation-duration: 2s;
  }

  &--normal {
    --typing-animation-duration: 1.4s;
  }

  &--fast {
    --typing-animation-duration: 0.8s;
  }

  // === 布局变体 ===
  &--minimal {
    gap: var(--space-1);

    .typing-text {
      display: none;
    }
  }

  &--with-avatar {
    padding-left: var(--space-1);
  }
}

// === 打字点动画 ===
.typing-dots {
  display: flex;
  align-items: center;
  gap: var(--typing-gap);

  .typing-dot {
    width: var(--typing-dot-size);
    height: var(--typing-dot-size);
    background: var(--typing-color);
    border-radius: var(--radius-full);
    animation: typing-bounce var(--typing-animation-duration) infinite ease-in-out;

    // 创建波浪效果，每个点有不同的延迟
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.16s; }
    &:nth-child(3) { animation-delay: 0.32s; }
  }
}

// === 打字文本 ===
.typing-text {
  font-size: var(--typing-font-size);
  color: var(--typing-text-color);
  font-weight: var(--font-medium);
  white-space: nowrap;

  // 微妙的呼吸动画
  animation: text-pulse 2s infinite ease-in-out;
}

// === 流式文本动画 ===
.streaming-text {
  font-size: var(--typing-font-size);
  color: var(--typing-text-color);
  display: flex;

  .streaming-char {
    opacity: 0;
    animation: char-appear 0.3s ease-out forwards;
  }

  .cursor {
    width: 2px;
    height: 1em;
    background: var(--typing-color);
    margin-left: var(--space-1);
    animation: cursor-blink 1s infinite;
  }
}

// === 动画定义 ===

// 打字点跳跃动画
@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

// 文本呼吸动画
@keyframes text-pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

// 字符出现动画
@keyframes char-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 光标闪烁动画
@keyframes cursor-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

// === 特殊效果 ===

// 思考中的特殊动画
.typing-indicator--thinking {
  .typing-dots {
    .typing-dot {
      animation: thinking-pulse 1.5s infinite ease-in-out;

      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.3s; }
      &:nth-child(3) { animation-delay: 0.6s; }
    }
  }
}

@keyframes thinking-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
}

// 快速打字效果
.typing-indicator--rapid {
  .typing-dots {
    .typing-dot {
      animation: rapid-typing 0.6s infinite ease-in-out;
    }
  }
}

@keyframes rapid-typing {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.5);
  }
}

// === 响应式设计 ===
@media (max-width: 768px) {
  .typing-indicator {
    // 移动端稍微缩小
    &--md {
      --typing-dot-size: 5px;
      --typing-font-size: var(--text-xs);
    }

    &--lg {
      --typing-dot-size: 6px;
      --typing-font-size: var(--text-sm);
    }

    .typing-text {
      font-size: var(--text-xs);
    }
  }
}

// === 可访问性 ===
@media (prefers-reduced-motion: reduce) {
  .typing-indicator {
    .typing-dot {
      animation: none;
      opacity: 0.7;
    }

    .typing-text {
      animation: none;
      opacity: 1;
    }

    .streaming-char {
      animation: none;
      opacity: 1;
    }

    .cursor {
      animation: none;
      opacity: 1;
    }
  }
}

// === 高对比度模式 ===
@media (prefers-contrast: high) {
  .typing-indicator {
    --typing-color: var(--text-primary);
    --typing-text-color: var(--text-primary);
  }
}

// === 暗色主题优化 ===
[data-theme="dark"] {
  .typing-indicator {
    &--default {
      --typing-color: var(--text-secondary);
      --typing-text-color: var(--text-tertiary);
    }
  }
}

// === 实用工具类 ===
.typing-indicator-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--surface-3);
  border-radius: var(--message-radius);
  border: var(--space-px) solid var(--border-secondary);

  &--floating {
    position: fixed;
    bottom: var(--space-4);
    left: var(--space-4);
    z-index: var(--z-floating);
    box-shadow: var(--card-shadow);
  }

  &--inline {
    display: inline-flex;
    background: transparent;
    border: none;
    padding: 0;
  }
}
</style>