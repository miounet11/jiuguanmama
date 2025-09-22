<template>
  <div class="quick-chat-test-page p-6 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Quick Chat 功能测试</h1>
      <p class="text-gray-600">
        此页面用于测试一键开始对话流程的完整性和性能表现
      </p>
    </div>

    <!-- 测试控制面板 -->
    <div class="test-control-panel bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">测试控制</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <el-button
          @click="runFlowTest"
          :loading="isTestingFlow"
          type="primary"
          size="large"
          class="w-full"
        >
          运行流程测试
        </el-button>

        <el-button
          @click="runAcceptanceTest"
          :loading="isTestingAcceptance"
          type="success"
          size="large"
          class="w-full"
        >
          运行验收测试
        </el-button>

        <el-button
          @click="runPerformanceTest"
          :loading="isTestingPerformance"
          type="warning"
          size="large"
          class="w-full"
        >
          性能压力测试
        </el-button>
      </div>

      <!-- 测试参数 -->
      <div class="test-params">
        <h3 class="text-lg font-medium mb-3">测试参数</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              测试角色ID (可选)
            </label>
            <el-input
              v-model="testCharacterId"
              placeholder="留空使用随机角色"
              clearable
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              压力测试次数
            </label>
            <el-input-number
              v-model="stressTestCount"
              :min="1"
              :max="100"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 测试结果展示 -->
    <div v-if="testResults.length > 0" class="test-results">
      <h2 class="text-xl font-semibold mb-4">测试结果</h2>

      <div class="space-y-4">
        <div
          v-for="(result, index) in testResults"
          :key="index"
          class="result-card bg-white rounded-lg shadow-sm border p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-medium">{{ result.type }}</h3>
            <div class="flex items-center space-x-2">
              <el-tag
                :type="result.passed ? 'success' : 'danger'"
                size="small"
              >
                {{ result.passed ? '通过' : '失败' }}
              </el-tag>
              <span class="text-sm text-gray-500">
                {{ new Date(result.timestamp).toLocaleTimeString() }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="metric">
              <div class="text-2xl font-bold" :class="result.duration <= 30000 ? 'text-green-600' : 'text-red-600'">
                {{ (result.duration / 1000).toFixed(2) }}s
              </div>
              <div class="text-sm text-gray-500">总耗时</div>
            </div>
            <div class="metric">
              <div class="text-2xl font-bold text-blue-600">
                {{ result.score || 0 }}
              </div>
              <div class="text-sm text-gray-500">得分 (0-100)</div>
            </div>
            <div class="metric">
              <div class="text-2xl font-bold text-purple-600">
                {{ result.stagesCount || 0 }}
              </div>
              <div class="text-sm text-gray-500">完成阶段</div>
            </div>
          </div>

          <!-- 阶段详情 -->
          <div v-if="result.stages && result.stages.length > 0" class="stages mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">阶段详情</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div
                v-for="stage in result.stages"
                :key="stage.stage"
                class="stage-item p-2 rounded text-xs"
                :class="stage.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ stage.stage }}</span>
                  <span :class="stage.passed ? 'text-green-600' : 'text-red-600'">
                    {{ stage.passed ? '✓' : '✗' }}
                  </span>
                </div>
                <div class="text-gray-500 mt-1">
                  {{ stage.duration.toFixed(0) }}ms
                </div>
              </div>
            </div>
          </div>

          <!-- 建议 -->
          <div v-if="result.recommendations && result.recommendations.length > 0" class="recommendations">
            <h4 class="text-sm font-medium text-gray-700 mb-2">优化建议</h4>
            <ul class="space-y-1">
              <li
                v-for="(rec, recIndex) in result.recommendations"
                :key="recIndex"
                class="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded"
              >
                {{ rec }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时组件测试 -->
    <div class="live-test mt-8">
      <h2 class="text-xl font-semibold mb-4">实时组件测试</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- QuickStartFlow 组件测试 -->
        <div class="component-test bg-white rounded-lg shadow-sm border p-4">
          <h3 class="text-lg font-medium mb-3">QuickStartFlow 组件</h3>
          <div class="h-96 overflow-auto border rounded">
            <QuickStartFlow
              :character-id="testCharacterId"
              @chat-started="handleTestChatStarted"
              @flow-completed="handleTestFlowCompleted"
            />
          </div>
        </div>

        <!-- OneClickChatButton 组件测试 -->
        <div class="component-test bg-white rounded-lg shadow-sm border p-4">
          <h3 class="text-lg font-medium mb-3">OneClickChatButton 组件</h3>
          <div class="space-y-4">
            <OneClickChatButton
              :character-id="testCharacterId || 'test-character'"
              type="primary"
              size="large"
              :quick-mode="true"
              button-text="测试快速对话"
              :auto-navigate="false"
              @chat-started="handleTestChatStarted"
              @chat-error="handleTestChatError"
            />

            <OneClickChatButton
              :character-id="testCharacterId || 'test-character'"
              type="success"
              size="default"
              :quick-mode="false"
              button-text="测试自定义对话"
              :auto-navigate="false"
              @chat-started="handleTestChatStarted"
              @chat-error="handleTestChatError"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 性能监控 -->
    <div class="performance-monitor mt-8 bg-white rounded-lg shadow-sm border p-6">
      <h2 class="text-xl font-semibold mb-4">性能监控</h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="metric-card text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ performanceMetrics.cacheHitRate.toFixed(1) }}%</div>
          <div class="text-sm text-gray-600">缓存命中率</div>
        </div>
        <div class="metric-card text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ performanceMetrics.averageLoadTime.toFixed(0) }}ms</div>
          <div class="text-sm text-gray-600">平均加载时间</div>
        </div>
        <div class="metric-card text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ performanceMetrics.totalTests }}</div>
          <div class="text-sm text-gray-600">测试次数</div>
        </div>
        <div class="metric-card text-center p-4 bg-amber-50 rounded-lg">
          <div class="text-2xl font-bold text-amber-600">{{ performanceMetrics.memoryUsage.toFixed(1) }}KB</div>
          <div class="text-sm text-gray-600">内存使用</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import QuickStartFlow from '@/components/chat/QuickStartFlow.vue'
import OneClickChatButton from '@/components/chat/OneClickChatButton.vue'
import {
  QuickChatFlowTester,
  AcceptanceCriteriaChecker,
  runQuickChatValidation,
  runAcceptanceChecks,
  type FlowValidationResult
} from '@/utils/quickChatValidation'
import { useQuickChatPerformance } from '@/composables/useQuickChatPerformance'

// 测试状态
const isTestingFlow = ref(false)
const isTestingAcceptance = ref(false)
const isTestingPerformance = ref(false)

// 测试参数
const testCharacterId = ref('')
const stressTestCount = ref(10)

// 测试结果
interface TestResult {
  type: string
  timestamp: number
  passed: boolean
  duration: number
  score?: number
  stagesCount?: number
  stages?: any[]
  recommendations?: string[]
}

const testResults = ref<TestResult[]>([])

// 性能指标
const performanceMetrics = reactive({
  cacheHitRate: 0,
  averageLoadTime: 0,
  totalTests: 0,
  memoryUsage: 0
})

// 性能监控
const { getPerformanceReport, resetMetrics } = useQuickChatPerformance()

// 运行流程测试
const runFlowTest = async () => {
  isTestingFlow.value = true

  try {
    const result = await runQuickChatValidation(testCharacterId.value || undefined)

    testResults.value.unshift({
      type: '流程测试',
      timestamp: Date.now(),
      passed: result.passed,
      duration: result.totalDuration,
      score: result.score,
      stagesCount: result.stages.length,
      stages: result.stages,
      recommendations: result.recommendations
    })

    updatePerformanceMetrics()

    ElMessage.success({
      message: `流程测试完成，用时 ${(result.totalDuration / 1000).toFixed(2)} 秒`,
      duration: 3000
    })
  } catch (error: any) {
    console.error('流程测试失败:', error)
    ElMessage.error('流程测试失败: ' + error.message)
  } finally {
    isTestingFlow.value = false
  }
}

// 运行验收测试
const runAcceptanceTest = async () => {
  isTestingAcceptance.value = true

  try {
    const startTime = performance.now()
    const result = await runAcceptanceChecks()
    const duration = performance.now() - startTime

    const passedCount = Object.values(result.details).filter(Boolean).length
    const totalCount = Object.keys(result.details).length
    const score = Math.round((passedCount / totalCount) * 100)

    testResults.value.unshift({
      type: '验收测试',
      timestamp: Date.now(),
      passed: result.passed,
      duration,
      score,
      stagesCount: passedCount,
      recommendations: result.passed ? [] : ['存在未通过的验收标准，请检查详细结果']
    })

    updatePerformanceMetrics()

    ElMessage.success({
      message: `验收测试完成，通过率 ${score}%`,
      duration: 3000
    })
  } catch (error: any) {
    console.error('验收测试失败:', error)
    ElMessage.error('验收测试失败: ' + error.message)
  } finally {
    isTestingAcceptance.value = false
  }
}

// 运行性能压力测试
const runPerformanceTest = async () => {
  isTestingPerformance.value = true

  try {
    const results: FlowValidationResult[] = []
    const startTime = performance.now()

    // 并发运行多个测试
    const promises = Array.from({ length: stressTestCount.value }, async (_, index) => {
      const tester = new QuickChatFlowTester()
      return await tester.runFullFlowTest(testCharacterId.value || undefined)
    })

    const testResults = await Promise.all(promises)
    const totalDuration = performance.now() - startTime

    // 计算统计数据
    const avgDuration = testResults.reduce((sum, r) => sum + r.totalDuration, 0) / testResults.length
    const passRate = testResults.filter(r => r.passed).length / testResults.length * 100
    const avgScore = testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length

    const result: TestResult = {
      type: `性能压力测试 (${stressTestCount.value}次)`,
      timestamp: Date.now(),
      passed: passRate >= 80, // 80%通过率算成功
      duration: totalDuration,
      score: Math.round(avgScore),
      stagesCount: testResults.length,
      recommendations: [
        `平均单次耗时: ${(avgDuration / 1000).toFixed(2)}秒`,
        `通过率: ${passRate.toFixed(1)}%`,
        `并发处理: ${(stressTestCount.value / (totalDuration / 1000)).toFixed(1)} 测试/秒`
      ]
    }

    testResults.value.unshift(result)
    updatePerformanceMetrics()

    ElMessage.success({
      message: `压力测试完成，通过率 ${passRate.toFixed(1)}%`,
      duration: 3000
    })
  } catch (error: any) {
    console.error('性能测试失败:', error)
    ElMessage.error('性能测试失败: ' + error.message)
  } finally {
    isTestingPerformance.value = false
  }
}

// 更新性能指标
const updatePerformanceMetrics = () => {
  const report = getPerformanceReport()
  performanceMetrics.cacheHitRate = report.cacheHitRate
  performanceMetrics.totalTests += 1

  // 计算平均加载时间
  if (testResults.value.length > 0) {
    const recentResults = testResults.value.slice(0, 10) // 最近10次测试
    performanceMetrics.averageLoadTime = recentResults.reduce((sum, r) => sum + r.duration, 0) / recentResults.length
  }

  performanceMetrics.memoryUsage = report.cacheMemoryUsage || 0
}

// 测试事件处理
const handleTestChatStarted = (sessionId: string) => {
  console.log('测试对话开始:', sessionId)
  ElMessage.success(`测试对话已开始: ${sessionId}`)
}

const handleTestChatError = (error: string) => {
  console.error('测试对话错误:', error)
  ElMessage.error(`测试对话错误: ${error}`)
}

const handleTestFlowCompleted = () => {
  console.log('测试流程完成')
  ElMessage.info('测试流程已完成')
}

// 页面初始化
onMounted(() => {
  // 预设一个测试角色ID
  testCharacterId.value = 'test-character-1'

  // 初始化性能监控
  updatePerformanceMetrics()

  // 每5秒更新一次性能指标
  setInterval(updatePerformanceMetrics, 5000)
})
</script>

<style scoped>
.quick-chat-test-page {
  min-height: 100vh;
  background: #f8fafc;
}

.result-card {
  transition: all 0.3s ease;
}

.result-card:hover {
  shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric {
  text-align: center;
}

.stage-item {
  transition: all 0.2s ease;
}

.stage-item:hover {
  transform: translateY(-1px);
  shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metric-card {
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.component-test {
  min-height: 400px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .quick-chat-test-page {
    padding: 16px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>