<template>
  <div class="character-list-with-progressive">
    <!-- 页面头部 -->
    <PageHeader title="探索角色" subtitle="发现有趣的AI角色，开始精彩对话" />

    <!-- 渐进式披露容器 -->
    <ProgressiveDisclosure
      feature-scope="character-discovery"
      :allow-mode-switch="true"
      :show-upgrade-suggestions="true"
      @feature-unlock="handleFeatureUnlock"
    >
      <template #default="{ visibleFeatures, featureState, currentMode, isExpertMode }">
        <div class="container">
          <!-- 搜索和筛选区域 -->
          <div class="search-filter-section">
            <div class="search-container">
              <!-- 基础搜索 - 始终可见 -->
              <div class="basic-search">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索角色名称..."
                  :prefix-icon="Search"
                  size="large"
                  clearable
                  @input="handleSearch"
                  class="search-input"
                />
              </div>

              <!-- 高级搜索 - 需要解锁 -->
              <div
                v-if="isFeatureEnabled('character-advanced-search', featureState)"
                class="advanced-search"
                :class="{ 'newly-unlocked': isFeatureHighlighted('character-advanced-search', featureState) }"
              >
                <el-collapse v-model="advancedSearchExpanded" class="advanced-search-panel">
                  <el-collapse-item name="advanced" title="高级搜索选项">
                    <div class="advanced-options">
                      <div class="option-row">
                        <el-input
                          v-model="advancedSearch.description"
                          placeholder="搜索角色描述..."
                          size="default"
                        />
                        <el-input
                          v-model="advancedSearch.personality"
                          placeholder="搜索性格特征..."
                          size="default"
                        />
                      </div>
                      <div class="option-row">
                        <el-select
                          v-model="advancedSearch.source"
                          placeholder="来源筛选"
                          clearable
                          size="default"
                        >
                          <el-option label="动漫" value="anime" />
                          <el-option label="游戏" value="game" />
                          <el-option label="小说" value="novel" />
                          <el-option label="原创" value="original" />
                        </el-select>
                        <el-date-picker
                          v-model="advancedSearch.dateRange"
                          type="daterange"
                          range-separator="至"
                          start-placeholder="创建开始日期"
                          end-placeholder="创建结束日期"
                          size="default"
                        />
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>

            <!-- 智能筛选 - 需要解锁 -->
            <div
              v-if="isFeatureEnabled('character-filtering', featureState)"
              class="smart-filters"
              :class="{ 'newly-unlocked': isFeatureHighlighted('character-filtering', featureState) }"
            >
              <div class="filter-header">
                <h4>智能筛选</h4>
                <el-tooltip content="根据多个条件组合筛选角色">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
              <div class="filter-options">
                <el-checkbox-group v-model="selectedFilters" @change="applyFilters">
                  <el-checkbox label="high-rating">高评分 (4.5+)</el-checkbox>
                  <el-checkbox label="popular">热门角色</el-checkbox>
                  <el-checkbox label="recent">最近更新</el-checkbox>
                  <el-checkbox label="verified">官方认证</el-checkbox>
                  <el-checkbox label="active">活跃对话</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>

            <!-- 排序选项 -->
            <div class="sort-section">
              <el-select
                v-model="sortBy"
                placeholder="排序方式"
                @change="handleSort"
                class="sort-select"
              >
                <el-option label="最受欢迎" value="popular" />
                <el-option label="最新创建" value="newest" />
                <el-option label="评分最高" value="rating" />
                <el-option label="对话最多" value="chats" />
                <el-option
                  v-if="isExpertMode"
                  label="最近活跃"
                  value="recent-activity"
                />
                <el-option
                  v-if="isExpertMode"
                  label="创作者推荐"
                  value="creator-recommended"
                />
              </el-select>
            </div>
          </div>

          <!-- 角色网格展示 -->
          <div class="character-grid-section">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
              <el-skeleton animated>
                <template #template>
                  <div class="character-grid">
                    <div
                      v-for="n in 12"
                      :key="n"
                      class="character-skeleton"
                    >
                      <el-skeleton-item variant="image" class="skeleton-avatar" />
                      <el-skeleton-item variant="text" class="skeleton-name" />
                      <el-skeleton-item variant="text" class="skeleton-desc" />
                    </div>
                  </div>
                </template>
              </el-skeleton>
            </div>

            <!-- 角色列表 -->
            <div v-else class="character-grid">
              <CharacterCard
                v-for="character in filteredCharacters"
                :key="character.id"
                :character="character"
                :show-advanced-info="isExpertMode"
                :enable-rating="isFeatureEnabled('character-rating', featureState)"
                :enable-favorites="isFeatureEnabled('character-favorites', featureState)"
                @select="handleCharacterSelect"
                @rate="handleCharacterRate"
                @favorite="handleCharacterFavorite"
                class="character-item"
              />
            </div>

            <!-- 空状态 -->
            <div v-if="!loading && filteredCharacters.length === 0" class="empty-state">
              <el-empty
                description="没有找到符合条件的角色"
                :image-size="160"
              >
                <el-button type="primary" @click="clearFilters">
                  清除筛选条件
                </el-button>
              </el-empty>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination-section">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[12, 24, 48, 96]"
              :total="totalCharacters"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              class="pagination"
            />
          </div>

          <!-- 专家模式专用功能 -->
          <div v-if="isExpertMode" class="expert-features">
            <el-card class="expert-panel" header="专家功能">
              <div class="expert-actions">
                <el-button
                  v-if="isFeatureEnabled('character-creation-basic', featureState)"
                  type="primary"
                  :icon="Plus"
                  @click="createCharacter"
                >
                  创建新角色
                </el-button>
                <el-button
                  v-if="isFeatureEnabled('character-sharing', featureState)"
                  :icon="Share"
                  @click="showBatchOperations = !showBatchOperations"
                >
                  批量操作
                </el-button>
                <el-button
                  :icon="Download"
                  @click="exportCharacters"
                >
                  导出数据
                </el-button>
              </div>

              <!-- 批量操作面板 -->
              <div v-if="showBatchOperations" class="batch-operations">
                <el-checkbox-group v-model="selectedCharacters">
                  <div class="batch-actions">
                    <el-button size="small" @click="selectAll">全选</el-button>
                    <el-button size="small" @click="clearSelection">清除</el-button>
                    <el-button
                      size="small"
                      type="danger"
                      :disabled="selectedCharacters.length === 0"
                      @click="batchDelete"
                    >
                      批量删除
                    </el-button>
                  </div>
                </el-checkbox-group>
              </div>
            </el-card>
          </div>
        </div>
      </template>
    </ProgressiveDisclosure>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  QuestionFilled,
  Plus,
  Share,
  Download
} from '@element-plus/icons-vue'

