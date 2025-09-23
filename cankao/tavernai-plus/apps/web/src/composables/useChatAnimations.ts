import { ref, computed, nextTick } from 'vue'
import type { Ref } from 'vue'

// Types
export interface AnimationOptions {
  duration?: number
  easing?: string
  delay?: number
  stagger?: number
  direction?: 'normal' | 'reverse' | 'alternate'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface MessageAnimationOptions extends AnimationOptions {
  type?: 'slide' | 'fade' | 'scale' | 'bounce' | 'typewriter'
  fromDirection?: 'left' | 'right' | 'top' | 'bottom'
}

export interface ChatAnimations {
  // 消息动画
  animateNewMessage: (element: HTMLElement, isUser?: boolean, options?: MessageAnimationOptions) => Promise<void>
  animateMessageRemove: (element: HTMLElement, options?: AnimationOptions) => Promise<void>
  animateMessageEdit: (element: HTMLElement, options?: AnimationOptions) => Promise<void>

  // 打字动画
  animateTyping: (element: HTMLElement, options?: AnimationOptions) => Promise<void>
  stopTypingAnimation: (element: HTMLElement) => void

  // 滚动动画
  animateScrollToMessage: (container: HTMLElement, targetElement: HTMLElement, options?: AnimationOptions) => Promise<void>
  animateScrollToBottom: (container: HTMLElement, options?: AnimationOptions) => Promise<void>

  // 输入框动画
  animateInputFocus: (element: HTMLElement, options?: AnimationOptions) => Promise<void>
  animateInputShake: (element: HTMLElement, options?: AnimationOptions) => Promise<void>

  // 状态动画
  animateOnlineStatus: (element: HTMLElement, isOnline: boolean, options?: AnimationOptions) => Promise<void>
  animateNotification: (element: HTMLElement, options?: AnimationOptions) => Promise<void>

  // 过渡动画
  animateLayoutShift: (elements: HTMLElement[], options?: AnimationOptions) => Promise<void>
  animateThemeTransition: (container: HTMLElement, options?: AnimationOptions) => Promise<void>

  // 手势动画
  animateSwipeGesture: (element: HTMLElement, direction: 'left' | 'right', options?: AnimationOptions) => Promise<void>
  animatePullToRefresh: (element: HTMLElement, progress: number, options?: AnimationOptions) => Promise<void>
}

export interface UseChatAnimationsReturn extends ChatAnimations {
  // 状态
  isAnimating: Ref<boolean>
  animationQueue: Ref<number>

  // 配置
  setGlobalDuration: (duration: number) => void
  setGlobalEasing: (easing: string) => void
  enableAnimations: Ref<boolean>

