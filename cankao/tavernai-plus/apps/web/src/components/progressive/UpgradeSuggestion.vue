<template>
  <div class="upgrade-suggestion-container">
    <el-alert
      :title="alertTitle"
      :type="alertType"
      :description="suggestionText"
      :show-icon="true"
      :closable="closable"
      @close="handleClose"
      class="upgrade-alert"
    >
      <template #default>
        <div class="suggestion-content">
          <!-- 主要内容 -->
          <div class="suggestion-main">
            <div class="suggestion-header">
              <el-icon class="suggestion-icon" :size="20">
                <component :is="suggestionIcon" />
              </el-icon>
              <div class="suggestion-text">
                <h4 class="suggestion-title">{{ alertTitle }}</h4>
                <p class="suggestion-description">{{ suggestionText }}</p>
              </div>
            </div>

            <!-- 解锁理由展示 -->
            <div v-if="showReason && suggestionReason" class="suggestion-reason">
              <div class="reason-header">
                <el-icon :size="14">
                  <InfoFilled />
                </el-icon>
                <span class="reason-title">解锁原因:</span>
              </div>
              <p class="reason-text">{{ suggestionReason }}</p>
            </div>

            <!-- 功能预览 -->
            <div v-if="showFeaturePreview" class="feature-preview">
              <h5 class="preview-title">专家模式新增功能预览:</h5>
              <div class="preview-grid">
                <div
                  v-for="feature in previewFeatures"
                  :key="feature.id"
                  class="preview-feature"
                >
                  <el-icon :size="16" class="feature-icon">
                    <component :is="feature.icon" />
                  </el-icon>
                  <div class="feature-info">
                    <span class="feature-name">{{ feature.name }}</span>
                    <span class="feature-desc">{{ feature.description }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 用户统计 -->
            <div v-if="showStats" class="user-stats">
              <div class="stats-header">
                <el-icon :size="14">
                  <DataAnalysis />
                </el-icon>
                <span class="stats-title">您的使用统计:</span>
              </div>
              <div class="stats-grid">
                <div
                  v-for="stat in userStats"
                  :key="stat.key"
                  class="stat-item"
                  :class="{ highlighted: stat.highlighted }"
                >
                  <span class="stat-value">{{ stat.value }}</span>
                  <span class="stat-label">{{ stat.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="suggestion-actions">
            <el-button
              type="primary"
              @click="handleUpgrade"
              :loading="upgradeLoading"
              :icon="Promotion"
              class="upgrade-button"
            >
              {{ upgradeButtonText }}
            </el-button>

            <el-dropdown @command="handleDismissOption" class="dismiss-dropdown">
              <el-button :icon="Clock">
                {{ dismissButtonText }}
                <el-icon class="el-icon--right">
                  <ArrowDown />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="1h">1小时后提醒</el-dropdown-item>
                  <el-dropdown-item command="1d">明天提醒</el-dropdown-item>
                  <el-dropdown-item command="3d">3天后提醒</el-dropdown-item>
                  <el-dropdown-item command="1w">一周后提醒</el-dropdown-item>
                  <el-dropdown-item command="never">不再提醒</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
    </el-alert>

    <!-- 额外信息卡片 -->
    <div v-if="showExtraInfo" class="extra-info-card">
      <div class="info-header">
        <el-icon :size="16">
          <Lightbulb />
        </el-icon>
        <span class="info-title">专家模式的优势</span>
      </div>
      <ul class="advantage-list">
        <li
          v-for="advantage in expertAdvantages"
          :key="advantage"
          class="advantage-item"
        >
          <el-icon :size="12">
            <Check />
          </el-icon>
          {{ advantage }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Promotion,
  Clock,
  ArrowDown,
  InfoFilled,
  DataAnalysis,
  Lightbulb,
  Check,
  Setting,
  ChatRound,
  Magic,
  Star,
  Document,
  Trophy
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Props {
  suggestionText: string
  suggestionReason?: string
  showReason?: boolean
  showFeaturePreview?: boolean
  showStats?: boolean
  showExtraInfo?: boolean
  closable?: boolean
  alertType?: 'info' | 'success' | 'warning' | 'error'
  upgradeButtonText?: string
  dismissButtonText?: string
}

interface Emits {
  (e: 'upgrade'): void
  (e: 'dismiss', hours?: number): void
  (e: 'never-show'): void
}

const props = withDefaults(defineProps<Props>(), {
  showReason: true,
  showFeaturePreview: true,
  showStats: true,
  showExtraInfo: false,
  closable: true,
  alertType: 'info',
  upgradeButtonText: '立即升级到专家模式',
  dismissButtonText: '稍后提醒'
})

const emit = defineEmits<Emits>()

// Local state
const upgradeLoading = ref(false)

// Computed properties
const alertTitle = computed(() => '🌟 准备体验专家模式了吗？')

const suggestionIcon = computed(() => {
  const typeIcons = {
    info: Star,
    success: Trophy,
    warning: Promotion,
    error: InfoFilled
  }
  return typeIcons[props.alertType] || Star
})

const previewFeatures = computed(() => [
  {
    id: 'chat-ai-model',
    name: 'AI模型选择',
    description: '切换不同AI模型',
    icon: Setting
  },
  {
    id: 'chat-editing',
    name: '消息编辑',
    description: '编辑和重发消息',
    icon: ChatRound
  },
  {
    id: 'character-ai-gen',
    name: 'AI角色生成',
    description: 'AI辅助创建角色',
    icon: Magic
  },
  {
    id: 'advanced-search',
    name: '高级搜索',
    description: '多维度搜索筛选',
    icon: Star
  },
  {
    id: 'chat-export',
    name: '对话导出',
    description: '导出聊天记录',
    icon: Document
  },
  {
    id: 'worldinfo-dynamic',
    name: '动态世界观',
    description: '智能背景信息',
    icon: Magic
  }
])

const userStats = computed(() => {
  // 这里应该从props或store中获取实际数据
  // 暂时使用模拟数据
  return [
    {
      key: 'sessions',
      value: '15',
      label: '会话次数',
      highlighted: true
    },
    {
      key: 'messages',
      value: '120',
      label: '发送消息',
      highlighted: true
    },
    {
      key: 'characters',
      value: '8',
      label: '使用角色',
      highlighted: false
    },
    {
      key: 'features',
      value: '12',
      label: '已用功能',
      highlighted: true
    }
  ]
})

const expertAdvantages = computed(() => [
  '完整的AI模型选择和参数调节',
  '高级对话编辑和分支功能',
  'AI辅助的角色创建和优化',
  '强大的搜索和筛选工具',
  '详细的统计和数据分析',
  '专业的导出和分享功能'
])

// Methods
const handleUpgrade = async () => {
  upgradeLoading.value = true
  try {
    emit('upgrade')
    ElMessage.success('正在切换到专家模式...')
  } finally {
    upgradeLoading.value = false
  }
}

const handleDismissOption = (command: string) => {
  let hours: number | undefined

  switch (command) {
    case '1h':
      hours = 1
      ElMessage.info('1小时后将再次提醒您')
      break
    case '1d':
      hours = 24
      ElMessage.info('明天将再次提醒您')
      break
    case '3d':
      hours = 72
      ElMessage.info('3天后将再次提醒您')
      break
    case '1w':
      hours = 168
      ElMessage.info('一周后将再次提醒您')
      break
    case 'never':
      emit('never-show')
      ElMessage.info('已关闭专家模式升级提醒')
      return
  }

  emit('dismiss', hours)
}

const handleClose = () => {
  emit('dismiss', 24) // 默认24小时后再提醒
}
</script>

<style scoped lang="scss">
.upgrade-suggestion-container {
  .upgrade-alert {
    margin-bottom: 16px;

    :deep(.el-alert__content) {
      width: 100%;
    }

    :deep(.el-alert__description) {
      display: none; // 隐藏默认描述，使用自定义内容
    }
  }

  .suggestion-content {
    .suggestion-main {
      margin-bottom: 20px;

      .suggestion-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;

        .suggestion-icon {
          color: var(--el-color-primary);
          margin-top: 2px;
          flex-shrink: 0;
        }

        .suggestion-text {
          flex: 1;

          .suggestion-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .suggestion-description {
            margin: 0;
            color: var(--el-text-color-regular);
            line-height: 1.6;
            font-size: 14px;
          }
        }
      }

      .suggestion-reason {
        margin-bottom: 16px;
        padding: 12px;
        background: var(--el-fill-color-lighter);
        border-radius: 6px;
        border-left: 3px solid var(--el-color-primary);

        .reason-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;

          .reason-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .reason-text {
          margin: 0;
          font-size: 13px;
          color: var(--el-text-color-regular);
          line-height: 1.5;
        }
      }

      .feature-preview {
        margin-bottom: 16px;

        .preview-title {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;

          .preview-feature {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: var(--el-fill-color-extra-light);
            border-radius: 6px;
            transition: all 0.3s ease;

            &:hover {
              background: var(--el-fill-color-light);
              transform: translateY(-1px);
            }

            .feature-icon {
              color: var(--el-color-primary);
              flex-shrink: 0;
            }

            .feature-info {
              flex: 1;
              min-width: 0;

              .feature-name {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                margin-bottom: 2px;
              }

              .feature-desc {
                display: block;
                font-size: 11px;
                color: var(--el-text-color-secondary);
                line-height: 1.3;
              }
            }
          }
        }
      }

      .user-stats {
        .stats-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;

          .stats-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            background: var(--el-fill-color-extra-light);
            border-radius: 6px;
            transition: all 0.3s ease;

            &.highlighted {
              background: var(--el-color-primary-light-9);
              border: 1px solid var(--el-color-primary-light-7);
            }

            .stat-value {
              font-size: 18px;
              font-weight: 700;
              color: var(--el-color-primary);
              margin-bottom: 2px;
            }

            .stat-label {
              font-size: 11px;
              color: var(--el-text-color-secondary);
              text-align: center;
            }
          }
        }
      }
    }

    .suggestion-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: flex-end;

      .upgrade-button {
        font-weight: 600;
      }

      .dismiss-dropdown {
        .el-button {
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .extra-info-card {
    padding: 16px;
    background: var(--el-color-info-light-9);
    border: 1px solid var(--el-color-info-light-7);
    border-radius: 8px;

    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .info-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .advantage-list {
      margin: 0;
      padding: 0;
      list-style: none;

      .advantage-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        font-size: 13px;
        color: var(--el-text-color-regular);

        .el-icon {
          color: var(--el-color-success);
          flex-shrink: 0;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .upgrade-suggestion-container {
    .suggestion-content {
      .suggestion-main {
        .feature-preview {
          .preview-grid {
            grid-template-columns: 1fr;
          }
        }

        .user-stats {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      }

      .suggestion-actions {
        flex-direction: column;
        align-items: stretch;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}

// 暗色主题
.dark {
  .upgrade-suggestion-container {
    .extra-info-card {
      background: var(--el-fill-color-dark);
      border-color: var(--el-border-color-darker);
    }
  }
}
</style>