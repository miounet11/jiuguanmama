import api from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
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
}

export interface ProfileResponse {
  user: {
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
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export const authService = {
  // 登录
  async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post('/api/auth/login', data)
  },

  // 注册
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return api.post('/api/auth/register', data)
  },

  // 退出登录
  async logout(): Promise<void> {
    return api.post('/api/auth/logout')
  },

  // 获取用户信息
  async getProfile(): Promise<ProfileResponse> {
    return api.get('/api/auth/profile')
  },

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return api.post('/api/auth/refresh', { refreshToken })
  },

  // 更新用户信息
  async updateProfile(data: {
    username?: string
    bio?: string
  }): Promise<ProfileResponse> {
    return api.patch('/api/auth/profile', data)
  },

  // 上传头像
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.upload('/api/auth/avatar', formData)
  },

  // 修改密码
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    return api.post('/api/auth/change-password', data)
  },

  // 发送验证邮件
  async sendVerificationEmail(): Promise<void> {
    return api.post('/api/auth/send-verification')
  },

  // 验证邮箱
  async verifyEmail(token: string): Promise<void> {
    return api.post('/api/auth/verify-email', { token })
  },

  // 忘记密码
  async forgotPassword(email: string): Promise<void> {
    return api.post('/api/auth/forgot-password', { email })
  },

  // 重置密码
  async resetPassword(data: {
    token: string
    password: string
  }): Promise<void> {
    return api.post('/api/auth/reset-password', data)
  },

  // OAuth 登录
  async oauthLogin(provider: 'google' | 'discord', code: string): Promise<AuthResponse> {
    return api.post(`/api/auth/oauth/${provider}`, { code })
  }
}
