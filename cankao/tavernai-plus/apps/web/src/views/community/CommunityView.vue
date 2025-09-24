<template>
  <div class="community-page">
    <!-- 页面标题区 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <h1 class="gradient-title">
            <TavernIcon name="users" class="title-icon" />
            社区广场
          </h1>
          <p class="subtitle">
            分享创作，交流想法，发现精彩的AI角色世界
          </p>
        </div>

        <!-- 快速统计 -->
        <div class="stats-grid">
          <TavernCard variant="glass" class="stat-card">
            <div class="stat-content">
              <TavernIcon name="users" class="stat-icon users" />
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
                <div class="stat-label">活跃用户</div>
              </div>
            </div>
          </TavernCard>
          <TavernCard variant="glass" class="stat-card">
            <div class="stat-content">
              <TavernIcon name="document-text" class="stat-icon posts" />
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalPosts || 0 }}</div>
                <div class="stat-label">动态数量</div>
              </div>
            </div>
          </TavernCard>
          <TavernCard variant="glass" class="stat-card">
            <div class="stat-content">
              <TavernIcon name="chat-bubble-left-ellipsis" class="stat-icon comments" />
              <div class="stat-info">
                <div class="stat-value">{{ stats.totalComments || 0 }}</div>
                <div class="stat-label">评论数量</div>
              </div>
            </div>
          </TavernCard>
          <TavernCard variant="glass" class="stat-card">
            <div class="stat-content">
              <TavernIcon name="fire" class="stat-icon active" />
              <div class="stat-info">
                <div class="stat-value">{{ stats.activeUsers24h || 0 }}</div>
                <div class="stat-label">今日活跃</div>
              </div>
            </div>
          </TavernCard>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="container">
        <div class="content-grid">

          <!-- 左侧导航栏 -->
          <div class="sidebar-left">
            <TavernCard variant="glass" class="filter-card">
              <h3 class="card-title">动态筛选</h3>
              <div class="filter-options">
                <TavernButton
                  v-for="filterOption in filterOptions"
                  :key="filterOption.value"
                  @click="currentFilter = filterOption.value"
                  :variant="currentFilter === filterOption.value ? 'primary' : 'ghost'"
                  size="sm"
                  class="filter-button"
                >
                  <TavernIcon :name="getFilterIcon(filterOption.value)" />
                  {{ filterOption.label }}
                </TavernButton>
              </div>
            </TavernCard>

            <!-- 热门标签 -->
            <TavernCard variant="glass" class="tags-card">
              <h3 class="card-title">热门标签</h3>
              <div class="tags-container">
                <TavernBadge
                  v-for="tag in trendingTags"
                  :key="tag.tag"
                  @click="toggleTagFilter(tag.tag)"
                  :variant="selectedTags.includes(tag.tag) ? 'primary' : 'secondary'"
                  size="sm"
                  class="tag-badge"
                  clickable
                >
                  #{{ tag.tag }}
                  <span class="tag-count">{{ tag.count }}</span>
                </TavernBadge>
              </div>
            </TavernCard>

            <!-- 推荐关注 -->
            <TavernCard variant="glass" class="recommended-card">
              <h3 class="card-title">推荐关注</h3>
              <div class="recommended-users">
                <div
                  v-for="user in recommendedUsers"
                  :key="user.id"
                  class="user-item"
                >
                  <div class="user-info">
                    <div class="user-avatar">
                      <img
                        v-if="user.avatar"
                        :src="user.avatar"
                        :alt="user.username"
                        class="avatar-image"
                      />
                      <div v-else class="avatar-placeholder">
                        {{ user.username.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div class="user-details">
                      <div class="username">{{ user.username }}</div>
                      <div class="follower-count">{{ user.followerCount }} 粉丝</div>
                    </div>
                  </div>
                  <TavernButton
                    size="sm"
                    variant="primary"
                    @click="followUser(user.id)"
                    :loading="followingUsers.includes(user.id)"
                  >
                    关注
                  </TavernButton>
                </div>
              </div>
            </TavernCard>
          </div>

          <!-- 中间动态区域 -->
          <div class="main-feed">
            <!-- 发布动态区域 -->
            <TavernCard v-if="userStore.isAuthenticated" variant="glass" class="compose-card">
              <div class="compose-content">
                <div class="compose-avatar">
                  <img
                    v-if="userStore.user?.avatar"
                    :src="userStore.user.avatar"
                    :alt="userStore.user.username"
                    class="avatar-image"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ userStore.user?.username?.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="compose-form">
                  <TavernInput
                    v-model="quickPostContent"
                    type="textarea"
                    :rows="3"
                    placeholder="分享你的想法..."
                    class="compose-input"
                  />
                  <div class="compose-actions">
                    <div class="action-buttons">
                      <TavernButton size="sm" variant="ghost" @click="openCreatePostDialog('text')">
                        <TavernIcon name="pencil-square" />
                        文字
                      </TavernButton>
                      <TavernButton size="sm" variant="ghost" @click="openCreatePostDialog('image')">
                        <TavernIcon name="photo" />
                        图片
                      </TavernButton>
                      <TavernButton size="sm" variant="ghost" @click="openCreatePostDialog('character_share')">
                        <TavernIcon name="user-circle" />
                        角色
                      </TavernButton>
                    </div>
                    <TavernButton
                      variant="primary"
                      size="sm"
                      @click="quickPost"
                      :disabled="!quickPostContent.trim()"
                      :loading="isPosting"
                    >
                      发布
                    </TavernButton>
                  </div>
                </div>
              </div>
            </TavernCard>

            <!-- 动态排序选项 -->
            <div class="sort-toolbar">
              <div class="sort-options">
                <TavernButton
                  v-for="sortOption in sortOptions"
                  :key="sortOption.value"
                  @click="currentSort = sortOption.value"
                  :variant="currentSort === sortOption.value ? 'primary' : 'ghost'"
                  size="sm"
                >
                  {{ sortOption.label }}
                </TavernButton>
              </div>
              <TavernButton @click="refreshPosts" :loading="loading" size="sm" variant="ghost">
                <TavernIcon name="arrow-path" />
                刷新
              </TavernButton>
            </div>

            <!-- 动态列表 -->
            <div class="posts-container">
              <!-- 加载状态 -->
              <TavernCard v-if="loading && posts.length === 0" variant="glass" class="loading-card">
                <div class="loading-content">
                  <TavernIcon name="arrow-path" class="loading-icon" />
                  <p class="loading-text">正在加载动态...</p>
                </div>
              </TavernCard>

              <!-- 空状态 -->
              <TavernCard v-else-if="!loading && posts.length === 0" variant="glass" class="empty-card">
                <div class="empty-content">
                  <TavernIcon name="document-text" class="empty-icon" />
                  <p class="empty-title">暂无动态</p>
                  <p class="empty-subtitle">成为第一个发布动态的人吧！</p>
                </div>
              </TavernCard>

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
              <div v-if="hasMore" class="load-more-container">
                <TavernButton
                  @click="loadMorePosts"
                  :loading="loadingMore"
                  size="lg"
                  variant="primary"
                >
                  加载更多
                </TavernButton>
              </div>

              <!-- 无限滚动触发器 -->
              <div ref="loadMoreTrigger" class="scroll-trigger"></div>
            </div>
          </div>

          <!-- 右侧信息栏 -->
          <div class="sidebar-right">
            <!-- 热门动态 -->
            <TavernCard variant="glass" class="trending-card">
              <h3 class="card-title">热门动态</h3>
              <div class="trending-posts">
                <div
                  v-for="(post, index) in featuredPosts"
                  :key="post.id"
                  class="trending-post"
                  @click="goToPostDetail(post)"
                >
                  <div class="trending-post-content">
                    <TavernBadge variant="primary" size="xs" class="post-rank">
                      {{ index + 1 }}
                    </TavernBadge>
                    <div class="post-info">
                      <p class="post-content">{{ post.content }}</p>
                      <div class="post-stats">
                        <span class="stat-item">
                          <TavernIcon name="heart" class="stat-icon" />
                          {{ post.likeCount }}
                        </span>
                        <span class="stat-item">
                          <TavernIcon name="chat-bubble-left" class="stat-icon" />
                          {{ post.commentCount }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TavernCard>

            <!-- 今日数据 -->
            <TavernCard variant="glass" class="daily-stats-card">
              <h3 class="card-title">今日数据</h3>
              <div class="daily-stats">
                <div class="stat-row">
                  <span class="stat-label">新增动态</span>
                  <TavernBadge variant="primary" size="sm">+{{ todayStats.newPosts || 0 }}</TavernBadge>
                </div>
                <div class="stat-row">
                  <span class="stat-label">新增评论</span>
                  <TavernBadge variant="warning" size="sm">+{{ todayStats.newComments || 0 }}</TavernBadge>
                </div>
                <div class="stat-row">
                  <span class="stat-label">新增用户</span>
                  <TavernBadge variant="success" size="sm">+{{ todayStats.newUsers || 0 }}</TavernBadge>
                </div>
                <div class="stat-row">
                  <span class="stat-label">活跃用户</span>
                  <TavernBadge variant="info" size="sm">{{ todayStats.activeUsers || 0 }}</TavernBadge>
                </div>
              </div>
            </TavernCard>
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
  { value: 'all', label: '全部动态' },
  { value: 'following', label: '我的关注' },
  { value: 'text', label: '文字动态' },
  { value: 'character_share', label: '角色分享' },
  { value: 'image', label: '图片动态' },
  { value: 'featured', label: '精选推荐' }
]

// 获取筛选器图标
const getFilterIcon = (value: string) => {
  const iconMap: Record<string, string> = {
    all: 'document-text',
    following: 'users',
    text: 'pencil-square',
    character_share: 'user-circle',
    image: 'photo',
    featured: 'star'
  }
  return iconMap[value] || 'document-text'
}

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
    console.error('加载动态失败')
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
        console.log('动态发布成功!')
    }
  } catch (error) {
    console.error('发布动态失败:', error)
    console.error('发布动态失败')
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
  console.log('动态发布成功!')
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
    console.error('操作失败')
  }
}

