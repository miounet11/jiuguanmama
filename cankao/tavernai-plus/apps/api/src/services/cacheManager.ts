import NodeCache from 'node-cache'
import { prisma } from '../lib/prisma'

export interface CacheConfig {
  ttl: number // 生存时间（秒）
  checkPeriod: number // 检查过期间隔（秒）
  maxKeys: number // 最大键数量
}

export interface CacheStats {
  hits: number
  misses: number
  keys: number
  ksize: number
  vsize: number
}

export class CacheManager {
  private static instance: CacheManager
  private caches: Map<string, NodeCache> = new Map()
  private stats: Map<string, { hits: number; misses: number }> = new Map()

  // 默认缓存配置
  private readonly defaultConfigs: Record<string, CacheConfig> = {
    // 推荐系统缓存
    recommendations: {
      ttl: 300, // 5分钟
      checkPeriod: 60,
      maxKeys: 1000
    },
    // 用户缓存
    users: {
      ttl: 600, // 10分钟
      checkPeriod: 120,
      maxKeys: 500
    },
    // 角色缓存
    characters: {
      ttl: 1800, // 30分钟
      checkPeriod: 300,
      maxKeys: 2000
    },
    // 热门内容缓存
    trending: {
      ttl: 900, // 15分钟
      checkPeriod: 180,
      maxKeys: 100
    },
    // 用户画像缓存
    profiles: {
      ttl: 3600, // 1小时
      checkPeriod: 600,
      maxKeys: 1000
    },
    // 社区内容缓存
    community: {
      ttl: 300, // 5分钟
      checkPeriod: 60,
      maxKeys: 500
    },
    // 搜索结果缓存
    search: {
      ttl: 1800, // 30分钟
      checkPeriod: 300,
      maxKeys: 200
    }
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  constructor() {
    this.initializeCaches()
  }

  /**
   * 初始化所有缓存实例
   */
  private initializeCaches(): void {
    Object.entries(this.defaultConfigs).forEach(([name, config]) => {
      const cache = new NodeCache({
        stdTTL: config.ttl,
        checkperiod: config.checkPeriod,
        maxKeys: config.maxKeys,
        useClones: false,
        deleteOnExpire: true
      })

      // 监听缓存事件
      cache.on('set', (key, value) => {
        console.log(`[Cache:${name}] SET ${key}`)
      })

      cache.on('del', (key, value) => {
        console.log(`[Cache:${name}] DEL ${key}`)
      })

      cache.on('expired', (key, value) => {
        console.log(`[Cache:${name}] EXPIRED ${key}`)
      })

      this.caches.set(name, cache)
      this.stats.set(name, { hits: 0, misses: 0 })
    })

    console.log('✅ 缓存管理器初始化完成')
  }

  /**
   * 获取缓存值
   */
  get<T>(cacheName: string, key: string): T | undefined {
    const cache = this.caches.get(cacheName)
    const stats = this.stats.get(cacheName)

    if (!cache || !stats) {
      console.warn(`Cache ${cacheName} not found`)
      return undefined
    }

    const value = cache.get<T>(key)

    if (value !== undefined) {
      stats.hits++
      console.log(`[Cache:${cacheName}] HIT ${key}`)
    } else {
      stats.misses++
      console.log(`[Cache:${cacheName}] MISS ${key}`)
    }

    return value
  }

  /**
   * 设置缓存值
   */
  set<T>(cacheName: string, key: string, value: T, ttl?: number): boolean {
    const cache = this.caches.get(cacheName)

    if (!cache) {
      console.warn(`Cache ${cacheName} not found`)
      return false
    }

    return cache.set(key, value, ttl || 0)
  }

  /**
   * 删除缓存值
   */
  del(cacheName: string, key: string): number {
    const cache = this.caches.get(cacheName)

    if (!cache) {
      console.warn(`Cache ${cacheName} not found`)
      return 0
    }

    return cache.del(key)
  }

  /**
   * 清空指定缓存
   */
  flush(cacheName: string): void {
    const cache = this.caches.get(cacheName)

    if (!cache) {
      console.warn(`Cache ${cacheName} not found`)
      return
    }

    cache.flushAll()
    console.log(`[Cache:${cacheName}] FLUSHED`)
  }

  /**
   * 清空所有缓存
   */
  flushAll(): void {
    this.caches.forEach((cache, name) => {
      cache.flushAll()
      console.log(`[Cache:${name}] FLUSHED`)
    })
  }

  /**
   * 获取缓存统计信息
   */
  getStats(cacheName?: string): Record<string, CacheStats> | CacheStats | null {
    if (cacheName) {
      const cache = this.caches.get(cacheName)
      const stats = this.stats.get(cacheName)

      if (!cache || !stats) {
        return null
      }

      const cacheStats = cache.getStats()
      return {
        hits: stats.hits,
        misses: stats.misses,
        keys: cacheStats.keys,
        ksize: cacheStats.ksize,
        vsize: cacheStats.vsize
      }
    }

    // 返回所有缓存的统计信息
    const allStats: Record<string, CacheStats> = {}

    this.caches.forEach((cache, name) => {
      const stats = this.stats.get(name)!
      const cacheStats = cache.getStats()

      allStats[name] = {
        hits: stats.hits,
        misses: stats.misses,
        keys: cacheStats.keys,
        ksize: cacheStats.ksize,
        vsize: cacheStats.vsize
      }
    })

    return allStats
  }

  /**
   * 获取缓存命中率
   */
  getHitRate(cacheName: string): number {
    const stats = this.stats.get(cacheName)

    if (!stats) {
      return 0
    }

    const total = stats.hits + stats.misses
    return total > 0 ? stats.hits / total : 0
  }

  /**
   * 获取所有缓存的命中率
   */
  getAllHitRates(): Record<string, number> {
    const hitRates: Record<string, number> = {}

    this.stats.forEach((stats, name) => {
      const total = stats.hits + stats.misses
      hitRates[name] = total > 0 ? stats.hits / total : 0
    })

    return hitRates
  }

  /**
   * 检查缓存健康状况
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    // 检查内存使用
    const allStats = this.getStats() as Record<string, CacheStats>
    let totalMemory = 0

    Object.entries(allStats).forEach(([name, stats]) => {
      totalMemory += stats.vsize

      // 检查命中率
      const hitRate = this.getHitRate(name)
      if (hitRate < 0.5) {
        issues.push(`${name}缓存命中率较低: ${(hitRate * 100).toFixed(1)}%`)
        recommendations.push(`优化${name}缓存策略或增加TTL`)
      }

      // 检查键数量
      if (stats.keys > this.defaultConfigs[name]?.maxKeys * 0.9) {
        issues.push(`${name}缓存接近最大容量`)
        recommendations.push(`考虑增加${name}缓存容量或减少TTL`)
      }
    })

    // 检查总内存使用（假设限制为100MB）
    const memoryLimitMB = 100
    const totalMemoryMB = totalMemory / (1024 * 1024)

    if (totalMemoryMB > memoryLimitMB * 0.9) {
      issues.push(`缓存内存使用过高: ${totalMemoryMB.toFixed(1)}MB`)
      recommendations.push('考虑减少缓存TTL或增加内存限制')
    }

    const status = issues.length === 0 ? 'healthy' :
                   issues.length <= 2 ? 'warning' : 'critical'

    return { status, issues, recommendations }
  }

  /**
   * 预热缓存
   */
  async warmup(): Promise<void> {
    try {
      console.log('🔥 开始缓存预热...')

      // 预热热门角色
      const popularCharacters = await prisma.character.findMany({
        where: { isPublic: true, isDeleted: false },
        include: {
          creator: {
            select: { id: true, username: true, avatar: true }
          },
          _count: {
            select: { chatSessions: true }
          }
        },
        orderBy: {
          chatSessions: { _count: 'desc' }
        },
        take: 50
      })

      popularCharacters.forEach((character: any) => {
        this.set('characters', `character:${character.id}`, character)
      })

      // 预热活跃用户
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          isVerified: true
        },
        orderBy: { lastLogin: 'desc' },
        take: 100
      })

