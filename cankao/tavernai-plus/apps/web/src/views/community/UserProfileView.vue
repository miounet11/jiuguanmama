<template>
  <div class="user-profile-page min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <!-- 用户头部信息 -->
    <div class="relative">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-3xl"></div>

      <div class="relative container mx-auto px-4 py-12">
        <div v-if="loading && !userProfile" class="text-center py-12">
          <el-icon class="text-4xl text-purple-400 animate-spin"><Loading /></el-icon>
          <p class="text-gray-400 mt-4">正在加载用户信息...</p>
        </div>

        <div v-else-if="userProfile" class="max-w-4xl mx-auto">
          <div class="glass-card p-8">
            <div class="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              <!-- 用户头像 -->
              <div class="relative">
                <el-avatar :size="120" :src="userProfile.avatar" class="ring-4 ring-purple-400/30">
                  {{ userProfile.username.charAt(0).toUpperCase() }}
                </el-avatar>
                <!-- 在线状态 -->
                <div v-if="isOnline" class="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-gray-900"></div>
              </div>

              <!-- 用户信息 -->
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-3">
                  <h1 class="text-3xl font-bold text-white">{{ userProfile.username }}</h1>
                  <el-icon v-if="userProfile.isVerified" class="text-yellow-400 text-2xl">
                    <CircleCheck />
                  </el-icon>
                  <span v-if="isVip" class="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-sm font-bold rounded-full">
                    VIP
                  </span>
                </div>

                <p v-if="userProfile.bio" class="text-gray-300 mb-4 max-w-2xl">{{ userProfile.bio }}</p>

                <!-- 用户详细信息 -->
                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                  <div v-if="userProfile.location" class="flex items-center space-x-1">
                    <el-icon><Location /></el-icon>
                    <span>{{ userProfile.location }}</span>
                  </div>
                  <div v-if="userProfile.website" class="flex items-center space-x-1">
                    <el-icon><Link /></el-icon>
                    <a :href="userProfile.website" target="_blank" class="text-cyan-400 hover:underline">
                      {{ userProfile.website }}
                    </a>
                  </div>
                  <div class="flex items-center space-x-1">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ formatJoinDate(userProfile.joinDate) }}加入</span>
                  </div>
                </div>

                <!-- 统计数据 -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-purple-400">{{ userProfile.postCount || 0 }}</div>
                    <div class="text-sm text-gray-400">动态</div>
                  </div>
                  <div class="text-center cursor-pointer hover:bg-gray-700/30 rounded-lg p-2 transition-all" @click="goToFollowers">
                    <div class="text-2xl font-bold text-yellow-400">{{ userProfile.followerCount || 0 }}</div>
                    <div class="text-sm text-gray-400">粉丝</div>
                  </div>
                  <div class="text-center cursor-pointer hover:bg-gray-700/30 rounded-lg p-2 transition-all" @click="goToFollowing">
                    <div class="text-2xl font-bold text-green-400">{{ userProfile.followingCount || 0 }}</div>
                    <div class="text-sm text-gray-400">关注</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-400">{{ characterCount }}</div>
                    <div class="text-sm text-gray-400">角色</div>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex flex-col space-y-3">
                <!-- 自己的资料 -->
                <template v-if="isOwnProfile">
                  <el-button type="primary" @click="editProfile">
                    <el-icon><Edit /></el-icon>
                    编辑资料
                  </el-button>
                  <el-button @click="viewSettings">
                    <el-icon><Setting /></el-icon>
                    设置
                  </el-button>
                </template>

                <!-- 其他用户 -->
                <template v-else>
                  <el-button
                    :type="userProfile.isFollowing ? 'success' : 'primary'"
                    @click="toggleFollow"
                    :loading="followLoading"
                  >
                    <el-icon>
                      <component :is="userProfile.isFollowing ? 'Check' : 'Plus'" />
                    </el-icon>
                    {{ userProfile.isFollowing ? '已关注' : '关注' }}
                  </el-button>

                  <el-button @click="sendMessage">
                    <el-icon><ChatDotRound /></el-icon>
                    发消息
                  </el-button>

                  <el-dropdown @command="handleMenuCommand" placement="bottom-end">
                    <el-button>
                      <el-icon><More /></el-icon>
                      更多
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="share">
                          <el-icon><Share /></el-icon>
                          分享用户
                        </el-dropdown-item>
                        <el-dropdown-item command="block" divided class="text-red-500">
                          <el-icon><CircleClose /></el-icon>
                          拉黑用户
                        </el-dropdown-item>
                        <el-dropdown-item command="report" class="text-orange-500">
                          <el-icon><Flag /></el-icon>
                          举报用户
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="container mx-auto px-4 pb-12">
      <div class="max-w-4xl mx-auto">
        <!-- 标签导航 -->
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
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="min-h-96">
          <!-- 动态标签 -->
          <div v-show="currentTab === 'posts'">
            <div v-if="loadingPosts" class="text-center py-12">
              <el-icon class="text-2xl text-purple-400 animate-spin"><Loading /></el-icon>
              <p class="text-gray-400 mt-2">正在加载动态...</p>
            </div>

            <div v-else-if="posts.length === 0" class="text-center py-12">
              <el-icon class="text-6xl text-gray-500 mb-4"><DocumentEmpty /></el-icon>
              <p class="text-gray-400 text-lg">{{ isOwnProfile ? '你还没有发布任何动态' : '该用户还没有发布任何动态' }}</p>
              <p class="text-gray-500 text-sm mt-2">{{ isOwnProfile ? '发布你的第一条动态吧！' : '关注该用户获取最新动态' }}</p>
            </div>

            <div v-else class="space-y-6">
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
              <div v-if="hasMorePosts" class="text-center">
                <el-button @click="loadMorePosts" :loading="loadingMorePosts">
                  加载更多动态
                </el-button>
              </div>
            </div>
          </div>

          <!-- 角色标签 -->
          <div v-show="currentTab === 'characters'">
            <div v-if="loadingCharacters" class="text-center py-12">
              <el-icon class="text-2xl text-purple-400 animate-spin"><Loading /></el-icon>
              <p class="text-gray-400 mt-2">正在加载角色...</p>
            </div>

            <div v-else-if="characters.length === 0" class="text-center py-12">
              <el-icon class="text-6xl text-gray-500 mb-4"><Avatar /></el-icon>
              <p class="text-gray-400 text-lg">{{ isOwnProfile ? '你还没有创建任何角色' : '该用户还没有创建任何角色' }}</p>
              <p class="text-gray-500 text-sm mt-2">{{ isOwnProfile ? '创建你的第一个AI角色吧！' : '期待该用户的精彩创作' }}</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CharacterCard
                v-for="character in characters"
                :key="character.id"
                :character="character"
                @click="goToCharacterDetail"
              />

              <!-- 加载更多 -->
              <div v-if="hasMoreCharacters" class="col-span-full text-center">
                <el-button @click="loadMoreCharacters" :loading="loadingMoreCharacters">
                  加载更多角色
                </el-button>
              </div>
            </div>
          </div>

          <!-- 活动标签 -->
          <div v-show="currentTab === 'activity'">
            <div v-if="loadingActivity" class="text-center py-12">
              <el-icon class="text-2xl text-purple-400 animate-spin"><Loading /></el-icon>
              <p class="text-gray-400 mt-2">正在加载活动...</p>
            </div>

            <div v-else-if="activities.length === 0" class="text-center py-12">
              <el-icon class="text-6xl text-gray-500 mb-4"><Clock /></el-icon>
              <p class="text-gray-400 text-lg">暂无活动记录</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="activity in activities"
                :key="activity.id"
                class="glass-card p-4 flex items-center space-x-3"
              >
                <el-icon class="text-purple-400 text-lg">
                  <component :is="getActivityIcon(activity.type)" />
                </el-icon>
                <div class="flex-1">
                  <p class="text-gray-200">{{ activity.content }}</p>
                  <p class="text-sm text-gray-500 mt-1">{{ formatTime(activity.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <EditProfileDialog
      v-model="showEditDialog"
      :user="userProfile"
      @updated="handleProfileUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import { UserProfile, Post, User } from '@/types/community'
import { Character } from '@/types/character'
import PostCard from '@/components/community/PostCard.vue'
import CharacterCard from '@/components/character/CharacterCard.vue'
import EditProfileDialog from '@/components/community/EditProfileDialog.vue'
import {
  Loading,
  CircleCheck,
  Location,
  Link,
  Calendar,
  Edit,
  Setting,
  Plus,
  Check,
  ChatDotRound,
  More,
  Share,
  CircleClose,
  Flag,
  Document,
  Avatar,
  Clock,
  DocumentEmpty,
  ChatLineRound,
  Heart
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const loading = ref(false)
const followLoading = ref(false)
const userProfile = ref<UserProfile | null>(null)
const currentTab = ref('posts')
const showEditDialog = ref(false)

// 动态相关
const loadingPosts = ref(false)
const loadingMorePosts = ref(false)
const posts = ref<Post[]>([])
const hasMorePosts = ref(true)
const postsPage = ref(1)

// 角色相关
const loadingCharacters = ref(false)
const loadingMoreCharacters = ref(false)
const characters = ref<Character[]>([])
const hasMoreCharacters = ref(true)
const charactersPage = ref(1)

// 活动相关
const loadingActivity = ref(false)
const activities = ref<any[]>([])

// 计算属性
const userId = computed(() => route.params.userId as string)

const isOwnProfile = computed(() =>
  userStore.user?.id === userId.value
)

const isOnline = computed(() => {
  // 这里可以实现在线状态检测
  return Math.random() > 0.5
})

const isVip = computed(() => {
  // 这里可以检查用户VIP状态
  return userProfile.value?.followerCount && userProfile.value.followerCount > 1000
})

const characterCount = computed(() => {
  return userProfile.value?.characters?.length || 0
})

// 标签配置
const tabs = [
  { key: 'posts', label: '动态', icon: Document },
  { key: 'characters', label: '角色', icon: Avatar },
  { key: 'activity', label: '活动', icon: Clock }
]

// 方法
const loadUserProfile = async () => {
  try {
    loading.value = true

    const response = await communityStore.getUserProfile(userId.value)

    if (response.success && response.data) {
      userProfile.value = response.data
    } else {
      throw new Error(response.error || '加载用户信息失败')
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '加载用户信息失败')
  } finally {
    loading.value = false
  }
}

const loadPosts = async (reset: boolean = false) => {
  try {
    if (reset) {
      loadingPosts.value = true
      postsPage.value = 1
      posts.value = []
    } else {
      loadingMorePosts.value = true
    }

    const response = await communityStore.getPosts({
      userId: userId.value,
      page: postsPage.value,
      pageSize: 10
    })

    if (response.success && response.data) {
      if (reset) {
        posts.value = response.data.data
      } else {
        posts.value.push(...response.data.data)
      }

      hasMorePosts.value = response.data.hasMore

      if (response.data.hasMore) {
        postsPage.value++
      }
    }
  } catch (error) {
    console.error('加载动态失败:', error)
    ElMessage.error('加载动态失败')
  } finally {
    loadingPosts.value = false
    loadingMorePosts.value = false
  }
}

const loadMorePosts = () => {
  if (!loadingMorePosts.value && hasMorePosts.value) {
    loadPosts(false)
  }
}

const loadCharacters = async (reset: boolean = false) => {
  try {
    if (reset) {
      loadingCharacters.value = true
      charactersPage.value = 1
      characters.value = []
    } else {
      loadingMoreCharacters.value = true
    }

    // 这里应该调用角色API
    // const response = await characterStore.getCharacters({
    //   userId: userId.value,
    //   page: charactersPage.value,
    //   pageSize: 12
    // })

    // 临时使用用户资料中的角色数据
    if (reset && userProfile.value?.characters) {
      characters.value = userProfile.value.characters as any[]
      hasMoreCharacters.value = false
    }
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败')
  } finally {
    loadingCharacters.value = false
    loadingMoreCharacters.value = false
  }
}

const loadMoreCharacters = () => {
  if (!loadingMoreCharacters.value && hasMoreCharacters.value) {
    loadCharacters(false)
  }
}

const loadActivity = async () => {
  try {
    loadingActivity.value = true

    // 这里应该调用活动API
    // 临时使用用户资料中的活动数据
    if (userProfile.value?.recentActivity) {
      activities.value = userProfile.value.recentActivity.map((activity, index) => ({
        id: index,
        ...activity
      }))
    }
  } catch (error) {
    console.error('加载活动失败:', error)
    ElMessage.error('加载活动失败')
  } finally {
    loadingActivity.value = false
  }
}

const formatJoinDate = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      locale: zhCN
    })
  } catch {
    return '很久之前'
  }
}

