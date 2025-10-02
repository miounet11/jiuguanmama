<template>
  <el-card class="achievement-wall" shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>成就墙</h3>
        <div class="header-stats">
          <span class="stat-value">{{ unlockedCount }}</span>
          <span class="stat-label">/ {{ totalCount }} 已解锁</span>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="panel-content">
      <!-- Filter Tabs -->
      <el-tabs v-model="activeTab" class="achievement-tabs">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="已解锁" name="unlocked" />
        <el-tab-pane label="未解锁" name="locked" />
      </el-tabs>

      <!-- Achievement Grid -->
      <div v-if="filteredAchievements.length === 0" class="empty-state">
        <el-icon :size="48" color="#C0C4CC"><Medal /></el-icon>
        <p>暂无成就</p>
      </div>

      <div v-else class="achievement-grid">
        <el-tooltip
          v-for="achievement in filteredAchievements"
          :key="achievement.id"
          :content="getTooltipContent(achievement)"
          placement="top"
          effect="light"
        >
          <div
            class="achievement-item"
            :class="{
              unlocked: achievement.unlocked,
              locked: !achievement.unlocked,
              rare: achievement.rarity === 'rare',
              legendary: achievement.rarity === 'legendary',
            }"
            @click="handleAchievementClick(achievement)"
          >
            <div class="achievement-icon">
              <el-icon :size="32">
                <component :is="getAchievementIcon(achievement.category)" />
              </el-icon>
            </div>

            <div class="achievement-info">
              <h4 class="achievement-name">{{ achievement.name }}</h4>
              <p class="achievement-description">{{ achievement.description }}</p>

              <div v-if="achievement.unlocked" class="unlock-date">
                <el-icon><Clock /></el-icon>
                <span>{{ formatDate(achievement.unlockedAt) }}</span>
              </div>

              <div v-else-if="achievement.progress !== undefined" class="achievement-progress">
                <el-progress
                  :percentage="achievement.progress"
                  :stroke-width="4"
                  :show-text="false"
                />
              </div>
            </div>

            <div v-if="achievement.unlocked" class="achievement-badge">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div v-else class="achievement-lock">
              <el-icon><Lock /></el-icon>
            </div>
          </div>
        </el-tooltip>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Medal,
  Clock,
  CircleCheckFilled,
  Lock,
  Trophy,
  Star,
  MessageBox,
  Edit,
  User,
  DataAnalysis,
} from '@element-plus/icons-vue';
import { useGamificationStore } from '@/stores';

const gamificationStore = useGamificationStore();
const loading = ref(false);
const activeTab = ref('all');

const allAchievements = computed(() => gamificationStore.achievements || []);

const filteredAchievements = computed(() => {
  switch (activeTab.value) {
    case 'unlocked':
      return allAchievements.value.filter((a: any) => a.unlocked);
    case 'locked':
      return allAchievements.value.filter((a: any) => !a.unlocked);
    default:
      return allAchievements.value;
  }
});

const unlockedCount = computed(() => {
  return allAchievements.value.filter((a: any) => a.unlocked).length;
});

const totalCount = computed(() => allAchievements.value.length);

function getAchievementIcon(category: string) {
  const iconMap: Record<string, any> = {
    combat: Trophy,
    social: MessageBox,
    creative: Edit,
    exploration: Star,
    collection: User,
    mastery: DataAnalysis,
  };
  return iconMap[category] || Trophy;
}

function getTooltipContent(achievement: any): string {
  if (achievement.unlocked) {
    return `${achievement.name} - 已于 ${formatDate(achievement.unlockedAt)} 解锁`;
  }
  return achievement.hint || achievement.description;
}

function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function handleAchievementClick(achievement: any) {
  // Show achievement details dialog
  console.log('Achievement clicked:', achievement);
}

onMounted(async () => {
  loading.value = true;
  try {
    await gamificationStore.fetchAchievements();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.achievement-wall {
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

.header-stats {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.panel-content {
  min-height: 400px;
}

.achievement-tabs {
  margin-bottom: 20px;
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

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.achievement-item {
  position: relative;
  padding: 16px;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.achievement-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.achievement-item.unlocked {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%);
}

.achievement-item.rare.unlocked {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f5ff 100%);
}

.achievement-item.legendary.unlocked {
  border-color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fff7e6 100%);
  animation: legendary-glow 2s ease-in-out infinite;
}

@keyframes legendary-glow {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(245, 108, 108, 0.6);
  }
}

.achievement-item.locked {
  opacity: 0.6;
  background: #f9f9f9;
}

.achievement-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.achievement-item.locked .achievement-icon {
  background: #dcdfe6;
  color: #909399;
}

.achievement-info {
  text-align: center;
}

.achievement-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #303133;
}

.achievement-description {
  font-size: 12px;
  color: #606266;
  margin: 0 0 8px 0;
  line-height: 1.4;
  min-height: 32px;
}

.unlock-date {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
  margin-top: 8px;
}

.achievement-progress {
  margin-top: 8px;
}

.achievement-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #67c23a;
  font-size: 20px;
}

.achievement-lock {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #dcdfe6;
  font-size: 16px;
}

@media (max-width: 768px) {
  .achievement-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .achievement-item {
    padding: 12px;
  }

  .achievement-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
