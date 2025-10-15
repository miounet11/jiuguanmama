<template>
  <div
    ref="touchElement"
    class="enhanced-touch-handler"
    :class="{
      'touch-active': isActive,
      'touch-disabled': disabled,
      'touch-feedback': enableFeedback && isActive,
      'no-select': preventSelection
    }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
    @mousedown="handleMouseDown"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <slot />

    <!-- 触摸反馈层 -->
    <div
      v-if="showFeedback && feedbackVisible"
      class="touch-feedback-layer"
      :style="feedbackStyle"
    />

    <!-- 涟漪效果 -->
    <div
      v-if="showRipple && rippleVisible"
      class="touch-ripple"
      :style="rippleStyle"
    />

    <!-- 长按进度环 -->
    <div
      v-if="showLongPressIndicator && longPressProgress > 0"
      class="long-progress-indicator"
    >
      <svg class="progress-ring" width="40" height="40">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          stroke-width="3"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="100.48"
          :stroke-dashoffset="100.48 * (1 - longPressProgress)"
          class="progress-circle"
        />
      </svg>
    </div>

    <!-- 双击指示器 -->
    <div v-if="showDoubleTapIndicator && doubleTapIndicatorVisible" class="double-tap-indicator">
      <div class="double-tap-dot" />
      <div class="double-tap-dot" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEnhancedResponsive } from '@/composables/useEnhancedResponsive'

// 触摸点接口
interface TouchPoint {
  x: number
  y: number
  timestamp: number
  force?: number
}

// 滑动手势接口
interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
  angle: number
}

// 缩放手势接口
interface PinchGesture {
  scale: number
  centerX: number
  centerY: number
  distance: number
  velocity: number
}

// 旋转手势接口
interface RotateGesture {
  angle: number
  centerX: number
  centerY: number
  velocity: number
}

// Props定义
interface Props {
  // 基础手势配置
  swipeThreshold?: number          // 滑动最小距离 (px)
  swipeVelocityThreshold?: number  // 滑动最小速度 (px/ms)
  longPressDelay?: number          // 长按延迟时间 (ms)
  longPressThreshold?: number      // 长按允许的最大移动距离 (px)
  doubleTapDelay?: number          // 双击最大间隔时间 (ms)
  doubleTapThreshold?: number      // 双击允许的最大距离 (px)

  // 高级手势配置
  pinchThreshold?: number          // 缩放手势最小距离 (px)
  rotateThreshold?: number         // 旋转手势最小角度 (deg)
  multiTapCount?: number           // 多次连击次数
  multiTapDelay?: number           // 多次连击最大间隔时间 (ms)

  // 视觉反馈配置
  enableFeedback?: boolean         // 启用触摸反馈
  showRipple?: boolean            // 显示涟漪效果
  showLongPressIndicator?: boolean // 显示长按进度指示器
  showDoubleTapIndicator?: boolean // 显示双击指示器
  rippleColor?: string            // 涟漪颜色
  feedbackColor?: string          // 反馈层颜色
  feedbackScale?: number          // 反馈层缩放比例

  // 行为配置
  preventSelection?: boolean       // 防止文本选择
  preventScroll?: boolean         // 防止滚动
  preventDefault?: boolean        // 阻止默认行为
  stopPropagation?: boolean       // 阻止事件冒泡
  passive?: boolean               // 使用被动事件监听器

  // 禁用状态
  disabled?: boolean              // 禁用所有手势

  // 手势启用开关
  enableSwipe?: boolean           // 启用滑动手势
  enableTap?: boolean             // 启用点击手势
  enableLongPress?: boolean       // 启用长按手势
  enableDoubleTap?: boolean       // 启用双击手势
  enablePinch?: boolean           // 启用缩放手势
  enableRotate?: boolean          // 启用旋转手势
  enableMultiTap?: boolean        // 启用多次连击
}

