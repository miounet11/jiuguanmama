<template>
  <Teleport to="body">
    <Transition
      name="tavern-modal-fade"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="visible"
        :class="[
          'tavern-modal-overlay',
          `tavern-modal-overlay--${variant}`
        ]"
        @click="handleOverlayClick"
      >
        <Transition
          name="tavern-modal-zoom"
          appear
        >
          <div
            v-if="visible"
            :class="[
              'tavern-modal',
              `tavern-modal--${size}`,
              {
                'tavern-modal--fullscreen': fullscreen,
                'tavern-modal--center': center,
                'tavern-modal--no-padding': noPadding
              }
            ]"
            :style="modalStyle"
            @click.stop
          >
            <!-- 头部 -->
            <div
              v-if="showHeader"
              class="tavern-modal__header"
            >
              <div class="tavern-modal__title">
                <TavernIcon
                  v-if="icon"
                  :name="icon"
                  :size="iconSize"
                  class="tavern-modal__icon"
                />
                <h3>{{ title }}</h3>
              </div>

              <div class="tavern-modal__actions">
                <slot name="header-actions" />

                <TavernButton
                  v-if="maximizable"
                  variant="ghost"
                  size="sm"
                  @click="toggleMaximize"
                >
                  <TavernIcon
                    :name="isMaximized ? 'minimize' : 'maximize'"
                    size="sm"
                  />
                </TavernButton>

                <TavernButton
                  v-if="closable"
                  variant="ghost"
                  size="sm"
                  @click="handleClose"
                >
                  <TavernIcon name="close" size="sm" />
                </TavernButton>
              </div>
            </div>

            <!-- 主体内容 -->
            <div
              class="tavern-modal__body"
              :class="{ 'tavern-modal__body--scroll': scrollable }"
            >
              <slot />
            </div>

            <!-- 底部 -->
            <div
              v-if="showFooter"
              class="tavern-modal__footer"
            >
              <div class="tavern-modal__footer-content">
                <slot name="footer">
                  <div class="tavern-modal__buttons">
                    <TavernButton
                      v-if="showCancelButton"
                      variant="ghost"
                      size="md"
                      @click="handleCancel"
                    >
                      {{ cancelButtonText }}
                    </TavernButton>

                    <TavernButton
                      v-if="showConfirmButton"
                      :variant="confirmButtonVariant"
                      size="md"
                      :loading="confirmLoading"
                      @click="handleConfirm"
                    >
                      {{ confirmButtonText }}
                    </TavernButton>
                  </div>
                </slot>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import TavernIcon from './TavernIcon.vue'
import TavernButton from './TavernButton.vue'

export interface TavernModalProps {
  modelValue?: boolean
  title?: string
  icon?: string
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'neutral'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
  width?: string | number
  height?: string | number
  top?: string | number
  center?: boolean
  fullscreen?: boolean
  showHeader?: boolean
  showFooter?: boolean
  closable?: boolean
  maximizable?: boolean
  maskClosable?: boolean
  escClosable?: boolean
  noPadding?: boolean
  scrollable?: boolean
  confirmLoading?: boolean
  showCancelButton?: boolean
  showConfirmButton?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  confirmButtonVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  appendToBody?: boolean
  destroyOnClose?: boolean
  modalClass?: string
  zIndex?: number
}

