<template>
  <div class="realtime-status">
    <!-- AI思考指示器 -->
    <div
      v-if="aiThinking"
      class="ai-thinking-indicator"
      :class="{ 'mobile': mobile }"
    >
      <div class="thinking-content">
        <el-avatar
          :src="character?.avatar"
          :size="mobile ? 32 : 40"
          class="character-avatar"
        />

        <div class="thinking-animation">
          <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div class="thinking-text">
            <el-text size="small" type="info">
              {{ thinkingText }}
            </el-text>
          </div>
        </div>

        <!-- 取消按钮 -->
        <el-button
          v-if="showCancel"
          @click="$emit('cancel')"
          type="text"
          size="small"
          :icon="Close"
          class="cancel-btn"
        />
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress" class="thinking-progress">
        <el-progress
          :percentage="progress"
          :stroke-width="2"
          :show-text="false"
          color="#6366f1"
        />
      </div>
    </div>

    <!-- 打字效果 -->
    <div
      v-if="typing && !aiThinking"
      class="typing-indicator"
      :class="{ 'mobile': mobile }"
    >
      <el-avatar
        :src="character?.avatar"
        :size="mobile ? 32 : 40"
        class="character-avatar"
      />

      <div class="typing-bubble">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- 连接状态指示器 -->
    <div
      v-if="showConnectionStatus"
      class="connection-status"
      :class="connectionStatusClass"
    >
      <el-icon class="status-icon">
        <component :is="connectionIcon" />
      </el-icon>
      <el-text size="small">{{ connectionText }}</el-text>
    </div>

    <!-- 消息状态指示器 -->
    <transition-group
      name="message-status"
      tag="div"
      class="message-status-container"
    >
      <div
        v-for="status in messageStatuses"
        :key="status.id"
        class="message-status"
        :class="status.type"
      >
        <el-icon class="status-icon">
          <component :is="status.icon" />
        </el-icon>
        <el-text size="small">{{ status.text }}</el-text>
      </div>
    </transition-group>

    <!-- 语音识别状态 -->
    <div
      v-if="voiceRecording"
      class="voice-recording"
    >
      <div class="voice-animation">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
      </div>
      <el-text size="small" type="primary">
        正在录音...
      </el-text>
      <el-button
        @click="$emit('stop-voice')"
        type="danger"
        size="small"
        round
      >
        停止
      </el-button>
    </div>

    <!-- 通知横幅 -->
    <transition name="banner">
      <div
        v-if="notification"
        class="notification-banner"
        :class="notification.type"
      >
        <el-icon class="notification-icon">
          <component :is="notification.icon" />
        </el-icon>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <el-button
          @click="dismissNotification"
          type="text"
          size="small"
          :icon="Close"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Close
} from '@element-plus/icons-vue'

interface Character {
  id: string
  name: string
  avatar?: string
}

interface MessageStatus {
  id: string
  type: 'sending' | 'sent' | 'failed' | 'retry'
  icon: string
  text: string
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  icon: string
  duration?: number
}

interface Props {
  character?: Character
  aiThinking?: boolean
  typing?: boolean
  voiceRecording?: boolean
  connectionStatus?: 'connected' | 'connecting' | 'disconnected'
  mobile?: boolean
  showCancel?: boolean
  showProgress?: boolean
  progress?: number
}

interface Emits {
  (e: 'cancel'): void
  (e: 'stop-voice'): void
}

const props = withDefaults(defineProps<Props>(), {
  aiThinking: false,
  typing: false,
  voiceRecording: false,
  connectionStatus: 'connected',
  mobile: false,
  showCancel: true,
  showProgress: false,
  progress: 0
})

defineEmits<Emits>()

// 响应式数据
const messageStatuses = ref<MessageStatus[]>([])
const notification = ref<Notification | null>(null)

// 思考文本轮换
const thinkingTexts = [
  '正在思考...',
  '分析中...',
  '组织语言...',
  '准备回复...'
]
const currentThinkingIndex = ref(0)
const thinkingText = computed(() => thinkingTexts[currentThinkingIndex.value])

// 连接状态
const showConnectionStatus = computed(() => props.connectionStatus !== 'connected')

const connectionStatusClass = computed(() => ({
  'connected': props.connectionStatus === 'connected',
  'connecting': props.connectionStatus === 'connecting',
  'disconnected': props.connectionStatus === 'disconnected'
}))

const connectionIcon = computed(() => {
  switch (props.connectionStatus) {
    case 'connected': return 'Wifi'
    case 'connecting': return 'Loading'
    case 'disconnected': return 'WifiOff'
    default: return 'Wifi'
  }
})

const connectionText = computed(() => {
  switch (props.connectionStatus) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'disconnected': return '连接断开'
    default: return '已连接'
  }
})

// 方法
const addMessageStatus = (status: Omit<MessageStatus, 'id'>) => {
  const id = Date.now().toString()
  messageStatuses.value.push({ ...status, id })

  // 自动移除（除了失败状态）
  if (status.type !== 'failed') {
    setTimeout(() => {
      removeMessageStatus(id)
    }, 3000)
  }
}

