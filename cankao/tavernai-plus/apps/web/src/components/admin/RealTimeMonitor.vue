<template>
  <el-card class="real-time-monitor" shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>实时监控</h3>
        <div class="refresh-info">
          <el-icon><RefreshRight /></el-icon>
          <span>每 {{ refreshInterval / 1000 }}秒刷新</span>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="panel-content">
      <!-- System Health Overview -->
      <div class="health-overview">
        <div class="health-item">
          <div class="health-icon" :class="systemHealth">
            <el-icon :size="32"><CircleCheckFilled v-if="systemHealth === 'healthy'" /><WarningFilled v-else /></el-icon>
          </div>
          <div class="health-info">
            <p class="health-label">系统状态</p>
            <p class="health-value">{{ systemHealthText }}</p>
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <!-- Users Online -->
        <div class="metric-card">
          <div class="metric-icon online-users">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="metric-info">
            <p class="metric-value">{{ metrics.usersOnline || 0 }}</p>
            <p class="metric-label">在线用户</p>
            <div class="metric-trend" :class="{ positive: usersTrend > 0, negative: usersTrend < 0 }">
              <el-icon><Top v-if="usersTrend > 0" /><Bottom v-else /></el-icon>
              <span>{{ Math.abs(usersTrend) }}%</span>
            </div>
          </div>
        </div>

        <!-- API Requests -->
        <div class="metric-card">
          <div class="metric-icon api-requests">
            <el-icon :size="24"><Connection /></el-icon>
          </div>
          <div class="metric-info">
            <p class="metric-value">{{ formatNumber(metrics.apiRequests || 0) }}</p>
            <p class="metric-label">API 请求/分</p>
            <div class="metric-trend" :class="{ positive: apiTrend > 0, negative: apiTrend < 0 }">
              <el-icon><Top v-if="apiTrend > 0" /><Bottom v-else /></el-icon>
              <span>{{ Math.abs(apiTrend) }}%</span>
            </div>
          </div>
        </div>

        <!-- AI Usage -->
        <div class="metric-card">
          <div class="metric-icon ai-usage">
            <el-icon :size="24"><Cpu /></el-icon>
          </div>
          <div class="metric-info">
            <p class="metric-value">{{ formatNumber(metrics.aiTokensUsed || 0) }}</p>
            <p class="metric-label">AI Tokens/小时</p>
            <p class="metric-sub">¥{{ (metrics.aiCost || 0).toFixed(2) }} 成本</p>
          </div>
        </div>

        <!-- Error Rate -->
        <div class="metric-card">
          <div class="metric-icon error-rate" :class="{ warning: errorRate > 5, danger: errorRate > 10 }">
            <el-icon :size="24"><Warning /></el-icon>
          </div>
          <div class="metric-info">
            <p class="metric-value">{{ errorRate.toFixed(2) }}%</p>
            <p class="metric-label">错误率</p>
            <p class="metric-sub">{{ metrics.totalErrors || 0 }} 错误</p>
          </div>
        </div>

        <!-- Response Time -->
        <div class="metric-card">
          <div class="metric-icon response-time">
            <el-icon :size="24"><Timer /></el-icon>
          </div>
          <div class="metric-info">
            <p class="metric-value">{{ metrics.avgResponseTime || 0 }}</p>
            <p class="metric-label">平均响应时间 (ms)</p>
          </div>
        </div>

        <!-- Database -->
        <div class="metric-card">
          <div class="metric-icon database">
            <el-icon :size="24"><Coin /></el-icon>
          </div>
          <div class="metric-info">
            <p class="metric-value">{{ metrics.dbConnections || 0 }}</p>
            <p class="metric-label">数据库连接</p>
            <p class="metric-sub">{{ metrics.dbPoolSize || 0 }} 连接池</p>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-section">
        <h4 class="section-title">最近活动</h4>
        <div class="activity-list">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon" :class="activity.type">
              <el-icon>
                <User v-if="activity.type === 'user'" />
                <ChatDotRound v-else-if="activity.type === 'chat'" />
                <Edit v-else-if="activity.type === 'create'" />
                <Warning v-else />
              </el-icon>
            </div>
            <div class="activity-info">
              <p class="activity-text">{{ activity.text }}</p>
              <p class="activity-time">{{ formatTime(activity.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  RefreshRight,
  CircleCheckFilled,
  WarningFilled,
  User,
  Connection,
  Cpu,
  Warning,
  Timer,
  Coin,
  Top,
  Bottom,
  ChatDotRound,
  Edit,
} from '@element-plus/icons-vue';
import { useAdminConsoleStore } from '@/stores';

const adminConsoleStore = useAdminConsoleStore();
const loading = ref(false);
const refreshInterval = 5000; // 5 seconds

const metrics = computed(() => adminConsoleStore.systemMetrics || {});
const recentActivity = computed(() => adminConsoleStore.recentActivity?.slice(0, 10) || []);

const systemHealth = computed(() => {
  const errorRate = (metrics.value.totalErrors || 0) / (metrics.value.apiRequests || 1) * 100;
  const avgResponseTime = metrics.value.avgResponseTime || 0;

  if (errorRate > 10 || avgResponseTime > 1000) return 'unhealthy';
  if (errorRate > 5 || avgResponseTime > 500) return 'warning';
  return 'healthy';
});

const systemHealthText = computed(() => {
  switch (systemHealth.value) {
    case 'healthy': return '正常';
    case 'warning': return '警告';
    case 'unhealthy': return '异常';
    default: return '未知';
  }
});

const usersTrend = computed(() => {
  const current = metrics.value.usersOnline || 0;
  const previous = metrics.value.usersOnlinePrevious || current;
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
});

const apiTrend = computed(() => {
  const current = metrics.value.apiRequests || 0;
  const previous = metrics.value.apiRequestsPrevious || current;
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
});

const errorRate = computed(() => {
  const errors = metrics.value.totalErrors || 0;
  const requests = metrics.value.apiRequests || 1;
  return (errors / requests) * 100;
});

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

async function loadMetrics() {
  loading.value = true;
  try {
    await Promise.all([
      adminConsoleStore.fetchSystemMetrics(),
      adminConsoleStore.fetchRecentActivity({ limit: 10 }),
    ]);
  } catch (error) {
    console.error('Failed to load metrics:', error);
  } finally {
    loading.value = false;
  }
}

let metricsInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadMetrics();
  metricsInterval = setInterval(loadMetrics, refreshInterval);
});

