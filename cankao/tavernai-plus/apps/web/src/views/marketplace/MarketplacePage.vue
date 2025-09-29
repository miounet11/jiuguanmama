<template>
  <div class="marketplace-page">
    <!-- 顶部横幅 -->
    <div class="hero-banner">
      <div class="banner-content">
        <h1 class="banner-title">角色市场</h1>
        <p class="banner-subtitle">探索数千个精心设计的AI角色，开启独特的对话体验</p>
        <div class="search-container">
          <TavernInput
            v-model="searchQuery"
            placeholder="搜索角色、创作者或标签..."
            size="lg"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <TavernIcon name="search" />
            </template>
            <template #append>
              <TavernButton @click="handleSearch" variant="primary">搜索</TavernButton>
            </template>
          </TavernInput>
        </div>
        <div class="quick-tags">
          <span class="tag-label">热门标签:</span>
          <TavernBadge
            v-for="tag in hotTags"
            :key="tag"
            @click="selectTag(tag)"
            :variant="selectedTags.includes(tag) ? 'primary' : 'neutral'"
            clickable
            class="clickable-tag"
          >
            {{ tag }}
          </TavernBadge>
        </div>
      </div>
      <div class="banner-decoration">
        <div class="floating-card" v-for="i in 6" :key="i" :style="getFloatingStyle(i)"></div>
      </div>
    </div>

    <div class="marketplace-content">
      <!-- 侧边栏筛选 -->
      <aside class="sidebar-filters">
        <div class="filter-section">
          <h3>分类</h3>
          <div class="category-list">
            <div
              v-for="category in categories"
              :key="category.value"
              class="category-item"
              :class="{ active: selectedCategory === category.value }"
              @click="selectedCategory = category.value"
            >
              <el-icon><component :is="category.icon" /></el-icon>
              <span>{{ category.label }}</span>
              <span class="count">{{ category.count }}</span>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <h3>筛选</h3>
          <div class="filter-group">
            <label>评分</label>
            <el-rate v-model="minRating" @change="applyFilters" />
          </div>
          <div class="filter-group">
            <label>语言</label>
            <el-select v-model="selectedLanguage" placeholder="全部" @change="applyFilters">
              <el-option label="全部" value="" />
              <el-option label="中文" value="zh" />
              <el-option label="English" value="en" />
              <el-option label="日本語" value="ja" />
            </el-select>
          </div>
          <div class="filter-group">
            <label>内容分级</label>
            <el-checkbox v-model="showNSFW" @change="applyFilters">显示成人内容</el-checkbox>
          </div>
        </div>

        <div class="filter-section">
          <h3>创作者排行</h3>
          <div class="creator-list">
            <div v-for="(creator, index) in topCreators" :key="creator.id" class="creator-item">
              <span class="rank">{{ index + 1 }}</span>
              <img :src="creator.avatar || '/images/default-avatar.png'" :alt="creator.username" />
              <div class="creator-info">
                <div class="creator-name">{{ creator.username }}</div>
                <div class="creator-stats">{{ creator.characterCount }} 角色</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 特色角色轮播 -->
        <section class="featured-section" v-if="featuredCharacters.length > 0">
          <h2>精选角色</h2>
          <el-carousel :interval="5000" height="400px" class="featured-carousel">
            <el-carousel-item v-for="character in featuredCharacters" :key="character.id">
              <div class="featured-character" @click="viewCharacter(character)">
                <div class="featured-image">
                  <img :src="character.avatar || '/images/default-avatar.png'" :alt="character.name" />
                </div>
                <div class="featured-info">
                  <h3>{{ character.name }}</h3>
                  <p class="featured-description">{{ character.description }}</p>
                  <div class="featured-stats">
                    <span><el-icon><Star /></el-icon> {{ character.rating?.toFixed(1) }}</span>
                    <span><el-icon><ChatDotRound /></el-icon> {{ formatCount(character.chatCount) }}</span>
                    <span><el-icon><User /></el-icon> {{ character.user?.username }}</span>
                  </div>
                  <el-button type="primary" size="large">开始对话</el-button>
                </div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </section>

        <!-- 排序和视图切换 -->
        <div class="content-header">
          <div class="view-options">
            <el-segmented v-model="viewMode" :options="viewModeOptions" />
          </div>
          <div class="sort-options">
            <el-select v-model="sortBy" placeholder="排序" @change="fetchCharacters">
              <el-option label="最新上架" value="newest" />
              <el-option label="最受欢迎" value="popular" />
              <el-option label="评分最高" value="rating" />
              <el-option label="最多对话" value="chats" />
            </el-select>
          </div>
        </div>

        <!-- 角色网格/列表 -->
        <div v-if="viewMode === 'grid'" class="character-grid" v-loading="loading">
          <div
            v-for="character in characters"
            :key="character.id"
            class="character-card-wrapper"
          >
            <CharacterMarketCard
              :character="character"
              @click="viewCharacter(character)"
              @chat="startChat(character)"
              @favorite="toggleFavorite(character)"
            />
          </div>
        </div>

        <div v-else class="character-list" v-loading="loading">
          <div
            v-for="character in characters"
            :key="character.id"
            class="character-list-item"
            @click="viewCharacter(character)"
          >
            <img :src="character.avatar || '/images/default-avatar.png'" :alt="character.name" />
            <div class="list-item-info">
              <h3>{{ character.name }}</h3>
              <p>{{ character.description }}</p>
              <div class="list-item-meta">
                <el-tag v-for="tag in character.tags.slice(0, 3)" :key="tag" size="small">{{ tag }}</el-tag>
              </div>
            </div>
            <div class="list-item-stats">
              <div class="stat-item">
                <el-icon><Star /></el-icon>
                <span>{{ character.rating?.toFixed(1) }}</span>
              </div>
              <div class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ formatCount(character.chatCount) }}</span>
              </div>
            </div>
            <div class="list-item-actions">
              <el-button type="primary" @click.stop="startChat(character)">对话</el-button>
              <el-button @click.stop="toggleFavorite(character)">
                <el-icon><Star :filled="character.isFavorited" /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="totalPages > 1">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalCharacters"
            layout="total, sizes, prev, pager, next, jumper"
            :page-sizes="[20, 40, 60, 100]"
            @current-change="fetchCharacters"
            @size-change="handleSizeChange"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, Star, ChatDotRound, User, TrophyBase, MagicStick,
  VideoPlay, Reading, Ship, Cpu
} from '@element-plus/icons-vue'
import CharacterMarketCard from '@/components/marketplace/CharacterMarketCard.vue'
import { characterService } from '@/services/character'
import { chatService } from '@/services/chat'
import marketplaceService from '@/services/marketplace'
import type { Character } from '@/types/character'

