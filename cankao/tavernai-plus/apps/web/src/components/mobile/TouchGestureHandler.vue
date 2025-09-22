<template>
  <div
    ref="gestureElement"
    class="touch-gesture-handler"
    :class="{
      'gesture-active': isPressed,
      'touch-feedback': enableFeedback && isPressed,
      'no-select': preventSelection
    }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
    @click="handleClick"
  >
    <slot />

    <!-- 触摸反馈涟漪效果 -->
    <div
      v-if="showRipple && rippleVisible"
      class="touch-ripple"
      :style="rippleStyle"
    />

    <!-- 长按进度指示器 -->
    <div
      v-if="showLongPressIndicator && longPressProgress > 0"
      class="long-press-indicator"
    >
      <div
        class="progress-ring"
        :style="{ '--progress': longPressProgress }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

interface Props {
  // 手势配置
  swipeThreshold?: number          // 滑动最小距离
  swipeVelocityThreshold?: number  // 滑动最小速度
  longPressDelay?: number          // 长按延迟时间
  longPressThreshold?: number      // 长按允许的最大移动距离
  doubleTapDelay?: number          // 双击最大间隔时间
  doubleTapThreshold?: number      // 双击允许的最大距离

  // 视觉反馈
  enableFeedback?: boolean         // 启用触摸反馈
  showRipple?: boolean            // 显示涟漪效果
  showLongPressIndicator?: boolean // 显示长按进度指示器
  rippleColor?: string            // 涟漪颜色

  // 行为配置
  preventSelection?: boolean       // 防止文本选择
  preventScroll?: boolean         // 防止滚动
  preventDefault?: boolean        // 阻止默认行为
  stopPropagation?: boolean       // 阻止事件冒泡

  // 禁用状态
  disabled?: boolean              // 禁用所有手势
}

const props = withDefaults(defineProps<Props>(), {
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  longPressDelay: 500,
  longPressThreshold: 10,
  doubleTapDelay: 300,
  doubleTapThreshold: 20,
  enableFeedback: true,
  showRipple: true,
  showLongPressIndicator: true,
  rippleColor: 'rgba(0, 0, 0, 0.1)',
  preventSelection: true,
  preventScroll: false,
  preventDefault: false,
  stopPropagation: false,
  disabled: false
})

const emit = defineEmits<{
  // 基础触摸事件
  'touch-start': [event: TouchEvent]
  'touch-move': [event: TouchEvent]
  'touch-end': [event: TouchEvent]
  'touch-cancel': [event: TouchEvent]

  // 手势事件
  'tap': [point: TouchPoint]
  'double-tap': [point: TouchPoint, interval: number]
  'long-press': [point: TouchPoint, duration: number]
  'swipe': [swipe: SwipeEvent]

  // 兼容事件
  'click': [event: MouseEvent]
}>()

// 引用
const gestureElement = ref<HTMLElement>()

// 状态
const isPressed = ref(false)
const touchStart = ref<TouchPoint | null>(null)
const lastTap = ref<TouchPoint | null>(null)
const longPressTimer = ref<NodeJS.Timeout | null>(null)
const longPressProgress = ref(0)
const longPressAnimationFrame = ref<number>(0)

// 涟漪效果状态
const rippleVisible = ref(false)
const rippleX = ref(0)
const rippleY = ref(0)
const rippleSize = ref(0)

// 计算属性
const rippleStyle = computed(() => ({
  left: `${rippleX.value - rippleSize.value / 2}px`,
  top: `${rippleY.value - rippleSize.value / 2}px`,
  width: `${rippleSize.value}px`,
  height: `${rippleSize.value}px`,
  backgroundColor: props.rippleColor
}))

// 工具函数
const createTouchPoint = (touch: Touch): TouchPoint => ({
  x: touch.clientX,
  y: touch.clientY,
  timestamp: Date.now()
})

const getDistance = (point1: TouchPoint, point2: TouchPoint): number => {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

const getSwipeDirection = (start: TouchPoint, end: TouchPoint): SwipeEvent['direction'] => {
  const dx = end.x - start.x
  const dy = end.y - start.y

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  } else {
    return dy > 0 ? 'down' : 'up'
  }
}

// 涟漪效果
const showRippleEffect = (x: number, y: number) => {
  if (!props.showRipple || !gestureElement.value) return

  const rect = gestureElement.value.getBoundingClientRect()
  rippleX.value = x - rect.left
  rippleY.value = y - rect.top

  // 计算涟漪大小（覆盖整个元素）
  const maxDistance = Math.max(
    Math.sqrt(rippleX.value ** 2 + rippleY.value ** 2),
    Math.sqrt((rect.width - rippleX.value) ** 2 + rippleY.value ** 2),
    Math.sqrt(rippleX.value ** 2 + (rect.height - rippleY.value) ** 2),
    Math.sqrt((rect.width - rippleX.value) ** 2 + (rect.height - rippleY.value) ** 2)
  )
  rippleSize.value = maxDistance * 2

  rippleVisible.value = true

  // 自动隐藏涟漪
  setTimeout(() => {
    rippleVisible.value = false
  }, 600)
}

