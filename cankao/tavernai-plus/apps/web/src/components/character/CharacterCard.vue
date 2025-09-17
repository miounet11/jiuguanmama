<template>
  <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group">
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
          <span v-if="character.isNew"
                class="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
            新
          </span>
          <span v-if="character.isPremium"
                class="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs rounded-full">
            高级
          </span>
          <span v-if="character.isNSFW"
                class="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            NSFW
          </span>
        </div>

        <!-- 收藏按钮 -->
        <button
          @click.stop="handleFavorite"
          class="p-1.5 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors"
        >
          <svg
            :class="[
              'w-5 h-5 transition-colors',
              character.isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </div>

      <!-- 悬停遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div class="absolute bottom-4 left-4 right-4">
          <button class="w-full px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            开始对话
          </button>
        </div>
      </div>
    </div>

    <!-- 角色信息 -->
    <div class="p-4">
      <!-- 角色名和创建者 -->
      <div class="mb-2">
        <h3 class="font-semibold text-lg text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
          {{ character.name }}
        </h3>
        <p class="text-sm text-gray-500">
          by {{ character.creator?.username || '匿名用户' }}
        </p>
      </div>

      <!-- 描述 -->
      <p class="text-gray-600 text-sm line-clamp-2 mb-3">
        {{ character.description || '这个角色还没有描述...' }}
      </p>

      <!-- 标签 -->
      <div v-if="character.tags && character.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
        <span
          v-for="(tag, index) in character.tags.slice(0, 3)"
          :key="index"
          class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
        >
          {{ tag }}
        </span>
        <span
          v-if="character.tags.length > 3"
          class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
        >
          +{{ character.tags.length - 3 }}
        </span>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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
}>()

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
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
