<template>
  <div class="connection-status" :class="statusClasses">
    <div class="status-indicator">
      <div class="status-dot" :class="dotClasses"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <div class="status-details" v-if="showDetails">
      <div class="connection-info">
        <div class="info-item">
          <span class="label">{{ $t('streaming.connectionId') }}</span>
          <span class="value">{{ connectionId || $t('common.none') }}</span>
        </div>
        <div class="info-item" v-if="sessionId">
          <span class="label">{{ $t('streaming.sessionId') }}</span>
          <span class="value">{{ sessionId }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('streaming.connectedAt') }}</span>
          <span class="value">{{ formattedConnectedAt }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('streaming.lastHeartbeat') }}</span>
          <span class="value">{{ formattedLastHeartbeat }}</span>
        </div>
      </div>

      <div class="connection-stats" v-if="stats">
        <div class="stat-item">
          <span class="label">{{ $t('streaming.messagesSent') }}</span>
          <span class="value">{{ stats.messagesSent || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="label">{{ $t('streaming.messagesReceived') }}</span>
          <span class="value">{{ stats.messagesReceived || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="label">{{ $t('streaming.avgResponseTime') }}</span>
          <span class="value">{{ formatDuration(stats.avgResponseTime) }}</span>
        </div>
        <div class="stat-item">
          <span class="label">{{ $t('streaming.uptime') }}</span>
          <span class="value">{{ uptimeText }}</span>
        </div>
      </div>
    </div>

    <div class="status-actions">
      <el-button
        v-if="status === 'disconnected' || status === 'error'"
        type="primary"
        size="small"
        icon="el-icon-refresh"
        @click="handleReconnect"
        :loading="reconnecting"
      >
        {{ $t('streaming.reconnect') }}
      </el-button>

      <el-button
        v-if="status === 'connected'"
        type="danger"
        size="small"
        icon="el-icon-close"
        @click="handleDisconnect"
        :loading="disconnecting"
      >
        {{ $t('streaming.disconnect') }}
      </el-button>

      <el-button
        size="small"
        icon="el-icon-setting"
        @click="showDetails = !showDetails"
        :title="$t('streaming.toggleDetails')"
      />
    </div>

    <!-- Error Details Modal -->
    <el-dialog
      v-model="showErrorDialog"
      :title="$t('streaming.connectionError')"
      width="500px"
      :before-close="handleCloseError"
    >
      <div class="error-details">
        <el-alert
          :title="error?.message || $t('streaming.unknownError')"
          type="error"
          show-icon
          :closable="false"
        />

        <div class="error-info" v-if="error">
          <div class="info-item" v-if="error.code">
            <span class="label">{{ $t('common.errorCode') }}</span>
            <span class="value">{{ error.code }}</span>
          </div>
          <div class="info-item" v-if="error.timestamp">
            <span class="label">{{ $t('common.timestamp') }}</span>
            <span class="value">{{ formatTimestamp(error.timestamp) }}</span>
          </div>
          <div class="info-item" v-if="error.retryCount">
            <span class="label">{{ $t('streaming.retryCount') }}</span>
            <span class="value">{{ error.retryCount }}</span>
          </div>
        </div>

        <div class="error-stack" v-if="error?.stack && showDebugInfo">
          <h4>{{ $t('common.debugInfo') }}</h4>
          <pre><code>{{ error.stack }}</code></pre>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showErrorDialog = false">
            {{ $t('common.close') }}
          </el-button>
          <el-button
            type="primary"
            @click="handleRetry"
            :loading="reconnecting"
          >
            {{ $t('common.retry') }}
          </el-button>
          <el-button
            type="info"
            @click="showDebugInfo = !showDebugInfo"
          >
            {{ $t('common.debugInfo') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Reconnection Progress -->
    <div class="reconnection-progress" v-if="reconnecting && retryCount > 0">
      <div class="progress-info">
        <span>{{ $t('streaming.reconnectingAttempt', { count: retryCount, max: maxRetries }) }}</span>
        <span class="countdown">{{ nextRetryIn }}s</span>
      </div>
      <el-progress
        :percentage="reconnectionProgress"
        :show-text="false"
        :stroke-width="4"
        status="success"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

interface ConnectionError {
  message: string
  code?: string
  timestamp?: Date
  stack?: string
  retryCount?: number
}

interface ConnectionStats {
  messagesSent: number
  messagesReceived: number
  avgResponseTime: number
  bytesTransferred: number
  lastActivity: Date
}

interface Props {
  status: ConnectionStatus
  connectionId?: string
  sessionId?: string
  connectedAt?: Date
  lastHeartbeat?: Date
  error?: ConnectionError
  stats?: ConnectionStats
  autoReconnect?: boolean
  maxRetries?: number
  retryDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoReconnect: true,
  maxRetries: 5,
  retryDelay: 5000
})

const emit = defineEmits<{
  reconnect: []
  disconnect: []
  retry: []
  clearError: []
}>()

const { t } = useI18n()

// Refs
const showDetails = ref(false)
const showErrorDialog = ref(false)
const showDebugInfo = ref(false)
const reconnecting = ref(false)
const disconnecting = ref(false)
const retryCount = ref(0)
const nextRetryIn = ref(0)
const retryTimer = ref<number | null>(null)
const countdownTimer = ref<number | null>(null)
const uptimeTimer = ref<number | null>(null)
const currentUptime = ref(0)

// Computed
const statusClasses = computed(() => ({
  [`status-${props.status}`]: true,
  'has-error': !!props.error,
  'auto-reconnect': props.autoReconnect,
  'details-shown': showDetails.value
}))

const dotClasses = computed(() => ({
  [`dot-${props.status}`]: true,
  'pulse': props.status === 'connecting' || props.status === 'reconnecting'
}))

const statusText = computed(() => {
  const statusKey = `streaming.status.${props.status}`
  return t(statusKey)
})

const formattedConnectedAt = computed(() => {
  if (!props.connectedAt) return t('common.never')
  return new Intl.DateTimeFormat('default', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(props.connectedAt)
})

const formattedLastHeartbeat = computed(() => {
  if (!props.lastHeartbeat) return t('common.never')
  const now = Date.now()
  const diff = now - props.lastHeartbeat.getTime()
  return formatDuration(diff) + ' ' + t('common.ago')
})

const uptimeText = computed(() => {
  if (!props.connectedAt || props.status !== 'connected') return t('common.notApplicable')
  return formatDuration(currentUptime.value)
})

const reconnectionProgress = computed(() => {
  if (!reconnecting.value || props.retryDelay <= 0) return 0
  const elapsed = props.retryDelay - (nextRetryIn.value * 1000)
  return Math.min(100, (elapsed / props.retryDelay) * 100)
})

// Methods
const handleReconnect = async () => {
  if (reconnecting.value) return

  reconnecting.value = true
  retryCount.value = 0

  try {
    await attemptReconnection()
  } catch (error) {
    console.error('Reconnection failed:', error)
    handleReconnectionError(error as Error)
  }
}

const handleDisconnect = async () => {
  if (disconnecting.value) return

  disconnecting.value = true
  try {
    emit('disconnect')
    ElMessage.success(t('streaming.disconnected'))
  } catch (error) {
    console.error('Disconnection failed:', error)
    ElMessage.error(t('streaming.disconnectFailed'))
  } finally {
    disconnecting.value = false
  }
}

const handleRetry = async () => {
  showErrorDialog.value = false
  emit('clearError')
  await handleReconnect()
}

const handleCloseError = () => {
  showErrorDialog.value = false
  showDebugInfo.value = false
}

const attemptReconnection = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const doReconnect = () => {
      if (retryCount.value >= props.maxRetries) {
        reconnecting.value = false
        reject(new Error(t('streaming.maxRetriesExceeded')))
        return
      }

      retryCount.value++
      emit('reconnect')

      // Set up retry delay if connection fails
      if (retryCount.value < props.maxRetries) {
        startRetryCountdown(resolve, reject)
      } else {
        reconnecting.value = false
        resolve()
      }
    }

    doReconnect()
  })
}

const startRetryCountdown = (resolve: () => void, reject: (error: Error) => void) => {
  nextRetryIn.value = Math.ceil(props.retryDelay / 1000)

  countdownTimer.value = setInterval(() => {
    nextRetryIn.value--

    if (nextRetryIn.value <= 0) {
      clearInterval(countdownTimer.value!)
      countdownTimer.value = null

      // Attempt next reconnection
      setTimeout(() => {
        if (retryCount.value < props.maxRetries) {
          attemptReconnection().then(resolve).catch(reject)
        } else {
          reconnecting.value = false
          resolve()
        }
      }, 100)
    }
  }, 1000)
}

const handleReconnectionError = (error: Error) => {
  console.error('Reconnection error:', error)
  reconnecting.value = false
  ElMessage.error(t('streaming.reconnectFailed'))
}

const formatDuration = (ms: number): string => {
  if (!ms || ms < 0) return '0s'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

const formatTimestamp = (timestamp: Date): string => {
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(timestamp)
}

const startUptimeTimer = () => {
  if (uptimeTimer.value) return

  uptimeTimer.value = setInterval(() => {
    if (props.connectedAt && props.status === 'connected') {
      currentUptime.value = Date.now() - props.connectedAt.getTime()
    }
  }, 1000)
}

const stopUptimeTimer = () => {
  if (uptimeTimer.value) {
    clearInterval(uptimeTimer.value)
    uptimeTimer.value = null
  }
}

const cleanup = () => {
  if (retryTimer.value) {
    clearTimeout(retryTimer.value)
    retryTimer.value = null
  }
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  stopUptimeTimer()
}

// Watchers
watch(() => props.status, (newStatus, oldStatus) => {
  if (newStatus === 'connected' && oldStatus !== 'connected') {
    reconnecting.value = false
    retryCount.value = 0
    startUptimeTimer()
    ElMessage.success(t('streaming.connected'))
  } else if (newStatus === 'disconnected' && oldStatus === 'connected') {
    stopUptimeTimer()
    if (props.autoReconnect) {
      handleReconnect()
    }
  } else if (newStatus === 'error') {
    stopUptimeTimer()
    showErrorDialog.value = true
    if (props.autoReconnect) {
      handleReconnect()
    }
  }
})

watch(() => props.error, (newError) => {
  if (newError) {
    showErrorDialog.value = true
  }
})

// Lifecycle
onMounted(() => {
  if (props.status === 'connected') {
    startUptimeTimer()
  }
})

onUnmounted(() => {
  cleanup()
})

// Expose methods
defineExpose({
  reconnect: handleReconnect,
  disconnect: handleDisconnect,
  showError: () => { showErrorDialog.value = true },
  hideError: () => { showErrorDialog.value = false }
})
</script>

<style scoped lang="scss">
.connection-status {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4;
  transition: all 0.3s ease;

  &.status-connected {
    @apply border-green-300 dark:border-green-600;
  }

  &.status-connecting,
  &.status-reconnecting {
    @apply border-blue-300 dark:border-blue-600;
  }

  &.status-disconnected {
    @apply border-gray-300 dark:border-gray-600;
  }

  &.status-error {
    @apply border-red-300 dark:border-red-600;
  }
}

.status-indicator {
  @apply flex items-center justify-between mb-4;

  .status-dot {
    @apply w-3 h-3 rounded-full mr-2;

    &.dot-connected {
      @apply bg-green-500;
    }

    &.dot-connecting,
    &.dot-reconnecting {
      @apply bg-blue-500;
    }

    &.dot-disconnected {
      @apply bg-gray-500;
    }

    &.dot-error {
      @apply bg-red-500;
    }

    &.pulse {
      animation: pulse 2s infinite;
    }
  }

  .status-text {
    @apply flex-1 text-sm font-medium text-gray-700 dark:text-gray-300;
  }
}

.status-details {
  @apply space-y-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md;

  .connection-info,
  .connection-stats {
    @apply space-y-2;

    .info-item,
    .stat-item {
      @apply flex justify-between text-xs;

      .label {
        @apply text-gray-600 dark:text-gray-400;
      }

      .value {
        @apply text-gray-900 dark:text-gray-100 font-mono;
      }
    }
  }
}

.status-actions {
  @apply flex items-center space-x-2;
}

.error-details {
  @apply space-y-4;

  .error-info {
    @apply mt-4 space-y-2;

    .info-item {
      @apply flex justify-between text-sm;

      .label {
        @apply text-gray-600 dark:text-gray-400;
      }

      .value {
        @apply text-gray-900 dark:text-gray-100 font-mono;
      }
    }
  }

  .error-stack {
    @apply mt-4;

    h4 {
      @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
    }

    pre {
      @apply bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-48;

      code {
        @apply text-red-600 dark:text-red-400;
      }
    }
  }
}

.reconnection-progress {
  @apply mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md;

  .progress-info {
    @apply flex justify-between items-center mb-2 text-sm text-blue-700 dark:text-blue-300;

    .countdown {
      @apply font-mono font-bold;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// Responsive design
@media (max-width: 768px) {
  .status-indicator {
    @apply flex-col items-start space-y-2;
  }

  .status-actions {
    @apply w-full justify-end;
  }

  .connection-info,
  .connection-stats {
    .info-item,
    .stat-item {
      @apply flex-col items-start;

      .label {
        @apply mb-1;
      }
    }
  }
}
</style>