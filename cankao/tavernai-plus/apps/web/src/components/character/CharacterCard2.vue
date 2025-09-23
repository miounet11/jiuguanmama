<template>
  <TavernCard
    class="character-card"
    variant="default"
    size="md"
    hoverable
    clickable
    :aspect-ratio="aspectRatio"
    @click="handleCardClick"
  >
    <!-- 媒体区域 - 角色头像 -->
    <template #media>
      <div class="character-avatar-section">
        <!-- 背景渐变 -->
        <div class="character-avatar-background" />

        <!-- 角色头像 -->
        <img
          v-if="character.avatar"
          :src="character.avatar"
          :alt="character.name"
          class="character-avatar"
          @error="handleImageError"
        />

        <!-- 默认头像 -->
        <div v-else class="character-avatar-placeholder">
          <span class="character-initial">
            {{ character.name.charAt(0).toUpperCase() }}
          </span>
        </div>

        <!-- 状态徽章 -->
        <div class="character-badges">
          <TavernBadge v-if="character.isNew" variant="success" size="xs">
            新
          </TavernBadge>
          <TavernBadge v-if="character.isPremium" variant="warning" size="xs">
            高级
          </TavernBadge>
          <TavernBadge v-if="character.isNSFW" variant="error" size="xs">
            NSFW
          </TavernBadge>
        </div>

        <!-- 收藏按钮 -->
        <TavernButton
          variant="ghost"
          size="sm"
          class="character-favorite"
          :class="{ 'character-favorite--active': character.isFavorited }"
          @click.stop="handleFavorite"
        >
          <TavernIcon :name="character.isFavorited ? 'heart' : 'heart'" />
        </TavernButton>

        <!-- 悬浮操作层 -->
        <div class="character-overlay">
          <div class="character-actions">
            <!-- 快速对话按钮 -->
            <TavernButton
              variant="primary"
              size="sm"
              icon-left="chat"
              class="character-action-primary"
              @click.stop="startQuickChat"
            >
              快速对话
            </TavernButton>

            <!-- 设置按钮 -->
            <TavernButton
              variant="secondary"
              size="sm"
              class="character-action-secondary"
              @click.stop="openQuickChatFlow"
            >
              <TavernIcon name="gear" />
            </TavernButton>
          </div>
        </div>
      </div>
    </template>

    <!-- 角色信息 -->
    <div class="character-info">
      <!-- 标题区域 -->
      <div class="character-header">
        <h3 class="character-name">
          {{ character.name }}
        </h3>
        <p class="character-creator">
          by {{ character.creator?.username || '匿名用户' }}
        </p>
      </div>

      <!-- 描述 -->
      <p class="character-description">
        {{ character.description || '这个角色还没有描述...' }}
      </p>

      <!-- 标签 -->
      <div v-if="character.tags && character.tags.length > 0" class="character-tags">
        <TavernBadge
          v-for="(tag, index) in visibleTags"
          :key="index"
          variant="neutral"
          size="xs"
          soft
        >
          {{ tag }}
        </TavernBadge>
        <TavernBadge
          v-if="hiddenTagsCount > 0"
          variant="neutral"
          size="xs"
          soft
        >
          +{{ hiddenTagsCount }}
        </TavernBadge>
      </div>

      <!-- 统计信息 -->
      <div class="character-stats">
        <!-- 对话数 -->
        <div class="character-stat">
          <TavernIcon name="chat" size="xs" />
          <span>{{ formatNumber(character.chatCount || 0) }}</span>
        </div>

        <!-- 收藏数 -->
        <div class="character-stat">
          <TavernIcon name="heart" size="xs" />
          <span>{{ formatNumber(character.favoriteCount || 0) }}</span>
        </div>

        <!-- 评分 -->
        <div class="character-rating">
          <TavernIcon name="star" size="xs" />
          <span>{{ (character.rating || 0).toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </TavernCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import { ElMessage } from 'element-plus'
import {
  TavernCard,
  TavernButton,
  TavernBadge,
  TavernIcon
} from '@/components/design-system'

// 保持原有接口兼容性
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

export interface CharacterCardProps {
  character: Character
  aspectRatio?: '1:1' | '4:3' | '16:9' | 'auto'
  maxTags?: number
}

// Props
const props = withDefaults(defineProps<CharacterCardProps>(), {
  aspectRatio: '4:3',
  maxTags: 3
})

// Emits
const emit = defineEmits<{
  click: [character: Character]
  favorite: [characterId: string]
  'quick-chat-started': [characterId: string, sessionId: string]
}>()

// Composables
const router = useRouter()
const characterStore = useCharacterStore()

// Computed
const visibleTags = computed(() => {
  if (!props.character.tags) return []
  return props.character.tags.slice(0, props.maxTags)
})

const hiddenTagsCount = computed(() => {
  if (!props.character.tags) return 0
  return Math.max(0, props.character.tags.length - props.maxTags)
})

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const handleFavorite = () => {
  emit('favorite', props.character.id)
}

const handleCardClick = () => {
  emit('click', props.character)
}

const startQuickChat = async () => {
  try {
    // 模拟快速对话启动逻辑
    const sessionId = `session_${Date.now()}`

    // 缓存角色到最近使用
    characterStore.cacheRecentCharacter(props.character)

    // 触发事件给父组件
    emit('quick-chat-started', props.character.id, sessionId)

    // 显示成功消息
    ElMessage.success({
      message: `与 ${props.character.name} 的快速对话已开始`,
      duration: 2000
    })
  } catch (error) {
    ElMessage.error('启动快速对话失败，请稍后再试')
  }
}

const openQuickChatFlow = () => {
  router.push(`/quick-chat/${props.character.id}`)
}
</script>

<style lang="scss">
.character-card {
  // 确保卡片有合适的高度
  min-height: calc(var(--space-64) + var(--space-32)); // 384px

  // === 媒体区域样式 ===
  .character-avatar-section {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: var(--space-64); // 256px
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .character-avatar-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      var(--brand-primary-400),
      var(--brand-primary-500)
    );
    z-index: 0;
  }

  .character-avatar {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--duration-normal) ease;
    z-index: 1;
  }

  .character-avatar-placeholder {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    z-index: 1;

    .character-initial {
      font-size: var(--text-5xl);
      font-weight: var(--font-bold);
      color: var(--brand-primary-text);
      opacity: 0.8;
    }
  }

  // 状态徽章
  .character-badges {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    display: flex;
    gap: var(--space-1);
    z-index: 3;
  }

  // 收藏按钮
  .character-favorite {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    z-index: 3;
    background: var(--surface-2);
    backdrop-filter: blur(var(--space-2));
    border: var(--space-px) solid var(--border-accent);

    &:hover {
      background: var(--surface-3);
      transform: scale(1.05);
    }

    &--active {
      color: var(--error);
      background: var(--surface-3);
    }
  }

  // 悬浮操作层
  .character-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.4) 50%,
      transparent 100%
    );
    padding: var(--space-4);
    opacity: 0;
    transform: translateY(var(--space-2));
    transition: all var(--duration-normal) ease;
    z-index: 2;
  }

  .character-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .character-action-primary {
    flex: 1;
    background: var(--tavern-primary);
    border-color: var(--tavern-primary);

    &:hover {
      background: var(--tavern-primary-hover);
      border-color: var(--tavern-primary-hover);
    }
  }

  .character-action-secondary {
    background: var(--surface-2);
    border-color: var(--border-accent);
    backdrop-filter: blur(var(--space-2));

    &:hover {
      background: var(--surface-3);
    }
  }

  // === 信息区域样式 ===
  .character-info {
    padding: var(--card-padding-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-tight);
  }

  .character-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .character-name {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    line-height: var(--leading-tight);
    margin: 0;

    // 文本截断
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .character-creator {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
    line-height: var(--leading-normal);
  }

  .character-description {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;

    // 多行文本截断
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .character-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .character-stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-1);
    border-top: var(--space-px) solid var(--border-secondary);
  }

  .character-stat {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-tertiary);
    font-size: var(--text-xs);
  }

  .character-rating {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--warning);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
  }

  // === 交互状态 ===

  // 悬浮状态
  &:hover {
    .character-avatar {
      transform: scale(1.05);
    }

    .character-overlay {
      opacity: 1;
      transform: translateY(0);
    }

    .character-name {
      color: var(--tavern-primary);
    }
  }

  // === 响应式设计 ===

  // 移动端优化
  @media (max-width: 640px) {
    min-height: calc(var(--space-48) + var(--space-20)); // 272px

    .character-avatar-section {
      min-height: var(--space-48); // 192px
    }

    .character-overlay {
      // 移动端始终显示操作按钮
      opacity: 1;
      transform: translateY(0);
      position: static;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.9) 0%,
        rgba(0, 0, 0, 0.6) 70%,
        transparent 100%
      );
      padding: var(--space-3);
    }

    .character-actions {
      flex-direction: column;
      gap: var(--space-2);

      .character-action-primary,
      .character-action-secondary {
        width: 100%;
        min-height: var(--space-11); // 44px - 触控目标
      }
    }

    .character-info {
      padding: var(--space-3);
      gap: var(--space-2);
    }

    .character-name {
      font-size: var(--text-base);
    }

    .character-description {
      font-size: var(--text-xs);
      -webkit-line-clamp: 1; // 移动端只显示一行
    }

    .character-stats {
      gap: var(--space-2);
    }
  }

  // 平板端适配
  @media (min-width: 641px) and (max-width: 1024px) {
    .character-avatar-section {
      min-height: var(--space-56); // 224px
    }
  }

  // 触控设备优化
  @media (hover: none) and (pointer: coarse) {
    .character-overlay {
      opacity: 1;
      transform: translateY(0);
    }

    &:active {
      transform: scale(0.98);
      transition: transform var(--duration-fast) ease;
    }

    // 确保所有按钮符合最小触控尺寸
    .character-favorite,
    .character-action-primary,
    .character-action-secondary {
      min-height: var(--space-11); // 44px
      min-width: var(--space-11);
    }
  }

  // === 可访问性优化 ===

  // 焦点样式
  .character-favorite:focus,
  .character-action-primary:focus,
  .character-action-secondary:focus {
    outline: var(--space-px-2) solid var(--focus-ring);
    outline-offset: var(--space-px-2);
  }

  // 动画减少偏好
  @media (prefers-reduced-motion: reduce) {
    .character-avatar {
      transition: none;
    }

    .character-overlay {
      transition: none;
    }

    &:hover .character-avatar {
      transform: none;
    }
  }
}
</style>