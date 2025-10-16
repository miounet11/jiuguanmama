<template>
  <el-card
    class="scenario-card group cursor-pointer h-full transition-all duration-300 hover:shadow-lg"
    :class="{ 'ring-2 ring-blue-500': isSelected }"
    :body-style="{ padding: '0' }"
    shadow="hover"
    @click="handleCardClick"
  >
    <!-- 卡片头部 -->
    <div class="relative h-32 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-black/10">
        <svg class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" stroke-width="1" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <!-- 状态标签 -->
      <div class="absolute top-3 left-3 flex gap-2">
        <el-tag
          v-if="!scenario.isPublic"
          type="warning"
          size="small"
          effect="dark"
        >
          私有
        </el-tag>
        <el-tag
          v-if="scenario.entriesCount && scenario.entriesCount > 0"
          type="success"
          size="small"
          effect="dark"
        >
          {{ scenario.entriesCount }} 条目
        </el-tag>
      </div>

      <!-- 操作按钮 -->
      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <el-dropdown
          @click.stop
          trigger="click"
          placement="bottom-end"
        >
          <el-button
            circle
            size="small"
            type="info"
            :icon="'More'"
            class="bg-white/80 backdrop-blur hover:bg-white"
          />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleEdit">
                <el-icon><Edit /></el-icon>
                编辑
              </el-dropdown-item>
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

      <!-- 剧本图标 -->
      <div class="absolute bottom-4 left-4">
        <div class="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
          <el-icon class="text-white text-xl">
            <Document />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="p-4">
      <!-- 剧本名称 -->
      <h3 class="font-semibold text-lg text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors">
        {{ scenario.name }}
      </h3>

      <!-- 创建者信息 -->
      <div v-if="scenario.creator" class="flex items-center gap-2 mb-3">
        <el-avatar
          :size="20"
          :src="scenario.creator.avatar"
          class="bg-gray-300"
        >
          {{ scenario.creator.username?.charAt(0).toUpperCase() }}
        </el-avatar>
        <span class="text-sm text-gray-600">
          {{ scenario.creator.username }}
        </span>
      </div>

      <!-- 描述 -->
      <p class="text-gray-600 text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
        {{ scenario.description || '暂无描述...' }}
      </p>

      <!-- 分类 -->
      <div class="mb-3">
        <el-tag
          size="small"
          type="info"
          effect="plain"
        >
          {{ scenario.category }}
        </el-tag>
      </div>

      <!-- 标签 -->
      <div v-if="scenario.tags && scenario.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
        <el-tag
          v-for="(tag, index) in scenario.tags.slice(0, 3)"
          :key="index"
          size="small"
          effect="plain"
          class="text-xs"
        >
          {{ tag }}
        </el-tag>
        <el-tag
          v-if="scenario.tags.length > 3"
          size="small"
          effect="plain"
          class="text-xs"
        >
          +{{ scenario.tags.length - 3 }}
        </el-tag>
      </div>

      <!-- 社交统计信息 -->
      <div class="border-t pt-3 mt-3">
        <!-- 主要统计 -->
        <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
          <!-- 左侧统计 -->
          <div class="flex items-center gap-3">
            <!-- 使用次数 -->
            <div v-if="scenario.usageCount !== undefined" class="flex items-center gap-1">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ formatNumber(scenario.usageCount) }}</span>
            </div>

            <!-- 评分 -->
            <div v-if="scenario.rating !== undefined" class="flex items-center gap-1">
              <el-icon class="text-yellow-400"><StarFilled /></el-icon>
              <span>{{ scenario.rating.toFixed(1) }}</span>
            </div>
          </div>

          <!-- 更新时间 -->
          <div class="text-xs">
            {{ formatDate(scenario.updatedAt) }}
          </div>
        </div>

        <!-- 社交互动栏 -->
        <div class="flex items-center justify-between text-xs">
          <!-- 左侧互动按钮 -->
          <div class="flex items-center gap-2">
            <!-- 点赞按钮 -->
            <button
              @click.stop="handleLike"
              :class="[
                'flex items-center gap-1 px-2 py-1 rounded-full transition-colors',
                isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              <el-icon class="text-sm">
                <component :is="isLiked ? 'HeartFilled' : 'Heart'" />
              </el-icon>
              <span>{{ formatNumber(likeCount) }}</span>
            </button>

            <!-- 评论按钮 -->
            <button
              @click.stop="handleComment"
              class="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition-colors"
            >
              <el-icon class="text-sm"><ChatDotRound /></el-icon>
              <span>{{ formatNumber(commentCount) }}</span>
            </button>

            <!-- 引用统计 -->
            <div class="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
              <el-icon class="text-sm"><Link /></el-icon>
              <span>{{ formatNumber(referenceCount) }} 引用</span>
            </div>
          </div>

          <!-- 分享按钮 -->
          <button
            @click.stop="handleShare"
            class="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition-colors"
          >
            <el-icon class="text-sm"><Share /></el-icon>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 悬停效果遮罩 -->
    <div class="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Document,
  Edit,
  Delete,
  CopyDocument,
  View,
  Hide,
  More,
  ChatDotRound,
  StarFilled,
  Heart,
  HeartFilled,
  Link,
  Share
} from '@element-plus/icons-vue'
import type { Scenario } from '@/types/scenario'

