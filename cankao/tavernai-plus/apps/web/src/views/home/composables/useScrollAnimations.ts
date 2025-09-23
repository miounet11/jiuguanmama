import { ref, onMounted, onUnmounted } from 'vue'

// 滚动动画配置接口
interface ScrollAnimationConfig {
  threshold?: number // 触发阈值 (0-1)
  rootMargin?: string // 根边距
  once?: boolean // 是否只触发一次
  delay?: number // 动画延迟 (毫秒)
  duration?: number // 动画持续时间 (毫秒)
}

// 动画元素接口
interface AnimatedElement {
  element: HTMLElement
  animation: string
  config: ScrollAnimationConfig
  isVisible: boolean
  observer?: IntersectionObserver
}

export function useScrollAnimations() {
  const animatedElements = ref<Map<string, AnimatedElement>>(new Map())
  const isSupported = ref(false)

  // 检查浏览器支持
  const checkSupport = () => {
    isSupported.value = 'IntersectionObserver' in window
  }

  // 创建 Intersection Observer
  const createObserver = (element: AnimatedElement) => {
    if (!isSupported.value) return

    const { config } = element

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !element.isVisible) {
            handleElementVisible(element)
          } else if (!entry.isIntersecting && element.isVisible && !config.once) {
            handleElementHidden(element)
          }
        })
      },
      {
        threshold: config.threshold || 0.1,
        rootMargin: config.rootMargin || '50px'
      }
    )

    observer.observe(element.element)
    element.observer = observer
  }

  // 处理元素进入可视区域
  const handleElementVisible = (element: AnimatedElement) => {
    const { config, animation } = element

    // 设置延迟
    const delay = config.delay || 0

    setTimeout(() => {
      element.element.style.animationName = animation
      element.element.style.animationDuration = `${config.duration || 600}ms`
      element.element.style.animationFillMode = 'both'
      element.element.style.animationTimingFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

      element.isVisible = true

      // 如果设置为只触发一次，断开观察者
      if (config.once && element.observer) {
        element.observer.disconnect()
      }
    }, delay)
  }

  // 处理元素离开可视区域
  const handleElementHidden = (element: AnimatedElement) => {
    element.element.style.animationName = 'none'
    element.isVisible = false
  }

  // 注册滚动动画元素
  const registerElement = (
    selector: string,
    animation: string,
    config: ScrollAnimationConfig = {}
  ) => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) {
      console.warn(`Element not found: ${selector}`)
      return
    }

    const animatedElement: AnimatedElement = {
      element,
      animation,
      config: {
        threshold: 0.1,
        once: true,
        delay: 0,
        duration: 600,
        ...config
      },
      isVisible: false
    }

    // 初始隐藏元素
    element.style.opacity = '0'
    element.style.transform = 'translateY(30px)'

    animatedElements.value.set(selector, animatedElement)
    createObserver(animatedElement)
  }

  // 批量注册元素
  const registerElements = (
    selector: string,
    animation: string,
    config: ScrollAnimationConfig = {}
  ) => {
    const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>

    elements.forEach((element, index) => {
      const uniqueSelector = `${selector}-${index}`

      const animatedElement: AnimatedElement = {
        element,
        animation,
        config: {
          threshold: 0.1,
          once: true,
          delay: index * 100, // 错开动画
          duration: 600,
          ...config
        },
        isVisible: false
      }

      // 初始隐藏元素
      element.style.opacity = '0'
      element.style.transform = 'translateY(30px)'

      animatedElements.value.set(uniqueSelector, animatedElement)
      createObserver(animatedElement)
    })
  }

  // 注销元素
  const unregisterElement = (selector: string) => {
    const element = animatedElements.value.get(selector)
    if (element?.observer) {
      element.observer.disconnect()
    }
    animatedElements.value.delete(selector)
  }

  // 清空所有注册的元素
  const clearAllElements = () => {
    animatedElements.value.forEach(element => {
      if (element.observer) {
        element.observer.disconnect()
      }
    })
    animatedElements.value.clear()
  }

  // 手动触发动画
  const triggerAnimation = (selector: string) => {
    const element = animatedElements.value.get(selector)
    if (element && !element.isVisible) {
      handleElementVisible(element)
    }
  }

  // 预设动画配置
  const animationPresets = {
    fadeInUp: {
      name: 'fadeInUp',
      keyframes: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 40px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `
    },
    fadeInLeft: {
      name: 'fadeInLeft',
      keyframes: `
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translate3d(-40px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `
    },
    fadeInRight: {
      name: 'fadeInRight',
      keyframes: `
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translate3d(40px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `
    },
    scaleIn: {
      name: 'scaleIn',
      keyframes: `
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `
    },
    slideInUp: {
      name: 'slideInUp',
      keyframes: `
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 100%, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `
    }
  }

  // 注入CSS动画
  const injectAnimationStyles = () => {
    const styleId = 'scroll-animations-styles'

    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId

    const css = Object.values(animationPresets)
      .map(preset => preset.keyframes)
      .join('\n')

    style.textContent = css
    document.head.appendChild(style)
  }

  // 平滑滚动到元素
  const scrollToElement = (selector: string, options: ScrollIntoViewOptions = {}) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
      })
    }
  }

  // 获取滚动进度
  const getScrollProgress = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    return Math.min(scrollTop / scrollHeight, 1)
  }

  // 视差滚动效果
  const createParallaxEffect = (
    selector: string,
    speed: number = 0.5,
    direction: 'vertical' | 'horizontal' = 'vertical'
  ) => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return

    const handleScroll = () => {
      const scrolled = window.pageYOffset
      const rate = scrolled * -speed

      if (direction === 'vertical') {
        element.style.transform = `translateY(${rate}px)`
      } else {
        element.style.transform = `translateX(${rate}px)`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // 返回清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }

  // 首页特定动画设置
  const setupHomePageAnimations = () => {
    // 延迟到下一帧执行，确保DOM已渲染
    requestAnimationFrame(() => {
      // Hero区域动画
      registerElement('.hero-section', 'fadeInUp', {
        duration: 800,
        threshold: 0.2
      })

      // 精选角色卡片动画
      registerElements('.featured-char-card', 'scaleIn', {
        duration: 600,
        threshold: 0.1
      })

      // 功能卡片动画
      registerElements('.feature-card', 'fadeInUp', {
        duration: 700,
        threshold: 0.15
      })

      // 统计数据卡片动画
      registerElements('.stat-card', 'fadeInLeft', {
        duration: 600,
        threshold: 0.2
      })

      // CTA区域动画
      registerElement('.cta-section', 'fadeInUp', {
        duration: 800,
        threshold: 0.3
      })
    })
  }

  // 初始化
  const init = () => {
    checkSupport()
    injectAnimationStyles()

    if (!isSupported.value) {
      console.warn('IntersectionObserver not supported, scroll animations disabled')
      return
    }
  }

  // 生命周期钩子
  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    clearAllElements()
  })

  return {
    // 状态
    isSupported,
    animatedElements,

    // 方法
    registerElement,
    registerElements,
    unregisterElement,
    clearAllElements,
    triggerAnimation,
    scrollToElement,
    getScrollProgress,
    createParallaxEffect,
    setupHomePageAnimations,

    // 预设
    animationPresets
  }
}