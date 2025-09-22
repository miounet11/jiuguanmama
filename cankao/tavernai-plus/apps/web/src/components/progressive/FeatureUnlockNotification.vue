<template>
  <transition
    name="unlock-notification"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      v-if="visible"
      class="feature-unlock-notification"
      :class="notificationClass"
      :style="notificationStyle"
    >
      <!-- 解锁图标 -->
      <div class="unlock-icon-container">
        <el-icon class="unlock-icon" :size="iconSize">
          <component :is="unlockIcon" />
        </el-icon>
        <div class="icon-glow"></div>
      </div>

      <!-- 通知内容 -->
      <div class="unlock-content">
        <div class="unlock-header">
          <h4 class="unlock-title">{{ unlockTitle }}</h4>
          <el-tag
            :type="categoryTagType"
            size="small"
            class="category-tag"
          >
            {{ categoryText }}
          </el-tag>
        </div>

        <p class="feature-name">{{ feature.name }}</p>

        <p class="feature-description">{{ featureDescription }}</p>

        <!-- 功能预览 -->
        <div v-if="showPreview" class="feature-preview">
          <div class="preview-items">
            <div
              v-for="item in previewItems"
              :key="item.key"
              class="preview-item"
            >
              <el-icon :size="12">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </div>

        <!-- 解锁触发信息 -->
        <div v-if="showTriggerInfo" class="trigger-info">
          <span class="trigger-text">{{ triggerText }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="unlock-actions">
        <el-button
          v-if="showTryButton"
          type="primary"
          size="small"
          @click="handleTryFeature"
          :loading="tryLoading"
        >
          {{ tryButtonText }}
        </el-button>

        <el-button
          size="small"
          @click="handleDismiss"
          class="dismiss-button"
        >
          {{ dismissText }}
        </el-button>
      </div>

      <!-- 关闭按钮 -->
      <el-button
        text
        circle
        size="small"
        @click="handleDismiss"
        class="close-button"
      >
        <el-icon :size="14">
          <Close />
        </el-icon>
      </el-button>

      <!-- 进度指示器 -->
      <div
        v-if="autoHide && autoHideTime > 0"
        class="auto-hide-progress"
      >
        <div
          class="progress-bar"
          :style="{ animationDuration: `${autoHideTime}ms` }"
        ></div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  Star,
  Trophy,
  Gift,
  Magic,
  Setting,
  ChatRound,
  User,
  Picture,
  Document,
  Close,
  Check,
  ArrowRight,
  Promotion
} from '@element-plus/icons-vue'
import type { FeatureDefinition } from '@/utils/featureManifest'

interface Props {
  feature: FeatureDefinition
  visible?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
  autoHide?: boolean
  autoHideTime?: number
  showPreview?: boolean
  showTriggerInfo?: boolean
  showTryButton?: boolean
  iconSize?: number
  animation?: 'slide' | 'fade' | 'bounce' | 'zoom'
}

interface Emits {
  (e: 'dismiss'): void
  (e: 'try-feature'): void
  (e: 'animation-complete'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  position: 'top-right',
  autoHide: true,
  autoHideTime: 8000,
  showPreview: true,
  showTriggerInfo: true,
  showTryButton: true,
  iconSize: 24,
  animation: 'slide'
})

const emit = defineEmits<Emits>()

// Local state
const tryLoading = ref(false)
const autoHideTimer = ref<number | null>(null)

// Computed properties
const notificationClass = computed(() => ({
  [`position-${props.position}`]: true,
  [`animation-${props.animation}`]: true,
  [`category-${props.feature.category}`]: true,
  'has-preview': props.showPreview && previewItems.value.length > 0
}))

const notificationStyle = computed(() => {
  const styles: Record<string, string> = {}

  // Position styles
  switch (props.position) {
    case 'top-right':
      styles.top = '80px'
      styles.right = '20px'
      break
    case 'top-left':
      styles.top = '80px'
      styles.left = '20px'
      break
    case 'bottom-right':
      styles.bottom = '20px'
      styles.right = '20px'
      break
    case 'bottom-left':
      styles.bottom = '20px'
      styles.left = '20px'
      break
    case 'center':
      styles.top = '50%'
      styles.left = '50%'
      styles.transform = 'translate(-50%, -50%)'
      break
  }

  return styles
})

