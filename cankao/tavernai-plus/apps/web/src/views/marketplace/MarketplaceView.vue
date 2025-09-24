<template>
  <div class="marketplace-page">
    <!-- 页面标题区 -->
    <div class="marketplace-header">
      <div class="header-container">
        <div class="title-section">
          <h1 class="page-title">
            <TavernIcon name="shopping-bag" class="title-icon" />
            角色市场
          </h1>
          <p class="page-subtitle">
            探索无限可能，发现你喜爱的AI角色，或分享你的创作给全世界
          </p>
        </div>

        <!-- 快速统计 -->
        <div class="stats-grid">
          <TavernCard variant="glass" class="stat-card">
            <TavernIcon name="users" class="stat-icon primary-color" />
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalCharacters || 0 }}</div>
              <div class="stat-label">总角色数</div>
            </div>
          </TavernCard>
          <TavernCard variant="glass" class="stat-card">
            <TavernIcon name="star" class="stat-icon warning-color" />
            <div class="stat-content">
              <div class="stat-number">{{ stats.activeCreators || 0 }}</div>
              <div class="stat-label">活跃创作者</div>
            </div>
          </TavernCard>
          <TavernCard variant="glass" class="stat-card">
            <TavernIcon name="arrow-down-tray" class="stat-icon success-color" />
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalDownloads || 0 }}</div>
              <div class="stat-label">总下载量</div>
            </div>
          </TavernCard>
          <TavernCard variant="glass" class="stat-card">
            <TavernIcon name="squares-2x2" class="stat-icon info-color" />
            <div class="stat-content">
              <div class="stat-number">{{ stats.categories || 0 }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </TavernCard>
        </div>
      </div>
    </div>

    <div class="marketplace-container">
      <!-- 特色角色轮播 -->
      <section v-if="featuredCharacters && featuredCharacters.length > 0" class="featured-section">
        <h2 class="section-title">
          <TavernIcon name="star" class="section-icon" />
          特色推荐
        </h2>

        <div class="featured-carousel">
          <div
            v-for="(character, index) in featuredCharacters"
            :key="character.id"
            class="carousel-item"
            :class="{ 'active': currentCarouselIndex === index }"
            @click="showCharacterDetail(character)"
          >
            <TavernCard variant="glass" class="featured-card">
              <div class="featured-card-background">
                <img
                  v-if="character.avatar"
                  :src="character.avatar"
                  :alt="character.name"
                  class="featured-background-image"
                />
                <div class="featured-overlay"></div>
              </div>
              <div class="featured-content">
                <h3 class="featured-title">{{ character.name }}</h3>
                <p class="featured-description">{{ character.description }}</p>
                <div class="featured-stats">
                  <div class="featured-meta">
                    <TavernBadge variant="warning" class="rating-badge">
                      <TavernIcon name="star" class="badge-icon" />
                      {{ character.rating.toFixed(1) }}
                    </TavernBadge>
                    <TavernBadge variant="info" class="chat-badge">
                      <TavernIcon name="chat-bubble-left" class="badge-icon" />
                      {{ formatNumber(character.favorites) }}
                    </TavernBadge>
                  </div>
                  <TavernButton variant="primary" size="md" class="featured-button">
                    查看详情
                  </TavernButton>
                </div>
              </div>
            </TavernCard>
          </div>

          <!-- 轮播指示器 -->
          <div class="carousel-indicators">
            <button
              v-for="(_, index) in featuredCharacters"
              :key="index"
              class="carousel-indicator"
              :class="{ 'active': currentCarouselIndex === index }"
              @click="currentCarouselIndex = index"
            ></button>
          </div>
        </div>
      </section>

      <!-- 主内容区 -->
      <div class="content-layout">
        <!-- 侧边栏 -->
        <aside class="sidebar">
          <!-- 搜索框 -->
          <TavernCard variant="glass" class="sidebar-section">
            <h3 class="sidebar-title">
              <TavernIcon name="magnifying-glass" class="sidebar-icon" />
              搜索角色
            </h3>
            <TavernInput
              v-model="searchQuery"
              placeholder="搜索角色名称、描述、标签..."
              size="lg"
              icon-left="magnifying-glass"
              class="search-input"
              @input="debouncedSearch"
            />

            <!-- 高级搜索切换 -->
            <TavernButton
              variant="secondary"
              size="sm"
              @click="showAdvancedFilters = !showAdvancedFilters"
              class="filter-toggle"
            >
              {{ showAdvancedFilters ? '隐藏' : '显示' }}高级筛选
              <TavernIcon :name="showAdvancedFilters ? 'chevron-up' : 'chevron-down'" class="toggle-icon" />
            </TavernButton>
          </TavernCard>

          <!-- 高级筛选 -->
          <MarketplaceFilters
            v-show="showAdvancedFilters"
            v-model:filters="currentFilters"
            :categories="categories"
            :loading="filtersLoading"
            @update:filters="handleFiltersChange"
          />

          <!-- 分类快速导航 -->
          <TavernCard variant="glass" class="sidebar-section">
            <h3 class="sidebar-title">
              <TavernIcon name="folder" class="sidebar-icon" />
              热门分类
            </h3>
            <div class="category-list">
              <div
                v-for="category in (categories || [])"
                :key="category.name"
                class="category-item"
                :class="{ 'active': currentFilters.category === category.name }"
                @click="selectCategory(category.name)"
              >
                <div class="category-info">
                  <span class="category-emoji">{{ category.icon }}</span>
                  <span class="category-name">{{ category.name }}</span>
                </div>
                <TavernBadge variant="secondary" class="category-count">
                  {{ category.count }}
                </TavernBadge>
              </div>
            </div>
          </TavernCard>

          <!-- 热门标签 -->
          <TavernCard variant="glass" class="sidebar-section">
            <h3 class="sidebar-title">
              <TavernIcon name="hashtag" class="sidebar-icon" />
              热门标签
            </h3>
            <div class="tags-container">
              <TavernBadge
                v-for="tag in (trendingTags || [])"
                :key="tag.tag"
                :variant="currentFilters.tags?.includes(tag.tag) ? 'primary' : 'secondary'"
                class="tag-badge"
                @click="toggleTag(tag.tag)"
              >
                {{ tag.tag }}
                <span class="tag-count">{{ tag.count }}</span>
              </TavernBadge>
            </div>
          </TavernCard>
        </aside>

        <!-- 主内容 -->
        <main class="main-content">
          <!-- 工具栏 -->
          <TavernCard variant="glass" class="toolbar">
            <div class="toolbar-left">
              <span class="results-count">
                找到 <strong class="highlight">{{ totalCharacters }}</strong> 个角色
              </span>

              <!-- 视图切换 -->
              <div class="view-mode-toggle">
                <TavernButton
                  :variant="viewMode === 'grid' ? 'primary' : 'secondary'"
                  size="sm"
                  @click="viewMode = 'grid'"
                  class="view-button"
                >
                  <TavernIcon name="squares-2x2" />
                </TavernButton>
                <TavernButton
                  :variant="viewMode === 'list' ? 'primary' : 'secondary'"
                  size="sm"
                  @click="viewMode = 'list'"
                  class="view-button"
                >
                  <TavernIcon name="list-bullet" />
                </TavernButton>
              </div>
            </div>

            <!-- 排序 -->
            <div class="sort-section">
              <label class="sort-label">
                <TavernIcon name="adjustments-horizontal" class="sort-icon" />
                排序
              </label>
              <select
                v-model="currentFilters.sortBy"
                @change="handleSortChange"
                class="sort-select"
              >
                <option value="popular">🔥 最受欢迎</option>
                <option value="newest">🆕 最新发布</option>
                <option value="rating">⭐ 评分最高</option>
                <option value="favorites">❤️ 收藏最多</option>
              </select>
            </div>
          </TavernCard>

          <!-- 角色列表 -->
          <div class="characters-section">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-grid">
              <TavernCard
                v-for="i in 9"
                :key="i"
                variant="glass"
                class="skeleton-card"
              >
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                  <div class="skeleton-line skeleton-title"></div>
                  <div class="skeleton-line skeleton-description"></div>
                  <div class="skeleton-line skeleton-short"></div>
                </div>
              </TavernCard>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!characters || characters.length === 0" class="empty-state">
              <TavernIcon name="face-frown" class="empty-icon" />
              <h3 class="empty-title">暂无找到角色</h3>
              <p class="empty-description">试试调整搜索条件或浏览其他分类</p>
              <TavernButton variant="primary" @click="clearFilters" class="empty-button">
                清除所有筛选
              </TavernButton>
            </div>

            <!-- 角色内容 -->
            <div v-else>
              <!-- 网格视图 -->
              <div
                v-if="viewMode === 'grid'"
                class="characters-grid"
              >
                <CharacterMarketCard
                  v-for="character in (characters || [])"
                  :key="character.id"
                  :character="character"
                  @click="showCharacterDetail"
                  @favorite="handleFavorite"
                  @import="handleImport"
                />
              </div>

              <!-- 列表视图 -->
              <div v-else class="characters-list">
                <CharacterMarketCard
                  v-for="character in (characters || [])"
                  :key="character.id"
                  :character="character"
                  mode="list"
                  @click="showCharacterDetail"
                  @favorite="handleFavorite"
                  @import="handleImport"
                />
              </div>

              <!-- 分页 -->
              <div class="pagination-section">
                <TavernCard variant="glass" class="pagination-container">
                  <div class="pagination-info">
                    <span class="pagination-text">
                      显示第 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalCharacters) }} 项，
                      共 {{ totalCharacters }} 项
                    </span>
                  </div>
                  <div class="pagination-controls">
                    <TavernButton
                      variant="secondary"
                      size="sm"
                      :disabled="currentPage === 1"
                      @click="handlePageChange(currentPage - 1)"
                      class="pagination-button"
                    >
                      <TavernIcon name="chevron-left" />
                      上一页
                    </TavernButton>

                    <div class="page-numbers">
                      <TavernButton
                        v-for="page in visiblePages"
                        :key="page"
                        :variant="page === currentPage ? 'primary' : 'secondary'"
                        size="sm"
                        @click="handlePageChange(page)"
                        class="page-button"
                      >
                        {{ page }}
                      </TavernButton>
                    </div>

                    <TavernButton
                      variant="secondary"
                      size="sm"
                      :disabled="currentPage === totalPages"
                      @click="handlePageChange(currentPage + 1)"
                      class="pagination-button"
                    >
                      下一页
                      <TavernIcon name="chevron-right" />
                    </TavernButton>
                  </div>
                </TavernCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- 角色详情弹窗 -->
    <CharacterMarketDetail
      v-model:visible="showDetailDialog"
      :character="selectedCharacter"
      @import="handleImport"
      @favorite="handleFavorite"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { debounce } from 'lodash-es'
