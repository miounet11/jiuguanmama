<template>
  <div class="logs-page">
    <div class="page-header">
      <h1>错误日志监控</h1>
      <div class="header-actions">
        <el-button @click="refreshLogs" :loading="loading">
          <i class="fas fa-sync"></i> 刷新
        </el-button>
        <el-button @click="clearFrontendLogs" type="warning">
          <i class="fas fa-trash"></i> 清空前端日志
        </el-button>
        <el-button @click="exportLogs" type="success">
          <i class="fas fa-download"></i> 导出日志
        </el-button>
      </div>
    </div>

    <!-- 错误摘要 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon error">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.totalErrors }}</div>
          <div class="card-label">总错误数</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon warning">
          <i class="fas fa-clock"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ summary.last24hErrors }}</div>
          <div class="card-label">24小时错误</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon info">
          <i class="fas fa-server"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ backendLogs.length }}</div>
          <div class="card-label">后端日志</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon success">
          <i class="fas fa-desktop"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ frontendLogs.length }}</div>
          <div class="card-label">前端日志</div>
        </div>
      </div>
    </div>

    <!-- 日志标签页 -->
    <el-tabs v-model="activeTab" class="logs-tabs">
      <el-tab-pane label="前端错误" name="frontend">
        <div class="logs-container">
          <div class="logs-filter">
            <el-select v-model="frontendFilter" placeholder="筛选级别" clearable>
              <el-option label="全部" value="" />
              <el-option label="错误" value="ERROR" />
              <el-option label="警告" value="WARN" />
              <el-option label="信息" value="INFO" />
            </el-select>
            <el-input v-model="frontendSearch" placeholder="搜索日志..." clearable>
              <template #prefix>
                <i class="fas fa-search"></i>
              </template>
            </el-input>
          </div>

          <div class="logs-list">
            <div
              v-for="(log, index) in filteredFrontendLogs"
              :key="index"
              :class="['log-item', log.level.toLowerCase()]"
            >
              <div class="log-header">
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                <span :class="['log-level', log.level.toLowerCase()]">{{ log.level }}</span>
                <span class="log-page">{{ log.page }}</span>
                <span v-if="log.component" class="log-component">{{ log.component }}</span>
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div v-if="log.stack && showStack[index]" class="log-stack">
                <pre>{{ log.stack }}</pre>
              </div>
              <div v-if="log.stack" class="log-actions">
                <a @click="toggleStack(index)">
                  {{ showStack[index] ? '隐藏' : '显示' }}堆栈
                </a>
              </div>
            </div>
            <div v-if="filteredFrontendLogs.length === 0" class="no-logs">
              暂无日志记录
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="后端错误" name="backend">
        <div class="logs-container">
          <div class="logs-filter">
            <el-input v-model="backendSearch" placeholder="搜索日志..." clearable>
              <template #prefix>
                <i class="fas fa-search"></i>
              </template>
            </el-input>
            <el-button @click="fetchBackendLogs" :loading="loading">
              刷新后端日志
            </el-button>
          </div>

          <div class="logs-list">
            <div
              v-for="(log, index) in filteredBackendLogs"
              :key="index"
              class="log-item"
            >
              <div class="log-line">{{ log }}</div>
            </div>
            <div v-if="filteredBackendLogs.length === 0" class="no-logs">
              暂无日志记录
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="错误统计" name="stats">
        <div class="stats-container">
          <div class="stats-section">
            <h3>页面错误分布</h3>
            <div class="stats-list">
              <div v-for="(count, page) in summary.pageErrors" :key="page" class="stat-item">
                <span class="stat-label">{{ page }}</span>
                <span class="stat-value">{{ count }}</span>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h3>组件错误分布</h3>
            <div class="stats-list">
              <div v-for="(count, comp) in summary.componentErrors" :key="comp" class="stat-item">
                <span class="stat-label">{{ comp }}</span>
                <span class="stat-value">{{ count }}</span>
              </div>
            </div>
          </div>

          <div v-if="summary.lastError" class="stats-section">
            <h3>最后错误</h3>
            <div class="last-error">
              <div class="error-time">{{ formatTime(summary.lastError.timestamp) }}</div>
              <div class="error-message">{{ summary.lastError.message }}</div>
              <div class="error-page">页面: {{ summary.lastError.page }}</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { errorLogger } from '@/utils/errorLogger'
import { http } from '@/utils/axios'
import { format } from 'date-fns'

const activeTab = ref('frontend')
const loading = ref(false)
const frontendLogs = ref<any[]>([])
const backendLogs = ref<string[]>([])
const frontendFilter = ref('')
const frontendSearch = ref('')
const backendSearch = ref('')
const showStack = ref<Record<number, boolean>>({})
const summary = ref<any>({
  totalErrors: 0,
  last24hErrors: 0,
  pageErrors: {},
  componentErrors: {},
  lastError: null
})

