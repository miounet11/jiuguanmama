<template>
  <div
    ref="containerRef"
    class="lazy-image"
    :class="containerClasses"
    :style="containerStyle"
  >
    <!-- 实际图片 -->
    <img
      v-if="shouldShowImage"
      :src="lazyImage.imageSrc.value"
      :alt="alt"
      :class="imageClasses"
      :style="imageStyle"
      @load="handleImageLoad"
      @error="handleImageError"
    />

    <!-- 占位符 -->
    <div
      v-if="showPlaceholder"
      class="lazy-image__placeholder"
      :class="placeholderClasses"
      :style="placeholderStyle"
    >
      <!-- 自定义占位符内容 -->
      <slot name="placeholder" :is-loading="lazyImage.isLoading.value">
        <!-- 默认占位符 -->
        <div v-if="placeholder === 'skeleton'" class="lazy-image__skeleton">
          <div class="lazy-image__skeleton-content" />
        </div>

        <div v-else-if="placeholder === 'blur'" class="lazy-image__blur">
          <img
            v-if="blurDataUrl"
            :src="blurDataUrl"
            :alt="alt"
            class="lazy-image__blur-image"
          />
        </div>

        <div v-else-if="placeholder === 'gradient'" class="lazy-image__gradient" />

        <img
          v-else-if="placeholder && typeof placeholder === 'string'"
          :src="placeholder"
          :alt="alt"
          class="lazy-image__placeholder-image"
        />

        <div v-else class="lazy-image__default-placeholder">
          <TavernIcon name="image" size="lg" />
        </div>
      </slot>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="lazyImage.isLoading.value && showLoader"
      class="lazy-image__loader"
      :class="loaderClasses"
    >
      <slot name="loader">
        <div class="lazy-image__spinner">
          <TavernIcon name="spinner" size="sm" />
        </div>
      </slot>
    </div>

    <!-- 错误状态 -->
    <div
      v-if="lazyImage.hasError.value"
      class="lazy-image__error"
      :class="errorClasses"
    >
      <slot name="error" :retry="lazyImage.retry">
        <div class="lazy-image__error-content">
          <TavernIcon name="image-broken" size="lg" />
          <p class="lazy-image__error-message">{{ errorMessage }}</p>
          <TavernButton
            v-if="allowRetry"
            variant="outline"
            size="sm"
            @click="lazyImage.retry"
          >
            重试
          </TavernButton>
        </div>
      </slot>
    </div>

    <!-- 图片信息覆盖层 -->
    <div
      v-if="showOverlay && !lazyImage.isLoading.value && !lazyImage.hasError.value"
      class="lazy-image__overlay"
      :class="overlayClasses"
    >
      <slot name="overlay" :src="src" :alt="alt" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLazyImage, useResponsiveImage } from '@/composables/useLazyImage'
import { TavernButton, TavernIcon } from '@/components/design-system'

// Props 定义
export interface LazyImageProps {
  src: string
  alt: string
  placeholder?: string | 'skeleton' | 'blur' | 'gradient'
  blurDataUrl?: string
  aspectRatio?: string | number
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none'
  loading?: 'lazy' | 'eager'
  threshold?: number
  rootMargin?: string
  retryAttempts?: number
  showLoader?: boolean
  allowRetry?: boolean
  errorMessage?: string
  responsive?: boolean
  sizes?: string
  width?: number | string
  height?: number | string
  borderRadius?: string
  showOverlay?: boolean
  transition?: boolean
  zoomOnHover?: boolean
}

const props = withDefaults(defineProps<LazyImageProps>(), {
  placeholder: 'skeleton',
  aspectRatio: 'auto',
  objectFit: 'cover',
  loading: 'lazy',
  threshold: 0.1,
  rootMargin: '50px',
  retryAttempts: 3,
  showLoader: true,
  allowRetry: true,
  errorMessage: '图片加载失败',
  responsive: false,
  borderRadius: '0',
  showOverlay: false,
  transition: true,
  zoomOnHover: false
})