import { ElMessage, ElMessageBox } from 'element-plus'

import CharacterMarketCard from '@/components/character/CharacterMarketCard.vue'
import CharacterMarketDetail from '@/components/character/CharacterMarketDetail.vue'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters.vue'
import marketplaceService, { type MarketplaceFilter, type CharacterPreview } from '@/services/marketplace'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

// Stores 和 Router
const userStore = useUserStore()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const filtersLoading = ref(false)
const showAdvancedFilters = ref(false)
const showDetailDialog = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const currentCarouselIndex = ref(0)

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(24)
const totalCharacters = ref(0)

const selectedCharacter = ref<CharacterPreview | null>(null)
const characters = ref<CharacterPreview[]>([])
const featuredCharacters = ref<CharacterPreview[]>([])
const categories = ref<any[]>([])
const trendingTags = ref<any[]>([])

// 统计数据
const stats = reactive({
  totalCharacters: 0,
  activeCreators: 0,
  totalDownloads: 0,
  categories: 0
})

// 筛选器状态
const currentFilters = reactive<MarketplaceFilter>({
  category: '',
  minRating: undefined,
  language: '',
  search: '',
  sortBy: 'popular',
  tags: []
})

// 轮播自动播放
let carouselInterval: NodeJS.Timeout | null = null

