<template>
  <div class="scenario-preview h-full flex flex-col">
    <!-- 预览头部 -->
    <div class="preview-header backdrop-blur-sm border-b p-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">剧本预览</h2>
          <p class="text-sm text-purple-300">
            实时查看剧本效果和世界信息条目匹配
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- 预览模式切换 -->
          <el-radio-group v-model="previewMode" size="small">
            <el-radio-button label="info">基本信息</el-radio-button>
            <el-radio-button label="test">匹配测试</el-radio-button>
            <el-radio-button label="export">导出预览</el-radio-button>
          </el-radio-group>

          <!-- 刷新按钮 -->
          <el-button
            @click="refreshPreview"
            :icon="'Refresh'"
            size="small"
            circle
          />
        </div>
      </div>
    </div>

    <!-- 预览内容 -->
    <div class="preview-content flex-1 overflow-y-auto">
      <!-- 基本信息预览 -->
      <div v-if="previewMode === 'info'" class="info-preview p-6">
        <!-- 剧本基本信息 -->
        <div class="scenario-info bg-gradient-to-r from-purple-900/50 to-blue-900/30 backdrop-blur-sm rounded-lg p-6 mb-6 border border-purple-700/30">
          <h3 class="text-xl font-bold text-white mb-2">{{ scenario.name }}</h3>
          <p v-if="scenario.description" class="text-purple-200 mb-4">
            {{ scenario.description }}
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="stat-item">
              <div class="stat-label text-purple-300">分类</div>
              <div class="stat-value text-white font-semibold">{{ scenario.category }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label text-purple-300">语言</div>
              <div class="stat-value text-white font-semibold">{{ scenario.language || 'zh-CN' }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label text-purple-300">条目数量</div>
              <div class="stat-value text-white font-semibold">{{ entries.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label text-purple-300">活跃条目</div>
              <div class="stat-value text-white font-semibold">{{ activeEntriesCount }}</div>
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="scenario.tags && scenario.tags.length > 0" class="mt-4">
            <div class="text-sm font-medium text-purple-200 mb-2">标签:</div>
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="tag in scenario.tags"
                :key="tag"
                size="small"
                effect="plain"
                type="primary"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 世界信息条目概览 -->
        <div class="entries-overview">
          <h4 class="text-lg font-semibold text-white mb-4">
            世界信息条目概览
          </h4>

          <div v-if="entries.length === 0" class="text-center py-8 text-purple-300">
            暂无世界信息条目
          </div>

          <div v-else class="space-y-4">
            <!-- 按分类分组显示 -->
            <div
              v-for="group in entryGroups"
              :key="group.category"
              class="entry-group bg-purple-900/20 backdrop-blur-sm rounded-lg p-4 border border-purple-700/20"
            >
              <div class="flex items-center justify-between mb-3">
                <h5 class="font-medium text-white">
                  {{ group.category }}
                  <span class="text-sm text-purple-300 ml-2">
                    ({{ group.entries.length }} 个条目)
                  </span>
                </h5>
                <el-button
                  @click="toggleGroupExpanded(group.category)"
                  :icon="group.expanded ? 'ArrowUp' : 'ArrowDown'"
                  size="small"
                  text
                  type="primary"
                />
              </div>

              <div v-show="group.expanded" class="space-y-2">
                <div
                  v-for="entry in group.entries"
                  :key="entry.id"
                  class="entry-item bg-purple-800/30 backdrop-blur-sm rounded-lg border border-purple-600/30 p-3 hover:bg-purple-800/40 transition-all duration-200"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <h6 class="font-medium text-white truncate">
                          {{ entry.title }}
                        </h6>
                        <el-tag
                          :type="entry.isActive ? 'success' : 'info'"
                          size="small"
                          effect="dark"
                        >
                          {{ entry.isActive ? '活跃' : '禁用' }}
                        </el-tag>
                        <el-tag
                          size="small"
                          effect="dark"
                          type="warning"
                        >
                          优先级 {{ entry.priority }}
                        </el-tag>
                      </div>

                      <div class="text-sm text-purple-200 mb-2 line-clamp-2">
                        {{ entry.content }}
                      </div>

                      <div class="flex items-center gap-4 text-xs text-purple-300">
                        <span>关键词: {{ entry.keywords.join(', ') }}</span>
                        <span>匹配方式: {{ getMatchTypeLabel(entry.matchType) }}</span>
                        <span>触发概率: {{ (entry.probability * 100).toFixed(0) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 匹配测试预览 -->
      <div v-else-if="previewMode === 'test'" class="test-preview p-6">
        <div class="test-input-section mb-6">
          <h4 class="text-lg font-semibold text-white mb-4">
            匹配测试
          </h4>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-purple-200 mb-2">
                测试文本
              </label>
              <el-input
                v-model="testText"
                type="textarea"
                :rows="4"
                placeholder="输入测试文本，查看哪些世界信息条目会被触发..."
                @input="performTest"
              />
            </div>

            <div class="flex items-center gap-4">
              <div>
                <label class="block text-sm font-medium text-purple-200 mb-1">
                  测试深度
                </label>
                <el-input-number
                  v-model="testDepth"
                  :min="1"
                  :max="5"
                  size="small"
                  @change="performTest"
                />
              </div>

              <el-button
                type="primary"
                @click="performTest"
                :loading="isTestLoading"
                :disabled="!testText.trim()"
              >
                执行测试
              </el-button>
            </div>
          </div>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResults" class="test-results">
          <div class="flex items-center justify-between mb-4">
            <h5 class="font-semibold text-white">
              测试结果 ({{ testResults.totalMatches }} 个匹配)
            </h5>
            <div class="text-sm text-purple-300">
              执行时间: {{ testResults.executionTime }}ms
            </div>
          </div>

          <div v-if="testResults.matchedEntries.length === 0" class="text-center py-8 text-purple-300">
            没有找到匹配的世界信息条目
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(match, index) in testResults.matchedEntries"
              :key="index"
              class="match-result bg-purple-900/40 backdrop-blur-sm border border-purple-600/40 rounded-lg p-4 hover:bg-purple-900/50 transition-all duration-200"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h6 class="font-medium text-white">
                    {{ match.entry.title }}
                  </h6>
                  <div class="text-sm text-purple-200">
                    匹配关键词: {{ match.matchedKeywords.join(', ') }}
                  </div>
                </div>
                <el-tag
                  type="primary"
                  size="small"
                  effect="dark"
                >
                  位置 {{ match.matchPosition }}
                </el-tag>
              </div>

              <div class="bg-purple-800/30 backdrop-blur-sm rounded border border-purple-600/30 p-3 mb-2">
                <div class="text-sm text-purple-200 mb-1">将插入的内容:</div>
                <div class="text-sm text-white">{{ match.insertText }}</div>
              </div>

              <div class="text-xs text-purple-300">
                优先级: {{ match.entry.priority }} |
                插入深度: {{ match.entry.insertDepth }} |
                触发概率: {{ (match.entry.probability * 100).toFixed(0) }}%
              </div>
            </div>
          </div>

          <!-- 处理后的文本 -->
          <div v-if="testResults.processedText !== testText" class="processed-text mt-6">
            <h5 class="font-semibold text-white mb-2">处理后的文本:</h5>
            <div class="bg-purple-900/30 backdrop-blur-sm rounded border border-purple-600/30 p-4">
              <div
                v-html="highlightProcessedText(testResults.processedText)"
                class="text-sm leading-relaxed whitespace-pre-wrap text-purple-100"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 导出预览 -->
      <div v-else-if="previewMode === 'export'" class="export-preview p-6">
        <h4 class="text-lg font-semibold text-white mb-4">
          导出预览
        </h4>

        <div class="space-y-6">
          <!-- 导出格式选择 -->
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              导出格式
            </label>
            <el-radio-group v-model="exportFormat">
              <el-radio label="json">JSON格式</el-radio>
              <el-radio label="yaml">YAML格式</el-radio>
              <el-radio label="text">纯文本格式</el-radio>
            </el-radio-group>
          </div>

          <!-- 预览内容 -->
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              预览内容
            </label>
            <div class="bg-purple-950/50 backdrop-blur-sm border border-purple-700/30 text-purple-100 rounded-lg p-4 overflow-auto max-h-96">
              <pre><code>{{ getExportPreview() }}</code></pre>
            </div>
          </div>

          <!-- 导出操作 -->
          <div class="flex gap-3">
            <el-button
              type="primary"
              @click="exportScenario"
              :icon="'Download'"
            >
              导出剧本
            </el-button>
            <el-button
              @click="copyToClipboard"
              :icon="'CopyDocument'"
            >
              复制到剪贴板
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, ArrowUp, ArrowDown, Download, CopyDocument } from '@element-plus/icons-vue'
import { useScenarioStore } from '@/stores/scenario'
import type {
  Scenario,
  WorldInfoEntry,
  TestMatchingResult,
  MatchType
} from '@/types/scenario'

interface Props {
  scenario: Scenario
  entries: WorldInfoEntry[]
}

const props = defineProps<Props>()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const previewMode = ref<'info' | 'test' | 'export'>('info')
const testText = ref('')
const testDepth = ref(1)
const isTestLoading = ref(false)
const testResults = ref<TestMatchingResult | null>(null)
const exportFormat = ref<'json' | 'yaml' | 'text'>('json')
const expandedGroups = ref<Set<string>>(new Set())

// 计算属性
const activeEntriesCount = computed(() => {
  return props.entries.filter(entry => entry.isActive).length
})

const entryGroups = computed(() => {
  const groupMap = new Map<string, WorldInfoEntry[]>()

  props.entries.forEach(entry => {
    const category = entry.category || '未分类'
    if (!groupMap.has(category)) {
      groupMap.set(category, [])
    }
    groupMap.get(category)!.push(entry)
  })

  return Array.from(groupMap.entries()).map(([category, entries]) => ({
    category,
    entries: entries.sort((a, b) => (b.priority || 0) - (a.priority || 0)),
    expanded: expandedGroups.value.has(category)
  }))
})

// 方法
const refreshPreview = () => {
  // 刷新预览数据
  if (previewMode.value === 'test' && testText.value.trim()) {
    performTest()
  }
}

const toggleGroupExpanded = (category: string) => {
  if (expandedGroups.value.has(category)) {
    expandedGroups.value.delete(category)
  } else {
    expandedGroups.value.add(category)
  }
}

const getMatchTypeLabel = (matchType: MatchType): string => {
  const labels = {
    exact: '精确匹配',
    contains: '包含匹配',
    regex: '正则表达式',
    starts_with: '开头匹配',
    ends_with: '结尾匹配',
    wildcard: '通配符匹配'
  }
  return labels[matchType] || matchType
}

const performTest = async () => {
  if (!testText.value.trim()) return

  isTestLoading.value = true

  try {
    const result = await scenarioStore.testMatching(props.scenario.id, {
      testText: testText.value,
      depth: testDepth.value
    })

    testResults.value = result
  } catch (error) {
    console.error('测试匹配失败:', error)
    ElMessage.error('测试失败')
  } finally {
    isTestLoading.value = false
  }
}

const highlightProcessedText = (text: string): string => {
  // 高亮显示插入的内容
  return text.replace(/\[插入内容\]/g, '<mark class="bg-yellow-200 px-1 rounded">[插入内容]</mark>')
}

const getExportPreview = (): string => {
  const exportData = {
    scenario: {
      name: props.scenario.name,
      description: props.scenario.description,
      category: props.scenario.category,
      language: props.scenario.language,
      tags: props.scenario.tags
    },
    entries: props.entries.map(entry => ({
      title: entry.title,
      content: entry.content,
      keywords: entry.keywords,
      priority: entry.priority,
      insertDepth: entry.insertDepth,
      probability: entry.probability,
      matchType: entry.matchType,
      caseSensitive: entry.caseSensitive,
      isActive: entry.isActive,
      triggerOnce: entry.triggerOnce,
      excludeRecursion: entry.excludeRecursion,
      category: entry.category,
      group: entry.group,
      position: entry.position
    })),
    exportDate: new Date().toISOString(),
    version: '1.0'
  }

  switch (exportFormat.value) {
    case 'json':
      return JSON.stringify(exportData, null, 2)

    case 'yaml':
      // 简单的YAML格式化
      return convertToYAML(exportData)

    case 'text':
      return convertToText(exportData)

    default:
      return JSON.stringify(exportData, null, 2)
  }
}

const convertToYAML = (data: any): string => {
  // 简单的YAML转换实现
  let yaml = ''
  yaml += `scenario:\n`
  yaml += `  name: "${data.scenario.name}"\n`
  yaml += `  description: "${data.scenario.description || ''}"\n`
  yaml += `  category: "${data.scenario.category}"\n`
  yaml += `  language: "${data.scenario.language}"\n`
  yaml += `  tags:\n`
  data.scenario.tags?.forEach((tag: string) => {
    yaml += `    - "${tag}"\n`
  })

  yaml += `\nentries:\n`
  data.entries.forEach((entry: any) => {
    yaml += `  - title: "${entry.title}"\n`
    yaml += `    content: "${entry.content}"\n`
    yaml += `    keywords:\n`
    entry.keywords.forEach((keyword: string) => {
      yaml += `      - "${keyword}"\n`
    })
    yaml += `    priority: ${entry.priority}\n`
    yaml += `    matchType: "${entry.matchType}"\n`
    yaml += `    isActive: ${entry.isActive}\n\n`
  })

  return yaml
}

const convertToText = (data: any): string => {
  let text = ''
  text += `剧本名称: ${data.scenario.name}\n`
  text += `描述: ${data.scenario.description || '无'}\n`
  text += `分类: ${data.scenario.category}\n`
  text += `语言: ${data.scenario.language}\n`
  text += `标签: ${data.scenario.tags?.join(', ') || '无'}\n\n`

  text += `世界信息条目:\n`
  text += `${'='.repeat(50)}\n\n`

  data.entries.forEach((entry: any, index: number) => {
    text += `${index + 1}. ${entry.title}\n`
    text += `   内容: ${entry.content}\n`
    text += `   关键词: ${entry.keywords.join(', ')}\n`
    text += `   优先级: ${entry.priority}\n`
    text += `   匹配方式: ${entry.matchType}\n`
    text += `   状态: ${entry.isActive ? '活跃' : '禁用'}\n\n`
  })

  return text
}

const exportScenario = async () => {
  try {
    const content = getExportPreview()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${props.scenario.name}.${exportFormat.value}`
    a.click()

    URL.revokeObjectURL(url)
    ElMessage.success('剧本导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const copyToClipboard = async () => {
  try {
    const content = getExportPreview()
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 监听预览模式变化
watch(previewMode, (newMode) => {
  if (newMode === 'info') {
    // 默认展开第一个分组
    if (entryGroups.value.length > 0) {
      expandedGroups.value.add(entryGroups.value[0].category)
    }
  }
})

// 初始化
expandedGroups.value.add('通用')
</script>

<style scoped>
.scenario-preview {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  background: linear-gradient(135deg, var(--surface-0) 0%, var(--surface-1) 50%, var(--surface-2) 100%);
  color: var(--text-primary);
}

.preview-header {
  background: rgba(37, 37, 68, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-primary);
}

.stat-item {
  @apply text-center;
}

.stat-label {
  @apply text-xs font-medium uppercase tracking-wide;
  color: var(--text-tertiary);
}

.stat-value {
  @apply text-lg font-semibold mt-1;
  color: var(--text-primary);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.match-result {
  @apply transition-all duration-200;
}

.match-result:hover {
  @apply shadow-md;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* 代码块样式 */
pre {
  @apply text-sm;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
}

code {
  @apply text-gray-100;
}

/* 滚动条样式 */
.preview-content::-webkit-scrollbar {
  @apply w-2;
}

.preview-content::-webkit-scrollbar-track {
  background: var(--surface-2);
}

.preview-content::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: var(--radius-base);
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid.grid-cols-2.md\\:grid-cols-4 {
    
  }

  .stat-item {
    @apply text-left;
  }

  .preview-header .flex {
    @apply flex-col gap-3 items-start;
  }
}

/* 动画效果 */
.entry-group {
  @apply transition-all duration-200;
}

.entry-item {
  @apply transition-all duration-200;
}

.entry-item:hover {
  @apply shadow-sm border-gray-300;
}

/* 高亮样式 */
:deep(mark) {
  @apply bg-yellow-200 px-1 rounded;
}

/* 标签样式 */
:deep(.el-tag) {
  @apply font-medium;
}

/* 单选按钮组样式 */
:deep(.el-radio-group) {
  @apply bg-gray-100 rounded-lg p-1;
}

:deep(.el-radio-button__inner) {
  @apply border-none bg-transparent px-3 py-1 text-sm;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  @apply bg-white shadow-sm text-blue-600;
}

/* 输入框样式 */
:deep(.el-textarea__inner) {
  @apply font-mono text-sm;
}

/* 测试结果动画 */
.match-result {
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

/* 加载状态 */
.is-loading {
  @apply opacity-50 pointer-events-none;
}
</style>