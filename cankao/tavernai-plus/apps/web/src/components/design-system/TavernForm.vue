<template>
  <form
    :class="[
      'tavern-form',
      `tavern-form--${layout}`,
      `tavern-form--${size}`,
      {
        'tavern-form--inline': inline,
        'tavern-form--disabled': disabled
      }
    ]"
    @submit.prevent="handleSubmit"
    @reset="handleReset"
  >
    <slot />
  </form>
</template>

<script setup lang="ts">
import { provide, reactive, ref, computed } from 'vue'

export interface TavernFormProps {
  model?: Record<string, any>
  rules?: Record<string, any[]>
  layout?: 'horizontal' | 'vertical' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean
  disabled?: boolean
  labelWidth?: string | number
  labelPosition?: 'left' | 'right' | 'top'
  showMessage?: boolean
  validateOnRuleChange?: boolean
  scrollToError?: boolean
}

export interface FormContext {
  model: Record<string, any>
  rules: Record<string, any[]>
  layout: string
  size: string
  disabled: boolean
  labelWidth: string | number
  labelPosition: string
  showMessage: boolean
  validateOnRuleChange: boolean
  scrollToError: boolean
  addField: (field: any) => void
  removeField: (field: any) => void
  validate: (callback?: (valid: boolean, fields?: any) => void) => Promise<boolean>
  validateField: (props: string | string[], callback?: (message?: string) => void) => Promise<void>
  resetFields: () => void
  clearValidate: (props?: string | string[]) => void
  fields: any[]
}

const props = withDefaults(defineProps<TavernFormProps>(), {
  layout: 'horizontal',
  size: 'md',
  inline: false,
  disabled: false,
  labelPosition: 'right',
  showMessage: true,
  validateOnRuleChange: true,
  scrollToError: false
})

const emit = defineEmits<{
  submit: [model: Record<string, any>, valid: boolean]
  reset: []
  validate: [prop: string, isValid: boolean, message: string]
}>()

// 表单字段列表
const fields = ref<any[]>([])