const props = withDefaults(defineProps<TavernModalProps>(), {
  title: '',
  variant: 'primary',
  size: 'md',
  center: false,
  fullscreen: false,
  showHeader: true,
  showFooter: true,
  closable: true,
  maximizable: false,
  maskClosable: true,
  escClosable: true,
  noPadding: false,
  scrollable: true,
  confirmLoading: false,
  showCancelButton: true,
  showConfirmButton: true,
  cancelButtonText: '取消',
  confirmButtonText: '确定',
  confirmButtonVariant: 'primary',
  appendToBody: true,
  destroyOnClose: false,
  zIndex: 2000,
  iconSize: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  opened: []
  close: []
  closed: []
  confirm: []
  cancel: []
  'before-close': [done: () => void]
}>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isMaximized = ref(false)
const originalSize = ref({
  width: '',
  height: '',
  top: ''
})

// 计算样式
const modalStyle = computed(() => {
  const style: Record<string, any> = {}

  if (props.zIndex) {
    style.zIndex = props.zIndex
  }

  if (isMaximized.value) {
    style.width = '100vw'
    style.height = '100vh'
    style.top = '0'
    style.left = '0'
    style.transform = 'none'
  } else {
    if (props.width) {
      style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
    }

    if (props.height) {
      style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
    }

    if (props.top) {
      style.top = typeof props.top === 'number' ? `${props.top}px` : props.top
    }
  }

  return style
})

// 方法
const handleOverlayClick = () => {
  if (props.maskClosable) {
    handleClose()
  }
}

const handleClose = () => {
  emit('before-close', () => {
    visible.value = false
  })
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const toggleMaximize = () => {
  if (!isMaximized.value) {
    // 保存原始尺寸
    originalSize.value = {
      width: modalStyle.value.width || '',
      height: modalStyle.value.height || '',
      top: modalStyle.value.top || ''
    }
  }

  isMaximized.value = !isMaximized.value
}

// 生命周期方法
const onEnter = () => {
  emit('open')
  document.body.style.overflow = 'hidden'
}

const onAfterEnter = () => {
  emit('opened')
}

const onLeave = () => {
  emit('close')
}

const onAfterLeave = () => {
  emit('closed')
  document.body.style.overflow = ''
}

// 监听ESC键
watch(visible, (newValue) => {
  if (newValue && props.escClosable) {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEsc)

    // 清理监听器
    nextTick(() => {
      watch(visible, (closed) => {
        if (!closed) {
          document.removeEventListener('keydown', handleEsc)
        }
      })
    })
  }
})
</script>

<style lang="scss">
/* 过渡动画 */
.tavern-modal-fade-enter-active,
.tavern-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.tavern-modal-fade-enter-from,
.tavern-modal-fade-leave-to {
  opacity: 0;
}

.tavern-modal-zoom-enter-active,
.tavern-modal-zoom-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.tavern-modal-zoom-enter-from,
.tavern-modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

/* 模态框样式 */
.tavern-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: v-bind('props.zIndex');
  padding: 20px;

  // 变体样式
  &--primary {
    background: rgba(0, 0, 0, 0.6);
  }

  &--secondary {
    background: rgba(0, 0, 0, 0.5);
  }

  &--neutral {
    background: rgba(0, 0, 0, 0.4);
  }
}

.tavern-modal {
  background: var(--card-bg);
  border-radius: var(--modal-radius);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  max-width: 90vw;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--modal-header-padding);
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);

    .tavern-modal__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--modal-title-font-size);
      font-weight: 600;
      color: var(--text-color);
      margin: 0;

      .tavern-modal__icon {
        color: var(--tavern-primary);
      }
    }

    .tavern-modal__actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  &__body {
    flex: 1;
    padding: var(--modal-body-padding);
    overflow-y: auto;

    &--scroll {
      max-height: 60vh;
    }
  }

  &__footer {
    padding: var(--modal-footer-padding);
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);

    .tavern-modal__footer-content {
      display: flex;
      justify-content: flex-end;

      .tavern-modal__buttons {
        display: flex;
        gap: 12px;
      }
    }
  }

  // 尺寸样式
  &--xs {
    --modal-radius: 8px;
    --modal-header-padding: 12px 16px;
    --modal-title-font-size: 16px;
    --modal-body-padding: 16px;
    --modal-footer-padding: 12px 16px;
    width: 400px;
  }

  &--sm {
    --modal-radius: 8px;
    --modal-header-padding: 14px 18px;
    --modal-title-font-size: 18px;
    --modal-body-padding: 18px;
    --modal-footer-padding: 14px 18px;
    width: 500px;
  }

  &--md {
    --modal-radius: 10px;
    --modal-header-padding: 16px 20px;
    --modal-title-font-size: 20px;
    --modal-body-padding: 20px;
    --modal-footer-padding: 16px 20px;
    width: 600px;
  }

  &--lg {
    --modal-radius: 12px;
    --modal-header-padding: 18px 24px;
    --modal-title-font-size: 22px;
    --modal-body-padding: 24px;
    --modal-footer-padding: 18px 24px;
    width: 800px;
  }

  &--xl {
    --modal-radius: 14px;
    --modal-header-padding: 20px 28px;
    --modal-title-font-size: 24px;
    --modal-body-padding: 28px;
    --modal-footer-padding: 20px 28px;
    width: 1000px;
  }

  // 全屏样式
  &--fullscreen {
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }

  // 居中样式
  &--center {
    margin: auto;
  }

  // 无内边距样式
  &--no-padding {
    .tavern-modal__body {
      padding: 0;
    }
  }
}

/* 暗色主题适配 */
.dark {
  .tavern-modal-overlay {
    background: rgba(0, 0, 0, 0.7);
  }

  .tavern-modal {
    background: var(--card-bg-dark);
    border-color: var(--border-color-dark);

    &__header {
      border-bottom-color: var(--border-color-dark);
      background: var(--bg-secondary-dark);

      .tavern-modal__title {
        color: var(--text-color-dark);
      }
    }

    &__footer {
      border-top-color: var(--border-color-dark);
      background: var(--bg-secondary-dark);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tavern-modal-overlay {
    padding: 10px;
  }

  .tavern-modal {
    width: 95vw !important;
    max-width: none;
    max-height: 95vh;

    &--xs,
    &--sm,
    &--md,
    &--lg,
    &--xl {
      width: 95vw !important;
    }
  }
}
</style>