  // 工具方法
  createKeyframes: (from: Partial<CSSStyleDeclaration>, to: Partial<CSSStyleDeclaration>) => Keyframe[]
  chainAnimations: (...animations: (() => Promise<void>)[]) => Promise<void>
}

/**
 * 聊天动画系统 Composable
 *
 * 提供完整的聊天界面动画功能，包括：
 * - 消息进入/退出动画
 * - 打字指示器动画
 * - 滚动和过渡动画
 * - 状态变化动画
 * - 手势交互动画
 * - 性能优化的动画队列
 */
export function useChatAnimations(): UseChatAnimationsReturn {
  // === 状态管理 ===
  const isAnimating = ref(false)
  const animationQueue = ref(0)
  const enableAnimations = ref(true)

  // 全局配置
  const globalDuration = ref(300)
  const globalEasing = ref('cubic-bezier(0.4, 0, 0.2, 1)')

  // 动画实例追踪
  const activeAnimations = new Set<Animation>()

  // === 工具方法 ===

  /**
   * 创建关键帧
   */
  const createKeyframes = (
    from: Partial<CSSStyleDeclaration>,
    to: Partial<CSSStyleDeclaration>
  ): Keyframe[] => {
    return [
      from as Keyframe,
      to as Keyframe
    ]
  }

  /**
   * 获取默认选项
   */
  const getDefaultOptions = (options: AnimationOptions = {}): Required<AnimationOptions> => {
    return {
      duration: options.duration ?? globalDuration.value,
      easing: options.easing ?? globalEasing.value,
      delay: options.delay ?? 0,
      stagger: options.stagger ?? 0,
      direction: options.direction ?? 'normal',
      fillMode: options.fillMode ?? 'both'
    }
  }

  /**
   * 执行动画的包装器
   */
  const runAnimation = async (
    element: HTMLElement,
    keyframes: Keyframe[],
    options: AnimationOptions = {}
  ): Promise<void> => {
    if (!enableAnimations.value || !element) return

    return new Promise((resolve, reject) => {
      try {
        animationQueue.value++
        isAnimating.value = true

        const opts = getDefaultOptions(options)

        const animation = element.animate(keyframes, {
          duration: opts.duration,
          easing: opts.easing,
          delay: opts.delay,
          direction: opts.direction,
          fill: opts.fillMode
        })

        activeAnimations.add(animation)

        animation.onfinish = () => {
          activeAnimations.delete(animation)
          animationQueue.value--
          if (animationQueue.value === 0) {
            isAnimating.value = false
          }
          resolve()
        }

        animation.oncancel = () => {
          activeAnimations.delete(animation)
          animationQueue.value--
          if (animationQueue.value === 0) {
            isAnimating.value = false
          }
          reject(new Error('Animation was cancelled'))
        }

      } catch (error) {
        animationQueue.value--
        if (animationQueue.value === 0) {
          isAnimating.value = false
        }
        reject(error)
      }
    })
  }

  /**
   * 链式动画执行
   */
  const chainAnimations = async (...animations: (() => Promise<void>)[]): Promise<void> => {
    for (const animation of animations) {
      await animation()
    }
  }

  // === 消息动画 ===

  /**
   * 新消息进入动画
   */
  const animateNewMessage = async (
    element: HTMLElement,
    isUser = false,
    options: MessageAnimationOptions = {}
  ): Promise<void> => {
    const opts = { type: 'slide', fromDirection: isUser ? 'right' : 'left', ...options }

    let keyframes: Keyframe[]

    switch (opts.type) {
      case 'slide':
        const translateX = opts.fromDirection === 'left' ? '-100%' : '100%'
        keyframes = createKeyframes(
          { transform: `translateX(${translateX})`, opacity: '0' },
          { transform: 'translateX(0)', opacity: '1' }
        )
        break

      case 'fade':
        keyframes = createKeyframes(
          { opacity: '0', transform: 'translateY(10px)' },
          { opacity: '1', transform: 'translateY(0)' }
        )
        break

      case 'scale':
        keyframes = createKeyframes(
          { transform: 'scale(0.8)', opacity: '0' },
          { transform: 'scale(1)', opacity: '1' }
        )
        break

      case 'bounce':
        keyframes = [
          { transform: 'scale(0)', opacity: '0', offset: 0 },
          { transform: 'scale(1.1)', opacity: '0.8', offset: 0.6 },
          { transform: 'scale(0.95)', opacity: '0.9', offset: 0.8 },
          { transform: 'scale(1)', opacity: '1', offset: 1 }
        ]
        break

      case 'typewriter':
        // 对于打字机效果，我们需要特殊处理
        return animateTypewriter(element, options)

      default:
        keyframes = createKeyframes(
          { opacity: '0', transform: 'translateY(20px)' },
          { opacity: '1', transform: 'translateY(0)' }
        )
    }

    await runAnimation(element, keyframes, options)
  }

  /**
   * 消息移除动画
   */
  const animateMessageRemove = async (
    element: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const keyframes = createKeyframes(
      { opacity: '1', transform: 'scale(1)' },
      { opacity: '0', transform: 'scale(0.8)' }
    )

    await runAnimation(element, keyframes, { duration: 200, ...options })
  }

  /**
   * 消息编辑动画
   */
  const animateMessageEdit = async (
    element: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const keyframes = [
      { transform: 'scale(1)', backgroundColor: 'transparent', offset: 0 },
      { transform: 'scale(1.02)', backgroundColor: 'rgba(168, 85, 247, 0.1)', offset: 0.5 },
      { transform: 'scale(1)', backgroundColor: 'transparent', offset: 1 }
    ]

    await runAnimation(element, keyframes, { duration: 400, ...options })
  }

  // === 打字动画 ===

  /**
   * 打字指示器动画
   */
  const animateTyping = async (
    element: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const dots = element.querySelectorAll('.typing-dot')

    if (dots.length === 0) return

    const animations = Array.from(dots).map((dot, index) => {
      const keyframes = createKeyframes(
        { transform: 'translateY(0)', opacity: '0.4' },
        { transform: 'translateY(-8px)', opacity: '1' }
      )

      return runAnimation(dot as HTMLElement, keyframes, {
        duration: 600,
        direction: 'alternate',
        delay: index * 160,
        ...options
      }).catch(() => {}) // 忽略取消错误
    })

    // 启动所有点的动画，但不等待完成（因为它们是无限循环的）
    Promise.all(animations)
  }

  /**
   * 停止打字动画
   */
  const stopTypingAnimation = (element: HTMLElement): void => {
    const dots = element.querySelectorAll('.typing-dot')
    dots.forEach(dot => {
      const animations = (dot as HTMLElement).getAnimations()
      animations.forEach(animation => animation.cancel())
    })
  }

  /**
   * 打字机效果
   */
  const animateTypewriter = async (
    element: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const textContent = element.textContent || ''
    const chars = textContent.split('')

    element.textContent = ''
    element.style.borderRight = '2px solid var(--brand-primary-500)'

    for (let i = 0; i < chars.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      element.textContent += chars[i]
    }

    // 移除光标
    setTimeout(() => {
      element.style.borderRight = 'none'
    }, 500)
  }

  // === 滚动动画 ===

  /**
   * 滚动到指定消息
   */
  const animateScrollToMessage = async (
    container: HTMLElement,
    targetElement: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const containerRect = container.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()

    const scrollTop = container.scrollTop + targetRect.top - containerRect.top - 20

    await animateScrollTo(container, scrollTop, options)
  }

  /**
   * 滚动到底部
   */
  const animateScrollToBottom = async (
    container: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const scrollTop = container.scrollHeight - container.clientHeight
    await animateScrollTo(container, scrollTop, options)
  }

  /**
   * 平滑滚动动画
   */
  const animateScrollTo = async (
    container: HTMLElement,
    targetScrollTop: number,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const startScrollTop = container.scrollTop
    const distance = targetScrollTop - startScrollTop

    const keyframes = [
      { scrollTop: `${startScrollTop}px` },
      { scrollTop: `${targetScrollTop}px` }
    ]

    // 使用自定义动画因为 CSS 动画不能直接控制 scrollTop
    return new Promise(resolve => {
      const opts = getDefaultOptions(options)
      const startTime = performance.now()

      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / opts.duration, 1)

        // 应用缓动函数 (简化版 ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        const currentScrollTop = startScrollTop + distance * easeProgress

        container.scrollTop = currentScrollTop

        if (progress < 1) {
          requestAnimationFrame(animateFrame)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(animateFrame)
    })
  }

  // === 输入框动画 ===

  /**
   * 输入框聚焦动画
   */
  const animateInputFocus = async (
    element: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const keyframes = [
      {
        transform: 'scale(1)',
        boxShadow: '0 0 0 0 rgba(168, 85, 247, 0)',
        offset: 0
      },
      {
        transform: 'scale(1.01)',
        boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)',
        offset: 1
      }
    ]

    await runAnimation(element, keyframes, { duration: 200, ...options })
  }

