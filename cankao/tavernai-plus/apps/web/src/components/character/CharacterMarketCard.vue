<template>
  <div
    class="character-market-card group cursor-pointer h-full"
    :class="{
      'list-mode': mode === 'list',
      'grid-mode': mode === 'grid'
    }"
    @click="handleCardClick"
  >
    <!-- 网格模式 -->
    <div v-if="mode === 'grid'" class="glass-card h-full overflow-hidden hover:scale-105 transition-all duration-300">
      <!-- 角色图片区域 -->
      <div class="relative h-64 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 overflow-hidden">
        <!-- 背景图片 -->
        <img
          v-if="character.avatar"
          :src="character.avatar"
          :alt="character.name"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          @error="handleImageError"
        />

        <!-- 默认头像 -->
        <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
          <span class="text-white text-4xl font-bold opacity-90">
            {{ character.name.charAt(0).toUpperCase() }}
          </span>
        </div>

        <!-- 顶部标签 -->
        <div class="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div class="flex flex-wrap gap-1">
            <el-tag v-if="character.isFeatured" type="warning" size="small" class="glow-tag">
              <el-icon class="mr-1"><Star /></el-icon>
              精选
            </el-tag>
            <el-tag v-if="character.isNew" type="success" size="small" class="glow-tag">
              新
            </el-tag>
            <el-tag v-if="character.isNSFW" type="danger" size="small" class="glow-tag">
              18+
            </el-tag>
          </div>

          <!-- 收藏按钮 -->
          <div class="flex gap-2">
            <el-button
              @click.stop="handleFavorite"
              :type="character.isFavorited ? 'primary' : 'default'"
              size="small"
              circle
              class="favorite-btn backdrop-blur-sm"
              :class="{ 'favorited': character.isFavorited }"
            >
              <el-icon>
                <StarFilled v-if="character.isFavorited" />
                <Star v-else />
              </el-icon>
            </el-button>
          </div>
        </div>

        <!-- 悬停遮罩和操作按钮 -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="absolute bottom-4 left-4 right-4 space-y-2">
            <el-button
              @click.stop="handleImport"
              type="primary"
              size="large"
              class="w-full"
            >
              <el-icon class="mr-2"><Download /></el-icon>
              导入角色
            </el-button>
            <el-button
              @click.stop="handlePreview"
              type="default"
              size="large"
              class="w-full backdrop-blur-sm"
            >
              <el-icon class="mr-2"><View /></el-icon>
              预览试聊
            </el-button>
          </div>
        </div>

        <!-- 评分徽章 -->
        <div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
          <el-icon class="text-yellow-400"><Star /></el-icon>
          <span class="text-white font-medium text-sm">{{ character.rating.toFixed(1) }}</span>
        </div>
      </div>

      <!-- 角色信息 -->
      <div class="p-4 flex-1 flex flex-col">
        <!-- 角色名称和创建者 -->
        <div class="mb-3">
          <h3 class="text-lg font-semibold text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
            {{ character.name }}
          </h3>
          <div class="flex items-center gap-2 text-sm">
            <img
              v-if="character.creator.avatar"
              :src="character.creator.avatar"
              :alt="character.creator.username"
              class="w-5 h-5 rounded-full"
            />
            <span class="text-gray-400">by</span>
            <span class="text-purple-400 hover:text-purple-300 cursor-pointer">
              {{ character.creator.username }}
            </span>
          </div>
        </div>

        <!-- 描述 -->
        <p class="text-gray-300 text-sm line-clamp-2 mb-4 flex-1">
          {{ character.description || '这个角色还没有描述...' }}
        </p>

        <!-- 标签 -->
        <div v-if="character.tags.length > 0" class="mb-4">
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="(tag, index) in character.tags.slice(0, 3)"
              :key="index"
              size="small"
              type="info"
              effect="plain"
              class="tag-hover"
            >
              {{ tag }}
            </el-tag>
            <el-tag
              v-if="character.tags.length > 3"
              size="small"
              type="info"
              effect="plain"
              class="tag-hover"
            >
              +{{ character.tags.length - 3 }}
            </el-tag>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-gray-700">
          <div class="flex items-center gap-3">
            <!-- 收藏数 -->
            <div class="flex items-center gap-1">
              <el-icon><Heart /></el-icon>
              <span>{{ formatNumber(character.favorites) }}</span>
            </div>

            <!-- 下载数 -->
            <div class="flex items-center gap-1">
              <el-icon><Download /></el-icon>
              <span>{{ formatNumber(character.downloads || 0) }}</span>
            </div>
          </div>

          <!-- 分类 -->
          <el-tag size="small" type="info" effect="plain" class="category-tag">
            {{ character.category }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 列表模式 -->
    <div v-else class="glass-card p-4 hover:bg-purple-500/10 transition-all duration-300">
      <div class="flex gap-4">
        <!-- 角色头像 -->
        <div class="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
          <img
            v-if="character.avatar"
            :src="character.avatar"
            :alt="character.name"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
            <span class="text-white text-xl font-bold">
              {{ character.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- 评分徽章 -->
          <div class="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <el-icon class="text-xs"><Star /></el-icon>
            {{ character.rating.toFixed(1) }}
          </div>
        </div>

        <!-- 角色信息 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between mb-2">
            <div>
              <h3 class="text-lg font-semibold text-white mb-1 hover:text-purple-400 transition-colors">
                {{ character.name }}
              </h3>
              <div class="flex items-center gap-2 text-sm text-gray-400">
                <span>by {{ character.creator.username }}</span>
                <span>•</span>
                <span>{{ character.category }}</span>
              </div>
            </div>

            <!-- 右侧标签和操作 -->
            <div class="flex items-center gap-2">
              <el-tag v-if="character.isFeatured" type="warning" size="small">精选</el-tag>
              <el-tag v-if="character.isNew" type="success" size="small">新</el-tag>

              <!-- 操作按钮 -->
              <el-button-group size="small">
                <el-button
                  @click.stop="handleFavorite"
                  :type="character.isFavorited ? 'primary' : 'default'"
                >
                  <el-icon>
                    <StarFilled v-if="character.isFavorited" />
                    <Star v-else />
                  </el-icon>
                </el-button>
                <el-button @click.stop="handleImport" type="primary">
                  <el-icon><Download /></el-icon>
                  导入
                </el-button>
              </el-button-group>
            </div>
          </div>

          <!-- 描述 -->
          <p class="text-gray-300 text-sm line-clamp-2 mb-3">
            {{ character.description || '这个角色还没有描述...' }}
          </p>

          <!-- 标签和统计 -->
          <div class="flex items-center justify-between">
            <!-- 标签 -->
            <div class="flex flex-wrap gap-1">
              <el-tag
                v-for="(tag, index) in character.tags.slice(0, 4)"
                :key="index"
                size="small"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
              <el-tag
                v-if="character.tags.length > 4"
                size="small"
                type="info"
                effect="plain"
              >
                +{{ character.tags.length - 4 }}
              </el-tag>
            </div>

            <!-- 统计信息 -->
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <div class="flex items-center gap-1">
                <el-icon><Heart /></el-icon>
                <span>{{ formatNumber(character.favorites) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <el-icon><Download /></el-icon>
                <span>{{ formatNumber(character.downloads || 0) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <el-icon><ChatRound /></el-icon>
                <span>{{ formatNumber(character.ratingCount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import {
  Star,
  StarFilled,
  Heart,
  Download,
  View,
  ChatRound
} from '@element-plus/icons-vue'
import type { CharacterPreview } from '@/services/marketplace'

interface Props {
  character: CharacterPreview
  mode?: 'grid' | 'list'
}

interface Emits {
  click: [character: CharacterPreview]
  favorite: [characterId: string]
  import: [characterId: string]
  preview: [character: CharacterPreview]
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid'
})

const emit = defineEmits<Emits>()

// 格式化数字显示
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

// 处理卡片点击
const handleCardClick = () => {
  emit('click', props.character)
}

// 处理收藏
const handleFavorite = () => {
  emit('favorite', props.character.id)
}

// 处理导入
const handleImport = () => {
  emit('import', props.character.id)
}

// 处理预览
const handlePreview = () => {
  emit('preview', props.character)
}
</script>

<style scoped>
.glass-card {
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.glass-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.glow-tag {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: white;
  backdrop-filter: blur(10px);
}

.favorite-btn {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.favorite-btn.favorited {
  background: rgba(139, 92, 246, 0.8);
  border-color: rgba(139, 92, 246, 1);
  color: white;
}

.favorite-btn:hover {
  background: rgba(139, 92, 246, 0.6);
  border-color: rgba(139, 92, 246, 0.8);
  transform: scale(1.1);
}

.tag-hover {
  transition: all 0.2s ease;
}

.tag-hover:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: white;
  transform: translateY(-1px);
}

.category-tag {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
  color: rgba(139, 92, 246, 0.9);
}

/* 列表模式特殊样式 */
.list-mode .glass-card:hover {
  background: rgba(139, 92, 246, 0.1);
}

:deep(.el-button) {
  transition: all 0.2s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-tag) {
  transition: all 0.2s ease;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .grid-mode .glass-card {
    max-width: none;
  }

  .list-mode .glass-card {
    padding: 12px;
  }

  .list-mode .glass-card .flex {
    flex-direction: column;
    gap: 12px;
  }

  .list-mode .w-20 {
    width: 60px;
    height: 60px;
  }
}
</style>
