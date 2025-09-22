<template>
  <div class="progressive-disclosure-test-page">
    <PageHeader title="渐进式披露系统测试" />

    <div class="test-container">
      <!-- 控制面板 -->
      <el-card class="control-panel" header="测试控制面板">
        <div class="control-section">
          <h4>用户体验模拟</h4>
          <div class="control-grid">
            <div class="control-item">
              <label>会话次数:</label>
              <el-input-number
                v-model="mockExperience.totalSessions"
                :min="0"
                :max="100"
                size="small"
                @change="updateExperience"
              />
            </div>
            <div class="control-item">
              <label>消息数量:</label>
              <el-input-number
                v-model="mockExperience.messagesCount"
                :min="0"
                :max="1000"
                size="small"
                @change="updateExperience"
              />
            </div>
            <div class="control-item">
              <label>使用角色:</label>
              <el-input-number
                v-model="mockExperience.charactersUsed"
                :min="0"
                :max="50"
                size="small"
                @change="updateExperience"
              />
            </div>
            <div class="control-item">
              <label>技能等级:</label>
              <el-select
                v-model="mockExperience.skillLevel"
                size="small"
                @change="updateExperience"
              >
                <el-option label="新手" value="beginner" />
                <el-option label="中级" value="intermediate" />
                <el-option label="高级" value="advanced" />
                <el-option label="专家" value="expert" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="control-section">
          <h4>测试操作</h4>
          <div class="action-buttons">
            <el-button @click="triggerFeatureUnlock" type="primary">
              触发功能解锁
            </el-button>
            <el-button @click="showUpgradeSuggestion" type="success">
              显示升级建议
            </el-button>
            <el-button @click="resetUserData" type="warning">
              重置用户数据
            </el-button>
            <el-button @click="toggleTestMode" :type="testMode ? 'danger' : 'info'">
              {{ testMode ? '退出测试模式' : '进入测试模式' }}
            </el-button>
          </div>
        </div>

        <div class="control-section">
          <h4>当前状态</h4>
          <div class="status-info">
            <p><strong>当前模式:</strong> {{ currentMode === 'expert' ? '专家模式' : '简洁模式' }}</p>
            <p><strong>应该建议升级:</strong> {{ shouldSuggestUpgrade ? '是' : '否' }}</p>
            <p><strong>已解锁功能:</strong> {{ unlockedFeatures.length }}</p>
            <p><strong>待通知功能:</strong> {{ pendingNotifications.length }}</p>
          </div>
        </div>
      </el-card>

      <!-- 功能范围测试 -->
      <div class="feature-scope-tests">
        <h3>不同功能范围测试</h3>

        <!-- 角色发现范围 -->
        <el-card class="scope-card" header="角色发现功能 (character-discovery)">
          <ProgressiveDisclosure
            feature-scope="character-discovery"
            :allow-mode-switch="true"
            :show-upgrade-suggestions="true"
          >
            <template #default="{ visibleFeatures, featureState, currentMode }">
              <div class="feature-demo">
                <h4>当前可见功能 ({{ currentMode }}):</h4>
                <div class="feature-list">
                  <div
                    v-for="feature in visibleFeatures"
                    :key="feature.id"
                    class="feature-item"
                    :class="{
                      'expert-feature': feature.isExpertFeature,
                      'highlighted': featureState.get(feature.id)?.highlighted
                    }"
                  >
                    <div class="feature-info">
                      <span class="feature-name">{{ feature.name }}</span>
                      <span class="feature-category">{{ feature.category }}</span>
                    </div>
                    <div class="feature-status">
                      <el-tag
                        :type="featureState.get(feature.id)?.enabled ? 'success' : 'info'"
                        size="small"
                      >
                        {{ featureState.get(feature.id)?.enabled ? '已启用' : '未启用' }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </ProgressiveDisclosure>
        </el-card>

        <!-- 聊天功能范围 -->
        <el-card class="scope-card" header="聊天功能 (chat)">
          <ProgressiveDisclosure
            feature-scope="chat"
            :allow-mode-switch="false"
            :show-upgrade-suggestions="false"
          >
            <template #default="{ visibleFeatures, featureState, currentMode }">
              <div class="feature-demo">
                <h4>当前可见功能 ({{ currentMode }}):</h4>
                <div class="feature-list">
                  <div
                    v-for="feature in visibleFeatures"
                    :key="feature.id"
                    class="feature-item"
                    :class="{
                      'expert-feature': feature.isExpertFeature,
                      'highlighted': featureState.get(feature.id)?.highlighted
                    }"
                  >
                    <div class="feature-info">
                      <span class="feature-name">{{ feature.name }}</span>
                      <span class="feature-description">{{ feature.simpleDescription }}</span>
                    </div>
                    <div class="feature-actions">
                      <el-button
                        v-if="!featureState.get(feature.id)?.enabled"
                        size="small"
                        @click="unlockFeature(feature.id)"
                      >
                        解锁
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </ProgressiveDisclosure>
        </el-card>

        <!-- 角色创建范围 -->
        <el-card class="scope-card" header="角色创建功能 (character-creation)">
          <ProgressiveDisclosure
            feature-scope="character-creation"
            :allow-mode-switch="true"
            :show-upgrade-suggestions="true"
          >
            <template #default="{ visibleFeatures, featureState, unlockFeature }">
              <div class="feature-demo">
                <div class="feature-grid">
                  <div
                    v-for="feature in visibleFeatures"
                    :key="feature.id"
                    class="feature-card"
                    :class="{
                      'expert-feature': feature.isExpertFeature,
                      'enabled': featureState.get(feature.id)?.enabled,
                      'highlighted': featureState.get(feature.id)?.highlighted
                    }"
                  >
                    <div class="card-header">
                      <h5>{{ feature.name }}</h5>
                      <el-tag
                        :type="feature.category === 'core' ? 'info' :
                               feature.category === 'advanced' ? 'success' : 'warning'"
                        size="small"
                      >
                        {{ feature.category }}
                      </el-tag>
                    </div>
                    <p class="card-description">{{ featureState.get(feature.id)?.description }}</p>
                    <div class="card-actions">
                      <el-button
                        v-if="!featureState.get(feature.id)?.enabled"
                        size="small"
                        type="primary"
                        @click="unlockFeature(feature.id)"
                      >
                        尝试解锁
                      </el-button>
                      <el-button
                        v-else
                        size="small"
                        disabled
                      >
                        已启用
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </ProgressiveDisclosure>
        </el-card>
      </div>

      <!-- 独立组件测试 -->
      <div class="component-tests">
        <h3>独立组件测试</h3>

        <!-- 模式切换器测试 -->
        <el-card class="component-card" header="模式切换器组件">
          <ModeSwitch
            :current-mode="currentMode"
            :show-description="true"
            :show-feature-count="true"
            :show-confirm-dialog="true"
            :show-beta-tag="true"
            @mode-change="handleModeChange"
          />
        </el-card>

        <!-- 升级建议测试 -->
        <el-card class="component-card" header="升级建议组件">
          <UpgradeSuggestion
            v-if="showUpgradeTest"
            suggestion-text="您已经使用了多个高级功能，准备体验专家模式的完整功能了！"
            suggestion-reason="已进行15次会话，发送120条消息，使用8个角色"
            :show-reason="true"
            :show-feature-preview="true"
            :show-stats="true"
            :show-extra-info="true"
            @upgrade="handleTestUpgrade"
            @dismiss="handleTestDismiss"
          />
          <el-button v-else @click="showUpgradeTest = true" type="primary">
            显示升级建议
          </el-button>
        </el-card>

        <!-- 解锁通知测试 -->
        <el-card class="component-card" header="功能解锁通知组件">
          <div class="notification-test-buttons">
            <el-button
              v-for="testFeature in testFeatures"
              :key="testFeature.id"
              @click="showUnlockNotification(testFeature)"
              size="small"
            >
              解锁 {{ testFeature.name }}
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 测试结果面板 -->
    <el-card class="results-panel" header="测试结果">
      <div class="results-content">
        <h4>操作日志:</h4>
        <div class="log-container">
          <div
            v-for="(log, index) in testLogs"
            :key="index"
            class="log-item"
            :class="`log-${log.type}`"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
        <div class="log-actions">
          <el-button @click="clearLogs" size="small">清空日志</el-button>
          <el-button @click="exportLogs" size="small" type="primary">导出日志</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import ProgressiveDisclosure from '@/components/progressive/ProgressiveDisclosure.vue'
