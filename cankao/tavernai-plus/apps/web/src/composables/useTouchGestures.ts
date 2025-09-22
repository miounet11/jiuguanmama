/**
 * 触控手势处理组合函数
 * 支持滑动、长按、双击等移动端手势
 */
import { ref, onMounted, onUnmounted, Ref } from 'vue'

export interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

export interface LongPressEvent {
  x: number
  y: number
  duration: number
}

export interface DoubleTapEvent {
  x: number
  y: number
  interval: number
}

export interface TouchGestureOptions {
  // 滑动手势配置
  swipeThreshold?: number        // 最小滑动距离 (px)
  swipeVelocityThreshold?: number // 最小滑动速度 (px/ms)

  // 长按手势配置
  longPressDelay?: number        // 长按延迟 (ms)
  longPressThreshold?: number    // 长按最大移动距离 (px)

  // 双击手势配置
  doubleTapDelay?: number        // 双击最大间隔 (ms)
  doubleTapThreshold?: number    // 双击最大距离 (px)

  // 防止默认行为
  preventDefault?: boolean
  stopPropagation?: boolean
}

export function useTouchGestures(
  target: Ref<HTMLElement | null>,
  options: TouchGestureOptions = {}
) {
  const {
    swipeThreshold = 50,
    swipeVelocityThreshold = 0.3,
    longPressDelay = 500,
    longPressThreshold = 10,
    doubleTapDelay = 300,
    doubleTapThreshold = 20,
    preventDefault = false,
    stopPropagation = false
  } = options

  // 状态
  const isPressed = ref(false)
  const touchStart = ref<TouchPoint | null>(null)
  const lastTap = ref<TouchPoint | null>(null)
  const longPressTimer = ref<NodeJS.Timeout | null>(null)

  // 事件回调
  const onSwipe = ref<(event: SwipeEvent) => void>()
  const onLongPress = ref<(event: LongPressEvent) => void>()
  const onDoubleTap = ref<(event: DoubleTapEvent) => void>()
  const onTap = ref<(event: TouchPoint) => void>()

  // 工具函数
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

  const createTouchPoint = (touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now()
  })

  // 清理长按定时器
  const clearLongPressTimer = () => {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
  }

  // 触摸开始
  const handleTouchStart = (e: TouchEvent) => {
    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const point = createTouchPoint(touch)

      touchStart.value = point
      isPressed.value = true

      // 设置长按定时器
      longPressTimer.value = setTimeout(() => {
        if (isPressed.value && touchStart.value) {
          onLongPress.value?.({
            x: touchStart.value.x,
            y: touchStart.value.y,
            duration: longPressDelay
          })
        }
      }, longPressDelay)

      // 检查双击
      if (lastTap.value) {
        const timeDiff = point.timestamp - lastTap.value.timestamp
        const distance = getDistance(lastTap.value, point)

        if (timeDiff <= doubleTapDelay && distance <= doubleTapThreshold) {
          clearLongPressTimer()
          onDoubleTap.value?.({
            x: point.x,
            y: point.y,
            interval: timeDiff
          })
          lastTap.value = null
          return
        }
      }
    }
  }

  // 触摸移动
  const handleTouchMove = (e: TouchEvent) => {
    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()

    if (isPressed.value && touchStart.value && e.touches.length === 1) {
      const touch = e.touches[0]
      const currentPoint = createTouchPoint(touch)
      const distance = getDistance(touchStart.value, currentPoint)

      // 如果移动距离超过阈值，取消长按
      if (distance > longPressThreshold) {
        clearLongPressTimer()
      }
    }
  }

  // 触摸结束
  const handleTouchEnd = (e: TouchEvent) => {
    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()

    if (isPressed.value && touchStart.value) {
      clearLongPressTimer()

      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0]
        const endPoint = createTouchPoint(touch)
        const distance = getDistance(touchStart.value, endPoint)
        const duration = endPoint.timestamp - touchStart.value.timestamp
        const velocity = distance / duration

        // 检查滑动手势
        if (distance >= swipeThreshold && velocity >= swipeVelocityThreshold) {
          const direction = getSwipeDirection(touchStart.value, endPoint)
          onSwipe.value?.({
            direction,
            distance,
            velocity,
            duration
          })
        } else {
          // 简单点击
          onTap.value?.(endPoint)
          lastTap.value = endPoint
        }
      }
    }

    isPressed.value = false
    touchStart.value = null
  }

  // 触摸取消（如接到电话等）
  const handleTouchCancel = (e: TouchEvent) => {
    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()

    clearLongPressTimer()
    isPressed.value = false
    touchStart.value = null
  }

  // 添加事件监听器
  const addEventListeners = () => {
    const element = target.value
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault })
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: !preventDefault })
  }

  // 移除事件监听器
  const removeEventListeners = () => {
    const element = target.value
    if (!element) return

    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    element.removeEventListener('touchcancel', handleTouchCancel)
  }

  // 生命周期
  onMounted(() => {
    addEventListeners()
  })

  onUnmounted(() => {
    removeEventListeners()
    clearLongPressTimer()
  })

  // 返回接口
  return {
    // 状态
    isPressed: readonly(isPressed),

    // 事件注册
    onSwipe: (callback: (event: SwipeEvent) => void) => {
      onSwipe.value = callback
    },
    onLongPress: (callback: (event: LongPressEvent) => void) => {
      onLongPress.value = callback
    },
    onDoubleTap: (callback: (event: DoubleTapEvent) => void) => {
      onDoubleTap.value = callback
    },
    onTap: (callback: (event: TouchPoint) => void) => {
      onTap.value = callback
    },

    // 手动管理
    addEventListeners,
    removeEventListeners
  }
}

// 简化版本：只处理滑动手势
export function useSwipeGesture(
  target: Ref<HTMLElement | null>,
  onSwipe: (direction: SwipeEvent['direction']) => void,
  threshold = 50
) {
  const { onSwipe: registerSwipe } = useTouchGestures(target, {
    swipeThreshold: threshold,
    preventDefault: true
  })

  registerSwipe((event) => {
    onSwipe(event.direction)
  })
}