// 筛选前端日志
const filteredFrontendLogs = computed(() => {
  let logs = frontendLogs.value

  if (frontendFilter.value) {
    logs = logs.filter(log => log.level === frontendFilter.value)
  }

  if (frontendSearch.value) {
    const search = frontendSearch.value.toLowerCase()
    logs = logs.filter(log =>
      log.message.toLowerCase().includes(search) ||
      log.page?.toLowerCase().includes(search) ||
      log.component?.toLowerCase().includes(search)
    )
  }

  return logs.reverse() // 最新的在前
})

// 筛选后端日志
const filteredBackendLogs = computed(() => {
  if (!backendSearch.value) {
    return backendLogs.value
  }

  const search = backendSearch.value.toLowerCase()
  return backendLogs.value.filter(log =>
    log.toLowerCase().includes(search)
  )
})

// 格式化时间
const formatTime = (timestamp: string) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
}

// 切换堆栈显示
const toggleStack = (index: number) => {
  showStack.value[index] = !showStack.value[index]
}

// 刷新日志
const refreshLogs = () => {
  loadFrontendLogs()
  fetchBackendLogs()
}

// 加载前端日志
const loadFrontendLogs = () => {
  frontendLogs.value = errorLogger.getRecentLogs(200)
  summary.value = errorLogger.getErrorSummary()
}

// 获取后端日志
const fetchBackendLogs = async () => {
  loading.value = true
  try {
    const response = await http.get('/api/logs/errors?lines=200')
    backendLogs.value = response.logs || []
    ElMessage.success('后端日志加载成功')
  } catch (error) {
    ElMessage.error('加载后端日志失败')
  } finally {
    loading.value = false
  }
}

// 清空前端日志
const clearFrontendLogs = () => {
  errorLogger.clearLogs()
  loadFrontendLogs()
  ElMessage.success('前端日志已清空')
}

// 导出日志
const exportLogs = () => {
  const data = {
    frontend: frontendLogs.value,
    backend: backendLogs.value,
    summary: summary.value,
    exportTime: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `error-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('日志已导出')
}

onMounted(() => {
  loadFrontendLogs()
  fetchBackendLogs()
})
</script>

<style lang="scss" scoped>
.logs-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;

  h1 {
    font-size: 28px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .card-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &.error {
      background: #fee;
      color: #f56565;
    }

    &.warning {
      background: #fef5e6;
      color: #f59e0b;
    }

    &.info {
      background: #e6f3ff;
      color: #3b82f6;
    }

    &.success {
      background: #e6ffe6;
      color: #10b981;
    }
  }

  .card-content {
    flex: 1;

    .card-value {
      font-size: 32px;
      font-weight: 600;
      line-height: 1;
      margin-bottom: 5px;
    }

    .card-label {
      color: #666;
      font-size: 14px;
    }
  }
}

.logs-tabs {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.logs-container {
  padding: 20px 0;
}

.logs-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  .el-input {
    max-width: 300px;
  }
}

.logs-list {
  max-height: 600px;
  overflow-y: auto;
}

.log-item {
  padding: 15px;
  border-left: 3px solid #e5e7eb;
  margin-bottom: 10px;
  background: #f9fafb;
  border-radius: 4px;

  &.error {
    border-left-color: #ef4444;
    background: #fef2f2;
  }

  &.warn {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }

  &.info {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }
}

.log-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;

  .log-time {
    color: #666;
  }

  .log-level {
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 11px;

    &.error {
      background: #ef4444;
      color: white;
    }

    &.warn {
      background: #f59e0b;
      color: white;
    }

    &.info {
      background: #3b82f6;
      color: white;
    }
  }

  .log-page, .log-component {
    color: #666;
    font-size: 12px;
  }
}

.log-message {
  color: #1f2937;
  margin-bottom: 5px;
}

.log-stack {
  background: #f3f4f6;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;

  pre {
    margin: 0;
    font-size: 12px;
    color: #666;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.log-actions {
  margin-top: 5px;

  a {
    color: #3b82f6;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.log-line {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.no-logs {
  text-align: center;
  padding: 40px;
  color: #999;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  padding: 20px 0;
}

.stats-section {
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
  }
}

.stats-list {
  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background: #f9fafb;
    border-radius: 4px;
    margin-bottom: 8px;

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .stat-value {
      font-weight: 600;
      color: #1f2937;
    }
  }
}

.last-error {
  background: #fef2f2;
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid #ef4444;

  .error-time {
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
  }

  .error-message {
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 5px;
  }

  .error-page {
    font-size: 13px;
    color: #666;
  }
}
</style>