const removeMessageStatus = (id: string) => {
  const index = messageStatuses.value.findIndex(s => s.id === id)
  if (index > -1) {
    messageStatuses.value.splice(index, 1)
  }
}

const showNotification = (notificationData: Omit<Notification, 'id'>) => {
  const id = Date.now().toString()
  notification.value = { ...notificationData, id }

  if (notificationData.duration !== 0) {
    setTimeout(() => {
      dismissNotification()
    }, notificationData.duration || 5000)
  }
}

const dismissNotification = () => {
  notification.value = null
}

// 思考文本轮换
let thinkingInterval: NodeJS.Timeout
const startThinkingAnimation = () => {
  thinkingInterval = setInterval(() => {
    currentThinkingIndex.value = (currentThinkingIndex.value + 1) % thinkingTexts.length
  }, 2000)
}

const stopThinkingAnimation = () => {
  if (thinkingInterval) {
    clearInterval(thinkingInterval)
  }
}

// 生命周期
onMounted(() => {
  startThinkingAnimation()
})

onUnmounted(() => {
  stopThinkingAnimation()
})

// 暴露方法给父组件
defineExpose({
  addMessageStatus,
  removeMessageStatus,
  showNotification,
  dismissNotification
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.realtime-status {
  position: relative;
}

// AI思考指示器
.ai-thinking-indicator {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin: var(--space-4) 0;

  &.mobile {
    margin: var(--space-2) 0;
    padding: var(--space-3);
  }

  .thinking-content {
    display: flex;
    align-items: center;
    gap: var(--space-3);

    .character-avatar {
      flex-shrink: 0;
    }

    .thinking-animation {
      flex: 1;

      .dots {
        display: flex;
        gap: 4px;
        margin-bottom: var(--space-2);

        .dot {
          width: 8px;
          height: 8px;
          background: var(--tavern-primary);
          border-radius: 50%;
          animation: thinking-bounce 1.4s infinite ease-in-out both;

          &:nth-child(1) { animation-delay: -0.32s; }
          &:nth-child(2) { animation-delay: -0.16s; }
          &:nth-child(3) { animation-delay: 0s; }
        }
      }
    }

    .cancel-btn {
      color: var(--text-muted);

      &:hover {
        color: var(--tavern-danger);
      }
    }
  }

  .thinking-progress {
    margin-top: var(--space-2);
  }
}

// 打字指示器
.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  margin: var(--space-2) 0;

  .typing-bubble {
    background: var(--surface-muted);
    border-radius: var(--radius-lg);
    padding: var(--space-3);

    .typing-dots {
      display: flex;
      gap: 4px;

      span {
        width: 6px;
        height: 6px;
        background: var(--text-secondary);
        border-radius: 50%;
        animation: typing-pulse 1.4s infinite ease-in-out both;

        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
        &:nth-child(3) { animation-delay: 0s; }
      }
    }
  }
}

// 连接状态
.connection-status {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);

  &.connected {
    background: var(--tavern-success);
    color: white;
  }

  &.connecting {
    background: var(--tavern-warning);
    color: white;
  }

  &.disconnected {
    background: var(--tavern-danger);
    color: white;
  }
}

// 消息状态
.message-status-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.message-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);

  &.sending {
    border-left: 3px solid var(--tavern-warning);
  }

  &.sent {
    border-left: 3px solid var(--tavern-success);
  }

  &.failed {
    border-left: 3px solid var(--tavern-danger);
  }

  &.retry {
    border-left: 3px solid var(--tavern-primary);
  }
}

// 语音录音
.voice-recording {
  position: fixed;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, 50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--surface);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);

  .voice-animation {
    display: flex;
    gap: 4px;

    .wave {
      width: 4px;
      height: 20px;
      background: var(--tavern-primary);
      border-radius: 2px;
      animation: voice-wave 1s infinite ease-in-out;

      &:nth-child(1) { animation-delay: -0.4s; }
      &:nth-child(2) { animation-delay: -0.2s; }
      &:nth-child(3) { animation-delay: 0s; }
    }
  }
}

// 通知横幅
.notification-banner {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  max-width: 400px;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);

  &.success {
    border-left: 4px solid var(--tavern-success);
  }

  &.warning {
    border-left: 4px solid var(--tavern-warning);
  }

  &.error {
    border-left: 4px solid var(--tavern-danger);
  }

  &.info {
    border-left: 4px solid var(--tavern-primary);
  }

  .notification-content {
    flex: 1;

    .notification-title {
      font-weight: var(--font-semibold);
      margin-bottom: var(--space-1);
    }

    .notification-message {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
  }
}

// 动画
@keyframes thinking-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes typing-pulse {
  0%, 80%, 100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

@keyframes voice-wave {
  0%, 100% {
    height: 10px;
  }
  50% {
    height: 30px;
  }
}

// 过渡动画
.message-status-enter-active,
.message-status-leave-active {
  transition: all 0.3s ease;
}

.message-status-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.message-status-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

// 响应式适配
@media (max-width: 768px) {
  .connection-status {
    top: 40px;
    padding: var(--space-1) var(--space-3);
  }

  .message-status-container {
    bottom: 10px;
    right: 10px;
  }

  .notification-banner {
    top: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
    transform: none;
  }
}
</style>
