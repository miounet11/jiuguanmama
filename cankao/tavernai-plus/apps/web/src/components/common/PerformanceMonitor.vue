<template>
  <Teleport to="body">
    <div 
      v-if="showPanel && isDev"
      class="performance-panel"
    >
      <div class="panel-header">
        <div class="panel-title">
          <el-icon><Monitor /></el-icon>
          性能监控
        </div>
        <div class="panel-controls">
          <span class="score">{{ state.score }}</span>
          <el-button size="small" text @click="refreshMetrics">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button size="small" text @click="closePanel">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="panel-content">
        <div class="metrics-section">
          <h4>Core Web Vitals</h4>
          <div class="metrics-grid">
            <div v-for="(metric, key) in coreWebVitals" :key="key" class="metric-item">
              <div class="metric-name">{{ key }}</div>
              <div class="metric-value">{{ formatMetric(metric) }}</div>
              <div class="metric-rating">{{ metric.rating }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElIcon, ElButton } from 'element-plus'
import { Monitor, Refresh, Close } from '@element-plus/icons-vue'
import { usePerformanceMonitoring } from '@/composables/usePerformanceMonitoring'

const isDev = import.meta.env.DEV
const showPanel = ref(false)

const {
  state,
  collectMetrics,
  formatMetric
} = usePerformanceMonitoring()

const coreWebVitals = computed(() => {
  const report = state.report
  if (!report) return {}
  
  const vitals: any = {}
  if (report.LCP) vitals.LCP = report.LCP
  if (report.FID) vitals.FID = report.FID
  if (report.CLS) vitals.CLS = report.CLS
  
  return vitals
})

const closePanel = () => {
  showPanel.value = false
}

const refreshMetrics = async () => {
  await collectMetrics()
}
</script>

<style scoped lang="scss">
.performance-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px 8px 0 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score {
  padding: 2px 6px;
  border-radius: 4px;
  background: #52c41a;
  color: white;
  font-weight: bold;
}

.panel-content {
  padding: 12px;
}

.metrics-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.metric-item {
  text-align: center;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.metric-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.metric-value {
  font-weight: bold;
  margin-bottom: 2px;
}

.metric-rating {
  font-size: 11px;
  opacity: 0.8;
}
</style>
