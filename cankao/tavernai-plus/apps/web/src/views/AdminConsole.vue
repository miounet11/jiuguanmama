<template>
  <div class="admin-console">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">管理控制台</h1>
        <p class="page-subtitle">系统监控、告警管理与内容审核</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportReport">
          导出报告
        </el-button>
        <el-dropdown>
          <el-button :icon="Setting">
            系统设置<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="navigateTo('/settings/system')">
                系统配置
              </el-dropdown-item>
              <el-dropdown-item @click="navigateTo('/settings/security')">
                安全设置
              </el-dropdown-item>
              <el-dropdown-item @click="navigateTo('/settings/ai')">
                AI 配置
              </el-dropdown-item>
              <el-dropdown-item divided @click="navigateTo('/settings/logs')">
                日志管理
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Dashboard Metrics -->
    <div v-loading="loading" class="dashboard-metrics">
      <div class="metric-card users">
        <div class="metric-icon">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="metric-content">
          <p class="metric-label">总用户数</p>
          <p class="metric-value">{{ formatNumber(dashboardMetrics.totalUsers) }}</p>
          <p class="metric-sub">
            <span class="trend" :class="{ positive: userGrowth > 0 }">
              <el-icon><Top v-if="userGrowth > 0" /><Bottom v-else /></el-icon>
              {{ Math.abs(userGrowth) }}%
            </span>
            较上周
          </p>
        </div>
      </div>

      <div class="metric-card content">
        <div class="metric-icon">
          <el-icon :size="32"><Document /></el-icon>
        </div>
        <div class="metric-content">
          <p class="metric-label">内容总数</p>
          <p class="metric-value">{{ formatNumber(dashboardMetrics.totalContent) }}</p>
          <p class="metric-sub">
            {{ dashboardMetrics.charactersCount }} 角色 · {{ dashboardMetrics.scenariosCount }} 剧本
          </p>
        </div>
      </div>

      <div class="metric-card activity">
        <div class="metric-icon">
          <el-icon :size="32"><ChatDotRound /></el-icon>
        </div>
        <div class="metric-content">
          <p class="metric-label">今日活跃</p>
          <p class="metric-value">{{ formatNumber(dashboardMetrics.activeToday) }}</p>
          <p class="metric-sub">
            {{ dashboardMetrics.messagesCount }} 条消息
          </p>
        </div>
      </div>

      <div class="metric-card revenue">
        <div class="metric-icon">
          <el-icon :size="32"><Coin /></el-icon>
        </div>
        <div class="metric-content">
          <p class="metric-label">本月收益</p>
          <p class="metric-value">¥{{ formatNumber(dashboardMetrics.monthlyRevenue) }}</p>
          <p class="metric-sub">
            <span class="trend" :class="{ positive: revenueGrowth > 0 }">
              <el-icon><Top v-if="revenueGrowth > 0" /><Bottom v-else /></el-icon>
              {{ Math.abs(revenueGrowth) }}%
            </span>
            较上月
          </p>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Real-time Monitor (Full Width) -->
      <div class="grid-section monitor-section">
        <real-time-monitor />
      </div>

      <!-- Alert Center (Left Column) -->
      <div class="grid-section alert-section">
        <alert-center />
      </div>

      <!-- Moderation Queue (Right Column) -->
      <div class="grid-section moderation-section">
        <moderation-queue />
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3 class="section-title">快捷操作</h3>
      <div class="actions-grid">
        <el-button type="primary" :icon="User" @click="navigateTo('/admin/users')">
          用户管理
        </el-button>
        <el-button type="success" :icon="Document" @click="navigateTo('/admin/content')">
          内容管理
        </el-button>
        <el-button type="warning" :icon="Setting" @click="navigateTo('/admin/ai-config')">
          AI 配置
        </el-button>
        <el-button type="danger" :icon="Warning" @click="navigateTo('/admin/security')">
          安全中心
        </el-button>
        <el-button :icon="DataAnalysis" @click="navigateTo('/admin/analytics')">
          数据分析
        </el-button>
        <el-button :icon="Files} @click="navigateTo('/admin/logs')">
          日志审计
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Download,
  Setting,
  ArrowDown,
  User,
  Document,
  ChatDotRound,
  Coin,
  Top,
  Bottom,
  Warning,
  DataAnalysis,
  Files,
} from '@element-plus/icons-vue';
import { useAdminConsoleStore } from '@/stores';
import { ElMessage } from 'element-plus';
import RealTimeMonitor from '@/components/admin/RealTimeMonitor.vue';
import AlertCenter from '@/components/admin/AlertCenter.vue';
import ModerationQueue from '@/components/admin/ModerationQueue.vue';

const router = useRouter();
const adminConsoleStore = useAdminConsoleStore();

const loading = ref(false);

const dashboardMetrics = computed(() => adminConsoleStore.dashboardMetrics || {
  totalUsers: 0,
  totalContent: 0,
  activeToday: 0,
  monthlyRevenue: 0,
  charactersCount: 0,
  scenariosCount: 0,
  messagesCount: 0,
  userGrowthRate: 0,
  revenueGrowthRate: 0,
});

const userGrowth = computed(() => dashboardMetrics.value.userGrowthRate || 0);
const revenueGrowth = computed(() => dashboardMetrics.value.revenueGrowthRate || 0);

function formatNumber(num: number): string {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('zh-CN');
}

function navigateTo(path: string) {
  router.push(path);
}

async function exportReport() {
  try {
    ElMessage.info('报告导出功能开发中...');
    // TODO: Implement report export
  } catch (error: any) {
    ElMessage.error('导出失败：' + error.message);
  }
}

async function loadDashboard() {
  loading.value = true;
  try {
    await Promise.all([
      adminConsoleStore.fetchDashboardMetrics(),
      adminConsoleStore.fetchSystemMetrics(),
      adminConsoleStore.fetchSystemAlerts(),
      adminConsoleStore.fetchModerationQueue(),
    ]);
  } catch (error) {
    console.error('Failed to load admin dashboard:', error);
    ElMessage.error('加载管理面板失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.admin-console {
  padding: 24px;
  max-width: 1600px;
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

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.metric-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
}

.metric-card.users .metric-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.metric-card.content .metric-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.metric-card.activity .metric-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.metric-card.revenue .metric-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px 0;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #303133;
}

.metric-sub {
  font-size: 12px;
  color: #909399;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
}

.trend.positive {
  color: #67c23a;
}

.trend:not(.positive) {
  color: #f56c6c;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.grid-section.monitor-section {
  grid-column: span 2;
}

.grid-section.alert-section,
.grid-section.moderation-section {
  grid-column: span 1;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #303133;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .grid-section.monitor-section,
  .grid-section.alert-section,
  .grid-section.moderation-section {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .admin-console {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .page-title {
    font-size: 24px;
  }

  .dashboard-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .metric-card {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }

  .metric-icon {
    margin: 0 auto;
    width: 48px;
    height: 48px;
  }

  .metric-value {
    font-size: 20px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