const startCarousel = () => {
  if (featuredCharacters.value.length > 1) {
    carouselInterval = setInterval(() => {
      currentCarouselIndex.value = (currentCarouselIndex.value + 1) % featuredCharacters.value.length
    }, 5000)
  }
}

const stopCarousel = () => {
  if (carouselInterval) {
    clearInterval(carouselInterval)
    carouselInterval = null
  }
}

// 防抖搜索
const debouncedSearch = debounce((value: string) => {
  currentFilters.search = value
  currentPage.value = 1
  loadCharacters()
}, 300)

// 计算属性
const hasActiveFilters = computed(() => {
  return currentFilters.category ||
    currentFilters.minRating ||
    currentFilters.language ||
    currentFilters.search ||
    (currentFilters.tags && currentFilters.tags.length > 0)
})

const totalPages = computed(() => {
  return Math.ceil(totalCharacters.value / pageSize.value)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push(-1) // 省略号
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push(-1) // 省略号
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push(-1) // 省略号
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push(-1) // 省略号
      pages.push(total)
    }
  }

  return pages
})

// 方法
const loadCharacters = async () => {
  try {
    loading.value = true
    const filters = {
      ...currentFilters,
      page: currentPage.value,
      limit: pageSize.value
    }

    const response = await marketplaceService.getCharacters(filters)
    characters.value = response.characters || []
    totalCharacters.value = response.total || 0
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败，请稍后重试')
    characters.value = []
    totalCharacters.value = 0
  } finally {
    loading.value = false
  }
}

