<template>
  <div class="scenario-list">
    <!-- 搜索和筛选栏 -->
    <div class="search-filter-bar">
      <div class="search-filter-content">
        <!-- 搜索框 -->
        <div class="flex-1">
          <el-input
            v-model="localSearchQuery"
            placeholder="搜索剧本名称、描述或标签..."
            :prefix-icon="'Search'"
            size="large"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch" :icon="'Search'">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 筛选器 -->
        <div class="filters-container">
          <!-- 分类选择 -->
          <el-select
            v-model="selectedCategory"
            placeholder="选择分类"
            size="large"
            clearable
            @change="handleCategoryChange"
            class="w-32"
          >
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>

          <!-- 排序选择 -->
          <el-select
            v-model="selectedSort"
            placeholder="排序方式"
            size="large"
            @change="handleSortChange"
            class="w-32"
          >
            <el-option label="最新创建" value="created" />
            <el-option label="最近更新" value="updated" />
            <el-option label="最受欢迎" value="popular" />
            <el-option label="评分最高" value="rating" />
            <el-option label="按名称" value="name" />
          </el-select>

          <!-- 公开状态切换 -->
          <el-switch
            v-model="showPublicOnly"
            active-text="仅公开"
            inactive-text="全部"
            @change="handlePublicToggle"
          />
        </div>
      </div>

      <!-- 标签筛选 -->
      <div v-if="tags.length > 0" class="tags-filter-section">
        <div class="tags-header">
          <span class="tags-label">热门标签:</span>
          <el-button
            v-if="selectedTags.length > 0"
            size="small"
            type="info"
            plain
            @click="clearTagFilters"
          >
            清除标签筛选
          </el-button>
        </div>
        <div class="tags-container">
          <el-tag
            v-for="tagData in tags.slice(0, 10)"
            :key="tagData.name"
            :type="selectedTags.includes(tagData.name) ? 'primary' : 'info'"
            :effect="selectedTags.includes(tagData.name) ? 'dark' : 'plain'"
            class="cursor-pointer"
            @click="toggleTag(tagData.name)"
          >
            {{ tagData.name }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="text-xl font-semibold text-gray-800">
          剧本列表
          <span v-if="totalItems > 0" class="text-sm font-normal text-gray-500">
            (共 {{ totalItems }} 个剧本)
          </span>
        </h2>

        <!-- 视图切换 -->
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="grid">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
          <el-radio-button label="list">
            <el-icon><List /></el-icon>
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="toolbar-right">
        <!-- 刷新按钮 -->
        <el-button
          @click="refreshScenarios"
          :loading="isLoading"
          :icon="'Refresh'"
        >
          刷新
        </el-button>

        <!-- 创建剧本按钮 -->
        <el-button
          type="primary"
          @click="createNewScenario"
          :icon="'Plus'"
        >
          创建剧本
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading && scenarios.length === 0" class="text-center py-12">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="!isLoading && scenarios.length === 0" class="text-center py-12">
      <el-empty description="暂无剧本">
        <el-button type="primary" @click="createNewScenario">
          创建第一个剧本
        </el-button>
      </el-empty>
    </div>

    <!-- 剧本列表 -->
    <div v-else>
      <!-- 网格视图 -->
      <div
        v-if="viewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <ScenarioCard
          v-for="scenario in scenarios"
          :key="scenario.id"
          :scenario="scenario"
          @click="viewScenario(scenario)"
          @edit="editScenario(scenario)"
          @delete="deleteScenario(scenario)"
          @clone="cloneScenario(scenario)"
          @toggle-public="toggleScenarioPublic(scenario)"
          @comment="openComments(scenario)"
        />
      </div>

      <!-- 列表视图 -->
      <div v-else class="space-y-4">
        <ScenarioListItem
          v-for="scenario in scenarios"
          :key="scenario.id"
          :scenario="scenario"
          @click="viewScenario(scenario)"
          @edit="editScenario(scenario)"
          @delete="deleteScenario(scenario)"
          @clone="cloneScenario(scenario)"
          @toggle-public="toggleScenarioPublic(scenario)"
          @comment="openComments(scenario)"
        />
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="itemsPerPage"
          :total="totalItems"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 创建剧本对话框 -->
    <CreateScenarioDialog
      v-model="showCreateDialog"
      @created="handleScenarioCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, List } from '@element-plus/icons-vue'
import { useScenarioStore } from '@/stores/scenario'
import ScenarioCard from './ScenarioCard.vue'
import ScenarioListItem from './ScenarioListItem.vue'
import CreateScenarioDialog from './CreateScenarioDialog.vue'
import type { Scenario } from '@/types/scenario'

// 路由
const router = useRouter()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据 - 使用 storeToRefs 保持响应式
const {
  scenarios,
  isLoading,
  totalItems,
  totalPages,
  currentPage,
  itemsPerPage,
  searchQuery,
  selectedCategory,
  selectedTags,
  sortBy,
  showPublicOnly,
  categories,
  tags
} = storeToRefs(scenarioStore)

// 组件本地状态
const viewMode = ref<'grid' | 'list'>('grid')
const showCreateDialog = ref(false)
const localSearchQuery = ref('')

const selectedSort = computed({
  get: () => sortBy.value,
  set: (value) => {
    scenarioStore.sortBy = value
  }
})

// 事件处理方法
const handleSearch = () => {
  scenarioStore.searchScenarios(localSearchQuery.value)
}

const handleCategoryChange = (category: string | null) => {
  scenarioStore.filterByCategory(category || '')
}

const handleSortChange = () => {
  scenarioStore.fetchScenarios()
}

const handlePublicToggle = () => {
  scenarioStore.fetchScenarios()
}

const handlePageChange = (page: number) => {
  scenarioStore.goToPage(page)
}

const handlePageSizeChange = (size: number) => {
  scenarioStore.itemsPerPage = size
  scenarioStore.currentPage = 1
  scenarioStore.fetchScenarios()
}

const toggleTag = (tag: string) => {
  const index = selectedTags.indexOf(tag)
  if (index === -1) {
    selectedTags.push(tag)
  } else {
    selectedTags.splice(index, 1)
  }
  scenarioStore.filterByTags([...selectedTags])
}

const clearTagFilters = () => {
  selectedTags.splice(0)
  scenarioStore.filterByTags([])
}

const refreshScenarios = () => {
  scenarioStore.fetchScenarios()
}

const createNewScenario = () => {
  showCreateDialog.value = true
}

const viewScenario = (scenario: Scenario) => {
  router.push(`/scenarios/${scenario.id}`)
}

const editScenario = (scenario: Scenario) => {
  router.push(`/scenarios/${scenario.id}/edit`)
}

const deleteScenario = async (scenario: Scenario) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除剧本 "${scenario.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await scenarioStore.deleteScenario(scenario.id)
  } catch (error) {
    // 用户取消或其他错误
    if (error !== 'cancel') {
      console.error('删除剧本失败:', error)
    }
  }
}

