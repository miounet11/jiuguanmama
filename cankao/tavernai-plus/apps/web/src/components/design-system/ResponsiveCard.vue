<template>
  <article
    class="responsive-card"
    :class="cardClasses"
    :style="cardStyles"
  >
    <!-- 卡片头部 -->
    <header v-if="$slots.header || title || subtitle" class="card-header">
      <div class="card-header-content">
        <!-- 媒体内容 (头像/图片) -->
        <div v-if="$slots.media || media" class="card-media">
          <slot name="media">
            <img
              v-if="media"
              :src="media"
              :alt="mediaAlt || title"
              class="card-media-image"
              loading="lazy"
            />
          </slot>
        </div>

        <!-- 文本内容 -->
        <div class="card-header-text">
          <h3 v-if="title" class="card-title" :title="title">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="card-subtitle" :title="subtitle">
            {{ subtitle }}
          </p>
        </div>

        <!-- 操作区域 -->
        <div v-if="$slots.actions" class="card-actions">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <!-- 卡片内容 -->
    <main class="card-content">
      <slot>
        <p v-if="description" class="card-description">
          {{ description }}
        </p>
      </slot>
    </main>

    <!-- 卡片底部 -->
    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>

    <!-- 覆盖层 (悬停时显示) -->
    <div v-if="showOverlay" class="card-overlay">
      <slot name="overlay" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="card-loading">
      <div class="loading-spinner" />
      <span class="loading-text">{{ loadingText }}</span>
    </div>

    <!-- 选中状态指示器 -->
    <div v-if="selected" class="card-selected-indicator">
      <CheckIcon />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEnhancedResponsive } from '@/composables/useEnhancedResponsive'
import { useMobilePerformance } from '@/composables/useMobilePerformance'

// 图标组件 (简化示例)
const CheckIcon = 'CheckIcon'

// Props定义
interface Props {
  // 基础属性
  title?: string
  subtitle?: string
  description?: string
  media?: string
  mediaAlt?: string

  // 状态属性
  loading?: boolean
  selected?: boolean
  disabled?: boolean
  clickable?: boolean
  active?: boolean

  // 样式属性
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  aspectRatio?: string | number
  borderRadius?: string

  // 交互属性
  hoverable?: boolean
  pressable?: boolean
  ripple?: boolean

  // 加载属性
  loadingText?: string

  // 响应式属性
  mobileSize?: 'sm' | 'md' | 'lg'
  tabletSize?: 'sm' | 'md' | 'lg'
  desktopSize?: 'sm' | 'md' | 'lg' | 'xl'

  // 性能优化
  lazy?: boolean
  optimizeImages?: boolean

  // 自定义类名
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selected: false,
  disabled: false,
  clickable: true,
  active: false,
  variant: 'default',
  size: 'md',
  hoverable: true,
  pressable: true,
  ripple: true,
  loadingText: '加载中...',
  mobileSize: 'md',
  tabletSize: 'md',
  desktopSize: 'md',
  lazy: true,
  optimizeImages: true,
})

// Emits定义
const emit = defineEmits<{
  click: [event: MouseEvent]
  dblclick: [event: MouseEvent]
  contextmenu: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  mouseenter: [event: MouseEvent]
  mouseleave: [event: MouseEvent]
}>()

// 响应式Hook
const {
  isMobileDevice,
  isTablet,
  isDesktop,
  deviceType,
  getTouchSize,
  getResponsiveSpacing,
} = useEnhancedResponsive()

const { isLowEndDevice, optimizeImage: performImageOptimization } = useMobilePerformance()

// 计算属性
const currentSize = computed(() => {
  if (isMobileDevice.value) return props.mobileSize
  if (isTablet.value) return props.tabletSize
  return props.desktopSize
})

const cardClasses = computed(() => [
  'responsive-card',
  `responsive-card--${props.variant}`,
  `responsive-card--${currentSize.value}`,
  `responsive-card--${deviceType.value}`,
  {
    'responsive-card--loading': props.loading,
    'responsive-card--selected': props.selected,
    'responsive-card--disabled': props.disabled,
    'responsive-card--clickable': props.clickable && !props.disabled,
    'responsive-card--active': props.active,
    'responsive-card--hoverable': props.hoverable && !props.disabled,
    'responsive-card--pressable': props.pressable && !props.disabled,
    'responsive-card--ripple': props.ripple && !props.disabled,
    'responsive-card--mobile': isMobileDevice.value,
    'responsive-card--low-performance': isLowEndDevice.value,
  },
  props.class,
])

