<template>
  <transition name="notification-slide">
    <div v-if="modelValue" class="notification-floater">
      <div class="floater-overlay" @click="handleClose"></div>
      <div class="floater-content">
        <!-- 头部 -->
        <div class="floater-header">
          <h3 class="floater-title">通知</h3>
          <div class="header-actions">
            <el-button
              text
              size="small"
              @click="markAllRead"
              :disabled="unreadCount === 0"
            >
              全部已读
            </el-button>
            <el-button
              text
              circle
              @click="handleClose"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 通知列表 -->
        <div class="floater-body">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span class="loading-text">正在加载通知...</span>
          </div>

          <!-- 空状态 -->
          <div v-else-if="notifications.length === 0" class="empty-container">
            <el-icon class="empty-icon"><Bell /></el-icon>
            <p class="empty-text">暂无通知</p>
          </div>

          <!-- 通知项列表 -->
          <div v-else class="notification-list">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              :class="[
                'notification-item',
                { 'notification-item--unread': !notification.isRead }
              ]"
              @click="handleNotificationClick(notification)"
            >
              <!-- 通知图标 -->
              <div class="notification-icon">
                <div :class="[
                  'icon-wrapper',
                  getNotificationIconClass(notification.type)
                ]">
                  <el-icon>
                    <component :is="getNotificationIcon(notification.type)" />
                  </el-icon>
                </div>
              </div>

              <!-- 通知内容 -->
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.content }}</div>
                <div class="notification-meta">
                  <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                  <span v-if="!notification.isRead" class="unread-dot"></span>
                </div>
              </div>

              <!-- 用户头像（如果有） -->
              <div v-if="notification.fromUser" class="notification-avatar">
                <el-avatar :size="32" :src="notification.fromUser.avatar">
                  {{ notification.fromUser.username.charAt(0).toUpperCase() }}
                </el-avatar>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="floater-footer">
          <router-link to="/community/notifications" @click="handleClose">
            <el-button type="primary" class="view-all-btn">
              查看全部通知
            </el-button>
          </router-link>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/community'
import { Notification } from '@/types/community'
import {
  Close,
  Loading,
  Bell,
  Heart,
  ChatLineRound,
  User,
  At,
  Setting
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  modelValue: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  close: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const communityStore = useCommunityStore()

// 响应式数据
const loading = ref(false)
const notifications = ref<Notification[]>([])

// 计算属性
const unreadCount = computed(() =>
  notifications.value.filter(n => !n.isRead).length
)

// 方法
const loadNotifications = async () => {
  try {
    loading.value = true

    const response = await communityStore.getNotifications(1, 10, false)

    if (response.success && response.data) {
      notifications.value = response.data.data
    }
  } catch (error) {
    console.error('加载通知失败:', error)
    ElMessage.error('加载通知失败')
  } finally {
    loading.value = false
  }
}

const markAllRead = async () => {
  try {
    const response = await communityStore.markAllNotificationsRead()

    if (response.success) {
      notifications.value.forEach(n => {
        n.isRead = true
      })
      ElMessage.success('已标记全部为已读')
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleNotificationClick = async (notification: Notification) => {
  // 标记为已读
  if (!notification.isRead) {
    try {
      await communityStore.markNotificationRead(notification.id)
      notification.isRead = true
    } catch (error) {
      console.error('标记已读失败:', error)
    }
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

  handleClose()
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return Heart
    case 'comment': return ChatLineRound
    case 'follow': return User
    case 'mention': return At
    case 'system': return Setting
    default: return Bell
  }
}

const getNotificationIconClass = (type: string) => {
  switch (type) {
    case 'like': return 'icon-like'
    case 'comment': return 'icon-comment'
    case 'follow': return 'icon-follow'
    case 'mention': return 'icon-mention'
    case 'system': return 'icon-system'
    default: return 'icon-default'
  }
}

// 监听显示状态变化
watch(() => props.modelValue, (show) => {
  if (show) {
    loadNotifications()
  }
})

// 生命周期
onMounted(() => {
  if (props.modelValue) {
    loadNotifications()
  }
})
</script>

<style scoped>
.notification-floater {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 80px 20px 20px;
}

.floater-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.floater-content {
  position: relative;
  width: 400px;
  max-height: calc(100vh - 100px);
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.floater-header {
  padding: 20px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.floater-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.floater-body {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.loading-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.loading-text,
.empty-text {
  font-size: 14px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.notification-item--unread {
  background: rgba(139, 92, 246, 0.05);
  border-left: 3px solid #8b5cf6;
}

.notification-icon {
  flex-shrink: 0;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.icon-like {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.icon-comment {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.icon-follow {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.icon-mention {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.icon-system {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.icon-default {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.4;
  margin-bottom: 8px;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-time {
  font-size: 12px;
  color: #6b7280;
}

.unread-dot {
  width: 6px;
  height: 6px;
  background: #8b5cf6;
  border-radius: 50%;
}

.notification-avatar {
  flex-shrink: 0;
}

.floater-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.view-all-btn {
  width: 100%;
}

/* 动画 */
.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 滚动条样式 */
.floater-body::-webkit-scrollbar {
  width: 6px;
}

.floater-body::-webkit-scrollbar-track {
  background: rgba(75, 85, 99, 0.2);
  border-radius: 3px;
}

.floater-body::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

.floater-body::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-floater {
    padding: 60px 10px 10px;
  }

  .floater-content {
    width: 100%;
    max-width: 100%;
  }
}
</style>
