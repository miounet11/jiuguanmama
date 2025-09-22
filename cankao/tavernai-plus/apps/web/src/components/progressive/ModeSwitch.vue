<template>
  <div class="mode-switch-container">
    <div class="mode-switch-wrapper">
      <!-- 模式切换开关 -->
      <el-switch
        :model-value="isExpertMode"
        @change="handleModeChange"
        :active-text="expertModeText"
        :inactive-text="simplifiedModeText"
        :active-icon="Setting"
        :inactive-icon="User"
        :size="size"
        :disabled="disabled || loading"
        :loading="loading"
        class="mode-switch"
      />

      <!-- 模式说明图标 -->
      <el-tooltip
        :content="modeTooltipContent"
        placement="bottom"
        :show-after="500"
      >
        <el-icon class="mode-info-icon" :size="16">
          <QuestionFilled />
        </el-icon>
      </el-tooltip>

      <!-- 测试模式指示器 -->
      <el-tag
        v-if="showBetaTag"
        type="warning"
        size="small"
        class="beta-tag"
      >
        Beta
      </el-tag>
    </div>

    <!-- 详细模式说明 -->
    <div v-if="showDescription" class="mode-description">
      <div class="current-mode-info">
        <el-icon :size="14">
          <component :is="currentModeIcon" />
        </el-icon>
        <span class="mode-name">{{ currentModeDisplayName }}</span>
        <span class="mode-detail">{{ currentModeDescription }}</span>
      </div>

      <!-- 功能数量统计 -->
      <div v-if="showFeatureCount" class="feature-count">
        <span class="count-text">
          可用功能: {{ availableFeatureCount }}/{{ totalFeatureCount }}
        </span>
        <el-progress
          :percentage="featureAccessPercentage"
          :stroke-width="4"
          :show-text="false"
          :color="progressColor"
          class="feature-progress"
        />
      </div>
    </div>

    <!-- 模式切换确认对话框 -->
    <el-dialog
      v-model="showConfirmDialog"
      title="切换模式确认"
      width="400px"
      :before-close="handleDialogClose"
    >
      <div class="confirm-content">
        <el-icon :size="20" class="confirm-icon">
          <component :is="targetModeIcon" />
        </el-icon>
        <div class="confirm-text">
          <h4>{{ confirmTitle }}</h4>
          <p>{{ confirmMessage }}</p>
          <div v-if="showFeaturePreview" class="feature-preview">
            <p class="preview-title">{{ previewTitle }}</p>
            <ul class="feature-list">
              <li
                v-for="feature in previewFeatures"
                :key="feature.id"
                class="feature-item"
              >
                <el-icon :size="12">
                  <Check v-if="feature.available" />
                  <Plus v-else />
                </el-icon>
                {{ feature.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelModeChange">取消</el-button>
          <el-button
            type="primary"
            @click="confirmModeChange"
            :loading="loading"
          >
            确认切换
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Setting, User, QuestionFilled, Check, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFeatureManifest, getCoreFeatures, getExpertFeatures } from '@/utils/featureManifest'

interface Props {
  currentMode: 'simplified' | 'expert'
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  loading?: boolean
  showDescription?: boolean
  showFeatureCount?: boolean
  showConfirmDialog?: boolean
  showBetaTag?: boolean
  featureScope?: string
}

interface Emits {
  (e: 'mode-change', mode: 'simplified' | 'expert'): void
  (e: 'mode-switch-start', mode: 'simplified' | 'expert'): void
  (e: 'mode-switch-complete', mode: 'simplified' | 'expert'): void
  (e: 'mode-switch-cancel', targetMode: 'simplified' | 'expert'): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  disabled: false,
  loading: false,
  showDescription: true,
  showFeatureCount: true,
  showConfirmDialog: false,
  showBetaTag: false,
  featureScope: 'global'
})

const emit = defineEmits<Emits>()

// Local state
const showConfirmDialog = ref(false)
const pendingMode = ref<'simplified' | 'expert' | null>(null)

// Computed properties
const isExpertMode = computed(() => props.currentMode === 'expert')

const expertModeText = computed(() => '专家模式')
const simplifiedModeText = computed(() => '简洁模式')

const currentModeIcon = computed(() => {
  return isExpertMode.value ? Setting : User
})

const targetModeIcon = computed(() => {
  return pendingMode.value === 'expert' ? Setting : User
})

const currentModeDisplayName = computed(() => {
  return isExpertMode.value ? '专家模式' : '简洁模式'
})

const currentModeDescription = computed(() => {
  return isExpertMode.value
    ? '显示所有高级功能和详细控制选项'
    : '只显示核心功能，界面更加简洁清爽'
})

const modeTooltipContent = computed(() => {
  const oppositeMode = isExpertMode.value ? '简洁模式' : '专家模式'
  const oppositeDesc = isExpertMode.value
    ? '隐藏高级功能，专注核心体验'
    : '显示所有功能，获得完整控制权'

  return `当前: ${currentModeDisplayName.value}\n${currentModeDescription.value}\n\n点击切换到 ${oppositeMode}:\n${oppositeDesc}`
})

// Feature count calculations
const allFeatures = computed(() => getFeatureManifest(props.featureScope))
const coreFeatures = computed(() => getCoreFeatures())
const expertFeatures = computed(() => getExpertFeatures())

const availableFeatureCount = computed(() => {
  if (isExpertMode.value) {
    return allFeatures.value.length
  } else {
    return coreFeatures.value.length
  }
})

const totalFeatureCount = computed(() => allFeatures.value.length)