const cardStyles = computed(() => {
  const styles: Record<string, any> = {}

  // 宽高比
  if (props.aspectRatio) {
    if (typeof props.aspectRatio === 'number') {
      styles.aspectRatio = props.aspectRatio
    } else {
      styles.aspectRatio = props.aspectRatio
    }
  }

  // 边框圆角
  if (props.borderRadius) {
    styles.borderRadius = props.borderRadius
  }

  // 响应式间距
  if (isMobileDevice.value) {
    styles.gap = getResponsiveSpacing(8, 12, 16) + 'px'
  }

  return styles
})

const showOverlay = computed(() => {
  return !props.disabled && !props.loading && props.hoverable
})

// 事件处理器
const handleClick = (event: MouseEvent) => {
  if (!props.clickable || props.disabled || props.loading) return

  emit('click', event)
}

const handleDblClick = (event: MouseEvent) => {
  if (!props.clickable || props.disabled || props.loading) return

  emit('dblclick', event)
}

const handleContextMenu = (event: MouseEvent) => {
  if (!props.clickable || props.disabled) return

  emit('contextmenu', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)

  // 键盘导航支持
  if (event.key === 'Enter' || event.key === ' ') {
    if (props.clickable && !props.disabled && !props.loading) {
      event.preventDefault()
      handleClick(event as any)
    }
  }
}

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleMouseEnter = (event: MouseEvent) => {
  if (!isMobileDevice.value) {
    emit('mouseenter', event)
  }
}

const handleMouseLeave = (event: MouseEvent) => {
  if (!isMobileDevice.value) {
    emit('mouseleave', event)
  }
}

