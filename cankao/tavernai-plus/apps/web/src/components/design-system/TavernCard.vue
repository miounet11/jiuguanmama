<template>
  <component
    :is="tag"
    :class="cardClasses"
    :to="tag === 'router-link' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <header v-if="$slots.header || title" class="tavern-card__header">
      <slot name="header">
        <div v-if="title" class="tavern-card__title">
          <TavernIcon
            v-if="icon"
            :name="icon"
            class="tavern-card__title-icon"
          />
          {{ title }}
        </div>
        <div v-if="subtitle" class="tavern-card__subtitle">
          {{ subtitle }}
        </div>
      </slot>
    </header>

    <!-- 卡片媒体区域 -->
    <div v-if="$slots.media" class="tavern-card__media">
      <slot name="media" />
    </div>

    <!-- 卡片主体 -->
    <div v-if="$slots.default" class="tavern-card__body">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <footer v-if="$slots.footer" class="tavern-card__footer">
      <slot name="footer" />
    </footer>

    <!-- 加载状态覆盖层 -->
    <div v-if="loading" class="tavern-card__loading">
      <TavernIcon name="spinner" size="lg" />
    </div>

    <!-- 悬浮操作层 -->
    <div v-if="$slots.overlay" class="tavern-card__overlay">
      <slot name="overlay" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import TavernIcon from './TavernIcon.vue'

// Types
export interface TavernCardProps {
  // 内容
  title?: string
  subtitle?: string
  icon?: string

  // 外观
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean

  // 状态
  loading?: boolean
  disabled?: boolean
  selected?: boolean

  // 交互
  hoverable?: boolean
  clickable?: boolean

  // 导航
  to?: string | object
  href?: string
  external?: boolean

  // 布局
  direction?: 'vertical' | 'horizontal'
  aspectRatio?: '1:1' | '4:3' | '16:9' | 'auto'
}