  /**
   * 输入框错误晃动动画
   */
  const animateInputShake = async (
    element: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const keyframes = [
      { transform: 'translateX(0)', offset: 0 },
      { transform: 'translateX(-10px)', offset: 0.1 },
      { transform: 'translateX(10px)', offset: 0.2 },
      { transform: 'translateX(-10px)', offset: 0.3 },
      { transform: 'translateX(10px)', offset: 0.4 },
      { transform: 'translateX(-5px)', offset: 0.5 },
      { transform: 'translateX(5px)', offset: 0.6 },
      { transform: 'translateX(-5px)', offset: 0.7 },
      { transform: 'translateX(5px)', offset: 0.8 },
      { transform: 'translateX(0)', offset: 1 }
    ]

    await runAnimation(element, keyframes, { duration: 500, ...options })
  }

  // === 状态动画 ===

  /**
   * 在线状态动画
   */
  const animateOnlineStatus = async (
    element: HTMLElement,
    isOnline: boolean,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const targetColor = isOnline ? '#10b981' : '#6b7280'
    const keyframes = createKeyframes(
      { backgroundColor: 'currentColor', transform: 'scale(1)' },
      { backgroundColor: targetColor, transform: 'scale(1.2)' }
    )

    await runAnimation(element, keyframes, { duration: 300, direction: 'alternate', ...options })
  }

