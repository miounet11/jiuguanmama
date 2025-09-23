<template>
  <div class="keyword-manager">
    <!-- 关键词列表 -->
    <div class="keywords-list mb-4">
      <div v-if="localKeywords.length > 0" class="flex flex-wrap gap-2 mb-3">
        <el-tag
          v-for="(keyword, index) in localKeywords"
          :key="index"
          closable
          :type="getKeywordType(keyword)"
          @close="removeKeyword(index)"
          class="keyword-tag"
        >
          {{ keyword }}
        </el-tag>
      </div>

      <!-- 添加关键词输入框 -->
      <div class="add-keyword-section">
        <el-input
          v-if="showKeywordInput"
          ref="keywordInputRef"
          v-model="keywordInputValue"
          size="small"
          placeholder="输入关键词..."
          @keyup.enter="addKeyword"
          @blur="hideKeywordInput"
          @keyup.esc="hideKeywordInput"
          class="w-32"
        />
        <el-button
          v-else
          size="small"
          @click="showKeywordInputBox"
          :icon="'Plus'"
          class="border-dashed"
        >
          添加关键词
        </el-button>

        <!-- 快捷添加按钮 -->
        <div v-if="suggestedKeywords.length > 0" class="mt-2">
          <div class="text-xs text-gray-500 mb-1">建议的关键词:</div>
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="keyword in suggestedKeywords"
              :key="keyword"
              size="small"
              effect="plain"
              class="cursor-pointer suggested-keyword"
              @click="addSuggestedKeyword(keyword)"
            >
              + {{ keyword }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 匹配设置 -->
    <div class="match-settings bg-gray-50 rounded-lg p-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 匹配类型 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            匹配方式
          </label>
          <el-select
            :model-value="matchType"
            @update:model-value="$emit('update:matchType', $event)"
            size="small"
            class="w-full"
          >
            <el-option
              v-for="option in matchTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div>
                <div class="font-medium">{{ option.label }}</div>
                <div class="text-xs text-gray-500">{{ option.description }}</div>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 大小写敏感 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            匹配选项
          </label>
          <div class="space-y-2">
            <el-checkbox
              :model-value="caseSensitive"
              @update:model-value="$emit('update:caseSensitive', $event)"
              size="small"
            >
              区分大小写
            </el-checkbox>
            <div class="text-xs text-gray-500">
              启用后将严格区分大小写字母
            </div>
          </div>
        </div>
      </div>

      <!-- 匹配预览 -->
      <div v-if="testText" class="match-preview mt-4 p-3 bg-white rounded border">
        <div class="text-sm font-medium text-gray-700 mb-2">匹配预览:</div>
        <div class="match-result">
          <div
            v-html="highlightMatches(testText)"
            class="text-sm leading-relaxed"
          />
        </div>
        <div class="mt-2 text-xs text-gray-500">
          找到 {{ getMatchCount(testText) }} 个匹配项
        </div>
      </div>
    </div>

    <!-- 测试区域 -->
    <div class="test-section mt-4">
      <el-collapse>
        <el-collapse-item title="测试关键词匹配" name="test">
          <div class="space-y-3">
            <el-input
              v-model="testText"
              type="textarea"
              :rows="3"
              placeholder="输入测试文本，查看关键词匹配效果..."
              @input="updateTestPreview"
            />

            <div v-if="testText" class="test-results bg-gray-50 rounded p-3">
              <div class="text-sm font-medium text-gray-700 mb-2">
                匹配结果 ({{ getMatchCount(testText) }} 个)
              </div>
              <div class="match-details space-y-1">
                <div
                  v-for="(match, index) in getDetailedMatches(testText)"
                  :key="index"
                  class="flex items-center gap-2 text-sm"
                >
                  <el-tag size="small" :type="getKeywordType(match.keyword)">
                    {{ match.keyword }}
                  </el-tag>
                  <span class="text-gray-600">
                    位置: {{ match.position }}, 匹配: "{{ match.matched }}"
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 批量编辑 -->
    <div class="bulk-edit mt-4">
      <el-collapse>
        <el-collapse-item title="批量编辑关键词" name="bulk">
          <div class="space-y-3">
            <el-input
              v-model="bulkKeywords"
              type="textarea"
              :rows="4"
              placeholder="每行一个关键词，支持批量添加..."
            />
            <div class="flex gap-2">
              <el-button
                size="small"
                type="primary"
                @click="applyBulkKeywords"
              >
                应用批量关键词
              </el-button>
              <el-button
                size="small"
                @click="exportKeywords"
              >
                导出关键词
              </el-button>
              <el-button
                size="small"
                @click="clearAllKeywords"
                type="danger"
                plain
              >
                清空所有
              </el-button>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { MatchType } from '@/types/scenario'

interface Props {
  modelValue: string[]
  matchType: MatchType
  caseSensitive: boolean
  suggestedKeywords?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'update:matchType', value: MatchType): void
  (e: 'update:caseSensitive', value: boolean): void
  (e: 'change'): void
}

