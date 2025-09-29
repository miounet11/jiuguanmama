<template>
  <div class="gamification-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="page-title">时空酒馆</h1>
        <p class="page-subtitle">与AI角色的深度对话，解锁更多精彩体验</p>
      </div>

      <!-- 快速统计 -->
      <div class="header-stats">
        <div class="stat-card">
          <div class="stat-value">{{ gamificationStore.totalAffinityLevel }}</div>
          <div class="stat-label">总亲密度等级</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ gamificationStore.completedScenariosCount }}</div>
          <div class="stat-label">完成剧本数</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ gamificationStore.achievements.length }}</div>
          <div class="stat-label">获得成就</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="dashboard-content">
      <!-- 左侧：角色亲密度区域 -->
      <div class="left-panel">
        <div class="panel-header">
          <h2 class="panel-title">
            <el-icon><User /></el-icon>
            我的角色
          </h2>
          <el-button type="primary" size="small" @click="showCharacterSelector = true">
            <el-icon><Plus /></el-icon>
            选择角色
          </el-button>
        </div>

        <div class="character-grid">
          <CharacterAffinityCard
            v-for="affinity in gamificationStore.favoriteCharacters"
            :key="affinity.id"
            :affinity="affinity"
            @chat="handleCharacterChat"
          />

          <div
            v-if="gamificationStore.favoriteCharacters.length === 0"
            class="empty-state"
          >
            <el-icon size="48" class="empty-icon">
              <User />
            </el-icon>
            <h3>还没有收藏的角色</h3>
            <p>开始与角色对话，建立亲密关系吧</p>
            <el-button type="primary" @click="showCharacterSelector = true">
              选择角色
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：剧本进度区域 -->
      <div class="right-panel">
        <div class="panel-header">
          <h2 class="panel-title">
            <el-icon><Document /></el-icon>
            剧本进度
          </h2>
          <el-button type="primary" size="small" @click="showScenarioSelector = true">
            <el-icon><Plus /></el-icon>
            选择剧本
          </el-button>
        </div>

        <div class="scenario-list">
          <ScenarioProgressCard
            v-for="progress in gamificationStore.recentProgress"
            :key="progress.id"
            :progress="progress"
            @continue="handleContinueScenario"
            @reset="handleResetScenario"
            @abandon="handleAbandonScenario"
          />

          <div
            v-if="gamificationStore.recentProgress.length === 0"
            class="empty-state"
          >
            <el-icon size="48" class="empty-icon">
              <Document />
            </el-icon>
            <h3>还没有开始的剧本</h3>
            <p>选择一个剧本开始你的时空冒险</p>
            <el-button type="primary" @click="showScenarioSelector = true">
              选择剧本
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 每日任务区域 -->
    <div class="daily-quests-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Trophy /></el-icon>
          每日任务
        </h2>
        <el-button type="text" size="small" @click="refreshQuests">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <div class="quests-grid">
        <div
          v-for="quest in gamificationStore.activeQuests"
          :key="quest.id"
          class="quest-card"
        >
          <div class="quest-header">
            <h4 class="quest-title">{{ quest.title }}</h4>
            <el-tag size="small" type="primary">
              +{{ quest.rewardPoints }}
            </el-tag>
          </div>

          <p class="quest-description">{{ quest.description }}</p>

          <div class="quest-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${Math.min(quest.currentValue / quest.targetValue * 100, 100)}%` }"
              ></div>
            </div>
            <span class="progress-text">
              {{ quest.currentValue }} / {{ quest.targetValue }}
            </span>
          </div>
        </div>

        <!-- 已完成的任务 -->
        <div
          v-for="quest in gamificationStore.completedQuests"
          :key="quest.id"
          class="quest-card completed"
        >
          <div class="quest-header">
            <h4 class="quest-title">{{ quest.title }}</h4>
            <el-button
              type="success"
              size="small"
              @click="claimQuestReward(quest.id)"
              :loading="claimingQuest === quest.id"
            >
              领取奖励
            </el-button>
          </div>

          <p class="quest-description">{{ quest.description }}</p>

          <div class="quest-reward">
            <el-icon><Gift /></el-icon>
            <span>{{ quest.rewardPoints }} 积分</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色选择器弹窗 -->
    <el-dialog
      v-model="showCharacterSelector"
      title="选择角色"
      width="800px"
      :close-on-click-modal="false"
    >
      <CharacterSelector
        @select="handleSelectCharacter"
        @cancel="showCharacterSelector = false"
      />
    </el-dialog>

    <!-- 剧本选择器弹窗 -->
    <el-dialog
      v-model="showScenarioSelector"
      title="选择剧本"
      width="800px"
      :close-on-click-modal="false"
    >
      <ScenarioSelector
        @select="handleSelectScenario"
        @cancel="showScenarioSelector = false"
      />
    </el-dialog>

    <!-- 通知浮层 -->
    <div class="notifications-container">
      <transition-group name="notification">
        <GamificationNotification
          v-for="notification in gamificationStore.notifications"
          :key="notification.id"
          :notification="notification"
          @dismiss="gamificationStore.removeNotification(notification.id)"
        />
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Document,
  Trophy,
  Plus,
  Refresh,
  Gift
} from '@element-plus/icons-vue'

import { useGamificationStore } from '@/stores/gamification'
import CharacterAffinityCard from '@/components/gamification/CharacterAffinityCard.vue'
import ScenarioProgressCard from '@/components/gamification/ScenarioProgressCard.vue'
import GamificationNotification from '@/components/gamification/GamificationNotification.vue'
import CharacterSelector from '@/components/common/CharacterSelector.vue'
import ScenarioSelector from '@/components/common/ScenarioSelector.vue'

