<template>
  <div
    ref="containerRef"
    class="masonry-grid"
    :class="containerClasses"
    :style="containerStyles"
  >
    <!-- 瀑布流项目 -->
    <div
      v-for="(item, index) in visibleItems"
      :key="getItemKey(item, index)"
      ref="itemRefs"
      class="masonry-grid__item"
      :class="getItemClasses(item, index)"
      :style="getItemStyle(item, index)"
    >
      <slot
        :item="item"
        :index="index"
        :is-visible="isItemVisible(index)"
      />
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="masonry-grid__loading"
      :style="loadingStyle"
    >
      <div class="masonry-grid__loading-content">
        <div class="masonry-grid__spinner" />
        <span v-if="loadingText" class="masonry-grid__loading-text">
          {{ loadingText }}
        </span>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!loading && items.length === 0"
      class="masonry-grid__empty"
      :style="emptyStyle"
    >
      <slot name="empty">
        <div class="masonry-grid__empty-content">
          <div class="masonry-grid__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 class="masonry-grid__empty-title">{{ emptyTitle }}</h3>
          <p class="masonry-grid__empty-message">{{ emptyMessage }}</p>
        </div>
      </slot>
    </div>

    <!-- 滚动底部感知元素 -->
    <div
      ref="sentinelRef"
      class="masonry-grid__sentinel"
      :style="sentinelStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useMasonryGrid } from '@/composables/useMasonryGrid'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'

// Types
export interface MasonryGridItem {
  id: string | number
  [key: string]: any
}

export interface MasonryGridProps {
  items: MasonryGridItem[]
  columnCount?: number | 'auto'
  gap?: number | string
  loading?: boolean
  loadingText?: string
  emptyTitle?: string
  emptyMessage?: string
  minItemWidth?: number
  maxItemWidth?: number
  itemKey?: string | ((item: MasonryGridItem, index: number) => string)
  aspectRatio?: 'auto' | number
  virtualScroll?: boolean
  bufferSize?: number
  threshold?: number
}

// Props
const props = withDefaults(defineProps<MasonryGridProps>(), {
  columnCount: 'auto',
  gap: 16,
  loading: false,
  loadingText: '加载中...',
  emptyTitle: '暂无内容',
  emptyMessage: '试试调整筛选条件或刷新页面',
  minItemWidth: 250,
  maxItemWidth: 350,
  itemKey: 'id',
  aspectRatio: 'auto',
  virtualScroll: false,
  bufferSize: 5,
  threshold: 0.1
})

// Emits
const emit = defineEmits<{
  'scroll-end': []
  'item-visible': [item: MasonryGridItem, index: number]
  'item-hidden': [item: MasonryGridItem, index: number]
}>()

// Refs
const containerRef = ref<HTMLElement>()
const itemRefs = ref<HTMLElement[]>([])
const sentinelRef = ref<HTMLElement>()

// Composables
const {
  visibleItems,
  containerStyles,
  isItemVisible,
  updateLayout,
  getItemStyle,
  calculateColumns,
  resizeObserver
} = useMasonryGrid({
  items: computed(() => props.items),
  columnCount: computed(() => props.columnCount),
  gap: computed(() => props.gap),
  minItemWidth: computed(() => props.minItemWidth),
  maxItemWidth: computed(() => props.maxItemWidth),
  virtualScroll: computed(() => props.virtualScroll),
  bufferSize: computed(() => props.bufferSize),
  containerRef
})

const {
  setupIntersectionObserver,
  cleanup: cleanupInfiniteScroll
} = useInfiniteScroll({
  sentinelRef,
  threshold: props.threshold,
  onIntersect: () => emit('scroll-end')
})

// Computed
const containerClasses = computed(() => [
  'masonry-grid',
  {
    'masonry-grid--loading': props.loading,
    'masonry-grid--empty': !props.loading && props.items.length === 0,
    'masonry-grid--virtual': props.virtualScroll
  }
])

const gapValue = computed(() => {
  return typeof props.gap === 'string' ? props.gap : `${props.gap}px`
})

const loadingStyle = computed(() => ({
  '--masonry-columns': calculateColumns(),
  '--masonry-gap': gapValue.value
}))

const emptyStyle = computed(() => ({
  '--masonry-columns': calculateColumns(),
  '--masonry-gap': gapValue.value
}))

const sentinelStyle = computed(() => ({
  gridColumn: '1 / -1',
  height: '1px'
}))

// Methods
const getItemKey = (item: MasonryGridItem, index: number): string => {
  if (typeof props.itemKey === 'string') {
    return String(item[props.itemKey] || index)
  } else {
    return props.itemKey(item, index)
  }
}

const getItemClasses = (item: MasonryGridItem, index: number) => [
  'masonry-grid__item',
  {
    'masonry-grid__item--visible': isItemVisible(index),
    'masonry-grid__item--loading': props.loading
  }
]