// Emits
const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
  'intersection-change': [isIntersecting: boolean]
}>()

// Refs
const containerRef = ref<HTMLElement>()
const isImageLoaded = ref(false)

// 响应式图片
const responsiveImage = props.responsive
  ? useResponsiveImage(props.src)
  : null

// 懒加载逻辑
const lazyImage = useLazyImage(containerRef, {
  src: responsiveImage?.imageUrl.value || props.src,
  placeholder: typeof props.placeholder === 'string' && props.placeholder.startsWith('http')
    ? props.placeholder
    : '',
  threshold: props.threshold,
  rootMargin: props.rootMargin,
  retryAttempts: props.retryAttempts,
  onLoad: () => {
    isImageLoaded.value = true
    emit('load', new Event('load'))
  },
  onError: (error) => {
    emit('error', error)
  }
})

// 计算属性
const shouldShowImage = computed(() => {
  return lazyImage.imageSrc.value && lazyImage.imageSrc.value !== '' && !lazyImage.hasError.value
})

const showPlaceholder = computed(() => {
  return !isImageLoaded.value && !lazyImage.hasError.value && props.placeholder
})

const containerClasses = computed(() => [
  'lazy-image',
  {
    'lazy-image--loading': lazyImage.isLoading.value,
    'lazy-image--loaded': isImageLoaded.value,
    'lazy-image--error': lazyImage.hasError.value,
    'lazy-image--responsive': props.responsive,
    'lazy-image--zoom-hover': props.zoomOnHover,
    'lazy-image--transition': props.transition
  }
])

const containerStyle = computed(() => {
  const styles: Record<string, string> = {
    '--border-radius': props.borderRadius
  }

  // 宽高比处理
  if (props.aspectRatio && props.aspectRatio !== 'auto') {
    if (typeof props.aspectRatio === 'string') {
      if (props.aspectRatio.includes(':')) {
        const [w, h] = props.aspectRatio.split(':').map(Number)
        styles.aspectRatio = `${w} / ${h}`
      } else {
        styles.aspectRatio = props.aspectRatio
      }
    } else {
      styles.aspectRatio = props.aspectRatio.toString()
    }
  }

  // 尺寸处理
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }

  return styles
})

const imageClasses = computed(() => [
  'lazy-image__image',
  {
    'lazy-image__image--loaded': isImageLoaded.value
  }
])

const imageStyle = computed(() => ({
  objectFit: props.objectFit
}))

const placeholderClasses = computed(() => [
  'lazy-image__placeholder',
  `lazy-image__placeholder--${props.placeholder}`
])

const placeholderStyle = computed(() => ({}))

const loaderClasses = computed(() => [
  'lazy-image__loader'
])

const errorClasses = computed(() => [
  'lazy-image__error'
])

const overlayClasses = computed(() => [
  'lazy-image__overlay'
])

// 方法
const handleImageLoad = (event: Event) => {
  isImageLoaded.value = true
  emit('load', event)
}

const handleImageError = (event: Event) => {
  emit('error', event)
}

// 监听响应式图片变化
if (responsiveImage) {
  watch(() => responsiveImage.imageUrl.value, (newUrl) => {
    if (newUrl !== lazyImage.imageSrc.value) {
      isImageLoaded.value = false
      // 重新触发懒加载
      lazyImage.retry()
    }
  })
}

// 监听交集变化
watch(() => lazyImage.isIntersecting.value, (isIntersecting) => {
  emit('intersection-change', isIntersecting)
})

// 暴露方法
defineExpose({
  retry: lazyImage.retry,
  isLoading: lazyImage.isLoading,
  hasError: lazyImage.hasError,
  isIntersecting: lazyImage.isIntersecting
})
</script>

