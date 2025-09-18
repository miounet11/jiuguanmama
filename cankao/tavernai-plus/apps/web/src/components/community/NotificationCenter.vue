<template>
  <div class="notification-center">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-white">通知中心</h2>
      <div class="flex items-center space-x-3">
        <el-button
          v-if="unreadCount > 0"
          size="small"
          @click="markAllRead"
          :loading="markingAllRead"
        >
          全部已读
        </el-button>
        <el-button size="small" @click="refreshNotifications" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="filter in filterOptions"
        :key="filter.value"
        @click="currentFilter = filter.value"
        :class="[
          'px-4 py-2 rounded-lg text-sm transition-all duration-200',
          currentFilter === filter.value
            ? 'bg-purple-600 text-white'
            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
        ]"
      >
        <el-icon class="mr-1">
          <component :is="filter.icon" />
        </el-icon>
        {{ filter.label }}
        <span v-if="filter.count > 0" class="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {{ filter.count }}
        </span>
      </button>
    </div>

    <!-- 通知列表 -->
    <div class="notification-list">
      <!-- 加载状态 -->
      <div v-if="loading && notifications.length === 0" class="text-center py-12">
        <el-icon class="text-4xl text-purple-400 animate-spin"><Loading /></el-icon>
        <p class="text-gray-400 mt-4">正在加载通知...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && notifications.length === 0" class="text-center py-12">
        <el-icon class="text-6xl text-gray-500 mb-4"><Bell /></el-icon>
        <p class="text-gray-400 text-lg">暂无通知</p>
        <p class="text-gray-500 text-sm mt-2">{{ emptyStateText }}</p>
      </div>

      <!-- 通知项 -->
      <div v-else class="space-y-3">
        <NotificationItem
          v-for="notification in notifications"
          :key="notification.id"
          :notification="notification"
          @click="handleNotificationClick"
          @mark-read="handleMarkRead"
          @delete="handleDeleteNotification"
        />

        <!-- 加载更多 -->
        <div v-if="hasMore" class="text-center py-4">
          <el-button @click="loadMoreNotifications" :loading="loadingMore">
            加载更多通知
          </el-button>
        </div>

        <!-- 无限滚动触发器 -->
        <div ref="loadMoreTrigger" class="h-4"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/community'
