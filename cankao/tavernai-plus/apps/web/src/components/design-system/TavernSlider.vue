<template>
  <div class="tavern-slider-wrapper">
    <!-- 标签 -->
    <div v-if="label" class="tavern-slider__label">
      <span>{{ label }}</span>
      <span v-if="required" class="tavern-slider__required">*</span>
      <span v-if="showValue && modelValue !== undefined" class="tavern-slider__value">
        {{ formatValue(modelValue) }}
      </span>
    </div>

    <div class="tavern-slider__content">
      <el-slider
        v-model="modelValue"
        v-bind="$attrs"
        :class="[
          'tavern-slider',
          `tavern-slider--${variant}`,
          `tavern-slider--${size}`,
          {
            'tavern-slider--vertical': vertical,
            'tavern-slider--disabled': disabled,
            'tavern-slider--with-input': showInput
          }
        ]"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :vertical="vertical"
        :height="vertical ? height : undefined"
        :range="range"
        :marks="marks"
        :show-stops="showStops"
        :show-tooltip="showTooltip"
        :format-tooltip="formatTooltip"
        :tooltip-class="tooltipClass"
        :placement="placement"
        :debounce="debounce"
        @input="$emit('input', $event)"
        @change="$emit('change', $event)"
      />

      <!-- 数字输入框 -->
      <div v-if="showInput" class="tavern-slider__input">
        <TavernInput
          v-model.number="inputValue"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
          size="sm"
          type="number"
          @input="handleInputChange"
          @blur="handleInputBlur"
        />
      </div>
    </div>

    <!-- 帮助信息 -->
    <div v-if="helpMessage" class="tavern-slider__help">
      <TavernIcon name="info" size="sm" />
      <span>{{ helpMessage }}</span>
    </div>

    <!-- 刻度标签 -->
    <div v-if="showTicks && !vertical" class="tavern-slider__ticks">
      <span class="tavern-slider__tick-min">{{ formatValue(min) }}</span>
      <span class="tavern-slider__tick-max">{{ formatValue(max) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElSlider } from 'element-plus'
import TavernInput from './TavernInput.vue'
import TavernIcon from './TavernIcon.vue'

export interface TavernSliderProps {
  modelValue?: number | number[]
  label?: string
  required?: boolean
  showValue?: boolean
  valueFormat?: (value: number) => string
  variant?: 'primary' | 'secondary' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  vertical?: boolean
  height?: string
  range?: boolean
  marks?: Record<number, string>
  showStops?: boolean
  showTooltip?: boolean
  formatTooltip?: (value: number) => string
  tooltipClass?: string
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end'
  debounce?: number
  showInput?: boolean
  showTicks?: boolean
  helpMessage?: string
}

const props = withDefaults(defineProps<TavernSliderProps>(), {
  variant: 'primary',
  size: 'md',
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  vertical: false,
  height: '200px',
  range: false,
  showStops: false,
  showTooltip: true,
  placement: 'top',
  debounce: 300,
  showInput: false,
  showTicks: false,
  required: false,
  showValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[]]
  input: [value: number | number[]]
  change: [value: number | number[]]
}>()

const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 输入框的值（用于双向绑定）
const inputValue = ref<number>(
  Array.isArray(props.modelValue) ? props.modelValue[0] : (props.modelValue || 0)
)

// 监听modelValue变化，同步到inputValue
watch(() => props.modelValue, (newValue) => {
  if (Array.isArray(newValue)) {
    inputValue.value = newValue[0]
  } else {
    inputValue.value = newValue || 0
  }
}, { immediate: true })

// 格式化数值显示
const formatValue = (value: number): string => {
  if (props.valueFormat) {
    return props.valueFormat(value)
  }

  // 默认格式化逻辑
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  } else if (value % 1 !== 0) {
    return value.toFixed(2)
  } else {
    return value.toString()
  }
}

// 处理输入框变化
const handleInputChange = (value: number) => {
  if (value < props.min) value = props.min
  if (value > props.max) value = props.max

  inputValue.value = value

  if (Array.isArray(props.modelValue)) {
    const newValue = [...props.modelValue]
    newValue[0] = value
    modelValue.value = newValue
  } else {
    modelValue.value = value
  }
}

// 处理输入框失焦
const handleInputBlur = () => {
  // 确保输入值在有效范围内
  let value = inputValue.value
  if (value < props.min) value = props.min
  if (value > props.max) value = props.max

  inputValue.value = value

  if (Array.isArray(props.modelValue)) {
    const newValue = [...props.modelValue]
    newValue[0] = value
    modelValue.value = newValue
  } else {
    modelValue.value = value
  }
}
</script>

