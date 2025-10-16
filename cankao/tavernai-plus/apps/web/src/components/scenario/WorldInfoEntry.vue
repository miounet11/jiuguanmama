<template>
  <div
    class="world-info-entry bg-white/95 backdrop-blur-sm rounded-xl border shadow-lg transition-all duration-300"
    :class="{
      'border-blue-500 shadow-blue-200 ring-2 ring-blue-500/20': isSelected,
      'border-slate-200/60 hover:border-blue-300/60': !isSelected,
      'opacity-60': !entry.isActive
    }"
  >
    <!-- 条目头部 -->
    <div class="entry-header flex items-center justify-between p-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-blue-50/30 rounded-t-xl">
      <div class="flex items-center gap-4">
        <!-- 选择框 -->
        <el-checkbox
          :model-value="isSelected"
          @change="$emit('toggle-select', entry.id)"
          class="modern-checkbox"
        />

        <!-- 活跃状态指示器 -->
        <div
          class="w-4 h-4 rounded-full shadow-sm transition-all duration-200"
          :class="entry.isActive ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'"
          :title="entry.isActive ? '活跃' : '禁用'"
        >
          <div v-if="entry.isActive" class="w-full h-full rounded-full animate-pulse bg-green-400/50"></div>
        </div>

        <!-- 标题 -->
        <div class="flex-1 min-w-0">
          <h3
            v-if="!isEditingTitle"
            class="font-bold text-slate-800 text-lg truncate cursor-pointer hover:text-blue-600 transition-colors duration-200"
            @click="startEditingTitle"
          >
            {{ entry.title }}
          </h3>
          <el-input
            v-else
            v-model="editForm.title"
            size="large"
            @blur="finishEditingTitle"
            @keyup.enter="finishEditingTitle"
            @keyup.esc="cancelEditingTitle"
            ref="titleInputRef"
            class="modern-title-input max-w-md"
          />
        </div>

        <!-- 优先级标签 -->
        <el-tag
          :type="getPriorityType(entry.priority)"
          size="default"
          effect="light"
          class="modern-priority-tag font-medium"
        >
          <el-icon class="mr-1"><Flag /></el-icon>
          优先级 {{ entry.priority }}
        </el-tag>

        <!-- 分类标签 -->
        <el-tag
          size="default"
          effect="light"
          class="modern-category-tag font-medium"
        >
          <el-icon class="mr-1"><Folder /></el-icon>
          {{ entry.category }}
        </el-tag>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-3">
        <!-- 展开/收起按钮 -->
        <el-button
          @click="toggleExpanded"
          :icon="isExpanded ? 'ArrowUp' : 'ArrowDown'"
          size="default"
          circle
          class="modern-action-btn bg-slate-100 hover:bg-slate-200 border-slate-300"
        />

        <!-- 更多操作 -->
        <el-dropdown @command="handleCommand">
          <el-button
            :icon="'More'"
            size="default"
            circle
            class="modern-action-btn bg-slate-100 hover:bg-slate-200 border-slate-300"
          />
          <template #dropdown>
            <el-dropdown-menu class="modern-dropdown">
              <el-dropdown-item command="edit" class="modern-dropdown-item">
                <el-icon><Edit /></el-icon>
                编辑条目
              </el-dropdown-item>
              <el-dropdown-item command="duplicate" class="modern-dropdown-item">
                <el-icon><CopyDocument /></el-icon>
                复制条目
              </el-dropdown-item>
              <el-dropdown-item command="toggle-active" class="modern-dropdown-item">
                <el-icon v-if="entry.isActive"><Hide /></el-icon>
                <el-icon v-else><View /></el-icon>
                {{ entry.isActive ? '禁用条目' : '启用条目' }}
              </el-dropdown-item>
              <el-dropdown-item
                command="delete"
                divided
                class="modern-dropdown-item text-red-600"
              >
                <el-icon><Delete /></el-icon>
                删除条目
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 条目内容 -->
    <div v-show="isExpanded" class="entry-content">
      <!-- 关键词部分 -->
      <div class="keywords-section p-5 border-b border-slate-100/60 bg-gradient-to-r from-blue-50/20 to-transparent">
        <div class="flex items-start gap-6">
          <div class="flex-1">
            <label class="block text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <el-icon class="text-blue-500"><Key /></el-icon>
              关键词管理
            </label>
            <KeywordManager
              v-model="editForm.keywords"
              :match-type="editForm.matchType"
              :case-sensitive="editForm.caseSensitive"
              @update:matchType="editForm.matchType = $event"
              @update:caseSensitive="editForm.caseSensitive = $event"
              @change="handleFormChange"
            />
          </div>

          <!-- 快速设置 -->
          <div class="w-56 space-y-4 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200/60">
            <div class="text-sm font-bold text-slate-700 mb-3">快速设置</div>

            <!-- 优先级 -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <el-icon class="text-orange-500"><Flag /></el-icon>
                优先级
              </label>
              <el-input-number
                v-model="editForm.priority"
                :min="0"
                :max="999"
                size="default"
                @change="handleFormChange"
                class="w-full modern-input-number"
              />
            </div>

            <!-- 插入深度 -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <el-icon class="text-purple-500"><Sort /></el-icon>
                插入深度
              </label>
              <el-input-number
                v-model="editForm.insertDepth"
                :min="0"
                :max="10"
                size="default"
                @change="handleFormChange"
                class="w-full modern-input-number"
              />
            </div>

            <!-- 触发概率 -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <el-icon class="text-green-500"><TrendCharts /></el-icon>
                触发概率
              </label>
              <el-slider
                v-model="editForm.probability"
                :min="0"
                :max="1"
                :step="0.1"
                :format-tooltip="(val) => `${(val * 100).toFixed(0)}%`"
                @change="handleFormChange"
                class="modern-slider"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 内容编辑 -->
      <div class="content-section p-5 bg-white/40 backdrop-blur-sm">
        <label class="block text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <el-icon class="text-green-500"><Document /></el-icon>
          世界信息内容
        </label>
        <el-input
          v-model="editForm.content"
          type="textarea"
          :rows="6"
          placeholder="输入详细的世界信息内容..."
          @change="handleFormChange"
          resize="vertical"
          class="modern-content-textarea"
        />
      </div>

      <!-- 高级选项 -->
      <el-collapse class="advanced-options">
        <el-collapse-item title="高级选项" name="advanced">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <!-- 分类和分组 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <el-select
                v-model="editForm.category"
                placeholder="选择分类"
                filterable
                allow-create
                @change="handleFormChange"
                class="w-full"
              >
                <el-option
                  v-for="category in categories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                分组 (可选)
              </label>
              <el-input
                v-model="editForm.group"
                placeholder="输入分组名称"
                @change="handleFormChange"
              />
            </div>

            <!-- 插入位置 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                插入位置
              </label>
              <el-select
                v-model="editForm.position"
                @change="handleFormChange"
                class="w-full"
              >
                <el-option label="在前面插入" value="before" />
                <el-option label="在后面插入" value="after" />
                <el-option label="替换内容" value="replace" />
              </el-select>
            </div>

            <!-- 行为选项 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                行为选项
              </label>
              <div class="space-y-1">
                <el-checkbox
                  v-model="editForm.isActive"
                  @change="handleFormChange"
                >
                  启用此条目
                </el-checkbox>
                <el-checkbox
                  v-model="editForm.triggerOnce"
                  @change="handleFormChange"
                >
                  只触发一次
                </el-checkbox>
                <el-checkbox
                  v-model="editForm.excludeRecursion"
                  @change="handleFormChange"
                >
                  排除递归
                </el-checkbox>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 底部操作栏 -->
      <div class="entry-footer flex items-center justify-between p-5 bg-gradient-to-r from-slate-50/50 to-blue-50/30 border-t border-slate-200/60 rounded-b-xl">
        <div class="flex items-center gap-6 text-sm text-slate-600">
          <!-- 统计信息 -->
          <div class="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200/60">
            <el-icon class="text-blue-500"><Key /></el-icon>
            <span class="font-medium">{{ editForm.keywords.length }} 个关键词</span>
          </div>
          <div class="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200/60">
            <el-icon class="text-green-500"><Document /></el-icon>
            <span class="font-medium">{{ editForm.content.length }} 字符</span>
          </div>
          <div class="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200/60">
            <el-icon class="text-purple-500"><Clock /></el-icon>
            <span class="font-medium">创建于 {{ formatDate(entry.createdAt) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- 测试按钮 -->
          <el-button
            size="default"
            @click="handleTest"
            :icon="'Connection'"
            class="modern-btn-test"
          >
            测试匹配
          </el-button>

          <!-- 保存按钮 -->
          <el-button
            v-if="hasChanges"
            type="primary"
            size="default"
            @click="handleSave"
            :loading="isSaving"
            class="modern-btn-save"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            保存更改
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ArrowUp,
  ArrowDown,
  Edit,
  Delete,
  CopyDocument,
  View,
  Hide,
  More,
  Connection,
  Flag,
  Folder,
  Key,
  Sort,
  TrendCharts,
  Check,
  Clock
} from '@element-plus/icons-vue'
import { useScenarioStore } from '@/stores/scenario'
import KeywordManager from './KeywordManager.vue'
import type {
  WorldInfoEntry as WorldInfoEntryType,
  UpdateWorldInfoEntryRequest
} from '@/types/scenario'

interface Props {
  entry: WorldInfoEntryType
  scenarioId: string
  isSelected?: boolean
  categories?: string[]
}

interface Emits {
  (e: 'update', entry: WorldInfoEntryType): void
  (e: 'delete', entryId: string): void
  (e: 'duplicate', entry: WorldInfoEntryType): void
  (e: 'toggle-select', entryId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => ['通用', '角色', '地点', '物品', '事件', '设定']
})

const emit = defineEmits<Emits>()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const isExpanded = ref(false)
const isEditingTitle = ref(false)
const titleInputRef = ref()
const isSaving = ref(false)
const hasChanges = ref(false)

// 编辑表单
const editForm = reactive<UpdateWorldInfoEntryRequest>({
  title: props.entry.title,
  content: props.entry.content,
  keywords: [...props.entry.keywords],
  priority: props.entry.priority,
  insertDepth: props.entry.insertDepth,
  probability: props.entry.probability,
  matchType: props.entry.matchType,
  caseSensitive: props.entry.caseSensitive,
  isActive: props.entry.isActive,
  triggerOnce: props.entry.triggerOnce,
  excludeRecursion: props.entry.excludeRecursion,
  category: props.entry.category,
  group: props.entry.group,
  position: props.entry.position
})

// 原始数据备份
const originalForm = { ...editForm }

// 计算属性
const getPriorityType = (priority: number) => {
  if (priority >= 100) return 'danger'
  if (priority >= 50) return 'warning'
  if (priority >= 10) return 'primary'
  return 'info'
}

// 方法
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    })
  } catch {
    return '未知'
  }
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const startEditingTitle = () => {
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

const finishEditingTitle = () => {
  isEditingTitle.value = false
  handleFormChange()
}

const cancelEditingTitle = () => {
  editForm.title = props.entry.title
  isEditingTitle.value = false
}

const handleFormChange = () => {
  // 检查是否有变化
  hasChanges.value = Object.keys(editForm).some(key => {
    const formValue = editForm[key as keyof typeof editForm]
    const originalValue = originalForm[key as keyof typeof originalForm]

    if (Array.isArray(formValue) && Array.isArray(originalValue)) {
      return JSON.stringify(formValue) !== JSON.stringify(originalValue)
    }

    return formValue !== originalValue
  })
}

const handleSave = async () => {
  if (!hasChanges.value) return

  isSaving.value = true

  try {
    const updatedEntry = await scenarioStore.updateWorldInfoEntry(
      props.scenarioId,
      props.entry.id,
      editForm
    )

    // 更新原始数据
    Object.assign(originalForm, editForm)
    hasChanges.value = false

    emit('update', updatedEntry)
    ElMessage.success('条目更新成功')
  } catch (error) {
    console.error('更新条目失败:', error)
  } finally {
    isSaving.value = false
  }
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'edit':
      isExpanded.value = true
      break

    case 'duplicate':
      emit('duplicate', props.entry)
      break

    case 'toggle-active':
      editForm.isActive = !editForm.isActive
      handleFormChange()
      await handleSave()
      break

    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除条目 "${props.entry.title}" 吗？`,
          '确认删除',
          {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消'
          }
        )

        emit('delete', props.entry.id)
      } catch (error) {
        // 用户取消
      }
      break
  }
}

const handleTest = () => {
  // 触发测试匹配
  if (editForm.keywords.length === 0) {
    ElMessage.warning('请先添加关键词')
    return
  }

  // 这里可以集成到测试对话框中
  ElMessage.info('测试功能开发中...')
}

// 监听属性变化
watch(() => props.entry, (newEntry) => {
  // 更新表单数据
  Object.assign(editForm, {
    title: newEntry.title,
    content: newEntry.content,
    keywords: [...newEntry.keywords],
    priority: newEntry.priority,
    insertDepth: newEntry.insertDepth,
    probability: newEntry.probability,
    matchType: newEntry.matchType,
    caseSensitive: newEntry.caseSensitive,
    isActive: newEntry.isActive,
    triggerOnce: newEntry.triggerOnce,
    excludeRecursion: newEntry.excludeRecursion,
    category: newEntry.category,
    group: newEntry.group,
    position: newEntry.position
  })

  // 更新原始数据
  Object.assign(originalForm, editForm)
  hasChanges.value = false
}, { deep: true })

// 自动保存逻辑
let saveTimeout: NodeJS.Timeout | null = null

watch(() => hasChanges.value, (newValue) => {
  if (newValue && editForm.title && editForm.content) {
    // 延迟自动保存
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      handleSave()
    }, 2000) // 2秒后自动保存
  }
})

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})
</script>

<style scoped>
.world-info-entry {
  transition: all 0.2s ease;
}

.world-info-entry:hover {
  shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.entry-header {
  background: linear-gradient(to right, #f8fafc, #f1f5f9);
}

.keywords-section {
  background: #fafbfc;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 折叠面板样式 */
:deep(.el-collapse) {
  border: none;
  background: transparent;
}

:deep(.el-collapse-item__header) {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  background: white;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 0;
}

/* 滑块样式 */
:deep(.el-slider) {
  margin: 8px 0;
}

:deep(.el-slider__runway) {
  height: 4px;
  background-color: #e5e7eb;
}

:deep(.el-slider__bar) {
  background-color: #3b82f6;
}

:deep(.el-slider__button) {
  width: 16px;
  height: 16px;
  border: 2px solid #3b82f6;
  background-color: white;
}

/* 数字输入框样式 */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* 复选框样式 */
:deep(.el-checkbox) {
  margin-right: 0;
  margin-bottom: 4px;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
  color: #374151;
}

/* 标签样式 */
:deep(.el-tag) {
  font-size: 11px;
  height: 20px;
  line-height: 18px;
  padding: 0 6px;
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
  font-size: 14px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #f8fafc;
}

:deep(.el-dropdown-menu__item.text-red-600:hover) {
  background-color: #fef2f2;
  color: #dc2626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .keywords-section .flex {
    flex-direction: column;
    gap: 16px;
  }

  .keywords-section .w-48 {
    width: 100%;
  }
}

/* 动画效果 */
.entry-content {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

/* 加载状态 */
.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

/* 未保存更改指示器 */
.has-changes::before {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background-color: #f59e0b;
  border-radius: 50%;
}

/* 禁用状态样式 */
.world-info-entry.opacity-50 .entry-header {
  background: linear-gradient(to right, #f3f4f6, #e5e7eb);
}

.world-info-entry.opacity-50 h3 {
  color: #6b7280;
}

/* WorldInfoEntry 现代化样式增强 */
.world-info-entry {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.world-info-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: rgba(59, 130, 246, 0.3);
}

/* 现代化复选框样式 */
:deep(.modern-checkbox .el-checkbox__input.is-checked .el-checkbox__inner) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #3b82f6;
}

/* 现代化标题输入框样式 */
:deep(.modern-title-input .el-input__wrapper) {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

:deep(.modern-title-input .el-input__wrapper:hover) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.modern-title-input .el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 现代化标签样式 */
:deep(.modern-priority-tag) {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  color: white;
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
}

:deep(.modern-category-tag) {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  color: white;
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
}

/* 现代化操作按钮样式 */
.modern-action-btn {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.modern-action-btn:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 现代化下拉菜单样式 */
:deep(.modern-dropdown) {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 8px;
}

:deep(.modern-dropdown-item) {
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
}

:deep(.modern-dropdown-item:hover) {
  background: #f8fafc;
  color: #1e293b;
  transform: translateX(4px);
}

:deep(.modern-dropdown-item:last-child) {
  margin-bottom: 0;
}

:deep(.modern-dropdown-item.text-red-600:hover) {
  background: #fef2f2;
  color: #dc2626;
}

/* 现代化输入数字框样式 */
:deep(.modern-input-number .el-input__wrapper) {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

:deep(.modern-input-number .el-input__wrapper:hover) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.modern-input-number .el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 现代化滑块样式 */
:deep(.modern-slider) {
  margin: 8px 0;
}

:deep(.modern-slider .el-slider__runway) {
  height: 6px;
  background: linear-gradient(90deg, #e2e8f0, #cbd5e1);
  border-radius: 3px;
}

:deep(.modern-slider .el-slider__bar) {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 3px;
}

:deep(.modern-slider .el-slider__button) {
  width: 18px;
  height: 18px;
  border: 3px solid #3b82f6;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 现代化文本域样式 */
:deep(.modern-content-textarea .el-textarea__inner) {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  padding: 16px;
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.6;
}

:deep(.modern-content-textarea .el-textarea__inner:hover) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.modern-content-textarea .el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.modern-content-textarea .el-textarea__inner::placeholder) {
  color: #94a3b8;
}

/* 现代化按钮样式 */
.modern-btn-test {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  color: #475569;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.modern-btn-test:hover {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #10b981;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.modern-btn-save {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  color: white;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.modern-btn-save:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* 折叠面板样式 */
:deep(.advanced-options) {
  border: none;
  background: transparent;
  margin-top: 8px;
}

:deep(.advanced-options .el-collapse-item__header) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s ease;
}

:deep(.advanced-options .el-collapse-item__header:hover) {
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  border-color: #a5b4fc;
}

:deep(.advanced-options .el-collapse-item__content) {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 16px;
}

/* 动画效果 */
.world-info-entry {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>