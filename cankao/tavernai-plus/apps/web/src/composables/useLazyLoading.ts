/**
 * 懒加载组合式函数
 * 用于实现图片、组件等资源的懒加载
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number
  once?: boolean
}

/**
 * 图片懒加载
 */
export function useLazyImage(src: string, options: LazyLoadOptions = {}) {
  const imgRef = ref<HTMLImageElement>()
  const isLoaded = ref(false)
  const isError = ref(false)
  const isIntersecting = ref(false)
  
  const {
    rootMargin = '50px',
    threshold = 0.1,
    once = true
  } = options

  let observer: IntersectionObserver | null = null

  const load = () => {
    if (!imgRef.value || isLoaded.value) return

    const img = new Image()
    
    img.onload = () => {
      if (imgRef.value) {
        imgRef.value.src = src
        isLoaded.value = true
        isError.value = false
      }
    }
    
    img.onerror = () => {
      isError.value = true
      isLoaded.value = false
    }
    
    img.src = src
  }

  onMounted(() => {
    nextTick(() => {
      if (!imgRef.value) return

      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0]
            isIntersecting.value = entry.isIntersecting
            
            if (entry.isIntersecting) {
              load()
              if (once && observer) {
                observer.unobserve(imgRef.value!)
              }
            }
          },
          {
            rootMargin,
            threshold
          }
        )
        
        observer.observe(imgRef.value)
      } else {
        // Fallback: 直接加载
        load()
      }
    })
  })

  onUnmounted(() => {
    if (observer && imgRef.value) {
      observer.unobserve(imgRef.value)
    }
  })

  return {
    imgRef,
    isLoaded,
    isError,
    isIntersecting,
    load
  }
}

/**
 * 组件懒加载
 */
export function useLazyComponent(options: LazyLoadOptions = {}) {
  const containerRef = ref<HTMLElement>()
  const isVisible = ref(false)
  const hasBeenVisible = ref(false)
  
  const {
    rootMargin = '100px',
    threshold = 0.1,
    once = true
  } = options

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    nextTick(() => {
      if (!containerRef.value) return

      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0]
            isVisible.value = entry.isIntersecting
            
            if (entry.isIntersecting) {
              hasBeenVisible.value = true
              if (once && observer) {
                observer.unobserve(containerRef.value!)
              }
            }
          },
          {
            rootMargin,
            threshold
          }
        )
        
        observer.observe(containerRef.value)
      } else {
        // Fallback: 直接显示
        isVisible.value = true
        hasBeenVisible.value = true
      }
    })
  })

  onUnmounted(() => {
    if (observer && containerRef.value) {
      observer.unobserve(containerRef.value)
    }
  })

  return {
    containerRef,
    isVisible,
    hasBeenVisible,
    shouldRender: once ? hasBeenVisible : isVisible
  }
}

/**
 * 虚拟滚动列表
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  options: {
    overscan?: number
    buffer?: number
  } = {}
) {
  const containerRef = ref<HTMLElement>()
  const scrollTop = ref(0)
  const { overscan = 5, buffer = 200 } = options

  // 计算可见范围
  const visibleRange = ref({
    start: 0,
    end: 0
  })

  // 计算显示的项目
  const visibleItems = ref<Array<{
    index: number
    item: T
    top: number
  }>>([])

  const updateVisibleItems = () => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )

    visibleRange.value = { start, end }
    
    visibleItems.value = []
    for (let i = start; i < end; i++) {
      if (items[i]) {
        visibleItems.value.push({
          index: i,
          item: items[i],
          top: i * itemHeight
        })
      }
    }
  }

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
    updateVisibleItems()
  }

  // 总高度
  const totalHeight = ref(items.length * itemHeight)

  onMounted(() => {
    updateVisibleItems()
  })

  return {
    containerRef,
    visibleItems,
    totalHeight,
    handleScroll,
    updateVisibleItems
  }
}

/**
 * 资源预加载
 */
export function useResourcePreloader() {
  const preloadedResources = new Set<string>()
  const loadingResources = new Map<string, Promise<void>>()

  const preloadImage = (src: string): Promise<void> => {
    if (preloadedResources.has(src)) {
      return Promise.resolve()
    }

    if (loadingResources.has(src)) {
      return loadingResources.get(src)!
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        preloadedResources.add(src)
        loadingResources.delete(src)
        resolve()
      }
      img.onerror = () => {
        loadingResources.delete(src)
        reject(new Error(`Failed to preload image: ${src}`))
      }
      img.src = src
    })

    loadingResources.set(src, promise)
    return promise
  }

  const preloadImages = (sources: string[]): Promise<void[]> => {
    return Promise.all(sources.map(preloadImage))
  }

  const preloadComponent = (componentLoader: () => Promise<any>): Promise<any> => {
    return componentLoader()
  }

  return {
    preloadImage,
    preloadImages,
    preloadComponent,
    preloadedResources
  }
}

/**
 * 图片渐进式加载
 */
export function useProgressiveImage(
  thumbnailSrc: string,
  fullSrc: string,
  options: LazyLoadOptions = {}
) {
  const { imgRef, isIntersecting } = useLazyImage(fullSrc, options)
  const currentSrc = ref(thumbnailSrc)
  const isFullLoaded = ref(false)
  const isLoading = ref(false)

  const loadFullImage = async () => {
    if (isFullLoaded.value || isLoading.value) return

    isLoading.value = true
    
    try {
      const img = new Image()
      img.src = fullSrc
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      
      currentSrc.value = fullSrc
      isFullLoaded.value = true
    } catch (error) {
      console.warn('Failed to load full image:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 当图片进入视口时加载完整版本
  onMounted(() => {
    const unwatch = () => {
      if (isIntersecting.value) {
        loadFullImage()
      }
    }
    
    // 监听 isIntersecting 变化
    const stopWatching = () => {}
    return stopWatching
  })

  return {
    imgRef,
    currentSrc,
    isFullLoaded,
    isLoading,
    loadFullImage
  }
}
