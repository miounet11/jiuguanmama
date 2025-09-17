import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import { errorLogger } from './errorLogger'

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3007') + '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  (config: AxiosRequestConfig | any) => {
    const userStore = useUserStore()

    // 如果有 token，添加到请求头
    if (userStore.token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }

    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回 data 部分
    return response.data
  },
  async (error: AxiosError) => {
    const { response, config } = error

    // 记录 API 错误
    if (response) {
      errorLogger.apiError(
        config?.url || 'unknown',
        config?.method?.toUpperCase() || 'GET',
        response.status,
        (response.data as any)?.message || 'Request failed'
      )
    }

    if (response) {
      switch (response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          const userStore = useUserStore()
          userStore.logout()

          // 保存当前路由，登录后跳转回来
          const currentPath = router.currentRoute.value.fullPath
          if (currentPath !== '/login') {
            router.push({
              path: '/login',
              query: { redirect: currentPath }
            })
          }

          ElMessage.error('登录已过期，请重新登录')
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
          ElMessage.error('服务器错误，请稍后再试')
          break

        default:
          ElMessage.error(response.data?.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else if (error.message === 'Network Error') {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求失败，请稍后再试')
    }

    return Promise.reject(error)
  }
)

// 封装常用请求方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.get(url, config)
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.post(url, data, config)
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.put(url, data, config)
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.patch(url, data, config)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.delete(url, config)
  },

  // 上传文件
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    return instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    })
  }
}

// 导出默认实例
export default instance