const handleCommentPost = (postId: string) => {
  router.push(`/community/post/${postId}`)
}

const handleSharePost = async (postId: string) => {
  try {
    const response = await communityStore.sharePost(postId)
    if (response.success) {
      console.log('分享成功!')
    }
  } catch (error) {
    console.error('分享失败:', error)
    console.error('分享失败')
  }
}

const handleDeletePost = async (postId: string) => {
  try {
    const response = await communityStore.deletePost(postId)
    if (response.success) {
      posts.value = posts.value.filter(p => p.id !== postId)
      console.log('删除成功!')
    }
  } catch (error) {
    console.error('删除失败:', error)
    console.error('删除失败')
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
      console.log('关注成功!')
    }
  } catch (error) {
    console.error('关注失败:', error)
    console.error('关注失败')
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

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.community-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
  color: var(--dt-color-text-primary);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--dt-spacing-lg);
}

// 页面头部
.page-header {
  padding: var(--dt-spacing-2xl) 0;
  text-align: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg,
      rgba(168, 85, 247, 0.1) 0%,
      rgba(79, 70, 229, 0.1) 100%);
    backdrop-filter: blur(20px);
    border-radius: var(--dt-radius-2xl);
  }

  .header-content {
    position: relative;
    z-index: 1;

    .gradient-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--dt-spacing-md);
      font-size: clamp(var(--dt-font-size-2xl), 6vw, var(--dt-font-size-4xl));
      font-weight: var(--dt-font-weight-bold);
      background: var(--dt-gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: var(--dt-spacing-md);
      animation: glow 2s ease-in-out infinite alternate;

      .title-icon {
        color: var(--dt-color-primary);
        font-size: var(--dt-font-size-2xl);
      }
    }

    .subtitle {
      font-size: var(--dt-font-size-lg);
      color: var(--dt-color-text-secondary);
      max-width: 600px;
      margin: 0 auto var(--dt-spacing-xl);
      opacity: 0.9;
    }
  }
}

