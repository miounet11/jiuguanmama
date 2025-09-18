<template>
  <div
    class="user-card glass-card p-6 cursor-pointer hover:scale-105 transition-all duration-300"
    @click="handleClick"
  >
    <!-- 用户头像和基本信息 -->
    <div class="text-center mb-4">
      <el-avatar :size="64" :src="user.avatar" class="mb-3">
        {{ user.username.charAt(0).toUpperCase() }}
      </el-avatar>
      <div class="flex items-center justify-center space-x-2 mb-2">
        <h4 class="font-semibold text-white">{{ user.username }}</h4>
        <el-icon v-if="user.isVerified" class="text-yellow-400">
          <CircleCheck />
        </el-icon>
      </div>
      <p v-if="user.bio" class="text-sm text-gray-400 line-clamp-2 mb-3">
        {{ user.bio }}
      </p>
      <div v-if="user.location" class="flex items-center justify-center text-xs text-gray-500 mb-2">
        <el-icon class="mr-1"><Location /></el-icon>
        {{ user.location }}
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="grid grid-cols-3 gap-4 mb-4 text-center">
      <div>
        <div class="text-lg font-semibold text-purple-400">{{ user.postCount || 0 }}</div>
        <div class="text-xs text-gray-500">动态</div>
      </div>
      <div>
        <div class="text-lg font-semibold text-yellow-400">{{ user.followerCount || 0 }}</div>
        <div class="text-xs text-gray-500">粉丝</div>
      </div>
      <div>
        <div class="text-lg font-semibold text-green-400">{{ user.followingCount || 0 }}</div>
        <div class="text-xs text-gray-500">关注</div>
      </div>
    </div>

    <!-- 用户标签 -->
    <div v-if="userTags.length > 0" class="flex flex-wrap gap-1 mb-4 justify-center">
      <span
        v-for="tag in userTags"
        :key="tag"
        class="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
      >
        {{ tag }}
      </span>
    </div>

    <!-- 最近活动 -->
    <div v-if="recentActivity" class="text-center mb-4">
      <div class="text-xs text-gray-500">最近活动</div>
      <div class="text-sm text-gray-400 mt-1">{{ recentActivity }}</div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex space-x-2">
      <!-- 关注按钮 -->
      <el-button
        v-if="showFollowButton && !user.isFollowing"
        type="primary"
        size="small"
        @click.stop="handleFollow"
        :loading="followLoading"
        class="flex-1"
      >
        <el-icon><Plus /></el-icon>
        关注
      </el-button>

      <!-- 取消关注按钮 -->
      <el-button
        v-else-if="showUnfollowButton && user.isFollowing"
        type="info"
        size="small"
        @click.stop="handleUnfollow"
        :loading="followLoading"
        class="flex-1"
      >
        <el-icon><Check /></el-icon>
        已关注
      </el-button>

      <!-- 已关注状态显示 -->
      <el-button
        v-else-if="user.isFollowing"
        type="success"
        size="small"
        disabled
        class="flex-1"
      >
        <el-icon><Check /></el-icon>
        已关注
      </el-button>

      <!-- 查看资料按钮 -->
      <el-button
        size="small"
        @click.stop="handleViewProfile"
        :class="showFollowButton || showUnfollowButton ? 'flex-1' : 'w-full'"
      >
        <el-icon><User /></el-icon>
        {{ showFollowButton || showUnfollowButton ? '资料' : '查看资料' }}
      </el-button>
    </div>

    <!-- 更多操作菜单 -->
    <div v-if="showMoreActions" class="mt-3">
      <el-dropdown @command="handleMenuCommand" placement="bottom-end" class="w-full">
        <el-button size="small" class="w-full">
          <el-icon><More /></el-icon>
          更多
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="message">
              <el-icon><ChatDotRound /></el-icon>
              发送消息
            </el-dropdown-item>
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
    </div>

    <!-- 在线状态指示 -->
    <div v-if="showOnlineStatus && isOnline" class="absolute top-4 right-4">
      <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { User } from '@/types/community'
import { useUserStore } from '@/stores/user'
import {
  CircleCheck,
  Location,
  Plus,
  Check,
  User as UserIcon,
  More,
  ChatDotRound,
  Share,
  CircleClose,
  Flag
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  user: User
  showFollowButton?: boolean
  showUnfollowButton?: boolean
  showMoreActions?: boolean
  showOnlineStatus?: boolean
}

interface Emits {
  follow: [userId: string]
  unfollow: [userId: string]
  click: [user: User]
}

const props = withDefaults(defineProps<Props>(), {
  showFollowButton: false,
  showUnfollowButton: false,
  showMoreActions: false,
  showOnlineStatus: false
})

const emit = defineEmits<Emits>()

const userStore = useUserStore()

// 响应式数据
const followLoading = ref(false)

// 计算属性
const userTags = computed(() => {
  const tags = []

  if (props.user.isVerified) tags.push('认证用户')
  if (props.user.followerCount > 1000) tags.push('知名用户')
  if (props.user.postCount > 100) tags.push('活跃创作者')

  return tags.slice(0, 3) // 最多显示3个标签
})

const recentActivity = computed(() => {
  // 这里可以根据用户的最近活动数据来显示
  // 目前使用加入时间作为示例
  if (props.user.joinDate) {
    try {
      const joinTime = formatDistanceToNow(new Date(props.user.joinDate), {
        addSuffix: true,
        locale: zhCN
      })
      return `${joinTime}加入`
    } catch {
      return '最近活跃'
    }
  }
  return '最近活跃'
})

const isOnline = computed(() => {
  // 这里可以实现在线状态检测逻辑
  // 目前随机返回，实际应该通过WebSocket或其他方式获取
  return Math.random() > 0.7
})

const isCurrentUser = computed(() => {
  return userStore.user?.id === props.user.id
})

// 方法
const handleClick = () => {
  emit('click', props.user)
}

const handleFollow = async () => {
  if (followLoading.value) return

  followLoading.value = true
  try {
    emit('follow', props.user.id)
  } finally {
    followLoading.value = false
  }
}

const handleUnfollow = async () => {
  if (followLoading.value) return

  followLoading.value = true
  try {
    emit('unfollow', props.user.id)
  } finally {
    followLoading.value = false
  }
}

const handleViewProfile = () => {
  emit('click', props.user)
}

const handleMenuCommand = (command: string) => {
  switch (command) {
    case 'message':
      ElMessage.info('私信功能开发中...')
      break

    case 'share':
      // 复制用户链接到剪贴板
      const userUrl = `${window.location.origin}/community/user/${props.user.id}`
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
</script>

<style scoped>
.glass-card {
  @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-xl relative;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 悬停效果 */
.user-card:hover {
  @apply shadow-2xl;
}

.user-card:hover .el-avatar {
  @apply ring-2 ring-purple-400 ring-opacity-50;
}

/* 按钮悬停效果 */
.user-card:hover .el-button {
  transform: translateY(-1px);
}

/* 在线状态动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
