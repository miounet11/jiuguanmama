import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import communityApi from '@/services/community'
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

export const useCommunityStore = defineStore('community', () => {
  // ========== 状态 ==========

  // 动态相关
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const postsCache = ref<Map<string, Post>>(new Map())

  // 评论相关
  const comments = ref<Comment[]>([])
  const commentsCache = ref<Map<string, Comment[]>>(new Map())

  // 用户相关
  const users = ref<User[]>([])
  const currentUserProfile = ref<UserProfile | null>(null)
  const usersCache = ref<Map<string, UserProfile>>(new Map())

  // 关注相关
  const following = ref<User[]>([])
  const followers = ref<User[]>([])

  // 通知相关
  const notifications = ref<Notification[]>([])
  const unreadNotificationCount = ref(0)

  // 统计数据
  const stats = ref<CommunityStats | null>(null)

  // 推荐数据
  const recommendedUsers = ref<User[]>([])
  const trendingTags = ref<Array<{ tag: string; count: number }>>([])

  // 加载状态
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========== Getters ==========

  const getPostById = computed(() => {
    return (id: string) => {
      return posts.value.find(post => post.id === id) || postsCache.value.get(id)
    }
  })

  const getUserById = computed(() => {
    return (id: string) => {
      return users.value.find(user => user.id === id) || usersCache.value.get(id)
    }
  })

  const getCommentsByPostId = computed(() => {
    return (postId: string) => {
      return commentsCache.value.get(postId) || []
    }
  })

  // ========== Actions ==========

  // 动态相关操作
  const getPosts = async (filter: PostFilter & { page?: number; pageSize?: number } = {}): Promise<ApiResponse<PaginatedResponse<Post>>> => {
    try {
      loading.value = true
      error.value = null

      const response = await communityApi.getPosts(filter)

      if (response.success && response.data) {
        // 更新缓存
        response.data.data.forEach(post => {
          postsCache.value.set(post.id, post)
        })

        // 如果是第一页，替换posts数组
        if (!filter.page || filter.page === 1) {
          posts.value = response.data.data
        }
      }

      return response
    } catch (error) {
      console.error('获取动态失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取动态失败'
      }
    } finally {
      loading.value = false
    }
  }

  const getPost = async (id: string): Promise<ApiResponse<Post>> => {
    try {
      // 先从缓存中查找
      const cachedPost = postsCache.value.get(id)
      if (cachedPost) {
        currentPost.value = cachedPost
        return { success: true, data: cachedPost }
      }

      loading.value = true
      error.value = null

      const response = await communityApi.getPost(id)

      if (response.success && response.data) {
        currentPost.value = response.data
        postsCache.value.set(id, response.data)
      }

      return response
    } catch (error) {
      console.error('获取动态详情失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取动态详情失败'
      }
    } finally {
      loading.value = false
    }
  }

  const createPost = async (data: PostCreateData): Promise<ApiResponse<Post>> => {
    try {
      loading.value = true
      error.value = null

      const response = await communityApi.createPost(data)

      if (response.success && response.data) {
        // 添加到动态列表顶部
        posts.value.unshift(response.data)
        postsCache.value.set(response.data.id, response.data)
      }

      return response
    } catch (error) {
      console.error('创建动态失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建动态失败'
      }
    } finally {
      loading.value = false
    }
  }

  const updatePost = async (id: string, data: Partial<PostCreateData>): Promise<ApiResponse<Post>> => {
    try {
      loading.value = true
      error.value = null

      const response = await communityApi.updatePost(id, data)

      if (response.success && response.data) {
        // 更新本地状态
        const index = posts.value.findIndex(post => post.id === id)
        if (index > -1) {
          posts.value[index] = response.data
        }
        postsCache.value.set(id, response.data)

        if (currentPost.value?.id === id) {
          currentPost.value = response.data
        }
      }

      return response
    } catch (error) {
      console.error('更新动态失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新动态失败'
      }
    } finally {
      loading.value = false
    }
  }

  const deletePost = async (id: string): Promise<ApiResponse<void>> => {
    try {
      loading.value = true
      error.value = null

      const response = await communityApi.deletePost(id)

      if (response.success) {
        // 从本地状态中移除
        posts.value = posts.value.filter(post => post.id !== id)
        postsCache.value.delete(id)

        if (currentPost.value?.id === id) {
          currentPost.value = null
        }
      }

      return response
    } catch (error) {
      console.error('删除动态失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除动态失败'
      }
    } finally {
      loading.value = false
    }
  }

  const toggleLikePost = async (id: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> => {
    try {
      const response = await communityApi.toggleLikePost(id)

      if (response.success && response.data) {
        // 更新本地状态
        const post = posts.value.find(p => p.id === id) || postsCache.value.get(id)
        if (post) {
          post.isLiked = response.data.isLiked
          post.likeCount = response.data.likeCount
        }

        if (currentPost.value?.id === id) {
          currentPost.value.isLiked = response.data.isLiked
          currentPost.value.likeCount = response.data.likeCount
        }
      }

      return response
    } catch (error) {
      console.error('点赞动态失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '点赞动态失败'
      }
    }
  }

  const sharePost = async (id: string): Promise<ApiResponse<Post>> => {
    try {
      const response = await communityApi.sharePost(id)

      if (response.success && response.data) {
        // 更新分享数量
        const post = posts.value.find(p => p.id === id) || postsCache.value.get(id)
        if (post) {
          post.shareCount++
        }

        if (currentPost.value?.id === id) {
          currentPost.value.shareCount++
        }
      }

      return response
    } catch (error) {
      console.error('分享动态失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '分享动态失败'
      }
    }
  }

  // 评论相关操作
  const getComments = async (postId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
    try {
      loading.value = true
      error.value = null

      const response = await communityApi.getComments(postId, page, pageSize)

      if (response.success && response.data) {
        // 更新缓存
        if (page === 1) {
          commentsCache.value.set(postId, response.data.data)
        } else {
          const existingComments = commentsCache.value.get(postId) || []
          commentsCache.value.set(postId, [...existingComments, ...response.data.data])
        }
      }

      return response
    } catch (error) {
      console.error('获取评论失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取评论失败'
      }
    } finally {
      loading.value = false
    }
  }

  const createComment = async (data: CommentCreateData): Promise<ApiResponse<Comment>> => {
    try {
      const response = await communityApi.createComment(data)

      if (response.success && response.data) {
        // 更新评论缓存
        const existingComments = commentsCache.value.get(data.postId) || []
        commentsCache.value.set(data.postId, [response.data, ...existingComments])

        // 更新动态的评论数量
        const post = posts.value.find(p => p.id === data.postId) || postsCache.value.get(data.postId)
        if (post) {
          post.commentCount++
        }

        if (currentPost.value?.id === data.postId) {
          currentPost.value.commentCount++
        }
      }

      return response
    } catch (error) {
      console.error('创建评论失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建评论失败'
      }
    }
  }

  const updateComment = async (id: string, content: string): Promise<ApiResponse<Comment>> => {
    try {
      const response = await communityApi.updateComment(id, content)

      if (response.success && response.data) {
        // 更新评论缓存中的评论内容
        for (const [postId, commentList] of commentsCache.value.entries()) {
          const commentIndex = commentList.findIndex(c => c.id === id)
          if (commentIndex > -1) {
            commentList[commentIndex] = response.data
            break
          }
        }
      }

      return response
    } catch (error) {
      console.error('更新评论失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新评论失败'
      }
    }
  }

  const deleteComment = async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await communityApi.deleteComment(id)

      if (response.success) {
        // 从评论缓存中移除
        for (const [postId, commentList] of commentsCache.value.entries()) {
          const commentIndex = commentList.findIndex(c => c.id === id)
          if (commentIndex > -1) {
            commentList.splice(commentIndex, 1)

            // 更新动态的评论数量
            const post = posts.value.find(p => p.id === postId) || postsCache.value.get(postId)
            if (post) {
              post.commentCount--
            }

            if (currentPost.value?.id === postId) {
              currentPost.value.commentCount--
            }
            break
          }
        }
      }

      return response
    } catch (error) {
      console.error('删除评论失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除评论失败'
      }
    }
  }

  const toggleLikeComment = async (id: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> => {
    try {
      const response = await communityApi.toggleLikeComment(id)

      if (response.success && response.data) {
        // 更新评论的点赞状态
        for (const commentList of commentsCache.value.values()) {
          const comment = commentList.find(c => c.id === id)
          if (comment) {
            comment.isLiked = response.data.isLiked
            comment.likeCount = response.data.likeCount
            break
          }
        }
      }

      return response
    } catch (error) {
      console.error('点赞评论失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '点赞评论失败'
      }
    }
  }

  // 用户相关操作
  const getUserProfile = async (userId: string): Promise<ApiResponse<UserProfile>> => {
    try {
      // 先从缓存中查找
      const cachedUser = usersCache.value.get(userId)
      if (cachedUser) {
        currentUserProfile.value = cachedUser
        return { success: true, data: cachedUser }
      }

      loading.value = true
      error.value = null

      const response = await communityApi.getUserProfile(userId)

      if (response.success && response.data) {
        currentUserProfile.value = response.data
        usersCache.value.set(userId, response.data)
      }

      return response
    } catch (error) {
      console.error('获取用户资料失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户资料失败'
      }
    } finally {
      loading.value = false
    }
  }

  const updateUserProfile = async (data: UserUpdateData): Promise<ApiResponse<User>> => {
    try {
      loading.value = true
      error.value = null

      const response = await communityApi.updateUserProfile(data)

      if (response.success && response.data) {
        // 更新缓存中的用户信息
        for (const userProfile of usersCache.value.values()) {
          if (userProfile.id === response.data.id) {
            Object.assign(userProfile, response.data)
            break
          }
        }

        if (currentUserProfile.value?.id === response.data.id) {
          Object.assign(currentUserProfile.value, response.data)
        }
      }

      return response
    } catch (error) {
      console.error('更新用户资料失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新用户资料失败'
      }
    } finally {
      loading.value = false
    }
  }

  const getUserFollowing = async (userId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Follow>>> => {
    try {
      const response = await communityApi.getUserFollowing(userId, page, pageSize)

      if (response.success && response.data && page === 1) {
        following.value = response.data.data.map(follow => follow.following)
      }

      return response
    } catch (error) {
      console.error('获取关注列表失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取关注列表失败'
      }
    }
  }

  const getUserFollowers = async (userId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedResponse<Follow>>> => {
    try {
      const response = await communityApi.getUserFollowers(userId, page, pageSize)

      if (response.success && response.data && page === 1) {
        followers.value = response.data.data.map(follow => follow.follower)
      }

      return response
    } catch (error) {
      console.error('获取粉丝列表失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取粉丝列表失败'
      }
    }
  }

  const toggleFollowUser = async (userId: string): Promise<ApiResponse<{ isFollowing: boolean; followerCount: number }>> => {
    try {
      const response = await communityApi.toggleFollowUser(userId)

      if (response.success && response.data) {
        // 更新用户的关注状态
        const user = users.value.find(u => u.id === userId)
        if (user) {
          user.isFollowing = response.data.isFollowing
          user.followerCount = response.data.followerCount
        }

        // 更新用户资料中的关注状态
        const userProfile = usersCache.value.get(userId)
        if (userProfile) {
          userProfile.isFollowing = response.data.isFollowing
          userProfile.followerCount = response.data.followerCount
        }

        if (currentUserProfile.value?.id === userId) {
          currentUserProfile.value.isFollowing = response.data.isFollowing
          currentUserProfile.value.followerCount = response.data.followerCount
        }
      }

      return response
    } catch (error) {
      console.error('关注操作失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '关注操作失败'
      }
    }
  }

  // 通知相关操作
  const getNotifications = async (page: number = 1, pageSize: number = 20, unreadOnly: boolean = false): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
    try {
      const response = await communityApi.getNotifications(page, pageSize, unreadOnly)

      if (response.success && response.data) {
        if (page === 1) {
          notifications.value = response.data.data
        }
      }

      return response
    } catch (error) {
      console.error('获取通知失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取通知失败'
      }
    }
  }

  const markNotificationRead = async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await communityApi.markNotificationRead(id)

      if (response.success) {
        const notification = notifications.value.find(n => n.id === id)
        if (notification && !notification.isRead) {
          notification.isRead = true
          unreadNotificationCount.value = Math.max(0, unreadNotificationCount.value - 1)
        }
      }

      return response
    } catch (error) {
      console.error('标记通知已读失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '标记通知已读失败'
      }
    }
  }

  const markAllNotificationsRead = async (): Promise<ApiResponse<void>> => {
    try {
      const response = await communityApi.markAllNotificationsRead()

      if (response.success) {
        notifications.value.forEach(n => {
          n.isRead = true
        })
        unreadNotificationCount.value = 0
      }

      return response
    } catch (error) {
      console.error('标记所有通知已读失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '标记所有通知已读失败'
      }
    }
  }

  const getUnreadNotificationCount = async (): Promise<ApiResponse<{ count: number }>> => {
    try {
      const response = await communityApi.getUnreadNotificationCount()

      if (response.success && response.data) {
        unreadNotificationCount.value = response.data.count
      }

      return response
    } catch (error) {
      console.error('获取未读通知数量失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取未读通知数量失败'
      }
    }
  }

  // 搜索和推荐
  const search = async (filters: SearchFilters, page: number = 1, pageSize: number = 20): Promise<ApiResponse<SearchResult>> => {
    try {
      loading.value = true
      error.value = null

      const response = await communityApi.search(filters, page, pageSize)

      return response
    } catch (error) {
      console.error('搜索失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '搜索失败'
      }
    } finally {
      loading.value = false
    }
  }

  const getRecommendedUsers = async (limit: number = 10): Promise<ApiResponse<User[]>> => {
    try {
      const response = await communityApi.getRecommendedUsers(limit)

      if (response.success && response.data) {
        recommendedUsers.value = response.data
      }

      return response
    } catch (error) {
      console.error('获取推荐用户失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取推荐用户失败'
      }
    }
  }

  const getTrendingTags = async (limit: number = 20): Promise<ApiResponse<Array<{ tag: string; count: number }>>> => {
    try {
      const response = await communityApi.getTrendingTags(limit)

      if (response.success && response.data) {
        trendingTags.value = response.data
      }

      return response
    } catch (error) {
      console.error('获取热门标签失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取热门标签失败'
      }
    }
  }

  const getCommunityStats = async (): Promise<ApiResponse<CommunityStats>> => {
    try {
      const response = await communityApi.getCommunityStats()

      if (response.success && response.data) {
        stats.value = response.data
      }

      return response
    } catch (error) {
      console.error('获取社区统计失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取社区统计失败'
      }
    }
  }

  // 清理操作
  const clearCache = () => {
    postsCache.value.clear()
    commentsCache.value.clear()
    usersCache.value.clear()
  }

  const reset = () => {
    posts.value = []
    currentPost.value = null
    comments.value = []
    users.value = []
    currentUserProfile.value = null
    following.value = []
    followers.value = []
    notifications.value = []
    unreadNotificationCount.value = 0
    stats.value = null
    recommendedUsers.value = []
    trendingTags.value = []
    loading.value = false
    error.value = null
    clearCache()
  }

  return {
    // State
    posts,
    currentPost,
    comments,
    users,
    currentUserProfile,
    following,
    followers,
    notifications,
    unreadNotificationCount,
    stats,
    recommendedUsers,
    trendingTags,
    loading,
    error,

    // Getters
    getPostById,
    getUserById,
    getCommentsByPostId,

    // Actions
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    toggleLikePost,
    sharePost,
    getComments,
    createComment,
    updateComment,
    deleteComment,
    toggleLikeComment,
    getUserProfile,
    updateUserProfile,
    getUserFollowing,
    getUserFollowers,
    toggleFollowUser,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount,
    search,
    getRecommendedUsers,
    getTrendingTags,
    getCommunityStats,
    clearCache,
    reset
  }
})