import ModeSwitch from '@/components/progressive/ModeSwitch.vue'
import UpgradeSuggestion from '@/components/progressive/UpgradeSuggestion.vue'
import FeatureUnlockNotification from '@/components/progressive/FeatureUnlockNotification.vue'
import { useUserModeStore } from '@/stores/userModeStore'
import { getFeatureManifest, getFeatureById } from '@/utils/featureManifest'
import type { UserExperience } from '@/stores/userModeStore'

// Store
const userModeStore = useUserModeStore()

// Local state
const testMode = ref(false)
const showUpgradeTest = ref(false)
const testLogs = ref<Array<{ time: string; message: string; type: string }>>([])

const mockExperience = ref<UserExperience>({
  totalSessions: 5,
  messagesCount: 50,
  charactersUsed: 3,
  featuresUsed: ['character-basic-browse', 'chat-basic'],
  expertFeaturesUsed: [],
  lastActiveDate: new Date(),
  skillLevel: 'beginner'
})

// Computed
const currentMode = computed(() => userModeStore.currentMode)
const shouldSuggestUpgrade = computed(() => userModeStore.shouldSuggestModeUpgrade)
const unlockedFeatures = computed(() => userModeStore.featureUnlocks)
const pendingNotifications = computed(() => userModeStore.getUnlockNotifications())

