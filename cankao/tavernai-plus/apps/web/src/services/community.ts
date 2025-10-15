import {
  Post,
  PostCreateData,
  PostFilter,
  Comment,
  CommentCreateData,
  User,
  UserProfile,
  UserUpdateData,
  Follow,
  Notification,
  CommunityStats,
  PaginatedResponse,
  ApiResponse,
  SearchFilters,
  SearchResult
} from '@/types/community'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009'

class CommunityApi {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '请求失败')
      }

      return data
    } catch (error) {
      console.error('API请求错误:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // ========== 动态相关 API ==========

  // 获取动态列表
  async getPosts(filter: PostFilter & { page?: number; pageSize?: number } = {}): Promise<ApiResponse<PaginatedResponse<Post>>> {
    const params = new URLSearchParams()

    if (filter.type && filter.type !== 'all') params.append('type', filter.type)
    if (filter.visibility) params.append('visibility', filter.visibility)
    if (filter.userId) params.append('userId', filter.userId)
    if (filter.following) params.append('following', 'true')
    if (filter.featured) params.append('featured', 'true')
    if (filter.tags?.length) params.append('tags', filter.tags.join(','))
    if (filter.page) params.append('page', filter.page.toString())
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString())

    return this.request<PaginatedResponse<Post>>(`/api/posts?${params.toString()}`)
  }

  // 获取单个动态详情
  async getPost(id: string): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/api/posts/${id}`)
  }

  // 创建动态
  async createPost(data: PostCreateData): Promise<ApiResponse<Post>> {
    return this.request<Post>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新动态
  async updatePost(id: string, data: Partial<PostCreateData>): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除动态
  async deletePost(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/posts/${id}`, {
      method: 'DELETE',
    })
  }

  // 点赞/取消点赞动态
  async toggleLikePost(id: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request<{ isLiked: boolean; likeCount: number }>(`/api/posts/${id}/like`, {
      method: 'POST',
    })
  }

  // 收藏/取消收藏动态
  async toggleBookmarkPost(id: string): Promise<ApiResponse<{ isBookmarked: boolean }>> {
    return this.request<{ isBookmarked: boolean }>(`/api/posts/${id}/bookmark`, {
      method: 'POST',
    })
  }

  // 分享动态
  async sharePost(id: string): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/api/posts/${id}/share`, {
      method: 'POST',
    })
  }

  // ========== 评论相关 API ==========

  // 获取动态的评论列表
  async getComments(postId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Comment>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    return this.request<PaginatedResponse<Comment>>(`/api/posts/${postId}/comments?${params.toString()}`)
  }

  // 创建评论
  async createComment(data: CommentCreateData): Promise<ApiResponse<Comment>> {
    return this.request<Comment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新评论
  async updateComment(id: string, content: string): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/api/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  }

  // 删除评论
  async deleteComment(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/comments/${id}`, {
      method: 'DELETE',
    })
  }

  // 点赞/取消点赞评论
  async toggleLikeComment(id: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request<{ isLiked: boolean; likeCount: number }>(`/api/comments/${id}/like`, {
      method: 'POST',
    })
  }

  // ========== 用户相关 API ==========

  // 获取用户资料
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>(`/api/users/${userId}/profile`)
  }

  // 更新用户资料
  async updateUserProfile(data: UserUpdateData): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 获取用户关注列表
  async getUserFollowing(userId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Follow>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    return this.request<PaginatedResponse<Follow>>(`/api/users/${userId}/following?${params.toString()}`)
  }

  // 获取用户粉丝列表
  async getUserFollowers(userId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Follow>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    return this.request<PaginatedResponse<Follow>>(`/api/users/${userId}/followers?${params.toString()}`)
  }

  // 关注/取消关注用户
  async toggleFollowUser(userId: string): Promise<ApiResponse<{ isFollowing: boolean; followerCount: number }>> {
    return this.request<{ isFollowing: boolean; followerCount: number }>(`/api/users/${userId}/follow`, {
      method: 'POST',
    })
  }

  // 拉黑/取消拉黑用户
  async toggleBlockUser(userId: string): Promise<ApiResponse<{ isBlocked: boolean }>> {
    return this.request<{ isBlocked: boolean }>(`/api/users/${userId}/block`, {
      method: 'POST',
    })
  }

  // ========== 通知相关 API ==========

  // 获取通知列表
  async getNotifications(page: number = 1, pageSize: number = 20, unreadOnly: boolean = false): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    if (unreadOnly) params.append('unreadOnly', 'true')

    return this.request<PaginatedResponse<Notification>>(`/api/notifications?${params.toString()}`)
  }

  // 标记通知为已读
  async markNotificationRead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/notifications/${id}/read`, {
      method: 'POST',
    })
  }

  // 标记所有通知为已读
  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/notifications/read-all', {
      method: 'POST',
    })
  }

  // 获取未读通知数量
  async getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<{ count: number }>('/api/notifications/unread-count')
  }

  // ========== 搜索相关 API ==========

  // 搜索
  async search(filters: SearchFilters, page: number = 1, pageSize: number = 20): Promise<ApiResponse<SearchResult>> {
    const params = new URLSearchParams({
      query: filters.query,
      type: filters.type,
      page: page.toString(),
      pageSize: pageSize.toString()
    })

    if (filters.dateRange) params.append('dateRange', filters.dateRange)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)

    return this.request<SearchResult>(`/api/search?${params.toString()}`)
  }

  // 获取推荐用户
  async getRecommendedUsers(limit: number = 10): Promise<ApiResponse<User[]>> {
    return this.request<User[]>(`/api/users/recommended?limit=${limit}`)
  }

  // 获取热门标签
  async getTrendingTags(limit: number = 20): Promise<ApiResponse<Array<{ tag: string; count: number }>>> {
    return this.request<Array<{ tag: string; count: number }>>(`/api/tags/trending?limit=${limit}`)
  }

  // ========== 统计相关 API ==========

  // 获取社区统计数据
  async getCommunityStats(): Promise<ApiResponse<CommunityStats>> {
    return this.request<CommunityStats>('/api/stats/community')
  }

  // ========== 文件上传 API ==========

  // 上传图片
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('image', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '上传失败')
      }

      return data
    } catch (error) {
      console.error('图片上传错误:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      }
    }
  }
}

// 创建单例实例
export const communityApi = new CommunityApi()
export default communityApi
