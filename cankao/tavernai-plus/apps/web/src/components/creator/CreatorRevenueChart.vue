<template>
  <el-card class="revenue-chart" shadow="hover">
    <template #header>
      <div class="card-header">
        <h3>收益趋势</h3>
        <el-radio-group v-model="timeRange" size="small" @change="loadChartData">
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
          <el-radio-button label="90d">近90天</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <div v-loading="loading" class="chart-content">
      <div class="revenue-summary">
        <div class="summary-item">
          <p class="summary-label">总收益</p>
          <p class="summary-value primary">¥{{ formatCurrency(totalRevenue) }}</p>
          <p class="summary-change positive">
            <el-icon><CaretTop /></el-icon>
            {{ revenueGrowth }}%
          </p>
        </div>
        <div class="summary-item">
          <p class="summary-label">本月收益</p>
          <p class="summary-value">¥{{ formatCurrency(monthlyRevenue) }}</p>
        </div>
        <div class="summary-item">
          <p class="summary-label">待结算</p>
          <p class="summary-value warning">¥{{ formatCurrency(pendingRevenue) }}</p>
        </div>
      </div>

      <div ref="chartContainer" class="chart-container"></div>

      <div class="revenue-breakdown">
        <h4>收益来源</h4>
        <div class="breakdown-list">
          <div
            v-for="source in revenueSources"
            :key="source.name"
            class="breakdown-item"
          >
            <div class="breakdown-label">
              <span class="breakdown-dot" :style="{ background: source.color }"></span>
              <span>{{ source.name }}</span>
            </div>
            <div class="breakdown-value">
              <span class="amount">¥{{ formatCurrency(source.amount) }}</span>
              <span class="percentage">{{ source.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { CaretTop } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';

// Mock data - replace with actual API data
const timeRange = ref('30d');
const loading = ref(false);
const chartContainer = ref<HTMLElement | null>(null);
let chart: ECharts | null = null;

const totalRevenue = ref(12580.5);
const monthlyRevenue = ref(3420.8);
const pendingRevenue = ref(850.3);
const revenueGrowth = ref(15.6);

const revenueSources = ref([
  { name: '角色购买', amount: 5680, percentage: 45, color: '#409EFF' },
  { name: '剧本订阅', amount: 3890, percentage: 31, color: '#67C23A' },
  { name: '打赏收入', amount: 1980, percentage: 16, color: '#E6A23C' },
  { name: '广告分成', amount: 1030, percentage: 8, color: '#F56C6C' },
]);

const chartData = computed(() => {
  // Mock chart data - replace with actual data based on timeRange
  const days = timeRange.value === '7d' ? 7 : timeRange.value === '30d' ? 30 : 90;
  const dates: string[] = [];
  const revenues: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
    revenues.push(Math.floor(Math.random() * 500) + 50);
  }

  return { dates, revenues };
});

function formatCurrency(value: number): string {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function initChart() {
  if (!chartContainer.value) return;

  chart = echarts.init(chartContainer.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.value.dates,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '收益',
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#409EFF',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
            ],
          },
        },
        data: chartData.value.revenues,
      },
    ],
  };

  chart.setOption(option);
}

function loadChartData() {
  loading.value = true;
  // Simulate API call
  setTimeout(() => {
    if (chart) {
      chart.setOption({
        xAxis: {
          data: chartData.value.dates,
        },
        series: [
          {
            data: chartData.value.revenues,
          },
        ],
      });
    }
    loading.value = false;
  }, 500);
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  initChart();

  // Handle resize
  window.addEventListener('resize', () => {
    chart?.resize();
  });

  // Observe container resize
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartContainer.value);
  }
});

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', () => {
    chart?.resize();
  });
});

watch(timeRange, () => {
  loadChartData();
});
</script>

<style scoped>
.revenue-chart {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chart-content {
  min-height: 400px;
}

.revenue-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  padding: 16px;
  background: #f4f4f5;
  border-radius: 8px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px 0;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 4px 0;
  color: #303133;
}

.summary-value.primary {
  color: #409eff;
}

.summary-value.warning {
  color: #e6a23c;
}

.summary-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin: 0;
}

.summary-change.positive {
  color: #67c23a;
}

.summary-change.negative {
  color: #f56c6c;
}

.chart-container {
  width: 100%;
  height: 300px;
  margin-bottom: 24px;
}

.revenue-breakdown h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f4f4f5;
  border-radius: 8px;
}

.breakdown-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #303133;
}

.breakdown-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.breakdown-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breakdown-value .amount {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.breakdown-value .percentage {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .revenue-summary {
    grid-template-columns: 1fr;
  }

  .summary-value {
    font-size: 20px;
  }

  .chart-container {
    height: 250px;
  }
}
</style>
