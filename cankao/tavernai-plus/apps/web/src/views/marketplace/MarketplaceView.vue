<template>
  <div class="marketplace-page min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <!-- 页面标题区 -->
    <div class="relative">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-3xl"></div>

      <div class="relative container mx-auto px-4 py-12">
        <div class="text-center mb-8">
          <h1 class="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 mb-4">
            角色市场
          </h1>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            探索无限可能，发现你喜爱的AI角色，或分享你的创作给全世界
          </p>
        </div>

        <!-- 快速统计 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-purple-400">{{ stats.totalCharacters || 0 }}</div>
            <div class="text-sm text-gray-400">总角色数</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-yellow-400">{{ stats.activeCreators || 0 }}</div>
            <div class="text-sm text-gray-400">活跃创作者</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-green-400">{{ stats.totalDownloads || 0 }}</div>
            <div class="text-sm text-gray-400">总下载量</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">{{ stats.categories || 0 }}</div>
            <div class="text-sm text-gray-400">分类数量</div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 pb-12">
      <!-- 特色角色轮播 -->
      <section v-if="featuredCharacters.length > 0" class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <el-icon class="text-yellow-400"><Star /></el-icon>
          特色推荐
        </h2>

        <el-carousel
          :interval="5000"
          trigger="click"
          height="300px"
          class="featured-carousel"
          indicator-position="outside"
        >
          <el-carousel-item
            v-for="character in featuredCharacters"
            :key="character.id"
            class="relative cursor-pointer"
            @click="showCharacterDetail(character)"
          >
            <div class="relative h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg overflow-hidden">
              <img
                v-if="character.avatar"
                :src="character.avatar"
                :alt="character.name"
                class="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <div class="absolute bottom-0 left-0 right-0 p-8">
                  <h3 class="text-3xl font-bold text-white mb-2">{{ character.name }}</h3>
                  <p class="text-lg text-gray-200 mb-4 line-clamp-2">{{ character.description }}</p>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4 text-white/80">
                      <span class="flex items-center gap-1">
                        <el-icon><Star /></el-icon>
                        {{ character.rating.toFixed(1) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <el-icon><ChatDotRound /></el-icon>
                        {{ formatNumber(character.favorites) }}
                      </span>
                    </div>
                    <el-button type="primary" size="large">查看详情</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </section>

      <!-- 主内容区 -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- 侧边栏 -->
        <aside class="w-full lg:w-80 space-y-6">
          <!-- 搜索框 -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-semibold text-white mb-4">搜索角色</h3>
            <el-input
              v-model="searchQuery"
              placeholder="搜索角色名称、描述、标签..."
              size="large"
              clearable
              class="mb-4"
              @input="debouncedSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <!-- 高级搜索切换 -->
            <el-button
              text
              type="primary"
              @click="showAdvancedFilters = !showAdvancedFilters"
              class="w-full"
            >
              {{ showAdvancedFilters ? '隐藏' : '显示' }}高级筛选
              <el-icon class="ml-1">
                <ArrowDown v-if="!showAdvancedFilters" />
                <ArrowUp v-else />
              </el-icon>
            </el-button>
          </div>

          <!-- 高级筛选 -->
          <MarketplaceFilters
            v-show="showAdvancedFilters"
            v-model:filters="currentFilters"
            :categories="categories"
            :loading="filtersLoading"
            @update:filters="handleFiltersChange"
          />

          <!-- 分类快速导航 -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-semibold text-white mb-4">热门分类</h3>
            <div class="space-y-2">
              <div
                v-for="category in categories"
                :key="category.name"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                :class="{ 'bg-purple-500/20': currentFilters.category === category.name }"
                @click="selectCategory(category.name)"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ category.icon }}</span>
                  <span class="text-white">{{ category.name }}</span>
                </div>
                <span class="text-gray-400 text-sm">{{ category.count }}</span>
              </div>
            </div>
          </div>

          <!-- 热门标签 -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-semibold text-white mb-4">热门标签</h3>
            <div class="flex flex-wrap gap-2">
              <el-tag
                v-for="tag in trendingTags"
                :key="tag.tag"
                :type="currentFilters.tags?.includes(tag.tag) ? 'primary' : 'info'"
                class="cursor-pointer"
                @click="toggleTag(tag.tag)"
              >
                {{ tag.tag }}
                <span class="ml-1 text-xs opacity-70">{{ tag.count }}</span>
              </el-tag>
            </div>
          </div>
        </aside>

        <!-- 主内容 -->
        <main class="flex-1 space-y-6">
          <!-- 工具栏 -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-4">
            <div class="flex items-center gap-4">
              <span class="text-white">
                找到 <strong class="text-purple-400">{{ totalCharacters }}</strong> 个角色
              </span>

              <!-- 视图切换 -->
              <div class="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                <el-button
                  :type="viewMode === 'grid' ? 'primary' : 'text'"
                  size="small"
                  @click="viewMode = 'grid'"
                >
                  <el-icon><Grid /></el-icon>
                </el-button>
                <el-button
                  :type="viewMode === 'list' ? 'primary' : 'text'"
                  size="small"
                  @click="viewMode = 'list'"
                >
                  <el-icon><List /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 排序 -->
            <el-select
              v-model="currentFilters.sortBy"
              placeholder="排序方式"
              size="large"
              style="width: 200px"
              @change="handleSortChange"
            >
              <el-option label="最受欢迎" value="popular" />
              <el-option label="最新发布" value="newest" />
              <el-option label="评分最高" value="rating" />
              <el-option label="收藏最多" value="favorites" />
            </el-select>
          </div>

          <!-- 角色列表 -->
          <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div
              v-for="i in 9"
              :key="i"
              class="glass-card h-96 animate-pulse"
            >
              <div class="h-64 bg-gray-700 rounded-t-lg"></div>
              <div class="p-4 space-y-3">
                <div class="h-4 bg-gray-700 rounded"></div>
                <div class="h-3 bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <div v-else-if="characters.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-semibold text-white mb-2">暂无找到角色</h3>
            <p class="text-gray-400 mb-6">试试调整搜索条件或浏览其他分类</p>
            <el-button type="primary" @click="clearFilters">清除所有筛选</el-button>
          </div>

          <div v-else>
            <!-- 网格视图 -->
            <div
              v-if="viewMode === 'grid'"
              class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <CharacterMarketCard
                v-for="character in characters"
                :key="character.id"
                :character="character"
                @click="showCharacterDetail"
                @favorite="handleFavorite"
                @import="handleImport"
              />
            </div>

            <!-- 列表视图 -->
            <div v-else class="space-y-4">
              <CharacterMarketCard
                v-for="character in characters"
                :key="character.id"
                :character="character"
                mode="list"
                @click="showCharacterDetail"
                @favorite="handleFavorite"
                @import="handleImport"
              />
            </div>

            <!-- 分页 -->
            <div class="flex justify-center mt-8">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[12, 24, 48, 96]"
                :total="totalCharacters"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="handlePageSizeChange"
                @current-change="handlePageChange"
              />
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
import {
  Search,
  Star,
  ChatDotRound,
  ArrowDown,
  ArrowUp,
  Grid,
  List
} from '@element-plus/icons-vue'