const formatTime = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN
    })
  } catch {
    return '刚刚'
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'post': return Document
    case 'comment': return ChatLineRound
    case 'like': return Heart
    case 'follow': return Plus
    default: return Clock
  }
}

const toggleFollow = async () => {
  if (!userProfile.value) return

  try {
    followLoading.value = true

    const response = await communityStore.toggleFollowUser(userId.value)

    if (response.success && response.data) {
      userProfile.value.isFollowing = response.data.isFollowing
      userProfile.value.followerCount = response.data.followerCount

      ElMessage.success(response.data.isFollowing ? '关注成功!' : '取消关注成功!')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

const editProfile = () => {
  showEditDialog.value = true
}

const viewSettings = () => {
  router.push('/profile/settings')
}

const sendMessage = () => {
  ElMessage.info('私信功能开发中...')
}

const goToFollowers = () => {
  router.push(`/community/follow/${userId.value}?tab=followers`)
}

const goToFollowing = () => {
  router.push(`/community/follow/${userId.value}?tab=following`)
}

const handleMenuCommand = (command: string) => {
  switch (command) {
    case 'share':
      const userUrl = `${window.location.origin}/community/user/${userId.value}`
      navigator.clipboard.writeText(userUrl).then(() => {
        ElMessage.success('用户链接已复制到剪贴板')
      }).catch(() => {
        ElMessage.error('复制失败')
      })
      break

    case 'block':
      ElMessage.info('拉黑功能开发中...')
      break

    case 'report':
      ElMessage.info('举报功能开发中...')
      break
  }
}

const handleProfileUpdated = (updatedUser: User) => {
  if (userProfile.value) {
    Object.assign(userProfile.value, updatedUser)
  }
  ElMessage.success('资料更新成功!')
}

// 动态操作处理
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

const goToCharacterDetail = (character: Character) => {
  router.push(`/characters/${character.id}`)
}

// 监听标签切换
watch(currentTab, (newTab) => {
  switch (newTab) {
    case 'posts':
      if (posts.value.length === 0) {
        loadPosts(true)
      }
      break
    case 'characters':
      if (characters.value.length === 0) {
        loadCharacters(true)
      }
      break
    case 'activity':
      if (activities.value.length === 0) {
        loadActivity()
      }
      break
  }
})

// 监听用户ID变化
watch(userId, () => {
  loadUserProfile()
  // 重置所有数据
  posts.value = []
  characters.value = []
  activities.value = []
  currentTab.value = 'posts'
})

// 生命周期
onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.glass-card {
  @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-xl;
}

/* 按钮悬停效果 */
button:hover {
  transform: translateY(-1px);
}

/* 统计数据悬停效果 */
.text-center:hover {
  transform: scale(1.05);
}
</style>