// Props
const props = withDefaults(defineProps<TavernCardProps>(), {
  variant: 'default',
  size: 'md',
  rounded: true,
  hoverable: false,
  clickable: false,
  external: false,
  direction: 'vertical',
  aspectRatio: 'auto'
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Computed
const tag = computed((): string | Component => {
  if (props.href) {
    return props.external ? 'a' : 'router-link'
  }
  if (props.clickable || props.to) {
    return 'div'
  }
  return 'div'
})

const cardClasses = computed(() => [
  'tavern-card',
  `tavern-card--${props.variant}`,
  `tavern-card--${props.size}`,
  `tavern-card--${props.direction}`,
  {
    'tavern-card--rounded': props.rounded,
    'tavern-card--hoverable': props.hoverable,
    'tavern-card--clickable': props.clickable || props.to || props.href,
    'tavern-card--loading': props.loading,
    'tavern-card--disabled': props.disabled,
    'tavern-card--selected': props.selected,
    [`tavern-card--aspect-${props.aspectRatio.replace(':', '-')}`]: props.aspectRatio !== 'auto'
  }
])

// Methods
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style lang="scss">
.tavern-card {
  // 基础布局
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // 基础样式
  background: var(--surface-2);
  color: var(--text-primary);
  transition: var(--card-transition);

  // === 变体样式 ===

  // 默认变体
  &--default {
    background: var(--surface-2);
    border: var(--space-px) solid var(--border-secondary);
  }

  // 描边变体
  &--outlined {
    background: transparent;
    border: var(--space-px) solid var(--border-primary);
  }

  // 悬浮变体
  &--elevated {
    background: var(--surface-2);
    box-shadow: var(--card-shadow);
    border: none;
  }

  // 填充变体
  &--filled {
    background: var(--surface-3);
    border: none;
  }

  // === 尺寸变体 ===

  &--sm {
    --card-padding: var(--space-3);
    --card-gap: var(--space-2);
    --card-radius: var(--radius-sm);
  }

  &--md {
    --card-padding: var(--card-padding-md);
    --card-gap: var(--spacing-normal);
    --card-radius: var(--card-radius);
  }

  &--lg {
    --card-padding: var(--space-6);
    --card-gap: var(--space-4);
    --card-radius: var(--radius-lg);
  }

  // === 方向布局 ===

  &--vertical {
    flex-direction: column;
  }

  &--horizontal {
    flex-direction: row;

    .tavern-card__media {
      flex-shrink: 0;
      width: 40%;
    }

    .tavern-card__body {
      flex: 1;
    }
  }

  // === 外观修饰 ===

  &--rounded {
    border-radius: var(--card-radius);
  }

  // === 交互状态 ===

  &--hoverable:hover,
  &--clickable:hover {
    transform: translateY(calc(-1 * var(--space-px)));

    &.tavern-card--elevated {
      box-shadow: var(--card-shadow-hover);
    }

    &.tavern-card--default,
    &.tavern-card--filled {
      box-shadow: var(--card-shadow);
    }
  }

  &--clickable {
    cursor: pointer;
  }

  &--selected {
    border-color: var(--tavern-primary);
    box-shadow: 0 0 0 var(--space-1) rgba(var(--brand-primary-500), 0.1);
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--loading {
    pointer-events: none;
  }

  // === 宽高比 ===

  &--aspect-1-1 {
    aspect-ratio: 1 / 1;
  }

  &--aspect-4-3 {
    aspect-ratio: 4 / 3;
  }

  &--aspect-16-9 {
    aspect-ratio: 16 / 9;
  }

  // === 卡片区域 ===

  &__header {
    padding: var(--card-padding);
    padding-bottom: calc(var(--card-padding) / 2);
    border-bottom: var(--space-px) solid var(--border-secondary);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    line-height: var(--leading-tight);
    margin: 0;
  }

  &__title-icon {
    color: var(--tavern-primary);
  }

  &__subtitle {
    margin-top: var(--space-1);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-normal);
  }

  &__media {
    position: relative;
    overflow: hidden;
    background: var(--surface-4);

    // 媒体内容适配
    img,
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__body {
    flex: 1;
    padding: var(--card-padding);

    // 当同时有header时的间距调整
    .tavern-card__header + & {
      padding-top: calc(var(--card-padding) / 2);
    }

    // 当同时有footer时的间距调整
    & + .tavern-card__footer {
      padding-top: calc(var(--card-padding) / 2);
    }
  }

  &__footer {
    padding: var(--card-padding);
    padding-top: calc(var(--card-padding) / 2);
    border-top: var(--space-px) solid var(--border-secondary);
    background: var(--surface-3);
  }

  // === 特殊层 ===

  &__loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--surface-2), 0.8);
    backdrop-filter: blur(var(--space-1));
    z-index: 10;
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--surface-1), 0.8);
    opacity: 0;
    transition: opacity var(--duration-normal) ease;
    z-index: 5;

    .tavern-card--hoverable:hover &,
    .tavern-card--clickable:hover & {
      opacity: 1;
    }
  }

  // === 内容优化 ===

  // 文本内容的默认样式
  p {
    margin-bottom: var(--space-3);
    line-height: var(--leading-relaxed);
    color: var(--text-secondary);

    &:last-child {
      margin-bottom: 0;
    }
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: var(--space-2);
    color: var(--text-primary);
    line-height: var(--leading-tight);
  }

  // 列表样式
  ul, ol {
    margin-bottom: var(--space-3);
    padding-left: var(--space-5);
  }

  li {
    margin-bottom: var(--space-1);
    line-height: var(--leading-normal);
  }
}

// === 特殊布局 ===

// 卡片网格布局工具类
.tavern-card-grid {
  display: grid;
  gap: var(--spacing-normal);

  &--cols-1 { grid-template-columns: repeat(1, 1fr); }
  &--cols-2 { grid-template-columns: repeat(2, 1fr); }
  &--cols-3 { grid-template-columns: repeat(3, 1fr); }
  &--cols-4 { grid-template-columns: repeat(4, 1fr); }

  @media (max-width: 768px) {
    &--cols-2,
    &--cols-3,
    &--cols-4 {
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    &--cols-3,
    &--cols-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>