const testFeatures = computed(() => [
  getFeatureById('character-advanced-search'),
  getFeatureById('chat-message-editing'),
  getFeatureById('character-ai-generation'),
  getFeatureById('worldinfo-basic')
].filter(Boolean))

// Methods
const addLog = (message: string, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  testLogs.value.unshift({ time, message, type })
  if (testLogs.value.length > 50) {
    testLogs.value = testLogs.value.slice(0, 50)
  }
}

const updateExperience = async () => {
  if (testMode.value) {
    // 在测试模式下直接更新store状态
    Object.assign(userModeStore.userExperience, mockExperience.value)
    userModeStore.updateSkillLevel()
    addLog(`更新用户体验数据: 会话${mockExperience.value.totalSessions}次, 消息${mockExperience.value.messagesCount}条`, 'success')
  }
}

const triggerFeatureUnlock = async () => {
  const features = ['character-advanced-search', 'chat-message-editing', 'worldinfo-basic']
  const randomFeature = features[Math.floor(Math.random() * features.length)]

  if (!userModeStore.isFeatureUnlocked(randomFeature)) {
    await userModeStore.recordFeatureUsage(randomFeature, true)
    addLog(`触发功能解锁: ${randomFeature}`, 'success')
  } else {
    addLog(`功能 ${randomFeature} 已经解锁`, 'warning')
  }
}

const showUpgradeSuggestion = () => {
  showUpgradeTest.value = true
  addLog('显示升级建议组件', 'info')
}

const resetUserData = async () => {
  await userModeStore.resetUserModeData()
  mockExperience.value = {
    totalSessions: 0,
    messagesCount: 0,
    charactersUsed: 0,
    featuresUsed: [],
    expertFeaturesUsed: [],
    lastActiveDate: new Date(),
    skillLevel: 'beginner'
  }
  addLog('重置用户数据完成', 'warning')
}

const toggleTestMode = () => {
  testMode.value = !testMode.value
  if (testMode.value) {
    addLog('进入测试模式 - 可以直接修改用户体验数据', 'info')
  } else {
    addLog('退出测试模式', 'info')
  }
}

const handleModeChange = async (mode: 'simplified' | 'expert') => {
  const success = await userModeStore.switchMode(mode, 'test-mode-change')
  if (success) {
    addLog(`模式切换成功: ${mode}`, 'success')
  } else {
    addLog(`模式切换失败: ${mode}`, 'error')
  }
}

const unlockFeature = async (featureId: string) => {
  await userModeStore.recordFeatureUsage(featureId, true)
  addLog(`手动解锁功能: ${featureId}`, 'success')
}

const handleTestUpgrade = () => {
  handleModeChange('expert')
  showUpgradeTest.value = false
  addLog('通过升级建议切换到专家模式', 'success')
}

const handleTestDismiss = (hours?: number) => {
  showUpgradeTest.value = false
  addLog(`关闭升级建议${hours ? `, ${hours}小时后再提醒` : ''}`, 'info')
}

const showUnlockNotification = (feature: any) => {
  if (!feature) return

  // 创建通知组件实例
  const notification = document.createElement('div')
  document.body.appendChild(notification)

  // 这里应该动态创建FeatureUnlockNotification组件
  // 为了演示，我们使用ElMessage
  ElMessage({
    type: 'success',
    message: `🎉 解锁新功能: ${feature.name}`,
    duration: 3000
  })

  addLog(`显示解锁通知: ${feature.name}`, 'info')
}

const clearLogs = () => {
  testLogs.value = []
  addLog('清空日志', 'info')
}

