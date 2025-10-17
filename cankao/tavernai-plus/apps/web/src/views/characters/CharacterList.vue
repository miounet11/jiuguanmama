<template>
  <!-- 使用 Design Tokens v2.0 深空主题的角色列表页面 -->
  <div class="character-list-page">
    <div class="container">
      <!-- 页面标题和搜索栏 -->
      <div class="page-header">
        <h1 class="page-title">
          <TavernIcon name="star" class="title-icon" />
          探索角色宇宙
        </h1>
        <p class="page-subtitle">发现无限可能的AI角色，开启专属对话体验</p>

        <!-- 搜索和筛选工具栏 -->
        <div class="search-toolbar">
          <div class="search-section">
            <TavernInput
              v-model="searchQuery"
              type="search"
              placeholder="搜索你心仪的角色..."
              icon-left="search"
              size="lg"
              @input="handleSearch"
            />
          </div>

          <div class="filter-section">
            <!-- 分类筛选 -->
            <select
              v-model="selectedCategory"
              class="filter-select"
              @change="filterByCategory"
            >
              <option value="">所有分类</option>
              <option value="anime">🎌 动漫</option>
              <option value="game">🎮 游戏</option>
              <option value="fantasy">✨ 奇幻</option>
              <option value="sci-fi">🚀 科幻</option>
              <option value="historical">👑 历史</option>
              <option value="slice-of-life">🏠 日常</option>
              <option value="school">📚 校园</option>
              <option value="original">🎨 原创</option>
            </select>

            <!-- 排序 -->
            <select
              v-model="sortBy"
              class="filter-select"
              @change="sortCharacters"
            >
              <option value="popular">🔥 最受欢迎</option>
              <option value="newest">🆕 最新添加</option>
              <option value="rating">⭐ 评分最高</option>
              <option value="chats">💬 对话最多</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner">
          <TavernIcon name="spinner" class="loading-icon" />
        </div>
        <p class="loading-text">正在加载精彩角色...</p>
      </div>

      <!-- 角色列表 -->
      <div v-else-if="characters.length > 0" class="character-grid">
        <TavernCard
          v-for="character in characters"
          :key="character.id"
          :title="character.name"
          :subtitle="character.creator"
          hoverable
          clickable
          class="character-card"
          @click="goToCharacterDetail(character.id)"
        >
          <!-- 角色头像和状态标签 -->
          <template #media>
            <div class="character-avatar">
              <img
                v-if="character.avatar"
                :src="character.avatar"
                :alt="character.name"
                class="avatar-image"
              />
              <div v-else class="avatar-placeholder">
                <TavernIcon name="user" class="placeholder-icon" />
                <span class="placeholder-text">{{ character.name.charAt(0) }}</span>
              </div>

              <!-- 状态标签 -->
              <div class="status-badges">
                <TavernBadge
                  v-if="character.isNew"
                  variant="success"
                  size="sm"
                  class="status-badge"
                >
                  <TavernIcon name="star" size="xs" />
                  新
                </TavernBadge>
                <TavernBadge
                  v-if="character.isPremium"
                  variant="warning"
                  size="sm"
                  class="status-badge"
                >
                  <TavernIcon name="crown" size="xs" />
                  高级
                </TavernBadge>
              </div>
            </div>
          </template>

          <!-- 角色描述 -->
          <div class="character-description">
            {{ character.description }}
          </div>

          <!-- 统计信息 -->
          <template #footer>
            <div class="character-stats">
              <div class="stats-group">
                <div class="stat-item">
                  <TavernIcon name="message-circle" class="stat-icon" />
                  <span class="stat-value">{{ formatNumber(character.chats) }}</span>
                </div>
                <div class="stat-item">
                  <TavernIcon name="heart" class="stat-icon" />
                  <span class="stat-value">{{ formatNumber(character.likes) }}</span>
                </div>
              </div>

              <div class="rating-section">
                <TavernIcon name="star" class="rating-icon" />
                <span class="rating-value">{{ character.rating.toFixed(1) }}</span>
              </div>
            </div>
          </template>
        </TavernCard>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <TavernIcon name="search" class="empty-search-icon" />
        </div>
        <h3 class="empty-title">暂未发现匹配的角色</h3>
        <p class="empty-description">
          试试调整搜索关键词或筛选条件，<br>
          也许你心仪的角色就在下一次探索中
        </p>
        <TavernButton
          variant="ghost"
          @click="clearFilters"
        >
          <TavernIcon name="refresh" />
          重置筛选条件
        </TavernButton>
      </div>

      <!-- 分页导航 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination-nav">
          <TavernButton
            :disabled="currentPage === 1"
            variant="ghost"
            size="sm"
            @click="goToPage(currentPage - 1)"
          >
            <TavernIcon name="chevron-left" />
            上一页
          </TavernButton>

          <div class="page-numbers">
            <TavernButton
              v-for="page in visiblePages"
              :key="page"
              :variant="page === currentPage ? 'primary' : 'ghost'"
              size="sm"
              class="page-button"
              @click="goToPage(page)"
            >
              {{ page }}
            </TavernButton>
          </div>

          <TavernButton
            :disabled="currentPage === totalPages"
            variant="ghost"
            size="sm"
            @click="goToPage(currentPage + 1)"
          >
            下一页
            <TavernIcon name="chevron-right" />
          </TavernButton>
        </div>

        <div class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页，
          总计 {{ totalItems }} 个角色
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'
import { TavernCard, TavernButton, TavernInput, TavernIcon, TavernBadge } from '@/components/design-system'

