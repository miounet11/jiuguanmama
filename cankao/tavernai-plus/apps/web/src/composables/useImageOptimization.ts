// 图片优化组合函数 - Issue #36
import { ref, onMounted } from 'vue'

interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  sizes?: number[]
  lazyLoad?: boolean
}

export const useImageOptimization = () => {
  const supportsWebP = ref(false)
  const supportsAVIF = ref(false)
  
  // 检测浏览器格式支持
  const detectFormatSupport = async () => {
    // 检测WebP支持
    const webpTest = new Promise<boolean>((resolve) => {
      const webP = new Image()
      webP.onload = () => resolve(webP.width === 1)
      webP.onerror = () => resolve(false)
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
    
    // 检测AVIF支持
    const avifTest = new Promise<boolean>((resolve) => {
      const avif = new Image()
      avif.onload = () => resolve(avif.width === 1)
      avif.onerror = () => resolve(false)
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    })
    
    supportsWebP.value = await webpTest
    supportsAVIF.value = await avifTest
  }

  // 生成最佳格式URL
  const getOptimalImageUrl = (
    baseUrl: string, 
    options: ImageOptimizationOptions = {}
  ) => {
    const { quality = 80, format, sizes = [320, 640, 960, 1280] } = options
    
    // 自动选择最佳格式
    let optimalFormat = format
    if (!optimalFormat) {
      if (supportsAVIF.value) {
        optimalFormat = 'avif'
      } else if (supportsWebP.value) {
        optimalFormat = 'webp'
      } else {
        optimalFormat = 'jpg'
      }
    }
    
    // 生成URL（假设有图片处理服务）
    const url = new URL(baseUrl, window.location.origin)
    url.searchParams.set('f', optimalFormat)
    url.searchParams.set('q', quality.toString())
    
    return url.toString()
  }

  // 生成响应式图片srcset
  const generateSrcSet = (
    baseUrl: string,
    options: ImageOptimizationOptions = {}
  ) => {
    const { quality = 80, sizes = [320, 640, 960, 1280] } = options
    
    const format = supportsAVIF.value ? 'avif' : 
                   supportsWebP.value ? 'webp' : 'jpg'
    
    return sizes.map(size => {
      const url = new URL(baseUrl, window.location.origin)
      url.searchParams.set('w', size.toString())
      url.searchParams.set('f', format)
      url.searchParams.set('q', quality.toString())
      return `${url.toString()} ${size}w`
    }).join(', ')
  }

  // 懒加载实现
  const createLazyLoader = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            const srcset = img.dataset.srcset
            
            if (src) {
              img.src = src
            }
            if (srcset) {
              img.srcset = srcset
            }
            
            img.classList.remove('lazy-loading')
            img.classList.add('lazy-loaded')
            observer.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    )
    
    return observer
  }

  // 图片懒加载指令
  const lazyLoadImage = (el: HTMLImageElement, binding: any) => {
    const { src, srcset, placeholder = '/placeholder.webp' } = binding.value
    
    // 设置占位图
    el.src = placeholder
    el.classList.add('lazy-loading')
    
    // 存储真实的src和srcset
    if (src) {
      el.dataset.src = getOptimalImageUrl(src)
    }
    if (srcset) {
      el.dataset.srcset = generateSrcSet(src)
    }
    
    // 添加到观察者
    const observer = createLazyLoader()
    observer.observe(el)
  }

  // 预加载关键图片
  const preloadImages = (urls: string[]) => {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = getOptimalImageUrl(url)
      document.head.appendChild(link)
    })
  }

  // 图片压缩（客户端）
  const compressImage = (
    file: File, 
    maxWidth = 1920, 
    quality = 0.8
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // 计算压缩后尺寸
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制并压缩
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve!, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // 图片加载错误处理
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    if (!img.dataset.errorHandled) {
      img.dataset.errorHandled = 'true'
      img.src = '/fallback.webp' // 回退图片
      console.warn('图片加载失败，使用回退图片:', img.dataset.src)
    }
  }

  onMounted(() => {
    detectFormatSupport()
  })

  return {
    supportsWebP: readonly(supportsWebP),
    supportsAVIF: readonly(supportsAVIF),
    getOptimalImageUrl,
    generateSrcSet,
    lazyLoadImage,
    preloadImages,
    compressImage,
    handleImageError,
    createLazyLoader
  }
}

// Vue指令：图片懒加载
export const vLazy = {
  mounted(el: HTMLImageElement, binding: any) {
    const { useImageOptimization } = useImageOptimization()
    useImageOptimization().lazyLoadImage(el, binding)
  }
}