onBeforeUnmount(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
});
</script>

<style scoped>
.real-time-monitor {
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
  min-height: 400px;
}

.health-overview {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.health-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
}

.health-icon.healthy {
  color: #67c23a;
}

.health-icon.warning {
  color: #e6a23c;
}

.health-icon.unhealthy {
  color: #f56c6c;
}

.health-info {
  flex: 1;
}

.health-label {
  font-size: 14px;
  color: #606266;
  margin: 0 0 4px 0;
}

.health-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #303133;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.2s;
}

.metric-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.metric-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: white;
}

.metric-icon.online-users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.metric-icon.api-requests {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.metric-icon.ai-usage {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.metric-icon.error-rate {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
}

.metric-icon.error-rate.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #d39e00 100%);
}

.metric-icon.error-rate.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #f44336 100%);
}

.metric-icon.response-time {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.metric-icon.database {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 4px 0;
  color: #303133;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.metric-sub {
  font-size: 11px;
  color: #c0c4cc;
  margin: 4px 0 0 0;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 4px;
}

.metric-trend.positive {
  color: #67c23a;
}

.metric-trend.negative {
  color: #f56c6c;
}

.activity-section {
  margin-top: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #409eff;
  color: white;
  flex-shrink: 0;
}

.activity-icon.user {
  background: #67c23a;
}

.activity-icon.chat {
  background: #409eff;
}

.activity-icon.create {
  background: #e6a23c;
}

.activity-icon.warning {
  background: #f56c6c;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 13px;
  color: #303133;
  margin: 0 0 4px 0;
}

.activity-time {
  font-size: 11px;
  color: #909399;
  margin: 0;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metric-card {
    flex-direction: column;
    text-align: center;
  }

  .metric-icon {
    margin: 0 auto;
  }
}
</style>
