<template>
  <el-dialog
    v-model="dialogVisible"
    title="剧本匹配测试"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="test-dialog">
      <!-- 测试输入区域 -->
      <div class="test-input-section mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              测试文本
            </label>
            <el-input
              v-model="testText"
              type="textarea"
              :rows="4"
              placeholder="输入要测试的文本，查看会触发哪些世界信息条目..."
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              测试设置
            </label>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">测试深度</label>
                <el-input-number
                  v-model="testDepth"
                  :min="1"
                  :max="5"
                  size="small"
                  class="w-full"
                />
              </div>

              <el-button
                type="primary"
                size="small"
                @click="performTest"
                :loading="isTestLoading"
                :disabled="!testText.trim()"
                class="w-full"
              >
                执行测试
              </el-button>

              <el-button
                size="small"
                @click="clearTest"
                class="w-full"
              >
                清空
              </el-button>
            </div>
          </div>
        </div>

        <!-- 快速测试示例 -->
        <div class="quick-examples">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            快速测试示例
          </label>
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="example in testExamples"
              :key="example"
              size="small"
              effect="plain"
              class="cursor-pointer"
              @click="useExample(example)"
            >
              {{ example }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 测试结果区域 -->
      <div v-if="testResults" class="test-results">
        <div class="results-header flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900">
            测试结果
          </h4>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>{{ testResults.totalMatches }} 个匹配</span>
            <span>执行时间: {{ testResults.executionTime }}ms</span>
          </div>
        </div>

        <!-- 无匹配结果 -->
        <div v-if="testResults.matchedEntries.length === 0" class="no-results">
          <el-empty
            description="没有找到匹配的世界信息条目"
            :image-size="80"
          >
            <div class="text-sm text-gray-500">
              尝试调整关键词或匹配方式
            </div>
          </el-empty>
        </div>

        <!-- 匹配结果列表 -->
        <div v-else class="results-list space-y-4">
          <div
            v-for="(match, index) in testResults.matchedEntries"
            :key="index"
            class="match-item bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <!-- 匹配条目信息 -->
            <div class="match-header flex items-start justify-between mb-3">
              <div class="flex-1">
                <h5 class="font-medium text-blue-900 mb-1">
                  {{ match.entry.title }}
                </h5>
                <div class="flex items-center gap-4 text-sm text-blue-700">
                  <span>匹配关键词: {{ match.matchedKeywords.join(', ') }}</span>
                  <span>位置: {{ match.matchPosition }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <el-tag
                  type="primary"
                  size="small"
                  effect="dark"
                >
                  优先级 {{ match.entry.priority }}
                </el-tag>
                <el-tag
                  :type="match.entry.isActive ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ match.entry.isActive ? '活跃' : '禁用' }}
                </el-tag>
              </div>
            </div>

            <!-- 插入的内容 -->
            <div class="insert-content bg-white border border-blue-100 rounded p-3 mb-3">
              <div class="text-sm font-medium text-gray-700 mb-1">
                将插入的内容:
              </div>
              <div class="text-sm text-gray-800">
                {{ match.insertText }}
              </div>
            </div>

            <!-- 条目详细信息 -->
            <div class="entry-details text-xs text-blue-600 space-y-1">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <span>插入深度: {{ match.entry.insertDepth }}</span>
                <span>触发概率: {{ (match.entry.probability * 100).toFixed(0) }}%</span>
                <span>匹配方式: {{ getMatchTypeLabel(match.entry.matchType) }}</span>
                <span>插入位置: {{ getPositionLabel(match.entry.position) }}</span>
              </div>
            </div>

            <!-- 展开查看完整条目 -->
            <el-collapse class="mt-3">
              <el-collapse-item title="查看完整条目内容" :name="index">
                <div class="full-entry bg-gray-50 rounded p-3">
                  <div class="space-y-2 text-sm">
                    <div>
                      <span class="font-medium text-gray-700">完整内容:</span>
                      <div class="mt-1 text-gray-600">{{ match.entry.content }}</div>
                    </div>
                    <div>
                      <span class="font-medium text-gray-700">所有关键词:</span>
                      <div class="mt-1">
                        <el-tag
                          v-for="keyword in match.entry.keywords"
                          :key="keyword"
                          size="small"
                          :type="match.matchedKeywords.includes(keyword) ? 'primary' : 'info'"
                          effect="plain"
                          class="mr-1 mb-1"
                        >
                          {{ keyword }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>

        <!-- 处理后的文本预览 -->
        <div v-if="testResults.processedText !== testText" class="processed-text mt-6">
          <h5 class="font-semibold text-gray-900 mb-3">处理后的文本预览:</h5>
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div
              v-html="highlightProcessedText(testResults.processedText)"
              class="text-sm leading-relaxed whitespace-pre-wrap"
            />
          </div>
        </div>
      </div>

      <!-- 测试历史 -->
      <div v-if="testHistory.length > 0" class="test-history mt-6">
        <el-collapse>
          <el-collapse-item title="测试历史" name="history">
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div
                v-for="(history, index) in testHistory"
                :key="index"
                class="history-item flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <span class="truncate flex-1 mr-2">{{ history.text }}</span>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span>{{ history.matches }} 个匹配</span>
                  <el-button
                    size="small"
                    text
                    @click="useHistoryText(history.text)"
                  >
                    重用
                  </el-button>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <div>
          <el-button
            v-if="testResults"
            @click="exportTestResults"
            size="small"
            :icon="'Download'"
          >
            导出结果
          </el-button>
        </div>
        <div>
          <el-button @click="handleClose">
            关闭
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { useScenarioStore } from '@/stores/scenario'
import type {
  Scenario,
  TestMatchingResult,
  MatchType,
  InsertPosition
} from '@/types/scenario'

interface Props {
  modelValue: boolean
  scenario?: Scenario | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

interface TestHistory {
  text: string
  matches: number
  timestamp: number
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const testText = ref('')
const testDepth = ref(1)
const isTestLoading = ref(false)
const testResults = ref<TestMatchingResult | null>(null)
const testHistory = reactive<TestHistory[]>([])

// 测试示例
const testExamples = [
  '这是一个测试文本',
  '角色走进了森林',
  '法师施展了火球术',
  '国王下达了命令',
  '战士拿起了剑'
]

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const performTest = async () => {
  if (!testText.value.trim() || !props.scenario) return

  isTestLoading.value = true

  try {
    const result = await scenarioStore.testMatching(props.scenario.id, {
      testText: testText.value,
      depth: testDepth.value
    })

    testResults.value = result

    // 添加到测试历史
    addToHistory(testText.value, result.totalMatches)

    ElMessage.success(`测试完成，找到 ${result.totalMatches} 个匹配`)
  } catch (error) {
    console.error('测试失败:', error)
    ElMessage.error('测试失败')
  } finally {
    isTestLoading.value = false
  }
}

const clearTest = () => {
  testText.value = ''
  testResults.value = null
}

const useExample = (example: string) => {
  testText.value = example
  performTest()
}

const useHistoryText = (text: string) => {
  testText.value = text
}

const addToHistory = (text: string, matches: number) => {
  // 检查是否已存在
  const existingIndex = testHistory.findIndex(h => h.text === text)
  if (existingIndex !== -1) {
    testHistory.splice(existingIndex, 1)
  }

  // 添加到开头
  testHistory.unshift({
    text,
    matches,
    timestamp: Date.now()
  })

  // 限制历史记录数量
  if (testHistory.length > 10) {
    testHistory.splice(10)
  }
}

const getMatchTypeLabel = (matchType: MatchType): string => {
  const labels = {
    exact: '精确',
    contains: '包含',
    regex: '正则',
    starts_with: '开头',
    ends_with: '结尾',
    wildcard: '通配符'
  }
  return labels[matchType] || matchType
}

const getPositionLabel = (position: InsertPosition): string => {
  const labels = {
    before: '前插入',
    after: '后插入',
    replace: '替换'
  }
  return labels[position] || position
}

const highlightProcessedText = (text: string): string => {
  // 高亮显示插入的内容
  return text.replace(/\[插入内容\]/g, '<mark class="bg-yellow-200 px-1 rounded">[插入内容]</mark>')
}

const exportTestResults = () => {
  if (!testResults.value) return

  const data = {
    testText: testText.value,
    testDepth: testDepth.value,
    scenario: props.scenario?.name,
    results: testResults.value,
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `test-results-${Date.now()}.json`
  a.click()

  URL.revokeObjectURL(url)
  ElMessage.success('测试结果已导出')
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.test-dialog {
  @apply space-y-6;
}

.match-item {
  @apply transition-all duration-200;
}

.match-item:hover {
  @apply shadow-md;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .md\\:col-span-3 {
    grid-column: span 3 / span 3;
  }
}

/* 折叠面板样式 */
:deep(.el-collapse) {
  @apply border-none;
}

:deep(.el-collapse-item__header) {
  @apply bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm font-medium;
}

:deep(.el-collapse-item__content) {
  @apply bg-white border border-gray-200 border-t-0 rounded-b p-3;
}

/* 标签样式 */
:deep(.el-tag) {
  @apply transition-all duration-200;
}

.cursor-pointer:hover {
  @apply transform -translate-y-0.5 shadow-sm;
}

/* 高亮样式 */
:deep(mark) {
  @apply bg-yellow-200 px-1 rounded;
}

/* 滚动条样式 */
.test-history .overflow-y-auto::-webkit-scrollbar {
  @apply w-1;
}

.test-history .overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.test-history .overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

/* 历史记录项样式 */
.history-item {
  @apply transition-all duration-200;
}

.history-item:hover {
  @apply bg-gray-100;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid.md\\:grid-cols-4 {
    @apply grid-cols-1;
  }

  .md\\:col-span-3 {
    @apply col-span-1;
  }

  .results-header .flex {
    @apply flex-col gap-2 items-start;
  }

  .match-header .flex {
    @apply flex-col gap-2 items-start;
  }

  .entry-details .grid {
    @apply grid-cols-1 gap-1;
  }
}

/* 空状态样式 */
.no-results {
  @apply py-8;
}

:deep(.el-empty) {
  @apply py-4;
}

/* 动画效果 */
.match-item {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>