const loadFeaturedCharacters = async () => {
  try {
    featuredCharacters.value = await marketplaceService.getFeaturedCharacters(5)
    startCarousel()
  } catch (error) {
    console.error('加载特色角色失败:', error)
    featuredCharacters.value = []
  }
}

const loadCategories = async () => {
  try {
    filtersLoading.value = true
    categories.value = await marketplaceService.getCategoryStats()
    stats.categories = categories.value?.length || 0
  } catch (error) {
    console.error('加载分类失败:', error)
    categories.value = []
    stats.categories = 0
  } finally {
    filtersLoading.value = false
  }
}

const loadTrendingTags = async () => {
  try {
    trendingTags.value = await marketplaceService.getTrendingTags(20)
  } catch (error) {
    console.error('加载热门标签失败:', error)
    trendingTags.value = []
  }
}

const loadStats = async () => {
  // 这里可以调用统计API，暂时使用模拟数据
  stats.totalCharacters = 12450
  stats.activeCreators = 3280
  stats.totalDownloads = 156780
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const selectCategory = (categoryName: string) => {
  if (currentFilters.category === categoryName) {
    currentFilters.category = ''
  } else {
    currentFilters.category = categoryName
  }
  currentPage.value = 1
  loadCharacters()
}

const toggleTag = (tag: string) => {
  if (!currentFilters.tags) {
    currentFilters.tags = []
  }

  const index = currentFilters.tags.indexOf(tag)
  if (index > -1) {
    currentFilters.tags.splice(index, 1)
  } else {
    currentFilters.tags.push(tag)
  }

  currentPage.value = 1
  loadCharacters()
}

const clearFilters = () => {
  searchQuery.value = ''
  currentFilters.category = ''
  currentFilters.minRating = undefined
  currentFilters.language = ''
  currentFilters.search = ''
  currentFilters.tags = []
  currentPage.value = 1
  loadCharacters()
}

const showCharacterDetail = (character: CharacterPreview) => {
  selectedCharacter.value = character
  showDetailDialog.value = true
}

const handleFavorite = async (characterId: string) => {
  // 检查用户登录状态
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录后再收藏角色')
    router.push('/login')
    return
  }

  try {
    // 找到对应角色并切换收藏状态
    const character = characters.value.find(c => c.id === characterId)
    if (!character) return

    if (character.isFavorited) {
      await marketplaceService.unfavoriteCharacter(characterId)
      character.favorites = Math.max(0, character.favorites - 1)
    } else {
      await marketplaceService.favoriteCharacter(characterId)
      character.favorites += 1
    }

    character.isFavorited = !character.isFavorited
    ElMessage.success(character.isFavorited ? '已加入收藏' : '已取消收藏')
  } catch (error: any) {
    console.error('收藏操作失败:', error)
    ElMessage.error(error.message || '操作失败，请稍后重试')
  }
}