const router = useRouter()

interface Character {
  id: string
  name: string
  avatar: string
  description: string
  creator: string
  category: string
  chats: number
  likes: number
  rating: number
  isNew: boolean
  isPremium: boolean
}

const characters = ref<Character[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('popular')
const currentPage = ref(1)
const itemsPerPage = 12
const totalItems = ref(0)

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const fetchCharacters = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchQuery.value,
      category: selectedCategory.value,
      sort: sortBy.value
    }

    const response = await axios.get('/characters', { params })

    // 处理响应数据，适配不同格式
    // 注意：axios拦截器已经返回了response.data，所以response就是实际数据
    if (response.success) {
      // 转换数据格式以匹配前端需求
      characters.value = response.characters.map((char: any) => ({
        id: char.id,
        name: char.name || '未命名角色',
        avatar: char.avatar || '',
        description: char.description || '暂无描述',
        creator: char.creator?.username || char.creator?.name || '匿名用户',
        category: Array.isArray(char.tags) ? char.tags[0] : 'original',
        chats: char.chatCount || 0,
        likes: char.favoriteCount || 0,
        rating: char.rating || 4.0,
        isNew: char.isNew || false,
        isPremium: char.isPremium || false
      }))

      totalItems.value = response.pagination?.total || response.characters.length
    } else {
      // 如果没有success标记，尝试直接使用数据
      if (Array.isArray(response)) {
        characters.value = response.map((char: any) => ({
          id: char.id,
          name: char.name || '未命名角色',
          avatar: char.avatar || '',
          description: char.description || '暂无描述',
          creator: char.creator?.username || '匿名用户',
          category: 'original',
          chats: char.chatCount || 0,
          likes: char.favoriteCount || 0,
          rating: char.rating || 4.0,
          isNew: false,
          isPremium: false
        }))
        totalItems.value = response.length
      } else {
        throw new Error('Unexpected response format')
      }
    }
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    // 使用模拟数据作为后备
    characters.value = generateMockCharacters()
    totalItems.value = 50
  } finally {
    isLoading.value = false
  }
}

const generateMockCharacters = (): Character[] => {
  const mockNames = ['艾莉亚', '赛博朋克2077', '原神角色', '火影忍者', '初音未来', '洛天依', 'AI助手', '虚拟偶像']
  const mockCategories = ['anime', 'game', 'movie', 'book', 'original', 'historical', 'vtuber']

  return Array.from({ length: 12 }, (_, i) => ({
    id: `char-${i + 1}`,
    name: mockNames[i % mockNames.length] + (i > 7 ? ` ${i - 7}` : ''),
    avatar: '',
    description: '这是一个有趣的角色，拥有独特的个性和背景故事。快来和我聊天吧！',
    creator: `用户${Math.floor(Math.random() * 1000)}`,
    category: mockCategories[i % mockCategories.length],
    chats: Math.floor(Math.random() * 100000),
    likes: Math.floor(Math.random() * 10000),
    rating: 3.5 + Math.random() * 1.5,
    isNew: Math.random() > 0.7,
    isPremium: Math.random() > 0.8
  }))
}

