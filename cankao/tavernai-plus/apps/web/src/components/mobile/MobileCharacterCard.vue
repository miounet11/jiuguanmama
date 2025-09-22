<template>
  <div
    class="mobile-character-card"
    :class="{
      'grid-mode': mode === 'grid',
      'list-mode': mode === 'list',
      'favorited': character.isFavorited
    }"
    ref="cardRef"
  >
    <!-- 网格模式 -->
    <div v-if="mode === 'grid'" class="grid-card">
      <!-- 角色头像 -->
      <div class="avatar-container">
        <LazyImage
          :src="character.avatar"
          :alt="character.name"
          :fallback="getAvatarFallback()"
          class="avatar-image"
          @load="handleImageLoad"
          @error="handleImageError"
        />

        <!-- 状态标签 -->
        <div class="status-badges">
          <el-tag v-if="character.isNew" type="success" size="small" class="status-badge">
            新
          </el-tag>
          <el-tag v-if="character.isPremium" type="warning" size="small" class="status-badge">
            ⭐
          </el-tag>
          <el-tag v-if="character.isNSFW" type="danger" size="small" class="status-badge">
            18+
          </el-tag>
        </div>

        <!-- 收藏按钮 -->
        <TouchGestureHandler
          @tap="handleFavoriteToggle"
          class="favorite-btn-container"
        >
          <el-button
            :icon="character.isFavorited ? 'StarFilled' : 'Star'"
            type="text"
            size="small"
            circle
            class="favorite-btn"
            :class="{ 'favorited': character.isFavorited }"
          />
        </TouchGestureHandler>

        <!-- 悬停/长按操作面板 -->
        <div class="action-overlay" :class="{ 'visible': showActions }">
          <div class="action-buttons">
            <el-button
              @click.stop="handleQuickChat"
              type="primary"
              size="small"
              class="action-btn chat-btn"
            >
              <el-icon><ChatDotRound /></el-icon>
              <span>对话</span>
            </el-button>
            <el-button
              @click.stop="handleViewDetails"
              type="default"
              size="small"
              class="action-btn view-btn"
            >
              <el-icon><View /></el-icon>
              <span>详情</span>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 角色信息 -->
      <div class="character-info">
        <h3 class="character-name" @click="handleNameClick">
          {{ character.name }}
        </h3>

        <p class="character-description">
          {{ truncatedDescription }}
        </p>

        <!-- 统计信息 -->
        <div class="character-stats">
          <div class="stat-item">
            <el-icon class="stat-icon"><ChatDotRound /></el-icon>
            <span class="stat-value">{{ formatNumber(character.chatCount) }}</span>
          </div>
          <div class="stat-item">
            <el-icon class="stat-icon"><Star /></el-icon>
            <span class="stat-value">{{ character.rating.toFixed(1) }}</span>
          </div>
          <div class="stat-item">
            <el-icon class="stat-icon"><Heart /></el-icon>
            <span class="stat-value">{{ formatNumber(character.favoriteCount) }}</span>
          </div>
        </div>

        <!-- 标签（最多显示2个） -->
        <div v-if="displayTags.length" class="character-tags">
          <el-tag
            v-for="tag in displayTags"
            :key="tag"
            size="small"
            type="info"
            effect="plain"
            class="character-tag"
          >
            {{ tag }}
          </el-tag>
          <span v-if="character.tags.length > 2" class="more-tags">
            +{{ character.tags.length - 2 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 列表模式 -->
    <div v-else class="list-card">
      <div class="list-content">
        <!-- 头像 -->
        <div class="list-avatar">
          <LazyImage
            :src="character.avatar"
            :alt="character.name"
            :fallback="getAvatarFallback()"
            class="avatar-image"
          />
        </div>

        <!-- 主要信息 -->
        <div class="list-info">
          <div class="list-header">
            <h3 class="character-name" @click="handleNameClick">
              {{ character.name }}
            </h3>
            <div class="status-row">
              <div class="status-badges">
                <el-tag v-if="character.isNew" type="success" size="small">新</el-tag>
                <el-tag v-if="character.isPremium" type="warning" size="small">⭐</el-tag>
              </div>
              <TouchGestureHandler @tap="handleFavoriteToggle">
                <el-icon
                  class="favorite-icon"
                  :class="{ 'favorited': character.isFavorited }"
                >
                  <component :is="character.isFavorited ? 'StarFilled' : 'Star'" />
                </el-icon>
              </TouchGestureHandler>
            </div>
          </div>

          <p class="character-description">
            {{ truncatedDescription }}
          </p>

          <div class="list-footer">
            <!-- 统计信息 -->
            <div class="character-stats">
              <span class="stat-item">
                {{ formatNumber(character.chatCount) }} 对话
              </span>
              <span class="stat-item">
                {{ character.rating.toFixed(1) }} ⭐
              </span>
              <span class="stat-item">
                {{ formatNumber(character.favoriteCount) }} ❤️
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="list-actions">
              <el-button
                @click.stop="handleQuickChat"
                type="primary"
                size="small"
                class="action-btn"
              >
                对话
              </el-button>
            </div>
          </div>

          <!-- 标签 -->
          <div v-if="displayTags.length" class="character-tags">
            <el-tag
              v-for="tag in displayTags.slice(0, 3)"
              :key="tag"
              size="small"
              type="info"
              effect="plain"
              class="character-tag"
            >
              {{ tag }}
            </el-tag>
            <span v-if="character.tags.length > 3" class="more-tags">
              +{{ character.tags.length - 3 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTouchGestures } from '@/composables/useTouchGestures'
import {
  ChatDotRound,
  Star,
  StarFilled,
  Heart,
  View
} from '@element-plus/icons-vue'

import LazyImage from '@/components/common/LazyImage.vue'
import TouchGestureHandler from './TouchGestureHandler.vue'

interface Character {
  id: string
  name: string
  avatar?: string
  description?: string
  tags: string[]
  rating: number
  chatCount: number
  favoriteCount: number
  isFavorited?: boolean
  isNew?: boolean
  isPremium?: boolean
  isNSFW?: boolean
  creator?: {
    id: string
    username: string
  }
}

interface Props {
  character: Character
  mode?: 'grid' | 'list'
  maxDescriptionLength?: number
  enableLongPress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid',
  maxDescriptionLength: 80,
  enableLongPress: true
})

const emit = defineEmits<{
  'click': [character: Character]
  'favorite': [characterId: string]
  'quick-chat': [character: Character]
  'long-press': [character: Character]
  'name-click': [character: Character]
}>()

// 引用
const cardRef = ref<HTMLElement>()

// 状态
const showActions = ref(false)
const isImageLoaded = ref(false)
const imageError = ref(false)

// 计算属性
const truncatedDescription = computed(() => {
  const desc = props.character.description || '这个角色还没有描述...'
  if (desc.length <= props.maxDescriptionLength) {
    return desc
  }
  return desc.substring(0, props.maxDescriptionLength) + '...'
})

const displayTags = computed(() => {
  const maxTags = props.mode === 'grid' ? 2 : 3
  return props.character.tags.slice(0, maxTags)
})

// 设置触控手势
const setupTouchGestures = () => {
  if (!cardRef.value || !props.enableLongPress) return

  const { onTap, onLongPress } = useTouchGestures(cardRef, {
    longPressDelay: 500,
    preventDefault: false
  })

  onTap(() => {
    emit('click', props.character)
  })

  onLongPress(() => {
    showActions.value = true
    emit('long-press', props.character)

    // 触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }

    // 3秒后自动隐藏
    setTimeout(() => {
      showActions.value = false
    }, 3000)
  })
}

// 方法
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getAvatarFallback = (): string => {
  // 生成基于角色名的渐变背景
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ]

  const charCode = props.character.name.charCodeAt(0)
  const gradient = colors[charCode % colors.length]

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea"/>
          <stop offset="100%" style="stop-color:#764ba2"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#grad)"/>
      <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold"
            text-anchor="middle" fill="white" opacity="0.8">
        ${props.character.name.charAt(0).toUpperCase()}
      </text>
    </svg>
  `)}`
}

const handleImageLoad = () => {
  isImageLoaded.value = true
  imageError.value = false
}

const handleImageError = () => {
  imageError.value = true
  isImageLoaded.value = false
}

const handleFavoriteToggle = () => {
  emit('favorite', props.character.id)

  // 触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(25)
  }
}

