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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081'

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
        throw new Error(data.message || data.error || '请求失败')
      }

      // 如果后端返回的是原始数据（不是ApiResponse格式），包装成标准格式
      if (data && typeof data === 'object' && !('success' in data)) {
        return {
          success: true,
          data: data
        }
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

    const response = await this.request<{ posts: any[], pagination: any }>(`/api/community/posts?${params.toString()}`)

    if (response.success && response.data) {
      // 转换后端数据格式到前端期望的格式
      const transformedPosts = response.data.posts.map((post: any) => ({
        ...post,
        user: post.author, // 将 author 字段映射为 user
        userId: post.authorId,
        // 确保统计数据的格式
        likeCount: post._count?.likes || 0,
        commentCount: post._count?.comments || 0,
        shareCount: post._count?.shares || 0
      }))

      return {
        success: true,
        data: {
          data: transformedPosts,
          hasMore: response.data.pagination.page < response.data.pagination.totalPages,
          total: response.data.pagination.total
        }
      }
    }

    return response as ApiResponse<PaginatedResponse<Post>>
  }

  // 获取单个动态详情
  async getPost(id: string): Promise<ApiResponse<Post>> {
    const response = await this.request<any>(`/api/community/posts/${id}`)

    if (response.success && response.data) {
      // 转换后端数据格式到前端期望的格式
      const transformedPost = {
        ...response.data,
        user: response.data.author, // 将 author 字段映射为 user
        userId: response.data.authorId,
        // 确保统计数据的格式
        likeCount: response.data._count?.likes || 0,
        commentCount: response.data._count?.comments || 0,
        shareCount: response.data._count?.shares || 0
      }

      return {
        success: true,
        data: transformedPost
      }
    }

    return response as ApiResponse<Post>
  }

  // 创建动态
  async createPost(data: PostCreateData): Promise<ApiResponse<Post>> {
    const response = await this.request<any>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.success && response.data) {
      // 转换后端数据格式到前端期望的格式
      const transformedPost = {
        ...response.data,
        user: response.data.author, // 将 author 字段映射为 user
        userId: response.data.authorId,
        // 确保统计数据的格式
        likeCount: response.data._count?.likes || 0,
        commentCount: response.data._count?.comments || 0,
        shareCount: response.data._count?.shares || 0
      }

      return {
        success: true,
        data: transformedPost
      }
    }

    return response as ApiResponse<Post>
  }

  // 更新动态
  async updatePost(id: string, data: Partial<PostCreateData>): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/api/community/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除动态
  async deletePost(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/community/posts/${id}`, {
      method: 'DELETE',
    })
  }

  // 点赞/取消点赞动态
  async toggleLikePost(id: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request<{ isLiked: boolean; likeCount: number }>(`/api/community/posts/${id}/like`, {
      method: 'POST',
    })
  }

  // 收藏/取消收藏动态
  async toggleBookmarkPost(id: string): Promise<ApiResponse<{ isBookmarked: boolean }>> {
    return this.request<{ isBookmarked: boolean }>(`/api/community/posts/${id}/bookmark`, {
      method: 'POST',
    })
  }

  // 分享动态
  async sharePost(id: string): Promise<ApiResponse<Post>> {
    return this.request<Post>(`/api/community/posts/${id}/share`, {
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
    return this.request<PaginatedResponse<Comment>>(`/api/community/posts/${postId}/comments?${params.toString()}`)
  }

  // 创建评论
  async createComment(data: CommentCreateData): Promise<ApiResponse<Comment>> {
    return this.request<Comment>('/api/community/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新评论
  async updateComment(id: string, content: string): Promise<ApiResponse<Comment>> {
    return this.request<Comment>(`/api/community/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  }

  // 删除评论
  async deleteComment(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/community/comments/${id}`, {
      method: 'DELETE',
    })
  }

  // 点赞/取消点赞评论
  async toggleLikeComment(id: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    return this.request<{ isLiked: boolean; likeCount: number }>(`/api/community/comments/${id}/like`, {
      method: 'POST',
    })
  }

  // ========== 用户相关 API ==========

  // 获取用户资料
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>(`/api/community/users/${userId}/profile`)
  }

  // 更新用户资料
  async updateUserProfile(data: UserUpdateData): Promise<ApiResponse<User>> {
    return this.request<User>('/api/community/users/profile', {
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
    return this.request<PaginatedResponse<Follow>>(`/api/community/users/${userId}/following?${params.toString()}`)
  }

  // 获取用户粉丝列表
  async getUserFollowers(userId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Follow>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    return this.request<PaginatedResponse<Follow>>(`/api/community/users/${userId}/followers?${params.toString()}`)
  }

  // 关注/取消关注用户
  async toggleFollowUser(userId: string): Promise<ApiResponse<{ isFollowing: boolean; followerCount: number }>> {
    return this.request<{ isFollowing: boolean; followerCount: number }>(`/api/community/users/${userId}/follow`, {
      method: 'POST',
    })
  }

  // 拉黑/取消拉黑用户
  async toggleBlockUser(userId: string): Promise<ApiResponse<{ isBlocked: boolean }>> {
    return this.request<{ isBlocked: boolean }>(`/api/community/users/${userId}/block`, {
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

    return this.request<PaginatedResponse<Notification>>(`/api/community/notifications?${params.toString()}`)
  }

  // 标记通知为已读
  async markNotificationRead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/community/notifications/${id}/read`, {
      method: 'POST',
    })
  }

  // 标记所有通知为已读
  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/community/notifications/read-all', {
      method: 'POST',
    })
  }

  // 获取未读通知数量
  async getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<{ count: number }>('/api/community/notifications/unread-count')
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

    return this.request<SearchResult>(`/api/community/search?${params.toString()}`)
  }

  // 获取推荐用户
  async getRecommendedUsers(limit: number = 10): Promise<ApiResponse<User[]>> {
    return this.request<User[]>(`/api/community/users/recommended?limit=${limit}`)
  }

  // 获取热门标签
  async getTrendingTags(limit: number = 20): Promise<ApiResponse<Array<{ tag: string; count: number }>>> {
    return this.request<Array<{ tag: string; count: number }>>(`/api/community/tags/trending?limit=${limit}`)
  }

  // ========== 统计相关 API ==========

  // 获取社区统计数据
  async getCommunityStats(): Promise<ApiResponse<CommunityStats>> {
    return this.request<CommunityStats>('/api/community/stats')
  }

  // ========== 文件上传 API ==========

  // 上传图片
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('image', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/community/upload/image`, {
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