const unlockIcon = computed(() => {
  const categoryIcons = {
    core: User,
    advanced: Star,
    expert: Trophy
  }

  const featureIcons = {
    'character': User,
    'chat': ChatRound,
    'creation': Magic,
    'worldinfo': Document,
    'export': Document,
    'sharing': Gift,
    'settings': Setting,
    'rating': Star,
    'favorites': Star
  }

  // 首先尝试根据功能ID匹配图标
  for (const [keyword, icon] of Object.entries(featureIcons)) {
    if (props.feature.id.includes(keyword)) {
      return icon
    }
  }

  // 回退到类别图标
  return categoryIcons[props.feature.category] || Star
})

const unlockTitle = computed(() => {
  const titles = {
    core: '🎉 核心功能就绪',
    advanced: '🌟 高级功能解锁',
    expert: '🏆 专家功能解锁'
  }
  return titles[props.feature.category] || '🎉 新功能解锁'
})

const categoryTagType = computed(() => {
  const types = {
    core: 'info',
    advanced: 'success',
    expert: 'warning'
  }
  return types[props.feature.category] || 'info'
})

const categoryText = computed(() => {
  const texts = {
    core: '核心',
    advanced: '高级',
    expert: '专家'
  }
  return texts[props.feature.category] || '功能'
})

const featureDescription = computed(() => {
  return props.feature.expertDescription || props.feature.simpleDescription
})

const previewItems = computed(() => {
  if (!props.showPreview) return []

  // 根据功能类型生成预览项目
  const items = []

  if (props.feature.id.includes('character')) {
    if (props.feature.id.includes('creation')) {
      items.push(
        { key: 'template', icon: Magic, text: '使用创建模板' },
        { key: 'ai-gen', icon: Picture, text: 'AI生成头像' },
        { key: 'advanced', icon: Setting, text: '高级编辑选项' }
      )
    } else if (props.feature.id.includes('search')) {
      items.push(
        { key: 'filter', icon: Setting, text: '多维度筛选' },
        { key: 'sort', icon: ArrowRight, text: '智能排序' },
        { key: 'tag', icon: Star, text: '标签搜索' }
      )
    }
  } else if (props.feature.id.includes('chat')) {
    if (props.feature.id.includes('editing')) {
      items.push(
        { key: 'edit', icon: Setting, text: '编辑历史消息' },
        { key: 'regen', icon: ArrowRight, text: '重新生成回复' },
        { key: 'branch', icon: Magic, text: '分支对话' }
      )
    } else if (props.feature.id.includes('model')) {
      items.push(
        { key: 'models', icon: Setting, text: '多种AI模型' },
        { key: 'params', icon: Setting, text: '参数调节' },
        { key: 'compare', icon: Check, text: '模型对比' }
      )
    }
  }

  return items.slice(0, 3) // 最多显示3个
})

const triggerText = computed(() => {
  if (!props.showTriggerInfo) return ''

  const triggers = {
    usage: '通过使用其他功能自动解锁',
    time: '随着使用时间增长解锁',
    manual: '手动解锁',
    achievement: '达成成就解锁'
  }

  // 这里需要从feature unlock信息中获取触发方式
  // 暂时返回通用文本
  return '恭喜您解锁了这个新功能！'
})

const tryButtonText = computed(() => {
  return props.feature.category === 'expert' ? '立即体验' : '试试看'
})

const dismissText = computed(() => {
  return props.autoHide ? '知道了' : '关闭'
})

// Methods
const handleDismiss = () => {
  clearAutoHideTimer()
  emit('dismiss')
}

const handleTryFeature = async () => {
  tryLoading.value = true
  try {
    emit('try-feature')
    // 模拟导航到功能
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    tryLoading.value = false
  }
}

const onEnter = (el: Element) => {
  // 进入动画完成后的回调
  setTimeout(() => {
    emit('animation-complete')
  }, 300)
}

const onLeave = (el: Element) => {
  // 离开动画
}

