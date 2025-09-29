<template>
  <el-tooltip
    v-bind="$attrs"
    :class="[
      'tavern-tooltip',
      `tavern-tooltip--${variant}`,
      `tavern-tooltip--${size}`
    ]"
    :content="content"
    :placement="placement"
    :effect="effect"
    :disabled="disabled"
    :offset="offset"
    :transition="transition"
    :visible-arrow="visibleArrow"
    :arrow-offset="arrowOffset"
    :append-to="appendTo"
    :popper-class="popperClass"
    :popper-options="popperOptions"
    :show-after="showAfter"
    :hide-after="hideAfter"
    :auto-close="autoClose"
    :manual="manual"
    :trigger="trigger"
    :trigger-keys="triggerKeys"
    :virtual-ref="virtualRef"
    :virtual-triggering="virtualTriggering"
    :on-visible-change="onVisibleChange"
    :on-click-outside="onClickOutside"
    :persistent="persistent"
    :raw-content="rawContent"
    :aria-label="ariaLabel"
    :teleported="teleported"
  >
    <template #content>
      <div class="tavern-tooltip__content">
        <!-- 图标和标题 -->
        <div v-if="icon || title" class="tavern-tooltip__header">
          <TavernIcon v-if="icon" :name="icon" :size="iconSize" class="tavern-tooltip__icon" />
          <div v-if="title" class="tavern-tooltip__title">{{ title }}</div>
        </div>

        <!-- 主要内容 -->
        <div class="tavern-tooltip__body">
          <slot name="content">{{ content }}</slot>
        </div>

        <!-- 底部操作 -->
        <div v-if="$slots.footer" class="tavern-tooltip__footer">
          <slot name="footer" />
        </div>
      </div>
    </template>

    <slot>
      <span class="tavern-tooltip__trigger">
        <TavernIcon v-if="triggerIcon" :name="triggerIcon" :size="triggerIconSize" />
        <span v-if="triggerText">{{ triggerText }}</span>
      </span>
    </slot>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElTooltip } from 'element-plus'
import TavernIcon from './TavernIcon.vue'

export interface TavernTooltipProps {
  content?: string
  title?: string
  icon?: string
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  triggerIcon?: string
  triggerIconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  triggerText?: string
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end'
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  effect?: 'dark' | 'light'
  disabled?: boolean
  offset?: number
  transition?: string
  visibleArrow?: boolean
  arrowOffset?: number
  appendTo?: string | HTMLElement
  popperClass?: string
  popperOptions?: object
  showAfter?: number
  hideAfter?: number
  autoClose?: number
  manual?: boolean
  trigger?: 'hover' | 'click' | 'focus' | 'contextmenu'
  triggerKeys?: string[]
  virtualRef?: object
  virtualTriggering?: boolean
  onVisibleChange?: (visible: boolean) => void
  onClickOutside?: (event: Event) => void
  persistent?: boolean
  rawContent?: boolean
  ariaLabel?: string
  teleported?: boolean
}

const props = withDefaults(defineProps<TavernTooltipProps>(), {
  placement: 'top',
  variant: 'neutral',
  size: 'md',
  effect: 'dark',
  disabled: false,
  offset: 12,
  transition: 'el-fade-in-linear',
  visibleArrow: true,
  arrowOffset: 5,
  appendTo: 'body',
  showAfter: 0,
  hideAfter: 200,
  autoClose: 0,
  manual: false,
  trigger: 'hover',
  persistent: false,
  rawContent: false,
  teleported: true,
  iconSize: 'sm',
  triggerIconSize: 'sm'
})

const emit = defineEmits<{
  'visible-change': [visible: boolean]
  'click-outside': [event: Event]
}>()

// 计算popper类名
const popperClass = computed(() => {
  const baseClass = 'tavern-tooltip-popper'
  const variantClass = `tavern-tooltip-popper--${props.variant}`
  const sizeClass = `tavern-tooltip-popper--${props.size}`
  const customClass = props.popperClass || ''

  return `${baseClass} ${variantClass} ${sizeClass} ${customClass}`.trim()
})

// 处理可见性变化
const onVisibleChange = (visible: boolean) => {
  emit('visible-change', visible)
  props.onVisibleChange?.(visible)
}

// 处理点击外部
const onClickOutside = (event: Event) => {
  emit('click-outside', event)
  props.onClickOutside?.(event)
}
</script>

