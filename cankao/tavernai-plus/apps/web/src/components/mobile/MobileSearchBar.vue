<template>
  <div class="mobile-search-bar">
    <!-- 主搜索框 -->
    <div class="search-input-container">
      <div class="search-input-wrapper">
        <!-- 搜索图标 -->
        <el-icon class="search-icon">
          <Search />
        </el-icon>

        <!-- 输入框 -->
        <input
          ref="searchInput"
          v-model="localQuery"
          type="search"
          :placeholder="placeholder"
          class="search-input"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
        />

        <!-- 清除按钮 -->
        <Transition name="fade">
          <el-button
            v-if="localQuery"
            @click="clearSearch"
            :icon="CircleClose"
            type="text"
            size="small"
            class="clear-btn"
          />
        </Transition>

        <!-- 语音搜索按钮 -->
        <el-button
          v-if="enableVoiceSearch"
          @click="startVoiceSearch"
          :icon="isListening ? 'Loading' : 'Microphone'"
          :type="isListening ? 'primary' : 'text'"
          size="small"
          class="voice-btn"
          :class="{ 'listening': isListening }"
        />

        <!-- 筛选按钮 -->
        <el-button
          @click="toggleFilters"
          :icon="Filter"
          type="text"
          size="small"
          class="filter-btn"
          :class="{ 'active': showFilters || hasActiveFilters }"
        >
          <el-badge
            v-if="activeFilterCount > 0"
            :value="activeFilterCount"
            class="filter-badge"
          />
        </el-button>
      </div>

      <!-- 搜索建议 -->
      <Transition name="slide-down">
        <div
          v-if="showSuggestions && suggestions.length"
          class="search-suggestions"
        >
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            @click="selectSuggestion(suggestion)"
            class="suggestion-item"
            :class="{ 'highlighted': highlightedIndex === index }"
          >
            <el-icon class="suggestion-icon">
              <component :is="suggestion.icon || 'Search'" />
            </el-icon>
            <span class="suggestion-text">{{ suggestion.text }}</span>
            <span v-if="suggestion.count" class="suggestion-count">
              {{ suggestion.count }}
            </span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 快速搜索标签 -->
    <div
      v-if="quickSearchTags.length && !showFilters"
      class="quick-search-tags"
    >
      <div class="tags-container">
        <el-tag
          v-for="tag in quickSearchTags"
          :key="tag"
          @click="selectQuickTag(tag)"
          size="small"
          type="info"
          effect="plain"
          class="quick-tag"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 高级筛选面板 -->
    <Transition name="slide-down">
      <div v-if="showFilters" class="filter-panel">
        <div class="filter-header">
          <h4 class="filter-title">筛选条件</h4>
          <div class="filter-actions">
            <el-button @click="clearAllFilters" type="text" size="small">
              清除全部
            </el-button>
            <el-button @click="toggleFilters" type="text" size="small">
              完成
            </el-button>
          </div>
        </div>

        <div class="filter-content">
          <!-- 分类筛选 -->
          <div class="filter-group">
            <label class="filter-label">分类</label>
            <div class="filter-options">
              <el-checkbox-group v-model="selectedCategories">
                <el-checkbox
                  v-for="category in categories"
                  :key="category.key"
                  :label="category.key"
                  class="filter-checkbox"
                >
                  {{ category.label }}
                  <span class="option-count">({{ category.count }})</span>
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-group">
            <label class="filter-label">标签</label>
            <div class="tag-selector">
              <div class="popular-tags">
                <el-tag
                  v-for="tag in popularTags"
                  :key="tag.name"
                  @click="toggleTag(tag.name)"
                  :type="selectedTags.includes(tag.name) ? 'primary' : 'info'"
                  :effect="selectedTags.includes(tag.name) ? 'dark' : 'plain'"
                  size="small"
                  class="selectable-tag"
                >
                  {{ tag.name }}
                  <span class="tag-count">({{ tag.count }})</span>
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 评分筛选 -->
          <div class="filter-group">
            <label class="filter-label">评分</label>
            <div class="rating-filter">
              <el-rate
                v-model="minRating"
                :max="5"
                :allow-half="true"
                show-text
                :texts="['1星', '2星', '3星', '4星', '5星']"
              />
              <span class="rating-text">{{ minRating }}星以上</span>
            </div>
          </div>

          <!-- 特殊筛选 -->
          <div class="filter-group">
            <label class="filter-label">特殊</label>
            <div class="special-filters">
              <el-checkbox-group v-model="specialFilters">
                <el-checkbox label="new" class="filter-checkbox">
                  最新发布
                </el-checkbox>
                <el-checkbox label="featured" class="filter-checkbox">
                  精选推荐
                </el-checkbox>
                <el-checkbox label="favorited" class="filter-checkbox">
                  我的收藏
                </el-checkbox>
                <el-checkbox label="premium" class="filter-checkbox">
                  高级角色
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 搜索历史（聚焦时显示） -->
    <Transition name="slide-down">
      <div
        v-if="showHistory && searchHistory.length && !localQuery"
        class="search-history"
      >
        <div class="history-header">
          <span class="history-title">搜索历史</span>
          <el-button @click="clearHistory" type="text" size="small">
            清除
          </el-button>
        </div>
        <div class="history-items">
          <div
            v-for="(item, index) in searchHistory.slice(0, 5)"
            :key="index"
            @click="selectHistoryItem(item)"
            class="history-item"
          >
            <el-icon class="history-icon">
              <Clock />
            </el-icon>
            <span class="history-text">{{ item.query }}</span>
            <el-button
              @click.stop="removeHistoryItem(index)"
              :icon="Close"
              type="text"
              size="small"
              class="remove-btn"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import {
  Search,
  CircleClose,
  Microphone,
  Filter,
  Clock,
  Close
} from '@element-plus/icons-vue'

