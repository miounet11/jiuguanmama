<template>
  <div class="scenario-editor h-full flex flex-col bg-gray-50">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar bg-white border-b border-gray-200 p-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <!-- 左侧信息 -->
        <div class="flex items-center gap-4">
          <el-button
            @click="$emit('back')"
            :icon="'ArrowLeft'"
            circle
            size="large"
          />

          <div>
            <h1 class="text-xl font-semibold text-gray-900">
              {{ scenario?.name || '加载中...' }}
            </h1>
            <p class="text-sm text-gray-500">
              {{ scenario?.worldInfoEntries?.length || 0 }} 个世界信息条目
            </p>
          </div>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <!-- 视图模式切换 -->
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button label="editor">编辑</el-radio-button>
            <el-radio-button label="preview">预览</el-radio-button>
            <el-radio-button label="split">分屏</el-radio-button>
          </el-radio-group>

          <!-- 操作按钮 -->
          <el-button
            @click="handleSave"
            type="primary"
            :loading="isSaving"
            :icon="'Check'"
          >
            保存
          </el-button>

          <el-dropdown @command="handleCommand">
            <el-button :icon="'More'" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="export">
                  <el-icon><Download /></el-icon>
                  导出剧本
                </el-dropdown-item>
                <el-dropdown-item command="clone">
                  <el-icon><CopyDocument /></el-icon>
                  复制剧本
                </el-dropdown-item>
                <el-dropdown-item command="test" divided>
                  <el-icon><Connection /></el-icon>
                  测试匹配
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  剧本设置
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="editor-content flex-1 flex overflow-hidden">
      <!-- 编辑器视图 -->
      <div
        v-show="viewMode === 'editor' || viewMode === 'split'"
        :class="[
          'editor-panel bg-white border-r border-gray-200 flex flex-col',
          viewMode === 'split' ? 'w-1/2' : 'w-full'
        ]"
      >
        <!-- 剧本基本信息编辑 -->
        <div class="scenario-basic-info border-b border-gray-100 p-4 flex-shrink-0">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- 剧本名称 -->
            <el-form-item label="剧本名称" size="small">
              <el-input
                v-model="scenarioForm.name"
                placeholder="输入剧本名称"
                @change="markAsChanged"
              />
            </el-form-item>

            <!-- 分类 -->
            <el-form-item label="分类" size="small">
              <el-select
                v-model="scenarioForm.category"
                placeholder="选择分类"
                filterable
                allow-create
                @change="markAsChanged"
              >
                <el-option
                  v-for="category in categories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
            </el-form-item>

            <!-- 描述 -->
            <el-form-item label="描述" class="lg:col-span-2" size="small">
              <el-input
                v-model="scenarioForm.description"
                type="textarea"
                :rows="2"
                placeholder="输入剧本描述"
                @change="markAsChanged"
              />
            </el-form-item>

            <!-- 标签 -->
            <el-form-item label="标签" class="lg:col-span-2" size="small">
              <div class="w-full">
                <div v-if="scenarioForm.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
                  <el-tag
                    v-for="tag in scenarioForm.tags"
                    :key="tag"
                    closable
                    size="small"
                    @close="removeTag(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <el-input
                  v-if="tagInputVisible"
                  ref="tagInputRef"
                  v-model="tagInputValue"
                  size="small"
                  class="w-20"
                  @keyup.enter="handleTagInputConfirm"
                  @blur="handleTagInputConfirm"
                />
                <el-button
                  v-else
                  size="small"
                  @click="showTagInput"
                  :icon="'Plus'"
                  class="border-dashed"
                >
                  添加标签
                </el-button>
              </div>
            </el-form-item>
          </div>
        </div>

        <!-- 世界信息条目列表 -->
        <div class="entries-section flex-1 flex flex-col overflow-hidden">
          <!-- 条目工具栏 -->
          <div class="entries-toolbar border-b border-gray-100 p-3 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-700">
                  世界信息条目 ({{ currentScenarioEntries.length }})
                </span>

                <!-- 批量操作 -->
                <div v-if="selectedEntryIds.length > 0" class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">
                    已选择 {{ selectedEntryIds.length }} 项
                  </span>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="handleBatchDelete"
                  >
                    批量删除
                  </el-button>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <!-- 排序选择 -->
                <el-select
                  v-model="entriesSortBy"
                  size="small"
                  placeholder="排序"
                  @change="sortEntries"
                  class="w-24"
                >
                  <el-option label="优先级" value="priority" />
                  <el-option label="创建时间" value="created" />
                  <el-option label="标题" value="title" />
                </el-select>

                <!-- 添加条目按钮 -->
                <el-button
                  type="primary"
                  size="small"
                  @click="handleAddEntry"
                  :icon="'Plus'"
                >
                  添加条目
                </el-button>
              </div>
            </div>
          </div>

          <!-- 条目列表 -->
          <div class="entries-list flex-1 overflow-y-auto p-3">
            <div v-if="currentScenarioEntries.length === 0" class="text-center py-8">
              <el-empty
                description="暂无世界信息条目"
                :image-size="60"
              >
                <el-button type="primary" @click="handleAddEntry">
                  添加第一个条目
                </el-button>
              </el-empty>
            </div>

            <div v-else class="space-y-3">
              <WorldInfoEntry
                v-for="entry in sortedEntries"
                :key="entry.id"
                :entry="entry"
                :scenario-id="scenario?.id || ''"
                :is-selected="selectedEntryIds.includes(entry.id)"
                @update="handleEntryUpdate"
                @delete="handleEntryDelete"
                @toggle-select="toggleEntrySelection"
                @duplicate="handleEntryDuplicate"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 预览视图 -->
      <div
        v-show="viewMode === 'preview' || viewMode === 'split'"
        :class="[
          'preview-panel bg-gray-50 flex flex-col',
          viewMode === 'split' ? 'w-1/2' : 'w-full'
        ]"
      >
        <ScenarioPreview
          v-if="scenario"
          :scenario="scenario"
          :entries="currentScenarioEntries"
          class="flex-1"
        />
      </div>
    </div>

    <!-- 设置对话框 -->
    <ScenarioSettingsDialog
      v-model="showSettingsDialog"
      :scenario="scenario"
      @updated="handleScenarioUpdate"
    />

    <!-- 测试对话框 -->
    <ScenarioTestDialog
      v-model="showTestDialog"
      :scenario="scenario"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Check,
  More,
  Download,
  CopyDocument,
  Connection,
  Setting,
  Plus
} from '@element-plus/icons-vue'
import { useScenarioStore } from '@/stores/scenario'
import WorldInfoEntry from './WorldInfoEntry.vue'
import ScenarioPreview from './ScenarioPreview.vue'
import ScenarioSettingsDialog from './ScenarioSettingsDialog.vue'
import ScenarioTestDialog from './ScenarioTestDialog.vue'
import type { Scenario, WorldInfoEntry as WorldInfoEntryType, UpdateScenarioRequest } from '@/types/scenario'

