<template>
  <component
    :is="tag"
    :class="badgeClasses"
    :to="tag === 'router-link' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    @click="handleClick"
  >
    <TavernIcon
      v-if="icon"
      :name="icon"
      class="tavern-badge__icon"
      :size="iconSize"
    />

    <span v-if="$slots.default" class="tavern-badge__content">
      <slot />
    </span>

    <button
      v-if="closable"
      type="button"
      class="tavern-badge__close"
      @click.stop="handleClose"
    >
      <TavernIcon name="x" :size="iconSize" />
    </button>

    <!-- 数字徽章的特殊处理 -->
    <span v-if="count !== undefined" class="tavern-badge__count">
      {{ displayCount }}
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import TavernIcon from './TavernIcon.vue'

// Types
export interface TavernBadgeProps {
  // 内容
  text?: string
  count?: number
  maxCount?: number

  // 外观
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  shape?: 'rounded' | 'pill' | 'square'

  // 功能
  icon?: string
  closable?: boolean
  dot?: boolean // 仅显示圆点，无文字

  // 导航
  to?: string | object
  href?: string
  external?: boolean

  // 状态
  disabled?: boolean
  outlined?: boolean
  soft?: boolean // 柔和背景色
}

// Props
const props = withDefaults(defineProps<TavernBadgeProps>(), {
  variant: 'neutral',
  size: 'md',
  shape: 'rounded',
  maxCount: 99,
  external: false,
  disabled: false,
  outlined: false,
  soft: false,
  dot: false
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
  close: []
}>()

// Computed
const tag = computed((): string | Component => {
  if (props.href) {
    return props.external ? 'a' : 'router-link'
  }
  if (props.to) {
    return 'router-link'
  }
  return 'span'
})

const badgeClasses = computed(() => [
  'tavern-badge',
  `tavern-badge--${props.variant}`,
  `tavern-badge--${props.size}`,
  `tavern-badge--${props.shape}`,
  {
    'tavern-badge--outlined': props.outlined,
    'tavern-badge--soft': props.soft,
    'tavern-badge--disabled': props.disabled,
    'tavern-badge--clickable': props.to || props.href,
    'tavern-badge--closable': props.closable,
    'tavern-badge--dot': props.dot,
    'tavern-badge--count': props.count !== undefined,
    'tavern-badge--icon-only': props.icon && !$slots.default && props.count === undefined
  }
])

const iconSize = computed(() => {
  const sizeMap = {
    xs: 'xs',
    sm: 'xs',
    md: 'sm',
    lg: 'md'
  }
  return sizeMap[props.size]
})

const displayCount = computed(() => {
  if (props.count === undefined) return undefined
  if (props.count <= props.maxCount) return props.count
  return `${props.maxCount}+`
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event)
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss">
.tavern-badge {
  // 基础布局
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);

  // 基础样式
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  border: var(--space-px) solid transparent;
  transition: var(--duration-fast) ease;

  // === 尺寸变体 ===

  &--xs {
    height: var(--space-4); // 16px
    padding: 0 var(--space-1-5);
    font-size: var(--text-xs);
    border-radius: var(--radius-xs);

    &.tavern-badge--pill {
      border-radius: var(--space-2);
    }

    &.tavern-badge--square {
      border-radius: 0;
    }
  }

  &--sm {
    height: var(--space-5); // 20px
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
    border-radius: var(--radius-sm);

    &.tavern-badge--pill {
      border-radius: var(--space-2-5);
    }

    &.tavern-badge--square {
      border-radius: 0;
    }
  }

  &--md {
    height: var(--space-6); // 24px
    padding: 0 var(--space-2-5);
    font-size: var(--text-sm);
    border-radius: var(--radius-md);

    &.tavern-badge--pill {
      border-radius: var(--space-3);
    }

    &.tavern-badge--square {
      border-radius: 0;
    }
  }

  &--lg {
    height: var(--space-8); // 32px
    padding: 0 var(--space-3);
    font-size: var(--text-base);
    border-radius: var(--radius-lg);

    &.tavern-badge--pill {
      border-radius: var(--space-4);
    }

    &.tavern-badge--square {
      border-radius: 0;
    }
  }

  // === 变体样式 ===

  // Primary
  &--primary {
    background: var(--tavern-primary);
    color: var(--tavern-primary-text);

    &.tavern-badge--outlined {
      background: transparent;
      color: var(--tavern-primary);
      border-color: var(--tavern-primary);
    }

    &.tavern-badge--soft {
      background: rgba(var(--brand-primary-500), 0.1);
      color: var(--tavern-primary);
    }
  }

  // Secondary
  &--secondary {
    background: var(--tavern-secondary);
    color: var(--tavern-secondary-text);

    &.tavern-badge--outlined {
      background: transparent;
      color: var(--tavern-secondary);
      border-color: var(--tavern-secondary);
    }

    &.tavern-badge--soft {
      background: rgba(var(--brand-secondary-500), 0.1);
      color: var(--tavern-secondary);
    }
  }

  // Success
  &--success {
    background: var(--success);
    color: var(--success-text);

    &.tavern-badge--outlined {
      background: transparent;
      color: var(--success);
      border-color: var(--success);
    }

    &.tavern-badge--soft {
      background: rgba(var(--success), 0.1);
      color: var(--success);
    }
  }

  // Warning
  &--warning {
    background: var(--warning);
    color: var(--warning-text);

    &.tavern-badge--outlined {
      background: transparent;
      color: var(--warning);
      border-color: var(--warning);
    }

    &.tavern-badge--soft {
      background: rgba(var(--warning), 0.1);
      color: var(--warning);
    }
  }

  // Error
  &--error {
    background: var(--error);
    color: var(--error-text);

    &.tavern-badge--outlined {
      background: transparent;
      color: var(--error);
      border-color: var(--error);
    }

    &.tavern-badge--soft {
      background: rgba(var(--error), 0.1);
      color: var(--error);
    }
  }

  // Info
  &--info {
    background: var(--info);
    color: var(--info-text);

    &.tavern-badge--outlined {
      background: transparent;
      color: var(--info);
      border-color: var(--info);
    }

    &.tavern-badge--soft {
      background: rgba(var(--info), 0.1);
      color: var(--info);
    }
  }

  // Neutral
  &--neutral {
    background: var(--surface-4);
    color: var(--text-secondary);

    &.tavern-badge--outlined {
      background: transparent;
      color: var(--text-secondary);
      border-color: var(--border-secondary);
    }

    &.tavern-badge--soft {
      background: var(--surface-3);
      color: var(--text-secondary);
    }
  }

  // === 状态修饰 ===

  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(calc(-1 * var(--space-px)));
      opacity: 0.9;
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  // === 特殊形态 ===

  // 纯圆点
  &--dot {
    width: var(--space-2);
    height: var(--space-2);
    min-width: var(--space-2);
    padding: 0;
    border-radius: var(--radius-full);

    .tavern-badge__content,
    .tavern-badge__icon {
      display: none;
    }

    &.tavern-badge--sm {
      width: var(--space-2-5);
      height: var(--space-2-5);
      min-width: var(--space-2-5);
    }

    &.tavern-badge--md {
      width: var(--space-3);
      height: var(--space-3);
      min-width: var(--space-3);
    }

    &.tavern-badge--lg {
      width: var(--space-4);
      height: var(--space-4);
      min-width: var(--space-4);
    }
  }

  // 数字徽章
  &--count {
    min-width: var(--space-6);
    border-radius: var(--radius-full);
    text-align: center;

    &.tavern-badge--xs {
      min-width: var(--space-4);
    }

    &.tavern-badge--sm {
      min-width: var(--space-5);
    }

    &.tavern-badge--lg {
      min-width: var(--space-8);
    }
  }

  // 仅图标
  &--icon-only {
    aspect-ratio: 1;
    padding: 0;
  }

  // === 子元素 ===

  &__icon {
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    text-align: center;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    margin-left: var(--space-1);
    background: none;
    border: none;
    border-radius: var(--radius-xs);
    color: currentColor;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity var(--duration-fast) ease;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.2);
    }

    &:focus-visible {
      outline: var(--space-px) solid currentColor;
      outline-offset: var(--space-px);
    }
  }

  &__count {
    flex: 1;
    text-align: center;
  }
}

// === 位置徽章工具类 ===

.tavern-badge-wrapper {
  position: relative;
  display: inline-block;

  .tavern-badge {
    position: absolute;
    z-index: 1;

    // 预设位置
    &--top-right {
      top: calc(-1 * var(--space-2));
      right: calc(-1 * var(--space-2));
    }

    &--top-left {
      top: calc(-1 * var(--space-2));
      left: calc(-1 * var(--space-2));
    }

    &--bottom-right {
      bottom: calc(-1 * var(--space-2));
      right: calc(-1 * var(--space-2));
    }

    &--bottom-left {
      bottom: calc(-1 * var(--space-2));
      left: calc(-1 * var(--space-2));
    }
  }
}
</style>