const cloneScenario = async (scenario: Scenario) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新剧本的名称:',
      '复制剧本',
      {
        confirmButtonText: '复制',
        cancelButtonText: '取消',
        inputValue: `${scenario.name} (副本)`,
        inputValidator: (value) => {
          if (!value || value.trim().length === 0) {
            return '剧本名称不能为空'
          }
          if (value.length > 100) {
            return '剧本名称不能超过100字符'
          }
          return true
        }
      }
    )

    // 创建新剧本（复制功能需要后端支持）
    await scenarioStore.createScenario({
      name: newName,
      description: scenario.description,
      content: scenario.content,
      isPublic: false, // 复制的剧本默认为私有
      tags: [...scenario.tags],
      category: scenario.category,
      language: scenario.language
    })

    ElMessage.success('剧本复制成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('复制剧本失败:', error)
    }
  }
}

const toggleScenarioPublic = async (scenario: Scenario) => {
  try {
    // 这里需要后端API支持
    await scenarioStore.updateScenario(scenario.id, {
      isPublic: !scenario.isPublic
    })
    ElMessage.success(`剧本已${scenario.isPublic ? '设为私有' : '设为公开'}`)
  } catch (error) {
    console.error('切换公开状态失败:', error)
  }
}

const handleScenarioCreated = (scenario: Scenario) => {
  showCreateDialog.value = false
  ElMessage.success('剧本创建成功')
  // 刷新列表或导航到新剧本
  router.push(`/scenarios/${scenario.id}/edit`)
}

