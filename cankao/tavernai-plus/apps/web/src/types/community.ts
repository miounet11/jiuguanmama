export interface User {
  id: string
  username: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  joinDate: string
  isVerified?: boolean
  followerCount: number
  followingCount: number
  postCount: number
  isFollowing?: boolean
  isBlocked?: boolean
}

export interface Post {
  id: string
  content: string
  type: 'text' | 'character_share' | 'image'
  visibility: 'public' | 'followers' | 'private'

  // 内容相关
  images?: string[]
  characterId?: string
  character?: {
    id: string
    name: string
    avatar?: string
    description: string
  }

  // 统计数据
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number

  // 用户交互状态
  isLiked?: boolean
  isBookmarked?: boolean
  isShared?: boolean

  // 用户和时间信息
  userId: string
  user: User
  createdAt: string
  updatedAt: string

  // 置顶和推荐
  isPinned?: boolean
  isFeatured?: boolean

  // 标签
  tags?: string[]
}

export interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  user: User
  parentId?: string // 用于嵌套回复
  children?: Comment[]

  // 统计数据
  likeCount: number
  isLiked?: boolean

  // 时间信息
  createdAt: string
  updatedAt: string
}

export interface PostCreateData {
  content: string
  type: 'text' | 'character_share' | 'image'
  visibility: 'public' | 'followers' | 'private'
  images?: string[]
  characterId?: string
  tags?: string[]
}

export interface PostFilter {
  type?: 'text' | 'character_share' | 'image' | 'all'
  visibility?: 'public' | 'followers' | 'private'
  userId?: string
  tags?: string[]
  following?: boolean // 仅显示关注用户的动态
  featured?: boolean // 仅显示推荐内容
}

export interface CommunityStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  activeUsers24h: number
  popularTags: Array<{
    tag: string
    count: number
  }>
  trendingPosts: Post[]
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system'
  title: string
  content: string
  isRead: boolean
  userId: string
  fromUserId?: string
  fromUser?: User
  relatedPostId?: string
  relatedPost?: Post
  relatedCommentId?: string
  createdAt: string

  // 动作链接
  actionUrl?: string
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  follower: User
  following: User
  createdAt: string
}

export interface UserProfile extends User {
  posts: Post[]
  characters: Array<{
    id: string
    name: string
    avatar?: string
    description: string
    isPublic: boolean
  }>
  recentActivity: Array<{
    type: 'post' | 'comment' | 'like' | 'follow'
    content: string
    createdAt: string
  }>
}

// API 响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 表单数据类型
export interface CommentCreateData {
  content: string
  postId: string
  parentId?: string
}

export interface UserUpdateData {
  username?: string
  bio?: string
  location?: string
  website?: string
  avatar?: string
}

// 搜索相关
export interface SearchFilters {
  query: string
  type: 'users' | 'posts' | 'characters' | 'all'
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all'
  sortBy?: 'relevance' | 'date' | 'popularity'
}

export interface SearchResult {
  users: User[]
  posts: Post[]
  characters: Array<{
    id: string
    name: string
    avatar?: string
    description: string
    user: User
  }>
  total: {
    users: number
    posts: number
    characters: number
  }
}