interface SearchSuggestion {
  text: string
  icon?: string
  count?: number
  type?: 'character' | 'tag' | 'category'
}

interface FilterCategory {
  key: string
  label: string
  count: number
}

interface FilterTag {
  name: string
  count: number
}

interface SearchHistoryItem {
  query: string
  timestamp: number
  filters?: Record<string, any>
}

interface Props {
  modelValue: string
  placeholder?: string
  suggestions?: SearchSuggestion[]
  categories?: FilterCategory[]
  popularTags?: FilterTag[]
  quickSearchTags?: string[]
  filters?: Record<string, any>
  enableVoiceSearch?: boolean
  maxHistoryItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索角色、标签...',
  suggestions: () => [],
  categories: () => [],
  popularTags: () => [],
  quickSearchTags: () => [],
  filters: () => ({}),
  enableVoiceSearch: true,
  maxHistoryItems: 10
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [query: string]
  'filter-change': [filters: Record<string, any>]
  'suggestion-click': [suggestion: SearchSuggestion]
}>()

// 引用
const searchInput = ref<HTMLInputElement>()

// 状态
const localQuery = ref(props.modelValue)
const showFilters = ref(false)
const showSuggestions = ref(false)
const showHistory = ref(false)
const isFocused = ref(false)
const isListening = ref(false)
const highlightedIndex = ref(-1)

// 筛选器状态
const selectedCategories = ref<string[]>([])
const selectedTags = ref<string[]>([])
const minRating = ref(0)
const specialFilters = ref<string[]>([])

// 搜索历史
const searchHistory = ref<SearchHistoryItem[]>([])

// 语音识别相关
let recognition: any = null

// 计算属性
const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 ||
         selectedTags.value.length > 0 ||
         minRating.value > 0 ||
         specialFilters.value.length > 0
})

const activeFilterCount = computed(() => {
  return selectedCategories.value.length +
         selectedTags.value.length +
         (minRating.value > 0 ? 1 : 0) +
         specialFilters.value.length
})

const currentFilters = computed(() => ({
  categories: selectedCategories.value,
  tags: selectedTags.value,
  minRating: minRating.value,
  special: specialFilters.value
}))

// 防抖搜索
const debouncedSearch = useDebounceFn((query: string) => {
  emit('search', query)
  addToHistory(query)
}, 300)

// 方法
const handleInput = () => {
  emit('update:modelValue', localQuery.value)
  debouncedSearch(localQuery.value)

  // 显示搜索建议
  if (localQuery.value.length > 0) {
    showSuggestions.value = true
    showHistory.value = false
  } else {
    showSuggestions.value = false
    showHistory.value = isFocused.value
  }
}

const handleFocus = () => {
  isFocused.value = true
  if (!localQuery.value && searchHistory.value.length > 0) {
    showHistory.value = true
  }
}

