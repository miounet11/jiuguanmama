<template>
  <div class="user-follow-page min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 mb-2">
          {{ pageTitle }}
        </h1>
        <p class="text-gray-300">{{ pageDescription }}</p>
      </div>

      <!-- 标签切换 -->
      <div class="flex justify-center mb-8">
        <div class="bg-gray-800/50 rounded-lg p-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="currentTab = tab.key"
            :class="[
              'px-6 py-2 rounded-md transition-all duration-200',
              currentTab === tab.key
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            ]"
          >
            <el-icon class="mr-2">
              <component :is="tab.icon" />
            </el-icon>
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="ml-2 text-sm opacity-75">
              ({{ tab.count }})
            </span>
          </button>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="max-w-2xl mx-auto mb-8">
        <div class="flex space-x-4">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
            class="flex-1"
          />
          <el-select v-model="sortBy" @change="loadUsers(true)" style="width: 150px">
            <el-option label="最新关注" value="latest" />
            <el-option label="最早关注" value="earliest" />
            <el-option label="最活跃" value="most_active" />
            <el-option label="粉丝最多" value="most_followers" />
          </el-select>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="max-w-4xl mx-auto">
        <!-- 加载状态 -->
        <div v-if="loading && users.length === 0" class="text-center py-12">
          <el-icon class="text-4xl text-purple-400 animate-spin"><Loading /></el-icon>
          <p class="text-gray-400 mt-4">正在加载用户...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && users.length === 0" class="text-center py-12">
          <el-icon class="text-6xl text-gray-500 mb-4"><User /></el-icon>
          <p class="text-gray-400 text-lg">{{ emptyStateText }}</p>
          <p class="text-gray-500 text-sm mt-2">{{ emptyStateSubtext }}</p>

          <!-- 推荐用户 -->
          <div v-if="currentTab === 'following' && recommendedUsers.length > 0" class="mt-8">
            <h3 class="text-lg font-medium text-white mb-4">推荐关注</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UserCard
                v-for="user in recommendedUsers"
                :key="user.id"
                :user="user"
                :show-follow-button="true"
                @follow="handleFollow"
                @click="goToUserProfile"
              />
            </div>
          </div>
        </div>

        <!-- 用户网格 -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UserCard
            v-for="user in users"
            :key="user.id"
            :user="user"
            :show-follow-button="currentTab === 'followers'"
            :show-unfollow-button="currentTab === 'following'"
            @follow="handleFollow"
            @unfollow="handleUnfollow"
            @click="goToUserProfile"
          />
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="text-center mt-8">
          <el-button @click="loadMoreUsers" :loading="loadingMore" size="large">
            加载更多
          </el-button>
        </div>

        <!-- 无限滚动触发器 -->
        <div ref="loadMoreTrigger" class="h-4"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { User, Follow } from '@/types/community'