const handleSearch = () => {
  currentPage.value = 1
  fetchCharacters()
}

const filterByCategory = () => {
  currentPage.value = 1
  fetchCharacters()
}

const sortCharacters = () => {
  currentPage.value = 1
  fetchCharacters()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchCharacters()
  }
}

const goToCharacterDetail = (id: string) => {
  router.push(`/characters/${id}`)
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  sortBy.value = 'popular'
  currentPage.value = 1
  fetchCharacters()
}

onMounted(() => {
  fetchCharacters()
})
</script>

<style lang="scss" scoped>
/* Design Tokens v2.0 - 深空主题角色列表页面 */

.character-list-page {
  min-height: 100vh;
  background: var(--background-primary);
  color: var(--text-primary);
  padding: var(--space-8) 0;
}

.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--space-4);

  @media (min-width: 640px) {
    padding: 0 var(--space-6);
  }

  @media (min-width: 1024px) {
    padding: 0 var(--space-8);
  }
}

/* 页面头部 */
.page-header {
  margin-bottom: var(--space-12);
  text-align: center;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);

  background: linear-gradient(135deg, var(--tavern-primary), var(--tavern-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.title-icon {
  color: var(--tavern-primary);
  font-size: var(--space-8);
}

.page-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* 搜索工具栏 */
.search-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 1000px;
  margin: 0 auto;

  @include tablet-up {
    flex-direction: row;
    align-items: end;
  }
}

.search-section {
  flex: 1;
}

.filter-section {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;

  @include tablet-up {
    flex-wrap: nowrap;
  }
}

.filter-select {
  padding: var(--space-2) var(--space-4);
  border: var(--space-px) solid var(--border-secondary);
  border-radius: var(--input-radius);
  background: var(--surface-2);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: var(--input-transition);

  &:focus {
    outline: none;
    border-color: var(--tavern-primary);
    box-shadow: 0 0 0 var(--space-px-2) var(--focus-ring);
  }

  &:hover {
    border-color: var(--border-primary);
  }
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-4);
}

.loading-spinner {
  position: relative;
}

.loading-icon {
  font-size: var(--space-12);
  color: var(--tavern-primary);
  animation: spin var(--duration-slow) linear infinite;
}

.loading-text {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  animation: pulse var(--duration-normal) ease-in-out infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 角色网格 */
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-12);

  @include tablet-up {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }

  @include desktop-up {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

.character-card {
  height: 100%;
  transition: transform var(--duration-fast) ease;

  &:hover {
    transform: translateY(calc(-1 * var(--space-1)));
  }
}

/* 角色头像 */
.character-avatar {
  position: relative;
  height: 200px;
  overflow: hidden;
  border-radius: var(--card-radius) var(--card-radius) 0 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-normal) ease;

  .character-card:hover & {
    transform: scale(1.05);
  }
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--tavern-primary), var(--tavern-secondary));
  color: white;
}

.placeholder-icon {
  font-size: var(--space-12);
  margin-bottom: var(--space-2);
  opacity: 0.7;
}

.placeholder-text {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
}

/* 状态标签 */
.status-badges {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.status-badge {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.9);
}

/* 角色描述 */
.character-description {
  padding: var(--space-4);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 统计信息 */
.character-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-top: var(--space-px) solid var(--border-tertiary);
}

.stats-group {
  display: flex;
  gap: var(--space-4);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.stat-icon {
  font-size: var(--space-4);
}

.stat-value {
  font-weight: var(--font-medium);
}

.rating-section {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.rating-icon {
  color: var(--warning);
  font-size: var(--space-4);
}

.rating-value {
  color: var(--text-primary);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-4);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  margin-bottom: var(--space-6);
}

.empty-search-icon {
  font-size: var(--space-16);
  color: var(--text-tertiary);
  opacity: 0.5;
}

.empty-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.empty-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-6);
  max-width: 400px;
}

/* 分页 */
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-12);
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.page-numbers {
  display: flex;
  gap: var(--space-1);
}

.page-button {
  min-width: var(--space-10);
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  text-align: center;
}

/* 响应式调整 */
@include mobile-only {
  .search-toolbar {
    .filter-section {
      .filter-select {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .character-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .pagination-nav {
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-numbers {
    order: 3;
    flex-basis: 100%;
    justify-content: center;
    margin-top: var(--space-2);
  }
}
</style>