const exportLogs = () => {
  const logText = testLogs.value
    .map(log => `[${log.time}] ${log.type.toUpperCase()}: ${log.message}`)
    .join('\n')

  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `progressive-disclosure-test-${Date.now()}.log`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  addLog('导出测试日志', 'success')
}

// Lifecycle
onMounted(() => {
  addLog('渐进式披露测试页面初始化完成', 'info')
})
</script>

<style scoped lang="scss">
.progressive-disclosure-test-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;

  .test-container {
    display: grid;
    gap: 20px;
    margin-top: 20px;

    .control-panel {
      .control-section {
        margin-bottom: 20px;

        h4 {
          margin: 0 0 12px 0;
          color: var(--el-text-color-primary);
          font-size: 14px;
          font-weight: 600;
        }

        .control-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;

          .control-item {
            display: flex;
            flex-direction: column;
            gap: 4px;

            label {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              font-weight: 500;
            }
          }
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .status-info {
          font-size: 13px;
          line-height: 1.6;

          p {
            margin: 4px 0;
          }

          strong {
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .feature-scope-tests {
      h3 {
        margin: 0 0 16px 0;
        color: var(--el-text-color-primary);
      }

      .scope-card {
        margin-bottom: 16px;

        .feature-demo {
          .feature-list {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .feature-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px;
              background: var(--el-fill-color-extra-light);
              border-radius: 6px;
              border: 1px solid transparent;
              transition: all 0.3s ease;

              &.expert-feature {
                border-left: 3px solid var(--el-color-primary);
                background: var(--el-color-primary-light-9);
              }

              &.highlighted {
                animation: featureHighlight 2s ease-in-out;
              }

              .feature-info {
                flex: 1;

                .feature-name {
                  display: block;
                  font-weight: 600;
                  color: var(--el-text-color-primary);
                  margin-bottom: 2px;
                }

                .feature-category,
                .feature-description {
                  font-size: 12px;
                  color: var(--el-text-color-secondary);
                }
              }
            }
          }

          .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;

            .feature-card {
              padding: 16px;
              border: 1px solid var(--el-border-color-lighter);
              border-radius: 8px;
              background: var(--el-bg-color);
              transition: all 0.3s ease;

              &.expert-feature {
                border-left: 4px solid var(--el-color-warning);
              }

              &.enabled {
                border-color: var(--el-color-success);
                background: var(--el-color-success-light-9);
              }

              &.highlighted {
                border-color: var(--el-color-primary);
                box-shadow: 0 0 10px var(--el-color-primary-light-8);
              }

              .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                h5 {
                  margin: 0;
                  font-size: 14px;
                  color: var(--el-text-color-primary);
                }
              }

              .card-description {
                margin: 0 0 12px 0;
                font-size: 13px;
                color: var(--el-text-color-regular);
                line-height: 1.4;
              }

              .card-actions {
                display: flex;
                justify-content: flex-end;
              }
            }
          }
        }
      }
    }

    .component-tests {
      h3 {
        margin: 0 0 16px 0;
        color: var(--el-text-color-primary);
      }

      .component-card {
        margin-bottom: 16px;

        .notification-test-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      }
    }

    .results-panel {
      .results-content {
        h4 {
          margin: 0 0 12px 0;
          color: var(--el-text-color-primary);
          font-size: 14px;
        }

        .log-container {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 4px;
          padding: 8px;
          background: var(--el-fill-color-extra-light);
          font-family: 'Courier New', monospace;
          font-size: 12px;

          .log-item {
            display: flex;
            gap: 8px;
            padding: 2px 0;
            border-bottom: 1px solid var(--el-border-color-extra-light);

            &:last-child {
              border-bottom: none;
            }

            .log-time {
              color: var(--el-text-color-secondary);
              flex-shrink: 0;
              width: 80px;
            }

            .log-message {
              flex: 1;
            }

            &.log-success .log-message {
              color: var(--el-color-success);
            }

            &.log-warning .log-message {
              color: var(--el-color-warning);
            }

            &.log-error .log-message {
              color: var(--el-color-error);
            }

            &.log-info .log-message {
              color: var(--el-text-color-primary);
            }
          }
        }

        .log-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
      }
    }
  }
}

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
  .progressive-disclosure-test-page {
    padding: 10px;

    .test-container {
      .control-panel {
        .control-section {
          .control-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;

            .el-button {
              width: 100%;
            }
          }
        }
      }

      .feature-scope-tests {
        .scope-card {
          .feature-demo {
            .feature-grid {
              grid-template-columns: 1fr;
            }
          }
        }
      }
    }
  }
}
</style>