import PageHeader from '@/components/common/PageHeader.vue'
import ProgressiveDisclosure from '@/components/progressive/ProgressiveDisclosure.vue'
import CharacterCard from '@/components/character/CharacterCard.vue'
import { useCharacterStore } from '@/stores/character'
import { useUserModeStore } from '@/stores/userModeStore'
import type { Character } from '@/types/character'

// Stores
const characterStore = useCharacterStore()
const userModeStore = useUserModeStore()
const router = useRouter()

// Local state
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('popular')
const currentPage = ref(1)
const pageSize = ref(24)
const selectedFilters = ref<string[]>([])
const selectedCharacters = ref<string[]>([])
const showBatchOperations = ref(false)

// Advanced search
const advancedSearchExpanded = ref(['advanced'])
const advancedSearch = ref({
  description: '',
  personality: '',
  source: '',
  dateRange: null as Date[] | null
})

// Computed
const filteredCharacters = computed(() => {
  let characters = characterStore.characters

  // 基础搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    characters = characters.filter(char =>
      char.name.toLowerCase().includes(query) ||
      char.description.toLowerCase().includes(query)
    )
  }

  // 高级搜索
  if (advancedSearch.value.description) {
    const desc = advancedSearch.value.description.toLowerCase()
    characters = characters.filter(char =>
      char.description.toLowerCase().includes(desc)
    )
  }

  if (advancedSearch.value.personality) {
    const personality = advancedSearch.value.personality.toLowerCase()
    characters = characters.filter(char =>
      char.personality?.toLowerCase().includes(personality)
    )
  }

  if (advancedSearch.value.source) {
    characters = characters.filter(char =>
      char.tags.includes(advancedSearch.value.source)
    )
  }

  // 智能筛选
  selectedFilters.value.forEach(filter => {
    switch (filter) {
      case 'high-rating':
        characters = characters.filter(char => char.rating >= 4.5)
        break
      case 'popular':
        characters = characters.filter(char => char.chatCount > 100)
        break
      case 'recent':
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 7)
        characters = characters.filter(char =>
          new Date(char.createdAt) > recentDate
        )
        break
      case 'verified':
        characters = characters.filter(char => char.isVerified)
        break
      case 'active':
        characters = characters.filter(char => char.chatCount > 50)
        break
    }
  })

  // 排序
  switch (sortBy.value) {
    case 'newest':
      characters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'rating':
      characters.sort((a, b) => b.rating - a.rating)
      break
    case 'chats':
      characters.sort((a, b) => b.chatCount - a.chatCount)
      break
    case 'recent-activity':
      characters.sort((a, b) => b.lastActiveAt - a.lastActiveAt)
      break
    default: // popular
      characters.sort((a, b) => b.favoriteCount - a.favoriteCount)
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return characters.slice(start, end)
})