const handleQuickChat = () => {
  emit('quick-chat', props.character)
}

const handleViewDetails = () => {
  emit('click', props.character)
}

const handleNameClick = () => {
  emit('name-click', props.character)
}

// 生命周期
onMounted(() => {
  setupTouchGestures()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mobile-character-card {
  position: relative;
  cursor: pointer;
  transition: all $transition-base;

  &:active {
    transform: scale(0.98);
  }
}

// 网格模式样式
.grid-card {
  @include card;
  padding: 0;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;

  .avatar-container {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;

    @include respond-to($breakpoint-sm) {
      height: 180px;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform $transition-slow;
    }

    .status-badges {
      position: absolute;
      top: $spacing-2;
      left: $spacing-2;
      display: flex;
      gap: $spacing-1;

      .status-badge {
        backdrop-filter: blur(10px);
        background: rgba(white, 0.9);
        border: none;
      }
    }

    .favorite-btn-container {
      position: absolute;
      top: $spacing-2;
      right: $spacing-2;

      .favorite-btn {
        background: rgba(white, 0.9);
        backdrop-filter: blur(10px);
        border: none;
        color: $gray-600;
        transition: all $transition-base;

        &.favorited {
          color: $secondary-500;
          background: rgba($secondary-50, 0.95);
        }

        &:hover {
          background: white;
          transform: scale(1.1);
        }
      }
    }

    .action-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(black, 0.6) 100%
      );
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: $spacing-4;
      opacity: 0;
      visibility: hidden;
      transition: all $transition-base;

      &.visible {
        opacity: 1;
        visibility: visible;
      }

      .action-buttons {
        display: flex;
        gap: $spacing-2;

        .action-btn {
          backdrop-filter: blur(10px);
          border: 1px solid rgba(white, 0.2);
          color: white;
          transition: all $transition-fast;

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--el-box-shadow-light);
          }

          &.chat-btn {
            background: rgba($primary-500, 0.9);
          }

          &.view-btn {
            background: rgba($gray-700, 0.9);
          }
        }
      }
    }
  }

  .character-info {
    padding: $spacing-3;
    flex: 1;
    display: flex;
    flex-direction: column;

    .character-name {
      margin: 0 0 $spacing-2 0;
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: var(--el-text-color-primary);
      @include text-truncate;
      cursor: pointer;
      transition: color $transition-fast;

      &:hover {
        color: $primary-500;
      }
    }

    .character-description {
      flex: 1;
      margin: 0 0 $spacing-3 0;
      font-size: $font-size-sm;
      line-height: $line-height-normal;
      color: var(--el-text-color-regular);
      @include text-line-clamp(2);
    }

    .character-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: $spacing-2;

      .stat-item {
        display: flex;
        align-items: center;
        font-size: $font-size-xs;
        color: var(--el-text-color-placeholder);

        .stat-icon {
          margin-right: $spacing-1;
          font-size: 12px;
        }
      }
    }

    .character-tags {
      display: flex;
      gap: $spacing-1;
      flex-wrap: wrap;
      align-items: center;

      .character-tag {
        font-size: $font-size-xs;
      }

      .more-tags {
        font-size: $font-size-xs;
        color: var(--el-text-color-placeholder);
      }
    }
  }
}

