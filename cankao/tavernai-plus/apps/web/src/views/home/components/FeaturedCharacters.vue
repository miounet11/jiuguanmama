<template>
  <section class="featured-characters">
    <div class="featured-container">
      <!-- 区块头部 -->
      <div class="featured-header">
        <div class="header-content">
          <div class="header-badge">
            <TavernBadge variant="primary" size="sm" soft>
              <TavernIcon name="star" size="xs" />
              人气推荐
            </TavernBadge>
          </div>

          <h2 class="featured-title">
            精选<span class="title-highlight">AI角色</span>
          </h2>

          <p class="featured-subtitle">
            发现最受欢迎的角色，开启专属对话体验
          </p>
        </div>

        <div class="header-actions">
          <TavernButton
            variant="ghost"
            size="md"
            icon-right="arrow-right"
            @click="exploreAllCharacters"
          >
            查看全部
          </TavernButton>
        </div>
      </div>

      <!-- 角色网格 -->
      <div class="characters-grid" ref="charactersGrid">
        <!-- 加载状态 -->
        <div v-if="loading" class="grid-skeleton">
          <div
            v-for="i in 8"
            :key="`skeleton-${i}`"
            class="skeleton-card"
          >
            <div class="skeleton-avatar" />
            <div class="skeleton-info">
              <div class="skeleton-title" />
              <div class="skeleton-subtitle" />
              <div class="skeleton-description" />
              <div class="skeleton-stats" />
            </div>
          </div>
        </div>

        <!-- 角色列表 -->
        <template v-else>
          <CharacterCard2
            v-for="(character, index) in displayedChars"
            :key="character.id"
            :character="character"
            :aspect-ratio="'4:3'"
            :data-index="index"
            class="featured-char-card"
            @click="onCharacterClick"
            @favorite="onCharacterFavorite"
            @quick-chat-started="onQuickChatStarted"
          />
        </template>

        <!-- 查看更多按钮 (移动端) -->
        <div v-if="!showAll && featuredChars.length > initialDisplayCount" class="show-more-mobile">
          <TavernButton
            variant="tertiary"
            size="lg"
            :full-width="true"
            icon-left="plus"
            @click="showAllCharacters"
          >
            查看更多角色 ({{ featuredChars.length - initialDisplayCount }}+)
          </TavernButton>
        </div>
      </div>

      <!-- 分类标签 -->
      <div class="character-categories">
        <div class="categories-scroll">
          <TavernButton
            v-for="category in categories"
            :key="category.id"
            :variant="selectedCategory === category.id ? 'primary' : 'ghost'"
            size="sm"
            class="category-tag"
            @click="selectCategory(category.id)"
          >
            <TavernIcon :name="category.icon" size="xs" />
            {{ category.name }}
            <TavernBadge
              v-if="category.count"
              variant="neutral"
              size="xs"
              soft
            >
              {{ category.count }}
            </TavernBadge>
          </TavernButton>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="featured-stats">
        <div class="stat-item">
          <TavernIcon name="users" class="stat-icon" />
          <div class="stat-content">
            <span class="stat-number">{{ formatNumber(totalInteractions) }}</span>
            <span class="stat-label">次对话</span>
          </div>
        </div>

        <div class="stat-item">
          <TavernIcon name="heart" class="stat-icon" />
          <div class="stat-content">
            <span class="stat-number">{{ formatNumber(totalFavorites) }}</span>
            <span class="stat-label">收藏数</span>
          </div>
        </div>

        <div class="stat-item">
          <TavernIcon name="sparkles" class="stat-icon" />
          <div class="stat-content">
            <span class="stat-number">{{ averageRating.toFixed(1) }}</span>
            <span class="stat-label">平均评分</span>
          </div>
        </div>

        <div class="stat-item">
          <TavernIcon name="clock" class="stat-icon" />
          <div class="stat-content">
            <span class="stat-number">{{ newCharactersThisWeek }}</span>
            <span class="stat-label">本周新增</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  TavernButton,
  TavernBadge,
  TavernIcon
} from '@/components/design-system'
import CharacterCard2 from '@/components/character/CharacterCard2.vue'
import { useFeatureChars } from '../composables/useFeatureChars'
import { useCharacterStore } from '@/stores/character'
import type { Character } from '@/types/character'