  /**
   * 通知动画
   */
  const animateNotification = async (
    element: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const keyframes = [
      { transform: 'scale(0) rotate(45deg)', opacity: '0', offset: 0 },
      { transform: 'scale(1.1) rotate(0deg)', opacity: '1', offset: 0.7 },
      { transform: 'scale(1) rotate(0deg)', opacity: '1', offset: 1 }
    ]

    await runAnimation(element, keyframes, { duration: 400, ...options })
  }

  // === 过渡动画 ===

  /**
   * 布局变化动画
   */
  const animateLayoutShift = async (
    elements: HTMLElement[],
    options: AnimationOptions = {}
  ): Promise<void> => {
    const animations = elements.map((element, index) => {
      const keyframes = createKeyframes(
        { transform: 'translateY(20px)', opacity: '0' },
        { transform: 'translateY(0)', opacity: '1' }
      )

      return runAnimation(element, keyframes, {
        delay: index * (options.stagger ?? 50),
        ...options
      })
    })

    await Promise.all(animations)
  }

  /**
   * 主题切换动画
   */
  const animateThemeTransition = async (
    container: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const keyframes = [
      { filter: 'brightness(1)', offset: 0 },
      { filter: 'brightness(0.8)', offset: 0.5 },
      { filter: 'brightness(1)', offset: 1 }
    ]

    await runAnimation(container, keyframes, { duration: 300, ...options })
  }

  // === 手势动画 ===

  /**
   * 滑动手势动画
   */
  const animateSwipeGesture = async (
    element: HTMLElement,
    direction: 'left' | 'right',
    options: AnimationOptions = {}
  ): Promise<void> => {
    const translateX = direction === 'left' ? '-100%' : '100%'
    const keyframes = createKeyframes(
      { transform: 'translateX(0)', opacity: '1' },
      { transform: `translateX(${translateX})`, opacity: '0' }
    )

    await runAnimation(element, keyframes, { duration: 250, ...options })
  }

  /**
   * 下拉刷新动画
   */
  const animatePullToRefresh = async (
    element: HTMLElement,
    progress: number,
    options: AnimationOptions = {}
  ): Promise<void> => {
    const rotation = progress * 360
    const scale = Math.min(progress * 1.2, 1)

    const keyframes = createKeyframes(
      { transform: 'rotate(0deg) scale(0.8)' },
      { transform: `rotate(${rotation}deg) scale(${scale})` }
    )

    await runAnimation(element, keyframes, { duration: 100, fillMode: 'forwards', ...options })
  }

  // === 配置方法 ===

  const setGlobalDuration = (duration: number) => {
    globalDuration.value = duration
  }

  const setGlobalEasing = (easing: string) => {
    globalEasing.value = easing
  }

  // === 性能优化 ===

  // 检查用户偏好设置
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (prefersReducedMotion.matches) {
    enableAnimations.value = false
  }

  prefersReducedMotion.addEventListener('change', (e) => {
    enableAnimations.value = !e.matches
  })

  // 页面可见性变化时暂停动画
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 暂停所有动画
      activeAnimations.forEach(animation => animation.pause())
    } else {
      // 恢复所有动画
      activeAnimations.forEach(animation => animation.play())
    }
  })

  return {
    // 状态
    isAnimating,
    animationQueue,
    enableAnimations,

    // 消息动画
    animateNewMessage,
    animateMessageRemove,
    animateMessageEdit,

    // 打字动画
    animateTyping,
    stopTypingAnimation,

    // 滚动动画
    animateScrollToMessage,
    animateScrollToBottom,

    // 输入框动画
    animateInputFocus,
    animateInputShake,

    // 状态动画
    animateOnlineStatus,
    animateNotification,

    // 过渡动画
    animateLayoutShift,
    animateThemeTransition,

    // 手势动画
    animateSwipeGesture,
    animatePullToRefresh,

    // 配置
    setGlobalDuration,
    setGlobalEasing,

    // 工具方法
    createKeyframes,
    chainAnimations
  }
}

/**
 * 简化版聊天动画钩子
 * 适用于只需要基本动画功能的场景
 */
export function useSimpleChatAnimations() {
  const {
    isAnimating,
    enableAnimations,
    animateNewMessage,
    animateScrollToBottom,
    animateInputShake
  } = useChatAnimations()

  return {
    isAnimating,
    enableAnimations,
    animateNewMessage,
    animateScrollToBottom,
    animateInputShake
  }
}

export default useChatAnimations