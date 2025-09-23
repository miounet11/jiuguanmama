<template>
  <div class="character-list-page">
    <!-- 页面头部 -->
    <div class="character-list-header">
      <div class="character-list-container">
        <div class="character-list-header-content">
          <div class="character-list-title-section">
            <h1 class="character-list-title">探索角色</h1>
            <p class="character-list-subtitle">
              发现有趣的AI角色，开始你的对话之旅
            </p>

            <!-- 统计信息 -->
            <div v-if="!filterState.isEmpty" class="character-list-stats">
              <span class="character-list-stat">
                找到 {{ filterState.filteredCharacters.length }} 个角色
              </span>
              <span v-if="filterState.hasActiveFilters" class="character-list-stat">
                （已应用筛选）
              </span>
              <span v-if="filterState.isSearching" class="character-list-stat">
                <TavernIcon name="spinner" size="xs" />
                搜索中...
              </span>
            </div>
          </div>

          <!-- 创建角色按钮 -->
          <TavernButton
            variant="primary"
            icon-left="plus"
            @click="handleCreateCharacter"
          >
            创建角色
          </TavernButton>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="character-list-filters">
      <div class="character-list-container">
        <div class="character-list-filters-content">
          <!-- 搜索框 -->
          <div class="character-list-search-section">
            <TavernInput
              v-model="searchQuery"
              placeholder="搜索角色名称、描述或标签..."
              icon-left="search"
              clearable
              @clear="filterState.clearSearch"
            />

            <!-- 搜索建议 -->
            <div v-if="searchSuggestions.length > 0" class="character-search-suggestions">
              <div class="character-search-suggestions-content">
                <div class="character-search-suggestions-title">热门搜索：</div>
                <div class="character-search-suggestions-list">
                  <TavernBadge
                    v-for="suggestion in searchSuggestions"
                    :key="suggestion"
                    size="xs"
                    clickable
                    @click="searchQuery = suggestion"
                  >
                    {{ suggestion }}
                  </TavernBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- 筛选控制 -->
          <div class="character-list-filter-controls">
            <!-- 分类选择 -->
            <select
              v-model="selectedCategory"
              class="character-filter-select"
            >
              <option value="">所有分类</option>
              <option
                v-for="category in filterState.availableCategories"
                :key="category"
                :value="category"
              >
                {{ getCategoryLabel(category) }}
              </option>
            </select>

            <!-- 排序选择 -->
            <select
              v-model="selectedSort"
              class="character-filter-select"
            >
              <option value="popular">最受欢迎</option>
              <option value="newest">最新添加</option>
              <option value="rating">评分最高</option>
              <option value="favorites">收藏最多</option>
              <option value="name">按名称排序</option>
            </select>

            <!-- 高级筛选切换 -->
            <TavernButton
              variant="outline"
              icon-left="filter"
              :active="showAdvancedFilters"
              @click="showAdvancedFilters = !showAdvancedFilters"
            >
              筛选
            </TavernButton>

            <!-- 清除筛选 -->
            <TavernButton
              v-if="filterState.hasActiveFilters"
              variant="ghost"
              icon-left="x"
              @click="handleClearFilters"
            >
              清除
            </TavernButton>
          </div>
        </div>

        <!-- 高级筛选面板 -->
        <Transition name="slide-down">
          <div v-if="showAdvancedFilters" class="character-advanced-filters">
            <div class="character-advanced-filters-grid">
              <!-- 评分筛选 -->
              <div class="character-filter-group">
                <label class="character-filter-label">最低评分</label>
                <select
                  :value="filters.rating?.min || ''"
                  @change="updateRatingFilter('min', $event.target.value)"
                  class="character-filter-input"
                >
                  <option value="">不限</option>
                  <option value="4.5">4.5分以上</option>
                  <option value="4.0">4.0分以上</option>
                  <option value="3.5">3.5分以上</option>
                  <option value="3.0">3.0分以上</option>
                </select>
              </div>

              <!-- 内容分级 -->
              <div class="character-filter-group">
                <label class="character-filter-label">内容分级</label>
                <div class="character-filter-checkboxes">
                  <label class="character-filter-checkbox">
                    <input
                      type="checkbox"
                      :checked="filters.isNSFW === false"
                      @change="filterState.toggleBooleanFilter('isNSFW')"
                    />
                    <span>安全内容</span>
                  </label>
                  <label class="character-filter-checkbox">
                    <input
                      type="checkbox"
                      :checked="filters.isNSFW === true"
                      @change="handleNSFWFilter"
                    />
                    <span>NSFW</span>
                  </label>
                </div>
              </div>

              <!-- 特殊标签 -->
              <div class="character-filter-group">
                <label class="character-filter-label">特殊标签</label>
                <div class="character-filter-checkboxes">
                  <label class="character-filter-checkbox">
                    <input
                      type="checkbox"
                      :checked="filters.isNew === true"
                      @change="filterState.toggleBooleanFilter('isNew')"
                    />
                    <span>新角色</span>
                  </label>
                  <label class="character-filter-checkbox">
                    <input
                      type="checkbox"
                      :checked="filters.isPremium === true"
                      @change="filterState.toggleBooleanFilter('isPremium')"
                    />
                    <span>高级角色</span>
                  </label>
                  <label class="character-filter-checkbox">
                    <input
                      type="checkbox"
                      :checked="filters.isFavorited === true"
                      @change="filterState.toggleBooleanFilter('isFavorited')"
                    />
                    <span>已收藏</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 活跃标签 -->
            <div v-if="activeTags.length > 0" class="character-active-tags">
              <div class="character-active-tags-label">已选标签：</div>
              <div class="character-active-tags-list">
                <TavernBadge
                  v-for="tag in activeTags"
                  :key="tag"
                  variant="primary"
                  size="sm"
                  closable
                  @close="filterState.removeTag(tag)"
                >
                  {{ tag }}
                </TavernBadge>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 瀑布流角色列表 -->
    <div class="character-list-content">
      <div class="character-list-container">
        <MasonryGrid
          :items="filterState.filteredCharacters"
          :loading="isLoading"
          :column-count="'auto'"
          :gap="24"
          :min-item-width="280"
          :max-item-width="360"
          loading-text="正在加载更多角色..."
          empty-title="没有找到角色"
          empty-message="试试调整筛选条件或搜索其他内容"
          @scroll-end="handleLoadMore"
        >
          <template #default="{ item: character }">
            <CharacterCard2
              :character="character"
              :aspect-ratio="getCardAspectRatio(character)"
              @click="handleCharacterClick(character)"
              @favorite="handleFavorite(character.id)"
              @quick-chat-started="handleQuickChatStarted"
            />
          </template>

          <template #empty>
            <div class="character-empty-state">
              <div class="character-empty-icon">
                <TavernIcon name="users" size="xl" />
              </div>
              <h3 class="character-empty-title">
                {{ searchQuery ? '没有找到匹配的角色' : '还没有角色' }}
              </h3>
              <p class="character-empty-message">
                {{ searchQuery
                  ? '试试调整搜索词或筛选条件'
                  : '创建第一个角色开始你的AI对话之旅'
                }}
              </p>
              <div class="character-empty-actions">
                <TavernButton
                  v-if="filterState.hasActiveFilters"
                  variant="outline"
                  @click="handleClearFilters"
                >
                  清除筛选
                </TavernButton>
                <TavernButton
                  variant="primary"
                  @click="handleCreateCharacter"
                >
                  {{ searchQuery ? '创建新角色' : '立即创建' }}
                </TavernButton>
              </div>
            </div>
          </template>
        </MasonryGrid>
      </div>
    </div>

    <!-- 角色创建对话框 -->
    <CharacterCreateDialog
      v-if="showCreateDialog"
      @close="showCreateDialog = false"
      @created="handleCharacterCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import { useChatStore } from '@/stores/chat'