const props = withDefaults(defineProps<Props>(), {
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  longPressDelay: 500,
  longPressThreshold: 10,
  doubleTapDelay: 300,
  doubleTapThreshold: 20,
  pinchThreshold: 20,
  rotateThreshold: 15,
  multiTapCount: 3,
  multiTapDelay: 400,
  enableFeedback: true,
  showRipple: true,
  showLongPressIndicator: true,
  showDoubleTapIndicator: true,
  rippleColor: 'rgba(0, 0, 0, 0.1)',
  feedbackColor: 'rgba(0, 0, 0, 0.05)',
  feedbackScale: 0.95,
  preventSelection: true,
  preventScroll: false,
  preventDefault: false,
  stopPropagation: false,
  passive: true,
  disabled: false,
  enableSwipe: true,
  enableTap: true,
  enableLongPress: true,
  enableDoubleTap: true,
  enablePinch: false,
  enableRotate: false,
  enableMultiTap: false,
})

// 事件定义
const emit = defineEmits<{
  // 基础触摸事件
  'touch-start': [event: TouchEvent, point: TouchPoint]
  'touch-move': [event: TouchEvent, point: TouchPoint]
  'touch-end': [event: TouchEvent, point: TouchPoint]
  'touch-cancel': [event: TouchEvent]

  // 基础手势事件
  'tap': [point: TouchPoint, force?: number]
  'double-tap': [point: TouchPoint, interval: number]
  'long-press': [point: TouchPoint, duration: number]
  'swipe': [gesture: SwipeGesture]

  // 高级手势事件
  'pinch': [gesture: PinchGesture]
  'rotate': [gesture: RotateGesture]
  'multi-tap': [point: TouchPoint, count: number]

  // 状态事件
  'gesture-start': [gestureType: string]
  'gesture-end': [gestureType: string]
  'gesture-cancel': [gestureType: string]

  // 兼容鼠标事件
  'click': [event: MouseEvent]
  'context-menu': [event: MouseEvent]
}>()

// 响应式Hook
const { isTouchDevice, getTouchSize } = useEnhancedResponsive()

// 引用
const touchElement = ref<HTMLElement>()

// 状态管理
const isActive = ref(false)
const isPressed = ref(false)
const gestureInProgress = ref(false)
const currentGestureType = ref('')

// 触摸点追踪
const touchStart = ref<TouchPoint | null>(null)
const lastTouch = ref<TouchPoint | null>(null)
const touchHistory = ref<TouchPoint[]>([])

// 多点触摸
const multiTouchPoints = ref<TouchPoint[]>([])
const initialPinchDistance = ref(0)
const initialRotateAngle = ref(0)

// 定时器
const longPressTimer = ref<NodeJS.Timeout | null>(null)
const multiTapTimer = ref<NodeJS.Timeout | null>(null)
const animationFrameId = ref<number>(0)

// 进度追踪
const longPressProgress = ref(0)
const multiTapCount = ref(0)

// 视觉效果状态
const feedbackVisible = ref(false)
const rippleVisible = ref(false)
const doubleTapIndicatorVisible = ref(false)

// 位置和尺寸
const feedbackX = ref(0)
const feedbackY = ref(0)
const rippleX = ref(0)
const rippleY = ref(0)
const rippleSize = ref(0)

// 计算属性
const touchTargetSize = computed(() => getTouchSize(44))

const feedbackStyle = computed(() => ({
  left: `${feedbackX.value}px`,
  top: `${feedbackY.value}px`,
  width: `${touchTargetSize.value}px`,
  height: `${touchTargetSize.value}px`,
  backgroundColor: props.feedbackColor,
  transform: `translate(-50%, -50%) scale(${props.feedbackScale})`,
}))

const rippleStyle = computed(() => ({
  left: `${rippleX.value}px`,
  top: `${rippleY.value}px`,
  width: `${rippleSize.value}px`,
  height: `${rippleSize.value}px`,
  backgroundColor: props.rippleColor,
}))

// 工具函数
const createTouchPoint = (touch: Touch): TouchPoint => ({
  x: touch.clientX,
  y: touch.clientY,
  timestamp: performance.now(),
  force: (touch as any).force || 0,
})

const getDistance = (point1: TouchPoint, point2: TouchPoint): number => {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

const getAngle = (point1: TouchPoint, point2: TouchPoint): number => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI
}

const getVelocity = (point1: TouchPoint, point2: TouchPoint): number => {
  const distance = getDistance(point1, point2)
  const duration = point2.timestamp - point1.timestamp
  return duration > 0 ? distance / duration : 0
}

