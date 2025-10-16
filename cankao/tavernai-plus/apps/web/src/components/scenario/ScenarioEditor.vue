<template>
  <div class="scenario-editor h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar backdrop-blur-sm border-b p-4 flex-shrink-0 shadow-sm">
      <div class="flex items-center justify-between">
        <!-- 左侧信息 -->
        <div class="flex items-center gap-4">
          <el-button
            @click="$emit('back')"
            :icon="'ArrowLeft'"
            circle
            size="large"
            class="bg-slate-100 hover:bg-slate-200 border-slate-300"
          />

          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              {{ scenario?.name || '加载中...' }}
            </h1>
            <p class="text-sm text-purple-300 font-medium">
              <span class="inline-flex items-center gap-1">
                <el-icon class="text-purple-400"><Document /></el-icon>
                {{ scenario?.worldInfoEntries?.length || 0 }} 个世界信息条目
              </span>
            </p>
          </div>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <!-- 视图模式切换 -->
          <el-radio-group v-model="viewMode" size="default" class="view-mode-group">
            <el-radio-button label="editor" class="view-mode-btn">
              <el-icon class="mr-1"><Edit /></el-icon>
              编辑
            </el-radio-button>
            <el-radio-button label="preview" class="view-mode-btn">
              <el-icon class="mr-1"><View /></el-icon>
              预览
            </el-radio-button>
            <el-radio-button label="split" class="view-mode-btn">
              <el-icon class="mr-1"><Grid /></el-icon>
              分屏
            </el-radio-button>
          </el-radio-group>

          <!-- 操作按钮 -->
          <el-button
            @click="handleSave"
            type="primary"
            :loading="isSaving"
            :icon="'Check'"
            class="bg-gradient-to-r from-purple-600 to-purple-700 border-0 hover:from-purple-700 hover:to-purple-800 shadow-md"
          >
            保存
          </el-button>

          <el-dropdown @command="handleCommand">
            <el-button :icon="'More'" circle class="bg-slate-100 hover:bg-slate-200 border-slate-300" />
            <template #dropdown>
              <el-dropdown-menu class="modern-dropdown">
                <el-dropdown-item command="export" class="dropdown-item">
                  <el-icon><Download /></el-icon>
                  导出剧本
                </el-dropdown-item>
                <el-dropdown-item command="clone" class="dropdown-item">
                  <el-icon><CopyDocument /></el-icon>
                  复制剧本
                </el-dropdown-item>
                <el-dropdown-item command="test" divided class="dropdown-item">
                  <el-icon><Connection /></el-icon>
                  测试匹配
                </el-dropdown-item>
                <el-dropdown-item command="settings" class="dropdown-item">
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
    <div class="editor-content flex-1 flex overflow-hidden p-4 gap-4">
      <!-- 编辑器视图 -->
      <div
        v-show="viewMode === 'editor' || viewMode === 'split'"
        :class="[
          'editor-panel bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 flex flex-col',
          viewMode === 'split' ? 'w-1/2' : 'w-full'
        ]"
      >
        <!-- 剧本基本信息编辑 -->
        <div class="scenario-basic-info border-b border-slate-100/80 p-6 flex-shrink-0 bg-gradient-to-r from-slate-50/50 to-blue-50/30 rounded-t-xl">
          <div class="mb-4">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <el-icon class="text-blue-500"><EditPen /></el-icon>
              剧本基本信息
            </h2>
            <p class="text-sm text-slate-600 mt-1">设置剧本的核心属性和描述</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 剧本名称 -->
            <div class="form-group-modern">
              <label class="form-label-modern">
                <el-icon class="text-blue-500"><Document /></el-icon>
                剧本名称
              </label>
              <el-input
                v-model="scenarioForm.name"
                placeholder="给剧本起一个响亮的名称..."
                size="large"
                class="modern-input"
                @change="markAsChanged"
              />
            </div>

            <!-- 分类 -->
            <div class="form-group-modern">
              <label class="form-label-modern">
                <el-icon class="text-purple-500"><Collection /></el-icon>
                分类
              </label>
              <el-select
                v-model="scenarioForm.category"
                placeholder="选择或创建分类"
                filterable
                allow-create
                size="large"
                class="modern-select w-full"
                @change="markAsChanged"
              >
                <el-option
                  v-for="category in (categories || [])"
                  :key="category"
                  :label="category"
                  :value="category"
                >
                  <span class="flex items-center gap-2">
                    <el-icon><Folder /></el-icon>
                    {{ category }}
                  </span>
                </el-option>
              </el-select>
            </div>

            <!-- 描述 -->
            <div class="form-group-modern lg:col-span-2">
              <label class="form-label-modern">
                <el-icon class="text-green-500"><ChatLineRound /></el-icon>
                剧本描述
              </label>
              <el-input
                v-model="scenarioForm.description"
                type="textarea"
                :rows="3"
                placeholder="描述剧本的背景、设定和主要内容..."
                class="modern-textarea"
                resize="vertical"
                @change="markAsChanged"
              />
            </div>

            <!-- 标签 -->
            <div class="form-group-modern lg:col-span-2">
              <label class="form-label-modern">
                <el-icon class="text-orange-500"><PriceTag /></el-icon>
                标签分类
              </label>
              <div class="w-full">
                <div v-if="scenarioForm.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
                  <el-tag
                    v-for="tag in scenarioForm.tags"
                    :key="tag"
                    closable
                    size="default"
                    @close="removeTag(tag)"
                    class="modern-tag"
                  >
                    <el-icon class="mr-1"><PriceTag /></el-icon>
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="flex gap-2">
                  <el-input
                    v-if="tagInputVisible"
                    ref="tagInputRef"
                    v-model="tagInputValue"
                    placeholder="输入标签名称..."
                    size="large"
                    class="modern-input flex-1"
                    @keyup.enter="handleTagInputConfirm"
                    @blur="handleTagInputConfirm"
                  />
                  <el-button
                    v-else
                    size="large"
                    @click="showTagInput"
                    :icon="'Plus'"
                    class="modern-btn-add"
                  >
                    添加标签
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 世界信息条目列表 -->
        <div class="entries-section flex-1 flex flex-col overflow-hidden p-4">
          <!-- 条目工具栏 -->
          <div class="entries-toolbar bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg p-4 mb-4 flex-shrink-0 border border-slate-200/60">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <el-icon class="text-blue-500 text-lg"><Collection /></el-icon>
                  <span class="text-base font-bold text-slate-800">
                    世界信息条目
                  </span>
                  <el-badge :value="currentScenarioEntries.length" :max="99" class="badge-modern">
                    <span class="text-sm text-slate-600">({{ currentScenarioEntries.length }})</span>
                  </el-badge>
                </div>

                <!-- 批量操作 -->
                <div v-if="selectedEntryIds.length > 0" class="flex items-center gap-3 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <el-icon class="text-amber-600"><Select /></el-icon>
                  <span class="text-sm font-medium text-amber-800">
                    已选择 {{ selectedEntryIds.length }} 项
                  </span>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="handleBatchDelete"
                    class="ml-2"
                  >
                    <el-icon><Delete /></el-icon>
                    批量删除
                  </el-button>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <!-- 排序选择 -->
                <el-select
                  v-model="entriesSortBy"
                  size="default"
                  placeholder="排序方式"
                  @change="sortEntries"
                  class="modern-select w-32"
                >
                  <el-option label="优先级" value="priority">
                    <span class="flex items-center gap-2">
                      <el-icon><Sort /></el-icon>
                      优先级
                    </span>
                  </el-option>
                  <el-option label="创建时间" value="created">
                    <span class="flex items-center gap-2">
                      <el-icon><Clock /></el-icon>
                      创建时间
                    </span>
                  </el-option>
                  <el-option label="标题" value="title">
                    <span class="flex items-center gap-2">
                      <el-icon><SortUp /></el-icon>
                      标题
                    </span>
                  </el-option>
                </el-select>

                <!-- 添加条目按钮 -->
                <el-button
                  type="primary"
                  size="default"
                  @click="handleAddEntry"
                  :icon="'Plus'"
                  class="modern-btn-primary"
                >
                  添加条目
                </el-button>
              </div>
            </div>
          </div>

          <!-- 条目列表 -->
          <div class="entries-list flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div v-if="currentScenarioEntries.length === 0" class="text-center py-12">
              <div class="empty-state-modern">
                <el-icon class="text-6xl text-slate-300 mb-4"><Document /></el-icon>
                <h3 class="text-lg font-medium text-slate-700 mb-2">暂无世界信息条目</h3>
                <p class="text-sm text-slate-500 mb-6">创建你的第一个世界信息条目来开始构建丰富的剧本世界</p>
                <el-button type="primary" size="large" @click="handleAddEntry" class="modern-btn-primary">
                  <el-icon><Plus /></el-icon>
                  添加第一个条目
                </el-button>
              </div>
            </div>

            <div v-else class="space-y-4">
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
          'preview-panel bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 flex flex-col',
          viewMode === 'split' ? 'w-1/2' : 'w-full'
        ]"
      >
        <div class="preview-header bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-t-xl p-4 border-b border-slate-200/60">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <el-icon class="text-green-500"><View /></el-icon>
            剧本预览
          </h2>
          <p class="text-sm text-slate-600 mt-1">查看剧本的最终效果</p>
        </div>

        <ScenarioPreview
          v-if="scenario"
          :scenario="scenario"
          :entries="currentScenarioEntries"
          class="flex-1 p-4"
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
  Plus,
  Document,
  Edit,
  View,
  Grid,
  EditPen,
  Collection,
  Folder,
  ChatLineRound,
  PriceTag,
  Select,
  Sort,
  Clock,
  SortUp,
  Delete
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
  if (!categories.value || categories.value.length === 0) {
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

/* 现代化样式增强 - 使用全局主题变量 */
.scenario-editor {
  background: linear-gradient(135deg, var(--surface-0) 0%, var(--surface-1) 50%, var(--surface-2) 100%);
  color: var(--text-primary);
}

.editor-toolbar {
  background: rgba(37, 37, 68, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-primary);
}

.editor-content {
  padding: 20px;
  gap: 20px;
}

.editor-panel,
.preview-panel {
  background: rgba(37, 37, 68, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.editor-panel:hover,
.preview-panel:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* 现代化表单样式 */
.form-group-modern {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

/* 现代化输入框样式 */
:deep(.modern-input .el-input__wrapper) {
  background: rgba(15, 15, 35, 0.6);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-base);
  transition: all 0.2s ease;
  padding: 12px 16px;
}

:deep(.modern-input .el-input__wrapper:hover) {
  border-color: var(--brand-primary-500);
  box-shadow: var(--shadow-lg);
}

:deep(.modern-input .el-input__wrapper.is-focus) {
  border-color: var(--brand-primary-500);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

:deep(.modern-input .el-input__inner) {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

:deep(.modern-input .el-input__inner::placeholder) {
  color: var(--text-placeholder);
}

/* 现代化选择器样式 */
:deep(.modern-select .el-input__wrapper) {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  padding: 12px 16px;
}

:deep(.modern-select .el-input__wrapper:hover) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.modern-select .el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 现代化文本域样式 */
:deep(.modern-textarea .el-textarea__inner) {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  padding: 12px 16px;
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.5;
}

:deep(.modern-textarea .el-textarea__inner:hover) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.modern-textarea .el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.modern-textarea .el-textarea__inner::placeholder) {
  color: #94a3b8;
}

/* 现代化标签样式 */
.modern-tag {
  background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-primary-600));
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;
}

.modern-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
}

/* 现代化按钮样式 */
.modern-btn-add {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 2px dashed #cbd5e1;
  color: #475569;
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.modern-btn-add:hover {
  background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-primary-600));
  border-color: var(--brand-primary-500);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.modern-btn-primary {
  background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-primary-600));
  border: none;
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.2s ease;
}

.modern-btn-primary:hover {
  background: linear-gradient(135deg, var(--brand-primary-600), var(--brand-primary-700));
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

/* 视图模式切换样式 */
:deep(.view-mode-group) {
  background: #f8fafc;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.view-mode-btn) {
  background: transparent;
  border: none;
  color: #64748b;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.view-mode-btn:hover) {
  background: #e2e8f0;
  color: #475569;
}

:deep(.view-mode-btn.is-active) {
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* 现代化下拉菜单样式 */
:deep(.modern-dropdown) {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 8px;
}

:deep(.dropdown-item) {
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
}

:deep(.dropdown-item:hover) {
  background: #f8fafc;
  color: #1e293b;
  transform: translateX(4px);
}

:deep(.dropdown-item:last-child) {
  margin-bottom: 0;
}

/* 徽章样式 */
:deep(.badge-modern) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
}

/* 空状态样式 */
.empty-state-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
}

/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

/* 动画效果 */
.scenario-editor {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 未保存更改指示器 */
.has-changes::before {
  content: '';
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>