interface Emits {
  (e: 'back'): void
  (e: 'saved', scenario: Scenario): void
}

const emit = defineEmits<Emits>()

// 路由和store
const route = useRoute()
const router = useRouter()
const scenarioStore = useScenarioStore()

// 响应式数据
const viewMode = ref<'editor' | 'preview' | 'split'>('editor')
const isSaving = ref(false)
const hasChanges = ref(false)
const showSettingsDialog = ref(false)
const showTestDialog = ref(false)
const entriesSortBy = ref<'priority' | 'created' | 'title'>('priority')

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// 剧本表单数据
const scenarioForm = reactive({
  name: '',
  description: '',
  category: '',
  tags: [] as string[]
})

// 计算属性
const {
  currentScenario: scenario,
  currentScenarioEntries,
  selectedEntryIds,
  categories,
  isLoading
} = scenarioStore

const sortedEntries = computed(() => {
  const entries = [...currentScenarioEntries.value]

  switch (entriesSortBy.value) {
    case 'priority':
      return entries.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    case 'created':
      return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'title':
      return entries.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return entries
  }
})

// 方法
const loadScenario = async () => {
  const scenarioId = route.params.id as string
  if (scenarioId) {
    const loadedScenario = await scenarioStore.fetchScenario(scenarioId)
    if (loadedScenario) {
      // 初始化表单数据
      scenarioForm.name = loadedScenario.name
      scenarioForm.description = loadedScenario.description || ''
      scenarioForm.category = loadedScenario.category
      scenarioForm.tags = [...(loadedScenario.tags || [])]
    }
  }
}

const markAsChanged = () => {
  hasChanges.value = true
}

const handleSave = async () => {
  if (!scenario.value || !hasChanges.value) return

  isSaving.value = true

  try {
    const updateData: UpdateScenarioRequest = {
      name: scenarioForm.name,
      description: scenarioForm.description,
      category: scenarioForm.category,
      tags: scenarioForm.tags
    }

    const updatedScenario = await scenarioStore.updateScenario(scenario.value.id, updateData)

    hasChanges.value = false
    emit('saved', updatedScenario)
    ElMessage.success('剧本保存成功')
  } catch (error) {
    console.error('保存剧本失败:', error)
  } finally {
    isSaving.value = false
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'export':
      handleExport()
      break
    case 'clone':
      handleClone()
      break
    case 'test':
      showTestDialog.value = true
      break
    case 'settings':
      showSettingsDialog.value = true
      break
  }
}

