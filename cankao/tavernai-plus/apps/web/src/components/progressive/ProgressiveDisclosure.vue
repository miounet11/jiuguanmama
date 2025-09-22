<template>
  <div class="progressive-disclosure-wrapper">
    <!-- 模式切换器 -->
    <ModeSwitch
      v-if="showModeSwitcher"
      :current-mode="currentMode"
      @mode-change="handleModeChange"
      class="mb-4"
    />

    <!-- 功能渐进披露容器 -->
    <div class="feature-container" :class="containerClass">
      <slot
        :visible-features="visibleFeatures"
        :feature-state="featureState"
        :current-mode="currentMode"
        :is-expert-mode="isExpertMode"
        :unlock-feature="unlockFeature"
        :is-feature-enabled="isFeatureEnabled"
        :is-feature-highlighted="isFeatureHighlighted"
        :get-feature-description="getFeatureDescription"
      />
    </div>

    <!-- 升级建议提示 -->
    <UpgradeSuggestion
      v-if="showUpgradeSuggestion"
      :suggestion-text="upgradeSuggestionText"
      :suggestion-reason="upgradeSuggestionReason"
      @upgrade="handleUpgradeToExpert"
      @dismiss="handleDismissUpgradeSuggestion"
      class="mt-4"
    />

    <!-- 功能解锁通知 -->
    <FeatureUnlockNotification
      v-for="notification in unlockNotifications"
      :key="notification.featureId"
      :feature="notification"
      @dismiss="handleDismissUnlockNotification"
      class="feature-unlock-notification"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useUserModeStore } from '@/stores/userModeStore'
import { getFeatureManifest, getFeatureById, type FeatureDefinition } from '@/utils/featureManifest'
import { evaluateCondition, createEvaluationContext, type EvaluationContext } from '@/utils/conditionEvaluator'
import ModeSwitch from './ModeSwitch.vue'
import UpgradeSuggestion from './UpgradeSuggestion.vue'
import FeatureUnlockNotification from './FeatureUnlockNotification.vue'

interface Props {
  featureScope?: string
  allowModeSwitch?: boolean
  showUpgradeSuggestions?: boolean
  autoCheckUnlocks?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  featureScope: 'global',
  allowModeSwitch: true,
  showUpgradeSuggestions: true,
  autoCheckUnlocks: true
})

// Store
const userModeStore = useUserModeStore()

// Local state
const unlockNotifications = ref<Array<{ featureId: string; feature: FeatureDefinition }>>([])

// Computed properties
const currentMode = computed(() => userModeStore.currentMode)
const isExpertMode = computed(() => currentMode.value === 'expert')

const showModeSwitcher = computed(() => {
  return props.allowModeSwitch && (
    isExpertMode.value ||
    userModeStore.shouldSuggestModeUpgrade
  )
})

const containerClass = computed(() => ({
  'simplified-mode': !isExpertMode.value,
  'expert-mode': isExpertMode.value,
  [`scope-${props.featureScope}`]: true
}))

const visibleFeatures = computed(() => {
  const manifest = getFeatureManifest(props.featureScope)
  const currentMode = userModeStore.currentMode
  const unlockedFeatures = userModeStore.featureUnlocks.map(unlock => unlock.featureId)

  return manifest.filter(feature => {
    // 核心功能始终显示
    if (feature.coreFeature) return true

    // 简洁模式下的特殊规则
    if (currentMode === 'simplified') {
      return feature.unlockedInSimplified || unlockedFeatures.includes(feature.id)
    }

    // 专家模式显示所有功能
    return true
  })
})

const featureState = computed(() => {
  const state = new Map()
  const context = createEvaluationContext(userModeStore.userExperience)

  visibleFeatures.value.forEach(feature => {
    state.set(feature.id, {
      visible: true,
      enabled: isFeatureEnabled(feature, context),
      highlighted: isFeatureHighlighted(feature),
      description: getFeatureDescription(feature),
      category: feature.category,
      isExpert: feature.isExpertFeature,
      isCore: feature.coreFeature
    })
  })

  return state
})

const showUpgradeSuggestion = computed(() => {
  return props.showUpgradeSuggestions &&
         !isExpertMode.value &&
         userModeStore.shouldSuggestModeUpgrade
})

const upgradeSuggestionText = computed(() => {
  const reason = userModeStore.upgradeSuggestionReason
  return `您已经${reason}，准备体验更多高级功能了！切换到专家模式可以获得完整的控制能力和更多定制选项。`
})

const upgradeSuggestionReason = computed(() => {
  return userModeStore.upgradeSuggestionReason
})

// Methods

/**
 * 检查功能是否启用
 */
const isFeatureEnabled = (feature: FeatureDefinition, context?: EvaluationContext): boolean => {
  // 核心功能总是启用
  if (feature.coreFeature) return true

  // 检查是否已解锁
  if (userModeStore.isFeatureUnlocked(feature.id)) return true

  // 检查解锁条件
  if (feature.unlockCondition) {
    const evalContext = context || createEvaluationContext(userModeStore.userExperience)
    const result = evaluateCondition(feature.unlockCondition, evalContext)
    return result.result
  }

  return false
}

/**
 * 检查功能是否为新解锁（高亮显示）
 */
const isFeatureHighlighted = (feature: FeatureDefinition): boolean => {
  // 检查是否在最近解锁的功能中
  const recentThreshold = 3 * 24 * 60 * 60 * 1000 // 3天
  const now = Date.now()

  return userModeStore.featureUnlocks.some(unlock => {
    if (unlock.featureId !== feature.id) return false
    const unlockTime = new Date(unlock.unlockedAt).getTime()
    return (now - unlockTime) < recentThreshold
  })
}

