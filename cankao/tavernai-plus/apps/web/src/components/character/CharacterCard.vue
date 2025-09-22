<template>
  <el-card
    class="character-card group cursor-pointer h-full"
    :body-style="{ padding: '0' }"
    shadow="hover"
    @click="handleCardClick"
  >
    <!-- 角色图片 -->
    <div class="relative h-64 bg-gradient-to-br from-indigo-400 to-purple-400 overflow-hidden">
      <!-- 图片 -->
      <img
        v-if="character.avatar"
        :src="character.avatar"
        :alt="character.name"
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        @error="handleImageError"
      />

      <!-- 默认头像 -->
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="text-white text-5xl font-bold opacity-80">
          {{ character.name.charAt(0).toUpperCase() }}
        </span>
      </div>

      <!-- 标签 -->
      <div class="absolute top-2 left-2 right-2 flex justify-between">
        <div class="flex gap-2">
          <el-tag v-if="character.isNew" type="success" size="small" class="opacity-90">
            新
          </el-tag>
          <el-tag v-if="character.isPremium" type="warning" size="small" class="opacity-90">
            高级
          </el-tag>
          <el-tag v-if="character.isNSFW" type="danger" size="small" class="opacity-90">
            NSFW
          </el-tag>
        </div>

        <!-- 收藏按钮 -->
        <el-button
          @click.stop="handleFavorite"
          :icon="character.isFavorited ? 'StarFilled' : 'Star'"
          type="text"
          size="small"
          circle
          class="favorite-btn bg-white/80 backdrop-blur hover:bg-white"
          :class="{ 'favorited': character.isFavorited }"
        />
      </div>

      <!-- 悬停遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div class="absolute bottom-4 left-4 right-4">
          <!-- 快速对话按钮组 -->
          <div class="flex space-x-2">
            <OneClickChatButton
              @click.stop
              :character="character"
              type="primary"
              size="small"
              :quick-mode="true"
              button-text="快速对话"
              class="flex-1"
              @chat-started="handleQuickChatStarted"
            />
            <el-button
              @click.stop="openQuickChatFlow"
              type="default"
              size="small"
              class="px-3"
              title="自定义设置"
            >
              <el-icon><Setting /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色信息 -->
    <div class="p-4">
      <!-- 角色名和创建者 -->
      <div class="mb-2">
        <el-text
          tag="h3"
          class="font-semibold text-lg text-gray-900 truncate group-hover:text-indigo-600 transition-colors block"
        >
          {{ character.name }}
        </el-text>
        <el-text type="info" size="small">
          by {{ character.creator?.username || '匿名用户' }}
        </el-text>
      </div>

      <!-- 描述 -->
      <p class="text-gray-600 text-sm line-clamp-2 mb-3">
        {{ character.description || '这个角色还没有描述...' }}
      </p>

      <!-- 标签 -->
      <div v-if="character.tags && character.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
        <el-tag
          v-for="(tag, index) in character.tags.slice(0, 3)"
          :key="index"
          size="small"
          type="info"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
        <el-tag
          v-if="character.tags.length > 3"
          size="small"
          type="info"
          effect="plain"
        >
          +{{ character.tags.length - 3 }}
        </el-tag>
      </div>

      <!-- 统计信息 -->
      <div class="flex items-center justify-between text-sm">
        <!-- 左侧统计 -->
        <div class="flex items-center gap-3 text-gray-500">
          <!-- 对话数 -->
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span>{{ formatNumber(character.chatCount || 0) }}</span>
          </div>

          <!-- 收藏数 -->
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span>{{ formatNumber(character.favoriteCount || 0) }}</span>
          </div>
        </div>

        <!-- 评分 -->
        <div class="flex items-center gap-1">
          <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
          <span class="text-gray-700 font-medium">
            {{ (character.rating || 0).toFixed(1) }}
          </span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import OneClickChatButton from '@/components/chat/OneClickChatButton.vue'

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  creator?: {
    id: string
    username: string
  }
  tags?: string[]
  isNew?: boolean
  isPremium?: boolean
  isNSFW?: boolean
  isFavorited?: boolean
  rating: number
  chatCount: number
  favoriteCount: number
}