import CharacterMarketCard from '@/components/character/CharacterMarketCard.vue'
import CharacterMarketDetail from '@/components/character/CharacterMarketDetail.vue'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters.vue'
import marketplaceService, { type MarketplaceFilter, type CharacterPreview } from '@/services/marketplace'

// 响应式数据
const loading = ref(false)
const filtersLoading = ref(false)
const showAdvancedFilters = ref(false)
const showDetailDialog = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')

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
    characters.value = response.characters
    totalCharacters.value = response.total
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error('加载角色失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const loadFeaturedCharacters = async () => {
  try {
    featuredCharacters.value = await marketplaceService.getFeaturedCharacters(5)
  } catch (error) {
    console.error('加载特色角色失败:', error)
  }
}

const loadCategories = async () => {
  try {
    filtersLoading.value = true
    categories.value = await marketplaceService.getCategoryStats()
    stats.categories = categories.value.length
  } catch (error) {
    console.error('加载分类失败:', error)
  } finally {
    filtersLoading.value = false
  }
}

const loadTrendingTags = async () => {
  try {
    trendingTags.value = await marketplaceService.getTrendingTags(20)
  } catch (error) {
    console.error('加载热门标签失败:', error)
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
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
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

// 监听搜索查询变化
import { watch } from 'vue'
watch(searchQuery, (newValue) => {
  debouncedSearch(newValue)
})
</script>

<style scoped>
.glass-card {
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.el-carousel__indicator) {
  background-color: rgba(255, 255, 255, 0.3);
}

:deep(.el-carousel__indicator.is-active) {
  background-color: rgba(139, 92, 246, 0.8);
}

:deep(.el-pagination) {
  --el-color-primary: #8B5CF6;
}

:deep(.el-select .el-input__inner) {
  background-color: rgba(15, 15, 35, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: white;
}

:deep(.el-input__inner) {
  background-color: rgba(15, 15, 35, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: white;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}
</style>