const setupAutoHide = () => {
  if (props.autoHide && props.autoHideTime > 0) {
    autoHideTimer.value = window.setTimeout(() => {
      handleDismiss()
    }, props.autoHideTime)
  }
}

const clearAutoHideTimer = () => {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
    autoHideTimer.value = null
  }
}

// Lifecycle
onMounted(() => {
  setupAutoHide()
})

onUnmounted(() => {
  clearAutoHideTimer()
})
</script>

<style scoped lang="scss">
.feature-unlock-notification {
  position: fixed;
  background: var(--el-bg-color);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-width: 380px;
  min-width: 320px;
  z-index: 3000;
  backdrop-filter: blur(10px);
  overflow: hidden;

  // 类别特定样式
  &.category-core {
    border-color: var(--el-color-info-light-7);

    .unlock-icon {
      color: var(--el-color-info);
    }
  }

  &.category-advanced {
    border-color: var(--el-color-success-light-7);

    .unlock-icon {
      color: var(--el-color-success);
    }
  }

  &.category-expert {
    border-color: var(--el-color-warning-light-7);

    .unlock-icon {
      color: var(--el-color-warning);
    }
  }

  // 图标容器
  .unlock-icon-container {
    position: relative;
    display: inline-block;
    margin-bottom: 12px;

    .unlock-icon {
      position: relative;
      z-index: 2;
      animation: iconPulse 2s ease-in-out infinite;
    }

    .icon-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      background: currentColor;
      border-radius: 50%;
      opacity: 0.2;
      animation: glowPulse 2s ease-in-out infinite;
    }
  }

  // 内容区域
  .unlock-content {
    margin-bottom: 16px;

    .unlock-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .unlock-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .category-tag {
        font-size: 10px;
        padding: 2px 6px;
      }
    }

    .feature-name {
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-color-primary);
    }

    .feature-description {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: var(--el-text-color-regular);
      line-height: 1.5;
    }

    .feature-preview {
      margin: 12px 0;
      padding: 10px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      .preview-items {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .preview-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--el-text-color-regular);

          .el-icon {
            color: var(--el-color-success);
            flex-shrink: 0;
          }
        }
      }
    }

    .trigger-info {
      margin-top: 8px;
      padding: 6px 10px;
      background: var(--el-fill-color-extra-light);
      border-radius: 4px;
      border-left: 3px solid var(--el-color-primary);

      .trigger-text {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        font-style: italic;
      }
    }
  }

  // 操作按钮
  .unlock-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    .dismiss-button {
      color: var(--el-text-color-secondary);
    }
  }

  // 关闭按钮
  .close-button {
    position: absolute;
    top: 8px;
    right: 8px;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-text-color-primary);
    }
  }

  // 自动隐藏进度条
  .auto-hide-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--el-fill-color-lighter);
    overflow: hidden;

    .progress-bar {
      height: 100%;
      background: var(--el-color-primary);
      animation: progressShrink linear forwards;
      transform-origin: left;
    }
  }

  // 预览展开状态
  &.has-preview {
    max-width: 420px;
  }
}

// 动画定义
@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1.2);
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

// 进入/离开动画
.unlock-notification-enter-active,
.unlock-notification-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.unlock-notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.unlock-notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

// 不同位置的动画
.position-top-left {
  &.unlock-notification-enter-from,
  &.unlock-notification-leave-to {
    transform: translateX(-100%) scale(0.8);
  }
}

.position-bottom-right,
.position-bottom-left {
  &.unlock-notification-enter-from,
  &.unlock-notification-leave-to {
    transform: translateY(100%) scale(0.8);
  }
}

.position-center {
  &.unlock-notification-enter-from,
  &.unlock-notification-leave-to {
    transform: translate(-50%, -50%) scale(0.6);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .feature-unlock-notification {
    right: 10px !important;
    left: 10px !important;
    max-width: none;
    min-width: auto;
    transform: none !important;

    &.position-center {
      top: 50% !important;
      transform: translateY(-50%) !important;
    }

    .unlock-content {
      .unlock-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
    }

    .unlock-actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}

// 暗色主题
.dark {
  .feature-unlock-notification {
    background: var(--el-bg-color-page);
    border-color: var(--el-border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
}
</style>