const handleImport = async (characterId: string) => {
  try {
    const character = characters.value.find(c => c.id === characterId)
    if (!character) return

    await ElMessageBox.confirm(
      `确定要导入角色 "${character.name}" 到你的角色库吗？`,
      '确认导入',
      {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    const result = await marketplaceService.importCharacter(characterId)
    ElMessage.success('角色导入成功！')

    // 可选：跳转到角色详情或编辑页面
    // router.push(`/studio/character/edit/${result.characterId}`)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('导入角色失败:', error)
      ElMessage.error('导入失败，请稍后重试')
    }
  }
}

const handleFiltersChange = () => {
  currentPage.value = 1
  loadCharacters()
}

const handleSortChange = () => {
  currentPage.value = 1
  loadCharacters()
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === -1) return
  currentPage.value = page
  loadCharacters()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadCharacters()
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadCharacters(),
    loadFeaturedCharacters(),
    loadCategories(),
    loadTrendingTags(),
    loadStats()
  ])
})

onUnmounted(() => {
  stopCarousel()
})

// 监听搜索查询变化
import { watch } from 'vue'
watch(searchQuery, (newValue) => {
  debouncedSearch(newValue)
})

// 轮播控制
watch(featuredCharacters, () => {
  stopCarousel()
  if (featuredCharacters.value.length > 1) {
    startCarousel()
  }
})
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.marketplace-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
}

// 页面头部
.marketplace-header {
  padding: var(--dt-spacing-3xl) var(--dt-spacing-lg);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
      rgba(168, 85, 247, 0.1) 0%,
      rgba(59, 130, 246, 0.1) 50%,
      rgba(236, 72, 153, 0.1) 100%);
    backdrop-filter: blur(30px);
  }
}

.header-container {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
}

.title-section {
  text-align: center;
  margin-bottom: var(--dt-spacing-3xl);
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--dt-spacing-md);
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: var(--dt-font-weight-bold);
  background: var(--dt-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--dt-spacing-lg);
  animation: glow 2s ease-in-out infinite alternate;
}

.title-icon {
  width: clamp(32px, 6vw, 48px);
  height: clamp(32px, 6vw, 48px);
  color: var(--dt-color-primary);
}

.page-subtitle {
  font-size: var(--dt-font-size-lg);
  color: var(--dt-color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  opacity: 0.9;
}

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--dt-spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-lg);
  padding: var(--dt-spacing-xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 50px rgba(168, 85, 247, 0.3);
  }
}

.stat-icon {
  width: 32px;
  height: 32px;

  &.primary-color { color: var(--dt-color-primary); }
  &.warning-color { color: #fbbf24; }
  &.success-color { color: #10b981; }
  &.info-color { color: #3b82f6; }
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: var(--dt-font-size-2xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-primary);
  margin-bottom: var(--dt-spacing-xs);
}

.stat-label {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-tertiary);
  opacity: 0.8;
}

// 主容器
.marketplace-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--dt-spacing-lg) var(--dt-spacing-3xl);
}

