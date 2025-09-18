<template>
  <div class="community-page min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <!-- 页面标题区 -->
    <div class="relative">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-3xl"></div>

      <div class="relative container mx-auto px-4 py-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 mb-3">
            社区广场
          </h1>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            分享创作，交流想法，发现精彩的AI角色世界
          </p>
        </div>

        <!-- 快速统计 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="glass-card p-4 text-center">
            <div class="text-xl font-bold text-purple-400">{{ stats.totalUsers || 0 }}</div>
            <div class="text-sm text-gray-400">活跃用户</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-xl font-bold text-yellow-400">{{ stats.totalPosts || 0 }}</div>
            <div class="text-sm text-gray-400">动态数量</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-xl font-bold text-green-400">{{ stats.totalComments || 0 }}</div>
            <div class="text-sm text-gray-400">评论数量</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-xl font-bold text-blue-400">{{ stats.activeUsers24h || 0 }}</div>
            <div class="text-sm text-gray-400">今日活跃</div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 pb-12">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

        <!-- 左侧导航栏 -->
        <div class="lg:col-span-1">
          <div class="glass-card p-6 mb-6">
            <h3 class="text-lg font-semibold text-white mb-4">动态筛选</h3>
            <div class="space-y-3">
              <button
                v-for="filterOption in filterOptions"
                :key="filterOption.value"
                @click="currentFilter = filterOption.value"
                :class="[
                  'w-full px-4 py-2 rounded-lg text-left transition-all duration-200',
                  currentFilter === filterOption.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                ]"
              >
                <el-icon class="mr-2">
                  <component :is="filterOption.icon" />
                </el-icon>
                {{ filterOption.label }}
              </button>
            </div>
          </div>

          <!-- 热门标签 -->
          <div class="glass-card p-6 mb-6">
            <h3 class="text-lg font-semibold text-white mb-4">热门标签</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in trendingTags"
                :key="tag.tag"
                @click="toggleTagFilter(tag.tag)"
                :class="[
                  'px-3 py-1 rounded-full text-sm transition-all duration-200',
                  selectedTags.includes(tag.tag)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                ]"
              >
                #{{ tag.tag }}
                <span class="ml-1 text-xs opacity-75">{{ tag.count }}</span>
              </button>
            </div>
          </div>

          <!-- 推荐关注 -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-semibold text-white mb-4">推荐关注</h3>
            <div class="space-y-3">
              <div
                v-for="user in recommendedUsers"
                :key="user.id"
                class="flex items-center justify-between"
              >
                <div class="flex items-center space-x-3">
                  <el-avatar :size="32" :src="user.avatar">
                    {{ user.username.charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div>
                    <div class="text-sm font-medium text-white">{{ user.username }}</div>
                    <div class="text-xs text-gray-400">{{ user.followerCount }} 粉丝</div>
                  </div>
                </div>
                <el-button
                  size="small"
                  type="primary"
                  @click="followUser(user.id)"
                  :loading="followingUsers.includes(user.id)"
                >
                  关注
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间动态区域 -->
        <div class="lg:col-span-2">
          <!-- 发布动态区域 -->
          <div v-if="userStore.isAuthenticated" class="glass-card p-6 mb-6">
            <div class="flex items-start space-x-3">
              <el-avatar :size="40" :src="userStore.user?.avatar">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="flex-1">
                <el-input
                  v-model="quickPostContent"
                  type="textarea"
                  :rows="3"
                  placeholder="分享你的想法..."
                  class="mb-3"
                />
                <div class="flex items-center justify-between">
                  <div class="flex space-x-2">
                    <el-button size="small" @click="openCreatePostDialog('text')">
                      <el-icon><EditPen /></el-icon>
                      文字
                    </el-button>
                    <el-button size="small" @click="openCreatePostDialog('image')">
                      <el-icon><Picture /></el-icon>
                      图片
                    </el-button>
                    <el-button size="small" @click="openCreatePostDialog('character_share')">
                      <el-icon><Avatar /></el-icon>
                      角色
                    </el-button>
                  </div>
                  <el-button
                    type="primary"
                    size="small"
                    @click="quickPost"
                    :disabled="!quickPostContent.trim()"
                    :loading="isPosting"
                  >
                    发布
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 动态排序选项 -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex space-x-4">
              <button
                v-for="sortOption in sortOptions"
                :key="sortOption.value"
                @click="currentSort = sortOption.value"
                :class="[
                  'px-4 py-2 rounded-lg transition-all duration-200',
                  currentSort === sortOption.value
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800/50'
                ]"
              >
                {{ sortOption.label }}
              </button>
            </div>
            <el-button @click="refreshPosts" :loading="loading" size="small">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>

          <!-- 动态列表 -->
          <div class="space-y-6">
            <!-- 加载状态 -->
            <div v-if="loading && posts.length === 0" class="text-center py-12">
              <el-icon class="text-4xl text-purple-400 animate-spin"><Loading /></el-icon>
              <p class="text-gray-400 mt-4">正在加载动态...</p>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!loading && posts.length === 0" class="text-center py-12">
              <el-icon class="text-6xl text-gray-500 mb-4"><DocumentEmpty /></el-icon>
              <p class="text-gray-400 text-lg">暂无动态</p>
              <p class="text-gray-500 text-sm mt-2">成为第一个发布动态的人吧！</p>
            </div>

            <!-- 动态卡片 -->
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              @like="handleLikePost"
              @comment="handleCommentPost"
              @share="handleSharePost"
              @delete="handleDeletePost"
              @click="goToPostDetail"
            />

            <!-- 加载更多 -->
            <div v-if="hasMore" class="text-center py-6">
              <el-button
                @click="loadMorePosts"
                :loading="loadingMore"
                size="large"
              >
                加载更多
              </el-button>
            </div>

            <!-- 无限滚动触发器 -->
            <div ref="loadMoreTrigger" class="h-4"></div>
          </div>
        </div>

        <!-- 右侧信息栏 -->
        <div class="lg:col-span-1">
          <!-- 热门动态 -->
          <div class="glass-card p-6 mb-6">
            <h3 class="text-lg font-semibold text-white mb-4">热门动态</h3>
            <div class="space-y-3">
              <div
                v-for="(post, index) in featuredPosts"
                :key="post.id"
                class="cursor-pointer p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-all duration-200"
                @click="goToPostDetail(post)"
              >
                <div class="flex items-start space-x-2">
                  <span class="text-purple-400 font-bold text-sm">{{ index + 1 }}.</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-300 line-clamp-2">{{ post.content }}</p>
                    <div class="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <span>{{ post.likeCount }} 赞</span>
                      <span>{{ post.commentCount }} 评论</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 今日数据 -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-semibold text-white mb-4">今日数据</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">新增动态</span>
                <span class="text-purple-400 font-semibold">+{{ todayStats.newPosts || 0 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">新增评论</span>
                <span class="text-yellow-400 font-semibold">+{{ todayStats.newComments || 0 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">新增用户</span>
                <span class="text-green-400 font-semibold">+{{ todayStats.newUsers || 0 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">活跃用户</span>
                <span class="text-blue-400 font-semibold">{{ todayStats.activeUsers || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布动态对话框 -->
    <CreatePostDialog
      v-model="showCreateDialog"
      :initial-type="createDialogType"
      :initial-content="quickPostContent"
      @created="handlePostCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { Post, PostFilter, User } from '@/types/community'
import PostCard from '@/components/community/PostCard.vue'
import CreatePostDialog from '@/components/community/CreatePostDialog.vue'
import {
  Star,
  Document,
  User as UserIcon,
  Picture,
  Refresh,
  Loading,
  DocumentEmpty,
  EditPen,
  Avatar
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const isPosting = ref(false)
const posts = ref<Post[]>([])
const hasMore = ref(true)
const currentPage = ref(1)

// 筛选和排序
const currentFilter = ref<string>('all')
const currentSort = ref<string>('latest')
const selectedTags = ref<string[]>([])
const quickPostContent = ref('')

// 对话框状态
const showCreateDialog = ref(false)
const createDialogType = ref<'text' | 'image' | 'character_share'>('text')

// 推荐数据
const recommendedUsers = ref<User[]>([])
const trendingTags = ref<Array<{ tag: string; count: number }>>([])
const featuredPosts = ref<Post[]>([])
const followingUsers = ref<string[]>([])

// 统计数据
const stats = ref({
  totalUsers: 0,
  totalPosts: 0,
  totalComments: 0,
  activeUsers24h: 0
})

const todayStats = ref({
  newPosts: 0,
  newComments: 0,
  newUsers: 0,
  activeUsers: 0
})

// 无限滚动
const loadMoreTrigger = ref<HTMLElement>()
const observer = ref<IntersectionObserver>()

// 配置选项
const filterOptions = [
  { value: 'all', label: '全部动态', icon: Document },
  { value: 'following', label: '我的关注', icon: UserIcon },
  { value: 'text', label: '文字动态', icon: EditPen },
  { value: 'character_share', label: '角色分享', icon: Avatar },
  { value: 'image', label: '图片动态', icon: Picture },
  { value: 'featured', label: '精选推荐', icon: Star }
]

const sortOptions = [
  { value: 'latest', label: '最新' },
  { value: 'popular', label: '热门' },
  { value: 'trending', label: '趋势' }
]

// 计算当前筛选条件
const currentFilterConfig = computed((): PostFilter => {
  const filter: PostFilter = {}

  if (currentFilter.value === 'following') {
    filter.following = true
  } else if (currentFilter.value === 'featured') {
    filter.featured = true
  } else if (currentFilter.value !== 'all') {
    filter.type = currentFilter.value as any
  }

  if (selectedTags.value.length > 0) {
    filter.tags = selectedTags.value
  }

  return filter
})

// 方法
const loadPosts = async (reset: boolean = false) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
      posts.value = []
    } else {
      loadingMore.value = true
    }

    const response = await communityStore.getPosts({
      ...currentFilterConfig.value,
      page: currentPage.value,
      pageSize: 20
    })

    if (response.success && response.data) {
      if (reset) {
        posts.value = response.data.data
      } else {
        posts.value.push(...response.data.data)
      }

      hasMore.value = response.data.hasMore

      if (response.data.hasMore) {
        currentPage.value++
      }
    }
  } catch (error) {
    console.error('加载动态失败:', error)
    ElMessage.error('加载动态失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMorePosts = () => {
  if (!loadingMore.value && hasMore.value) {
    loadPosts(false)
  }
}

const refreshPosts = () => {
  loadPosts(true)
}

const quickPost = async () => {
  if (!quickPostContent.value.trim()) return

  try {
    isPosting.value = true

    const response = await communityStore.createPost({
      content: quickPostContent.value,
      type: 'text',
      visibility: 'public'
    })

    if (response.success && response.data) {
      posts.value.unshift(response.data)
      quickPostContent.value = ''
      ElMessage.success('动态发布成功!')
    }
  } catch (error) {
    console.error('发布动态失败:', error)
    ElMessage.error('发布动态失败')
  } finally {
    isPosting.value = false
  }
}

const openCreatePostDialog = (type: 'text' | 'image' | 'character_share') => {
  createDialogType.value = type
  showCreateDialog.value = true
}

const handlePostCreated = (post: Post) => {
  posts.value.unshift(post)
  ElMessage.success('动态发布成功!')
}

const handleLikePost = async (postId: string) => {
  try {
    const response = await communityStore.toggleLikePost(postId)
    if (response.success && response.data) {
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.isLiked = response.data.isLiked
        post.likeCount = response.data.likeCount
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleCommentPost = (postId: string) => {
  router.push(`/community/post/${postId}`)
}

const handleSharePost = async (postId: string) => {
  try {
    const response = await communityStore.sharePost(postId)
    if (response.success) {
      ElMessage.success('分享成功!')
    }
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享失败')
  }
}

const handleDeletePost = async (postId: string) => {
  try {
    const response = await communityStore.deletePost(postId)
    if (response.success) {
      posts.value = posts.value.filter(p => p.id !== postId)
      ElMessage.success('删除成功!')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

const goToPostDetail = (post: Post) => {
  router.push(`/community/post/${post.id}`)
}

const toggleTagFilter = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const followUser = async (userId: string) => {
  try {
    followingUsers.value.push(userId)
    const response = await communityStore.toggleFollowUser(userId)
    if (response.success) {
      // 从推荐列表中移除
      recommendedUsers.value = recommendedUsers.value.filter(u => u.id !== userId)
      ElMessage.success('关注成功!')
    }
  } catch (error) {
    console.error('关注失败:', error)
    ElMessage.error('关注失败')
  } finally {
    followingUsers.value = followingUsers.value.filter(id => id !== userId)
  }
}

const loadRecommendedData = async () => {
  try {
    // 加载推荐用户
    const usersResponse = await communityStore.getRecommendedUsers(8)
    if (usersResponse.success && usersResponse.data) {
      recommendedUsers.value = usersResponse.data
    }

    // 加载热门标签
    const tagsResponse = await communityStore.getTrendingTags(15)
    if (tagsResponse.success && tagsResponse.data) {
      trendingTags.value = tagsResponse.data
    }

    // 加载统计数据
    const statsResponse = await communityStore.getCommunityStats()
    if (statsResponse.success && statsResponse.data) {
      stats.value = {
        totalUsers: statsResponse.data.totalUsers,
        totalPosts: statsResponse.data.totalPosts,
        totalComments: statsResponse.data.totalComments,
        activeUsers24h: statsResponse.data.activeUsers24h
      }

      featuredPosts.value = statsResponse.data.trendingPosts.slice(0, 5)
    }
  } catch (error) {
    console.error('加载推荐数据失败:', error)
  }
}

const setupInfiniteScroll = () => {
  if (!loadMoreTrigger.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loadingMore.value) {
        loadMorePosts()
      }
    },
    { threshold: 0.1 }
  )

  observer.value.observe(loadMoreTrigger.value)
}

// 监听筛选条件变化
watch([currentFilter, currentSort, selectedTags], () => {
  refreshPosts()
}, { deep: true })

// 生命周期
onMounted(() => {
  loadPosts(true)
  loadRecommendedData()

  nextTick(() => {
    setupInfiniteScroll()
  })
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.glass-card {
  @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-xl;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
