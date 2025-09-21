/**
 * 性能优化的 API 服务层
 * 集成缓存、重试、防抖等功能
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { apiCacheManager } from '@/utils/cache/cacheManager'

// API 配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007'
const TIMEOUT = 30000
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// 创建优化的 axios 实例
const optimizedApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 生成请求缓存键
 */
function generateCacheKey(config: AxiosRequestConfig): string {
  const { method, url, params } = config
  const methodUpper = method ? method.toUpperCase() : 'GET'
  const key = methodUpper + '_' + url
  
  if (params) {
    return key + '_' + new Date().getTime().toString()
  }
  
  return key
}

/**
 * 睡眠函数
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 重试装饰器
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (retries > 0 && isRetryableError(error)) {
      await sleep(delay)
      return withRetry(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

/**
 * 判断是否为可重试的错误
 */
function isRetryableError(error: any): boolean {
  if (!error.response) {
    return true
  }
  
  const status = error.response.status
  return status >= 500 || status === 429
}

// 请求拦截器
optimizedApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
optimizedApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  async (error) => {
    const { response } = error

    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 401:
          localStorage.removeItem('token')
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
          break
          
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
          
        case 404:
          ElMessage.error('请求的资源不存在')
          break
          
        case 429:
          ElMessage.error('请求过于频繁，请稍后再试')
          break
          
        case 500:
          ElMessage.error('服务器内部错误')
          break
          
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络设置')
    }

    return Promise.reject(error)
  }
)

/**
 * 优化的请求函数
 */
async function optimizedRequest<T = any>(
  config: AxiosRequestConfig,
  options: {
    useCache?: boolean
    useRetry?: boolean
  } = {}
): Promise<T> {
  const { useCache = true, useRetry = true } = options
  const method = config.method ? config.method.toLowerCase() : 'get'
  
  // 对GET请求使用缓存
  if (useCache && method === 'get') {
    const cacheKey = generateCacheKey(config)
    const cachedData = await apiCacheManager.get<T>(cacheKey)
    if (cachedData !== null) {
      return cachedData
    }
  }

  // 实际请求
  const requestFn = async (): Promise<T> => {
    return optimizedApiClient.request<T>(config)
  }

  const response = useRetry ? await withRetry(requestFn) : await requestFn()
  
  // 缓存GET请求响应
  if (useCache && method === 'get') {
    const cacheKey = generateCacheKey(config)
    await apiCacheManager.set(cacheKey, response, { maxAge: 5 * 60 * 1000 })
  }
  
  return response
}

/**
 * 导出的API方法
 */
export const optimizedApi = {
  get: <T = any>(url: string, params?: any, options?: any) =>
    optimizedRequest<T>({ method: 'get', url, params }, options),
  
  post: <T = any>(url: string, data?: any, options?: any) =>
    optimizedRequest<T>({ method: 'post', url, data }, 
      { useCache: false, ...options }),
  
  put: <T = any>(url: string, data?: any, options?: any) =>
    optimizedRequest<T>({ method: 'put', url, data }, 
      { useCache: false, ...options }),
  
  delete: <T = any>(url: string, options?: any) =>
    optimizedRequest<T>({ method: 'delete', url }, 
      { useCache: false, ...options }),
  
  request: optimizedApiClient.request.bind(optimizedApiClient)
}

export default optimizedApi