import { useCharacterFilter } from '@/composables/useCharacterFilter'
import { ElMessage } from 'element-plus'

// 组件导入
import MasonryGrid from '@/components/common/MasonryGrid.vue'
import CharacterCard2 from '@/components/character/CharacterCard2.vue'
import CharacterCreateDialog from '@/components/character/CharacterCreateDialog.vue'
import {
  TavernButton,
  TavernInput,
  TavernBadge,
  TavernIcon
} from '@/components/design-system'

const router = useRouter()
const characterStore = useCharacterStore()
const chatStore = useChatStore()

// 本地状态
const showAdvancedFilters = ref(false)
const showCreateDialog = ref(false)
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(24)

// 搜索建议
const searchSuggestions = ref([
  '动漫', '游戏', '原创', 'AI助手', 'VTuber'
])

// 筛选状态管理
const filterState = useCharacterFilter({
  characters: computed(() => characterStore.characters || []),
  initialSearch: '',
  initialSort: 'popular',
  searchDebounceMs: 300
})

// 计算属性
const searchQuery = computed({
  get: () => filterState.searchQuery.value,
  set: (value) => filterState.updateSearch(value)
})

const selectedCategory = computed({
  get: () => filterState.filters.value.category || '',
  set: (value) => filterState.updateFilter('category', value || undefined)
})