const openComments = (scenario: Scenario) => {
  // 跳转到剧本详情页面并打开评论区
  router.push({
    path: `/scenarios/${scenario.id}`,
    query: { tab: 'comments' }
  })
  ElMessage.info(`正在查看 "${scenario.name}" 的评论`)
}

// 监听搜索查询变化
watch(localSearchQuery, (newValue) => {
  if (newValue === '') {
    handleSearch()
  }
})

// 组件挂载时加载数据
onMounted(async () => {
  // 并行加载数据
  await Promise.all([
    scenarioStore.fetchScenarios(),
    scenarioStore.fetchCategories(),
    scenarioStore.fetchTags()
  ])

  // 初始化本地搜索查询
  localSearchQuery.value = searchQuery.value || ''
})
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.scenario-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-normal) var(--spacing-tight);
}

.search-filter-bar {
  background: var(--surface-1);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-comfortable);
  margin-bottom: var(--spacing-comfortable);
  box-shadow: var(--shadow-base);

  .search-filter-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-normal);

    @media (min-width: 1024px) {
      flex-direction: row;
      align-items: center;
    }
  }

  .filters-container {
    display: flex;
    gap: var(--spacing-tight);
    flex-wrap: wrap;
  }

  .tags-filter-section {
    margin-top: var(--spacing-normal);

    .tags-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-tight);
      margin-bottom: var(--spacing-tight);

      .tags-label {
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        color: var(--text-secondary);
      }
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-tight);
    }
  }

  .el-input__wrapper {
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-secondary);
  }
}

.toolbar {
  background: var(--surface-1);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-normal) var(--spacing-comfortable);
  margin-bottom: var(--spacing-normal);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-comfortable);

    h2 {
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0;

      span {
        font-size: var(--text-sm);
        font-weight: var(--font-normal);
        color: var(--text-tertiary);
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: var(--spacing-tight);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .scenario-list {
    padding: var(--spacing-tight);
  }

  .search-filter-bar {
    padding: var(--spacing-normal);

    .search-filter-content {
      gap: var(--spacing-normal);
    }
  }

  .toolbar {
    flex-direction: column;
    gap: var(--spacing-normal);
    align-items: stretch;

    .toolbar-left {
      justify-content: space-between;
    }

    .toolbar-right {
      justify-content: space-between;
    }
  }
}

// 自定义滚动条
:deep(.el-scrollbar__bar) {
  opacity: 0.6;
}

:deep(.el-scrollbar__thumb) {
  background-color: var(--border-primary);
  border-radius: var(--radius-sm);
}

// 标签样式优化
.el-tag {
  transition: all var(--duration-normal);
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
}

// 网格布局优化
.grid {
  display: grid;
  gap: var(--spacing-comfortable);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

// 分页样式
:deep(.el-pagination) {
  background: var(--surface-1);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-comfortable);
  justify-content: center;

  .el-pager li {
    background: var(--surface-2);
    border: 1px solid var(--border-primary);
    color: var(--text-primary);

    &.active {
      background: var(--brand-primary-500);
      border-color: var(--brand-primary-500);
      color: white;
    }
  }

  .btn-prev,
  .btn-next {
    background: var(--surface-2);
    border: 1px solid var(--border-primary);
    color: var(--text-primary);
  }
}

// 加载和空状态
.text-center {
  text-align: center;
  color: var(--text-secondary);
}

.py-12 {
  padding: var(--spacing-loose) 0;
}
</style>
