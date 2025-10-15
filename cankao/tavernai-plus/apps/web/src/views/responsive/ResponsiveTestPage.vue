<template>
  <div class="responsive-test-page">
    <!-- 页面头部 -->
    <header class="test-header">
      <div class="header-content">
        <h1 class="page-title">响应式设计测试页面</h1>
        <p class="page-subtitle">
          测试TavernAI Plus在各种设备上的响应式表现
        </p>
      </div>

      <!-- 设备信息显示 -->
      <div class="device-info">
        <div class="info-item">
          <span class="info-label">设备类型:</span>
          <span class="info-value">{{ deviceType }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">当前断点:</span>
          <span class="info-value">{{ currentBreakpoint }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">屏幕尺寸:</span>
          <span class="info-value">{{ windowWidth }} × {{ windowHeight }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">触摸设备:</span>
          <span class="info-value">{{ isTouchDevice ? '是' : '否' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">网络质量:</span>
          <span class="info-value">{{ networkQuality }}</span>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="test-content">
      <!-- 卡片网格测试 -->
      <section class="test-section">
        <h2 class="section-title">响应式卡片网格</h2>
        <p class="section-description">
          测试不同设备下的卡片布局和触摸交互
        </p>

        <ResponsiveGrid
          :mobile-columns="1"
          :tablet-columns="2"
          :desktop-columns="3"
          :large-desktop-columns="4"
          :mobile-gap="12"
          :tablet-gap="16"
          :desktop-gap="20"
          class="card-grid"
        >
          <ResponsiveCard
            v-for="card in testCards"
            :key="card.id"
            :title="card.title"
            :subtitle="card.subtitle"
            :description="card.description"
            :media="card.media"
            :loading="card.loading"
            :clickable="true"
            :hoverable="!isMobileDevice"
            @click="handleCardClick(card)"
          >
            <template #actions>
              <EnhancedTouchHandler
                class="card-action-btn"
                @tap="handleCardAction(card, 'like')"
                :enable-feedback="true"
              >
                <HeartIcon />
              </EnhancedTouchHandler>
              <EnhancedTouchHandler
                class="card-action-btn"
                @tap="handleCardAction(card, 'share')"
                :enable-feedback="true"
              >
                <ShareIcon />
              </EnhancedTouchHandler>
            </template>
          </ResponsiveCard>
        </ResponsiveGrid>
      </section>

      <!-- 触摸手势测试 -->
      <section class="test-section">
        <h2 class="section-title">触摸手势测试</h2>
        <p class="section-description">
          测试各种触摸手势的响应和反馈
        </p>

        <div class="gesture-test-area">
          <EnhancedTouchHandler
            class="gesture-test-card"
            :enable-swipe="true"
            :enable-long-press="true"
            :enable-double-tap="true"
            :enable-pinch="true"
            :enable-rotate="true"
            :show-ripple="true"
            :show-long-press-indicator="true"
            :show-double-tap-indicator="true"
            @swipe="handleSwipe"
            @long-press="handleLongPress"
            @double-tap="handleDoubleTap"
            @pinch="handlePinch"
            @rotate="handleRotate"
            @tap="handleTap"
          >
            <div class="gesture-content">
              <h3>触摸手势测试区域</h3>
              <p>在此区域测试各种触摸手势:</p>
              <ul>
                <li>轻击 (Tap)</li>
                <li>双击 (Double Tap)</li>
                <li>长按 (Long Press)</li>
                <li>滑动 (Swipe)</li>
                <li>缩放 (Pinch) - 仅限触摸设备</li>
                <li>旋转 (Rotate) - 仅限触摸设备</li>
              </ul>
            </div>
          </EnhancedTouchHandler>

          <div class="gesture-log">
            <h4>手势日志:</h4>
            <div class="log-list">
              <div
                v-for="(log, index) in gestureLogs"
                :key="index"
                class="log-item"
              >
                <span class="log-time">{{ log.time }}</span>
                <span class="log-action">{{ log.action }}</span>
                <span v-if="log.detail" class="log-detail">{{ log.detail }}</span>
              </div>
            </div>
            <button
              v-if="gestureLogs.length > 0"
              class="clear-log-btn"
              @click="clearGestureLog"
            >
              清空日志
            </button>
          </div>
        </div>
      </section>

      <!-- 聊天界面测试 -->
      <section class="test-section">
        <h2 class="section-title">响应式聊天界面</h2>
        <p class="section-description">
          测试聊天界面在不同设备上的布局和交互
        </p>

        <div class="chat-test-container">
          <ResponsiveChatInterface
            :chats="testChats"
            :messages="testMessages"
            :active-chat-id="activeChatId"
            :is-typing="isTyping"
            :enable-voice="true"
            :enable-image="true"
            :show-quick-replies="true"
            :quick-replies="quickReplies"
            @chat-select="handleChatSelect"
            @send-message="handleSendMessage"
            @voice-start="handleVoiceStart"
            @voice-end="handleVoiceEnd"
            @image-upload="handleImageUpload"
          />
        </div>
      </section>

      <!-- 性能监控 -->
      <section class="test-section">
        <h2 class="section-title">性能监控</h2>
        <p class="section-description">
          实时监控应用性能指标
        </p>

        <div class="performance-monitor">
          <div class="performance-metrics">
            <div class="metric-item">
              <span class="metric-label">FPS:</span>
              <span class="metric-value" :class="getPerformanceClass(fps)">
                {{ fps }}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">内存使用:</span>
              <span class="metric-value" :class="getPerformanceClass(memoryUsage)">
                {{ memoryUsage.toFixed(1) }}%
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">网络延迟:</span>
              <span class="metric-value">
                {{ networkLatency }}ms
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">设备性能:</span>
              <span class="metric-value" :class="getPerformanceClass(performanceLevel)">
                {{ performanceLevel }}
              </span>
            </div>
          </div>

          <div class="performance-chart">
            <canvas ref="performanceChart" width="400" height="200"></canvas>
          </div>
        </div>
      </section>

      <!-- 断点测试 -->
      <section class="test-section">
        <h2 class="section-title">断点测试</h2>
        <p class="section-description">
          测试不同断点下的布局变化
        </p>

        <div class="breakpoint-test">
          <div class="breakpoint-indicators">
            <div
              v-for="breakpoint in breakpoints"
              :key="breakpoint.name"
              class="breakpoint-indicator"
              :class="{ 'breakpoint-active': breakpoint.active }"
            >
              <span class="breakpoint-name">{{ breakpoint.name }}</span>
              <span class="breakpoint-size">{{ breakpoint.size }}px</span>
            </div>
          </div>

          <div class="breakpoint-info">
            <p>当前激活的断点: <strong>{{ currentBreakpoint }}</strong></p>
            <p>窗口宽度: <strong>{{ windowWidth }}px</strong></p>
            <p>建议的布局调整:</p>
            <ul>
              <li v-for="suggestion in getLayoutSuggestions()" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useEnhancedResponsive } from '@/composables/useEnhancedResponsive'
import { useMobilePerformance } from '@/composables/useMobilePerformance'

// 组件导入
import ResponsiveCard from '@/components/design-system/ResponsiveCard.vue'
import ResponsiveGrid from '@/components/layout/ResponsiveGrid.vue'
import ResponsiveChatInterface from '@/components/chat/ResponsiveChatInterface.vue'
import EnhancedTouchHandler from '@/components/mobile/EnhancedTouchHandler.vue'

// 图标组件 (简化示例)
const HeartIcon = 'HeartIcon'
const ShareIcon = 'ShareIcon'

// 响应式Hook
const {
  windowWidth,
  windowHeight,
  deviceType,
  currentBreakpoint,
  isTouchDevice,
  networkQuality,
} = useEnhancedResponsive()

const {
  metrics,
  performanceLevel,
  startMonitoring,
  stopMonitoring,
} = useMobilePerformance()

// 状态管理
const activeChatId = ref('chat1')
const isTyping = ref(false)
const gestureLogs = ref<Array<{ time: string; action: string; detail?: string }>>([])
const performanceChart = ref<HTMLCanvasElement>()

// 性能指标
const fps = computed(() => metrics.value.fps.current)
const memoryUsage = computed(() => metrics.value.memory.percentage)
const networkLatency = computed(() => metrics.value.network.rtt)

// 测试数据
const testCards = ref([
  {
    id: 1,
    title: '响应式卡片 1',
    subtitle: '移动端优化',
    description: '这是一个响应式卡片，在不同设备上会有不同的布局和交互方式。',
    media: 'https://picsum.photos/300/200?random=1',
    loading: false,
  },
  {
    id: 2,
    title: '响应式卡片 2',
    subtitle: '触摸友好',
    description: '触摸友好的交互设计，支持手势操作和触觉反馈。',
    media: 'https://picsum.photos/300/200?random=2',
    loading: false,
  },
  {
    id: 3,
    title: '响应式卡片 3',
    subtitle: '性能优化',
    description: '针对移动端进行了性能优化，包括图片懒加载和动画优化。',
    media: 'https://picsum.photos/300/200?random=3',
    loading: false,
  },
  {
    id: 4,
    title: '响应式卡片 4',
    subtitle: '无障碍支持',
    description: '支持键盘导航、屏幕阅读器和高对比度模式。',
    media: 'https://picsum.photos/300/200?random=4',
    loading: false,
  },
  {
    id: 5,
    title: '响应式卡片 5',
    subtitle: '主题适配',
    description: '自动适配深色和浅色主题，支持系统主题偏好。',
    media: 'https://picsum.photos/300/200?random=5',
    loading: false,
  },
  {
    id: 6,
    title: '响应式卡片 6',
    subtitle: '国际化支持',
    description: '支持多语言和RTL布局，适配不同地区的用户习惯。',
    media: 'https://picsum.photos/300/200?random=6',
    loading: false,
  },
])

const testChats = ref([
  {
    id: 'chat1',
    characterId: 'char1',
    characterName: 'AI助手小艾',
    characterAvatar: 'https://picsum.photos/100/100?random=101',
    lastMessage: '你好！有什么可以帮助你的吗？',
    updatedAt: new Date().toISOString(),
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'chat2',
    characterId: 'char2',
    characterName: '虚拟角色露娜',
    characterAvatar: 'https://picsum.photos/100/100?random=102',
    lastMessage: '今天天气真好呢～',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 'chat3',
    characterId: 'char3',
    characterName: '游戏角色艾莉',
    characterAvatar: 'https://picsum.photos/100/100?random=103',
    lastMessage: '准备好了吗？我们一起冒险吧！',
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    unreadCount: 0,
    isOnline: false,
  },
])

const testMessages = ref([
  {
    id: 'msg1',
    role: 'assistant' as const,
    content: '你好！我是AI助手小艾，很高兴认识你！',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'msg2',
    role: 'user' as const,
    content: '你好小艾！我想了解一下响应式设计。',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'msg3',
    role: 'assistant' as const,
    content: '响应式设计是一种网页设计方法，它使网站能够在不同设备和屏幕尺寸上提供最佳的浏览体验。通过使用弹性网格布局、灵活的图片和CSS媒体查询，网站可以自动适应不同的设备。',
    timestamp: new Date().toISOString(),
  },
])

const quickReplies = ref([
  '什么是响应式设计？',
  '移动端优先原则',
  '触摸交互设计',
  '性能优化技巧',
])

// 断点信息
const breakpoints = computed(() => [
  { name: 'xs', size: 475, active: currentBreakpoint.value === 'xs' },
  { name: 'sm', size: 640, active: currentBreakpoint.value === 'sm' },
  { name: 'md', size: 768, active: currentBreakpoint.value === 'md' },
  { name: 'lg', size: 1024, active: currentBreakpoint.value === 'lg' },
  { name: 'xl', size: 1280, active: currentBreakpoint.value === 'xl' },
  { name: '2xl', size: 1536, active: currentBreakpoint.value === '2xl' },
  { name: '3xl', size: 1920, active: currentBreakpoint.value === '3xl' },
])

// 方法
const handleCardClick = (card: any) => {
  console.log('卡片点击:', card.title)
}

const handleCardAction = (card: any, action: string) => {
  console.log('卡片操作:', card.title, action)
}

const addGestureLog = (action: string, detail?: string) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  gestureLogs.value.unshift({ time, action, detail })

  // 限制日志数量
  if (gestureLogs.value.length > 10) {
    gestureLogs.value.pop()
  }
}

const handleTap = () => {
  addGestureLog('轻击 (Tap)')
}

const handleDoubleTap = () => {
  addGestureLog('双击 (Double Tap)')
}

const handleLongPress = () => {
  addGestureLog('长按 (Long Press)')
}

const handleSwipe = (gesture: any) => {
  addGestureLog(`滑动 (Swipe)`, `${gesture.direction} ${gesture.distance.toFixed(0)}px`)
}

const handlePinch = (gesture: any) => {
  addGestureLog(`缩放 (Pinch)`, `缩放比例: ${gesture.scale.toFixed(2)}`)
}

const handleRotate = (gesture: any) => {
  addGestureLog(`旋转 (Rotate)`, `旋转角度: ${gesture.angle.toFixed(0)}°`)
}

const clearGestureLog = () => {
  gestureLogs.value = []
}

const handleChatSelect = (chatId: string) => {
  activeChatId.value = chatId
  console.log('选择聊天:', chatId)
}

const handleSendMessage = (content: string) => {
  console.log('发送消息:', content)

  // 模拟AI回复
  setTimeout(() => {
    isTyping.value = true
    setTimeout(() => {
      isTyping.value = false
      testMessages.value.push({
        id: `msg${Date.now()}`,
        role: 'assistant',
        content: '收到你的消息了！这是一个测试回复。',
        timestamp: new Date().toISOString(),
      })
    }, 2000)
  }, 500)
}

const handleVoiceStart = () => {
  console.log('开始语音输入')
}

const handleVoiceEnd = () => {
  console.log('结束语音输入')
}

const handleImageUpload = (file: File) => {
  console.log('上传图片:', file.name)
}

const getPerformanceClass = (value: number | string): string => {
  if (typeof value === 'string') {
    if (value === 'excellent' || value === 'good') return 'metric-good'
    if (value === 'fair') return 'metric-fair'
    return 'metric-poor'
  }

  if (value >= 80) return 'metric-good'
  if (value >= 50) return 'metric-fair'
  return 'metric-poor'
}

const getLayoutSuggestions = (): string[] => {
  const suggestions: string[] = []

  if (currentBreakpoint.value === 'xs') {
    suggestions.push('使用单列布局')
    suggestions.push('增大触摸目标尺寸')
    suggestions.push('简化导航结构')
    suggestions.push('使用底部导航栏')
  } else if (currentBreakpoint.value === 'sm') {
    suggestions.push('可以使用双列布局')
    suggestions.push('优化图片尺寸')
    suggestions.push('保持足够的间距')
  } else if (currentBreakpoint.value === 'md') {
    suggestions.push('可以使用三列布局')
    suggestions.push('增加侧边栏')
    suggestions.push('优化内容密度')
  } else {
    suggestions.push('使用多列布局')
    suggestions.push('充分利用屏幕空间')
    suggestions.push('考虑使用固定侧边栏')
  }

  return suggestions
}

// 性能图表绘制
const drawPerformanceChart = () => {
  if (!performanceChart.value) return

  const canvas = performanceChart.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制简单的性能指标图表
  const metrics = [
    { label: 'FPS', value: fps.value, max: 60, color: '#10B981' },
    { label: '内存', value: memoryUsage.value, max: 100, color: '#F59E0B' },
    { label: '延迟', value: 100 - networkLatency.value, max: 100, color: '#EF4444' },
  ]

  const barWidth = 60
  const barSpacing = 30
  const startX = 50
  const startY = 150
  const maxHeight = 100

  metrics.forEach((metric, index) => {
    const x = startX + (barWidth + barSpacing) * index
    const height = (metric.value / metric.max) * maxHeight
    const y = startY - height

    // 绘制条形
    ctx.fillStyle = metric.color
    ctx.fillRect(x, y, barWidth, height)

    // 绘制标签
    ctx.fillStyle = '#374151'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(metric.label, x + barWidth / 2, startY + 20)

    // 绘制数值
    ctx.fillText(
      typeof metric.value === 'number' ? metric.value.toFixed(0) : metric.value,
      x + barWidth / 2,
      y - 10
    )
  })
}

// 生命周期
onMounted(() => {
  // 开始性能监控
  startMonitoring()

  // 定期更新性能图表
  const chartInterval = setInterval(() => {
    drawPerformanceChart()
  }, 1000)

  onUnmounted(() => {
    stopMonitoring()
    clearInterval(chartInterval)
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/responsive.scss';

.responsive-test-page {
  min-height: 100vh;
  background: var(--surface-0);
  color: var(--text-primary);
}

.test-header {
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-secondary);
  padding: $spacing-xl 0;
  @include safe-area-padding($spacing-lg, $spacing-xl, 0, $spacing-xl);

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 $spacing-lg;
    text-align: center;

    .page-title {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin: 0 0 $spacing-md;
      color: var(--text-primary);

      @include mobile-only {
        font-size: $font-size-2xl;
      }
    }

    .page-subtitle {
      font-size: $font-size-lg;
      color: var(--text-secondary);
      margin: 0 0 $spacing-xl;

      @include mobile-only {
        font-size: $font-size-base;
      }
    }
  }

  .device-info {
    max-width: 1200px;
    margin: 0 auto;
    padding: $spacing-lg;
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-lg;
    justify-content: center;

    @include mobile-only {
      flex-direction: column;
      gap: $spacing-md;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-md $spacing-lg;
      background: var(--surface-2);
      border-radius: $border-radius-lg;
      min-width: 120px;

      .info-label {
        font-size: $font-size-sm;
        color: var(--text-secondary);
        margin-bottom: $spacing-xs;
      }

      .info-value {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
        color: var(--primary-color);
      }
    }
  }
}

.test-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-xl $spacing-lg;

  @include mobile-only {
    padding: $spacing-lg $spacing-md;
  }
}

.test-section {
  margin-bottom: $spacing-3xl;

  .section-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    margin: 0 0 $spacing-md;
    color: var(--text-primary);

    @include mobile-only {
      font-size: $font-size-xl;
    }
  }

  .section-description {
    font-size: $font-size-base;
    color: var(--text-secondary);
    margin: 0 0 $spacing-xl;
  }
}

.card-grid {
  margin-bottom: $spacing-xl;
}

.gesture-test-area {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-xl;

  @include tablet-up {
    grid-template-columns: 2fr 1fr;
  }

  .gesture-test-card {
    background: var(--surface-1);
    border: 2px dashed var(--border-secondary);
    border-radius: $border-radius-lg;
    padding: $spacing-xl;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      border-color: var(--primary-color);
      background: var(--surface-2);
    }

    .gesture-content {
      h3 {
        font-size: $font-size-xl;
        margin: 0 0 $spacing-md;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        margin: 0 0 $spacing-lg;
      }

      ul {
        text-align: left;
        color: var(--text-secondary);
        margin: 0;
        padding-left: $spacing-lg;

        li {
          margin-bottom: $spacing-xs;
        }
      }
    }
  }

  .gesture-log {
    background: var(--surface-1);
    border: 1px solid var(--border-secondary);
    border-radius: $border-radius-lg;
    padding: $spacing-lg;

    h4 {
      font-size: $font-size-lg;
      margin: 0 0 $spacing-md;
      color: var(--text-primary);
    }

    .log-list {
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: $spacing-md;

      .log-item {
        display: flex;
        gap: $spacing-sm;
        padding: $spacing-xs 0;
        font-size: $font-size-sm;
        border-bottom: 1px solid var(--border-secondary);

        &:last-child {
          border-bottom: none;
        }

        .log-time {
          color: var(--text-tertiary);
          font-family: monospace;
          min-width: 60px;
        }

        .log-action {
          color: var(--primary-color);
          font-weight: $font-weight-medium;
        }

        .log-detail {
          color: var(--text-secondary);
        }
      }
    }

    .clear-log-btn {
      @include touch-button(32px);
      background: var(--surface-2);
      border: 1px solid var(--border-secondary);
      color: var(--text-primary);
      border-radius: $border-radius-base;
      cursor: pointer;
      font-size: $font-size-sm;
      transition: all $transition-fast;

      &:hover {
        background: var(--surface-3);
      }
    }
  }
}

.chat-test-container {
  background: var(--surface-1);
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-lg;
  height: 600px;
  overflow: hidden;
  margin-bottom: $spacing-xl;

  @include mobile-only {
    height: 500px;
  }
}

.performance-monitor {
  background: var(--surface-1);
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;

  .performance-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;

    .metric-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-md;
      background: var(--surface-2);
      border-radius: $border-radius-base;

      .metric-label {
        font-size: $font-size-sm;
        color: var(--text-secondary);
      }

      .metric-value {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;

        &.metric-good {
          color: $success-color;
        }

        &.metric-fair {
          color: $warning-color;
        }

        &.metric-poor {
          color: $error-color;
        }
      }
    }
  }

  .performance-chart {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $spacing-lg;
    background: var(--surface-2);
    border-radius: $border-radius-base;

    canvas {
      max-width: 100%;
      height: auto;
    }
  }
}

