<template>
  <teleport to="body">
    <transition-group name="toast" tag="div" class="notification-toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="notification-toast"
        :class="`notification-toast-${toast.type}`"
        @click="handleToastClick(toast)"
      >
        <div class="toast-icon">
          <el-icon :size="24">
            <InfoFilled v-if="toast.type === 'info'" />
            <SuccessFilled v-else-if="toast.type === 'success'" />
            <WarningFilled v-else-if="toast.type === 'warning'" />
            <CircleCloseFilled v-else-if="toast.type === 'error'" />
          </el-icon>
        </div>
        <div class="toast-content">
          <h4 class="toast-title">{{ toast.title }}</h4>
          <p v-if="toast.description" class="toast-description">{{ toast.description }}</p>
        </div>
        <el-button
          link
          :icon="Close"
          class="toast-close"
          @click.stop="dismissToast(toast.id)"
        />
      </div>
    </transition-group>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  Close,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
} from '@element-plus/icons-vue';
import { useNotificationStore } from '@/stores';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  link?: string;
  duration?: number;
}

const notificationStore = useNotificationStore();
const toasts = ref<Toast[]>([]);
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function addToast(notification: any) {
  const toast: Toast = {
    id: notification.id,
    type: notification.type || 'info',
    title: notification.title,
    description: notification.description,
    link: notification.link,
    duration: notification.duration || 5000,
  };

  toasts.value.push(toast);

  // Auto-dismiss after duration
  if (toast.duration > 0) {
    const timer = setTimeout(() => {
      dismissToast(toast.id);
    }, toast.duration);
    toastTimers.set(toast.id, timer);
  }

  // Limit to 5 toasts maximum
  if (toasts.value.length > 5) {
    const oldestToast = toasts.value[0];
    dismissToast(oldestToast.id);
  }
}

function dismissToast(toastId: string) {
  const timer = toastTimers.get(toastId);
  if (timer) {
    clearTimeout(timer);
    toastTimers.delete(toastId);
  }

  toasts.value = toasts.value.filter((t) => t.id !== toastId);
}

async function handleToastClick(toast: Toast) {
  // Mark as read
  await notificationStore.markAsRead(toast.id);

  // Navigate if link provided
  if (toast.link) {
    window.location.href = toast.link;
  }

  // Dismiss toast
  dismissToast(toast.id);
}

// Listen for new notifications from the store
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  // Subscribe to new notifications
  // This is a simplified example - you may need to implement a proper event system
  const checkForNewNotifications = () => {
    const unread = notificationStore.unreadNotifications;
    unread.forEach((notification) => {
      // Only show urgent or high priority notifications as toasts
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        const existingToast = toasts.value.find((t) => t.id === notification.id);
        if (!existingToast) {
          addToast(notification);
        }
      }
    });
  };

  // Check immediately
  checkForNewNotifications();

  // Poll for new notifications every 10 seconds
  const pollInterval = setInterval(checkForNewNotifications, 10000);

  unsubscribe = () => clearInterval(pollInterval);
});

onBeforeUnmount(() => {
  // Clear all timers
  toastTimers.forEach((timer) => clearTimeout(timer));
  toastTimers.clear();

  if (unsubscribe) {
    unsubscribe();
  }
});

// Expose method for programmatic toast creation
defineExpose({
  addToast,
  dismissToast,
});
</script>

<style scoped>
.notification-toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 350px;
  max-width: calc(100vw - 40px);
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.notification-toast-info {
  border-left: 4px solid #409eff;
}

.notification-toast-success {
  border-left: 4px solid #67c23a;
}

.notification-toast-warning {
  border-left: 4px solid #e6a23c;
}

.notification-toast-error {
  border-left: 4px solid #f56c6c;
}

.toast-icon {
  flex-shrink: 0;
  color: inherit;
}

.notification-toast-info .toast-icon {
  color: #409eff;
}

.notification-toast-success .toast-icon {
  color: #67c23a;
}

.notification-toast-warning .toast-icon {
  color: #e6a23c;
}

.notification-toast-error .toast-icon {
  color: #f56c6c;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.toast-description {
  font-size: 13px;
  color: #606266;
  margin: 0;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  color: #909399;
}

/* Toast transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .notification-toast-container {
    right: 10px;
    left: 10px;
  }

  .notification-toast {
    width: auto;
  }
}
</style>
