<template>
  <div class="creator-studio">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">创作工坊</h1>
        <p class="page-subtitle">AI 驱动的角色和剧本创作平台</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          创建作品
        </el-button>
        <el-dropdown>
          <el-button :icon="More">
            更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="navigateTo('/creator/works')">
                我的作品
              </el-dropdown-item>
              <el-dropdown-item @click="navigateTo('/creator/analytics')">
                数据分析
              </el-dropdown-item>
              <el-dropdown-item divided @click="navigateTo('/creator/settings')">
                创作设置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Quick Stats -->
    <div v-loading="loading" class="quick-stats">
      <div class="stat-card">
        <div class="stat-icon purple">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ formatNumber(totalCharacters) }}</p>
          <p class="stat-label">创建角色</p>
        </div>
        <div class="stat-trend positive">
          <el-icon><CaretTop /></el-icon>
          +12%
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pink">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ formatNumber(totalScenarios) }}</p>
          <p class="stat-label">创建剧本</p>
        </div>
        <div class="stat-trend positive">
          <el-icon><CaretTop /></el-icon>
          +8%
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon blue">
          <el-icon :size="32"><View /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ formatNumber(totalViews) }}</p>
          <p class="stat-label">总浏览量</p>
        </div>
        <div class="stat-trend positive">
          <el-icon><CaretTop /></el-icon>
          +25%
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <el-icon :size="32"><Star /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ avgRating.toFixed(1) }}</p>
          <p class="stat-label">平均评分</p>
        </div>
        <div class="stat-badge">
          <el-rate
            v-model="avgRating"
            disabled
            show-score
            :score-template="avgRating.toFixed(1)"
          />
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Works Summary (Left Column) -->
      <div class="grid-item span-2">
        <creator-works-summary />
      </div>

      <!-- AI Generation Panel (Right Column) -->
      <div class="grid-item span-1">
        <ai-generation-panel />
      </div>

      <!-- Revenue Chart (Full Width) -->
      <div class="grid-item span-3">
        <creator-revenue-chart />
      </div>
    </div>

    <!-- Create Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建新作品"
      width="500px"
      :before-close="handleCreateDialogClose"
    >
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="作品类型">
          <el-radio-group v-model="createForm.type">
            <el-radio label="character">角色</el-radio>
            <el-radio label="scenario">剧本</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="创建方式">
          <el-radio-group v-model="createForm.method">
            <el-radio label="manual">手动创建</el-radio>
            <el-radio label="ai">AI 生成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">开始创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  More,
  ArrowDown,
  User,
  Document,
  View,
  Star,
  CaretTop,
} from '@element-plus/icons-vue';
import { useCreatorStudioStore } from '@/stores';
import CreatorWorksSummary from '@/components/creator/CreatorWorksSummary.vue';
import AIGenerationPanel from '@/components/creator/AIGenerationPanel.vue';
import CreatorRevenueChart from '@/components/creator/CreatorRevenueChart.vue';

const router = useRouter();
const creatorStore = useCreatorStudioStore();

const loading = ref(false);
const showCreateDialog = ref(false);
const createForm = ref({
  type: 'character',
  method: 'manual',
});

// Computed Stats
const totalCharacters = computed(() => creatorStore.totalCharacters);
const totalScenarios = computed(() => creatorStore.overview?.totalScenarios || 0);
const totalViews = computed(() => creatorStore.totalViews);
const totalLikes = computed(() => creatorStore.totalLikes);
const avgRating = computed(() => creatorStore.avgRating);

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function navigateTo(path: string) {
  router.push(path);
}

function handleCreateDialogClose(done: () => void) {
  createForm.value = {
    type: 'character',
    method: 'manual',
  };
  done();
}

function handleCreate() {
  const { type, method } = createForm.value;
  showCreateDialog.value = false;

  if (method === 'ai') {
    // Scroll to AI generation panel
    const panel = document.querySelector('.ai-generation-panel');
    panel?.scrollIntoView({ behavior: 'smooth' });
  } else {
    // Navigate to manual creation page
    router.push(`/creator/${type}/new`);
  }
}

async function loadDashboard() {
  loading.value = true;
  try {
    await Promise.all([
      creatorStore.fetchOverview(),
      creatorStore.fetchStatistics({ limit: 10 }),
    ]);
  } catch (error) {
    console.error('Failed to load creator dashboard:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.creator-studio {
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

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
}

.stat-icon.purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pink {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 4px 0;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.stat-trend.positive {
  color: #67c23a;
}

.stat-trend.negative {
  color: #f56c6c;
}

.stat-badge {
  display: flex;
  align-items: center;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.grid-item {
  min-height: 400px;
}

.grid-item.span-1 {
  grid-column: span 1;
}

.grid-item.span-2 {
  grid-column: span 2;
}

.grid-item.span-3 {
  grid-column: span 3;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-item.span-2,
  .grid-item.span-3 {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .creator-studio {
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

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-value {
    font-size: 22px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .grid-item.span-1,
  .grid-item.span-2,
  .grid-item.span-3 {
    grid-column: span 1;
  }
}
</style>