      activeUsers.forEach((user: any) => {
        this.set('users', `user:${user.id}`, user)
      })

      // 预热热门内容
      const trendingPosts = await prisma.post.findMany({
        where: {
          isDeleted: false,
          visibility: 'public',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          author: {
            select: { id: true, username: true, avatar: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        },
        orderBy: [
          { likes: { _count: 'desc' } },
          { comments: { _count: 'desc' } }
        ],
        take: 20
      })

      this.set('trending', 'posts:weekly', trendingPosts)

      console.log('✅ 缓存预热完成')
    } catch (error) {
      console.error('❌ 缓存预热失败:', error)
    }
  }

  /**
   * 缓存装饰器工厂
   */
  cache(cacheName: string, keyGenerator: (...args: any[]) => string, ttl?: number) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const key = keyGenerator(...args)
        const cached = CacheManager.getInstance().get(cacheName, key)

        if (cached !== undefined) {
          return cached
        }

        const result = await method.apply(this, args)
        CacheManager.getInstance().set(cacheName, key, result, ttl)

        return result
      }
    }
  }

  /**
   * 智能缓存失效
   */
  invalidatePattern(cacheName: string, pattern: string): number {
    const cache = this.caches.get(cacheName)

    if (!cache) {
      return 0
    }

    const keys = cache.keys()
    const regex = new RegExp(pattern)
    let deletedCount = 0

    keys.forEach(key => {
      if (regex.test(key)) {
        cache.del(key)
        deletedCount++
      }
    })

    console.log(`[Cache:${cacheName}] INVALIDATED ${deletedCount} keys matching pattern: ${pattern}`)
    return deletedCount
  }

  /**
   * 批量操作
   */
  mget<T>(cacheName: string, keys: string[]): Record<string, T> {
    const cache = this.caches.get(cacheName)
    const result: Record<string, T> = {}

    if (!cache) {
      return result
    }

    keys.forEach(key => {
      const value = cache.get<T>(key)
      if (value !== undefined) {
        result[key] = value
      }
    })

    return result
  }

  /**
   * 批量设置
   */
  mset<T>(cacheName: string, keyValuePairs: Record<string, T>, ttl?: number): boolean {
    const cache = this.caches.get(cacheName)

    if (!cache) {
      return false
    }

    let success = true
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      if (!cache.set(key, value, ttl || 0)) {
        success = false
      }
    })

    return success
  }
}

export default CacheManager.getInstance()
