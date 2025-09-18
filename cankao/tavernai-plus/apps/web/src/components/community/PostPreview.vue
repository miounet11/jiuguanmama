<template>
  <div class="post-preview">
    <!-- 用户信息 -->
    <div class="flex items-center space-x-3 mb-4">
      <el-avatar :size="36" :src="post.user?.avatar">
        {{ post.user?.username?.charAt(0).toUpperCase() }}
      </el-avatar>
      <div>
        <div class="font-medium text-white">{{ post.user?.username }}</div>
        <div class="text-sm text-gray-400">刚刚 · {{ visibilityText }}</div>
      </div>
    </div>

    <!-- 内容 -->
    <div v-if="post.content" class="text-gray-200 mb-3 whitespace-pre-wrap">
      {{ post.content }}
    </div>

    <!-- 角色分享 -->
    <div v-if="post.type === 'character_share' && post.character" class="mb-3">
      <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
        <div class="flex items-center space-x-3">
          <el-avatar :size="32" :src="post.character.avatar">
            {{ post.character.name.charAt(0).toUpperCase() }}
          </el-avatar>
          <div>
            <h5 class="font-medium text-white">{{ post.character.name }}</h5>
            <p class="text-sm text-gray-400 line-clamp-1">{{ post.character.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片 -->
    <div v-if="post.type === 'image' && post.images?.length" class="mb-3">
      <div class="grid gap-1" :class="imageGridClass">
        <div
          v-for="(image, index) in displayImages"
          :key="index"
          class="relative overflow-hidden rounded bg-gray-800"
          :class="imageClass"
        >
          <img
            :src="image"
            :alt="`图片 ${index + 1}`"
            class="w-full h-full object-cover"
          />
          <!-- 更多图片指示 -->
          <div
            v-if="index === 3 && (post.images?.length || 0) > 4"
            class="absolute inset-0 bg-black/60 flex items-center justify-center"
          >
            <span class="text-white font-medium">+{{ (post.images?.length || 0) - 4 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签 -->
    <div v-if="post.tags?.length" class="flex flex-wrap gap-2 mb-3">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="px-2 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full"
      >
        #{{ tag }}
      </span>
    </div>

    <!-- 预览底部 -->
    <div class="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-700/50">
      <div class="flex space-x-4">
        <span>👍 0</span>
        <span>💬 0</span>
        <span>🔁 0</span>
      </div>
      <span>预览模式</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Post } from '@/types/community'

interface Props {
  post: Partial<Post>
}

const props = defineProps<Props>()

const visibilityText = computed(() => {
  switch (props.post.visibility) {
    case 'public': return '公开'
    case 'followers': return '粉丝可见'
    case 'private': return '私密'
    default: return '公开'
  }
})

const displayImages = computed(() => {
  if (!props.post.images) return []
  return props.post.images.slice(0, 4)
})

const imageGridClass = computed(() => {
  const count = props.post.images?.length || 0
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  return 'grid-cols-2'
})

const imageClass = computed(() => {
  const count = props.post.images?.length || 0
  if (count === 1) return 'h-40'
  return 'h-24'
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