const getSwipeDirection = (start: TouchPoint, end: TouchPoint): SwipeGesture['direction'] => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  return Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up')
}

// 长按进度动画
const startLongPressProgress = () => {
  if (!props.showLongPressIndicator) return

  const startTime = performance.now()
  const animate = () => {
    const elapsed = performance.now() - startTime
    longPressProgress.value = Math.min(elapsed / props.longPressDelay, 1)

    if (elapsed < props.longPressDelay && isPressed.value) {
      animationFrameId.value = requestAnimationFrame(animate)
    }
  }

  animationFrameId.value = requestAnimationFrame(animate)
}

const stopLongPressProgress = () => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = 0
  }
  longPressProgress.value = 0
}

// 涟漪效果
const showRippleEffect = (x: number, y: number) => {
  if (!props.showRipple || !touchElement.value) return

  const rect = touchElement.value.getBoundingClientRect()
  rippleX.value = x - rect.left
  rippleY.value = y - rect.top

  // 计算涟漪大小
  const maxDistance = Math.max(
    Math.sqrt(rippleX.value ** 2 + rippleY.value ** 2),
    Math.sqrt((rect.width - rippleX.value) ** 2 + rippleY.value ** 2),
    Math.sqrt(rippleX.value ** 2 + (rect.height - rippleY.value) ** 2),
    Math.sqrt((rect.width - rippleX.value) ** 2 + (rect.height - rippleY.value) ** 2)
  )
  rippleSize.value = maxDistance * 2

  rippleVisible.value = true
  setTimeout(() => {
    rippleVisible.value = false
  }, 600)
}

// 触觉反馈
const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (!isTouchDevice.value || !('vibrate' in navigator)) return

  const patterns = {
    light: 10,
    medium: 25,
    heavy: 50,
  }

  navigator.vibrate(patterns[type])
}

// 清理定时器
const clearTimers = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  if (multiTapTimer.value) {
    clearTimeout(multiTapTimer.value)
    multiTapTimer.value = null
  }
  stopLongPressProgress()
}

// 手势检测
const detectSwipeGesture = (start: TouchPoint, end: TouchPoint): SwipeGesture | null => {
  if (!props.enableSwipe) return null

  const distance = getDistance(start, end)
  const velocity = getVelocity(start, end)
  const duration = end.timestamp - start.timestamp

  if (distance >= props.swipeThreshold && velocity >= props.swipeVelocityThreshold) {
    const direction = getSwipeDirection(start, end)
    const angle = getAngle(start, end)

    return {
      direction,
      distance,
      velocity,
      duration,
      angle,
    }
  }

  return null
}

const detectPinchGesture = (): PinchGesture | null => {
  if (!props.enablePinch || multiTouchPoints.value.length !== 2) return null

  const [point1, point2] = multiTouchPoints.value
  const currentDistance = getDistance(point1, point2)
  const scale = currentDistance / initialPinchDistance.value

  if (Math.abs(scale - 1) * 100 >= props.pinchThreshold) {
    return {
      scale,
      centerX: (point1.x + point2.x) / 2,
      centerY: (point1.y + point2.y) / 2,
      distance: currentDistance,
      velocity: 0, // 需要历史数据计算
    }
  }

  return null
}

const detectRotateGesture = (): RotateGesture | null => {
  if (!props.enableRotate || multiTouchPoints.value.length !== 2) return null

  const [point1, point2] = multiTouchPoints.value
  const currentAngle = getAngle(point1, point2)
  const angleDelta = currentAngle - initialRotateAngle.value

  if (Math.abs(angleDelta) >= props.rotateThreshold) {
    return {
      angle: angleDelta,
      centerX: (point1.x + point2.x) / 2,
      centerY: (point1.y + point2.y) / 2,
      velocity: 0, // 需要历史数据计算
    }
  }

  return null
}