<style lang="scss" scoped>
.tavern-slider-wrapper {
  .tavern-slider__label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
  }

  .tavern-slider__required {
    color: var(--tavern-error);
  }

  .tavern-slider__value {
    margin-left: auto;
    font-weight: 600;
    color: var(--tavern-primary);
  }

  .tavern-slider__content {
    display: flex;
    align-items: center;
    gap: 16px;

    .tavern-slider {
      flex: 1;

      :deep(.el-slider) {
        --el-slider-main-bg-color: var(--bg-tertiary);
        --el-slider-runway-bg-color: var(--bg-tertiary);
        --el-slider-stop-bg-color: var(--bg-secondary);
        --el-slider-disabled-main-bg-color: var(--bg-tertiary);
        --el-slider-disabled-runway-bg-color: var(--bg-tertiary);
        --el-slider-border-radius: var(--slider-radius);
        --el-slider-height: var(--slider-height);
        --el-slider-button-size: var(--slider-button-size);

        .el-slider__runway {
          background: var(--bg-tertiary);
          border-radius: var(--slider-radius);
          height: var(--slider-height);

          .el-slider__bar {
            background: var(--slider-bar-color);
            border-radius: var(--slider-radius);
            height: 100%;
          }

          .el-slider__button-wrapper {
            .el-slider__button {
              background: var(--slider-button-color);
              border: 2px solid var(--slider-button-border-color);
              border-radius: 50%;
              width: var(--slider-button-size);
              height: var(--slider-button-size);
              box-shadow: var(--shadow-sm);

              &:hover {
                transform: scale(1.1);
                box-shadow: var(--shadow-md);
              }

              &:focus {
                outline: none;
                box-shadow: 0 0 0 2px rgba(var(--tavern-primary-rgb), 0.3);
              }

              &.hover,
              &.dragging {
                transform: scale(1.1);
                box-shadow: var(--shadow-md);
              }
            }
          }

          .el-slider__stop {
            background: var(--bg-secondary);
            border-radius: 50%;
            width: 8px;
            height: 8px;

            &:hover {
              background: var(--tavern-primary);
            }
          }
        }

        // 刻度标记
        .el-slider__marks {
          .el-slider__marks-text {
            color: var(--text-muted);
            font-size: 12px;

            &.active {
              color: var(--tavern-primary);
              font-weight: 600;
            }
          }
        }
      }

      // 变体样式
      &--primary {
        --slider-bar-color: var(--tavern-primary);
        --slider-button-color: var(--tavern-primary);
        --slider-button-border-color: var(--tavern-primary);
      }

      &--secondary {
        --slider-bar-color: var(--tavern-secondary);
        --slider-button-color: var(--tavern-secondary);
        --slider-button-border-color: var(--tavern-secondary);
      }

      &--neutral {
        --slider-bar-color: var(--text-muted);
        --slider-button-color: var(--bg-secondary);
        --slider-button-border-color: var(--border-color);
      }

      // 尺寸样式
      &--sm {
        --slider-radius: 2px;
        --slider-height: 4px;
        --slider-button-size: 16px;
      }

      &--md {
        --slider-radius: 3px;
        --slider-height: 6px;
        --slider-button-size: 20px;
      }

      &--lg {
        --slider-radius: 4px;
        --slider-height: 8px;
        --slider-button-size: 24px;
      }

      // 垂直样式
      &--vertical {
        height: v-bind('props.height');

        :deep(.el-slider__runway) {
          width: var(--slider-height);
          height: 100%;
        }
      }

      // 禁用状态
      &--disabled {
        opacity: 0.6;
        cursor: not-allowed;

        :deep(.el-slider__button) {
          cursor: not-allowed;

          &:hover {
            transform: none;
            box-shadow: var(--shadow-sm);
          }
        }
      }

      // 带输入框样式
      &--with-input {
        margin-right: 16px;
      }
    }

    .tavern-slider__input {
      width: 80px;
      flex-shrink: 0;
    }
  }

  .tavern-slider__help {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .tavern-slider__ticks {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;

    .tavern-slider__tick-min,
    .tavern-slider__tick-max {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}

// 暗色主题适配
.dark {
  .tavern-slider-wrapper {
    .tavern-slider__label {
      color: var(--text-color-dark);
    }

    .tavern-slider {
      :deep(.el-slider) {
        --el-slider-main-bg-color: var(--bg-tertiary-dark);
        --el-slider-runway-bg-color: var(--bg-tertiary-dark);
        --el-slider-stop-bg-color: var(--bg-secondary-dark);

        .el-slider__runway {
          background: var(--bg-tertiary-dark);

          .el-slider__stop {
            background: var(--bg-secondary-dark);

            &:hover {
              background: var(--tavern-primary);
            }
          }
        }

        .el-slider__marks {
          .el-slider__marks-text {
            color: var(--text-muted-dark);
          }
        }
      }
    }

    .tavern-slider__help {
      color: var(--text-muted-dark);
    }

    .tavern-slider__ticks {
      .tavern-slider__tick-min,
      .tavern-slider__tick-max {
        color: var(--text-muted-dark);
      }
    }
  }
}
</style>
