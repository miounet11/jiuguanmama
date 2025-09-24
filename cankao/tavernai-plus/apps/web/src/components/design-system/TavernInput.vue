<template>
  <div class="tavern-input-field" :class="fieldClasses">
    <label v-if="label" class="tavern-input-field__label">
      {{ label }}
      <span v-if="required" class="tavern-input-field__required">*</span>
    </label>

    <div class="tavern-input-field__wrapper">
      <!-- 前置图标 -->
      <TavernIcon
        v-if="iconLeft"
        :name="iconLeft"
        class="tavern-input-field__icon tavern-input-field__icon--left"
      />

      <!-- 输入框 -->
      <component
        :is="inputComponent"
        ref="inputRef"
        :value="modelValue"
        :class="inputClasses"
        :type="actualType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :rows="rows"
        :cols="cols"
        :autocomplete="autocomplete"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInputChange"
        @keydown="handleKeydown"
      />

      <!-- 后置图标 -->
      <TavernIcon
        v-if="iconRight"
        :name="iconRight"
        class="tavern-input-field__icon tavern-input-field__icon--right"
      />

      <!-- 密码显示切换 -->
      <button
        v-if="type === 'password' && showPasswordToggle"
        type="button"
        class="tavern-input-field__password-toggle"
        @click="togglePasswordVisibility"
      >
        <TavernIcon :name="passwordVisible ? 'eye-slash' : 'eye'" />
      </button>

      <!-- 清除按钮 -->
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="tavern-input-field__clear"
        @click="clearInput"
      >
        <TavernIcon name="x" />
      </button>

      <!-- 错误图标 -->
      <TavernIcon
        v-if="hasError"
        name="warning"
        class="tavern-input-field__icon tavern-input-field__icon--error"
      />
    </div>

    <!-- 错误信息 -->
    <div v-if="hasError" class="tavern-input-field__error">
      {{ errorMessage }}
    </div>

    <!-- 帮助文本 -->
    <div v-if="helperText && !hasError" class="tavern-input-field__helper">
      {{ helperText }}
    </div>

    <!-- 字符计数 -->
    <div
      v-if="showCharCount"
      class="tavern-input-field__count"
      :class="{ 'tavern-input-field__count--warning': isCharCountWarning }"
    >
      {{ currentLength }}{{ maxlength ? ` / ${maxlength}` : '' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import TavernIcon from './TavernIcon.vue'

// Types
export interface TavernInputProps {
  // 基础属性
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea'
  label?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string

  // 状态
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  loading?: boolean

  // 样式
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled'

  // 图标
  iconLeft?: string
  iconRight?: string

  // 功能
  clearable?: boolean
  showPasswordToggle?: boolean
  showCharCount?: boolean

  // 限制
  maxlength?: number
  minlength?: number

  // Textarea专用
  rows?: number
  cols?: number
  autoResize?: boolean

  // 其他
  autocomplete?: string
}

// Props
const props = withDefaults(defineProps<TavernInputProps>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  showPasswordToggle: true,
  showCharCount: false,
  rows: 3,
  autoResize: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  input: [event: Event]
  keydown: [event: KeyboardEvent]
  clear: []
}>()

// Refs
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()
const passwordVisible = ref(false)
const isFocused = ref(false)

// Computed
const modelValue = computed({
  get: () => props.modelValue || '',
  set: (value) => emit('update:modelValue', value)
})

const inputComponent = computed(() => {
  return props.type === 'textarea' ? 'textarea' : 'input'
})

const actualType = computed(() => {
  if (props.type === 'password' && passwordVisible.value) {
    return 'text'
  }
  return props.type === 'textarea' ? undefined : props.type
})

const hasError = computed(() => !!props.errorMessage)

const currentLength = computed(() => String(modelValue.value).length)

const isCharCountWarning = computed(() => {
  if (!props.maxlength) return false
  return currentLength.value > props.maxlength * 0.8
})

const fieldClasses = computed(() => [
  'tavern-input-field',
  `tavern-input-field--${props.size}`,
  `tavern-input-field--${props.variant}`,
  {
    'tavern-input-field--disabled': props.disabled,
    'tavern-input-field--readonly': props.readonly,
    'tavern-input-field--focused': isFocused.value,
    'tavern-input-field--error': hasError.value,
    'tavern-input-field--loading': props.loading
  }
])

const inputClasses = computed(() => [
  'tavern-input-field__input',
  {
    'tavern-input-field__input--has-icon-left': props.iconLeft,
    'tavern-input-field__input--has-icon-right': props.iconRight || props.clearable || hasError.value,
    'tavern-input-field__input--password': props.type === 'password' && props.showPasswordToggle
  }
])

// Methods
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement

  // 自动调整textarea高度
  if (props.type === 'textarea' && props.autoResize) {
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.style.height = 'auto'
        inputRef.value.style.height = `${inputRef.value.scrollHeight}px`
      }
    })
  }

  emit('input', event)
}

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
  handleInput(event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

const clearInput = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

// 公开方法
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

const select = () => {
  ;(inputRef.value as HTMLInputElement)?.select()
}

defineExpose({
  focus,
  blur,
  select,
  inputRef
})
</script>

<style lang="scss">
.tavern-input-field {
  // 基础布局
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  // 标签样式
  &__label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    line-height: var(--leading-tight);
  }

  &__required {
    color: var(--error);
    margin-left: var(--space-1);
  }

  // 输入框包装器
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  // 输入框基础样式
  &__input {
    flex: 1;
    width: 100%;
    background: var(--surface-3);
    border: var(--space-px) solid var(--border-secondary);
    border-radius: var(--input-radius);
    color: var(--text-primary);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    line-height: var(--leading-normal);
    transition: var(--input-transition);

    // 占位符样式
    &::placeholder {
      color: var(--text-placeholder);
    }

    // 焦点状态
    &:focus {
      outline: none;
      border-color: var(--tavern-primary);
      box-shadow: 0 0 0 var(--space-1) rgba(var(--brand-primary-500), 0.1);
    }

    // 禁用状态
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--surface-1);
    }

    // 只读状态
    &:readonly {
      background: var(--surface-1);
      cursor: default;
    }

    // 左图标间距
    &--has-icon-left {
      padding-left: calc(var(--space-10) + var(--space-1));
    }

    // 右图标间距
    &--has-icon-right {
      padding-right: calc(var(--space-10) + var(--space-1));
    }

    // 密码字段特殊间距
    &--password {
      padding-right: calc(var(--space-10) + var(--space-1));
    }
  }

  // 图标样式
  &__icon {
    position: absolute;
    color: var(--text-tertiary);
    pointer-events: none;
    z-index: 1;

    &--left {
      left: var(--space-3);
    }

    &--right {
      right: var(--space-3);
    }

    &--error {
      color: var(--error);
    }
  }

  // 交互按钮
  &__password-toggle,
  &__clear {
    position: absolute;
    right: var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--space-5);
    height: var(--space-5);
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: var(--duration-fast) ease;

    &:hover {
      color: var(--text-secondary);
      background: var(--surface-4);
    }

    &:focus-visible {
      outline: var(--space-px-2) solid var(--focus-ring);
      outline-offset: var(--space-px-2);
    }
  }

  // 清除按钮特殊位置（当有错误图标时）
  .tavern-input-field--error &__clear {
    right: calc(var(--space-10) + var(--space-1));
  }

  // 错误和帮助文本
  &__error,
  &__helper {
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
  }

  &__error {
    color: var(--error);
  }

  &__helper {
    color: var(--text-tertiary);
  }

  // 字符计数
  &__count {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-align: right;

    &--warning {
      color: var(--warning);
    }
  }

  // === 尺寸变体 ===

  &--sm {
    .tavern-input-field__input {
      height: var(--space-8); // 32px
      padding: 0 var(--space-3);
      font-size: var(--text-sm);
    }

    .tavern-input-field__icon {
      &--left {
        left: var(--space-2);
      }

      &--right {
        right: var(--space-2);
      }
    }

    .tavern-input-field__password-toggle,
    .tavern-input-field__clear {
      right: var(--space-2);
    }
  }

  &--md {
    .tavern-input-field__input {
      height: var(--space-11); // 44px
      padding: 0 var(--component-padding-md);
      font-size: var(--text-base);
    }
  }

  &--lg {
    .tavern-input-field__input {
      height: var(--space-12); // 48px
      padding: 0 var(--space-4);
      font-size: var(--text-lg);
    }

    .tavern-input-field__icon {
      &--left {
        left: var(--space-4);
      }

      &--right {
        right: var(--space-4);
      }
    }

    .tavern-input-field__password-toggle,
    .tavern-input-field__clear {
      right: var(--space-4);
    }
  }

  // === 变体样式 ===

  &--filled {
    .tavern-input-field__input {
      background: var(--surface-2);
      border-color: transparent;

      &:focus {
        background: var(--surface-3);
        border-color: var(--tavern-primary);
      }
    }
  }

  // === 状态样式 ===

  &--error {
    .tavern-input-field__input {
      border-color: var(--error);

      &:focus {
        box-shadow: 0 0 0 var(--space-1) rgba(var(--error), 0.1);
      }
    }
  }

  &--focused {
    .tavern-input-field__label {
      color: var(--tavern-primary);
    }
  }

  &--loading {
    .tavern-input-field__wrapper::after {
      content: '';
      position: absolute;
      right: var(--space-3);
      width: var(--space-4);
      height: var(--space-4);
      border: var(--space-px-2) solid var(--border-secondary);
      border-top-color: var(--tavern-primary);
      border-radius: var(--radius-full);
      animation: spin var(--duration-slow) linear infinite;
    }
  }

  // === Textarea特殊样式 ===

  &__input[rows] {
    height: auto;
    min-height: calc(var(--leading-normal) * 1em + var(--space-6));
    resize: vertical;
    line-height: var(--leading-relaxed);
  }
}

// 旋转动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>