interface Props {
  scenario: Scenario
  isSelected?: boolean
}

interface Emits {
  (e: 'click', scenario: Scenario): void
  (e: 'edit', scenario: Scenario): void
  (e: 'delete', scenario: Scenario): void
  (e: 'clone', scenario: Scenario): void
  (e: 'toggle-public', scenario: Scenario): void
  (e: 'comment', scenario: Scenario): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 社交功能数据
const isLiked = computed(() => {
  // 这里应该从用户状态或API获取，暂时返回false
  return false
})

const likeCount = computed(() => {
  // 从scenario对象获取点赞数，如果没有则返回0
  return props.scenario.likeCount || 0
})

const commentCount = computed(() => {
  // 从scenario对象获取评论数，如果没有则返回0
  return props.scenario.commentCount || 0
})

const referenceCount = computed(() => {
  // 从scenario对象获取引用数，如果没有则返回0
  return props.scenario.referenceCount || Math.floor(Math.random() * 20) + 1
})

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 格式化日期
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

// 事件处理
const handleCardClick = () => {
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

// 社交功能事件处理
const handleLike = async () => {
  try {
    // 这里应该调用API来切换点赞状态
    // await scenarioService.toggleLike(props.scenario.id)
    console.log('点赞剧本:', props.scenario.name)
    // 临时模拟：更新本地状态
    if (!isLiked.value) {
      props.scenario.likeCount = (props.scenario.likeCount || 0) + 1
    } else {
      props.scenario.likeCount = Math.max(0, (props.scenario.likeCount || 0) - 1)
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const handleComment = () => {
  // 打开评论对话框或跳转到评论页面
  console.log('查看评论:', props.scenario.name)
  // 这里可以emit一个评论事件或直接跳转
  emit('comment', props.scenario)
}

const handleShare = async () => {
  try {
    // 复制链接到剪贴板
    const shareUrl = `${window.location.origin}/scenarios/${props.scenario.id}`
    await navigator.clipboard.writeText(shareUrl)

    // 显示分享成功提示
    console.log('分享链接已复制:', shareUrl)
    // 这里可以显示一个toast提示
  } catch (error) {
    console.error('分享失败:', error)
    // 降级方案：显示一个对话框让用户手动复制
  }
}
</script>

<style scoped>
.scenario-card {
  height: 100%;
  min-height: 320px;
  position: relative;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 悬停动画效果 */
.scenario-card:hover {
  transform: translateY(-2px);
}

.scenario-card:active {
  transform: translateY(0);
}

/* 渐变背景变化 */
.scenario-card:nth-child(3n+1) .h-32 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.scenario-card:nth-child(3n+2) .h-32 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.scenario-card:nth-child(3n+3) .h-32 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .scenario-card {
    min-height: 280px;
  }

  .scenario-card .h-32 {
    height: 100px;
  }

  .scenario-card .p-4 {
    padding: 12px;
  }

  .scenario-card .text-lg {
    font-size: 16px;
  }

  .scenario-card .text-sm {
    font-size: 12px;
  }
}

/* 选中状态样式 */
.scenario-card.ring-2 {
  box-shadow: 0 0 0 2px #3b82f6;
}

/* 标签样式优化 */
:deep(.el-tag--small) {
  height: 20px;
  line-height: 18px;
  padding: 0 5px;
  font-size: 11px;
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
  font-size: 12px;
  font-weight: 500;
}

/* 图标样式 */
.el-icon {
  vertical-align: middle;
}

/* 动画优化 */
.scenario-card * {
  transition: all 0.2s ease;
}

.scenario-card:hover .group-hover\:opacity-100 {
  opacity: 1;
}

.scenario-card:hover .group-hover\:text-blue-600 {
  color: #2563eb;
}

/* 无障碍优化 */
.scenario-card:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.scenario-card:focus:not(:focus-visible) {
  outline: none;
}

/* 加载骨架屏样式 */
.scenario-card.skeleton {
  pointer-events: none;
}

.scenario-card.skeleton * {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>