import { Notification } from '@/types/community'
import NotificationItem from './NotificationItem.vue'
import {
  Bell,
  Heart,
  ChatLineRound,
  User,
  At,
  Setting,
  Refresh,
  Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const communityStore = useCommunityStore()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const markingAllRead = ref(false)
const notifications = ref<Notification[]>([])
const currentFilter = ref<string>('all')
const currentPage = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

// 统计数据
const stats = reactive({
  all: 0,
  like: 0,
  comment: 0,
  follow: 0,
  mention: 0,
  system: 0
})

// 无限滚动
const loadMoreTrigger = ref<HTMLElement>()
const observer = ref<IntersectionObserver>()

// 筛选选项
const filterOptions = computed(() => [
  { value: 'all', label: '全部', icon: Bell, count: stats.all },
  { value: 'like', label: '点赞', icon: Heart, count: stats.like },
  { value: 'comment', label: '评论', icon: ChatLineRound, count: stats.comment },
  { value: 'follow', label: '关注', icon: User, count: stats.follow },
  { value: 'mention', label: '提及', icon: At, count: stats.mention },
  { value: 'system', label: '系统', icon: Setting, count: stats.system }
])

// 计算未读通知数量
const unreadCount = computed(() =>
  notifications.value.filter(n => !n.isRead).length
)

// 空状态文本
const emptyStateText = computed(() => {
  switch (currentFilter.value) {
    case 'like': return '还没有收到点赞通知'
    case 'comment': return '还没有收到评论通知'
    case 'follow': return '还没有收到关注通知'
    case 'mention': return '还没有收到提及通知'
    case 'system': return '还没有收到系统通知'
    default: return '还没有收到任何通知'
  }
})

// 方法
const loadNotifications = async (reset: boolean = false) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
      notifications.value = []
    } else {
      loadingMore.value = true
    }

    const response = await communityStore.getNotifications(
      currentPage.value,
      pageSize.value,
      false // 不仅获取未读通知
    )

    if (response.success && response.data) {
      let filteredNotifications = response.data.data

      // 根据当前筛选条件过滤通知
      if (currentFilter.value !== 'all') {
        filteredNotifications = filteredNotifications.filter(
          n => n.type === currentFilter.value
        )
      }

      if (reset) {
        notifications.value = filteredNotifications
      } else {
        notifications.value.push(...filteredNotifications)
      }

      hasMore.value = response.data.hasMore

      if (response.data.hasMore) {
        currentPage.value++
      }

      // 更新统计数据
      updateStats(response.data.data)
    } else {
      throw new Error(response.error || '加载通知失败')
    }
  } catch (error) {
    console.error('加载通知失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '加载通知失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreNotifications = () => {
  if (!loadingMore.value && hasMore.value) {
    loadNotifications(false)
  }
}

const refreshNotifications = () => {
  loadNotifications(true)
}

const updateStats = (allNotifications: Notification[]) => {
  stats.all = allNotifications.length
  stats.like = allNotifications.filter(n => n.type === 'like').length
  stats.comment = allNotifications.filter(n => n.type === 'comment').length
  stats.follow = allNotifications.filter(n => n.type === 'follow').length
  stats.mention = allNotifications.filter(n => n.type === 'mention').length
  stats.system = allNotifications.filter(n => n.type === 'system').length
}

const handleNotificationClick = async (notification: Notification) => {
  // 标记为已读
  if (!notification.isRead) {
    await handleMarkRead(notification.id)
  }

  // 跳转到相关页面
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
  } else {
    // 根据通知类型生成跳转链接
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.relatedPostId) {
          router.push(`/community/post/${notification.relatedPostId}`)
        }
        break
      case 'follow':
        if (notification.fromUserId) {
          router.push(`/community/user/${notification.fromUserId}`)
        }
        break
      case 'mention':
        if (notification.relatedPostId) {
          router.push(`/community/post/${notification.relatedPostId}`)
        }
        break
    }
  }
}

const handleMarkRead = async (notificationId: string) => {
  try {
    const response = await communityStore.markNotificationRead(notificationId)

    if (response.success) {
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('操作失败')
  }
}

const markAllRead = async () => {
  try {
    markingAllRead.value = true

    const response = await communityStore.markAllNotificationsRead()

    if (response.success) {
      notifications.value.forEach(n => {
        n.isRead = true
      })
      ElMessage.success('已标记全部通知为已读')
    }
  } catch (error) {
    console.error('标记全部已读失败:', error)
    ElMessage.error('操作失败')
  } finally {
    markingAllRead.value = false
  }
}

const handleDeleteNotification = async (notificationId: string) => {
  try {
    // 这里应该调用删除通知的API
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
    ElMessage.success('通知已删除')
  } catch (error) {
    console.error('删除通知失败:', error)
    ElMessage.error('删除失败')
  }
}

const setupInfiniteScroll = () => {
  if (!loadMoreTrigger.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loadingMore.value) {
        loadMoreNotifications()
      }
    },
    { threshold: 0.1 }
  )

  observer.value.observe(loadMoreTrigger.value)
}

// 监听筛选条件变化
watch(currentFilter, () => {
  loadNotifications(true)
})

// 生命周期
onMounted(() => {
  loadNotifications(true)

  nextTick(() => {
    setupInfiniteScroll()
  })
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})

// 暴露方法给父组件
defineExpose({
  refresh: refreshNotifications,
  markAllRead
})
</script>

<style scoped>
.notification-center {
  @apply max-w-2xl mx-auto;
}

.notification-list {
  @apply min-h-96;
}

/* 滚动条样式 */
.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: rgba(75, 85, 99, 0.2);
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}
</style>
