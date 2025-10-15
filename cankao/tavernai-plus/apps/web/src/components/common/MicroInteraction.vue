<template>
  <div
    ref="elementRef"
    class="micro-interaction"
    :class="[
      `micro-interaction--${type}`,
      {
        'micro-interaction--active': isActive,
        'micro-interaction--disabled': disabled
      }
    ]"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- 默认插槽 -->
    <slot />

    <!-- 涟漪效果 -->
    <div
      v-if="enableRipple && ripples.length"
      class="ripple-container"
    >
      <div
        v-for="ripple in ripples"
        :key="ripple.id"
        class="ripple"
        :style="{
          left: `${ripple.x}px`,
          top: `${ripple.y}px`,
          width: `${ripple.size}px`,
          height: `${ripple.size}px`
        }"
      />
    </div>

    <!-- 波浪效果 -->
    <div
      v-if="enableWave && waveActive"
      class="wave"
    />

    <!-- 光晕效果 -->
    <div
      v-if="enableGlow && glowActive"
      class="glow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAnimations, ANIMATION_PRESETS } from '@/composables/useAnimations'
import { useMobileOptimization } from '@/composables/useMobileOptimization'

interface RippleEffect {
  id: number
  x: number
  y: number
  size: number
}

interface Props {
  type?: 'button' | 'card' | 'list-item' | 'icon' | 'input'
  disabled?: boolean
  scale?: number
  duration?: number
  enableRipple?: boolean
  enableWave?: boolean
  enableGlow?: boolean
  enableHaptic?: boolean
  enableSound?: boolean
  color?: string
  onClick?: () => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  disabled: false,
  scale: 1,
  duration: 300,
  enableRipple: true,
  enableWave: false,
  enableGlow: false,
  enableHaptic: true,
  enableSound: false,
  color: 'primary'
})

const emit = defineEmits<{
  'click': [event: Event]
  'hover': []
  'leave': []
  'activate': []
  'deactivate': []
}>()

// 动画和移动端优化
const { pulse, shake, fadeIn, bounceIn } = useAnimations()
const { triggerHapticFeedback, isMobile } = useMobileOptimization()

// 引用
const elementRef = ref<HTMLElement>()

// 状态
const isActive = ref(false)
const ripples = ref<RippleEffect[]>([])
const waveActive = ref(false)
const glowActive = ref(false)
const nextRippleId = ref(0)

// 计算属性
const animationConfig = computed(() => ({
  duration: props.duration,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
}))

// 创建涟漪效果
const createRipple = (event: MouseEvent | TouchEvent) => {
  if (!props.enableRipple || props.disabled) return

  const rect = elementRef.value?.getBoundingClientRect()
  if (!rect) return

  let clientX: number, clientY: number

  if ('touches' in event) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }

  const x = clientX - rect.left
  const y = clientY - rect.top
  const size = Math.max(rect.width, rect.height) * 2

  const ripple: RippleEffect = {
    id: nextRippleId.value++,
    x,
    y,
    size
  }

  ripples.value.push(ripple)

  // 自动移除涟漪
  setTimeout(() => {
    const index = ripples.value.findIndex(r => r.id === ripple.id)
    if (index > -1) {
      ripples.value.splice(index, 1)
    }
  }, props.duration)
}

// 触发波浪效果
const triggerWave = () => {
  if (!props.enableWave || props.disabled) return

  waveActive.value = true
  setTimeout(() => {
    waveActive.value = false
  }, props.duration)
}

// 触发光晕效果
const triggerGlow = () => {
  if (!props.enableGlow || props.disabled) return

  glowActive.value = true
  setTimeout(() => {
    glowActive.value = false
  }, props.duration * 1.5)
}

// 播放声音效果
const playSound = (type: 'click' | 'hover' | 'success' | 'error' = 'click') => {
  if (!props.enableSound || typeof window === 'undefined') return

  try {
    const audio = new Audio()
    // 这里可以根据type播放不同的声音文件
    // audio.src = `/sounds/${type}.mp3`
    // audio.play()
  } catch (error) {
    console.warn('音效播放失败:', error)
  }
}

// 事件处理
const handleClick = async (event: Event) => {
  if (props.disabled) return

  createRipple(event)
  triggerWave()
  triggerHapticFeedback('light')
  playSound('click')

  // 添加点击动画
  if (elementRef.value) {
    pulse(elementRef, 0.95, animationConfig.value)
  }

  isActive.value = true
  emit('click', event)
  emit('activate')

  if (props.onClick) {
    await props.onClick()
  }

  setTimeout(() => {
    isActive.value = false
    emit('deactivate')
  }, props.duration)
}

const handleMouseEnter = () => {
  if (props.disabled || isMobile.value) return

  triggerGlow()
  playSound('hover')
  emit('hover')

  if (elementRef.value) {
    elementRef.value.style.transform = `scale(${props.scale * 1.05})`
  }
}