const props = withDefaults(defineProps<Props>(), {
  suggestedKeywords: () => []
})

const emit = defineEmits<Emits>()

// 响应式数据
const showKeywordInput = ref(false)
const keywordInputValue = ref('')
const keywordInputRef = ref()
const testText = ref('')
const bulkKeywords = ref('')

// 本地关键词数组
const localKeywords = ref([...props.modelValue])

// 匹配类型选项
const matchTypeOptions = [
  {
    value: 'contains' as MatchType,
    label: '包含匹配',
    description: '文本中包含关键词即匹配'
  },
  {
    value: 'exact' as MatchType,
    label: '精确匹配',
    description: '完全匹配整个词语'
  },
  {
    value: 'starts_with' as MatchType,
    label: '开头匹配',
    description: '文本以关键词开头'
  },
  {
    value: 'ends_with' as MatchType,
    label: '结尾匹配',
    description: '文本以关键词结尾'
  },
  {
    value: 'regex' as MatchType,
    label: '正则表达式',
    description: '使用正则表达式模式匹配'
  },
  {
    value: 'wildcard' as MatchType,
    label: '通配符匹配',
    description: '支持 * 和 ? 通配符'
  }
]

// 计算属性
const getKeywordType = (keyword: string) => {
  if (keyword.includes('*') || keyword.includes('?')) return 'warning'
  if (keyword.includes('|') || keyword.includes('(')) return 'danger'
  if (keyword.length > 10) return 'info'
  return 'primary'
}

// 方法
const showKeywordInputBox = () => {
  showKeywordInput.value = true
  nextTick(() => {
    keywordInputRef.value?.focus()
  })
}

const hideKeywordInput = () => {
  addKeyword()
  showKeywordInput.value = false
}

const addKeyword = () => {
  const keyword = keywordInputValue.value.trim()
  if (keyword && !localKeywords.value.includes(keyword)) {
    localKeywords.value.push(keyword)
    updateKeywords()
  }
  keywordInputValue.value = ''
}

const addSuggestedKeyword = (keyword: string) => {
  if (!localKeywords.value.includes(keyword)) {
    localKeywords.value.push(keyword)
    updateKeywords()
  }
}

const removeKeyword = (index: number) => {
  localKeywords.value.splice(index, 1)
  updateKeywords()
}

const updateKeywords = () => {
  emit('update:modelValue', [...localKeywords.value])
  emit('change')
}

const createMatchRegex = (keyword: string): RegExp => {
  let pattern = keyword

  // 根据匹配类型构建正则表达式
  switch (props.matchType) {
    case 'exact':
      pattern = `\\b${escapeRegExp(keyword)}\\b`
      break
    case 'starts_with':
      pattern = `^${escapeRegExp(keyword)}`
      break
    case 'ends_with':
      pattern = `${escapeRegExp(keyword)}$`
      break
    case 'contains':
      pattern = escapeRegExp(keyword)
      break
    case 'wildcard':
      // 转换通配符为正则表达式
      pattern = keyword
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
        .replace(/\\\*/g, '.*') // * 转换为 .*
        .replace(/\\\?/g, '.') // ? 转换为 .
      break
    case 'regex':
      // 直接使用正则表达式
      pattern = keyword
      break
  }

  const flags = props.caseSensitive ? 'g' : 'gi'
  try {
    return new RegExp(pattern, flags)
  } catch {
    // 如果正则表达式无效，回退到简单的包含匹配
    return new RegExp(escapeRegExp(keyword), flags)
  }
}

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const highlightMatches = (text: string): string => {
  if (!text || localKeywords.value.length === 0) return text

  let highlightedText = text

  localKeywords.value.forEach(keyword => {
    const regex = createMatchRegex(keyword)
    highlightedText = highlightedText.replace(regex, (match) => {
      return `<mark class="bg-yellow-200 px-1 rounded">${match}</mark>`
    })
  })

  return highlightedText
}

const getMatchCount = (text: string): number => {
  if (!text || localKeywords.value.length === 0) return 0

  let count = 0
  localKeywords.value.forEach(keyword => {
    const regex = createMatchRegex(keyword)
    const matches = text.match(regex)
    if (matches) {
      count += matches.length
    }
  })

  return count
}