import UserCard from '@/components/community/UserCard.vue'
import { User as UserIcon, UserFilled, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const users = ref<User[]>([])
const recommendedUsers = ref<User[]>([])
const searchQuery = ref('')
const sortBy = ref('latest')
const currentTab = ref<'following' | 'followers'>('following')
const currentPage = ref(1)
const pageSize = ref(18)
const hasMore = ref(true)

// 统计数据
const stats = reactive({
  followingCount: 0,
  followersCount: 0
})

// 无限滚动
const loadMoreTrigger = ref<HTMLElement>()
const observer = ref<IntersectionObserver>()

// 当前查看的用户ID
const targetUserId = computed(() => route.params.userId as string || userStore.user?.id)

// 标签配置
const tabs = computed(() => [
  {
    key: 'following',
    label: '关注',
    icon: UserIcon,
    count: stats.followingCount
  },
  {
    key: 'followers',
    label: '粉丝',
    icon: UserFilled,
    count: stats.followersCount
  }
])

// 页面标题和描述
const pageTitle = computed(() => {
  if (targetUserId.value === userStore.user?.id) {
    return currentTab.value === 'following' ? '我的关注' : '我的粉丝'
  } else {
    return currentTab.value === 'following' ? '用户关注' : '用户粉丝'
  }
})

const pageDescription = computed(() => {
  if (currentTab.value === 'following') {
    return '查看关注的用户，发现更多有趣的创作者'
  } else {
    return '查看粉丝列表，了解谁在关注你'
  }
})

// 空状态文本
const emptyStateText = computed(() => {
  if (currentTab.value === 'following') {
    return targetUserId.value === userStore.user?.id ? '你还没有关注任何人' : '该用户还没有关注任何人'
  } else {
    return targetUserId.value === userStore.user?.id ? '你还没有粉丝' : '该用户还没有粉丝'
  }
})

const emptyStateSubtext = computed(() => {
  if (currentTab.value === 'following') {
    return '关注感兴趣的用户，获取他们的最新动态'
  } else {
    return '创作优质内容，吸引更多用户关注'
  }
})

// 方法
const loadUsers = async (reset: boolean = false) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
      users.value = []
    } else {
      loadingMore.value = true
    }

    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value.trim() || undefined,
      sortBy: sortBy.value
    }

    let response
    if (currentTab.value === 'following') {
      response = await communityStore.getUserFollowing(targetUserId.value!, params.page, params.pageSize)
    } else {
      response = await communityStore.getUserFollowers(targetUserId.value!, params.page, params.pageSize)
    }

    if (response.success && response.data) {
      const follows = response.data.data
      const userList = follows.map((follow: Follow) =>
        currentTab.value === 'following' ? follow.following : follow.follower
      )

      if (reset) {
        users.value = userList
      } else {
        users.value.push(...userList)
      }

      hasMore.value = response.data.hasMore

      if (response.data.hasMore) {
        currentPage.value++
      }
    } else {
      throw new Error(response.error || '加载用户失败')
    }
  } catch (error) {
    console.error('加载用户失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '加载用户失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreUsers = () => {
  if (!loadingMore.value && hasMore.value) {
    loadUsers(false)
  }
}

const loadStats = async () => {
  try {
    if (!targetUserId.value) return

    // 加载关注数据
    const followingResponse = await communityStore.getUserFollowing(targetUserId.value, 1, 1)
    if (followingResponse.success && followingResponse.data) {
      stats.followingCount = followingResponse.data.total
    }

    // 加载粉丝数据
    const followersResponse = await communityStore.getUserFollowers(targetUserId.value, 1, 1)
    if (followersResponse.success && followersResponse.data) {
      stats.followersCount = followersResponse.data.total
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadRecommendedUsers = async () => {
  try {
    const response = await communityStore.getRecommendedUsers(9)
    if (response.success && response.data) {
      recommendedUsers.value = response.data
    }
  } catch (error) {
    console.error('加载推荐用户失败:', error)
  }
}

const handleSearch = debounce(() => {
  loadUsers(true)
}, 300)

const handleFollow = async (userId: string) => {
  try {
    const response = await communityStore.toggleFollowUser(userId)
    if (response.success && response.data) {
      // 更新用户关注状态
      const user = users.value.find(u => u.id === userId)
      if (user) {
        user.isFollowing = response.data.isFollowing
        user.followerCount = response.data.followerCount
      }

      // 更新推荐用户状态
      const recommendedUser = recommendedUsers.value.find(u => u.id === userId)
      if (recommendedUser) {
        recommendedUser.isFollowing = response.data.isFollowing
        recommendedUser.followerCount = response.data.followerCount
      }

      ElMessage.success(response.data.isFollowing ? '关注成功!' : '取消关注成功!')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleUnfollow = async (userId: string) => {
  try {
    const response = await communityStore.toggleFollowUser(userId)
    if (response.success) {
      // 从关注列表中移除
      users.value = users.value.filter(u => u.id !== userId)
      stats.followingCount--
      ElMessage.success('取消关注成功!')
    }
  } catch (error) {
    console.error('取消关注失败:', error)
    ElMessage.error('操作失败')
  }
}

const goToUserProfile = (user: User) => {
  router.push(`/community/user/${user.id}`)
}

const setupInfiniteScroll = () => {
  if (!loadMoreTrigger.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loadingMore.value) {
        loadMoreUsers()
      }
    },
    { threshold: 0.1 }
  )

  observer.value.observe(loadMoreTrigger.value)
}

// 监听
watch(currentTab, () => {
  loadUsers(true)
})

watch(sortBy, () => {
  loadUsers(true)
})

watch(() => route.params.userId, () => {
  loadStats()
  loadUsers(true)
})

// 生命周期
onMounted(() => {
  // 从路由查询参数设置初始标签
  if (route.query.tab === 'followers') {
    currentTab.value = 'followers'
  }

  loadStats()
  loadUsers(true)
  loadRecommendedUsers()

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
/* 自定义选择器样式 */
:deep(.el-select .el-input__inner) {
  @apply bg-gray-800 border-gray-600 text-white;
}

:deep(.el-input__inner) {
  @apply bg-gray-800 border-gray-600 text-white placeholder-gray-400;
}

:deep(.el-input__inner:focus) {
  @apply border-purple-500;
}

/* 按钮悬停效果 */
button:hover {
  transform: translateY(-1px);
}
</style>
