import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'

export interface LazyImageOptions {
  src: string
  placeholder?: string
  threshold?: number
  rootMargin?: string
  retryAttempts?: number
  retryDelay?: number
  onLoad?: () => void
  onError?: (error: Event) => void
}

export interface UseLazyImageReturn {
  imageSrc: Ref<string>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  isIntersecting: Ref<boolean>
  retry: () => void
}

/**
 * 图片懒加载组合式函数
 * 基于 IntersectionObserver 实现高性能的图片懒加载
 */
export function useLazyImage(
  elementRef: Ref<HTMLElement | undefined>,
  options: LazyImageOptions
): UseLazyImageReturn {
  const {
    src,
    placeholder = '',
    threshold = 0.1,
    rootMargin = '50px',
    retryAttempts = 3,
    retryDelay = 1000,
    onLoad,
    onError
  } = options

  // 状态管理
  const imageSrc = ref(placeholder)
  const isLoading = ref(false)
  const hasError = ref(false)
  const isIntersecting = ref(false)
  const currentRetryAttempt = ref(0)

  // IntersectionObserver 实例
  let intersectionObserver: IntersectionObserver | null = null

  // 加载图片
  const loadImage = async (imageUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        imageSrc.value = imageUrl
        isLoading.value = false
        hasError.value = false
        currentRetryAttempt.value = 0
        onLoad?.()
        resolve()
      }

      img.onerror = (error) => {
        isLoading.value = false
        hasError.value = true
        onError?.(error)
        reject(error)
      }

      img.src = imageUrl
    })
  }

  // 重试加载
  const retryLoad = async () => {
    if (currentRetryAttempt.value >= retryAttempts) {
      hasError.value = true
      isLoading.value = false
      return
    }

    currentRetryAttempt.value++

    // 指数退避延迟
    const delay = retryDelay * Math.pow(2, currentRetryAttempt.value - 1)
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      await loadImage(src)
    } catch {
      // 继续重试或标记为错误
      if (currentRetryAttempt.value < retryAttempts) {
        retryLoad()
      } else {
        hasError.value = true
        isLoading.value = false
      }
    }
  }

  // 开始加载图片
  const startLoading = async () => {
    if (isLoading.value || !src || imageSrc.value === src) {
      return
    }

    isLoading.value = true
    hasError.value = false
    currentRetryAttempt.value = 0

    try {
      await loadImage(src)
    } catch {
      retryLoad()
    }
  }

  // 手动重试
  const retry = () => {
    currentRetryAttempt.value = 0
    startLoading()
  }

  // 设置 IntersectionObserver
  const setupIntersectionObserver = () => {
    if (typeof IntersectionObserver === 'undefined' || !elementRef.value) {
      // 不支持 IntersectionObserver，直接加载
      startLoading()
      return
    }

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        isIntersecting.value = entry.isIntersecting

        if (entry.isIntersecting) {
          startLoading()
          // 加载开始后停止观察
          intersectionObserver?.unobserve(elementRef.value!)
        }
      },
      {
        threshold,
        rootMargin,
        root: null
      }
    )

    intersectionObserver.observe(elementRef.value)
  }

  // 清理资源
  const cleanup = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect()
      intersectionObserver = null
    }
  }

  // 监听元素引用变化
  watch(elementRef, (newElement) => {
    cleanup()
    if (newElement) {
      setupIntersectionObserver()
    }
  }, { immediate: true })

  // 监听 src 变化
  watch(() => src, (newSrc) => {
    if (newSrc && newSrc !== imageSrc.value) {
      if (isIntersecting.value) {
        startLoading()
      } else {
        // 重置状态，等待进入视口
        imageSrc.value = placeholder
        isLoading.value = false
        hasError.value = false
      }
    }
  })

  // 生命周期
  onMounted(() => {
    if (elementRef.value) {
      setupIntersectionObserver()
    }
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    imageSrc,
    isLoading,
    hasError,
    isIntersecting,
    retry
  }
}