interface MatchDetail {
  keyword: string
  matched: string
  position: number
}

const getDetailedMatches = (text: string): MatchDetail[] => {
  if (!text || localKeywords.value.length === 0) return []

  const matches: MatchDetail[] = []

  localKeywords.value.forEach(keyword => {
    const regex = createMatchRegex(keyword)
    let match

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        keyword,
        matched: match[0],
        position: match.index
      })
    }
  })

  return matches.sort((a, b) => a.position - b.position)
}

const updateTestPreview = () => {
  // 实时更新测试预览
}

const applyBulkKeywords = () => {
  const keywords = bulkKeywords.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (keywords.length === 0) {
    ElMessage.warning('请输入关键词')
    return
  }

  // 去重并添加
  const newKeywords = [...new Set([...localKeywords.value, ...keywords])]
  localKeywords.value = newKeywords
  updateKeywords()

  bulkKeywords.value = ''
  ElMessage.success(`已添加 ${keywords.length} 个关键词`)
}

const exportKeywords = () => {
  const keywordsText = localKeywords.value.join('\n')

  // 创建下载链接
  const blob = new Blob([keywordsText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'keywords.txt'
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('关键词已导出')
}

const clearAllKeywords = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有关键词吗？此操作不可恢复。',
      '确认清空',
      {
        type: 'warning',
        confirmButtonText: '清空',
        cancelButtonText: '取消'
      }
    )

    localKeywords.value = []
    updateKeywords()
    ElMessage.success('已清空所有关键词')
  } catch {
    // 用户取消
  }
}

// 监听props变化
watch(() => props.modelValue, (newKeywords) => {
  localKeywords.value = [...newKeywords]
}, { deep: true })

// 初始化批量编辑文本
watch(() => localKeywords.value, (newKeywords) => {
  if (bulkKeywords.value === '') {
    bulkKeywords.value = newKeywords.join('\n')
  }
}, { immediate: true })
</script>

<style scoped>
.keyword-manager {
  @apply space-y-4;
}

.keyword-tag {
  @apply cursor-pointer transition-all duration-200;
}

.keyword-tag:hover {
  @apply transform -translate-y-0.5 shadow-sm;
}

.suggested-keyword {
  @apply transition-all duration-200;
}

.suggested-keyword:hover {
  @apply bg-blue-100 border-blue-300 text-blue-700 transform -translate-y-0.5;
}

.border-dashed {
  @apply border-dashed border-gray-300;
}

.border-dashed:hover {
  @apply border-gray-400 bg-gray-50;
}

.match-preview {
  @apply relative;
}

.match-result {
  @apply overflow-auto max-h-32;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 折叠面板样式 */
:deep(.el-collapse) {
  @apply border-none;
}

:deep(.el-collapse-item__header) {
  @apply bg-gray-100 border border-gray-200 rounded-t-md px-3 py-2 text-sm font-medium;
}

:deep(.el-collapse-item__content) {
  @apply bg-white border border-gray-200 border-t-0 rounded-b-md p-3;
}

/* 选择器样式优化 */
:deep(.el-select-dropdown__item) {
  @apply py-2;
}

:deep(.el-select-dropdown__item .font-medium) {
  @apply text-gray-900;
}

:deep(.el-select-dropdown__item .text-xs) {
  @apply text-gray-500 mt-1;
}

/* 复选框样式 */
:deep(.el-checkbox__label) {
  @apply text-sm text-gray-700;
}

/* 高亮标记样式 */
:deep(mark) {
  @apply bg-yellow-200 px-1 rounded;
}

/* 测试结果样式 */
.test-results {
  @apply max-h-40 overflow-y-auto;
}

.match-details {
  @apply space-y-1;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .keyword-tag {
    @apply text-xs;
  }

  .grid.md\\:grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* 动画效果 */
.keyword-tag {
  @apply transition-transform duration-200 ease-in-out;
}

.keyword-tag:hover {
  @apply scale-105;
}

/* 输入框动画 */
.el-input.w-32 {
  @apply transition-all duration-300 ease-in-out;
}

/* 滚动条样式 */
.match-result::-webkit-scrollbar,
.test-results::-webkit-scrollbar {
  @apply w-1;
}

.match-result::-webkit-scrollbar-track,
.test-results::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.match-result::-webkit-scrollbar-thumb,
.test-results::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

.match-result::-webkit-scrollbar-thumb:hover,
.test-results::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}
</style>