/**
 * 获取功能描述
 */
const getFeatureDescription = (feature: FeatureDefinition): string => {
  return isExpertMode.value ? feature.expertDescription : feature.simpleDescription
}

/**
 * 处理模式切换
 */
const handleModeChange = async (newMode: 'simplified' | 'expert') => {
  const success = await userModeStore.switchMode(newMode, 'user-toggle')
  if (success) {
    // 记录模式切换的功能使用
    await userModeStore.recordFeatureUsage('mode-switch', true)
  }
}

/**
 * 升级到专家模式
 */
const handleUpgradeToExpert = async () => {
  const success = await userModeStore.switchMode('expert', 'upgrade-suggestion')
  if (success) {
    await userModeStore.recordFeatureUsage('upgrade-from-suggestion', true)
  }
}

/**
 * 暂时关闭升级建议
 */
const handleDismissUpgradeSuggestion = async (hours = 24) => {
  await userModeStore.dismissUpgradeSuggestion(hours)
}

/**
 * 手动解锁功能
 */
const unlockFeature = async (featureId: string) => {
  const feature = getFeatureById(featureId)
  if (!feature) {
    console.warn(`功能 ${featureId} 不存在`)
    return
  }

  // 检查依赖关系
  if (feature.dependencies?.length) {
    const unlockedFeatures = userModeStore.featureUnlocks.map(unlock => unlock.featureId)
    const missingDeps = feature.dependencies.filter(dep => !unlockedFeatures.includes(dep))

    if (missingDeps.length > 0) {
      console.warn(`功能 ${featureId} 依赖以下功能: ${missingDeps.join(', ')}`)
      return
    }
  }

  // 添加到解锁通知队列
  if (feature.showUnlockNotification) {
    unlockNotifications.value.push({
      featureId,
      feature
    })
  }

  // 记录功能使用
  await userModeStore.recordFeatureUsage(featureId, feature.isExpertFeature)
}

/**
 * 处理解锁通知关闭
 */
const handleDismissUnlockNotification = (featureId: string) => {
  const index = unlockNotifications.value.findIndex(
    notification => notification.featureId === featureId
  )
  if (index >= 0) {
    unlockNotifications.value.splice(index, 1)
  }

  // 清除store中的通知
  userModeStore.clearUnlockNotification(featureId)
}

/**
 * 自动检查功能解锁
 */
const checkForNewUnlocks = () => {
  if (!props.autoCheckUnlocks) return

  const pendingNotifications = userModeStore.getUnlockNotifications()
  pendingNotifications.forEach(unlock => {
    const feature = getFeatureById(unlock.featureId)
    if (feature && feature.showUnlockNotification) {
      const existing = unlockNotifications.value.find(n => n.featureId === unlock.featureId)
      if (!existing) {
        unlockNotifications.value.push({
          featureId: unlock.featureId,
          feature
        })
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  // 初始化时检查待显示的解锁通知
  checkForNewUnlocks()
})

// Watch for feature unlocks
watch(
  () => userModeStore.featureUnlocks,
  () => {
    checkForNewUnlocks()
  },
  { deep: true }
)

// Expose public methods for parent components
defineExpose({
  unlockFeature,
  isFeatureEnabled,
  isFeatureHighlighted,
  getFeatureDescription,
  currentMode,
  visibleFeatures,
  featureState
})
</script>

<style scoped lang="scss">
.progressive-disclosure-wrapper {
  position: relative;

  .feature-container {
    transition: all 0.3s ease;

    &.simplified-mode {
      // 简化模式样式
      :deep(.expert-only) {
        display: none !important;
      }

      :deep(.feature-item) {
        margin-bottom: 8px;

        &.complex-feature {
          opacity: 0.7;
          pointer-events: none;
        }
      }

      // 简化模式下的紧凑布局
      :deep(.feature-grid) {
        gap: 12px;
      }
    }

    &.expert-mode {
      // 专家模式样式
      :deep(.feature-item) {
        margin-bottom: 12px;

        &.expert-feature {
          border-left: 3px solid var(--el-color-primary);
          padding-left: 12px;
          background: var(--el-fill-color-lighter);
          border-radius: 4px;
        }

        &.highlighted {
          animation: featureHighlight 2s ease-in-out;
          border-color: var(--el-color-warning);
        }
      }

      // 专家模式下的详细布局
      :deep(.feature-grid) {
        gap: 16px;
      }
    }

    // 作用域特定样式
    &.scope-character-discovery {
      :deep(.character-related) {
        border-left-color: var(--el-color-success);
      }
    }

    &.scope-chat {
      :deep(.chat-related) {
        border-left-color: var(--el-color-info);
      }
    }

    &.scope-character-creation {
      :deep(.creation-related) {
        border-left-color: var(--el-color-warning);
      }
    }
  }

  // 功能解锁通知定位
  .feature-unlock-notification {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 2000;

    // 多个通知时的堆叠
    &:nth-child(n+2) {
      top: calc(80px + 120px * var(--notification-index, 0));
    }
  }
}

// 功能高亮动画
@keyframes featureHighlight {
  0% {
    background-color: var(--el-color-warning-light-9);
    transform: scale(1);
  }
  50% {
    background-color: var(--el-color-warning-light-7);
    transform: scale(1.02);
  }
  100% {
    background-color: transparent;
    transform: scale(1);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .progressive-disclosure-wrapper {
    .feature-unlock-notification {
      right: 10px;
      left: 10px;
      width: auto;
    }
  }
}
</style>