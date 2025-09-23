<template>
  <div class="scenario-detail">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <LoadingOverlay message="加载剧本详情中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="warning"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="loadScenario">
            重新加载
          </el-button>
          <el-button @click="$router.push('/scenarios')">
            返回列表
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 正常内容 -->
    <div v-else-if="scenario" class="scenario-content">
      <!-- 页面头部 -->
      <PageHeader
        :title="scenario.name"
        :subtitle="scenario.description || '无描述'"
        :breadcrumb="breadcrumbItems"
      >
        <template #actions>
          <div class="flex items-center gap-3">
            <!-- 状态指示器 -->
            <el-tag
              :type="scenario.isPublic ? 'success' : 'warning'"
              size="large"
            >
              {{ scenario.isPublic ? '公开' : '私有' }}
            </el-tag>

            <!-- 操作按钮 -->
            <el-button
              @click="editScenario"
              type="primary"
              :icon="'Edit'"
            >
              编辑剧本
            </el-button>

            <el-dropdown @command="handleCommand">
              <el-button :icon="'More'" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="clone">
                    <el-icon><CopyDocument /></el-icon>
                    复制剧本
                  </el-dropdown-item>
                  <el-dropdown-item command="export">
                    <el-icon><Download /></el-icon>
                    导出剧本
                  </el-dropdown-item>
                  <el-dropdown-item command="test" divided>
                    <el-icon><Connection /></el-icon>
                    测试匹配
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    divided
                    class="text-red-600"
                  >
                    <el-icon><Delete /></el-icon>
                    删除剧本
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </PageHeader>

      <!-- 主内容区域 -->
      <div class="detail-content">
        <!-- 剧本信息卡片 -->
        <div class="scenario-info-card bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 基本信息 -->
            <div class="lg:col-span-2">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">剧本信息</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">描述</label>
                  <p class="mt-1 text-gray-600">
                    {{ scenario.description || '暂无描述' }}
                  </p>
                </div>

                <div v-if="scenario.content">
                  <label class="block text-sm font-medium text-gray-700">剧本内容</label>
                  <div class="mt-1 text-gray-600 bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                    {{ scenario.content }}
                  </div>
                </div>

                <div v-if="scenario.tags && scenario.tags.length > 0">
                  <label class="block text-sm font-medium text-gray-700 mb-2">标签</label>
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-for="tag in scenario.tags"
                      :key="tag"
                      size="small"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- 统计信息 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">统计信息</h3>
              <div class="space-y-4">
                <div class="stat-item">
                  <div class="stat-label">分类</div>
                  <div class="stat-value">{{ scenario.category }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">语言</div>
                  <div class="stat-value">{{ scenario.language || 'zh-CN' }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">条目数量</div>
                  <div class="stat-value">{{ scenario.worldInfoEntries?.length || 0 }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">活跃条目</div>
                  <div class="stat-value">{{ activeEntriesCount }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">创建时间</div>
                  <div class="stat-value text-sm">{{ formatDate(scenario.createdAt) }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">更新时间</div>
                  <div class="stat-value text-sm">{{ formatDate(scenario.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 世界信息预览 -->
        <div class="entries-preview bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              世界信息条目 ({{ scenario.worldInfoEntries?.length || 0 }})
            </h3>
            <el-button
              @click="editScenario"
              size="small"
              type="primary"
              plain
            >
              管理条目
            </el-button>
          </div>

          <div v-if="!scenario.worldInfoEntries || scenario.worldInfoEntries.length === 0">
            <el-empty
              description="暂无世界信息条目"
              :image-size="80"
            >
              <el-button type="primary" @click="editScenario">
                添加第一个条目
              </el-button>
            </el-empty>
          </div>

          <div v-else class="entries-grid">
            <div
              v-for="entry in scenario.worldInfoEntries.slice(0, 6)"
              :key="entry.id"
              class="entry-preview-card bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div class="flex items-start justify-between mb-2">
                <h4 class="font-medium text-gray-900 truncate">
                  {{ entry.title }}
                </h4>
                <el-tag
                  :type="entry.isActive ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ entry.isActive ? '活跃' : '禁用' }}
                </el-tag>
              </div>

              <p class="text-sm text-gray-600 line-clamp-2 mb-2">
                {{ entry.content }}
              </p>

              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{{ entry.keywords.length }} 个关键词</span>
                <span>优先级 {{ entry.priority }}</span>
              </div>
            </div>

            <div
              v-if="scenario.worldInfoEntries.length > 6"
              class="more-entries-card bg-gray-100 rounded-lg p-4 border border-gray-200 flex items-center justify-center cursor-pointer"
              @click="editScenario"
            >
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-500 mb-1">
                  +{{ scenario.worldInfoEntries.length - 6 }}
                </div>
                <div class="text-sm text-gray-600">更多条目</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试对话框 -->
    <ScenarioTestDialog
      v-model="showTestDialog"
      :scenario="scenario"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Edit,
  More,
  CopyDocument,
  Download,
  Connection,
  Delete
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import ScenarioTestDialog from '@/components/scenario/ScenarioTestDialog.vue'
import { useScenarioStore } from '@/stores/scenario'
import type { Scenario } from '@/types/scenario'

// 路由
const route = useRoute()
const router = useRouter()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const showTestDialog = ref(false)

// 计算属性
const {
  currentScenario: scenario,
  isLoading,
  error
} = scenarioStore

const breadcrumbItems = computed(() => [
  { text: '首页', to: '/' },
  { text: '剧本管理', to: '/scenarios' },
  { text: scenario.value?.name || '剧本详情', to: `/scenarios/${route.params.id}` }
])

const activeEntriesCount = computed(() => {
  if (!scenario.value?.worldInfoEntries) return 0
  return scenario.value.worldInfoEntries.filter(entry => entry.isActive).length
})

// 方法
const loadScenario = async () => {
  const scenarioId = route.params.id as string
  if (scenarioId) {
    await scenarioStore.fetchScenario(scenarioId)
  }
}

const editScenario = () => {
  if (scenario.value) {
    router.push(`/scenarios/${scenario.value.id}/edit`)
  }
}

const handleCommand = async (command: string) => {
  if (!scenario.value) return

  switch (command) {
    case 'clone':
      await handleClone()
      break
    case 'export':
      await handleExport()
      break
    case 'test':
      showTestDialog.value = true
      break
    case 'delete':
      await handleDelete()
      break
  }
}

const handleClone = async () => {
  if (!scenario.value) return

  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新剧本的名称:',
      '复制剧本',
      {
        confirmButtonText: '复制',
        cancelButtonText: '取消',
        inputValue: `${scenario.value.name} (副本)`
      }
    )

    const newScenario = await scenarioStore.createScenario({
      name: newName,
      description: scenario.value.description,
      category: scenario.value.category,
      tags: [...scenario.value.tags],
      isPublic: false
    })

    ElMessage.success('剧本复制成功')
    router.push(`/scenarios/${newScenario.id}/edit`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('复制剧本失败:', error)
    }
  }
}

const handleExport = async () => {
  if (!scenario.value) return

  try {
    // 这里需要实现导出功能
    ElMessage.info('导出功能开发中...')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const handleDelete = async () => {
  if (!scenario.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除剧本 "${scenario.value.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await scenarioStore.deleteScenario(scenario.value.id)
    ElMessage.success('剧本删除成功')
    router.push('/scenarios')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除剧本失败:', error)
    }
  }
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const distance = formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    })
    const formatted = format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })
    return `${distance} (${formatted})`
  } catch {
    return '未知'
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadScenario()
})
</script>

<style scoped>
.scenario-detail {
  @apply min-h-screen bg-gray-50;
}

.loading-container,
.error-container {
  @apply flex items-center justify-center min-h-screen;
}

.detail-content {
  @apply container mx-auto px-4 py-6;
}

.stat-item {
  @apply space-y-1;
}

.stat-label {
  @apply text-sm font-medium text-gray-500;
}

.stat-value {
  @apply text-base font-semibold text-gray-900;
}

.entries-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.entry-preview-card {
  @apply transition-all duration-200;
}

.entry-preview-card:hover {
  @apply shadow-md border-gray-300;
}

.more-entries-card {
  @apply transition-all duration-200;
}

.more-entries-card:hover {
  @apply bg-gray-200 border-gray-300 shadow-md;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lg\\:col-span-2 {
    grid-column: span 2 / span 2;
  }
}

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  @apply w-2;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-content {
    @apply px-2 py-4;
  }

  .scenario-info-card .grid {
    @apply grid-cols-1 gap-4;
  }

  .entries-grid {
    @apply grid-cols-1;
  }
}

/* 卡片样式 */
.scenario-info-card,
.entries-preview {
  @apply border border-gray-200;
}

/* 空状态样式 */
:deep(.el-empty) {
  @apply py-8;
}

/* 标签样式 */
:deep(.el-tag) {
  @apply font-medium;
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  @apply shadow-lg border border-gray-200;
}

:deep(.el-dropdown-menu__item.text-red-600:hover) {
  @apply bg-red-50 text-red-700;
}
</style>