/**
 * 预加载图片组合函数
 * 用于预加载多张图片
 */
export function useImagePreloader(urls: string[] | Ref<string[]>) {
  const loadingCount = ref(0)
  const loadedCount = ref(0)
  const errorCount = ref(0)
  const isLoading = ref(false)
  const isComplete = ref(false)

  const progress = computed(() => {
    const total = Array.isArray(urls) ? urls.length : urls.value.length
    return total > 0 ? (loadedCount.value + errorCount.value) / total : 0
  })

  const preloadImages = async (imageUrls: string[]): Promise<void> => {
    if (imageUrls.length === 0) {
      isComplete.value = true
      return
    }

    isLoading.value = true
    isComplete.value = false
    loadingCount.value = imageUrls.length
    loadedCount.value = 0
    errorCount.value = 0

    const promises = imageUrls.map(async (url) => {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            loadedCount.value++
            resolve()
          }
          img.onerror = () => {
            errorCount.value++
            reject(new Error(`Failed to load image: ${url}`))
          }
          img.src = url
        })
      } catch (error) {
        console.warn('Image preload failed:', url, error)
      }
    })

    await Promise.allSettled(promises)

    isLoading.value = false
    isComplete.value = true
  }

  const startPreload = () => {
    const imageUrls = Array.isArray(urls) ? urls : urls.value
    preloadImages(imageUrls)
  }

  // 如果是响应式数组，监听变化
  if (!Array.isArray(urls)) {
    watch(urls, startPreload, { immediate: true })
  }

  return {
    loadingCount,
    loadedCount,
    errorCount,
    isLoading,
    isComplete,
    progress,
    startPreload
  }
}

// 导入 computed
import { computed } from 'vue'

/**
 * 响应式图片组合函数
 * 根据设备像素比和容器大小选择最佳图片
 */
export function useResponsiveImage(
  baseUrl: string,
  sizes: { width: number; height: number; suffix?: string }[] = [
    { width: 280, height: 280, suffix: '_small' },
    { width: 560, height: 560, suffix: '_medium' },
    { width: 840, height: 840, suffix: '_large' }
  ]
) {
  const devicePixelRatio = ref(window.devicePixelRatio || 1)
  const containerWidth = ref(280)

  // 选择最佳尺寸
  const optimalSize = computed(() => {
    const targetWidth = containerWidth.value * devicePixelRatio.value

    // 找到第一个宽度大于等于目标宽度的尺寸
    const size = sizes.find(s => s.width >= targetWidth) || sizes[sizes.length - 1]
    return size
  })

  // 生成图片 URL
  const imageUrl = computed(() => {
    const size = optimalSize.value
    const extension = baseUrl.split('.').pop() || 'jpg'
    const baseWithoutExt = baseUrl.replace(/\.[^/.]+$/, '')

    return size.suffix
      ? `${baseWithoutExt}${size.suffix}.${extension}`
      : baseUrl
  })

  // 生成 srcset
  const srcSet = computed(() => {
    return sizes.map(size => {
      const extension = baseUrl.split('.').pop() || 'jpg'
      const baseWithoutExt = baseUrl.replace(/\.[^/.]+$/, '')
      const url = size.suffix
        ? `${baseWithoutExt}${size.suffix}.${extension}`
        : baseUrl

      return `${url} ${size.width}w`
    }).join(', ')
  })

  // 更新容器宽度
  const updateContainerWidth = (width: number) => {
    containerWidth.value = width
  }

  // 监听设备像素比变化
  const handleDevicePixelRatioChange = () => {
    devicePixelRatio.value = window.devicePixelRatio || 1
  }

  onMounted(() => {
    // 监听媒体查询变化
    const mediaQuery = window.matchMedia(`(min-resolution: ${devicePixelRatio.value}dppx)`)
    mediaQuery.addEventListener('change', handleDevicePixelRatioChange)

    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handleDevicePixelRatioChange)
    })
  })

  return {
    imageUrl,
    srcSet,
    optimalSize,
    updateContainerWidth
  }
}