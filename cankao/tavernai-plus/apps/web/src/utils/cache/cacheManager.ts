/**
 * 前端缓存管理系统
 * 支持内存缓存、LocalStorage、SessionStorage 和 IndexedDB
 */

export interface CacheConfig {
  maxAge?: number // 缓存时间（毫秒）
  maxSize?: number // 最大缓存条目数
  storage?: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB'
  compression?: boolean // 是否压缩
}

export interface CacheItem<T = any> {
  data: T
  timestamp: number
  maxAge: number
  key: string
  size?: number
}

/**
 * 内存缓存管理器
 */
export class MemoryCacheManager {
  private cache = new Map<string, CacheItem>()
  private maxSize: number
  private defaultMaxAge: number

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize || 100
    this.defaultMaxAge = config.maxAge || 30 * 60 * 1000 // 30分钟
  }

  set<T>(key: string, data: T, maxAge?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      maxAge: maxAge || this.defaultMaxAge,
      key,
      size: this.calculateSize(data)
    }

    this.cache.set(key, item)
    this.enforceMaxSize()
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > item.maxAge) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // 获取缓存使用情况
  getStats(): {
    totalItems: number
    totalSize: number
    hitRate: number
  } {
    let totalSize = 0
    for (const item of this.cache.values()) {
      totalSize += item.size || 0
    }

    return {
      totalItems: this.cache.size,
      totalSize,
      hitRate: 0 // TODO: 实现命中率统计
    }
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length
    } catch {
      return 0
    }
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) return

    // LRU: 删除最旧的项目
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toDelete = entries.slice(0, this.cache.size - this.maxSize)
    toDelete.forEach(([key]) => this.cache.delete(key))
  }
}

/**
 * LocalStorage 缓存管理器
 */
export class LocalStorageCacheManager {
  private prefix: string
  private defaultMaxAge: number

  constructor(config: CacheConfig = {}, prefix = 'tavernai_cache_') {
    this.prefix = prefix
    this.defaultMaxAge = config.maxAge || 7 * 24 * 60 * 60 * 1000 // 7天
  }

  set<T>(key: string, data: T, maxAge?: number): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        maxAge: maxAge || this.defaultMaxAge,
        key
      }

      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      console.warn('LocalStorage缓存设置失败:', error)
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key)
      if (!raw) return null

      const item: CacheItem<T> = JSON.parse(raw)
      
      // 检查是否过期
      if (Date.now() - item.timestamp > item.maxAge) {
        this.delete(key)
        return null
      }

      return item.data
    } catch (error) {
      console.warn('LocalStorage缓存读取失败:', error)
      return null
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    try {
      localStorage.removeItem(this.prefix + key)
      return true
    } catch {
      return false
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('LocalStorage缓存清理失败:', error)
    }
  }

  // 清理过期缓存
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const cacheKey = key.substring(this.prefix.length)
          this.get(cacheKey) // 这会触发过期检查
        }
      })
    } catch (error) {
      console.warn('LocalStorage缓存清理失败:', error)
    }
  }
}

/**
 * IndexedDB 缓存管理器 (用于大型数据)
 */
export class IndexedDBCacheManager {
  private dbName = 'TavernAICache'
  private version = 1
  private storeName = 'cache'
  private db: IDBDatabase | null = null
  private defaultMaxAge: number

  constructor(config: CacheConfig = {}) {
    this.defaultMaxAge = config.maxAge || 30 * 24 * 60 * 60 * 1000 // 30天
    this.init()
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async set<T>(key: string, data: T, maxAge?: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const item: CacheItem<T> = {
        key,
        data,
        timestamp: Date.now(),
        maxAge: maxAge || this.defaultMaxAge
      }

      const request = store.put(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const item: CacheItem<T> = request.result
        if (!item) {
          resolve(null)
          return
        }

        // 检查是否过期
        if (Date.now() - item.timestamp > item.maxAge) {
          this.delete(key)
          resolve(null)
          return
        }

        resolve(item.data)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async delete(key: string): Promise<boolean> {
    if (!this.db) await this.init()

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
    })
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

/**
 * 统一缓存管理器
 */
export class CacheManager {
  private memoryCache: MemoryCacheManager
  private localStorageCache: LocalStorageCacheManager
  private indexedDBCache: IndexedDBCacheManager

  constructor(config: CacheConfig = {}) {
    this.memoryCache = new MemoryCacheManager(config)
    this.localStorageCache = new LocalStorageCacheManager(config)
    this.indexedDBCache = new IndexedDBCacheManager(config)
  }

  /**
   * 根据数据大小自动选择缓存策略
   */
  async set<T>(key: string, data: T, options: {
    maxAge?: number
    storage?: CacheConfig['storage']
    forceStorage?: boolean
  } = {}): Promise<void> {
    const { maxAge, storage, forceStorage } = options
    
    if (forceStorage) {
      switch (storage) {
        case 'memory':
          this.memoryCache.set(key, data, maxAge)
          break
        case 'localStorage':
          this.localStorageCache.set(key, data, maxAge)
          break
        case 'sessionStorage':
          // TODO: 实现 SessionStorage 管理器
          break
        case 'indexedDB':
          await this.indexedDBCache.set(key, data, maxAge)
          break
        default:
          this.memoryCache.set(key, data, maxAge)
      }
      return
    }

    // 自动选择存储方式
    const dataSize = JSON.stringify(data).length
    
    if (dataSize < 1024) {
      // 小于 1KB: 内存缓存
      this.memoryCache.set(key, data, maxAge)
    } else if (dataSize < 1024 * 1024) {
      // 小于 1MB: LocalStorage
      this.localStorageCache.set(key, data, maxAge)
    } else {
      // 大于 1MB: IndexedDB
      await this.indexedDBCache.set(key, data, maxAge)
    }
  }

  /**
   * 从多层缓存中获取数据
   */
  async get<T>(key: string): Promise<T | null> {
    // 先从内存缓存查找
    let data = this.memoryCache.get<T>(key)
    if (data !== null) return data

    // 再从 LocalStorage 查找
    data = this.localStorageCache.get<T>(key)
    if (data !== null) {
      // 提升到内存缓存
      this.memoryCache.set(key, data)
      return data
    }

    // 最后从 IndexedDB 查找
    data = await this.indexedDBCache.get<T>(key)
    if (data !== null) {
      // 提升到内存缓存
      this.memoryCache.set(key, data)
      return data
    }

    return null
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)
    this.localStorageCache.delete(key)
    await this.indexedDBCache.delete(key)
  }

  /**
   * 清理所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    this.localStorageCache.clear()
    await this.indexedDBCache.clear()
  }

  /**
   * 缓存统计信息
   */
  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      localStorage: {
        // TODO: 实现 localStorage 统计
      }
    }
  }
}

// 默认缓存实例
export const cacheManager = new CacheManager({
  maxAge: 30 * 60 * 1000, // 30分钟
  maxSize: 100
})

// 专用缓存实例
export const imageCacheManager = new CacheManager({
  maxAge: 60 * 60 * 1000, // 1小时
  maxSize: 50
})

export const apiCacheManager = new CacheManager({
  maxAge: 5 * 60 * 1000, // 5分钟
  maxSize: 200
})
