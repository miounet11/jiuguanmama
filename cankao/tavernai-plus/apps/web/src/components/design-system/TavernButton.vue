<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="tag === 'button' ? type : undefined"
    :to="tag === 'router-link' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    @click="handleClick"
  >
    <TavernIcon
      v-if="loading"
      name="spinner"
      class="tavern-button__loading"
    />
    <TavernIcon
      v-else-if="iconLeft"
      :name="iconLeft"
      class="tavern-button__icon tavern-button__icon--left"
    />

    <span v-if="slots.default" class="tavern-button__content">
      <slot />
    </span>

    <TavernIcon
      v-if="iconRight && !loading"
      :name="iconRight"
      class="tavern-button__icon tavern-button__icon--right"
    />
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots, type Component } from 'vue'

// Types
export interface TavernButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  iconLeft?: string
  iconRight?: string
  type?: 'button' | 'submit' | 'reset'
  // Navigation props
  to?: string | object
  href?: string
  external?: boolean
}

// Props
const props = withDefaults(defineProps<TavernButtonProps>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
  type: 'button',
  external: false
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Slots
const slots = useSlots()

// Computed
const tag = computed((): string | Component => {
  if (props.href) {
    return props.external ? 'a' : 'router-link'
  }
  return 'button'
})

const buttonClasses = computed(() => [
  'tavern-button',
  `tavern-button--${props.variant}`,
  `tavern-button--${props.size}`,
  {
    'tavern-button--loading': props.loading,
    'tavern-button--disabled': props.disabled,
    'tavern-button--full-width': props.fullWidth,
    'tavern-button--icon-only': !slots.default && (props.iconLeft || props.iconRight)
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
.tavern-button {
  // 基础样式
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  // 使用Design Tokens
  border: var(--space-px) solid transparent;
  border-radius: var(--button-radius);
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  // 交互状态
  cursor: pointer;
  user-select: none;
  transition: var(--button-transition);

  // 焦点样式
  &:focus-visible {
    outline: var(--space-px-2) solid var(--focus-ring);
    outline-offset: var(--space-px-2);
  }

  // 禁用状态
  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  // 加载状态
  &--loading {
    cursor: wait;

    .tavern-button__content {
      opacity: 0.7;
    }
  }

  // 全宽按钮
  &--full-width {
    width: 100%;
  }

  // 图标按钮
  &--icon-only {
    aspect-ratio: 1;
    padding: var(--component-padding-md) !important;
  }

  // === 变体样式 ===

  // Primary变体
  &--primary {
    background: var(--tavern-primary);
    color: var(--tavern-primary-text);
    border-color: var(--tavern-primary);

    &:hover:not(:disabled) {
      background: var(--tavern-primary-hover);
      border-color: var(--tavern-primary-hover);
      transform: translateY(calc(-1 * var(--space-px)));
    }

    &:active:not(:disabled) {
      background: var(--tavern-primary-active);
      border-color: var(--tavern-primary-active);
      transform: translateY(0);
    }
  }

  // Secondary变体
  &--secondary {
    background: var(--tavern-secondary);
    color: var(--tavern-secondary-text);
    border-color: var(--tavern-secondary);

    &:hover:not(:disabled) {
      background: var(--tavern-secondary-hover);
      border-color: var(--tavern-secondary-hover);
    }

    &:active:not(:disabled) {
      background: var(--tavern-secondary-active);
      border-color: var(--tavern-secondary-active);
    }
  }

  // Tertiary变体
  &--tertiary {
    background: transparent;
    color: var(--text-primary);
    border-color: var(--border-secondary);

    &:hover:not(:disabled) {
      background: var(--surface-2);
      border-color: var(--border-primary);
    }

    &:active:not(:disabled) {
      background: var(--surface-3);
    }
  }

  // Ghost变体
  &--ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: transparent;

    &:hover:not(:disabled) {
      background: var(--surface-2);
      color: var(--text-primary);
    }

    &:active:not(:disabled) {
      background: var(--surface-3);
    }
  }

  // Danger变体
  &--danger {
    background: var(--error);
    color: var(--error-text);
    border-color: var(--error);

    &:hover:not(:disabled) {
      background: var(--error-hover);
      border-color: var(--error-hover);
    }

    &:active:not(:disabled) {
      background: var(--error-active);
      border-color: var(--error-active);
    }
  }

  // === 尺寸样式 ===

  // Extra Small
  &--xs {
    height: var(--space-6); // 24px
    padding: 0 var(--space-2);
    font-size: var(--text-xs);

    .tavern-button__icon {
      font-size: var(--space-3);
    }
  }

  // Small
  &--sm {
    height: var(--space-8); // 32px
    padding: 0 var(--space-3);
    font-size: var(--text-sm);

    .tavern-button__icon {
      font-size: var(--space-4);
    }
  }

  // Medium (默认)
  &--md {
    height: var(--space-11); // 44px - 最佳触控目标
    padding: 0 var(--component-padding-md);
    font-size: var(--text-base);

    .tavern-button__icon {
      font-size: var(--space-5);
    }
  }

  // Large
  &--lg {
    height: var(--space-12); // 48px
    padding: 0 var(--space-6);
    font-size: var(--text-lg);

    .tavern-button__icon {
      font-size: var(--space-6);
    }
  }

  // Extra Large
  &--xl {
    height: var(--space-14); // 56px
    padding: 0 var(--space-8);
    font-size: var(--text-xl);

    .tavern-button__icon {
      font-size: var(--space-7);
    }
  }

  // === 图标样式 ===

  &__icon {
    flex-shrink: 0;

    &--left {
      margin-right: calc(-1 * var(--space-1));
    }

    &--right {
      margin-left: calc(-1 * var(--space-1));
    }
  }

  &__loading {
    position: absolute;
    animation: spin var(--duration-slow) linear infinite;
  }

  &__content {
    transition: opacity var(--duration-fast) ease;
  }
}

// 加载动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>