// 图像处理工具函数

import type {
  BaseImage,
  ImageGenerationSettings,
  ImageAnalysis,
  DominantColor,
  BoundingBox
} from '@/types/image'

/**
 * 文件大小格式化
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 图像尺寸格式化
 */
export function formatImageDimensions(width: number, height: number): string {
  return `${width}×${height}`
}

/**
 * 计算图像宽高比
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

/**
 * 获取宽高比描述
 */
export function getAspectRatioLabel(ratio: number): string {
  const ratios = [
    { ratio: 1, label: '1:1 (正方形)' },
    { ratio: 4/3, label: '4:3 (标准)' },
    { ratio: 3/2, label: '3:2 (经典)' },
    { ratio: 16/9, label: '16:9 (宽屏)' },
    { ratio: 21/9, label: '21:9 (超宽)' },
    { ratio: 3/4, label: '3:4 (竖版)' },
    { ratio: 2/3, label: '2:3 (肖像)' },
    { ratio: 9/16, label: '9:16 (手机)' }
  ]

  const closest = ratios.reduce((prev, curr) =>
    Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev
  )

  return closest.label
}

/**
 * 验证图像文件
 */
export function validateImageFile(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    maxWidth?: number
    maxHeight?: number
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxWidth = 4096,
      maxHeight = 4096
    } = options

    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: `不支持的文件类型。支持的格式: ${allowedTypes.join(', ')}`
      })
      return
    }

    // 检查文件大小
    if (file.size > maxSize) {
      resolve({
        valid: false,
        error: `文件大小超出限制。最大允许: ${formatFileSize(maxSize)}`
      })
      return
    }

    // 检查图像尺寸
    const img = new Image()
    img.onload = () => {
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          valid: false,
          error: `图像尺寸超出限制。最大允许: ${maxWidth}×${maxHeight}`
        })
        return
      }

      resolve({ valid: true })
    }

    img.onerror = () => {
      resolve({
        valid: false,
        error: '无法读取图像文件'
      })
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 图像压缩
 */
export function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: string
  } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/jpeg'
    } = options

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算新尺寸
      let { width, height } = calculateResizedDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      )

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图像
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('图像压缩失败'))
        }
      }, format, quality)
    }

    img.onerror = () => reject(new Error('无法加载图像'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 计算调整后的尺寸
 */
export function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight

  let width = originalWidth
  let height = originalHeight

  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * 生成图像缩略图
 */
export function generateThumbnail(
  file: File,
  size: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const { width, height } = calculateResizedDimensions(
        img.width,
        img.height,
        size,
        size
      )

      canvas.width = width
      canvas.height = height

      ctx?.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    img.onerror = () => reject(new Error('无法生成缩略图'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 下载图像
 */
export async function downloadImage(
  url: string,
  filename?: string
): Promise<void> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename || `image-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    throw new Error('下载失败')
  }
}

/**
 * 图像格式转换
 */
export function convertImageFormat(
  file: File,
  targetFormat: string,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      // 如果目标格式是JPEG，设置白色背景
      if (targetFormat === 'image/jpeg') {
        ctx!.fillStyle = '#FFFFFF'
        ctx!.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx?.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('格式转换失败'))
        }
      }, targetFormat, quality)
    }

    img.onerror = () => reject(new Error('无法加载图像'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 检测图像主色调
 */
export function extractDominantColors(
  imageElement: HTMLImageElement,
  colorCount: number = 5
): DominantColor[] {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // 缩小图像以提高性能
  const sampleSize = 100
  canvas.width = sampleSize
  canvas.height = sampleSize

  ctx.drawImage(imageElement, 0, 0, sampleSize, sampleSize)

  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
  const data = imageData.data

  const colorMap = new Map<string, number>()

  // 采样像素颜色
  for (let i = 0; i < data.length; i += 16) { // 跳过像素以提高性能
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    // 跳过透明像素
    if (a < 128) continue

    // 量化颜色以减少变体
    const quantizedR = Math.round(r / 32) * 32
    const quantizedG = Math.round(g / 32) * 32
    const quantizedB = Math.round(b / 32) * 32

    const colorKey = `${quantizedR},${quantizedG},${quantizedB}`
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
  }

  // 按频率排序并转换为DominantColor格式
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, colorCount)

  const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0)

  return sortedColors.map(([color, count]) => {
    const [r, g, b] = color.split(',').map(Number)
    const hex = rgbToHex(r, g, b)
    const hsl = rgbToHsl(r, g, b)

    return {
      color: `rgb(${r}, ${g}, ${b})`,
      hex,
      rgb: [r, g, b] as [number, number, number],
      hsl,
      percentage: count / totalPixels
    }
  })
}

/**
 * RGB转十六进制
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * RGB转HSL
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h: number, s: number, l: number

  l = (max + min) / 2

  if (max === min) {
    h = s = 0 // 无色彩
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
    }

    h /= 6
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

/**
 * 颜色亮度计算
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * 对比度计算
 */
export function calculateContrast(color1: [number, number, number], color2: [number, number, number]): number {
  const lum1 = calculateLuminance(...color1)
  const lum2 = calculateLuminance(...color2)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * 图像锐度检测
 */
export function detectImageSharpness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let sum = 0
  let count = 0

  // 使用Sobel算子检测边缘
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const idx = (y * canvas.width + x) * 4

      // 获取周围像素的灰度值
      const getGray = (offset: number) => {
        const i = idx + offset
        return (data[i] + data[i + 1] + data[i + 2]) / 3
      }

      const gx = -getGray(-4) + getGray(4)
      const gy = -getGray(-canvas.width * 4) + getGray(canvas.width * 4)

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      sum += magnitude
      count++
    }
  }

  return count > 0 ? sum / count : 0
}

/**
 * 生成随机种子
 */
export function generateRandomSeed(): string {
  return Math.floor(Math.random() * 4294967295).toString()
}

/**
 * 验证提示词质量
 */
export function validatePromptQuality(prompt: string): {
  score: number
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // 长度检查
  if (prompt.length < 10) {
    score -= 30
    issues.push('提示词过短')
    suggestions.push('添加更多描述性词汇')
  }

  if (prompt.length > 500) {
    score -= 10
    issues.push('提示词过长')
    suggestions.push('精简提示词内容')
  }

  // 词汇重复检查
  const words = prompt.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)
  const repetitionRatio = uniqueWords.size / words.length

  if (repetitionRatio < 0.7) {
    score -= 20
    issues.push('词汇重复过多')
    suggestions.push('使用更多样化的词汇')
  }

  // 标点符号检查
  const commaCount = (prompt.match(/,/g) || []).length
  if (commaCount === 0 && words.length > 5) {
    score -= 10
    issues.push('缺少标点符号分隔')
    suggestions.push('使用逗号分隔不同的描述元素')
  }

  // 质量词汇检查
  const qualityWords = ['high quality', 'detailed', 'masterpiece', 'best quality', '4k', '8k']
  const hasQualityWords = qualityWords.some(word =>
    prompt.toLowerCase().includes(word)
  )

  if (!hasQualityWords) {
    suggestions.push('添加质量描述词如 "high quality", "detailed" 等')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    suggestions
  }
}

/**
 * 构建边界框CSS样式
 */
export function boundingBoxToStyle(
  box: BoundingBox,
  containerWidth: number,
  containerHeight: number
): Record<string, string> {
  return {
    position: 'absolute',
    left: `${(box.x / containerWidth) * 100}%`,
    top: `${(box.y / containerHeight) * 100}%`,
    width: `${(box.width / containerWidth) * 100}%`,
    height: `${(box.height / containerHeight) * 100}%`,
    border: '2px solid #00ff00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    pointerEvents: 'none'
  }
}

/**
 * 图像缓存管理
 */
export class ImageCache {
  private cache = new Map<string, string>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  set(key: string, dataUrl: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, dataUrl)
  }

  get(key: string): string | undefined {
    return this.cache.get(key)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }
}

/**
 * 图像懒加载处理
 */
export function setupImageLazyLoading(
  container: HTMLElement,
  options: {
    rootMargin?: string
    threshold?: number
  } = {}
): IntersectionObserver {
  const { rootMargin = '50px', threshold = 0.1 } = options

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const dataSrc = img.getAttribute('data-src')

          if (dataSrc) {
            img.src = dataSrc
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    },
    { rootMargin, threshold }
  )

  // 观察容器内的所有图像
  const images = container.querySelectorAll('img[data-src]')
  images.forEach((img) => observer.observe(img))

  return observer
}

/**
 * 检测用户设备性能
 */
export function detectDevicePerformance(): 'low' | 'medium' | 'high' {
  // 基于多个因素评估设备性能
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl')

  if (!gl) return 'low'

  const renderer = gl.getParameter(gl.RENDERER)
  const vendor = gl.getParameter(gl.VENDOR)

  // 检查硬件加速
  const hasHardwareAcceleration = !renderer.includes('Software')

  // 检查内存
  const memory = (navigator as any).deviceMemory || 4

  // 检查CPU核心数
  const cores = navigator.hardwareConcurrency || 4

  // 综合评分
  let score = 0

  if (hasHardwareAcceleration) score += 3
  if (memory >= 8) score += 3
  else if (memory >= 4) score += 2
  else score += 1

  if (cores >= 8) score += 2
  else if (cores >= 4) score += 1

  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

// 创建全局图像缓存实例
export const imageCache = new ImageCache()
