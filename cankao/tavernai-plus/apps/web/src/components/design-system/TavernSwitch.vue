<template>
  <div class="tavern-switch-wrapper">
    <el-switch
      v-model="modelValue"
      v-bind="$attrs"
      :class="[
        'tavern-switch',
        `tavern-switch--${variant}`,
        `tavern-switch--${size}`,
        {
          'tavern-switch--loading': loading,
          'tavern-switch--disabled': disabled
        }
      ]"
      :disabled="disabled || loading"
      :loading="loading"
      :width="switchWidth"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :border-color="borderColor"
      :validate-event="validateEvent"
      @change="$emit('change', $event)"
      @input="$emit('input', $event)"
    />

    <!-- 标签 -->
    <label v-if="label" class="tavern-switch__label" :class="{ 'tavern-switch__label--disabled': disabled }">
      {{ label }}
      <span v-if="required" class="tavern-switch__required">*</span>
    </label>

    <!-- 帮助信息 -->
    <div v-if="helpMessage" class="tavern-switch__help">
      <TavernIcon name="info" size="sm" />
      <span>{{ helpMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElSwitch } from 'element-plus'
import TavernIcon from './TavernIcon.vue'

export interface TavernSwitchProps {
  modelValue?: boolean | string | number
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  width?: number
  activeIcon?: string
  inactiveIcon?: string
  activeText?: string
  inactiveText?: string
  activeValue?: boolean | string | number
  inactiveValue?: boolean | string | number
  activeColor?: string
  inactiveColor?: string
  borderColor?: string
  validateEvent?: boolean
  label?: string
  required?: boolean
  helpMessage?: string
}

const props = withDefaults(defineProps<TavernSwitchProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  activeValue: true,
  inactiveValue: false,
  validateEvent: true,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string | number]
  change: [value: boolean | string | number]
  input: [value: boolean | string | number]
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const switchWidth = computed(() => {
  if (props.width) return props.width

  switch (props.size) {
    case 'sm': return 36
    case 'lg': return 56
    default: return 44
  }
})

const activeColor = computed(() => {
  if (props.activeColor) return props.activeColor

  switch (props.variant) {
    case 'primary': return 'var(--tavern-primary)'
    case 'secondary': return 'var(--tavern-secondary)'
    case 'success': return 'var(--tavern-success)'
    case 'warning': return 'var(--tavern-warning)'
    case 'error': return 'var(--tavern-error)'
    default: return 'var(--tavern-primary)'
  }
})

const inactiveColor = computed(() => {
  if (props.inactiveColor) return props.inactiveColor
  return 'var(--bg-tertiary)'
})

const borderColor = computed(() => {
  if (props.borderColor) return props.borderColor
  return 'var(--border-color)'
})
</script>

<style lang="scss" scoped>
.tavern-switch-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;

  .tavern-switch {
    :deep(.el-switch) {
      --el-switch-on-color: v-bind(activeColor);
      --el-switch-off-color: v-bind(inactiveColor);
      --el-switch-border-color: v-bind(borderColor);

      .el-switch__core {
        border-radius: var(--switch-radius);
        transition: all 0.3s ease;

        &::after {
          border-radius: calc(var(--switch-radius) - 2px);
          transition: all 0.3s ease;
        }
      }

      .el-switch__label {
        color: var(--text-color);
        font-size: var(--switch-font-size);

        &.is-active {
          color: var(--tavern-primary);
        }
      }
    }

    // 变体样式
    &--primary {
      :deep(.el-switch.is-checked .el-switch__core::after) {
        background: var(--tavern-primary-text, white);
      }
    }

    &--secondary {
      :deep(.el-switch.is-checked) {
        --el-switch-on-color: var(--tavern-secondary);
      }

      :deep(.el-switch.is-checked .el-switch__core::after) {
        background: var(--tavern-secondary-text, white);
      }
    }

    &--success {
      :deep(.el-switch.is-checked) {
        --el-switch-on-color: var(--tavern-success);
      }

      :deep(.el-switch.is-checked .el-switch__core::after) {
        background: white;
      }
    }

    &--warning {
      :deep(.el-switch.is-checked) {
        --el-switch-on-color: var(--tavern-warning);
      }

      :deep(.el-switch.is-checked .el-switch__core::after) {
        background: white;
      }
    }

    &--error {
      :deep(.el-switch.is-checked) {
        --el-switch-on-color: var(--tavern-error);
      }

      :deep(.el-switch.is-checked .el-switch__core::after) {
        background: white;
      }
    }

    // 尺寸样式
    &--sm {
      --switch-radius: 12px;
      --switch-font-size: 12px;

      :deep(.el-switch) {
        --el-switch-height: 20px;
        --el-switch-width: 36px;
      }

      :deep(.el-switch__core) {
        width: 32px !important;
        height: 16px !important;
      }

      :deep(.el-switch__core::after) {
        width: 12px;
        height: 12px;
      }
    }

    &--md {
      --switch-radius: 16px;
      --switch-font-size: 14px;

      :deep(.el-switch) {
        --el-switch-height: 24px;
        --el-switch-width: 44px;
      }

      :deep(.el-switch__core) {
        width: 40px !important;
        height: 20px !important;
      }

      :deep(.el-switch__core::after) {
        width: 16px;
        height: 16px;
      }
    }

    &--lg {
      --switch-radius: 20px;
      --switch-font-size: 16px;

      :deep(.el-switch) {
        --el-switch-height: 28px;
        --el-switch-width: 56px;
      }

      :deep(.el-switch__core) {
        width: 52px !important;
        height: 24px !important;
      }

      :deep(.el-switch__core::after) {
        width: 20px;
        height: 20px;
      }
    }

    // 状态样式
    &--loading {
      :deep(.el-switch) {
        cursor: wait;

        .el-switch__core {
          opacity: 0.8;
        }
      }
    }

    &--disabled {
      :deep(.el-switch) {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .tavern-switch__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;

    &--disabled {
      color: var(--text-muted);
    }
  }

  .tavern-switch__required {
    color: var(--tavern-error);
  }

  .tavern-switch__help {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
    margin-top: 2px;
  }
}

// 暗色主题适配
.dark {
  .tavern-switch-wrapper {
    .tavern-switch {
      :deep(.el-switch) {
        --el-switch-off-color: var(--bg-tertiary-dark);
        --el-switch-border-color: var(--border-color-dark);

        .el-switch__label {
          color: var(--text-color-dark);

          &.is-active {
            color: var(--tavern-primary);
          }
        }
      }
    }

    .tavern-switch__label {
      color: var(--text-color-dark);

      &--disabled {
        color: var(--text-muted-dark);
      }
    }

    .tavern-switch__help {
      color: var(--text-muted-dark);
    }
  }
}
</style>
