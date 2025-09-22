/**
 * Quick Chat 性能优化组合式函数
 * 负责缓存策略、预加载、内存管理等性能优化
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useCharacterStore, type Character } from '@/stores/character'
import { useChatStore } from '@/stores/chat'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface PerformanceMetrics {
  characterLoadTime: number
  chatCreationTime: number
  cacheHitRate: number
  totalCacheRequests: number
  cacheHits: number
}

export function useQuickChatPerformance() {
  const characterStore = useCharacterStore()
  const chatStore = useChatStore()

  // 缓存管理
  const cache = new Map<string, CacheItem<any>>()
  const DEFAULT_TTL = 5 * 60 * 1000 // 5分钟
  const POPULAR_CHARACTERS_TTL = 15 * 60 * 1000 // 15分钟

  // 性能指标
  const metrics = ref<PerformanceMetrics>({
    characterLoadTime: 0,
    chatCreationTime: 0,
    cacheHitRate: 0,
    totalCacheRequests: 0,
    cacheHits: 0
  })

  // 预加载状态
  const isPreloading = ref(false)
  const preloadProgress = ref(0)

  // 缓存操作
  const setCache = <T>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  const getCache = <T>(key: string): T | null => {
    metrics.value.totalCacheRequests++

    const item = cache.get(key)
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key)
      return null
    }

    metrics.value.cacheHits++
    updateCacheHitRate()
    return item.data as T
  }

  const clearCache = (pattern?: string) => {
    if (pattern) {
      // 清除匹配模式的缓存
      const regex = new RegExp(pattern)
      for (const [key] of cache) {
        if (regex.test(key)) {
          cache.delete(key)
        }
      }
    } else {
      // 清除所有缓存
      cache.clear()
    }
  }

  const updateCacheHitRate = () => {
    if (metrics.value.totalCacheRequests > 0) {
      metrics.value.cacheHitRate =
        (metrics.value.cacheHits / metrics.value.totalCacheRequests) * 100
    }
  }

  // 角色数据预加载
  const preloadPopularCharacters = async (limit: number = 20) => {
    const cacheKey = `popular_characters_${limit}`
    const cached = getCache<Character[]>(cacheKey)

    if (cached) {
      return cached
    }

    isPreloading.value = true
    preloadProgress.value = 0

    try {
      // 分批加载，避免一次性加载过多数据
      const batchSize = 5
      const batches = Math.ceil(limit / batchSize)
      const characters: Character[] = []

      for (let i = 0; i < batches; i++) {
        const offset = i * batchSize
        const batchLimit = Math.min(batchSize, limit - offset)

        await characterStore.fetchCharacters({
          limit: batchLimit,
          page: i + 1,
          sort: 'popular'
        })

        characters.push(...characterStore.characters.slice(offset, offset + batchLimit))
        preloadProgress.value = ((i + 1) / batches) * 100

        // 避免阻塞UI
        await nextTick()
      }

      // 缓存热门角色更长时间
      setCache(cacheKey, characters, POPULAR_CHARACTERS_TTL)
      return characters
    } catch (error) {
      console.error('预加载热门角色失败:', error)
      return []
    } finally {
      isPreloading.value = false
      preloadProgress.value = 100
    }
  }

  // 智能预加载用户可能感兴趣的角色
  const preloadRecommendedCharacters = async () => {
    try {
      // 基于用户最近使用的角色标签预加载
      const recentCharacters = characterStore.recentCharacters
      if (recentCharacters.length === 0) {
        return
      }

      // 提取常用标签
      const tagCounts = new Map<string, number>()
      recentCharacters.forEach(character => {
        character.tags?.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      })

      // 获取最常用的3个标签
      const popularTags = Array.from(tagCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag)

      if (popularTags.length === 0) {
        return
      }

      // 预加载相关角色
      for (const tag of popularTags) {
        const cacheKey = `recommended_${tag}`
        const cached = getCache<Character[]>(cacheKey)

        if (!cached) {
          // 在后台加载，不阻塞UI
          setTimeout(async () => {
            try {
              await characterStore.fetchCharacters({
                limit: 6,
                tags: tag,
                sort: 'rating'
              })

              setCache(cacheKey, characterStore.characters.slice(0, 6))
            } catch (error) {
              console.warn(`预加载标签 ${tag} 的角色失败:`, error)
            }
          }, 1000 + Math.random() * 2000) // 随机延迟，避免同时请求
        }
      }
    } catch (error) {
      console.error('预加载推荐角色失败:', error)
    }
  }

  // 快速获取角色（带缓存）
  const getCharacterFast = async (characterId: string): Promise<Character | null> => {
    const startTime = performance.now()
    const cacheKey = `character_${characterId}`

    // 尝试从缓存获取
    let character = getCache<Character>(cacheKey)

    if (!character) {
      // 缓存未命中，从store获取
      character = await characterStore.getCharacterForQuickChat(characterId)

      if (character) {
        // 缓存角色数据
        setCache(cacheKey, character)
      }
    }

    metrics.value.characterLoadTime = performance.now() - startTime
    return character
  }

  // 快速创建对话（带缓存和优化）
  const createChatFast = async (
    character: Character,
    settings?: any
  ): Promise<string | null> => {
    const startTime = performance.now()

    try {
      // 检查是否有现有会话
      const sessionResult = await chatStore.getOrCreateSession(
        character.id,
        character.name,
        character.avatar
      )

      let sessionId: string

      if (sessionResult.isExisting) {
        // 如果有现有会话，直接使用
        sessionId = sessionResult.session.id
      } else {
        // 创建新会话
        const session = await chatStore.createQuickConversation(
          character.id,
          character.name,
          character.avatar,
          settings
        )

        if (!session) {
          throw new Error('创建会话失败')
        }

        sessionId = session.id
      }

      metrics.value.chatCreationTime = performance.now() - startTime
      return sessionId
    } catch (error) {
      console.error('快速创建对话失败:', error)
      metrics.value.chatCreationTime = performance.now() - startTime
      return null
    }
  }

  // 内存管理 - 清理过期缓存
  const cleanupExpiredCache = () => {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, item] of cache) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => cache.delete(key))

    if (expiredKeys.length > 0) {
      console.log(`清理了 ${expiredKeys.length} 个过期缓存项`)
    }
  }

  // 预取下一个可能的角色
  const prefetchNextCharacter = async (currentCharacterId: string) => {
    try {
      // 基于当前角色的标签预取相关角色
      const currentCharacter = await getCharacterFast(currentCharacterId)
      if (!currentCharacter?.tags?.length) {
        return
      }

      // 随机选择一个标签进行预取
      const randomTag = currentCharacter.tags[
        Math.floor(Math.random() * currentCharacter.tags.length)
      ]

      const cacheKey = `prefetch_${randomTag}`
      if (!getCache(cacheKey)) {
        setTimeout(async () => {
          try {
            await characterStore.fetchCharacters({
              limit: 3,
              tags: randomTag,
              sort: 'popular'
            })
            setCache(cacheKey, characterStore.characters.slice(0, 3), DEFAULT_TTL / 2)
          } catch (error) {
            console.warn('预取相关角色失败:', error)
          }
        }, 2000)
      }
    } catch (error) {
      console.warn('预取下一个角色失败:', error)
    }
  }

  // 性能监控
  const getPerformanceReport = () => {
    return {
      ...metrics.value,
      cacheSize: cache.size,
      cacheMemoryUsage: getCacheMemoryUsage()
    }
  }

  const getCacheMemoryUsage = (): number => {
    let totalSize = 0
    for (const [key, item] of cache) {
      totalSize += JSON.stringify({ key, item }).length * 2 // 粗略估算
    }
    return Math.round(totalSize / 1024) // KB
  }

  // 重置性能指标
  const resetMetrics = () => {
    metrics.value = {
      characterLoadTime: 0,
      chatCreationTime: 0,
      cacheHitRate: 0,
      totalCacheRequests: 0,
      cacheHits: 0
    }
  }

  // 定期清理缓存
  let cleanupInterval: NodeJS.Timeout

  onMounted(() => {
    // 每5分钟清理一次过期缓存
    cleanupInterval = setInterval(cleanupExpiredCache, 5 * 60 * 1000)

    // 加载最近使用的角色
    characterStore.loadRecentCharacters()

    // 延迟预加载热门角色
    setTimeout(() => {
      preloadPopularCharacters()
      preloadRecommendedCharacters()
    }, 2000)
  })

  onUnmounted(() => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
    }
  })

  return {
    // 状态
    isPreloading,
    preloadProgress,
    metrics: computed(() => metrics.value),

    // 缓存操作
    setCache,
    getCache,
    clearCache,
    cleanupExpiredCache,

    // 预加载
    preloadPopularCharacters,
    preloadRecommendedCharacters,
    prefetchNextCharacter,

    // 快速操作
    getCharacterFast,
    createChatFast,

    // 性能监控
    getPerformanceReport,
    resetMetrics,
    getCacheMemoryUsage
  }
}

// 全局性能优化工具
export const QuickChatPerformance = {
  // 图片预加载
  preloadImage: (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
  },

  // 批量预加载图片
  preloadImages: async (urls: string[], maxConcurrent: number = 3): Promise<void> => {
    const chunks = []
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      chunks.push(urls.slice(i, i + maxConcurrent))
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(url => QuickChatPerformance.preloadImage(url))
      )
    }
  },

  // 防抖函数
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }
  },

  // 节流函数
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}