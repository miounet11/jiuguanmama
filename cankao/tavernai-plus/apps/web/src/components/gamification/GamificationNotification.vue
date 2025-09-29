<template>
  <div class="gamification-notification" :class="notificationClass">
    <!-- 图标 -->
    <div class="notification-icon">
      <el-icon :size="24">
        <component :is="notificationIcon" />
      </el-icon>
    </div>

    <!-- 内容 -->
    <div class="notification-content">
      <div class="notification-header">
        <h4 class="notification-title">{{ notification.title }}</h4>
        <el-button
          text
          size="small"
          @click="$emit('dismiss')"
          class="dismiss-button"
        >
          <el-icon size="14">
            <Close />
          </el-icon>
        </el-button>
      </div>

      <p class="notification-message">{{ notification.message }}</p>

      <!-- 额外数据展示 -->
      <div v-if="notification.data" class="notification-data">
        <template v-if="notification.type === 'affinity_update'">
          <span class="data-highlight">+{{ notification.data.points }} 亲密度</span>
        </template>

        <template v-if="notification.type === 'level_up'">
          <span class="data-highlight">等级提升！</span>
        </template>

        <template v-if="notification.type === 'scenario_progress'">
          <span class="data-highlight">剧本进度更新</span>
        </template>
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="showProgress" class="notification-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ animationDuration: `${autoHideDelay}ms` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Star,
  Trophy,
  Gift,
  Check,
  Close,
  Fire,
  Heart,
  Document
} from '@element-plus/icons-vue'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: Date
  data?: any
}

interface Props {
  notification: Notification
  autoHideDelay?: number
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoHideDelay: 5000,
  showProgress: true
})

const emit = defineEmits<{
  dismiss: []
}>()

// 计算属性
const notificationClass = computed(() => {
  const classes = ['gamification-notification']

  switch (props.notification.type) {
    case 'affinity_update':
      classes.push('type-affinity')
      break
    case 'level_up':
      classes.push('type-level-up')
      break
    case 'achievement_unlock':
      classes.push('type-achievement')
      break
    case 'scenario_progress':
      classes.push('type-scenario')
      break
    case 'quest_complete':
      classes.push('type-quest')
      break
    default:
      classes.push('type-default')
  }

  return classes
})

const notificationIcon = computed(() => {
  switch (props.notification.type) {
    case 'affinity_update':
      return Heart
    case 'level_up':
      return Star
    case 'achievement_unlock':
      return Trophy
    case 'scenario_progress':
      return Document
    case 'quest_complete':
      return Gift
    default:
      return Check
  }
})
</script>

<style scoped lang="scss">
.gamification-notification {
  background: var(--surface-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
  display: flex;
  gap: var(--space-3);
  min-width: 320px;
  max-width: 400px;
  position: relative;
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;

  // 类型特定样式
  &.type-affinity {
    border-color: rgba(239, 68, 68, 0.3);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--surface-2));

    .notification-icon {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
  }

  &.type-level-up {
    border-color: rgba(245, 158, 11, 0.3);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--surface-2));

    .notification-icon {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }
  }

  &.type-achievement {
    border-color: rgba(16, 185, 129, 0.3);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--surface-2));

    .notification-icon {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }
  }

  &.type-scenario {
    border-color: rgba(139, 92, 246, 0.3);
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), var(--surface-2));

    .notification-icon {
      background: rgba(139, 92, 246, 0.2);
      color: #8b5cf6;
    }
  }

  &.type-quest {
    border-color: rgba(168, 85, 247, 0.3);
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), var(--surface-2));

    .notification-icon {
      background: rgba(168, 85, 247, 0.2);
      color: #a855f7;
    }
  }
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid currentColor;
}

.notification-content {
  flex: 1;
  min-width: 0;

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-1);

    .notification-title {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      flex: 1;
      margin-right: var(--space-2);
    }

    .dismiss-button {
      color: var(--text-tertiary);
      flex-shrink: 0;

      &:hover {
        color: var(--text-primary);
      }
    }
  }

  .notification-message {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-snug);
  }

  .notification-data {
    .data-highlight {
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
      color: var(--brand-primary-500);
      background: rgba(139, 92, 246, 0.1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      display: inline-block;
    }
  }
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--surface-3);

  .progress-bar {
    height: 100%;
    background: currentColor;
    animation: progressShrink linear forwards;
    transform-origin: left;
  }
}

// 动画
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes progressShrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .gamification-notification {
    min-width: 280px;
    max-width: 340px;
    padding: var(--space-3);

    .notification-icon {
      width: 36px;
      height: 36px;
    }

    .notification-content {
      .notification-header {
        .notification-title {
          font-size: var(--text-xs);
        }
      }

      .notification-message {
        font-size: var(--text-xs);
      }
    }
  }
}

// 暗色主题
.dark {
  .gamification-notification {
    background: var(--surface-1);
    border-color: var(--border-color);
  }
}
</style>