const router = useRouter()
const characterStore = useCharacterStore()
const { featuredChars, loading, categories } = useFeatureChars()

// 响应式数据
const charactersGrid = ref<HTMLElement>()
const selectedCategory = ref<string>('all')
const showAll = ref(false)
const initialDisplayCount = 8

// 计算属性
const displayedChars = computed(() => {
  let filtered = featuredChars.value

  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(char =>
      char.tags?.includes(selectedCategory.value) ||
      char.category === selectedCategory.value
    )
  }

  // 显示数量控制
  if (!showAll.value && filtered.length > initialDisplayCount) {
    return filtered.slice(0, initialDisplayCount)
  }

  return filtered
})

// 统计数据
const totalInteractions = computed(() =>
  featuredChars.value.reduce((sum, char) => sum + (char.chatCount || 0), 0)
)

const totalFavorites = computed(() =>
  featuredChars.value.reduce((sum, char) => sum + (char.favoriteCount || 0), 0)
)

const averageRating = computed(() => {
  const chars = featuredChars.value.filter(char => char.rating > 0)
  if (chars.length === 0) return 0
  return chars.reduce((sum, char) => sum + char.rating, 0) / chars.length
})

const newCharactersThisWeek = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return featuredChars.value.filter(char =>
    new Date(char.createdAt) > oneWeekAgo
  ).length
})

// 方法
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId

  // 平滑滚动到网格顶部
  nextTick(() => {
    charactersGrid.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  })
}

const showAllCharacters = () => {
  showAll.value = true

  // 添加淡入动画
  nextTick(() => {
    const newCards = charactersGrid.value?.querySelectorAll(
      `.featured-char-card:nth-child(n+${initialDisplayCount + 1})`
    )

    newCards?.forEach((card, index) => {
      (card as HTMLElement).style.animationDelay = `${index * 0.1}s`
      card.classList.add('fade-in-up')
    })
  })
}

const exploreAllCharacters = () => {
  router.push('/characters')
}

const onCharacterClick = (character: Character) => {
  router.push(`/characters/${character.id}`)
}

const onCharacterFavorite = async (characterId: string) => {
  try {
    await characterStore.toggleFavorite(characterId)
    ElMessage.success('收藏状态已更新')
  } catch (error) {
    ElMessage.error('操作失败，请稍后重试')
  }
}

const onQuickChatStarted = (characterId: string, sessionId: string) => {
  router.push(`/chat/${sessionId}`)
}

// 生命周期
onMounted(() => {
  // 为卡片添加入场动画
  nextTick(() => {
    const cards = charactersGrid.value?.querySelectorAll('.featured-char-card')

    cards?.forEach((card, index) => {
      (card as HTMLElement).style.animationDelay = `${index * 0.1}s`
      card.classList.add('slide-in-up')
    })
  })
})
</script>