<style lang="scss">
.lazy-image {
  position: relative;
  overflow: hidden;
  background: var(--surface-3);
  border-radius: var(--border-radius, 0);
  display: flex;
  align-items: center;
  justify-content: center;

  // === 图片样式 ===
  &__image {
    width: 100%;
    height: 100%;
    object-fit: var(--object-fit, cover);
    transition: var(--transition-transform);
    opacity: 0;

    &--loaded {
      opacity: 1;
    }

    .lazy-image--transition & {
      transition: opacity var(--duration-normal) var(--ease-out),
                  transform var(--duration-normal) var(--ease-out);
    }
  }

  // === 占位符样式 ===
  &__placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    transition: opacity var(--duration-normal) var(--ease-out);

    .lazy-image--loaded & {
      opacity: 0;
      pointer-events: none;
    }
  }

  &__placeholder-image {
    width: 100%;
    height: 100%;
    object-fit: var(--object-fit, cover);
    opacity: 0.6;
    filter: blur(2px);
  }

  // 骨架屏占位符
  &__skeleton {
    width: 100%;
    height: 100%;
    background: var(--surface-2);
    position: relative;
    overflow: hidden;
  }

  &__skeleton-content {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--surface-2) 25%,
      var(--surface-3) 50%,
      var(--surface-2) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }

  // 模糊占位符
  &__blur {
    width: 100%;
    height: 100%;
  }

  &__blur-image {
    width: 100%;
    height: 100%;
    object-fit: var(--object-fit, cover);
    filter: blur(10px);
    transform: scale(1.1);
  }

  // 渐变占位符
  &__gradient {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      var(--brand-primary-400),
      var(--brand-secondary-400),
      var(--brand-accent-400)
    );
    opacity: 0.3;
  }

  // 默认占位符
  &__default-placeholder {
    color: var(--text-quaternary);
  }

  // === 加载状态 ===
  &__loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: var(--z-floating);
  }

  &__spinner {
    color: var(--tavern-primary);
    animation: spin var(--duration-slow) linear infinite;
  }

  // === 错误状态 ===
  &__error {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-1);
    border: var(--space-px) solid var(--border-secondary);
  }

  &__error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    text-align: center;
    padding: var(--space-4);
    color: var(--text-tertiary);
  }

  &__error-message {
    font-size: var(--text-sm);
    margin: 0;
  }

  // === 覆盖层 ===
  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.6) 0%,
      rgba(0, 0, 0, 0.3) 50%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity var(--duration-normal) var(--ease-out);
    display: flex;
    align-items: flex-end;
    padding: var(--space-4);
    z-index: var(--z-floating);
  }

  // === 交互状态 ===
  &--zoom-hover:hover {
    .lazy-image__image {
      transform: scale(1.05);
    }

    .lazy-image__overlay {
      opacity: 1;
    }
  }

  &:hover {
    .lazy-image__overlay {
      opacity: 1;
    }
  }

  // === 状态类 ===
  &--loading {
    .lazy-image__placeholder {
      animation: pulse var(--duration-slower) ease-in-out infinite;
    }
  }

  &--loaded {
    .lazy-image__placeholder {
      opacity: 0;
    }
  }

  &--error {
    .lazy-image__placeholder,
    .lazy-image__image {
      display: none;
    }
  }

  // === 响应式优化 ===
  @media (max-width: 640px) {
    &__error-content {
      padding: var(--space-2);
      gap: var(--space-1);
    }

    &__error-message {
      font-size: var(--text-xs);
    }

    &__overlay {
      padding: var(--space-2);
    }
  }
}

// === 动画定义 ===
@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// === 可访问性优化 ===
@media (prefers-reduced-motion: reduce) {
  .lazy-image {
    &__skeleton-content {
      animation: none;
    }

    &__spinner {
      animation: none;
    }

    &--loading .lazy-image__placeholder {
      animation: none;
    }

    &__image,
    &__overlay {
      transition: none;
    }
  }
}

// === 性能优化 ===
.lazy-image {
  // 硬件加速
  transform: translateZ(0);

  // 渲染优化
  contain: layout style paint;

  &__image,
  &__placeholder {
    // 避免重排重绘
    will-change: auto;
  }
}
</style>