// 长按进度动画
const startLongPressProgress = () => {
  if (!props.showLongPressIndicator) return

  const startTime = Date.now()
  const animate = () => {
    const elapsed = Date.now() - startTime
    longPressProgress.value = Math.min(elapsed / props.longPressDelay, 1)

    if (elapsed < props.longPressDelay && isPressed.value) {
      longPressAnimationFrame.value = requestAnimationFrame(animate)
    }
  }

  longPressAnimationFrame.value = requestAnimationFrame(animate)
}

const stopLongPressProgress = () => {
  if (longPressAnimationFrame.value) {
    cancelAnimationFrame(longPressAnimationFrame.value)
    longPressAnimationFrame.value = 0
  }
  longPressProgress.value = 0
}

// 清理长按定时器
const clearLongPressTimer = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  stopLongPressProgress()
}

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  if (props.disabled) return

  if (props.preventDefault) e.preventDefault()
  if (props.stopPropagation) e.stopPropagation()

  emit('touch-start', e)

  if (e.touches.length === 1) {
    const touch = e.touches[0]
    const point = createTouchPoint(touch)

    touchStart.value = point
    isPressed.value = true

    // 显示涟漪效果
    if (props.enableFeedback) {
      showRippleEffect(touch.clientX, touch.clientY)
    }

    // 触觉反馈
    if ('vibrate' in navigator && props.enableFeedback) {
      navigator.vibrate(10)
    }

    // 设置长按定时器
    longPressTimer.value = setTimeout(() => {
      if (isPressed.value && touchStart.value) {
        emit('long-press', touchStart.value, props.longPressDelay)

        // 长按触觉反馈
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      }
    }, props.longPressDelay)

    // 开始长按进度动画
    startLongPressProgress()

    // 检查双击
    if (lastTap.value) {
      const timeDiff = point.timestamp - lastTap.value.timestamp
      const distance = getDistance(lastTap.value, point)

      if (timeDiff <= props.doubleTapDelay && distance <= props.doubleTapThreshold) {
        clearLongPressTimer()
        emit('double-tap', point, timeDiff)

        // 双击触觉反馈
        if ('vibrate' in navigator) {
          navigator.vibrate([25, 25, 25])
        }

        lastTap.value = null
        return
      }
    }
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (props.disabled || !isPressed.value || !touchStart.value) return

  if (props.preventScroll) e.preventDefault()
  if (props.stopPropagation) e.stopPropagation()

  emit('touch-move', e)

  if (e.touches.length === 1) {
    const touch = e.touches[0]
    const currentPoint = createTouchPoint(touch)
    const distance = getDistance(touchStart.value, currentPoint)

    // 如果移动距离超过阈值，取消长按
    if (distance > props.longPressThreshold) {
      clearLongPressTimer()
    }
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (props.disabled) return

  if (props.preventDefault) e.preventDefault()
  if (props.stopPropagation) e.stopPropagation()

  emit('touch-end', e)

  if (isPressed.value && touchStart.value) {
    clearLongPressTimer()

    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const endPoint = createTouchPoint(touch)
      const distance = getDistance(touchStart.value, endPoint)
      const duration = endPoint.timestamp - touchStart.value.timestamp
      const velocity = distance / duration

      // 检查滑动手势
      if (distance >= props.swipeThreshold && velocity >= props.swipeVelocityThreshold) {
        const direction = getSwipeDirection(touchStart.value, endPoint)
        emit('swipe', {
          direction,
          distance,
          velocity,
          duration
        })
      } else {
        // 简单点击
        emit('tap', endPoint)
        lastTap.value = endPoint
      }
    }
  }

  isPressed.value = false
  touchStart.value = null
}

const handleTouchCancel = (e: TouchEvent) => {
  if (props.disabled) return

  if (props.preventDefault) e.preventDefault()
  if (props.stopPropagation) e.stopPropagation()

  emit('touch-cancel', e)

  clearLongPressTimer()
  isPressed.value = false
  touchStart.value = null
}

// 兼容鼠标点击事件
const handleClick = (e: MouseEvent) => {
  if (props.disabled) return

  // 防止双重触发（触摸设备上会同时触发 touch 和 click 事件）
  if (e.detail === 0) {
    emit('click', e)
  }
}

// 生命周期
onUnmounted(() => {
  clearLongPressTimer()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.touch-gesture-handler {
  position: relative;
  user-select: auto;
  -webkit-user-select: auto;
  -webkit-touch-callout: default;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &.no-select {
    @include no-select;
  }

  &.gesture-active {
    &.touch-feedback {
      transform: scale(0.98);
      transition: transform 0.1s ease-out;
    }
  }

  // 确保子元素的点击事件正常工作
  * {
    pointer-events: auto;
  }
}

.touch-ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
  z-index: 1;
}

.long-press-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;

  .progress-ring {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: conic-gradient(
      $primary-500 calc(var(--progress) * 360deg),
      rgba($primary-500, 0.2) 0deg
    );
    opacity: 0.8;
    transition: opacity 0.2s ease;

    &::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      background: white;
      border-radius: 50%;
    }
  }
}

@keyframes ripple-animation {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .touch-gesture-handler {
    &.gesture-active.touch-feedback {
      transform: none;
      transition: none;
    }
  }

  .touch-ripple {
    animation: none;
    display: none;
  }

  .long-press-indicator .progress-ring {
    transition: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .long-press-indicator .progress-ring {
    background: conic-gradient(
      black calc(var(--progress) * 360deg),
      rgba(black, 0.3) 0deg
    );
  }
}
</style>