// 列表模式样式
.list-card {
  @include card;
  padding: $spacing-3;

  .list-content {
    display: flex;
    gap: $spacing-3;
  }

  .list-avatar {
    width: 80px;
    height: 80px;
    flex-shrink: 0;

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: $border-radius-lg;
    }
  }

  .list-info {
    flex: 1;
    min-width: 0;

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: $spacing-2;

      .character-name {
        margin: 0;
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        color: var(--el-text-color-primary);
        @include text-truncate;
        cursor: pointer;
        transition: color $transition-fast;

        &:hover {
          color: $primary-500;
        }
      }

      .status-row {
        display: flex;
        align-items: center;
        gap: $spacing-2;

        .favorite-icon {
          cursor: pointer;
          color: $gray-400;
          transition: all $transition-fast;

          &.favorited {
            color: $secondary-500;
          }

          &:hover {
            transform: scale(1.1);
          }

          &:active {
            transform: scale(0.9);
          }
        }
      }
    }

    .character-description {
      margin: 0 0 $spacing-3 0;
      font-size: $font-size-sm;
      line-height: $line-height-normal;
      color: var(--el-text-color-regular);
      @include text-line-clamp(2);
    }

    .list-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-2;

      .character-stats {
        display: flex;
        gap: $spacing-3;

        .stat-item {
          font-size: $font-size-xs;
          color: var(--el-text-color-placeholder);
        }
      }

      .list-actions {
        .action-btn {
          padding: $spacing-1 $spacing-3;
        }
      }
    }

    .character-tags {
      display: flex;
      gap: $spacing-1;
      flex-wrap: wrap;
      align-items: center;

      .character-tag {
        font-size: $font-size-xs;
      }

      .more-tags {
        font-size: $font-size-xs;
        color: var(--el-text-color-placeholder);
      }
    }
  }
}

// 收藏状态样式
.mobile-character-card.favorited {
  .grid-card,
  .list-card {
    border-color: rgba($secondary-500, 0.3);
    background: linear-gradient(
      135deg,
      rgba($secondary-50, 0.5) 0%,
      transparent 100%
    );
  }
}

// 悬停效果（桌面端）
@media (hover: hover) {
  .mobile-character-card:hover {
    .grid-card .avatar-container .avatar-image {
      transform: scale(1.05);
    }

    .grid-card .avatar-container .action-overlay {
      opacity: 1;
      visibility: visible;
    }
  }
}

// 移动端优化
@include mobile-only {
  .grid-card {
    .avatar-container {
      height: 140px;
    }

    .character-info {
      padding: $spacing-2;

      .character-name {
        font-size: $font-size-sm;
      }

      .character-description {
        font-size: $font-size-xs;
      }
    }
  }

  .list-card {
    padding: $spacing-2;

    .list-avatar {
      width: 60px;
      height: 60px;
    }

    .list-info {
      .list-header .character-name {
        font-size: $font-size-base;
      }

      .character-description {
        font-size: $font-size-xs;
      }
    }
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .mobile-character-card,
  .avatar-image,
  .favorite-btn,
  .action-btn {
    transition: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .grid-card,
  .list-card {
    border-width: 2px;
  }

  .action-overlay {
    background: rgba(black, 0.8);
  }
}
</style>