const router = useRouter()

// 数据状态
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const selectedCategory = ref('all')
const selectedLanguage = ref('')
const minRating = ref(0)
const showNSFW = ref(false)
const sortBy = ref('popular')
const viewMode = ref('grid')
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const characters = ref<Character[]>([])
const featuredCharacters = ref<Character[]>([])
const topCreators = ref<any[]>([])
const totalCharacters = ref(0)

const hotTags = ['动漫', '游戏', 'AI助手', '历史人物', '虚拟偶像', '教育', '娱乐']

const categories = [
  { value: 'all', label: '全部', icon: 'TrophyBase', count: 1234 },
  { value: 'anime', label: '动漫游戏', icon: 'VideoPlay', count: 456 },
  { value: 'celebrity', label: '名人明星', icon: 'Star', count: 234 },
  { value: 'fiction', label: '小说影视', icon: 'Reading', count: 345 },
  { value: 'original', label: '原创角色', icon: 'MagicStick', count: 567 },
  { value: 'historical', label: '历史人物', icon: 'Ship', count: 123 },
  { value: 'ai', label: 'AI助手', icon: 'Cpu', count: 234 },
  { value: 'companion', label: '情感陪伴', icon: 'Heart', count: 345 }
]

const viewModeOptions = [
  { label: '网格视图', value: 'grid' },
  { label: '列表视图', value: 'list' }
]

