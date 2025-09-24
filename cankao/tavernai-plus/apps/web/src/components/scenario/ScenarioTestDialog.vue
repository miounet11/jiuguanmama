<template>
  <!-- 模态框遮罩 -->
  <div
    v-if="dialogVisible"
    class="fixed inset-0 z-50 flex items-center justify-center"
    @click="handleMaskClick"
  >
    <!-- 遮罩背景 -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

    <!-- 对话框内容 -->
    <div
      class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- 对话框头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">
          剧本匹配测试
        </h2>
        <TavernButton
          variant="ghost"
          size="sm"
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600"
        >
          <TavernIcon name="x" />
        </TavernButton>
      </div>

      <!-- 对话框主体 -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
        <div class="test-dialog space-y-6">
          <!-- 测试输入区域 -->
          <div class="test-input-section">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div class="md:col-span-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  测试文本
                </label>
                <TavernInput
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
                    <TavernInput
                      v-model="testDepth"
                      type="number"
                      :min="1"
                      :max="5"
                      size="sm"
                      class="w-full"
                    />
                  </div>

                  <TavernButton
                    variant="primary"
                    size="sm"
                    @click="performTest"
                    :disabled="isTestLoading || !testText.trim()"
                    class="w-full"
                  >
                    <TavernIcon v-if="isTestLoading" name="loading" class="animate-spin mr-2" />
                    {{ isTestLoading ? '测试中...' : '执行测试' }}
                  </TavernButton>

                  <TavernButton
                    variant="outline"
                    size="sm"
                    @click="clearTest"
                    class="w-full"
                  >
                    清空
                  </TavernButton>
                </div>
              </div>
            </div>

            <!-- 快速测试示例 -->
            <div class="quick-examples">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                快速测试示例
              </label>
              <div class="flex flex-wrap gap-2">
                <TavernBadge
                  v-for="example in testExamples"
                  :key="example"
                  variant="outline"
                  class="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  @click="useExample(example)"
                >
                  {{ example }}
                </TavernBadge>
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
            <div v-if="testResults.matchedEntries.length === 0" class="no-results py-8 text-center">
              <div class="text-gray-400 mb-2">
                <TavernIcon name="search" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
              </div>
              <div class="text-gray-600 mb-2">没有找到匹配的世界信息条目</div>
              <div class="text-sm text-gray-500">
                尝试调整关键词或匹配方式
              </div>
            </div>

            <!-- 匹配结果列表 -->
            <div v-else class="results-list space-y-4">
              <TavernCard
                v-for="(match, index) in testResults.matchedEntries"
                :key="index"
                class="match-item bg-blue-50 border-blue-200"
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
                    <TavernBadge variant="primary" size="sm">
                      优先级 {{ match.entry.priority }}
                    </TavernBadge>
                    <TavernBadge
                      :variant="match.entry.isActive ? 'success' : 'secondary'"
                      size="sm"
                    >
                      {{ match.entry.isActive ? '活跃' : '禁用' }}
                    </TavernBadge>
                  </div>
                </div>

                <!-- 插入的内容 -->
                <TavernCard class="bg-white border-blue-100 mb-3">
                  <div class="text-sm font-medium text-gray-700 mb-1">
                    将插入的内容:
                  </div>
                  <div class="text-sm text-gray-800">
                    {{ match.insertText }}
                  </div>
                </TavernCard>

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
                <div class="mt-3">
                  <TavernButton
                    variant="ghost"
                    size="sm"
                    @click="toggleExpanded(index)"
                    class="w-full justify-between"
                  >
                    <span>查看完整条目内容</span>
                    <TavernIcon
                      :name="expandedItems.has(index) ? 'chevron-up' : 'chevron-down'"
                    />
                  </TavernButton>

                  <div v-if="expandedItems.has(index)" class="mt-3">
                    <TavernCard class="bg-gray-50">
                      <div class="space-y-2 text-sm">
                        <div>
                          <span class="font-medium text-gray-700">完整内容:</span>
                          <div class="mt-1 text-gray-600">{{ match.entry.content }}</div>
                        </div>
                        <div>
                          <span class="font-medium text-gray-700">所有关键词:</span>
                          <div class="mt-1 flex flex-wrap gap-1">
                            <TavernBadge
                              v-for="keyword in match.entry.keywords"
                              :key="keyword"
                              size="sm"
                              :variant="match.matchedKeywords.includes(keyword) ? 'primary' : 'secondary'"
                            >
                              {{ keyword }}
                            </TavernBadge>
                          </div>
                        </div>
                      </div>
                    </TavernCard>
                  </div>
                </div>
              </TavernCard>
            </div>

            <!-- 处理后的文本预览 -->
            <div v-if="testResults.processedText !== testText" class="processed-text mt-6">
              <h5 class="font-semibold text-gray-900 mb-3">处理后的文本预览:</h5>
              <TavernCard class="bg-gray-50 border-gray-200">
                <div
                  v-html="highlightProcessedText(testResults.processedText)"
                  class="text-sm leading-relaxed whitespace-pre-wrap"
                />
              </TavernCard>
            </div>
          </div>

          <!-- 测试历史 -->
          <div v-if="testHistory.length > 0" class="test-history mt-6">
            <TavernButton
              variant="ghost"
              @click="toggleHistory"
              class="w-full justify-between mb-3"
            >
              <span>测试历史</span>
              <TavernIcon :name="showHistory ? 'chevron-up' : 'chevron-down'" />
            </TavernButton>

            <div v-if="showHistory" class="space-y-2 max-h-40 overflow-y-auto">
              <div
                v-for="(history, index) in testHistory"
                :key="index"
                class="history-item flex items-center justify-between p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors"
              >
                <span class="truncate flex-1 mr-2">{{ history.text }}</span>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span>{{ history.matches }} 个匹配</span>
                  <TavernButton
                    variant="ghost"
                    size="xs"
                    @click="useHistoryText(history.text)"
                  >
                    重用
                  </TavernButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200">
        <div>
          <TavernButton
            v-if="testResults"
            variant="outline"
            size="sm"
            @click="exportTestResults"
          >
            <TavernIcon name="download" class="mr-2" />
            导出结果
          </TavernButton>
        </div>
        <div class="flex gap-3">
          <TavernButton
            variant="outline"
            @click="handleClose"
          >
            关闭
          </TavernButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernInput from '@/components/design-system/TavernInput.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'
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
const expandedItems = ref(new Set<number>())
const showHistory = ref(false)

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

    console.log(`测试完成，找到 ${result.totalMatches} 个匹配`)
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    isTestLoading.value = false
  }
}

const clearTest = () => {
  testText.value = ''
  testResults.value = null
  expandedItems.value.clear()
}

const useExample = (example: string) => {
  testText.value = example
  performTest()
}

const useHistoryText = (text: string) => {
  testText.value = text
}

const toggleExpanded = (index: number) => {
  if (expandedItems.value.has(index)) {
    expandedItems.value.delete(index)
  } else {
    expandedItems.value.add(index)
  }
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
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
  console.log('测试结果已导出')
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleMaskClick = () => {
  // 点击遮罩关闭对话框
  handleClose()
}
</script>

<style scoped>
/* 基础样式 */
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
  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .md\:col-span-3 {
    grid-column: span 3 / span 3;
  }
}

/* 高亮样式 */
:deep(mark) {
  @apply bg-yellow-200 px-1 rounded;
}

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  @apply w-1;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

/* 历史记录项样式 */
.history-item {
  @apply transition-all duration-200;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid.md\:grid-cols-4 {
    @apply grid-cols-1;
  }

  .md\:col-span-3 {
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

/* 模态框动画 */
.fixed.inset-0 {
  animation: fadeIn 0.2s ease;
}

.relative.bg-white {
  animation: slideInScale 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>