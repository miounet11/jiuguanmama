/**
 * 虚拟键盘处理组合函数
 * 处理移动端虚拟键盘弹出时的布局调整、视口变化等
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export interface KeyboardState {
  isVisible: boolean
  height: number
  animating: boolean
}

export interface ViewportInfo {
  width: number
  height: number
  availableHeight: number // 减去键盘高度后的可用高度
  scale: number
}

export function useVirtualKeyboard() {
  // 状态
  const keyboardState = ref<KeyboardState>({
    isVisible: false,
    height: 0,
    animating: false
  })

  const viewportInfo = ref<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    availableHeight: window.innerHeight,
    scale: 1
  })

  const originalViewportHeight = ref(window.innerHeight)
  const currentInputElement = ref<HTMLElement | null>(null)

  // 检测键盘显示/隐藏的阈值
  const KEYBOARD_THRESHOLD = 150

  // 更新视口信息
  const updateViewportInfo = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const scale = window.devicePixelRatio || 1

    viewportInfo.value = {
      width,
      height,
      availableHeight: height - keyboardState.value.height,
      scale
    }
  }

  // 检测键盘状态
  const detectKeyboardState = () => {
    const currentHeight = window.innerHeight
    const heightDiff = originalViewportHeight.value - currentHeight

    const wasVisible = keyboardState.value.isVisible
    const isVisible = heightDiff > KEYBOARD_THRESHOLD
    const keyboardHeight = isVisible ? heightDiff : 0

    if (wasVisible !== isVisible) {
      keyboardState.value.animating = true

      // 设置动画结束定时器
      setTimeout(() => {
        keyboardState.value.animating = false
      }, 300) // 一般键盘动画时长
    }

    keyboardState.value.isVisible = isVisible
    keyboardState.value.height = keyboardHeight

    updateViewportInfo()
  }

  // 滚动到输入框
  const scrollToInput = (element: HTMLElement, delay = 300) => {
    setTimeout(() => {
      if (!element || !keyboardState.value.isVisible) return

      const rect = element.getBoundingClientRect()
      const availableHeight = viewportInfo.value.availableHeight
      const elementBottom = rect.bottom
      const safeArea = 20 // 安全边距

      if (elementBottom > availableHeight - safeArea) {
        const scrollAmount = elementBottom - availableHeight + safeArea
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        })
      }
    }, delay)
  }

  // 输入框聚焦处理
  const handleInputFocus = (event: FocusEvent) => {
    const target = event.target as HTMLElement
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      currentInputElement.value = target

      // iOS Safari 需要延迟处理
      nextTick(() => {
        setTimeout(() => {
          detectKeyboardState()
          if (keyboardState.value.isVisible) {
            scrollToInput(target)
          }
        }, 100)
      })
    }
  }

  // 输入框失焦处理
  const handleInputBlur = () => {
    currentInputElement.value = null

    // 延迟检测，确保键盘完全隐藏
    setTimeout(() => {
      detectKeyboardState()
    }, 300)
  }

  // 视口大小变化处理
  const handleResize = () => {
    // 防抖处理
    clearTimeout(handleResize.timer)
    handleResize.timer = setTimeout(() => {
      detectKeyboardState()
    }, 100)
  }
  handleResize.timer = 0

  // Visual Viewport API 支持
  const handleVisualViewportChange = () => {
    if (!window.visualViewport) return

    const vv = window.visualViewport
    const heightDiff = window.innerHeight - vv.height
    const isVisible = heightDiff > KEYBOARD_THRESHOLD

    keyboardState.value.isVisible = isVisible
    keyboardState.value.height = isVisible ? heightDiff : 0

    updateViewportInfo()

    // 如果有当前输入框，滚动到可见区域
    if (currentInputElement.value && isVisible) {
      scrollToInput(currentInputElement.value, 0)
    }
  }

  // 修复 iOS Safari 的视口问题
  const fixIOSViewport = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (!isIOS) return

    // 设置视口元标签
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.name = 'viewport'
      document.head.appendChild(viewportMeta)
    }

    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

    // 防止页面缩放
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }, { passive: false })

    // 双击防止缩放
    let lastTouchEnd = 0
    document.addEventListener('touchend', (e) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }, false)
  }

  // 获取安全区域信息
  const getSafeAreaInsets = () => {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
    }
  }

  // 设置页面最小高度（防止键盘导致的布局问题）
  const setMinimumPageHeight = () => {
    const minHeight = Math.max(
      originalViewportHeight.value,
      document.body.scrollHeight
    )
    document.body.style.minHeight = `${minHeight}px`
  }

  // 添加事件监听器
  const addEventListeners = () => {
    // 输入框事件
    document.addEventListener('focusin', handleInputFocus)
    document.addEventListener('focusout', handleInputBlur)

    // 视口变化事件
    window.addEventListener('resize', handleResize)

    // Visual Viewport API（现代浏览器）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange)
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange)
    }

    // 方向变化
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        originalViewportHeight.value = window.innerHeight
        detectKeyboardState()
      }, 500)
    })
  }

  // 移除事件监听器
  const removeEventListeners = () => {
    document.removeEventListener('focusin', handleInputFocus)
    document.removeEventListener('focusout', handleInputBlur)
    window.removeEventListener('resize', handleResize)

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
      window.visualViewport.removeEventListener('scroll', handleVisualViewportChange)
    }
  }

  // 手动调整输入框位置
  const adjustInputPosition = (element?: HTMLElement) => {
    const target = element || currentInputElement.value
    if (target && keyboardState.value.isVisible) {
      scrollToInput(target, 0)
    }
  }

  // 生命周期
  onMounted(() => {
    originalViewportHeight.value = window.innerHeight
    updateViewportInfo()
    fixIOSViewport()
    setMinimumPageHeight()
    addEventListeners()
  })

  onUnmounted(() => {
    removeEventListeners()
  })

  return {
    // 状态
    keyboardState: readonly(keyboardState),
    viewportInfo: readonly(viewportInfo),
    currentInputElement: readonly(currentInputElement),

    // 方法
    adjustInputPosition,
    scrollToInput,
    getSafeAreaInsets,

    // 工具方法
    detectKeyboardState,
    updateViewportInfo,

    // 计算属性
    isKeyboardVisible: computed(() => keyboardState.value.isVisible),
    keyboardHeight: computed(() => keyboardState.value.height),
    availableHeight: computed(() => viewportInfo.value.availableHeight)
  }
}

// 简化版本：只处理键盘高度
export function useKeyboardHeight() {
  const { keyboardHeight, isKeyboardVisible } = useVirtualKeyboard()

  return {
    height: keyboardHeight,
    isVisible: isKeyboardVisible
  }
}