// 表单上下文
const formContext: FormContext = reactive({
  model: computed(() => props.model || {}),
  rules: computed(() => props.rules || {}),
  layout: computed(() => props.layout),
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
  labelWidth: computed(() => props.labelWidth || 'auto'),
  labelPosition: computed(() => props.labelPosition),
  showMessage: computed(() => props.showMessage),
  validateOnRuleChange: computed(() => props.validateOnRuleChange),
  scrollToError: computed(() => props.scrollToError),
  fields,

  // 添加字段
  addField: (field: any) => {
    if (field) {
      fields.value.push(field)
    }
  },

  // 移除字段
  removeField: (field: any) => {
    if (field) {
      const index = fields.value.indexOf(field)
      if (index > -1) {
        fields.value.splice(index, 1)
      }
    }
  },

  // 验证整个表单
  validate: async (callback?: (valid: boolean, fields?: any) => void): Promise<boolean> => {
    let valid = true
    const invalidFields: any[] = []

    for (const field of fields.value) {
      try {
        const result = await field.validate()
        if (!result.valid) {
          valid = false
          invalidFields.push({
            field: field.prop,
            message: result.message
          })
        }
      } catch (error) {
        valid = false
        invalidFields.push({
          field: field.prop,
          message: error.message || '验证失败'
        })
      }
    }

    if (callback) {
      callback(valid, invalidFields)
    }

    if (!valid && props.scrollToError && invalidFields.length > 0) {
      // 滚动到第一个错误字段
      const firstInvalidField = invalidFields[0]
      const fieldElement = document.querySelector(`[data-field="${firstInvalidField.field}"]`)
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    return valid
  },

  // 验证特定字段
  validateField: async (props: string | string[], callback?: (message?: string) => void): Promise<void> => {
    const propList = Array.isArray(props) ? props : [props]

    for (const prop of propList) {
      const field = fields.value.find(f => f.prop === prop)
      if (field) {
        try {
          const result = await field.validate()
          if (callback) {
            callback(result.valid ? undefined : result.message)
          }
          emit('validate', prop, result.valid, result.message || '')
        } catch (error) {
          if (callback) {
            callback(error.message || '验证失败')
          }
          emit('validate', prop, false, error.message || '验证失败')
        }
      }
    }
  },

  // 重置字段
  resetFields: () => {
    fields.value.forEach(field => {
      field.resetField()
    })
  },

  // 清除验证
  clearValidate: (props?: string | string[]) => {
    if (props) {
      const propList = Array.isArray(props) ? props : [props]
      fields.value.forEach(field => {
        if (propList.includes(field.prop)) {
          field.clearValidate()
        }
      })
    } else {
      fields.value.forEach(field => {
        field.clearValidate()
      })
    }
  }
})

// 提供表单上下文
provide('tavernForm', formContext)

// 事件处理
const handleSubmit = async () => {
  const valid = await formContext.validate()
  emit('submit', props.model || {}, valid)
}

const handleReset = () => {
  formContext.resetFields()
  emit('reset')
}

// 暴露方法给父组件
defineExpose({
  validate: formContext.validate,
  validateField: formContext.validateField,
  resetFields: formContext.resetFields,
  clearValidate: formContext.clearValidate
})
</script>

<style lang="scss" scoped>
.tavern-form {
  --form-label-width: 80px;
  --form-item-margin-bottom: 16px;
  --form-item-label-margin-bottom: 8px;

  // 布局样式
  &--horizontal {
    .tavern-form-item {
      display: flex;
      align-items: flex-start;

      .tavern-form-item__label {
        flex-shrink: 0;
        width: var(--form-label-width);
        text-align: right;
        margin-right: 12px;
        margin-bottom: 0;
      }

      .tavern-form-item__content {
        flex: 1;
      }
    }
  }

  &--vertical {
    .tavern-form-item {
      .tavern-form-item__label {
        display: block;
        margin-bottom: var(--form-item-label-margin-bottom);
        text-align: left;
      }

      .tavern-form-item__content {
        display: block;
      }
    }
  }

  &--inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    .tavern-form-item {
      display: inline-flex;
      align-items: center;
      margin-right: 16px;
      margin-bottom: 8px;

      .tavern-form-item__label {
        margin-right: 8px;
        margin-bottom: 0;
      }

      .tavern-form-item__content {
        display: flex;
        align-items: center;
      }
    }
  }

  // 尺寸样式
  &--sm {
    --form-label-width: 70px;
    --form-item-margin-bottom: 12px;
    --form-item-label-margin-bottom: 6px;
  }

  &--md {
    --form-label-width: 80px;
    --form-item-margin-bottom: 16px;
    --form-item-label-margin-bottom: 8px;
  }

  &--lg {
    --form-label-width: 100px;
    --form-item-margin-bottom: 20px;
    --form-item-label-margin-bottom: 10px;
  }

  // 禁用状态
  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

// Form Item 样式 (用于嵌套组件)
:deep(.tavern-form-item) {
  margin-bottom: var(--form-item-margin-bottom);
}

:deep(.tavern-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;

  &::after {
    content: ':';
    margin-left: 4px;
  }
}

:deep(.tavern-form-item__content) {
  position: relative;
}

:deep(.tavern-form-item__error) {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 12px;
  color: var(--tavern-error);
  line-height: 1.4;
  margin-top: 4px;
  animation: tavern-form-error-enter 0.3s ease;
}

:deep(.tavern-form-item__help) {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 4px;
}

// 必填标识
:deep(.tavern-form-item--required) {
  .tavern-form-item__label::before {
    content: '*';
    color: var(--tavern-error);
    margin-right: 4px;
  }
}

// 错误提示动画
@keyframes tavern-form-error-enter {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 暗色主题适配 */
.dark {
  .tavern-form {
    :deep(.tavern-form-item__label) {
      color: var(--text-color-dark);
    }

    :deep(.tavern-form-item__error) {
      color: var(--tavern-error);
    }

    :deep(.tavern-form-item__help) {
      color: var(--text-muted-dark);
    }
  }
}
</style>