const selectedSort = computed({
  get: () => filterState.sortBy.value,
  set: (value) => filterState.updateSort(value)
})

const filters = computed(() => filterState.filters.value)

const activeTags = computed(() => filters.value.tags || [])

// 分类标签映射
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    anime: '动漫角色',
    game: '游戏角色',
    movie: '影视角色',
    book: '文学角色',
    original: '原创角色',
    historical: '历史人物',
    vtuber: 'VTuber',
    assistant: 'AI助手'
  }
  return labels[category] || category
}

// 获取卡片宽高比
const getCardAspectRatio = (character: any): '4:3' | '1:1' | 'auto' => {
  // 根据角色类型或内容动态调整
  if (character.description && character.description.length > 200) {
    return 'auto' // 长描述使用自适应高度
  }
  if (character.tags && character.tags.length > 5) {
    return 'auto' // 标签多时使用自适应高度
  }
  return '4:3' // 默认使用4:3比例
}

// 评分筛选更新
const updateRatingFilter = (type: 'min' | 'max', value: string) => {
  const numValue = value ? parseFloat(value) : undefined
  const currentRating = filters.value.rating || {}

  filterState.updateFilter('rating', {
    ...currentRating,
    [type]: numValue
  })
}

// NSFW 筛选处理
const handleNSFWFilter = () => {
  const currentValue = filters.value.isNSFW
  if (currentValue === true) {
    // 当前是 NSFW = true，点击后清除筛选
    filterState.updateFilter('isNSFW', undefined)
  } else {
    // 当前是 undefined 或 false，点击后设为 true
    filterState.updateFilter('isNSFW', true)
  }
}

// 清除所有筛选
const handleClearFilters = () => {
  filterState.clearAll()
  showAdvancedFilters.value = false
  searchSuggestions.value = ['动漫', '游戏', '原创', 'AI助手', 'VTuber']
}

// 加载更多（无限滚动）
const handleLoadMore = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    currentPage.value++
    await characterStore.loadMoreCharacters({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      category: selectedCategory.value,
      sort: selectedSort.value
    })
  } catch (error) {
    console.error('加载更多角色失败:', error)
    ElMessage.error('加载失败，请稍后重试')
    currentPage.value-- // 回滚页数
  } finally {
    isLoading.value = false
  }
}