<style lang="scss">
.featured-characters {
  padding: var(--section-padding-y) 0;
  background: var(--surface-1);
  position: relative;

  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(168, 85, 247, 0.03) 100%
    );
    pointer-events: none;
  }

  .featured-container {
    width: 100%;
    max-width: var(--container-2xl);
    margin: 0 auto;
    padding: 0 var(--container-padding);
    position: relative;
    z-index: var(--z-content);
  }

  // === 头部区域 ===
  .featured-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--space-12);
    gap: var(--space-8);
  }

  .header-content {
    flex: 1;

    .header-badge {
      margin-bottom: var(--space-4);
    }
  }

  .featured-title {
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-3) 0;
    line-height: var(--leading-tight);

    .title-highlight {
      background: linear-gradient(
        135deg,
        var(--brand-primary-400),
        var(--brand-accent-400)
      );
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
  }

  .featured-subtitle {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  .header-actions {
    flex-shrink: 0;
  }

  // === 角色网格 ===
  .characters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-12);
  }

  .featured-char-card {
    opacity: 0;
    transform: translateY(var(--space-8));

    &.slide-in-up {
      animation: slideInUp var(--duration-moderate) var(--ease-out) forwards;
    }

    &.fade-in-up {
      animation: fadeInUp var(--duration-moderate) var(--ease-out) forwards;
    }
  }

  // 骨架屏
  .grid-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-6);
  }

  .skeleton-card {
    background: var(--surface-2);
    border-radius: var(--card-radius);
    padding: var(--card-padding-md);
    border: 1px solid var(--border-secondary);

    .skeleton-avatar {
      width: 100%;
      height: 200px;
      background: var(--surface-3);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);

      .skeleton-title {
        height: var(--space-5);
        width: 70%;
        background: var(--surface-3);
        border-radius: var(--radius-base);
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      .skeleton-subtitle {
        height: var(--space-4);
        width: 50%;
        background: var(--surface-3);
        border-radius: var(--radius-base);
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      .skeleton-description {
        height: var(--space-8);
        width: 100%;
        background: var(--surface-3);
        border-radius: var(--radius-base);
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      .skeleton-stats {
        height: var(--space-6);
        width: 80%;
        background: var(--surface-3);
        border-radius: var(--radius-base);
        animation: skeleton-pulse 1.5s ease-in-out infinite;
        margin-top: var(--space-2);
      }
    }
  }

  .show-more-mobile {
    grid-column: 1 / -1;
    margin-top: var(--space-4);
  }

  // === 分类标签 ===
  .character-categories {
    margin-bottom: var(--space-12);
    border-bottom: 1px solid var(--border-secondary);
  }

  .categories-scroll {
    display: flex;
    gap: var(--space-3);
    padding-bottom: var(--space-4);
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .category-tag {
    flex-shrink: 0;
    white-space: nowrap;

    &:hover {
      transform: translateY(-1px);
    }
  }

  // === 统计信息 ===
  .featured-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-6);
    padding: var(--space-8);
    background: var(--surface-2);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-secondary);
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    text-align: left;

    .stat-icon {
      width: var(--space-12);
      height: var(--space-12);
      background: linear-gradient(
        135deg,
        var(--brand-primary-500),
        var(--brand-primary-400)
      );
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      font-size: var(--text-lg);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-0-5);

      .stat-number {
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        color: var(--text-primary);
        line-height: 1;
      }

      .stat-label {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
        line-height: 1;
      }
    }
  }

  // === 响应式设计 ===

  // 平板端
  @media (max-width: 1024px) {
    .characters-grid {
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: var(--space-5);
    }

    .featured-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-4);
    }

    .featured-title {
      font-size: var(--text-3xl);
    }

    .featured-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      padding: var(--space-6);
    }
  }

  // 移动端
  @media (max-width: 640px) {
    padding: var(--space-16) 0;

    .featured-container {
      padding: 0 var(--space-4);
    }

    .featured-header {
      margin-bottom: var(--space-8);
    }

    .featured-title {
      font-size: var(--text-2xl);
    }

    .featured-subtitle {
      font-size: var(--text-base);
    }

    .characters-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    .featured-stats {
      grid-template-columns: 1fr;
      gap: var(--space-4);
      padding: var(--space-4);
    }

    .stat-item {
      .stat-icon {
        width: var(--space-10);
        height: var(--space-10);
        font-size: var(--text-base);
      }

      .stat-content {
        .stat-number {
          font-size: var(--text-xl);
        }
      }
    }

    .categories-scroll {
      gap: var(--space-2);
    }
  }

  // 超小屏幕
  @media (max-width: 480px) {
    .characters-grid {
      grid-template-columns: 1fr;
    }

    .featured-stats {
      .stat-item {
        gap: var(--space-3);

        .stat-icon {
          width: var(--space-8);
          height: var(--space-8);
          font-size: var(--text-sm);
        }
      }
    }
  }
}

// === 动画定义 ===

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(var(--space-8));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(var(--space-4));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
}

// === 可访问性优化 ===

@media (prefers-reduced-motion: reduce) {
  .featured-char-card {
    animation: none !important;
    opacity: 1;
    transform: none;
  }

  .skeleton-card * {
    animation: none;
  }

  .category-tag:hover {
    transform: none;
  }
}

// === 焦点管理 ===

.category-tag:focus,
.header-actions .tavern-button:focus {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>