const totalPages = computed(() => Math.ceil(totalCharacters.value / pageSize.value))

// 获取浮动卡片样式
const getFloatingStyle = (index: number) => {
  const positions = [
    { top: '10%', left: '5%', animationDelay: '0s' },
    { top: '20%', right: '10%', animationDelay: '1s' },
    { bottom: '30%', left: '8%', animationDelay: '2s' },
    { bottom: '20%', right: '5%', animationDelay: '1.5s' },
    { top: '40%', left: '15%', animationDelay: '0.5s' },
    { top: '30%', right: '20%', animationDelay: '2.5s' }
  ]
  return positions[index - 1]
}

// 格式化数字
const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

// 获取角色列表
const fetchCharacters = async () => {
  loading.value = true
  try {
    const response = await marketplaceService.getMarketplace({
      page: currentPage.value,
      limit: pageSize.value,
      sort: sortBy.value,
      search: searchQuery.value,
      tags: selectedTags.value,
      category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
      language: selectedLanguage.value,
      minRating: minRating.value,
      showNSFW: showNSFW.value
    })

    characters.value = response.characters
    totalCharacters.value = response.pagination.total
  } catch (error) {
    console.error('获取角色失败:', error)
    ElMessage.error('获取角色失败')
  } finally {
    loading.value = false
  }
}

// 获取精选角色
const fetchFeatured = async () => {
  try {
    const response = await marketplaceService.getFeaturedCharacters()
    featuredCharacters.value = response.characters
  } catch (error) {
    console.error('获取精选角色失败:', error)
  }
}

