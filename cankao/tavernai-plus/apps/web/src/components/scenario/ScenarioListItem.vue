<template>
  <div
    class="scenario-list-item bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
    :class="{ 'ring-2 ring-blue-500': isSelected }"
    @click="handleClick"
  >
    <div class="flex items-start gap-4">
      <!-- 剧本图标 -->
      <div class="flex-shrink-0">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
          <el-icon class="text-white text-2xl">
            <Document />
          </el-icon>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="flex-1 min-w-0">
        <!-- 顶部信息行 -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-lg text-gray-900 truncate hover:text-blue-600 transition-colors">
              {{ scenario.name }}
            </h3>
            <div class="flex items-center gap-3 mt-1">
              <!-- 创建者 -->
              <div class="flex items-center gap-1 text-sm text-gray-600">
                <el-avatar :size="16" :src="scenario.creator.avatar" class="bg-gray-300">
                  {{ scenario.creator.username.charAt(0).toUpperCase() }}
                </el-avatar>
                <span>{{ scenario.creator.username }}</span>
              </div>

              <!-- 分类 -->
              <el-tag size="small" type="info" effect="plain">
                {{ scenario.category }}
              </el-tag>

              <!-- 状态标签 -->
              <el-tag
                v-if="!scenario.isPublic"
                size="small"
                type="warning"
                effect="plain"
              >
                私有
              </el-tag>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-2">
            <el-button
              size="small"
              type="primary"
              plain
              @click.stop="handleEdit"
            >
              编辑
            </el-button>

            <el-dropdown
              @click.stop
              trigger="click"
              placement="bottom-end"
            >
              <el-button
                size="small"
                :icon="'More'"
                circle
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleClone">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleTogglePublic">
                    <el-icon v-if="scenario.isPublic"><Hide /></el-icon>
                    <el-icon v-else><View /></el-icon>
                    {{ scenario.isPublic ? '设为私有' : '设为公开' }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    @click="handleDelete"
                    class="text-red-600"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 描述 -->
        <p class="text-gray-600 text-sm line-clamp-2 mb-3">
          {{ scenario.description || '暂无描述...' }}
        </p>

        <!-- 标签 -->
        <div v-if="scenario.tags && scenario.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
          <el-tag
            v-for="(tag, index) in scenario.tags.slice(0, 5)"
            :key="index"
            size="small"
            effect="plain"
            class="text-xs"
          >
            {{ tag }}
          </el-tag>
          <el-tag
            v-if="scenario.tags.length > 5"
            size="small"
            effect="plain"
            class="text-xs"
          >
            +{{ scenario.tags.length - 5 }}
          </el-tag>
        </div>

        <!-- 底部统计信息 -->
        <div class="flex items-center justify-between text-sm text-gray-500">
          <!-- 左侧统计 -->
          <div class="flex items-center gap-4">
            <!-- 条目数量 -->
            <div v-if="scenario.entriesCount !== undefined" class="flex items-center gap-1">
              <el-icon><List /></el-icon>
              <span>{{ scenario.entriesCount }} 条目</span>
            </div>

            <!-- 使用次数 -->
            <div v-if="scenario.usageCount !== undefined" class="flex items-center gap-1">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ formatNumber(scenario.usageCount) }} 次使用</span>
            </div>

            <!-- 评分 -->
            <div v-if="scenario.rating !== undefined" class="flex items-center gap-1">
              <el-icon class="text-yellow-400"><StarFilled /></el-icon>
              <span>{{ scenario.rating.toFixed(1) }}</span>
            </div>
          </div>

          <!-- 右侧时间信息 -->
          <div class="flex items-center gap-4 text-xs">
            <span>创建于 {{ formatDate(scenario.createdAt) }}</span>
            <span>更新于 {{ formatDate(scenario.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 展开详情区域 (可选) -->
    <div v-if="showDetails" class="mt-4 pt-4 border-t border-gray-100">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <!-- 语言 -->
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-700">语言:</span>
          <span class="text-gray-600">{{ scenario.language || 'zh-CN' }}</span>
        </div>

        <!-- 详细时间 -->
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-700">最后更新:</span>
          <span class="text-gray-600">{{ formatDetailedDate(scenario.updatedAt) }}</span>
        </div>
      </div>

      <!-- 内容预览 -->
      <div v-if="scenario.content" class="mt-3">
        <div class="font-medium text-gray-700 mb-1">内容预览:</div>
        <div class="text-gray-600 text-sm bg-gray-50 rounded p-2 line-clamp-3">
          {{ scenario.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Document,
  More,
  CopyDocument,
  View,
  Hide,
  Delete,
  List,
  ChatDotRound,
  StarFilled
} from '@element-plus/icons-vue'
import type { Scenario } from '@/types/scenario'

interface Props {
  scenario: Scenario
  isSelected?: boolean
  showDetails?: boolean
}

interface Emits {
  (e: 'click', scenario: Scenario): void
  (e: 'edit', scenario: Scenario): void
  (e: 'delete', scenario: Scenario): void
  (e: 'clone', scenario: Scenario): void
  (e: 'toggle-public', scenario: Scenario): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化相对日期
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

// 格式化详细日期
const formatDetailedDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  } catch {
    return '未知'
  }
}

// 事件处理
const handleClick = () => {
  emit('click', props.scenario)
}

const handleEdit = () => {
  emit('edit', props.scenario)
}

const handleDelete = () => {
  emit('delete', props.scenario)
}

const handleClone = () => {
  emit('clone', props.scenario)
}

const handleTogglePublic = () => {
  emit('toggle-public', props.scenario)
}
</script>

<style scoped>
.scenario-list-item {
  transition: all 0.2s ease;
}

.scenario-list-item:hover {
  transform: translateY(-1px);
  border-color: #d1d5db;
}

.scenario-list-item:active {
  transform: translateY(0);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 选中状态样式 */
.scenario-list-item.ring-2 {
  box-shadow: 0 0 0 2px #3b82f6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .scenario-list-item .flex.items-start.justify-between {
    flex-direction: column;
    gap: 12px;
  }

  .scenario-list-item .flex.items-center.gap-4:last-child {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .scenario-list-item .text-xs {
    font-size: 11px;
  }

  .scenario-list-item .w-16.h-16 {
    width: 48px;
    height: 48px;
  }
}

/* 标签样式优化 */
:deep(.el-tag--small) {
  height: 20px;
  line-height: 18px;
  padding: 0 5px;
  font-size: 11px;
  margin-right: 4px;
  margin-bottom: 2px;
}

/* Dropdown样式 */
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

/* 头像样式 */
:deep(.el-avatar) {
  font-size: 10px;
  font-weight: 500;
}

/* 按钮样式 */
:deep(.el-button--small) {
  padding: 4px 8px;
  font-size: 12px;
}

/* 图标样式 */
.el-icon {
  vertical-align: middle;
}

/* 无障碍优化 */
.scenario-list-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.scenario-list-item:focus:not(:focus-visible) {
  outline: none;
}

/* 悬停效果优化 */
.scenario-list-item:hover h3 {
  color: #2563eb;
}

/* 响应式网格优化 */
@media (max-width: 640px) {
  .grid.grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* 加载状态样式 */
.scenario-list-item.loading {
  opacity: 0.6;
  pointer-events: none;
}

.scenario-list-item.loading * {
  animation: pulse 1.5s ease-in-out infinite;
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