const handleExport = async () => {
  if (!scenario.value) return

  try {
    const blob = await scenarioStore.exportScenario(scenario.value.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${scenario.value.name}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('剧本导出成功')
  } catch (error) {
    console.error('导出剧本失败:', error)
    ElMessage.error('导出剧本失败')
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

    // 创建副本
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

const handleAddEntry = () => {
  // 创建新条目的默认数据
  const newEntry = {
    title: '新建条目',
    content: '',
    keywords: ['关键词'],
    priority: 0,
    insertDepth: 4,
    probability: 1.0,
    matchType: 'contains' as const,
    caseSensitive: false,
    isActive: true,
    triggerOnce: false,
    excludeRecursion: true,
    category: '通用',
    position: 'before' as const
  }

  if (scenario.value) {
    scenarioStore.createWorldInfoEntry(scenario.value.id, newEntry)
  }
}

const handleEntryUpdate = (entry: WorldInfoEntryType) => {
  markAsChanged()
}

const handleEntryDelete = async (entryId: string) => {
  if (!scenario.value) return

  try {
    await ElMessageBox.confirm(
      '确定要删除这个世界信息条目吗？',
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    await scenarioStore.deleteWorldInfoEntry(scenario.value.id, entryId)
    markAsChanged()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除条目失败:', error)
    }
  }
}

const handleEntryDuplicate = async (entry: WorldInfoEntryType) => {
  if (!scenario.value) return

  const duplicatedEntry = {
    title: `${entry.title} (副本)`,
    content: entry.content,
    keywords: [...entry.keywords],
    priority: entry.priority,
    insertDepth: entry.insertDepth,
    probability: entry.probability,
    matchType: entry.matchType,
    caseSensitive: entry.caseSensitive,
    isActive: entry.isActive,
    triggerOnce: entry.triggerOnce,
    excludeRecursion: entry.excludeRecursion,
    category: entry.category,
    group: entry.group,
    position: entry.position
  }

  try {
    await scenarioStore.createWorldInfoEntry(scenario.value.id, duplicatedEntry)
    ElMessage.success('条目复制成功')
  } catch (error) {
    console.error('复制条目失败:', error)
  }
}

const toggleEntrySelection = (entryId: string) => {
  scenarioStore.toggleEntrySelection(entryId)
}

const handleBatchDelete = async () => {
  if (!scenario.value || selectedEntryIds.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedEntryIds.value.length} 个条目吗？`,
      '批量删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    for (const entryId of selectedEntryIds.value) {
      await scenarioStore.deleteWorldInfoEntry(scenario.value.id, entryId)
    }

    scenarioStore.clearSelection()
    markAsChanged()
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const sortEntries = () => {
  // 排序逻辑已在 computed 中处理
}

const handleScenarioUpdate = (updatedScenario: Scenario) => {
  // 更新表单数据
  scenarioForm.name = updatedScenario.name
  scenarioForm.description = updatedScenario.description || ''
  scenarioForm.category = updatedScenario.category
  scenarioForm.tags = [...(updatedScenario.tags || [])]
}

// 标签管理
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const handleTagInputConfirm = () => {
  const value = tagInputValue.value.trim()
  if (value && !scenarioForm.tags.includes(value)) {
    scenarioForm.tags.push(value)
    markAsChanged()
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = scenarioForm.tags.indexOf(tag)
  if (index > -1) {
    scenarioForm.tags.splice(index, 1)
    markAsChanged()
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadScenario()

  // 加载分类数据
  if (categories.value.length === 0) {
    scenarioStore.fetchCategories()
  }
})

// 监听表单变化
watch(scenarioForm, () => {
  markAsChanged()
}, { deep: true })

// 页面离开前确认
window.addEventListener('beforeunload', (e) => {
  if (hasChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
})
</script>

<style scoped>
.scenario-editor {
  min-height: 100vh;
}

.editor-toolbar {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.editor-content {
  min-height: 0; /* 允许子元素压缩 */
}

.editor-panel,
.preview-panel {
  min-height: 0; /* 允许子元素压缩 */
}

.scenario-basic-info :deep(.el-form-item) {
  margin-bottom: 12px;
}

.scenario-basic-info :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.entries-toolbar {
  background: #f8fafc;
}

.entries-list {
  background: #f9fafb;
}

/* 标签输入样式 */
.border-dashed {
  border-style: dashed;
  border-color: #d1d5db;
}

.border-dashed:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lg\\:col-span-2 {
    grid-column: span 2 / span 2;
  }
}

/* 滚动条样式 */
.entries-list::-webkit-scrollbar {
  width: 6px;
}

.entries-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.entries-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.entries-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .editor-content .w-1\/2 {
    width: 100%;
  }

  .preview-panel {
    display: none;
  }

  .viewMode === 'preview' .editor-panel {
    display: none;
  }

  .viewMode === 'preview' .preview-panel {
    display: flex;
  }
}

/* 动画效果 */
.editor-panel,
.preview-panel {
  transition: width 0.3s ease;
}

/* 选中状态样式 */
:deep(.world-info-entry.selected) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 20px;
}

:deep(.el-empty__image) {
  margin-bottom: 12px;
}

:deep(.el-empty__description) {
  margin-bottom: 16px;
  color: #6b7280;
}
</style>