// 事件处理器
const handleTouchStart = (e: TouchEvent) => {
  if (props.disabled) return

  if (props.preventDefault && !props.passive) e.preventDefault()
  if (props.stopPropagation) e.stopPropagation()

  isActive.value = true
  isPressed.value = true
  gestureInProgress.value = true

  const touches = Array.from(e.touches)

  if (touches.length === 1) {
    // 单点触摸
    const touch = touches[0]
    const point = createTouchPoint(touch)

    touchStart.value = point
    touchHistory.value = [point]

    // 视觉反馈
    if (props.enableFeedback) {
      feedbackX.value = touch.clientX
      feedbackY.value = touch.clientY
      feedbackVisible.value = true
      showRippleEffect(touch.clientX, touch.clientY)
      triggerHapticFeedback('light')
    }

    // 长按定时器
    if (props.enableLongPress) {
      longPressTimer.value = setTimeout(() => {
        if (isPressed.value && touchStart.value) {
          currentGestureType.value = 'long-press'
          emit('long-press', touchStart.value, props.longPressDelay)
          emit('gesture-start', 'long-press')
          triggerHapticFeedback('medium')
          startLongPressProgress()
        }
      }, props.longPressDelay)
    }

    emit('touch-start', e, point)
  } else if (touches.length === 2) {
    // 多点触摸
    multiTouchPoints.value = touches.map(createTouchPoint)
    initialPinchDistance.value = getDistance(multiTouchPoints.value[0], multiTouchPoints.value[1])
    initialRotateAngle.value = getAngle(multiTouchPoints.value[0], multiTouchPoints.value[1])
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (props.disabled || !gestureInProgress.value) return

  if (props.preventScroll && !props.passive) e.preventDefault()
  if (props.stopPropagation) e.stopPropagation()

  const touches = Array.from(e.touches)

  if (touches.length === 1 && touchStart.value) {
    const touch = touches[0]
    const currentPoint = createTouchPoint(touch)
    const distance = getDistance(touchStart.value, currentPoint)

    // 更新触摸历史
    touchHistory.value.push(currentPoint)
    if (touchHistory.value.length > 10) {
      touchHistory.value.shift()
    }

    // 检查是否取消长按
    if (distance > props.longPressThreshold && longPressTimer.value) {
      clearTimers()
    }

    // 检测高级手势
    if (props.enablePinch || props.enableRotate) {
      // 在单点移动时检测高级手势
      // (这里可以添加更多复杂的手势检测逻辑)
    }

    emit('touch-move', e, currentPoint)
  } else if (touches.length === 2) {
    // 多点触摸移动
    multiTouchPoints.value = touches.map(createTouchPoint)

    // 检测缩放手势
    if (props.enablePinch) {
      const pinchGesture = detectPinchGesture()
      if (pinchGesture) {
        currentGestureType.value = 'pinch'
        emit('pinch', pinchGesture)
        emit('gesture-start', 'pinch')
      }
    }

    // 检测旋转手势
    if (props.enableRotate) {
      const rotateGesture = detectRotateGesture()
      if (rotateGesture) {
        currentGestureType.value = 'rotate'
        emit('rotate', rotateGesture)
        emit('gesture-start', 'rotate')
      }
    }
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (props.disabled) return

  if (props.preventDefault && !props.passive) e.preventDefault()
  if (props.stopPropagation) e.stopPropagation()

  clearTimers()
  feedbackVisible.value = false

  const touches = Array.from(e.changedTouches)

  if (touches.length === 1 && touchStart.value) {
    const touch = touches[0]
    const endPoint = createTouchPoint(touch)

    // 检测滑动手势
    const swipeGesture = detectSwipeGesture(touchStart.value, endPoint)
    if (swipeGesture) {
      currentGestureType.value = 'swipe'
      emit('swipe', swipeGesture)
      emit('gesture-start', 'swipe')
      triggerHapticFeedback('medium')
    } else if (props.enableTap) {
      // 检测双击
      const timeDiff = endPoint.timestamp - (lastTouch.value?.timestamp || 0)
      const distance = lastTouch.value ? getDistance(lastTouch.value, endPoint) : Infinity

      if (timeDiff <= props.doubleTapDelay && distance <= props.doubleTapThreshold) {
        if (props.enableDoubleTap) {
          currentGestureType.value = 'double-tap'
          emit('double-tap', endPoint, timeDiff)
          emit('gesture-start', 'double-tap')
          triggerHapticFeedback('heavy')
          doubleTapIndicatorVisible.value = true
          setTimeout(() => {
            doubleTapIndicatorVisible.value = false
          }, 300)
        }
        lastTouch.value = null
      } else {
        // 单击
        currentGestureType.value = 'tap'
        emit('tap', endPoint, endPoint.force)
        emit('gesture-start', 'tap')
        lastTouch.value = endPoint

        // 检测多次连击
        if (props.enableMultiTap) {
          multiTapCount.value++
          if (multiTapTimer.value) {
            clearTimeout(multiTapTimer.value)
          }

          multiTapTimer.value = setTimeout(() => {
            if (multiTapCount.value >= props.multiTapCount) {
              emit('multi-tap', endPoint, multiTapCount.value)
              triggerHapticFeedback('heavy')
            }
            multiTapCount.value = 0
          }, props.multiTapDelay)
        }
      }
    }

    emit('touch-end', e, endPoint)
  }

  // 结束手势
  if (currentGestureType.value) {
    emit('gesture-end', currentGestureType.value)
    currentGestureType.value = ''
  }

  isPressed.value = false
  gestureInProgress.value = false
  touchStart.value = null
  multiTouchPoints.value = []
}

const handleTouchCancel = (e: TouchEvent) => {
  if (props.disabled) return

  clearTimers()
  feedbackVisible.value = false

  if (currentGestureType.value) {
    emit('gesture-cancel', currentGestureType.value)
    currentGestureType.value = ''
  }

  isPressed.value = false
  gestureInProgress.value = false
  touchStart.value = null
  multiTouchPoints.value = []

  emit('touch-cancel', e)
}

// 鼠标事件兼容
const handleMouseDown = (e: MouseEvent) => {
  if (!isTouchDevice.value) {
    isPressed.value = true
    if (props.enableFeedback) {
      feedbackX.value = e.clientX
      feedbackY.value = e.clientY
      feedbackVisible.value = true
    }
  }
}

const handleClick = (e: MouseEvent) => {
  if (props.disabled) return

  // 防止双重触发
  if (!isTouchDevice.value) {
    emit('click', e)
  }
}

const handleContextMenu = (e: MouseEvent) => {
  if (props.disabled) return
  emit('context-menu', e)
}

// 生命周期
onUnmounted(() => {
  clearTimers()
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
})
</script>

<style lang="scss" scoped>
.enhanced-touch-handler {
  position: relative;
  user-select: auto;
  -webkit-user-select: auto;
  -webkit-touch-callout: default;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  cursor: pointer;

  &.no-select {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  &.touch-disabled {
    pointer-events: none;
    opacity: 0.6;
  }

  &.touch-feedback {
    transition: transform 0.1s ease-out;

    &.touch-active {
      transform: scale(0.95);
    }
  }

  // 确保子元素可点击
  * {
    pointer-events: auto;
  }
}

.touch-feedback-layer {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 1;
  animation: feedback-press 0.2s ease-out;
}

.touch-ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple-expand 0.6s ease-out;
  pointer-events: none;
  z-index: 1;
}

.long-progress-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
  color: var(--primary-color);

  .progress-ring {
    animation: progress-pulse 1s ease-in-out infinite;
  }

  .progress-circle {
    transition: stroke-dashoffset 0.1s ease-out;
  }
}

.double-tap-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 8px;
  pointer-events: none;
  z-index: 2;

  .double-tap-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color);
    animation: double-tap-bounce 0.3s ease-out;

    &:nth-child(2) {
      animation-delay: 0.1s;
    }
  }
}

// 动画定义
@keyframes feedback-press {
  0% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
  }
}

@keyframes ripple-expand {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes progress-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes double-tap-bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

// 无障碍优化
@media (prefers-reduced-motion: reduce) {
  .enhanced-touch-handler {
    &.touch-feedback {
      transition: none;
    }
  }

  .touch-feedback-layer,
  .touch-ripple,
  .progress-ring,
  .double-tap-dot {
    animation: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .touch-feedback-layer {
    background: rgba(0, 0, 0, 0.3);
  }

  .touch-ripple {
    background: rgba(0, 0, 0, 0.2);
  }

  .double-tap-dot {
    background: black;
  }
}

// 移动端优化
@media (max-width: 768px) {
  .enhanced-touch-handler {
    // 增大触摸目标
    min-height: 44px;
    min-width: 44px;
  }

  .long-progress-indicator {
    .progress-ring {
      width: 48px;
      height: 48px;
    }
  }
}
</style>