const handleBlur = () => {
  // 延迟隐藏，以便处理点击事件
  setTimeout(() => {
    isFocused.value = false
    showSuggestions.value = false
    showHistory.value = false
    highlightedIndex.value = -1
  }, 200)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || props.suggestions.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        props.suggestions.length - 1
      )
      break

    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break

    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectSuggestion(props.suggestions[highlightedIndex.value])
      } else {
        debouncedSearch(localQuery.value)
      }
      break

    case 'Escape':
      showSuggestions.value = false
      searchInput.value?.blur()
      break
  }
}

const clearSearch = () => {
  localQuery.value = ''
  emit('update:modelValue', '')
  showSuggestions.value = false
  searchInput.value?.focus()
}

const selectSuggestion = (suggestion: SearchSuggestion) => {
  localQuery.value = suggestion.text
  emit('update:modelValue', suggestion.text)
  showSuggestions.value = false
  debouncedSearch(suggestion.text)
  emit('suggestion-click', suggestion)
}

const selectQuickTag = (tag: string) => {
  localQuery.value = tag
  emit('update:modelValue', tag)
  debouncedSearch(tag)
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
  if (showFilters.value) {
    showSuggestions.value = false
    showHistory.value = false
  }
}

const clearAllFilters = () => {
  selectedCategories.value = []
  selectedTags.value = []
  minRating.value = 0
  specialFilters.value = []
  emitFilterChange()
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  emitFilterChange()
}

const emitFilterChange = () => {
  emit('filter-change', currentFilters.value)
}

// 搜索历史管理
const addToHistory = (query: string) => {
  if (!query.trim()) return

  const item: SearchHistoryItem = {
    query: query.trim(),
    timestamp: Date.now(),
    filters: { ...currentFilters.value }
  }

  // 移除重复项
  const existingIndex = searchHistory.value.findIndex(h => h.query === item.query)
  if (existingIndex > -1) {
    searchHistory.value.splice(existingIndex, 1)
  }

  // 添加到开头
  searchHistory.value.unshift(item)

  // 限制历史记录数量
  if (searchHistory.value.length > props.maxHistoryItems) {
    searchHistory.value = searchHistory.value.slice(0, props.maxHistoryItems)
  }

  // 保存到本地存储
  saveHistoryToStorage()
}

const selectHistoryItem = (item: SearchHistoryItem) => {
  localQuery.value = item.query
  emit('update:modelValue', item.query)

  // 恢复筛选器状态
  if (item.filters) {
    selectedCategories.value = item.filters.categories || []
    selectedTags.value = item.filters.tags || []
    minRating.value = item.filters.minRating || 0
    specialFilters.value = item.filters.special || []
  }

  showHistory.value = false
  debouncedSearch(item.query)
}

const removeHistoryItem = (index: number) => {
  searchHistory.value.splice(index, 1)
  saveHistoryToStorage()
}

const clearHistory = () => {
  searchHistory.value = []
  saveHistoryToStorage()
}

const saveHistoryToStorage = () => {
  try {
    localStorage.setItem('search-history', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.warn('Failed to save search history:', error)
  }
}

const loadHistoryFromStorage = () => {
  try {
    const stored = localStorage.getItem('search-history')
    if (stored) {
      searchHistory.value = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load search history:', error)
  }
}

// 语音搜索
const startVoiceSearch = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported')
    return
  }

  if (isListening.value) {
    stopVoiceSearch()
    return
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SpeechRecognition()

  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'zh-CN'

  recognition.onstart = () => {
    isListening.value = true
  }

  recognition.onresult = (event: any) => {
    const result = event.results[0][0].transcript
    localQuery.value = result
    emit('update:modelValue', result)
    debouncedSearch(result)
  }

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error)
    isListening.value = false
  }

  recognition.onend = () => {
    isListening.value = false
  }

  recognition.start()
}

const stopVoiceSearch = () => {
  if (recognition) {
    recognition.stop()
  }
  isListening.value = false
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localQuery.value) {
    localQuery.value = newValue
  }
})

// 监听筛选器变化
watch([selectedCategories, selectedTags, minRating, specialFilters], () => {
  emitFilterChange()
}, { deep: true })

// 生命周期
onMounted(() => {
  loadHistoryFromStorage()
})

