import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  credits: number
  subscriptionTier: 'free' | 'plus' | 'pro'
  subscriptionExpiresAt?: Date
  createdAt: Date
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const loading = ref(false)
  const redirectPath = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isPremium = computed(() => user.value?.subscriptionTier !== 'free')
  const username = computed(() => user.value?.username || 'Guest')
  const avatar = computed(() => user.value?.avatar || '/default-avatar.png')

  // 方法
  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true
    try {
      const response = await authService.login(credentials)
      
      // 保存令牌
      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      
      // 保存用户信息
      user.value = response.user
      
      console.log('登录成功')
      return true
    } catch (error: any) {
      console.error('登录失败:', error.message || error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const register = async (data: {
    username: string
    email: string
    password: string
  }) => {
    loading.value = true
    try {
      const response = await authService.register(data)
      
      // 自动登录
      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      
      user.value = response.user
      
      console.log('注册成功')
      return true
    } catch (error: any) {
      console.error('注册失败:', error.message || error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // 清除本地数据
      user.value = null
      token.value = null
      refreshToken.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      
      console.log('已退出登录')
    }
  }

  const restoreSession = async () => {
    if (!token.value) return false
    
    try {
      const response = await authService.getProfile()
      user.value = response.user
      return true
    } catch (error) {
      // Token 可能已过期
      if (refreshToken.value) {
        try {
          const response = await authService.refreshToken(refreshToken.value)
          token.value = response.accessToken
          refreshToken.value = response.refreshToken
          localStorage.setItem('token', response.accessToken)
          localStorage.setItem('refreshToken', response.refreshToken)
          
          // 重新获取用户信息
          const profileResponse = await authService.getProfile()
          user.value = profileResponse.user
          return true
        } catch (error) {
          // 刷新失败，清除会话
          await logout()
          return false
        }
      }
      
      await logout()
      return false
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    loading.value = true
    try {
      const response = await authService.updateProfile(data)
      user.value = response.user
      ElMessage.success('个人资料已更新')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '更新失败')
      return false
    } finally {
      loading.value = false
    }
  }

  const updateAvatar = async (file: File) => {
    loading.value = true
    try {
      const response = await authService.uploadAvatar(file)
      if (user.value) {
        user.value.avatar = response.avatarUrl
      }
      ElMessage.success('头像已更新')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '上传失败')
      return false
    } finally {
      loading.value = false
    }
  }

  const setRedirectPath = (path: string | null) => {
    redirectPath.value = path
  }

  const clearRedirectPath = () => {
    redirectPath.value = null
  }

  return {
    // 状态
    user,
    token,
    loading,
    redirectPath,
    
    // 计算属性
    isAuthenticated,
    isPremium,
    username,
    avatar,
    
    // 方法
    login,
    register,
    logout,
    restoreSession,
    updateProfile,
    updateAvatar,
    setRedirectPath,
    clearRedirectPath
  }
})