// 获取创作者排行
const fetchTopCreators = async () => {
  try {
    const response = await marketplaceService.getTopCreators()
    topCreators.value = response.creators
  } catch (error) {
    console.error('获取创作者排行失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchCharacters()
}

// 选择标签
const selectTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  currentPage.value = 1
  fetchCharacters()
}

// 应用筛选
const applyFilters = () => {
  currentPage.value = 1
  fetchCharacters()
}

// 查看角色详情
const viewCharacter = (character: Character) => {
  router.push(`/characters/${character.id}`)
}

// 开始对话
const startChat = async (character: Character) => {
  try {
    const session = await chatService.createSession({
      characterIds: [character.id],
      title: `与 ${character.name} 的对话`
    })
    router.push(`/chat/${session.id}`)
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建会话失败')
  }
}

// 切换收藏
const toggleFavorite = async (character: Character) => {
  try {
    await characterService.toggleFavorite(character.id)
    character.isFavorited = !character.isFavorited
    character.favoriteCount += character.isFavorited ? 1 : -1
    ElMessage.success(character.isFavorited ? '已添加到收藏' : '已取消收藏')
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 改变每页数量
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchCharacters()
}

// 监听分类变化
watch(selectedCategory, () => {
  currentPage.value = 1
  fetchCharacters()
})

onMounted(() => {
  fetchCharacters()
  fetchFeatured()
  fetchTopCreators()
})
</script>

<style lang="scss" scoped>
.marketplace-page {
  min-height: 100vh;
  background: #0f0f1a;
}

// 顶部横幅
.hero-banner {
  position: relative;
  height: 400px;
  background: linear-gradient(135deg, #1e1e28 0%, #2d1b69 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .banner-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 800px;
    padding: 0 20px;
  }

  .banner-title {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 15px;
    background: linear-gradient(135deg, #f3f4f6 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .banner-subtitle {
    font-size: 20px;
    color: #d1d5db;
    margin: 0 0 40px;
  }

  .search-container {
    max-width: 600px;
    margin: 0 auto 30px;

    :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(139, 92, 246, 0.3);
    }
  }

  .quick-tags {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;

    .tag-label {
      color: #9ca3af;
      font-size: 14px;
    }

    .clickable-tag {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }
    }
  }

  .banner-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .floating-card {
      position: absolute;
      width: 60px;
      height: 80px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(196, 132, 252, 0.2));
      border-radius: 8px;
      animation: float 6s ease-in-out infinite;
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

// 主内容区
.marketplace-content {
  display: flex;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

// 侧边栏
.sidebar-filters {
  width: 280px;
  flex-shrink: 0;

  .filter-section {
    background: rgba(30, 30, 40, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;

    h3 {
      margin: 0 0 15px;
      font-size: 16px;
      color: #f3f4f6;
    }
  }

  .category-list {
    .category-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: rgba(139, 92, 246, 0.1);
      }

      &.active {
        background: rgba(139, 92, 246, 0.2);
        border: 1px solid rgba(139, 92, 246, 0.3);
      }

      .el-icon {
        font-size: 18px;
        color: #8b5cf6;
      }

      span {
        color: #d1d5db;

        &.count {
          margin-left: auto;
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }
  }

  .filter-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #9ca3af;
    }

    .el-select {
      width: 100%;
    }
  }

  .creator-list {
    .creator-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;

      .rank {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(139, 92, 246, 0.2);
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
        color: #c084fc;
      }

      img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
      }

      .creator-info {
        flex: 1;

        .creator-name {
          font-size: 14px;
          color: #f3f4f6;
          margin-bottom: 2px;
        }

        .creator-stats {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }
  }
}

// 主内容
.main-content {
  flex: 1;
  min-width: 0;
}

// 精选角色轮播
.featured-section {
  margin-bottom: 30px;

  h2 {
    margin: 0 0 20px;
    font-size: 24px;
    color: #f3f4f6;
  }

  .featured-carousel {
    :deep(.el-carousel__container) {
      border-radius: 12px;
      overflow: hidden;
    }
  }

  .featured-character {
    display: flex;
    height: 100%;
    background: linear-gradient(135deg, rgba(30, 30, 40, 0.9), rgba(45, 27, 105, 0.9));
    cursor: pointer;

    .featured-image {
      width: 400px;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .featured-info {
      flex: 1;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;

      h3 {
        margin: 0 0 15px;
        font-size: 32px;
        color: #f3f4f6;
      }

      .featured-description {
        margin: 0 0 20px;
        font-size: 16px;
        color: #d1d5db;
        line-height: 1.6;
      }

      .featured-stats {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;

        span {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #9ca3af;

          .el-icon {
            color: #fbbf24;
          }
        }
      }
    }
  }
}

// 内容头部
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .view-options {
    :deep(.el-segmented) {
      background: rgba(30, 30, 40, 0.8);

      .el-segmented__item {
        color: #9ca3af;

        &.is-selected {
          background: rgba(139, 92, 246, 0.2);
          color: #c084fc;
        }
      }
    }
  }
}

// 角色网格
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

// 角色列表
.character-list {
  .character-list-item {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    margin-bottom: 15px;
    background: rgba(30, 30, 40, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateX(5px);
      border-color: rgba(139, 92, 246, 0.4);
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.2);
    }

    img {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .list-item-info {
      flex: 1;
      min-width: 0;

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
        color: #f3f4f6;
      }

      p {
        margin: 0 0 10px;
        color: #9ca3af;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .list-item-meta {
        display: flex;
        gap: 5px;
      }
    }

    .list-item-stats {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #9ca3af;

        .el-icon {
          color: #fbbf24;
        }
      }
    }

    .list-item-actions {
      display: flex;
      gap: 10px;
    }
  }
}

// 分页
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;

  :deep(.el-pagination) {
    .el-pagination__total,
    .el-pagination__sizes,
    .el-pager li {
      background: rgba(30, 30, 40, 0.8);
      color: #9ca3af;
    }

    .el-pager li.is-active {
      background: rgba(139, 92, 246, 0.2);
      color: #c084fc;
    }
  }
}

// 响应式
@media (max-width: 1024px) {
  .marketplace-content {
    flex-direction: column;
  }

  .sidebar-filters {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    height: 300px;

    .banner-title {
      font-size: 32px;
    }

    .banner-subtitle {
      font-size: 16px;
    }
  }

  .character-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
