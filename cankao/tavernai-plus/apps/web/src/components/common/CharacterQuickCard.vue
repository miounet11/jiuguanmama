<template>
  <div
    @click="$emit('select', character)"
    class="character-quick-card group cursor-pointer"
  >
    <el-card
      shadow="hover"
      :body-style="{ padding: '0' }"
      class="h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      <!-- 角色头像区域 -->
      <div class="relative h-32 overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500">
        <img
          v-if="character.avatar"
          :src="character.avatar"
          :alt="character.name"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          @error="handleImageError"
        />

        <!-- 默认头像 -->
        <div v-else class="w-full h-full flex items-center justify-center">
          <span class="text-white text-3xl font-bold opacity-80">
            {{ character.name.charAt(0).toUpperCase() }}
          </span>
        </div>

        <!-- 标签 -->
        <div class="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div class="flex flex-col gap-1">
            <el-tag
              v-if="character.isRecommended"
              type="warning"
              size="small"
              class="opacity-90"
            >
              推荐
            </el-tag>
          </div>

          <!-- 快速开始按钮 -->
          <el-button
            type="primary"
            size="small"
            round
            class="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            @click.stop="$emit('select', character)"
          >
            开始聊天
          </el-button>
        </div>
      </div>

      <!-- 角色信息 -->
      <div class="p-4">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {{ character.name }}
            </h4>
            <p class="text-sm text-gray-500">
              by {{ character.creator }}
            </p>
          </div>

          <!-- 统计信息 -->
          <div class="flex items-center space-x-3 text-xs text-gray-400 ml-2">
            <div class="flex items-center" v-if="character.rating">
              <el-icon class="mr-1 text-yellow-400"><Star /></el-icon>
              {{ character.rating.toFixed(1) }}
            </div>
            <div class="flex items-center" v-if="character.chatCount">
              <el-icon class="mr-1"><ChatDotRound /></el-icon>
              {{ formatCount(character.chatCount) }}
            </div>
          </div>
        </div>

        <!-- 描述 -->
        <p class="text-sm text-gray-600 line-clamp-2 mb-3">
          {{ character.description || '这个角色还没有描述...' }}
        </p>

        <!-- 标签 -->
        <div class="flex flex-wrap gap-1">
          <el-tag
            v-for="(tag, index) in character.tags.slice(0, 3)"
            :key="index"
            size="small"
            type="info"
            effect="plain"
            class="text-xs"
          >
            {{ tag }}
          </el-tag>
          <el-tag
            v-if="character.tags.length > 3"
            size="small"
            type="info"
            effect="plain"
            class="text-xs"
          >
            +{{ character.tags.length - 3 }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Star, ChatDotRound } from '@element-plus/icons-vue'

interface Character {
  id: string
  name: string
  avatar?: string
  description: string
  tags: string[]
  creator: string
  isRecommended?: boolean
  chatCount?: number
  rating?: number
}

interface Props {
  character: Character
}

defineProps<Props>()
defineEmits<{
  select: [character: Character]
}>()

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
</script>

<style lang="scss" scoped>
.character-quick-card {
  height: 100%;

  :deep(.el-card) {
    height: 100%;
    border: 2px solid transparent;
    transition: var(--transition-all);

    &:hover {
      border-color: var(--tavern-primary);
    }
  }
}

// 响应式调整
@media (max-width: 640px) {
  .character-quick-card {
    :deep(.el-card__body) {
      padding: var(--space-3) !important;
    }
  }
}
</style>