const totalCharacters = computed(() => characterStore.characters.length)
const totalPages = computed(() => Math.ceil(totalCharacters.value / pageSize.value))

// Methods
const isFeatureEnabled = (featureId: string, featureState: Map<string, any>): boolean => {
  return featureState.get(featureId)?.enabled || false
}

const isFeatureHighlighted = (featureId: string, featureState: Map<string, any>): boolean => {
  return featureState.get(featureId)?.highlighted || false
}

const handleSearch = () => {
  currentPage.value = 1
  userModeStore.recordFeatureUsage('character-basic-browse')
}

const handleSort = () => {
  currentPage.value = 1
  if (sortBy.value.includes('recent-activity') || sortBy.value.includes('creator-recommended')) {
    userModeStore.recordFeatureUsage('character-advanced-search', true)
  }
}

const applyFilters = () => {
  currentPage.value = 1
  userModeStore.recordFeatureUsage('character-filtering', true)
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedFilters.value = []
  advancedSearch.value = {
    description: '',
    personality: '',
    source: '',
    dateRange: null
  }
  currentPage.value = 1
}

const handleCharacterSelect = (character: Character) => {
  userModeStore.recordFeatureUsage('character-basic-browse')
  router.push(`/chat/${character.id}`)
}

const handleCharacterRate = async (character: Character, rating: number) => {
  try {
    await characterStore.rateCharacter(character.id, rating)
    userModeStore.recordFeatureUsage('character-rating')
    ElMessage.success('评分成功')
  } catch (error) {
    ElMessage.error('评分失败')
  }
}