const router = useRouter()
const gamificationStore = useGamificationStore()

// 响应式数据
const showCharacterSelector = ref(false)
const showScenarioSelector = ref(false)
const claimingQuest = ref<string | null>(null)

// 方法
const handleCharacterChat = (character: any) => {
  router.push(`/chat?character=${character.id}`)
}

const handleContinueScenario = (progress: any) => {
  // TODO: 跳转到剧本对应的聊天界面
  router.push(`/chat?scenario=${progress.scenarioId}`)
}

const handleResetScenario = async (scenarioId: string) => {
  // TODO: 实现重置进度功能
  ElMessage.info('重置功能即将推出')
}

const handleAbandonScenario = async (scenarioId: string) => {
  // TODO: 实现放弃剧本功能
  ElMessage.info('放弃功能即将推出')
}

const handleSelectCharacter = async (character: any) => {
  try {
    // 初始化角色亲密度
    const success = await gamificationStore.updateCharacterAffinity({
      characterId: character.id,
      affinityPoints: 10, // 初始亲密度
      interactionType: 'first_encounter'
    })

    if (success) {
      showCharacterSelector.value = false
      ElMessage.success(`已选择角色 ${character.name}`)
    }
  } catch (error) {
    ElMessage.error('选择角色失败')
  }
}

const handleSelectScenario = async (scenario: any) => {
  try {
    // 初始化剧本进度
    const success = await gamificationStore.updateScenarioProgress({
      scenarioId: scenario.id,
      progressPercentage: 0,
      sessionTime: 0,
      messagesCount: 0,
      tokensUsed: 0
    })

    if (success) {
      showScenarioSelector.value = false
      ElMessage.success(`已选择剧本《${scenario.name}》`)
    }
  } catch (error) {
    ElMessage.error('选择剧本失败')
  }
}

const claimQuestReward = async (questId: string) => {
  try {
    claimingQuest.value = questId
    const success = await gamificationStore.claimQuestReward(questId)

    if (success) {
      ElMessage.success('奖励领取成功！')
    }
  } catch (error) {
    ElMessage.error('领取奖励失败')
  } finally {
    claimingQuest.value = null
  }
}

const refreshQuests = async () => {
  await gamificationStore.loadDailyQuests()
  ElMessage.success('任务已刷新')
}

// 生命周期
onMounted(async () => {
  // 加载游戏化数据
  await gamificationStore.refreshData()
})
</script>

<style scoped lang="scss">
.gamification-dashboard {
  min-height: 100vh;
  background: var(--surface-0);
  padding: var(--space-6);
}

.dashboard-header {
  background: var(--surface-2);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  border: 1px solid var(--border-secondary);

  .header-content {
    margin-bottom: var(--space-4);

    .page-title {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-secondary-500));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      margin: 0;
      font-size: var(--text-lg);
      color: var(--text-secondary);
    }
  }

  .header-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);

    .stat-card {
      text-align: center;
      padding: var(--space-4);
      background: var(--surface-3);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-secondary);

      .stat-value {
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        color: var(--brand-primary-500);
        margin-bottom: var(--space-1);
      }

      .stat-label {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
      }
    }
  }
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-6);

  .left-panel,
  .right-panel {
    background: var(--surface-2);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    border: 1px solid var(--border-secondary);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);

    .panel-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);

      .el-icon {
        color: var(--brand-primary-500);
      }
    }
  }

  .character-grid,
  .scenario-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
}

.daily-quests-section {
  background: var(--surface-2);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border: 1px solid var(--border-secondary);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);

    .section-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);

      .el-icon {
        color: var(--brand-accent-500);
      }
    }
  }

  .quests-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-4);

    .quest-card {
      background: var(--surface-3);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      border: 1px solid var(--border-secondary);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      &.completed {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
        border-color: rgba(16, 185, 129, 0.3);
      }

      .quest-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-2);

        .quest-title {
          margin: 0;
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          flex: 1;
          margin-right: var(--space-2);
        }
      }

      .quest-description {
        margin: 0 0 var(--space-3) 0;
        font-size: var(--text-sm);
        color: var(--text-secondary);
        line-height: var(--leading-snug);
      }

      .quest-progress {
        .progress-bar {
          height: 6px;
          background: var(--surface-0);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--space-2);

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--brand-primary-500), var(--brand-secondary-500));
            border-radius: var(--radius-full);
            transition: width 0.3s ease;
          }
        }

        .progress-text {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-align: center;
        }
      }

      .quest-reward {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: var(--success);

        .el-icon {
          color: var(--success);
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-tertiary);

  .empty-icon {
    color: var(--text-disabled);
    margin-bottom: var(--space-4);
  }

  h3 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-lg);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  p {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--text-sm);
  }
}

.notifications-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 400px;
}

// 通知动画
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

// 响应式设计
@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .gamification-dashboard {
    padding: var(--space-4);
  }

  .dashboard-header {
    padding: var(--space-4);

    .header-stats {
      grid-template-columns: 1fr;
      gap: var(--space-3);

      .stat-card {
        padding: var(--space-3);
      }
    }
  }

  .dashboard-content,
  .daily-quests-section {
    padding: var(--space-4);
  }

  .quests-grid {
    grid-template-columns: 1fr;
  }
}
</style>