.breakpoint-test {
  background: var(--surface-1);
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;

  .breakpoint-indicators {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-bottom: $spacing-xl;

    .breakpoint-indicator {
      padding: $spacing-sm $spacing-md;
      background: var(--surface-2);
      border: 1px solid var(--border-secondary);
      border-radius: $border-radius-base;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-xs;
      transition: all $transition-fast;

      &.breakpoint-active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .breakpoint-name {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
      }

      .breakpoint-size {
        font-size: $font-size-xs;
        opacity: 0.8;
      }
    }
  }

  .breakpoint-info {
    p {
      margin: 0 0 $spacing-sm;
      color: var(--text-secondary);

      strong {
        color: var(--text-primary);
      }
    }

    ul {
      margin: $spacing-md 0 0;
      padding-left: $spacing-lg;

      li {
        margin-bottom: $spacing-xs;
        color: var(--text-secondary);
      }
    }
  }
}

// 卡片操作按钮样式
:deep(.card-action-btn) {
  @include touch-button(32px);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: $border-radius-base;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;

  &:hover {
    color: var(--primary-color);
    background: rgba(var(--primary-color), 0.1);
  }
}

// 响应式调整
@include mobile-only {
  .responsive-test-page {
    .test-content {
      .test-section {
        margin-bottom: $spacing-2xl;
      }
    }
  }

  .gesture-test-area {
    grid-template-columns: 1fr;
  }

  .performance-metrics {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .responsive-test-page {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .responsive-test-page {
    .test-header,
    .test-section {
      border-width: 2px;
    }

    .gesture-test-card {
      border-width: 2px;
    }
  }
}
</style>