const handleCharacterFavorite = async (character: Character) => {
  try {
    await characterStore.toggleFavorite(character.id)
    userModeStore.recordFeatureUsage('character-favorites')
    ElMessage.success(character.isFavorited ? '已取消收藏' : '已添加收藏')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleFeatureUnlock = (featureId: string) => {
  ElMessage.success(`🎉 解锁新功能: ${featureId}`)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const createCharacter = () => {
  userModeStore.recordFeatureUsage('character-creation-basic')
  router.push('/studio/character/create')
}

const selectAll = () => {
  selectedCharacters.value = filteredCharacters.value.map(char => char.id)
}

const clearSelection = () => {
  selectedCharacters.value = []
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCharacters.value.length} 个角色吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 执行批量删除
    await characterStore.batchDeleteCharacters(selectedCharacters.value)
    selectedCharacters.value = []
    showBatchOperations.value = false
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

const exportCharacters = () => {
  // 导出角色数据
  const dataStr = JSON.stringify(filteredCharacters.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `characters-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// Lifecycle
onMounted(async () => {
  try {
    await characterStore.fetchCharacters()
    userModeStore.incrementSessionCount()
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
})

// Watch for advanced search changes
watch(advancedSearch, () => {
  if (advancedSearch.value.description || advancedSearch.value.personality ||
      advancedSearch.value.source || advancedSearch.value.dateRange) {
    userModeStore.recordFeatureUsage('character-advanced-search', true)
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.character-list-with-progressive {
  min-height: 100vh;
  background: var(--el-bg-color-page);

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  .search-filter-section {
    margin-bottom: 24px;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .search-container {
      margin-bottom: 16px;

      .basic-search {
        margin-bottom: 16px;

        .search-input {
          max-width: 500px;
        }
      }

      .advanced-search {
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.3s ease;

        &.newly-unlocked {
          border-color: var(--el-color-warning);
          box-shadow: 0 0 10px var(--el-color-warning-light-8);
          animation: featureGlow 3s ease-in-out;
        }

        .advanced-search-panel {
          border: none;

          :deep(.el-collapse-item__header) {
            background: var(--el-fill-color-lighter);
            padding: 12px 16px;
            border: none;
          }

          :deep(.el-collapse-item__content) {
            padding: 16px;
          }
        }

        .advanced-options {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .option-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;

            @media (max-width: 768px) {
              grid-template-columns: 1fr;
            }
          }
        }
      }
    }

    .smart-filters {
      margin-bottom: 16px;
      padding: 16px;
      background: var(--el-fill-color-extra-light);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-extra-light);
      transition: all 0.3s ease;

      &.newly-unlocked {
        border-color: var(--el-color-success);
        background: var(--el-color-success-light-9);
        animation: featureGlow 3s ease-in-out;
      }

      .filter-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .el-icon {
          color: var(--el-text-color-secondary);
          cursor: help;
        }
      }

      .filter-options {
        :deep(.el-checkbox-group) {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
      }
    }

    .sort-section {
      .sort-select {
        min-width: 150px;
      }
    }
  }

  .character-grid-section {
    margin-bottom: 24px;

    .loading-container {
      .character-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;

        .character-skeleton {
          padding: 16px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 8px;
          background: var(--el-bg-color);

          .skeleton-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin-bottom: 12px;
          }

          .skeleton-name {
            width: 80%;
            height: 20px;
            margin-bottom: 8px;
          }

          .skeleton-desc {
            width: 100%;
            height: 16px;
          }
        }
      }
    }

    .character-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
      }

      .character-item {
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
        }
      }
    }

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }
  }

  .pagination-section {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;

    .pagination {
      :deep(.el-pagination) {
        justify-content: center;
      }
    }
  }

  .expert-features {
    .expert-panel {
      .expert-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;

        @media (max-width: 768px) {
          flex-direction: column;

          .el-button {
            width: 100%;
          }
        }
      }

      .batch-operations {
        padding: 16px;
        background: var(--el-fill-color-extra-light);
        border-radius: 8px;
        margin-top: 16px;

        .batch-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
      }
    }
  }
}

@keyframes featureGlow {
  0% {
    box-shadow: 0 0 5px var(--el-color-primary-light-8);
  }
  50% {
    box-shadow: 0 0 20px var(--el-color-primary-light-6);
  }
  100% {
    box-shadow: 0 0 5px var(--el-color-primary-light-8);
  }
}
</style>