<template>
  <div class="gamification-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">成长系统</h1>
        <p class="page-subtitle">追踪你的角色羁绊与技能成长</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Trophy" @click="showLeaderboard = true">
          排行榜
        </el-button>
        <el-dropdown>
          <el-button :icon="More">
            更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="navigateTo('/gamification/history')">
                成长历史
              </el-dropdown-item>
              <el-dropdown-item @click="navigateTo('/gamification/rewards')">
                奖励中心
              </el-dropdown-item>
              <el-dropdown-item divided @click="navigateTo('/settings/gamification')">
                系统设置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Overview Stats -->
    <div v-loading="loading" class="overview-stats">
      <div class="stat-card level">
        <div class="stat-icon">
          <el-icon :size="40"><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">当前等级</p>
          <p class="stat-value">{{ currentLevel }}</p>
          <el-progress
            :percentage="expProgress"
            :stroke-width="6"
            :show-text="false"
            color="#409eff"
          />
          <p class="stat-sub">{{ currentExp }} / {{ expToNextLevel }} EXP</p>
        </div>
      </div>

      <div class="stat-card affinity">
        <div class="stat-icon">
          <el-icon :size="40"><User /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">角色羁绊</p>
          <p class="stat-value">{{ totalAffinities }}</p>
          <p class="stat-sub">{{ highAffinityCount }} 个高亲密度</p>
        </div>
      </div>

      <div class="stat-card proficiency">
        <div class="stat-icon">
          <el-icon :size="40"><DataAnalysis /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">技能熟练度</p>
          <p class="stat-value">{{ totalSkills }}</p>
          <p class="stat-sub">{{ masterSkillCount }} 个精通技能</p>
        </div>
      </div>

      <div class="stat-card achievements">
        <div class="stat-icon">
          <el-icon :size="40"><Medal /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">成就完成</p>
          <p class="stat-value">{{ achievementProgress }}%</p>
          <p class="stat-sub">{{ unlockedAchievements }} / {{ totalAchievements }</p>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Affinity Cards (Left Column) -->
      <div class="grid-section affinity-section">
        <h2 class="section-title">
          <el-icon><Star /></el-icon>
          角色羁绊
        </h2>
        <div class="affinity-cards">
          <affinity-progress-card
            v-for="character in topAffinities"
            :key="character.id"
            :character="character"
            @click="viewCharacterDetails"
          />
        </div>
        <el-button text type="primary" class="view-all-btn" @click="navigateTo('/gamification/affinities')">
          查看全部羁绊 →
        </el-button>
      </div>

      <!-- Daily Quests (Right Column) -->
      <div class="grid-section quests-section">
        <daily-quest-panel />
      </div>

      <!-- Proficiency Skill Tree (Full Width) -->
      <div class="grid-section skill-section">
        <proficiency-skill-tree />
      </div>

      <!-- Achievement Wall (Full Width) -->
      <div class="grid-section achievement-section">
        <achievement-wall />
      </div>
    </div>

    <!-- Leaderboard Dialog -->
    <el-dialog
      v-model="showLeaderboard"
      title="排行榜"
      width="600px"
      :before-close="handleLeaderboardClose"
    >
      <div class="leaderboard-content">
        <el-tabs v-model="leaderboardTab">
          <el-tab-pane label="等级排行" name="level" />
          <el-tab-pane label="成就排行" name="achievements" />
          <el-tab-pane label="羁绊排行" name="affinity" />
        </el-tabs>
        <div class="leaderboard-list">
          <p style="text-align: center; color: #909399; padding: 40px 0;">
            排行榜数据加载中...
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Trophy,
  More,
  ArrowDown,
  TrendCharts,
  User,
  DataAnalysis,
  Medal,
  Star,
} from '@element-plus/icons-vue';
import { useGamificationStore } from '@/stores';
import AffinityProgressCard from '@/components/gamification/AffinityProgressCard.vue';
import DailyQuestPanel from '@/components/gamification/DailyQuestPanel.vue';
import ProficiencySkillTree from '@/components/gamification/ProficiencySkillTree.vue';
import AchievementWall from '@/components/gamification/AchievementWall.vue';

const router = useRouter();
const gamificationStore = useGamificationStore();

const loading = ref(false);
const showLeaderboard = ref(false);
const leaderboardTab = ref('level');

// Computed Stats
const currentLevel = computed(() => gamificationStore.currentLevel);
const currentExp = computed(() => gamificationStore.overview?.currentLevelExp || 0);
const expToNextLevel = computed(() => gamificationStore.expToNextLevel);
const totalExp = computed(() => gamificationStore.totalExp);

const expProgress = computed(() => {
  if (expToNextLevel.value === 0) return 100;
  return Math.round((currentExp.value / expToNextLevel.value) * 100);
});

const topAffinities = computed(() => gamificationStore.topAffinities?.slice(0, 3) || []);
const totalAffinities = computed(() => gamificationStore.affinityList?.length || 0);
const highAffinityCount = computed(() => {
  return gamificationStore.affinityList?.filter((a: any) => a.affinityLevel >= 5).length || 0;
});

const totalSkills = computed(() => gamificationStore.proficiencyList?.length || 0);
const masterSkillCount = computed(() => {
  return gamificationStore.proficiencyList?.filter((s: any) => s.level >= 40).length || 0;
});

const unlockedAchievements = computed(() => gamificationStore.unlockedAchievements?.length || 0);
const totalAchievements = computed(() => gamificationStore.achievements?.length || 0);
const achievementProgress = computed(() => {
  if (totalAchievements.value === 0) return 0;
  return Math.round((unlockedAchievements.value / totalAchievements.value) * 100);
});

function navigateTo(path: string) {
  router.push(path);
}

function viewCharacterDetails(character: any) {
  router.push(`/characters/${character.id}`);
}

function handleLeaderboardClose(done: () => void) {
  done();
}

async function loadDashboard() {
  loading.value = true;
  try {
    await Promise.all([
      gamificationStore.fetchOverview(),
      gamificationStore.fetchAffinityList({ limit: 10 }),
      gamificationStore.fetchProficiencyList(),
      gamificationStore.fetchAchievements(),
      gamificationStore.fetchDailyQuests(),
    ]);
  } catch (error) {
    console.error('Failed to load gamification dashboard:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.gamification-dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
}

.stat-card.level .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.affinity .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.proficiency .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.achievements .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin: 0 0 6px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #303133;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.grid-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.grid-section.affinity-section,
.grid-section.quests-section {
  grid-column: span 1;
}

.grid-section.skill-section,
.grid-section.achievement-section {
  grid-column: span 2;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #303133;
}

.affinity-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.view-all-btn {
  width: 100%;
  margin-top: 8px;
}

.leaderboard-content {
  min-height: 400px;
}

.leaderboard-list {
  margin-top: 20px;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .grid-section.affinity-section,
  .grid-section.quests-section,
  .grid-section.skill-section,
  .grid-section.achievement-section {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .gamification-dashboard {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .page-title {
    font-size: 24px;
  }

  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    flex-direction: column;
    padding: 16px;
    text-align: center;
  }

  .stat-icon {
    margin: 0 auto;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>
