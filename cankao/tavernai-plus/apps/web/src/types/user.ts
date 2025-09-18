export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  displayName?: string
  bio?: string
  isVerified?: boolean
  isPremium?: boolean
  role: 'user' | 'admin' | 'moderator'
  createdAt: string
  updatedAt: string
  lastActiveAt?: string
  preferences?: UserPreferences
  stats?: UserStats
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: {
    email: boolean
    push: boolean
    chat: boolean
    system: boolean
  }
  privacy: {
    showEmail: boolean
    showLastActive: boolean
    allowMessages: boolean
  }
}

export interface UserStats {
  charactersCreated: number
  chatsStarted: number
  messagesExchanged: number
  favoriteCharacters: number
  reviewsWritten: number
}

export interface UserProfile extends User {
  followersCount: number
  followingCount: number
  charactersCount: number
  isFollowing?: boolean
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  displayName?: string
}

export interface UpdateUserRequest {
  username?: string
  displayName?: string
  bio?: string
  avatar?: string
  preferences?: Partial<UserPreferences>
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}
