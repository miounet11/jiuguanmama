import { ref, nextTick, type Ref } from 'vue'

export interface AnimationConfig {
  duration?: number
  easing?: string
  delay?: number
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface SpringConfig {
  tension?: number
  friction?: number
  mass?: number
}

export interface StaggerConfig {
  stagger?: number
  from?: 'first' | 'last' | 'center' | number
}

const DEFAULT_CONFIG: Required<AnimationConfig> = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  delay: 0,
  fill: 'forwards'
}

/**
 * 动画组合式函数
 */
export function useAnimations() {

  /**
   * 淡入动画
   */
  const fadeIn = (element: HTMLElement, config: AnimationConfig = {}): Promise<void> => {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    return new Promise(resolve => {
      element.style.opacity = '0'
      element.animate([
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: cfg.duration,
        easing: cfg.easing,
        delay: cfg.delay,
        fill: cfg.fill
      }).onfinish = () => resolve()
    })
  }

  /**
   * 滑入动画
   */
  const slideIn = (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', config: AnimationConfig = {}): Promise<void> => {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(100%)',
      down: 'translateY(-100%)'
    }

    return new Promise(resolve => {
      element.style.transform = transforms[direction]
      element.animate([
        { transform: transforms[direction], opacity: 0 },
        { transform: 'translate(0)', opacity: 1 }
      ], {
        duration: cfg.duration,
        easing: cfg.easing,
        delay: cfg.delay,
        fill: cfg.fill
      }).onfinish = () => resolve()
    })
  }

  /**
   * 缩放动画
   */
  const scaleIn = (element: HTMLElement, fromScale: number = 0.8, config: AnimationConfig = {}): Promise<void> => {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    return new Promise(resolve => {
      element.style.transform = `scale(${fromScale})`
      element.animate([
        { transform: `scale(${fromScale})`, opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ], {
        duration: cfg.duration,
        easing: cfg.easing,
        delay: cfg.delay,
        fill: cfg.fill
      }).onfinish = () => resolve()
    })
  }

  /**
   * 弹性动画
   */
  const bounceIn = (element: HTMLElement, config: AnimationConfig = {}): Promise<void> => {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    return new Promise(resolve => {
      element.animate([
        { transform: 'scale(0.3)', opacity: 0 },
        { transform: 'scale(1.05)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0.9)', offset: 0.7 },
        { transform: 'scale(1)', offset: 1 }
      ], {
        duration: cfg.duration * 1.2,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        delay: cfg.delay,
        fill: cfg.fill
      }).onfinish = () => resolve()
    })
  }

  /**
   * 弹性脉冲动画
   */
  const pulse = (element: HTMLElement, scale: number = 1.05, config: AnimationConfig = {}): Promise<void> => {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    return new Promise(resolve => {
      element.animate([
        { transform: 'scale(1)' },
        { transform: `scale(${scale})` },
        { transform: 'scale(1)' }
      ], {
        duration: cfg.duration,
        easing: 'ease-in-out',
        delay: cfg.delay,
        fill: cfg.fill
      }).onfinish = () => resolve()
    })
  }

  /**
   * 摇摆动画
   */
  const shake = (element: HTMLElement, intensity: number = 10, config: AnimationConfig = {}): Promise<void> => {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    return new Promise(resolve => {
      element.animate([
        { transform: 'translateX(0)' },
        { transform: `translateX(-${intensity}px)` },
        { transform: `translateX(${intensity}px)` },
        { transform: `translateX(-${intensity}px)` },
        { transform: `translateX(${intensity}px)` },
        { transform: `translateX(-${intensity}px)` },
        { transform: 'translateX(0)' }
      ], {
        duration: cfg.duration,
        easing: 'ease-in-out',
        delay: cfg.delay,
        fill: cfg.fill
      }).onfinish = () => resolve()
    })
  }

  /**
   * 打字机效果
   */
  const typewriter = (element: HTMLElement, text: string, speed: number = 50): Promise<void> => {
    return new Promise(resolve => {
      element.textContent = ''
      let index = 0

      const type = () => {
        if (index < text.length) {
          element.textContent += text.charAt(index)
          index++
          setTimeout(type, speed)
        } else {
          resolve()
        }
      }

      type()
    })
  }

  /**
   * 渐进式动画（多个元素）
   */
  const stagger = (elements: HTMLElement[], animationFn: (el: HTMLElement, delay: number) => Promise<void>, config: StaggerConfig = {}): Promise<void[]> => {
    const { stagger = 100, from = 'first' } = config

    // 根据from参数排序元素
    let sortedElements = [...elements]
    if (from === 'last') {
      sortedElements = sortedElements.reverse()
    } else if (from === 'center') {
      sortedElements = sortedElements.sort((a, b) => {
        const aRect = a.getBoundingClientRect()
        const bRect = b.getBoundingClientRect()
        return (aRect.top + aRect.bottom) - (bRect.top + bRect.bottom)
      })
    }

    return Promise.all(
      sortedElements.map((el, index) => animationFn(el, index * stagger))
    )
  }

  /**
   * 滚动到元素并高亮
   */
  const scrollToHighlight = (element: HTMLElement, highlightClass: string = 'highlight', config: AnimationConfig = {}): Promise<void> => {
    const cfg = { ...DEFAULT_CONFIG, ...config }

    return new Promise(async (resolve) => {
      // 滚动到元素
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 等待滚动完成
      await new Promise(r => setTimeout(r, 300))

      // 添加高亮类
      element.classList.add(highlightClass)

      // 创建高亮动画
      element.animate([
        { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)' },
        { boxShadow: '0 0 0 8px rgba(59, 130, 246, 0)' }
      ], {
        duration: cfg.duration,
        easing: cfg.easing,
        fill: 'forwards'
      }).onfinish = () => {
        setTimeout(() => {
          element.classList.remove(highlightClass)
          resolve()
        }, 2000)
      }
    })
  }

  /**
   * 列表项动画
   */
  const animateListItems = (container: HTMLElement, selector: string, config: AnimationConfig = {}): Promise<void[]> => {
    const items = Array.from(container.querySelectorAll(selector)) as HTMLElement[]

    return stagger(items, (item, delay) => {
      return fadeIn(item, { ...config, delay })
    }, { stagger: 80 })
  }

  /**
   * 页面过渡动画
   */
  const pageTransition = (fromPage: HTMLElement, toPage: HTMLElement, direction: 'forward' | 'backward' = 'forward'): Promise<void> => {
    return new Promise(async (resolve) => {
      const isForward = direction === 'forward'
      const slideDirection = isForward ? 'left' : 'right'

      await Promise.all([
        slideIn(toPage, slideDirection, { duration: 400 }),
        fromPage.animate([
          { transform: 'translate(0)', opacity: 1 },
          { transform: `translateX(${isForward ? '-100%' : '100%'})`, opacity: 0 }
        ], {
          duration: 400,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards'
        }).finished
      ])

      resolve()
    })
  }

  /**
   * 数字滚动动画
   */
  const countUp = (element: HTMLElement, from: number, to: number, duration: number = 1000): Promise<void> => {
    return new Promise(resolve => {
      const startTime = Date.now()
      const difference = to - from

      const update = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const current = Math.floor(from + difference * easeOut)

        element.textContent = current.toLocaleString()

        if (progress < 1) {
          requestAnimationFrame(update)
        } else {
          resolve()
        }
      }

      update()
    })
  }

  /**
   * 加载状态动画
   */
  const loadingAnimation = (element: HTMLElement, state: 'start' | 'stop'): void => {
    if (state === 'start') {
      element.classList.add('loading')
      element.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ], {
        duration: 1000,
        iterations: Infinity,
        easing: 'linear'
      })
    } else {
      element.classList.remove('loading')
      const animations = element.getAnimations()
      animations.forEach(animation => animation.cancel())
    }
  }

  /**
   * 创建响应式动画状态
   */
  const createAnimatedState = <T>(initialValue: T, config: AnimationConfig = {}): Ref<T> => {
    const state = ref(initialValue)
    const isAnimating = ref(false)

    const animateTo = async (newValue: T, element?: HTMLElement) => {
      isAnimating.value = true

      if (element) {
        await fadeIn(element, config)
      }

      state.value = newValue
      isAnimating.value = false
    }

    return Object.assign(state, {
      isAnimating,
      animateTo
    }) as Ref<T> & { isAnimating: Ref<boolean>; animateTo: (value: T, element?: HTMLElement) => Promise<void> }
  }

  /**
   * 检测元素是否在视口中
   */
  const isElementInViewport = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  /**
   * 滚动显示动画
   */
  const animateOnScroll = (elements: HTMLElement[], animationFn: (el: HTMLElement) => Promise<void>): void => {
    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            await animationFn(entry.target as HTMLElement)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.1 }
    )

    elements.forEach(element => {
      if (!isElementInViewport(element)) {
        observer.observe(element)
      } else {
        // 如果已经在视口中，立即执行动画
        animationFn(element)
      }
    })
  }

  return {
    // 基础动画
    fadeIn,
    slideIn,
    scaleIn,
    bounceIn,
    pulse,
    shake,

    // 文本动画
    typewriter,

    // 列表和组动画
    stagger,
    animateListItems,

    // 页面和导航动画
    pageTransition,
    scrollToHighlight,

    // 数值动画
    countUp,

    // 状态动画
    loadingAnimation,
    createAnimatedState,

    // 滚动动画
    animateOnScroll,
    isElementInViewport
  }
}

/**
 * 预设动画配置
 */
export const ANIMATION_PRESETS = {
  // 快速
  fast: { duration: 200, easing: 'ease-out' },

  // 标准
  normal: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },

  // 慢速
  slow: { duration: 500, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },

  // 弹性
  spring: { duration: 600, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },

  // 平滑
  smooth: { duration: 400, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },

  // 锐利
  sharp: { duration: 150, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }
} as const