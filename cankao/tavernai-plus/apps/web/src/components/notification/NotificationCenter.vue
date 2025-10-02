<template>
  <div class="notification-center">
    <el-dropdown trigger="click" @visible-change="handleDropdownChange">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <el-button :icon="Bell" circle />
      </el-badge>
      <template #dropdown>
        <el-dropdown-menu class="notification-dropdown">
          <!-- Header -->
          <div class="notification-header">
            <h3>通知</h3>
            <el-button
              v-if="unreadCount > 0"
              link
              type="primary"
              size="small"
              @click="markAllAsRead"
            >
              全部标为已读
            </el-button>
          </div>

          <!-- Filters -->
          <div class="notification-filters">
            <el-radio-group v-model="activeFilter" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="unread">未读</el-radio-button>
              <el-radio-button label="urgent">紧急</el-radio-button>
            </el-radio-group>
          </div>

          <!-- Notification List -->
          <div class="notification-list">
            <div
              v-if="filteredNotifications.length === 0"
              class="notification-empty"
            >
              <el-icon :size="48" color="#C0C4CC"><BellFilled /></el-icon>
              <p>暂无通知</p>
            </div>

            <div
              v-for="notification in filteredNotifications"
              :key="notification.id"
              class="notification-item"
              :class="{
                'notification-unread': !notification.read,
                [`notification-${notification.priority}`]: true,
              }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon">
                <el-icon :size="20">
                  <InfoFilled v-if="notification.type === 'info'" />
                  <SuccessFilled v-else-if="notification.type === 'success'" />
                  <WarningFilled v-else-if="notification.type === 'warning'" />
                  <CircleCloseFilled v-else-if="notification.type === 'error'" />
                  <Bell v-else />
                </el-icon>
              </div>
              <div class="notification-content">
                <h4 class="notification-title">{{ notification.title }}</h4>
                <p class="notification-description">{{ notification.description }}</p>
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              <el-button
                link
                :icon="Delete"
                class="notification-delete"
                @click.stop="archiveNotification(notification.id)"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="notification-footer">
            <el-button link @click="viewAllNotifications">
              查看全部通知
            </el-button>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Bell,
  BellFilled,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  Delete,
} from '@element-plus/icons-vue';
import { useNotificationStore } from '@/stores';
import { ElMessage } from 'element-plus';

const notificationStore = useNotificationStore();

const activeFilter = ref<'all' | 'unread' | 'urgent'>('all');

const unreadCount = computed(() => notificationStore.unreadCount);

const filteredNotifications = computed(() => {
  const notifications = notificationStore.notifications;

  switch (activeFilter.value) {
    case 'unread':
      return notifications.filter((n) => !n.read).slice(0, 10);
    case 'urgent':
      return notifications.filter((n) => n.priority === 'urgent').slice(0, 10);
    default:
      return notifications.slice(0, 10);
  }
});

function formatTime(date: Date | string): string {
  const now = new Date();
  const notifDate = new Date(date);
  const diffMs = now.getTime() - notifDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return notifDate.toLocaleDateString('zh-CN');
}

async function handleNotificationClick(notification: any) {
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id);
  }

  // Handle notification action if link is provided
  if (notification.link) {
    window.location.href = notification.link;
  }
}

async function markAllAsRead() {
  const success = await notificationStore.markAllAsRead();
  if (success) {
    ElMessage.success('所有通知已标记为已读');
  }
}

async function archiveNotification(notificationId: string) {
  const success = await notificationStore.archiveNotification(notificationId);
  if (success) {
    ElMessage.success('通知已归档');
  }
}

function viewAllNotifications() {
  // Navigate to full notifications page
  window.location.href = '/notifications';
}

function handleDropdownChange(visible: boolean) {
  if (visible) {
    // Fetch latest notifications when dropdown opens
    notificationStore.fetchNotifications({ limit: 20 });
  }
}

onMounted(() => {
  // Fetch notifications on mount
  notificationStore.fetchNotifications({ limit: 20 });

  // Poll for new notifications every 30 seconds
  const pollInterval = setInterval(() => {
    notificationStore.fetchUnreadCount();
  }, 30000);

  // Cleanup on unmount
  return () => clearInterval(pollInterval);
});
</script>

<style scoped>
.notification-center {
  position: relative;
}

.notification-dropdown {
  width: 400px;
  max-width: 90vw;
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.notification-filters {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.notification-empty p {
  margin-top: 8px;
  font-size: 14px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f4f4f5;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f4f4f5;
}

.notification-unread {
  background: #ecf5ff;
}

.notification-unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: #409eff;
  border-radius: 0 2px 2px 0;
}

.notification-urgent {
  border-left: 3px solid #f56c6c;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f4f4f5;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.notification-description {
  font-size: 13px;
  color: #606266;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-delete {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-delete {
  opacity: 1;
}

.notification-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>
