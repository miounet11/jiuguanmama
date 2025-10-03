<template>
  <el-card class="alert-center" shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>告警中心</h3>
        <div class="header-stats">
          <el-badge :value="urgentCount" :hidden="urgentCount === 0" type="danger">
            <el-tag type="danger" size="small">紧急</el-tag>
          </el-badge>
          <el-badge :value="unresolvedCount" :hidden="unresolvedCount === 0">
            <el-tag type="warning" size="small">待处理</el-tag>
          </el-badge>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="panel-content">
      <!-- Filter Tabs -->
      <el-tabs v-model="activeFilter" class="alert-tabs">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane :label="`紧急 (${urgentCount})`" name="urgent" />
        <el-tab-pane :label="`高优先级 (${highCount})`" name="high" />
        <el-tab-pane label="已解决" name="resolved" />
      </el-tabs>

      <!-- Alert List -->
      <div v-if="filteredAlerts.length === 0" class="empty-state">
        <el-icon :size="48" color="#C0C4CC"><SuccessFilled /></el-icon>
        <p>暂无告警</p>
      </div>

      <div v-else class="alert-list">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.id"
          class="alert-item"
          :class="[alert.priority, { resolved: alert.status === 'resolved' }]"
        >
          <div class="alert-indicator" :class="alert.priority"></div>

          <div class="alert-content">
            <div class="alert-header">
              <div class="alert-title-row">
                <h4 class="alert-title">{{ alert.title }}</h4>
                <el-tag :type="getPriorityType(alert.priority)" size="small">
                  {{ getPriorityText(alert.priority) }}
                </el-tag>
              </div>
              <div class="alert-meta">
                <span class="alert-type">
                  <el-icon><Warning /></el-icon>
                  {{ getTypeText(alert.type) }}
                </span>
                <span class="alert-time">
                  <el-icon><Clock /></el-icon>
                  {{ formatTime(alert.createdAt) }}
                </span>
              </div>
            </div>

            <p class="alert-message">{{ alert.message }}</p>

            <div v-if="alert.details" class="alert-details">
              <el-collapse accordion>
                <el-collapse-item title="详细信息" name="details">
                  <pre>{{ JSON.stringify(alert.details, null, 2) }}</pre>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div class="alert-actions">
              <el-button
                v-if="alert.status === 'active'"
                size="small"
                @click="acknowledgeAlert(alert.id)"
              >
                <el-icon><Select /></el-icon>
                确认
              </el-button>
              <el-button
                v-if="alert.status !== 'resolved'"
                type="success"
                size="small"
                @click="resolveAlert(alert.id)"
              >
                <el-icon><CircleCheckFilled /></el-icon>
                解决
              </el-button>
              <el-button
                type="danger"
                size="small"
                plain
                @click="deleteAlert(alert.id)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Warning,
  Clock,
  SuccessFilled,
  Select,
  CircleCheckFilled,
  Delete,
} from '@element-plus/icons-vue';
import { useAdminConsoleStore } from '@/stores';
import { ElMessage } from 'element-plus';

const adminConsoleStore = useAdminConsoleStore();
const loading = ref(false);
const activeFilter = ref('all');

const allAlerts = computed(() => adminConsoleStore.systemAlerts || []);

const filteredAlerts = computed(() => {
  let alerts = allAlerts.value;

  switch (activeFilter.value) {
    case 'urgent':
      return alerts.filter((a: any) => a.priority === 'urgent');
    case 'high':
      return alerts.filter((a: any) => a.priority === 'high');
    case 'resolved':
      return alerts.filter((a: any) => a.status === 'resolved');
    default:
      return alerts;
  }
});

const urgentCount = computed(() => {
  return allAlerts.value.filter((a: any) => a.priority === 'urgent' && a.status !== 'resolved').length;
});

const highCount = computed(() => {
  return allAlerts.value.filter((a: any) => a.priority === 'high' && a.status !== 'resolved').length;
});

const unresolvedCount = computed(() => {
  return allAlerts.value.filter((a: any) => a.status !== 'resolved').length;
});

function getPriorityType(priority: string): 'danger' | 'warning' | 'info' | 'success' {
  switch (priority) {
    case 'urgent': return 'danger';
    case 'high': return 'warning';
    case 'normal': return 'info';
    case 'low': return 'success';
    default: return 'info';
  }
}

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'urgent': return '紧急';
    case 'high': return '高';
    case 'normal': return '中';
    case 'low': return '低';
    default: return '未知';
  }
}

function getTypeText(type: string): string {
  switch (type) {
    case 'system': return '系统';
    case 'security': return '安全';
    case 'performance': return '性能';
    case 'error': return '错误';
    case 'moderation': return '内容审核';
    default: return '其他';
  }
}

function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function acknowledgeAlert(alertId: string) {
  try {
    await adminConsoleStore.acknowledgeAlert(alertId);
    ElMessage.success('已确认告警');
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message);
  }
}

async function resolveAlert(alertId: string) {
  try {
    await adminConsoleStore.resolveAlert(alertId);
    ElMessage.success('已解决告警');
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message);
  }
}

async function deleteAlert(alertId: string) {
  try {
    await adminConsoleStore.deleteAlert(alertId);
    ElMessage.success('已删除告警');
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message);
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await adminConsoleStore.fetchSystemAlerts();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.alert-center {
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
  gap: 12px;
  align-items: center;
}

.panel-content {
  min-height: 400px;
}

.alert-tabs {
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

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-item {
  position: relative;
  display: flex;
  padding: 16px;
  padding-left: 20px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.2s;
}

.alert-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.alert-item.resolved {
  opacity: 0.6;
  background: #f9f9f9;
}

.alert-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 8px 0 0 8px;
}

.alert-indicator.urgent {
  background: #f56c6c;
}

.alert-indicator.high {
  background: #e6a23c;
}

.alert-indicator.normal {
  background: #409eff;
}

.alert-indicator.low {
  background: #67c23a;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  margin-bottom: 12px;
}

.alert-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.alert-type,
.alert-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.alert-message {
  font-size: 13px;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.alert-details {
  margin-bottom: 12px;
}

.alert-details pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}

.alert-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .alert-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .alert-meta {
    flex-direction: column;
    gap: 4px;
  }

  .alert-actions {
    flex-direction: column;
  }

  .alert-actions .el-button {
    width: 100%;
  }
}
</style>