// Watchers
watch(() => props.items, async () => {
  await nextTick()
  updateLayout()
}, { deep: true })

watch(() => props.columnCount, () => {
  updateLayout()
})

watch(() => props.gap, () => {
  updateLayout()
})

// Lifecycle
onMounted(async () => {
  await nextTick()

  // 设置 ResizeObserver
  if (containerRef.value) {
    resizeObserver?.observe(containerRef.value)
  }

  // 设置无限滚动监听
  setupIntersectionObserver()

  // 初始化布局
  updateLayout()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  cleanupInfiniteScroll()
})

// Expose methods
defineExpose({
  updateLayout,
  calculateColumns,
  getItemStyle
})
</script>

<style lang="scss">
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(var(--masonry-columns, auto-fill), minmax(var(--masonry-min-width, 250px), 1fr));
  gap: var(--masonry-gap, 16px);
  width: 100%;
  align-items: start;
  position: relative;

  // CSS Grid Masonry (实验性支持)
  @supports (grid-template-rows: masonry) {
    grid-template-rows: masonry;
  }

  // === 项目样式 ===
  &__item {
    position: relative;
    width: 100%;
    break-inside: avoid;
    transition: opacity var(--duration-normal) var(--ease-out),
                transform var(--duration-normal) var(--ease-out);

    &--loading {
      opacity: 0.6;
      pointer-events: none;
    }

    // 虚拟滚动时的可见性控制
    .masonry-grid--virtual & {
      opacity: 0;
      transform: translateY(var(--space-4));

      &--visible {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  // === 加载状态 ===
  &__loading {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(var(--space-32) * 2); // 256px
    padding: var(--spacing-comfortable);
    color: var(--text-secondary);
  }

  &__loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-normal);
  }

  &__spinner {
    width: var(--space-8); // 32px
    height: var(--space-8);
    border: var(--space-px-2) solid var(--border-secondary);
    border-top-color: var(--tavern-primary);
    border-radius: var(--radius-full);
    animation: spin var(--duration-slow) linear infinite;
  }

  &__loading-text {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-tertiary);
  }

  // === 空状态 ===
  &__empty {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(var(--space-32) * 3); // 384px
    padding: var(--spacing-relaxed);
    color: var(--text-secondary);
  }

  &__empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-normal);
    text-align: center;
    max-width: var(--space-80); // 320px
  }

  &__empty-icon {
    width: var(--space-12); // 48px
    height: var(--space-12);
    color: var(--text-quaternary);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__empty-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  &__empty-message {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  // === 无限滚动监听元素 ===
  &__sentinel {
    width: 100%;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  // === 状态类 ===
  &--loading {
    .masonry-grid__item {
      animation: pulse var(--duration-slower) ease-in-out infinite;
    }
  }

  &--empty {
    .masonry-grid__item {
      display: none;
    }
  }

  // === 响应式设计 ===

  // 移动端
  @media (max-width: 640px) {
    --masonry-min-width: 100%;
    grid-template-columns: 1fr;
    gap: var(--spacing-normal);

    &__loading,
    &__empty {
      min-height: var(--space-48); // 192px
      padding: var(--spacing-normal);
    }
  }

  // 平板端
  @media (min-width: 641px) and (max-width: 1024px) {
    --masonry-min-width: calc(50% - var(--masonry-gap) / 2);
    grid-template-columns: repeat(2, 1fr);
  }

  // 桌面端 - 小屏
  @media (min-width: 1025px) and (max-width: 1279px) {
    --masonry-min-width: calc(33.333% - var(--masonry-gap) * 2 / 3);
    grid-template-columns: repeat(3, 1fr);
  }

  // 桌面端 - 中屏
  @media (min-width: 1280px) and (max-width: 1535px) {
    --masonry-min-width: calc(25% - var(--masonry-gap) * 3 / 4);
    grid-template-columns: repeat(4, 1fr);
  }

  // 桌面端 - 大屏
  @media (min-width: 1536px) {
    --masonry-min-width: calc(20% - var(--masonry-gap) * 4 / 5);
    grid-template-columns: repeat(5, 1fr);
  }
}

// === 动画定义 ===
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

// === 性能优化 ===
.masonry-grid {
  // 开启GPU加速
  transform: translateZ(0);

  // 优化渲染性能
  contain: layout style;

  // 减少重绘
  will-change: auto;

  &__item {
    // 项目独立渲染上下文
    contain: layout style paint;

    // 避免不必要的重排
    transform: translateZ(0);
  }
}

// === 可访问性优化 ===

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .masonry-grid {
    &__item {
      transition: none;
      animation: none;
    }

    &__spinner {
      animation: none;
      border-top-color: var(--border-secondary);
    }

    &--loading .masonry-grid__item {
      animation: none;
    }
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .masonry-grid {
    &__loading,
    &__empty {
      border: var(--space-px) solid var(--border-primary);
    }

    &__spinner {
      border-width: var(--space-1);
    }
  }
}
</style>