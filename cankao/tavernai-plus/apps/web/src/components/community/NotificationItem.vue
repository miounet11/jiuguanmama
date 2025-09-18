<template>
  <div
    :class="[
      'notification-item p-4 rounded-lg border cursor-pointer transition-all duration-200',
      notification.isRead
        ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-700/30'
        : 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20'
    ]"
    @click="handleClick"
  >
    <div class="flex items-start space-x-3">
      <!-- 通知图标 -->
      <div :class="[
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        getNotificationStyle()
      ]">
        <el-icon :size="20">
          <component :is="getNotificationIcon()" />
        </el-icon>
      </div>

      <!-- 通知内容 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- 通知标题 -->
            <h4 class="font-medium text-white mb-1">{{ notification.title }}</h4>

            <!-- 通知内容 -->
            <p class="text-gray-300 text-sm mb-2">{{ notification.content }}</p>

            <!-- 用户信息 (如果有) -->
            <div v-if="notification.fromUser" class="flex items-center space-x-2 mb-2">
              <el-avatar :size="24" :src="notification.fromUser.avatar">
                {{ notification.fromUser.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="text-sm text-gray-400">{{ notification.fromUser.username }}</span>
            </div>

            <!-- 相关内容预览 -->
            <div v-if="notification.relatedPost" class="bg-gray-700/30 rounded-lg p-3 mb-2">
              <p class="text-sm text-gray-300 line-clamp-2">{{ notification.relatedPost.content }}</p>
            </div>

            <!-- 时间和操作 -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ formatTime(notification.createdAt) }}</span>
              <div class="flex items-center space-x-2">
                <!-- 已读/未读状态 -->
                <span v-if="!notification.isRead" class="w-2 h-2 bg-purple-400 rounded-full"></span>

                <!-- 操作按钮 -->
                <el-dropdown @command="handleMenuCommand" placement="bottom-end" @click.stop>
                  <el-button text size="small">
                    <el-icon class="text-gray-400"><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="!notification.isRead" command="mark-read">
                        <el-icon><Check /></el-icon>
                        标记已读
                      </el-dropdown-item>
                      <el-dropdown-item v-else command="mark-unread">
                        <el-icon><CircleDot /></el-icon>
                        标记未读
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" class="text-red-500" divided>
                        <el-icon><Delete /></el-icon>
                        删除通知
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Notification } from '@/types/community'
import {
  Heart,
  ChatLineRound,
  User,
  At,
  Bell,
  Setting,
  More,
  Check,
  CircleDot,
  Delete
} from '@element-plus/icons-vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  notification: Notification
}

interface Emits {
  click: [notification: Notification]
  'mark-read': [notificationId: string]
  delete: [notificationId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const getNotificationIcon = () => {
  switch (props.notification.type) {
    case 'like': return Heart
    case 'comment': return ChatLineRound
    case 'follow': return User
    case 'mention': return At
    case 'system': return Setting
    default: return Bell
  }
}

const getNotificationStyle = () => {
  switch (props.notification.type) {
    case 'like': return 'bg-red-500/20 text-red-400'
    case 'comment': return 'bg-blue-500/20 text-blue-400'
    case 'follow': return 'bg-green-500/20 text-green-400'
    case 'mention': return 'bg-purple-500/20 text-purple-400'
    case 'system': return 'bg-gray-500/20 text-gray-400'
    default: return 'bg-purple-500/20 text-purple-400'
  }
}

// 方法
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

const handleClick = () => {
  emit('click', props.notification)
}

const handleMenuCommand = (command: string) => {
  switch (command) {
    case 'mark-read':
    case 'mark-unread':
      emit('mark-read', props.notification.id)
      break
    case 'delete':
      emit('delete', props.notification.id)
      break
  }
}
</script>

<style scoped>
.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 未读通知的发光效果 */
.notification-item:not(.bg-gray-800\/30) {
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
}

/* 按钮悬停效果 */
.el-button:hover {
  transform: scale(1.1);
}
</style>