const handleMouseLeave = () => {
  if (props.disabled || isMobile.value) return

  emit('leave')

  if (elementRef.value) {
    elementRef.value.style.transform = `scale(${props.scale})`
  }
}

const handleTouchStart = (event: TouchEvent) => {
  if (props.disabled) return

  createRipple(event)
  isActive.value = true

  if (elementRef.value) {
    elementRef.value.style.transform = `scale(${props.scale * 0.95})`
  }
}

const handleTouchEnd = () => {
  if (props.disabled) return

  isActive.value = false

  if (elementRef.value) {
    elementRef.value.style.transform = `scale(${props.scale})`
  }
}

// 触发震动反馈
const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (props.enableHaptic) {
    useMobileOptimization().triggerHapticFeedback(type)
  }
}

// 错误震动
const shakeError = () => {
  if (elementRef.value && !props.disabled) {
    shake(elementRef.value, 10, { duration: 300 })
    triggerHapticFeedback('warning')
    playSound('error')
  }
}

// 成功弹跳
const bounceSuccess = () => {
  if (elementRef.value && !props.disabled) {
    bounceIn(elementRef.value, { duration: 400 })
    triggerHapticFeedback('success')
    playSound('success')
  }
}

// 加载状态
const setLoading = (loading: boolean) => {
  if (elementRef.value) {
    if (loading) {
      elementRef.value.classList.add('loading')
      elementRef.value.style.pointerEvents = 'none'
    } else {
      elementRef.value.classList.remove('loading')
      elementRef.value.style.pointerEvents = ''
    }
  }
}

// 暴露方法
defineExpose({
  shakeError,
  bounceSuccess,
  setLoading,
  pulse: () => elementRef.value && pulse(elementRef.value, props.scale),
  glow: () => triggerGlow(),
  wave: () => triggerWave()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.micro-interaction {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform v-bind(duration + 'ms') ease;
  overflow: hidden;

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &--active {
    transform: scale(v-bind(scale * 0.95));
  }

  // 不同类型的样式
  &--button {
    border-radius: 12px;
    background: rgba($primary-500, 0.1);
    border: 1px solid rgba($primary-500, 0.2);
    color: $primary-400;
    padding: 12px 24px;
    font-weight: 500;

    &:hover:not(.micro-interaction--disabled) {
      background: rgba($primary-500, 0.15);
      border-color: rgba($primary-500, 0.3);
    }
  }

  &--card {
    border-radius: 16px;
    background: $dark-bg-secondary;
    border: 1px solid rgba($gray-600, 0.2);
    transition: all v-bind(duration + 'ms') ease;

    &:hover:not(.micro-interaction--disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: rgba($primary-500, 0.2);
    }
  }

  &--list-item {
    border-radius: 12px;
    padding: 16px;
    margin: 4px 0;
    transition: all v-bind(duration + 'ms') ease;

    &:hover:not(.micro-interaction--disabled) {
      background: rgba($primary-500, 0.05);
      transform: translateX(4px);
    }
  }

  &--icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba($gray-700, 0.3);

    &:hover:not(.micro-interaction--disabled) {
      background: rgba($primary-500, 0.1);
      color: $primary-400;
    }
  }

  &--input {
    border-radius: 12px;
    border: 2px solid rgba($gray-600, 0.3);
    background: $dark-bg-secondary;
    transition: all v-bind(duration + 'ms') ease;

    &:focus-within {
      border-color: $primary-500;
      box-shadow: 0 0 0 3px rgba($primary-500, 0.1);
    }
  }
}

// 涟漪效果
.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba($primary-500, 0.3);
  transform: translate(-50%, -50%) scale(0);
  animation: ripple-animation v-bind(duration + 'ms') ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

// 波浪效果
.wave {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba($primary-500, 0.2) 0%, transparent 70%);
  border-radius: inherit;
  animation: wave-animation v-bind(duration + 'ms') ease-out;
  pointer-events: none;
}

@keyframes wave-animation {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

// 光晕效果
.glow {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: radial-gradient(circle at center, rgba($primary-500, 0.4) 0%, transparent 60%);
  border-radius: inherit;
  filter: blur(8px);
  animation: glow-animation v-bind(duration * 1.5 + 'ms') ease-in-out;
  pointer-events: none;
}

@keyframes glow-animation {
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

// 加载状态
.loading {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid rgba($primary-500, 0.2);
    border-top-color: $primary-500;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 移动端优化
@media (hover: none) and (pointer: coarse) {
  .micro-interaction {
    &:hover {
      transform: none;
      background: none;
      border-color: inherit;
    }
  }

  .glow {
    display: none;
  }
}

// 高分辨率屏幕优化
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .ripple {
    background: rgba($primary-500, 0.25);
  }

  .wave {
    background: radial-gradient(circle at center, rgba($primary-500, 0.15) 0%, transparent 70%);
  }
}
</style>