<style lang="scss">
/* Tooltip Popper 样式 */
.tavern-tooltip-popper {
  --tooltip-bg: var(--card-bg);
  --tooltip-border-color: var(--border-color);
  --tooltip-text-color: var(--text-color);
  --tooltip-shadow: var(--shadow-lg);
  --tooltip-border-radius: var(--tooltip-radius);
  --tooltip-padding: var(--tooltip-padding);
  --tooltip-font-size: var(--tooltip-font-size);

  border: 1px solid var(--tooltip-border-color);
  background: var(--tooltip-bg);
  color: var(--tooltip-text-color);
  box-shadow: var(--tooltip-shadow);
  border-radius: var(--tooltip-border-radius);
  padding: 0;

  .el-popper__arrow {
    &::before {
      background: var(--tooltip-bg);
      border: 1px solid var(--tooltip-border-color);
    }
  }

  .tavern-tooltip__content {
    padding: var(--tooltip-padding);
    font-size: var(--tooltip-font-size);
    line-height: 1.5;
    max-width: 300px;
    word-wrap: break-word;

    .tavern-tooltip__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);

      .tavern-tooltip__icon {
        flex-shrink: 0;
        color: var(--tavern-primary);
      }

      .tavern-tooltip__title {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-color);
      }
    }

    .tavern-tooltip__body {
      color: var(--text-color);

      :deep(p) {
        margin: 0 0 8px 0;

        &:last-child {
          margin-bottom: 0;
        }
      }

      :deep(ul), :deep(ol) {
        margin: 8px 0;
        padding-left: 20px;

        li {
          margin: 4px 0;
        }
      }

      :deep(code) {
        background: var(--bg-secondary);
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 0.9em;
        color: var(--tavern-primary);
      }

      :deep(pre) {
        background: var(--bg-secondary);
        padding: 8px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 8px 0;

        code {
          background: transparent;
          padding: 0;
        }
      }
    }

    .tavern-tooltip__footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }

  // 变体样式
  &--primary {
    --tooltip-bg: var(--card-bg);
    --tooltip-border-color: var(--tavern-primary);
  }

  &--secondary {
    --tooltip-bg: var(--card-bg);
    --tooltip-border-color: var(--tavern-secondary);
  }

  &--neutral {
    --tooltip-bg: var(--card-bg);
    --tooltip-border-color: var(--border-color);
  }

  &--success {
    --tooltip-bg: rgba(var(--tavern-success-rgb), 0.1);
    --tooltip-border-color: var(--tavern-success);
  }

  &--warning {
    --tooltip-bg: rgba(var(--tavern-warning-rgb), 0.1);
    --tooltip-border-color: var(--tavern-warning);
  }

  &--error {
    --tooltip-bg: rgba(var(--tavern-error-rgb), 0.1);
    --tooltip-border-color: var(--tavern-error);
  }

  // 尺寸样式
  &--sm {
    --tooltip-radius: 4px;
    --tooltip-padding: 8px 12px;
    --tooltip-font-size: 12px;
  }

  &--md {
    --tooltip-radius: 6px;
    --tooltip-padding: 12px 16px;
    --tooltip-font-size: 14px;
  }

  &--lg {
    --tooltip-radius: 8px;
    --tooltip-padding: 16px 20px;
    --tooltip-font-size: 16px;
  }
}

/* 暗色主题适配 */
.dark {
  .tavern-tooltip-popper {
    --tooltip-bg: var(--card-bg-dark);
    --tooltip-border-color: var(--border-color-dark);
    --tooltip-text-color: var(--text-color-dark);

    .tavern-tooltip__content {
      .tavern-tooltip__header {
        border-bottom-color: var(--border-color-dark);

        .tavern-tooltip__title {
          color: var(--text-color-dark);
        }
      }

      .tavern-tooltip__body {
        color: var(--text-color-dark);

        :deep(code) {
          background: var(--bg-secondary-dark);
        }

        :deep(pre) {
          background: var(--bg-secondary-dark);
        }
      }

      .tavern-tooltip__footer {
        border-top-color: var(--border-color-dark);
      }
    }

    .el-popper__arrow {
      &::before {
        background: var(--tooltip-bg);
        border-color: var(--tooltip-border-color);
      }
    }
  }
}

/* 触发器样式 */
.tavern-tooltip__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: help;
  border-bottom: 1px dotted var(--text-muted);
  transition: all 0.2s ease;

  &:hover {
    border-bottom-color: var(--tavern-primary);
    color: var(--tavern-primary);
  }
}
</style>