// 统计卡片网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--dt-spacing-lg);

  .stat-card {
    padding: var(--dt-spacing-lg);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(168, 85, 247, 0.2);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: var(--dt-spacing-md);

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--dt-radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;

        &.users {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        &.posts {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        &.comments {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        &.active {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }

      .stat-info {
        .stat-value {
          font-size: var(--dt-font-size-xl);
          font-weight: var(--dt-font-weight-bold);
          color: var(--dt-color-text-primary);
          margin-bottom: var(--dt-spacing-xs);
        }

        .stat-label {
          font-size: var(--dt-font-size-sm);
          color: var(--dt-color-text-secondary);
          opacity: 0.8;
        }
      }
    }
  }
}

// 主内容区域
.main-content {
  padding: var(--dt-spacing-xl) 0;

  .content-grid {
    display: grid;
    grid-template-columns: 300px 1fr 300px;
    gap: var(--dt-spacing-xl);

    @media (max-width: 1200px) {
      grid-template-columns: 250px 1fr 250px;
      gap: var(--dt-spacing-lg);
    }

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
      gap: var(--dt-spacing-md);
    }
  }
}

// 左侧侧边栏
.sidebar-left {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);

  .filter-card, .tags-card, .recommended-card {
    padding: var(--dt-spacing-lg);

    .card-title {
      font-size: var(--dt-font-size-lg);
      font-weight: var(--dt-font-weight-semibold);
      color: var(--dt-color-text-primary);
      margin-bottom: var(--dt-spacing-md);
    }
  }

  .filter-options {
    display: flex;
    flex-direction: column;
    gap: var(--dt-spacing-sm);

    .filter-button {
      width: 100%;
      justify-content: flex-start;
      gap: var(--dt-spacing-sm);
    }
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dt-spacing-sm);

    .tag-badge {
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }

      .tag-count {
        margin-left: var(--dt-spacing-xs);
        font-size: var(--dt-font-size-xs);
        opacity: 0.7;
      }
    }
  }

  .recommended-users {
    display: flex;
    flex-direction: column;
    gap: var(--dt-spacing-md);

    .user-item {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .user-info {
        display: flex;
        align-items: center;
        gap: var(--dt-spacing-sm);

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;

          .avatar-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .avatar-placeholder {
            width: 100%;
            height: 100%;
            background: var(--dt-gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: var(--dt-font-weight-semibold);
            font-size: var(--dt-font-size-sm);
          }
        }

        .user-details {
          .username {
            font-size: var(--dt-font-size-sm);
            font-weight: var(--dt-font-weight-medium);
            color: var(--dt-color-text-primary);
            margin-bottom: var(--dt-spacing-xs);
          }

          .follower-count {
            font-size: var(--dt-font-size-xs);
            color: var(--dt-color-text-secondary);
            opacity: 0.8;
          }
        }
      }
    }
  }
}