// 特色区域
.featured-section {
  margin-bottom: var(--dt-spacing-3xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  font-size: var(--dt-font-size-2xl);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin-bottom: var(--dt-spacing-xl);
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #fbbf24;
}

.featured-carousel {
  position: relative;
  height: 400px;
  overflow: hidden;
  border-radius: var(--dt-radius-2xl);
}

.carousel-item {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.5s ease;
  cursor: pointer;

  &.active {
    opacity: 1;
    transform: translateX(0);
  }
}

.featured-card {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  padding: 0;
}

.featured-card-background {
  position: absolute;
  inset: 0;
}

.featured-background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

.featured-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

.featured-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--dt-spacing-2xl);
  z-index: 2;
}

.featured-title {
  font-size: var(--dt-font-size-3xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-primary);
  margin-bottom: var(--dt-spacing-md);
}

.featured-description {
  font-size: var(--dt-font-size-lg);
  color: var(--dt-color-text-secondary);
  line-height: 1.6;
  margin-bottom: var(--dt-spacing-lg);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.featured-meta {
  display: flex;
  gap: var(--dt-spacing-md);
}

.rating-badge,
.chat-badge {
  .badge-icon {
    margin-right: var(--dt-spacing-xs);
  }
}

// 轮播指示器
.carousel-indicators {
  position: absolute;
  bottom: var(--dt-spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--dt-spacing-sm);
  z-index: 3;
}

.carousel-indicator {
  width: 12px;
  height: 12px;
  border-radius: var(--dt-radius-full);
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &.active {
    background: var(--dt-color-primary);
    transform: scale(1.2);
  }
}

// 内容布局
.content-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--dt-spacing-2xl);
}

// 侧边栏
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.sidebar-section {
  padding: var(--dt-spacing-xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-sm);
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin-bottom: var(--dt-spacing-lg);
}

.sidebar-icon {
  width: 20px;
  height: 20px;
  color: var(--dt-color-primary);
}

.search-input {
  margin-bottom: var(--dt-spacing-md);
}

.filter-toggle {
  width: 100%;
  justify-content: space-between;

  .toggle-icon {
    margin-left: var(--dt-spacing-sm);
  }
}

// 分类列表
.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-sm);
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--dt-spacing-md);
  border-radius: var(--dt-radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(168, 85, 247, 0.1);
  }

  &.active {
    background: rgba(168, 85, 247, 0.2);
    border: 1px solid rgba(168, 85, 247, 0.3);
  }
}

.category-info {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.category-emoji {
  font-size: var(--dt-font-size-xl);
}

.category-name {
  color: var(--dt-color-text-primary);
  font-weight: var(--dt-font-weight-medium);
}

.category-count {
  font-size: var(--dt-font-size-xs);
}

// 标签容器
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-spacing-sm);
}

.tag-badge {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .tag-count {
    margin-left: var(--dt-spacing-xs);
    opacity: 0.7;
    font-size: 0.85em;
  }
}

// 主内容
.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

// 工具栏
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--dt-spacing-lg);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-lg);
}

.results-count {
  color: var(--dt-color-text-primary);
  font-size: var(--dt-font-size-md);

  .highlight {
    color: var(--dt-color-primary);
    font-weight: var(--dt-font-weight-bold);
  }
}

.view-mode-toggle {
  display: flex;
  gap: var(--dt-spacing-xs);
  background: rgba(168, 85, 247, 0.1);
  border-radius: var(--dt-radius-lg);
  padding: var(--dt-spacing-xs);
}

.view-button {
  padding: var(--dt-spacing-sm);
}

.sort-section {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.sort-label {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-sm);
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-primary);
}

.sort-icon {
  width: 16px;
  height: 16px;
  color: var(--dt-color-primary);
}