const featureAccessPercentage = computed(() => {
  return Math.round((availableFeatureCount.value / totalFeatureCount.value) * 100)
})

const progressColor = computed(() => {
  const percentage = featureAccessPercentage.value
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#909399'
})

// Confirm dialog content
const confirmTitle = computed(() => {
  return pendingMode.value === 'expert' ? '切换到专家模式' : '切换到简洁模式'
})

const confirmMessage = computed(() => {
  if (pendingMode.value === 'expert') {
    return '专家模式将显示所有高级功能和设置选项，界面会更加复杂但功能更全面。'
  } else {
    return '简洁模式将隐藏大部分高级功能，只保留核心功能，界面更加简洁易用。'
  }
})

const showFeaturePreview = computed(() => {
  return pendingMode.value !== null
})

const previewTitle = computed(() => {
  return pendingMode.value === 'expert' ? '将新增的功能:' : '将隐藏的功能:'
})

const previewFeatures = computed(() => {
  if (!pendingMode.value) return []

  if (pendingMode.value === 'expert') {
    // 显示将要新增的专家功能
    return expertFeatures.value
      .filter(f => props.featureScope === 'global' || f.scope.includes(props.featureScope))
      .slice(0, 6) // 最多显示6个
      .map(f => ({
        id: f.id,
        name: f.name,
        available: false
      }))
  } else {
    // 显示将要隐藏的专家功能
    return expertFeatures.value
      .filter(f => props.featureScope === 'global' || f.scope.includes(props.featureScope))
      .slice(0, 6) // 最多显示6个
      .map(f => ({
        id: f.id,
        name: f.name,
        available: true
      }))
  }
})

// Methods
const handleModeChange = (value: boolean) => {
  const targetMode = value ? 'expert' : 'simplified'

  // 如果目标模式与当前模式相同，忽略
  if (targetMode === props.currentMode) return

  emit('mode-switch-start', targetMode)

  if (props.showConfirmDialog) {
    // 显示确认对话框
    pendingMode.value = targetMode
    showConfirmDialog.value = true
  } else {
    // 直接切换
    performModeChange(targetMode)
  }
}

const performModeChange = (mode: 'simplified' | 'expert') => {
  emit('mode-change', mode)

  // 显示切换成功消息
  const modeText = mode === 'expert' ? '专家模式' : '简洁模式'
  ElMessage.success(`已切换到${modeText}`)

  emit('mode-switch-complete', mode)
}

const confirmModeChange = () => {
  if (pendingMode.value) {
    performModeChange(pendingMode.value)
    closeConfirmDialog()
  }
}

const cancelModeChange = () => {
  if (pendingMode.value) {
    emit('mode-switch-cancel', pendingMode.value)
  }
  closeConfirmDialog()
}

const closeConfirmDialog = () => {
  showConfirmDialog.value = false
  pendingMode.value = null
}

const handleDialogClose = (done: () => void) => {
  cancelModeChange()
  done()
}
</script>

<style scoped lang="scss">
.mode-switch-container {
  .mode-switch-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-border-color);
    }

    .mode-switch {
      flex-shrink: 0;

      :deep(.el-switch__label) {
        font-size: 13px;
        color: var(--el-text-color-regular);
      }

      :deep(.el-switch__label.is-active) {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }

    .mode-info-icon {
      color: var(--el-text-color-secondary);
      cursor: help;
      transition: color 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
      }
    }

    .beta-tag {
      font-size: 10px;
      padding: 2px 6px;
    }
  }

  .mode-description {
    margin-top: 12px;
    padding: 12px 16px;
    background: var(--el-bg-color-page);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-extra-light);

    .current-mode-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .mode-name {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .mode-detail {
        font-size: 13px;
        color: var(--el-text-color-regular);
      }
    }

    .feature-count {
      display: flex;
      align-items: center;
      gap: 12px;

      .count-text {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        min-width: 100px;
      }

      .feature-progress {
        flex: 1;
        max-width: 120px;
      }
    }
  }
}

// 确认对话框样式
.confirm-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;

  .confirm-icon {
    color: var(--el-color-primary);
    margin-top: 2px;
    flex-shrink: 0;
  }

  .confirm-text {
    flex: 1;

    h4 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 16px;
    }

    p {
      margin: 0 0 12px 0;
      color: var(--el-text-color-regular);
      line-height: 1.5;
    }

    .feature-preview {
      margin-top: 16px;
      padding: 12px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      .preview-title {
        margin: 0 0 8px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .feature-list {
        margin: 0;
        padding-left: 0;
        list-style: none;

        .feature-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 0;
          font-size: 12px;
          color: var(--el-text-color-regular);

          .el-icon {
            color: var(--el-color-success);
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .mode-switch-container {
    .mode-switch-wrapper {
      padding: 10px 12px;
      gap: 8px;

      .mode-switch {
        :deep(.el-switch__label) {
          font-size: 12px;
        }
      }
    }

    .mode-description {
      padding: 10px 12px;

      .current-mode-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .feature-count {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;

        .feature-progress {
          max-width: none;
          width: 100%;
        }
      }
    }
  }
}

// 暗色主题适配
.dark {
  .mode-switch-container {
    .mode-switch-wrapper {
      background: var(--el-fill-color-dark);
      border-color: var(--el-border-color-darker);

      &:hover {
        background: var(--el-fill-color);
      }
    }

    .mode-description {
      background: var(--el-bg-color-page);
      border-color: var(--el-border-color-dark);
    }
  }
}
</style>