// 图片优化
const optimizeImageIfNeeded = async (imageElement: HTMLImageElement, src: string) => {
  if (!props.optimizeImages || !isLowEndDevice.value) return

  try {
    // 创建图片URL的File对象 (这里需要根据实际情况调整)
    const response = await fetch(src)
    const blob = await response.blob()
    const file = new File([blob], 'image.jpg', { type: blob.type })

    // 执行图片优化
    const optimizedBlob = await performImageOptimization(file, {
      quality: isLowEndDevice.value ? 0.7 : 0.85,
      maxWidth: isMobileDevice.value ? 800 : 1200,
      maxHeight: isMobileDevice.value ? 600 : 900,
      format: 'webp'
    })

    // 更新图片源
    const optimizedUrl = URL.createObjectURL(optimizedBlob)
    imageElement.src = optimizedUrl
  } catch (error) {
    console.warn('图片优化失败:', error)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/responsive.scss';

.responsive-card {
  position: relative;
  background: var(--surface-1);
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-lg;
  overflow: hidden;
  transition: all $transition-base;
  display: flex;
  flex-direction: column;

  // 触摸优化
  @include touch-device {
    // 确保触摸目标足够大
    min-height: 44px;
    min-width: 44px;
  }

  // 焦点样式
  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  // 变体样式
  &--default {
    background: var(--surface-1);
    border-color: var(--border-secondary);
  }

  &--outlined {
    background: transparent;
    border-color: var(--border-primary);
  }

  &--elevated {
    background: var(--surface-2);
    box-shadow: $shadow-md;
    border: none;
  }

  &--filled {
    background: var(--surface-3);
    border: none;
  }

  // 尺寸样式
  &--sm {
    .card-header-content {
      gap: $spacing-sm;
      padding: $spacing-sm;
    }

    .card-title {
      font-size: $font-size-base;
    }

    .card-subtitle {
      font-size: $font-size-sm;
    }

    .card-content {
      padding: $spacing-sm;
    }
  }

  &--md {
    .card-header-content {
      gap: $spacing-md;
      padding: $spacing-md;
    }

    .card-title {
      font-size: $font-size-lg;
    }

    .card-subtitle {
      font-size: $font-size-base;
    }

    .card-content {
      padding: $spacing-md;
    }
  }

  &--lg {
    .card-header-content {
      gap: $spacing-lg;
      padding: $spacing-lg;
    }

    .card-title {
      font-size: $font-size-xl;
    }

    .card-subtitle {
      font-size: $font-size-lg;
    }

    .card-content {
      padding: $spacing-lg;
    }
  }

  &--xl {
    .card-header-content {
      gap: $spacing-xl;
      padding: $spacing-xl;
    }

    .card-title {
      font-size: $font-size-2xl;
    }

    .card-subtitle {
      font-size: $font-size-xl;
    }

    .card-content {
      padding: $spacing-xl;
    }
  }

  // 设备特定样式
  &--mobile {
    // 移动端优化
    .card-header-content {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    .card-actions {
      align-self: flex-end;
      margin-top: $spacing-sm;
    }

    // 触摸友好的间距
    .card-content {
      line-height: 1.6;
      font-size: $font-size-base;
    }
  }

  &--tablet {
    .card-header-content {
      flex-direction: row;
      align-items: center;
    }
  }

  &--desktop {
    // 桌面端悬停效果
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
  }

  // 状态样式
  &--loading {
    pointer-events: none;
    opacity: 0.7;
  }

  &--selected {
    border-color: var(--primary-color);
    background: rgba(var(--primary-color), 0.05);
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      background: var(--surface-2);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &--active {
    background: rgba(var(--primary-color), 0.1);
    border-color: var(--primary-color);
  }

  &--hoverable {
    transition: all $transition-base;

    &:hover {
      background: var(--surface-2);
      border-color: var(--border-primary);
    }
  }

  &--pressable {
    &:active {
      transform: scale(0.98);
    }
  }

  &--ripple {
    // 涟漪效果通过子组件实现
  }

  &--low-performance {
    // 低性能设备优化
    transition: none;
    transform: translateZ(0); // 硬件加速

    &:hover {
      transform: none;
    }

    &:active {
      transform: none;
    }
  }
}

// 卡片头部
.card-header {
  flex-shrink: 0;
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.card-media {
  flex-shrink: 0;

  .card-media-image {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: $border-radius-base;

    .responsive-card--sm & {
      width: 40px;
      height: 40px;
    }

    .responsive-card--lg & {
      width: 64px;
      height: 64px;
    }

    .responsive-card--xl & {
      width: 80px;
      height: 80px;
    }
  }
}

.card-header-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  @include text-truncate;
}

.card-subtitle {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  margin: $spacing-xs 0 0;
  line-height: 1.4;
  @include text-line-clamp(2);
}

.card-actions {
  flex-shrink: 0;
  display: flex;
  gap: $spacing-xs;
}

// 卡片内容
.card-content {
  flex: 1;
  color: var(--text-primary);
}

.card-description {
  font-size: $font-size-base;
  line-height: 1.6;
  margin: 0;
  color: var(--text-secondary);
}

// 卡片底部
.card-footer {
  flex-shrink: 0;
  padding-top: $spacing-md;
  border-top: 1px solid var(--border-secondary);
}

// 覆盖层
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity $transition-base;
  pointer-events: none;

  .responsive-card--hoverable:hover & {
    opacity: 1;
  }
}

// 加载状态
.card-loading {
  position: absolute;
  inset: 0;
  background: rgba(var(--surface-1), 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  color: var(--text-secondary);

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-secondary);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: $font-size-sm;
  }
}

// 选中指示器
.card-selected-indicator {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 1;
}

// 响应式调整
@include mobile-only {
  .responsive-card {
    margin: $spacing-sm;
    border-radius: $border-radius-md;

    &--elevated {
      box-shadow: $shadow-sm;
    }

    .card-media .card-media-image {
      width: 56px;
      height: 56px;
    }

    .card-title {
      font-size: $font-size-base;
    }

    .card-subtitle {
      font-size: $font-size-sm;
    }

    .card-description {
      font-size: $font-size-sm;
      line-height: 1.5;
    }
  }
}

@include tablet-only {
  .responsive-card {
    margin: $spacing-md;

    .card-header-content {
      padding: $spacing-lg;
    }
  }
}

@include desktop-only {
  .responsive-card {
    margin: $spacing-md;

    &--elevated:hover {
      box-shadow: $shadow-xl;
    }
  }
}

// 动画定义
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .responsive-card {
    transition: none;

    &:hover {
      transform: none;
    }

    &:active {
      transform: none;
    }
  }

  .card-loading .loading-spinner {
    animation: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .responsive-card {
    border-width: 2px;

    &--selected {
      border-width: 3px;
    }

    .card-selected-indicator {
      border: 2px solid white;
    }
  }
}

// 打印样式
@media print {
  .responsive-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #000;

    .card-loading,
    .card-overlay {
      display: none;
    }
  }
}
</style>