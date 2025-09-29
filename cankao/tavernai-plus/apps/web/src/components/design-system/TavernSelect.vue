<template>
  <div class="tavern-select-wrapper">
    <el-select
      v-model="modelValue"
      v-bind="$attrs"
      :class="[
        'tavern-select',
        `tavern-select--${variant}`,
        `tavern-select--${size}`,
        {
          'tavern-select--error': error,
          'tavern-select--disabled': disabled,
          'tavern-select--loading': loading
        }
      ]"
      :disabled="disabled || loading"
      :loading="loading"
      :placeholder="placeholder"
      :clearable="clearable"
      :filterable="filterable"
      :multiple="multiple"
      :collapse-tags="multiple && collapseTags"
      :collapse-tags-tooltip="multiple && collapseTagsTooltip"
      :max-collapse-tags="multiple ? maxCollapseTags : undefined"
      :teleported="teleported"
      :persistent="persistent"
      :automatic-dropdown="automaticDropdown"
      :size="elSize"
      :effect="effect"
      :validate-event="validateEvent"
      @change="$emit('change', $event)"
      @visible-change="$emit('visible-change', $event)"
      @remove-tag="$emit('remove-tag', $event)"
      @clear="$emit('clear')"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    >
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>

      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>

      <slot />
    </el-select>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="tavern-select__error">
      <TavernIcon name="error" size="sm" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 帮助信息 -->
    <div v-if="helpMessage" class="tavern-select__help">
      <TavernIcon name="info" size="sm" />
      <span>{{ helpMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElSelect } from 'element-plus'
import TavernIcon from './TavernIcon.vue'

export interface TavernSelectProps {
  modelValue?: any
  variant?: 'primary' | 'secondary' | 'neutral'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  clearable?: boolean
  filterable?: boolean
  multiple?: boolean
  collapseTags?: boolean
  collapseTagsTooltip?: boolean
  maxCollapseTags?: number
  teleported?: boolean
  persistent?: boolean
  automaticDropdown?: boolean
  effect?: 'light' | 'dark'
  validateEvent?: boolean
  error?: boolean
  errorMessage?: string
  helpMessage?: string
}

const props = withDefaults(defineProps<TavernSelectProps>(), {
  variant: 'primary',
  size: 'md',
  placeholder: '请选择',
  disabled: false,
  loading: false,
  clearable: false,
  filterable: false,
  multiple: false,
  collapseTags: false,
  collapseTagsTooltip: false,
  maxCollapseTags: 1,
  teleported: true,
  persistent: true,
  automaticDropdown: false,
  effect: 'light',
  validateEvent: true,
  error: false,
  errorMessage: '',
  helpMessage: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
  'visible-change': [visible: boolean]
  'remove-tag': [tag: any]
  clear: []
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const elSize = computed(() => {
  switch (props.size) {
    case 'xs': return 'small'
    case 'sm': return 'small'
    case 'lg': return 'large'
    case 'xl': return 'large'
    default: return 'default'
  }
})
</script>

<style lang="scss" scoped>
.tavern-select-wrapper {
  position: relative;

  .tavern-select {
    width: 100%;

    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-input) {
      font-size: var(--input-font-size);
      border-radius: var(--input-radius);
      border: 1px solid var(--input-border-color);
      background: var(--input-bg);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--input-border-hover-color);
      }

      &.is-focus {
        border-color: var(--tavern-primary);
        box-shadow: 0 0 0 2px rgba(var(--tavern-primary-rgb), 0.1);
      }

      .el-input__inner {
        color: var(--text-color);
        background: transparent;
        border: none;
        padding: var(--input-padding);

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }

    // 变体样式
    &--primary {
      :deep(.el-input.is-focus) {
        border-color: var(--tavern-primary);
        box-shadow: 0 0 0 2px rgba(var(--tavern-primary-rgb), 0.1);
      }
    }

    &--secondary {
      :deep(.el-input.is-focus) {
        border-color: var(--tavern-secondary);
        box-shadow: 0 0 0 2px rgba(var(--tavern-secondary-rgb), 0.1);
      }
    }

    &--error {
      :deep(.el-input) {
        border-color: var(--tavern-error);

        &.is-focus {
          border-color: var(--tavern-error);
          box-shadow: 0 0 0 2px rgba(var(--tavern-error-rgb), 0.1);
        }
      }
    }

    &--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &--loading {
      :deep(.el-input .el-input__inner) {
        cursor: wait;
      }
    }

    // 尺寸样式
    &--xs {
      :deep(.el-input) {
        --input-font-size: 12px;
        --input-padding: 4px 8px;
        --input-radius: 4px;
      }
    }

    &--sm {
      :deep(.el-input) {
        --input-font-size: 14px;
        --input-padding: 6px 12px;
        --input-radius: 6px;
      }
    }

    &--md {
      :deep(.el-input) {
        --input-font-size: 16px;
        --input-padding: 8px 16px;
        --input-radius: 8px;
      }
    }

    &--lg {
      :deep(.el-input) {
        --input-font-size: 18px;
        --input-padding: 12px 20px;
        --input-radius: 10px;
      }
    }

    &--xl {
      :deep(.el-input) {
        --input-font-size: 20px;
        --input-padding: 16px 24px;
        --input-radius: 12px;
      }
    }
  }

  .tavern-select__error {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--tavern-error);
    line-height: 1.4;
  }

  .tavern-select__help {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
  }
}

// 下拉菜单样式覆盖
:deep(.el-select-dropdown) {
  border: 1px solid var(--border-color);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  box-shadow: var(--shadow-lg);

  .el-select-dropdown__item {
    color: var(--text-color);
    padding: 8px 16px;
    font-size: 14px;

    &:hover {
      background: var(--bg-hover);
    }

    &.selected {
      color: var(--tavern-primary);
      background: rgba(var(--tavern-primary-rgb), 0.1);
    }

    &.hover {
      background: var(--bg-hover);
    }
  }

  .el-select-dropdown__empty {
    padding: 16px;
    color: var(--text-muted);
    text-align: center;
  }
}

// 暗色主题适配
.dark {
  :deep(.el-select-dropdown) {
    background: var(--card-bg-dark);
    border-color: var(--border-color-dark);

    .el-select-dropdown__item {
      color: var(--text-color-dark);

      &:hover,
      &.hover {
        background: var(--bg-hover-dark);
      }

      &.selected {
        background: rgba(var(--tavern-primary-rgb), 0.2);
      }
    }

    .el-select-dropdown__empty {
      color: var(--text-muted-dark);
    }
  }
}
</style>
