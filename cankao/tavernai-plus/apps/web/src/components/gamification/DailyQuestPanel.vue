<template>
  <el-card class="daily-quest-panel" shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>每日任务</h3>
        <div class="refresh-info">
          <el-icon><RefreshRight /></el-icon>
          <span>{{ timeUntilRefresh }}</span>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="panel-content">
      <div v-if="quests.length === 0" class="empty-state">
        <el-icon :size="48" color="#C0C4CC"><DocumentRemove /></el-icon>
        <p>今日暂无任务</p>
      </div>

      <div v-else class="quest-list">
        <div
          v-for="quest in quests"
          :key="quest.id"
          class="quest-item"
          :class="{ completed: quest.completed }"
        >
          <div class="quest-icon">
            <el-icon :size="24" :color="quest.completed ? '#67c23a' : '#409eff'">
              <CircleCheckFilled v-if="quest.completed" />
              <Circle v-else />
            </el-icon>
          </div>

          <div class="quest-info">
            <h4 class="quest-title">{{ quest.title }}</h4>
            <p class="quest-description">{{ quest.description }}</p>

            <div class="quest-progress">
              <el-progress
                :percentage="getProgressPercentage(quest)"
                :status="quest.completed ? 'success' : undefined"
                :stroke-width="6"
              />
              <span class="progress-text">
                {{ quest.current }} / {{ quest.target }}
              </span>
            </div>
          </div>

          <div class="quest-reward">
            <div class="reward-item">
              <el-icon color="#fee140"><Coin /></el-icon>
              <span>{{ quest.expReward }} EXP</span>
            </div>
            <el-button
              v-if="quest.completed && !quest.claimed"
              type="success"
              size="small"
              @click="claimReward(quest.id)"
            >
              领取
            </el-button>
            <el-tag v-else-if="quest.claimed" type="success" size="small">
              已领取
            </el-tag>
          </div>
        </div>
      </div>

      <div v-if="quests.length > 0" class="quest-summary">
        <el-divider />
        <div class="summary-content">
          <span class="summary-label">今日进度</span>
          <span class="summary-value">
            {{ completedCount }} / {{ quests.length }} 完成
          </span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  RefreshRight,
  DocumentRemove,
  Circle,
  CircleCheckFilled,
  Coin,
} from '@element-plus/icons-vue';
import { useGamificationStore } from '@/stores';
import { ElMessage } from 'element-plus';

const gamificationStore = useGamificationStore();
const loading = ref(false);
const timeUntilRefresh = ref('');

const quests = computed(() => gamificationStore.dailyQuests || []);
const completedCount = computed(() => quests.value.filter((q) => q.completed).length);

function getProgressPercentage(quest: any): number {
  return Math.min(Math.round((quest.current / quest.target) * 100), 100);
}

async function claimReward(questId: string) {
  try {
    // Call API to claim reward
    // await gamificationApi.claimQuestReward(questId);
    ElMessage.success('奖励已领取！');

    // Refresh quests
    await gamificationStore.fetchDailyQuests();
  } catch (error: any) {
    ElMessage.error('领取失败：' + error.message);
  }
}

function updateRefreshTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  timeUntilRefresh.value = `${hours}小时${minutes}分钟后刷新`;
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  loading.value = true;
  try {
    await gamificationStore.fetchDailyQuests();
  } finally {
    loading.value = false;
  }

  updateRefreshTime();
  refreshInterval = setInterval(updateRefreshTime, 60000); // Update every minute
});

onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.daily-quest-panel {
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.panel-content {
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state p {
  margin-top: 12px;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quest-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.2s;
}

.quest-item:hover {
  background: #f9f9f9;
  border-color: #409eff;
}

.quest-item.completed {
  background: #f0f9ff;
  border-color: #67c23a;
}

.quest-icon {
  flex-shrink: 0;
}

.quest-info {
  flex: 1;
  min-width: 0;
}

.quest-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.quest-description {
  font-size: 12px;
  color: #606266;
  margin: 0 0 8px 0;
}

.quest-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quest-progress .el-progress {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.quest-reward {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #e6a23c;
}

.quest-summary {
  margin-top: 20px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.summary-label {
  color: #606266;
}

.summary-value {
  font-weight: 600;
  color: #409eff;
}

@media (max-width: 768px) {
  .quest-item {
    flex-direction: column;
  }

  .quest-reward {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