.sort-select {
  padding: var(--dt-spacing-sm) var(--dt-spacing-md);
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: var(--dt-radius-lg);
  color: var(--dt-color-text-primary);
  font-size: var(--dt-font-size-sm);
  min-width: 160px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--dt-color-primary);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }

  option {
    background: var(--dt-color-background-card);
    color: var(--dt-color-text-primary);
  }
}

// 角色列表
.characters-section {
  flex: 1;
}

// 加载状态
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--dt-spacing-xl);
}

.skeleton-card {
  padding: 0;
  overflow: hidden;
}

.skeleton-image {
  height: 200px;
  background: linear-gradient(90deg,
    rgba(168, 85, 247, 0.1) 0%,
    rgba(168, 85, 247, 0.2) 50%,
    rgba(168, 85, 247, 0.1) 100%);
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.skeleton-content {
  padding: var(--dt-spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-md);
}

.skeleton-line {
  height: 16px;
  border-radius: var(--dt-radius-md);
  background: linear-gradient(90deg,
    rgba(168, 85, 247, 0.1) 0%,
    rgba(168, 85, 247, 0.2) 50%,
    rgba(168, 85, 247, 0.1) 100%);
  animation: skeleton-loading 1.5s ease-in-out infinite;

  &.skeleton-title {
    height: 20px;
    width: 70%;
  }

  &.skeleton-description {
    width: 90%;
  }

  &.skeleton-short {
    width: 50%;
  }
}

@keyframes skeleton-loading {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

// 空状态
.empty-state {
  text-align: center;
  padding: var(--dt-spacing-3xl);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--dt-color-text-tertiary);
  margin: 0 auto var(--dt-spacing-lg);
}

.empty-title {
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin-bottom: var(--dt-spacing-md);
}

.empty-description {
  font-size: var(--dt-font-size-md);
  color: var(--dt-color-text-secondary);
  margin-bottom: var(--dt-spacing-xl);
}

.empty-button {
  padding: var(--dt-spacing-md) var(--dt-spacing-xl);
}

// 角色网格和列表
.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--dt-spacing-xl);
}

.characters-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

// 分页
.pagination-section {
  margin-top: var(--dt-spacing-2xl);
}

.pagination-container {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
  padding: var(--dt-spacing-xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.pagination-info {
  text-align: center;
}

.pagination-text {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-secondary);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--dt-spacing-md);
  flex-wrap: wrap;
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-sm);
  padding: var(--dt-spacing-sm) var(--dt-spacing-md);
}

.page-numbers {
  display: flex;
  gap: var(--dt-spacing-xs);
}

.page-button {
  min-width: 40px;
  padding: var(--dt-spacing-sm);
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 280px 1fr;
  }
}

@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .main-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .marketplace-header {
    padding: var(--dt-spacing-2xl) var(--dt-spacing-md);
  }

  .marketplace-container {
    padding: 0 var(--dt-spacing-md) var(--dt-spacing-2xl);
  }

  .page-title {
    flex-direction: column;
    font-size: clamp(1.5rem, 6vw, 2.5rem);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--dt-spacing-md);
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: var(--dt-spacing-lg);
  }

  .featured-carousel {
    height: 300px;
  }

  .featured-content {
    padding: var(--dt-spacing-lg);
  }

  .featured-title {
    font-size: var(--dt-font-size-xl);
  }

  .toolbar {
    flex-direction: column;
    gap: var(--dt-spacing-md);
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
    gap: var(--dt-spacing-md);
  }

  .view-mode-toggle {
    align-self: center;
  }

  .characters-grid {
    grid-template-columns: 1fr;
  }

  .pagination-controls {
    flex-direction: column;
    gap: var(--dt-spacing-md);
  }

  .page-numbers {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .featured-stats {
    flex-direction: column;
    gap: var(--dt-spacing-md);
    align-items: flex-start;
  }

  .category-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--dt-spacing-sm);
  }
}
</style>