// 点击角色卡片
const handleCharacterClick = async (character: any) => {
  try {
    // 创建或加载会话
    const session = await chatStore.createSession(
      character.id,
      character.name,
      character.avatar
    )

    if (session) {
      // 导航到聊天页面
      router.push(`/chat/${session.id}`)
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败，请重试')
  }
}

// 收藏角色
const handleFavorite = async (characterId: string) => {
  try {
    await characterStore.toggleFavorite(characterId)

    // 更新筛选结果中的收藏状态
    const character = filterState.filteredCharacters.value.find(c => c.id === characterId)
    if (character) {
      character.isFavorited = !character.isFavorited
    }

    ElMessage.success('操作成功')
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 快速对话启动
const handleQuickChatStarted = async (characterId: string, sessionId: string) => {
  try {
    // 导航到快速对话页面
    router.push(`/quick-chat/${characterId}?session=${sessionId}`)
  } catch (error) {
    console.error('启动快速对话失败:', error)
    ElMessage.error('启动失败，请重试')
  }
}

// 创建角色
const handleCreateCharacter = () => {
  showCreateDialog.value = true
}

// 角色创建成功
const handleCharacterCreated = (character: any) => {
  showCreateDialog.value = false
  ElMessage.success('角色创建成功！')

  // 刷新列表
  characterStore.fetchCharacters()
}

// 监听搜索变化，更新搜索建议
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    searchSuggestions.value = ['动漫', '游戏', '原创', 'AI助手', 'VTuber']
  } else {
    // 基于搜索词生成相关建议
    const relatedSuggestions = filterState.availableTags.value
      .filter(tag => tag.toLowerCase().includes(newQuery.toLowerCase()))
      .slice(0, 5)

    searchSuggestions.value = relatedSuggestions.length > 0
      ? relatedSuggestions
      : ['动漫', '游戏', '原创']
  }
})

// 监听筛选变化，重置分页
watch(
  [searchQuery, selectedCategory, selectedSort, () => filters.value],
  () => {
    currentPage.value = 1
  },
  { deep: true }
)

// 生命周期
onMounted(async () => {
  isLoading.value = true
  try {
    // 加载角色列表
    await characterStore.fetchCharacters()
  } catch (error) {
    console.error('加载角色列表失败:', error)
    ElMessage.error('加载失败，请刷新页面重试')
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss">
// ==================== 页面结构样式 ====================
.character-list-page {
  min-height: 100vh;
  background: var(--surface-0);
  color: var(--text-primary);
}

// === 页面头部 ===
.character-list-header {
  background: var(--surface-1);
  border-bottom: var(--space-px) solid var(--border-secondary);
  box-shadow: var(--shadow-sm);
}

.character-list-container {
  max-width: var(--container-2xl);
  margin: 0 auto;
  padding: 0 var(--container-padding);

  @media (min-width: 640px) {
    padding: 0 var(--space-6);
  }

  @media (min-width: 1024px) {
    padding: 0 var(--space-8);
  }
}

.character-list-header-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-normal);
  padding: var(--space-6) 0;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.character-list-title-section {
  flex: 1;
}

.character-list-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
  line-height: var(--leading-tight);

  @media (max-width: 640px) {
    font-size: var(--text-2xl);
  }
}

.character-list-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3);
  line-height: var(--leading-normal);

  @media (max-width: 640px) {
    font-size: var(--text-base);
  }
}

.character-list-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.character-list-stat {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

// === 搜索和筛选栏 ===
.character-list-filters {
  background: var(--surface-1);
  border-bottom: var(--space-px) solid var(--border-secondary);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  backdrop-filter: blur(var(--space-2));
}

.character-list-filters-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-normal);
  padding: var(--space-4) 0;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--spacing-comfortable);
  }
}

.character-list-search-section {
  flex: 1;
  position: relative;
}

.character-search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  margin-top: var(--space-1);
}

.character-search-suggestions-content {
  background: var(--surface-2);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: var(--dropdown-shadow);
}

.character-search-suggestions-title {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-2);
}

.character-search-suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.character-list-filter-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);

  @media (max-width: 640px) {
    width: 100%;
  }
}

