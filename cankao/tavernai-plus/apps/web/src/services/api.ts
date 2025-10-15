import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import router from '@/router'

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009'
const TIMEOUT = 30000

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证令牌
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳（防止缓存）
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 标记是否正在刷新token，避免多个请求同时刷新
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 处理成功响应
    return response.data
  },
  async (error) => {
    const { response, config } = error

    if (!response) {
      // 网络错误
      console.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    const { status, data } = response

    // 处理不同的错误状态码
    switch (status) {
      case 401:
        // 如果是refresh请求失败，直接跳转登录
        if (config.url === '/api/auth/refresh') {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          router.push('/login')
          console.error('登录已过期，请重新登录')
          return Promise.reject(error)
        }

        // 未授权，尝试刷新令牌
        if (!config._retry) {
          config._retry = true

          // 如果已经在刷新，将请求加入队列
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            }).then(token => {
              config.headers.Authorization = `Bearer ${token}`
              return apiClient.request(config)
            }).catch(err => {
              return Promise.reject(err)
            })
          }

          isRefreshing = true

          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            try {
              const refreshResponse = await apiClient.post('/api/auth/refresh', {
                refreshToken
              })

              const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data
              localStorage.setItem('token', accessToken)
              localStorage.setItem('refreshToken', newRefreshToken)

              // 处理队列中的请求
              processQueue(null, accessToken)
              isRefreshing = false

              // 重试原始请求
              config.headers.Authorization = `Bearer ${accessToken}`
              return apiClient.request(config)
            } catch (refreshError) {
              // 刷新失败，清理并跳转到登录
              processQueue(refreshError, null)
              isRefreshing = false
              localStorage.removeItem('token')
              localStorage.removeItem('refreshToken')
              router.push('/login')
              console.error('登录已过期，请重新登录')
              return Promise.reject(refreshError)
            }
          } else {
            // 没有刷新令牌，直接跳转登录
            isRefreshing = false
            router.push('/login')
            console.error('请先登录')
            return Promise.reject(error)
          }
        }
        break

      case 403:
        console.error('没有权限访问')
        break

      case 404:
        console.error('请求的资源不存在')
        break

      case 422:
        // 验证错误
        const errorMessage = data.errors
          ? Object.values(data.errors).flat().join('，')
          : data.message || '请求参数错误'
        console.error('422验证错误:', errorMessage)
        break

      case 429:
        console.error('请求过于频繁，请稍后再试')
        break

      case 500:
      case 502:
      case 503:
        console.error('服务器错误，请稍后再试')
        break

      default:
        console.error(data.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

// API 请求方法封装
export const api = {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.get(url, { params, ...config })
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put(url, data, config)
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.patch(url, data, config)
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete(url, config)
  },

  upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// 工作流API
export const workflowApi = {
  // 获取工作流列表
  getWorkflows: (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    public?: boolean
  }): Promise<any> => {
    return api.get('/workflows', params)
  },

  // 获取工作流详情
  getWorkflow: (id: string): Promise<any> => {
    return api.get(`/workflows/${id}`)
  },

  // 创建工作流
  createWorkflow: (data: {
    name: string
    description?: string
    definition: any
    variables?: Record<string, any>
    schedule?: string
    isPublic?: boolean
  }): Promise<any> => {
    return api.post('/workflows', data)
  },

  // 更新工作流
  updateWorkflow: (id: string, data: {
    name?: string
    description?: string
    definition?: any
    variables?: Record<string, any>
    schedule?: string
    isPublic?: boolean
  }): Promise<any> => {
    return api.put(`/workflows/${id}`, data)
  },

  // 删除工作流
  deleteWorkflow: (id: string): Promise<any> => {
    return api.delete(`/workflows/${id}`)
  },

  // 执行工作流
  executeWorkflow: (id: string, input?: any): Promise<any> => {
    return api.post(`/workflows/${id}/execute`, { input })
  },

  // 获取工作流执行实例
  getWorkflowInstances: (id: string, params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<any> => {
    return api.get(`/workflows/${id}/instances`, params)
  },

  // 获取工作流调度状态
  getWorkflowSchedule: (id: string): Promise<any> => {
    return api.get(`/workflows/${id}/schedule`)
  },

  // 手动触发定时任务
  triggerWorkflow: (id: string): Promise<any> => {
    return api.post(`/workflows/${id}/trigger`)
  },

  // 获取工作流模板
  getWorkflowTemplates: (): Promise<any> => {
    return api.get('/workflows/templates/list')
  },

  // 取消工作流实例
  cancelWorkflowInstance: (instanceId: string): Promise<any> => {
    return api.post(`/workflow-instances/${instanceId}/cancel`)
  },

  // 获取工作流实例状态
  getWorkflowInstanceStatus: (instanceId: string): Promise<any> => {
    return api.get(`/workflow-instances/${instanceId}/status`)
  }
}

export default api