const props = defineProps<{
  character: Character
}>()

const emit = defineEmits<{
  click: [character: Character]
  favorite: [characterId: string]
  'quick-chat-started': [characterId: string, sessionId: string]
}>()

const router = useRouter()
const characterStore = useCharacterStore()

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

// 处理收藏
const handleFavorite = () => {
  emit('favorite', props.character.id)
}

// 处理卡片点击
const handleCardClick = () => {
  emit('click', props.character)
}

// 快速对话开始处理
const handleQuickChatStarted = (sessionId: string) => {
  // 缓存角色到最近使用
  characterStore.cacheRecentCharacter(props.character)

  // 触发事件给父组件
  emit('quick-chat-started', props.character.id, sessionId)

  // 显示成功消息
  ElMessage.success({
    message: `与 ${props.character.name} 的快速对话已开始`,
    duration: 2000
  })
}

// 打开快速对话流程页面
const openQuickChatFlow = () => {
  router.push(`/quick-chat/${props.character.id}`)
}

// 开始聊天（保留原有功能）
const startChat = () => {
  router.push(`/chat/${props.character.id}`)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 快速对话按钮组优化 */
.character-card:hover .absolute.bottom-4 {
  transform: translateY(0);
  opacity: 1;
}

/* 设置按钮样式 */
.character-card .el-button:last-child {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  color: #374151;
}

.character-card .el-button:last-child:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #e5e7eb;
}

/* 快速对话按钮动画 */
.character-card .one-click-chat-button {
  transform: translateY(10px);
  opacity: 0;
  transition: all 0.3s ease;
}

.character-card:hover .one-click-chat-button {
  transform: translateY(0);
  opacity: 1;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .character-card {
    /* 增加触控目标大小 */
    min-height: 44px;

    /* 触控反馈 */
    &:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
  }

  .character-card .absolute.bottom-4 {
    /* 移动端始终显示按钮 */
    opacity: 1;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
    padding-top: 20px;
    bottom: 8px;
    left: 8px;
    right: 8px;
  }

  .character-card .one-click-chat-button {
    transform: translateY(0);
    opacity: 1;
    min-height: 44px;
    min-width: 44px;
  }

  .character-card .flex.space-x-2 {
    flex-direction: column;
    gap: 8px;
  }

  .character-card .flex.space-x-2 > * {
    margin-left: 0;
    width: 100%;
  }

  /* 卡片内容间距优化 */
  .character-card .p-4 {
    padding: 12px;
  }

  /* 头像高度调整 */
  .character-card .h-64 {
    height: 200px;
  }

  /* 文字大小调整 */
  .character-card .text-lg {
    font-size: 16px;
  }

  .character-card .text-sm {
    font-size: 12px;
  }

  /* 统计信息优化 */
  .character-card .flex.items-center.gap-3 {
    gap: 8px;
  }

  /* 按钮最小尺寸 */
  .character-card .el-button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 平板端适配 */
@media (min-width: 641px) and (max-width: 1024px) {
  .character-card .h-64 {
    height: 220px;
  }
}

/* 触控设备专用优化 */
@media (hover: none) and (pointer: coarse) {
  .character-card {
    /* 移动端始终显示操作按钮 */
    .absolute.inset-0.bg-gradient-to-t {
      opacity: 1;
    }

    /* 触控反馈增强 */
    &:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }

    /* 确保所有可点击元素符合最小尺寸 */
    .el-button,
    .el-tag {
      min-height: 44px;
      min-width: 44px;
      padding: 8px 12px;
    }
  }
}

/* 可访问性优化 */
.character-card .el-button:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.character-card .el-button:focus:not(:focus-visible) {
  outline: none;
}

/* 微交互优化 */
.character-card .one-click-chat-button:active {
  transform: scale(0.98);
}

.character-card .el-button:last-child:active {
  transform: scale(0.95);
}
</style>