onUnmounted(() => {
  if (recognition) {
    recognition.abort()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mobile-search-bar {
  position: relative;
}

.search-input-container {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--el-fill-color-lighter);
  border-radius: $border-radius-xl;
  padding: $spacing-2 $spacing-4;
  transition: all $transition-base;

  &:focus-within {
    background: white;
    box-shadow: 0 0 0 2px rgba($primary-500, 0.2);
  }

  .search-icon {
    color: var(--el-text-color-placeholder);
    margin-right: $spacing-2;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: $font-size-base;
    color: var(--el-text-color-primary);

    // 防止 iOS 缩放
    font-size: 16px;

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }

    // 移除搜索框的默认样式
    &::-webkit-search-decoration,
    &::-webkit-search-cancel-button,
    &::-webkit-search-results-button,
    &::-webkit-search-results-decoration {
      -webkit-appearance: none;
    }
  }

  .clear-btn,
  .voice-btn,
  .filter-btn {
    margin-left: $spacing-1;
    color: var(--el-text-color-regular);

    &:hover {
      color: $primary-500;
    }
  }

  .voice-btn.listening {
    color: $primary-500;
    animation: pulse 1.5s infinite;
  }

  .filter-btn.active {
    color: $primary-500;
  }
}

.search-suggestions,
.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: var(--el-box-shadow-light);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: $spacing-2;

  @include custom-scrollbar;
}

.suggestion-item,
.history-item {
  display: flex;
  align-items: center;
  padding: $spacing-3 $spacing-4;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:hover,
  &.highlighted {
    background: var(--el-fill-color-light);
  }

  .suggestion-icon,
  .history-icon {
    margin-right: $spacing-3;
    color: var(--el-text-color-placeholder);
  }

  .suggestion-text,
  .history-text {
    flex: 1;
    color: var(--el-text-color-primary);
  }

  .suggestion-count {
    color: var(--el-text-color-placeholder);
    font-size: $font-size-sm;
  }

  .remove-btn {
    opacity: 0;
    transition: opacity $transition-fast;
  }

  &:hover .remove-btn {
    opacity: 1;
  }
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-3 $spacing-4;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .history-title {
    font-size: $font-size-sm;
    color: var(--el-text-color-regular);
    font-weight: $font-weight-medium;
  }
}

.quick-search-tags {
  margin-top: $spacing-3;

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2;
    overflow-x: auto;
    padding-bottom: $spacing-1;

    @include custom-scrollbar;
  }

  .quick-tag {
    cursor: pointer;
    transition: all $transition-fast;
    white-space: nowrap;

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--el-box-shadow-light);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.filter-panel {
  background: white;
  border-radius: $border-radius-lg;
  box-shadow: var(--el-box-shadow-light);
  margin-top: $spacing-3;
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-4;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .filter-title {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: var(--el-text-color-primary);
  }

  .filter-actions {
    display: flex;
    gap: $spacing-2;
  }
}

.filter-content {
  padding: $spacing-4;
}

.filter-group {
  margin-bottom: $spacing-6;

  &:last-child {
    margin-bottom: 0;
  }

  .filter-label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--el-text-color-regular);
    margin-bottom: $spacing-3;
  }
}

.filter-options,
.tag-selector,
.special-filters {
  .filter-checkbox {
    display: flex;
    align-items: center;
    width: 100%;
    margin-bottom: $spacing-2;

    .option-count {
      margin-left: auto;
      color: var(--el-text-color-placeholder);
      font-size: $font-size-sm;
    }
  }
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-2;

  .selectable-tag {
    cursor: pointer;
    transition: all $transition-fast;

    .tag-count {
      margin-left: $spacing-1;
      opacity: 0.7;
    }

    &:hover {
      transform: translateY(-1px);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.rating-filter {
  display: flex;
  align-items: center;
  gap: $spacing-3;

  .rating-text {
    color: var(--el-text-color-regular);
    font-size: $font-size-sm;
  }
}

// 过渡动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 移动端优化
@include mobile-only {
  .search-input-wrapper {
    padding: $spacing-3;
  }

  .filter-content {
    padding: $spacing-3;
  }

  .popular-tags {
    gap: $spacing-1;
  }

  .selectable-tag {
    font-size: $font-size-xs;
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .voice-btn.listening {
    animation: none;
  }

  .quick-tag,
  .selectable-tag {
    transition: none;
  }
}
</style>