// 主要信息流
.main-feed {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);

  .compose-card {
    padding: var(--dt-spacing-lg);

    .compose-content {
      display: flex;
      gap: var(--dt-spacing-md);

      .compose-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: var(--dt-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: var(--dt-font-weight-semibold);
        }
      }

      .compose-form {
        flex: 1;

        .compose-input {
          margin-bottom: var(--dt-spacing-md);
        }

        .compose-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .action-buttons {
            display: flex;
            gap: var(--dt-spacing-sm);
          }
        }
      }
    }
  }

  .sort-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .sort-options {
      display: flex;
      gap: var(--dt-spacing-sm);
    }
  }

  .posts-container {
    display: flex;
    flex-direction: column;
    gap: var(--dt-spacing-lg);

    .loading-card, .empty-card {
      padding: var(--dt-spacing-3xl);
      text-align: center;

      .loading-content, .empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--dt-spacing-md);

        .loading-icon {
          font-size: var(--dt-font-size-3xl);
          color: var(--dt-color-primary);
          animation: spin 1s linear infinite;
        }

        .empty-icon {
          font-size: var(--dt-font-size-4xl);
          color: var(--dt-color-text-tertiary);
          opacity: 0.5;
        }

        .loading-text, .empty-title {
          font-size: var(--dt-font-size-lg);
          color: var(--dt-color-text-secondary);
        }

        .empty-subtitle {
          font-size: var(--dt-font-size-sm);
          color: var(--dt-color-text-tertiary);
          opacity: 0.8;
        }
      }
    }

    .load-more-container {
      text-align: center;
      padding: var(--dt-spacing-lg);
    }

    .scroll-trigger {
      height: 20px;
    }
  }
}

// 右侧侧边栏
.sidebar-right {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);

  .trending-card, .daily-stats-card {
    padding: var(--dt-spacing-lg);

    .card-title {
      font-size: var(--dt-font-size-lg);
      font-weight: var(--dt-font-weight-semibold);
      color: var(--dt-color-text-primary);
      margin-bottom: var(--dt-spacing-md);
    }
  }

  .trending-posts {
    display: flex;
    flex-direction: column;
    gap: var(--dt-spacing-sm);

    .trending-post {
      cursor: pointer;
      padding: var(--dt-spacing-md);
      border-radius: var(--dt-radius-md);
      background: rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(4px);
      }

      .trending-post-content {
        display: flex;
        gap: var(--dt-spacing-sm);
        align-items: flex-start;

        .post-rank {
          flex-shrink: 0;
        }

        .post-info {
          flex: 1;
          min-width: 0;

          .post-content {
            font-size: var(--dt-font-size-sm);
            color: var(--dt-color-text-primary);
            margin-bottom: var(--dt-spacing-xs);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .post-stats {
            display: flex;
            gap: var(--dt-spacing-md);

            .stat-item {
              display: flex;
              align-items: center;
              gap: var(--dt-spacing-xs);
              font-size: var(--dt-font-size-xs);
              color: var(--dt-color-text-tertiary);

              .stat-icon {
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }

  .daily-stats {
    display: flex;
    flex-direction: column;
    gap: var(--dt-spacing-sm);

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .stat-label {
        font-size: var(--dt-font-size-sm);
        color: var(--dt-color-text-secondary);
      }
    }
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 968px) {
  .content-grid {
    .sidebar-left,
    .sidebar-right {
      order: 2;
    }

    .main-feed {
      order: 1;
    }
  }

  .page-header {
    padding: var(--dt-spacing-lg) 0;

    .header-content {
      .gradient-title {
        font-size: clamp(var(--dt-font-size-xl), 5vw, var(--dt-font-size-2xl));
        flex-direction: column;
        gap: var(--dt-spacing-sm);
      }
    }
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--dt-spacing-md);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 var(--dt-spacing-md);
  }

  .compose-card {
    .compose-content {
      flex-direction: column;

      .compose-avatar {
        align-self: flex-start;
      }
    }
  }

  .sort-toolbar {
    flex-direction: column;
    gap: var(--dt-spacing-md);
    align-items: stretch;

    .sort-options {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>