.character-filter-select {
  padding: var(--space-2) var(--space-3);
  background: var(--surface-2);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-base);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: var(--button-transition);

  &:hover {
    background: var(--surface-3);
    border-color: var(--border-primary);
  }

  &:focus {
    outline: none;
    border-color: var(--tavern-primary);
    box-shadow: 0 0 0 var(--space-1) rgba(var(--brand-primary-500), 0.1);
  }

  @media (max-width: 640px) {
    flex: 1;
    min-width: 0;
  }
}

// === 高级筛选面板 ===
.character-advanced-filters {
  background: var(--surface-2);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-top: var(--space-4);
}

.character-advanced-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-normal);
  margin-bottom: var(--spacing-normal);
}

.character-filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.character-filter-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.character-filter-input {
  padding: var(--space-2) var(--space-3);
  background: var(--surface-3);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--radius-base);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: var(--button-transition);

  &:hover {
    background: var(--surface-4);
    border-color: var(--border-primary);
  }

  &:focus {
    outline: none;
    border-color: var(--tavern-primary);
    box-shadow: 0 0 0 var(--space-1) rgba(var(--brand-primary-500), 0.1);
  }
}

.character-filter-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.character-filter-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-colors);

  &:hover {
    color: var(--tavern-primary);
  }

  input[type="checkbox"] {
    width: var(--space-4);
    height: var(--space-4);
    border-radius: var(--radius-sm);
    border: var(--space-px) solid var(--border-secondary);
    background: var(--surface-3);
    cursor: pointer;
    transition: var(--button-transition);

    &:checked {
      background: var(--tavern-primary);
      border-color: var(--tavern-primary);
    }

    &:focus {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  }
}

.character-active-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--spacing-normal);
  border-top: var(--space-px) solid var(--border-secondary);
}

.character-active-tags-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
}

.character-active-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

// === 主内容区域 ===
.character-list-content {
  padding: var(--space-8) 0;
}

// === 空状态 ===
.character-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-16) var(--space-4);
  color: var(--text-secondary);
}

.character-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-20);
  height: var(--space-20);
  background: var(--surface-2);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  color: var(--text-quaternary);
}

.character-empty-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-3);
}

.character-empty-message {
  font-size: var(--text-base);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-6);
  max-width: var(--space-96);
}

.character-empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: center;
}

// ==================== 动画效果 ====================

// 滑动展开动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
  transform-origin: top;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(calc(-1 * var(--space-4)));
}

// ==================== 响应式设计 ====================

// 移动端优化
@media (max-width: 640px) {
  .character-list-header {
    position: static; // 避免移动端粘性定位问题
  }

  .character-list-filters {
    position: static;
  }

  .character-list-filters-content {
    gap: var(--spacing-tight);
  }

  .character-list-filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .character-filter-select {
    width: 100%;
  }

  .character-advanced-filters-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-tight);
  }

  .character-filter-checkboxes {
    flex-direction: column;
    gap: var(--space-2);
  }

  .character-empty-state {
    padding: var(--space-12) var(--space-4);
  }

  .character-empty-icon {
    width: var(--space-16);
    height: var(--space-16);
    margin-bottom: var(--space-4);
  }

  .character-empty-title {
    font-size: var(--text-lg);
  }

  .character-empty-message {
    font-size: var(--text-sm);
  }

  .character-empty-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

// 平板端优化
@media (min-width: 641px) and (max-width: 1024px) {
  .character-advanced-filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

// ==================== 可访问性优化 ====================

// 焦点管理
.character-filter-select:focus,
.character-filter-input:focus {
  outline: var(--space-px-2) solid var(--focus-ring);
  outline-offset: var(--space-px-2);
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: none;
  }

  .character-filter-select,
  .character-filter-input,
  .character-filter-checkbox input {
    transition: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .character-list-header,
  .character-list-filters {
    border-bottom-width: var(--space-px-2);
  }

  .character-advanced-filters,
  .character-filter-select,
  .character-filter-input {
    border-width: var(--space-px-2);
  }
}
</style>
