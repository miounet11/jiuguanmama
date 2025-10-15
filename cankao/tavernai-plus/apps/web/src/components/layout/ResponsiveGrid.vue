<template>
  <div
    class="responsive-grid"
    :class="gridClasses"
    :style="gridStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEnhancedResponsive } from '@/composables/useEnhancedResponsive'

// Props定义
interface Props {
  // 基础网格配置
  columns?: number | Record<string, number>
  gap?: string | number | Record<string, string | number>
  rows?: string | number | Record<string, string | number>

  // 响应式配置
  mobileColumns?: number
  tabletColumns?: number
  desktopColumns?: number
  largeDesktopColumns?: number

  mobileGap?: string | number
  tabletGap?: string | number
  desktopGap?: string | number
  largeDesktopGap?: string | number

  // 布局配置
  autoColumns?: string
  autoRows?: string
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'

  // 对齐配置
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  justifyContent?: 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'
  alignContent?: 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'

  // 项目配置
  itemMinWidth?: string | number
  itemMaxWidth?: string | number
  itemAspectRatio?: string | number

  // 容器配置
  maxWidth?: string | number
  padding?: string | number | Record<string, string | number>
  margin?: string | number

  // 性能配置
  virtualScroll?: boolean
  itemHeight?: string | number
  visibleItems?: number

  // 自定义类名
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: 12,
  gap: 16,
  autoFlow: 'row',
  alignItems: 'stretch',
  justifyContent: 'start',
  alignContent: 'start',
  mobileColumns: 1,
  tabletColumns: 2,
  desktopColumns: 3,
  largeDesktopColumns: 4,
  mobileGap: 12,
  tabletGap: 16,
  desktopGap: 20,
  largeDesktopGap: 24,
  padding: 0,
  margin: 0,
  virtualScroll: false,
})

// 响应式Hook
const {
  isMobileDevice,
  isTablet,
  isDesktop,
  isLargeDesktop,
  deviceType,
  getResponsiveSpacing,
  currentBreakpoint,
} = useEnhancedResponsive()

// 计算属性
const currentColumns = computed(() => {
  if (typeof props.columns === 'object') {
    // 如果是对象，根据当前断点返回对应的列数
    const breakpointKeys = Object.keys(props.columns).sort((a, b) => {
      // 按断点大小排序
      const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
      return breakpointOrder.indexOf(a) - breakpointOrder.indexOf(b)
    })

    for (const breakpoint of breakpointKeys) {
      if (currentBreakpoint.value === breakpoint ||
          (breakpointOrder.indexOf(currentBreakpoint.value) >= breakpointOrder.indexOf(breakpoint))) {
        return props.columns[breakpoint]
      }
    }
    return 12 // 默认值
  }

  // 根据设备类型返回对应的列数
  if (isLargeDesktop.value) return props.largeDesktopColumns
  if (isDesktop.value) return props.desktopColumns
  if (isTablet.value) return props.tabletColumns
  return props.mobileColumns
})

const currentGap = computed(() => {
  if (typeof props.gap === 'object') {
    // 如果是对象，根据当前断点返回对应的间距
    const breakpointKeys = Object.keys(props.gap).sort((a, b) => {
      const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
      return breakpointOrder.indexOf(a) - breakpointOrder.indexOf(b)
    })

    for (const breakpoint of breakpointKeys) {
      if (currentBreakpoint.value === breakpoint ||
          (breakpointOrder.indexOf(currentBreakpoint.value) >= breakpointOrder.indexOf(breakpoint))) {
        return props.gap[breakpoint]
      }
    }
    return 16 // 默认值
  }

  // 根据设备类型返回对应的间距
  if (isLargeDesktop.value) return props.largeDesktopGap
  if (isDesktop.value) return props.desktopGap
  if (isTablet.value) return props.tabletGap
  return props.mobileGap
})

const currentPadding = computed(() => {
  if (typeof props.padding === 'object') {
    // 如果是对象，根据当前断点返回对应的内边距
    const breakpointKeys = Object.keys(props.padding).sort((a, b) => {
      const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
      return breakpointOrder.indexOf(a) - breakpointOrder.indexOf(b)
    })

    for (const breakpoint of breakpointKeys) {
      if (currentBreakpoint.value === breakpoint ||
          (breakpointOrder.indexOf(currentBreakpoint.value) >= breakpointOrder.indexOf(breakpoint))) {
        return props.padding[breakpoint]
      }
    }
    return 0
  }

  return props.padding
})

const gridClasses = computed(() => [
  'responsive-grid',
  `responsive-grid--${deviceType.value}`,
  `responsive-grid--columns-${currentColumns.value}`,
  {
    'responsive-grid--virtual-scroll': props.virtualScroll,
    'responsive-grid--has-max-width': !!props.maxWidth,
    'responsive-grid--has-padding': !!props.padding,
  },
  props.class,
])

const gridStyles = computed(() => {
  const styles: Record<string, any> = {}

  // 网格模板列
  if (props.itemMinWidth || props.itemMaxWidth) {
    // 使用自适应列
    const minWidth = props.itemMinWidth || '200px'
    const maxWidth = props.itemMaxWidth || '1fr'
    styles.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}, ${maxWidth}))`
  } else {
    // 使用固定列数
    styles.gridTemplateColumns = `repeat(${currentColumns.value}, 1fr)`
  }

  // 网格间距
  if (typeof currentGap.value === 'number') {
    styles.gap = `${currentGap.value}px`
  } else {
    styles.gap = currentGap.value
  }

  // 网格行
  if (props.rows) {
    if (typeof props.rows === 'number') {
      styles.gridTemplateRows = `repeat(${props.rows}, 1fr)`
    } else {
      styles.gridTemplateRows = props.rows
    }
  }

  // 自动列
  if (props.autoColumns) {
    styles.gridAutoColumns = props.autoColumns
  }

  // 自动行
  if (props.autoRows) {
    styles.gridAutoRows = props.autoRows
  }

  // 自动流
  if (props.autoFlow) {
    styles.gridAutoFlow = props.autoFlow
  }

  // 对齐方式
  if (props.alignItems) {
    styles.alignItems = props.alignItems
  }

  if (props.justifyContent) {
    styles.justifyContent = props.justifyContent
  }

  if (props.alignContent) {
    styles.alignContent = props.alignContent
  }

  // 容器样式
  if (props.maxWidth) {
    styles.maxWidth = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
    styles.marginLeft = 'auto'
    styles.marginRight = 'auto'
  }

  if (currentPadding.value) {
    if (typeof currentPadding.value === 'number') {
      styles.padding = `${currentPadding.value}px`
    } else {
      styles.padding = currentPadding.value
    }
  }

  if (props.margin) {
    if (typeof props.margin === 'number') {
      styles.margin = `${props.margin}px`
    } else {
      styles.margin = props.margin
    }
  }

  return styles
})
</script>

<style lang="scss" scoped>
@import '@/styles/responsive.scss';

.responsive-grid {
  display: grid;
  width: 100%;

  // 性能优化
  @include mobile-performance-optimization {
    transform: translateZ(0);
    will-change: auto;
  }

  // 设备特定样式
  &--mobile {
    // 移动端优化
    gap: getResponsiveSpacing(12px);

    // 减少复杂动画
    * {
      transition: none !important;
    }
  }

  &--tablet {
    gap: getResponsiveSpacing(16px);
  }

  &--desktop {
    gap: getResponsiveSpacing(20px);
  }

  // 列数变体
  &--columns-1 { grid-template-columns: repeat(1, 1fr); }
  &--columns-2 { grid-template-columns: repeat(2, 1fr); }
  &--columns-3 { grid-template-columns: repeat(3, 1fr); }
  &--columns-4 { grid-template-columns: repeat(4, 1fr); }
  &--columns-5 { grid-template-columns: repeat(5, 1fr); }
  &--columns-6 { grid-template-columns: repeat(6, 1fr); }
  &--columns-7 { grid-template-columns: repeat(7, 1fr); }
  &--columns-8 { grid-template-columns: repeat(8, 1fr); }
  &--columns-9 { grid-template-columns: repeat(9, 1fr); }
  &--columns-10 { grid-template-columns: repeat(10, 1fr); }
  &--columns-11 { grid-template-columns: repeat(11, 1fr); }
  &--columns-12 { grid-template-columns: repeat(12, 1fr); }

  // 虚拟滚动
  &--virtual-scroll {
    height: 100vh;
    overflow-y: auto;
    @include custom-scrollbar;
  }

  // 容器样式
  &--has-max-width {
    margin-left: auto;
    margin-right: auto;
  }

  &--has-padding {
    box-sizing: border-box;
  }

  // 子元素基础样式
  > * {
    min-width: 0; // 防止内容溢出
    box-sizing: border-box;
  }

  // 对齐方式变体
  &[style*="align-items: start"] {
    align-items: flex-start;
  }

  &[style*="align-items: center"] {
    align-items: center;
  }

  &[style*="align-items: end"] {
    align-items: flex-end;
  }

  &[style*="align-items: stretch"] {
    align-items: stretch;
  }

  &[style*="justify-content: start"] {
    justify-content: flex-start;
  }

  &[style*="justify-content: center"] {
    justify-content: center;
  }

  &[style*="justify-content: end"] {
    justify-content: flex-end;
  }

  &[style*="justify-content: stretch"] {
    justify-content: stretch;
  }

  &[style*="justify-content: space-between"] {
    justify-content: space-between;
  }

  &[style*="justify-content: space-around"] {
    justify-content: space-around;
  }

  &[style*="justify-content: space-evenly"] {
    justify-content: space-evenly;
  }

  &[style*="align-content: start"] {
    align-content: flex-start;
  }

  &[style*="align-content: center"] {
    align-content: center;
  }

  &[style*="align-content: end"] {
    align-content: flex-end;
  }

  &[style*="align-content: stretch"] {
    align-content: stretch;
  }

  &[style*="align-content: space-between"] {
    align-content: space-between;
  }

  &[style*="align-content: space-around"] {
    align-content: space-around;
  }

  &[style*="align-content: space-evenly"] {
    align-content: space-evenly;
  }
}

// 响应式断点样式
@include mobile-only {
  .responsive-grid {
    // 移动端特殊处理
    &--columns-4,
    &--columns-5,
    &--columns-6,
    &--columns-7,
    &--columns-8,
    &--columns-9,
    &--columns-10,
    &--columns-11,
    &--columns-12 {
      // 在移动端，超过3列时自动调整为2列
      grid-template-columns: repeat(2, 1fr);
    }

    &--columns-3 {
      grid-template-columns: repeat(2, 1fr);
    }

    &--columns-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    &--columns-1 {
      grid-template-columns: 1fr;
    }
  }
}

@include tablet-only {
  .responsive-grid {
    // 平板端特殊处理
    &--columns-5,
    &--columns-6,
    &--columns-7,
    &--columns-8,
    &--columns-9,
    &--columns-10,
    &--columns-11,
    &--columns-12 {
      // 在平板端，超过4列时自动调整为3列
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

@include desktop-only {
  .responsive-grid {
    // 桌面端特殊处理
    &--virtual-scroll {
      // 桌面端虚拟滚动优化
      scroll-behavior: smooth;

      &:hover {
        scrollbar-width: thin;
        scrollbar-color: var(--border-secondary) transparent;
      }
    }
  }
}

// 容器查询支持 (现代浏览器)
@supports (container-type: inline-size) {
  .responsive-grid {
    container-type: inline-size;
  }

  // 小容器查询
  @container (max-width: 480px) {
    .responsive-grid {
      grid-template-columns: repeat(1, 1fr);
    }
  }

  // 中等容器查询
  @container (min-width: 481px) and (max-width: 768px) {
    .responsive-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  // 大容器查询
  @container (min-width: 769px) and (max-width: 1024px) {
    .responsive-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  // 超大容器查询
  @container (min-width: 1025px) {
    .responsive-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .responsive-grid {
    // 减少动画和过渡
    * {
      transition: none !important;
      animation: none !important;
    }
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .responsive-grid {
    // 增强边框和对比度
    > * {
      border: 1px solid var(--border-primary);
    }
  }
}

// 打印样式
@media print {
  .responsive-grid {
    // 打印时的布局优化
    display: block;

    > * {
      display: block;
      break-inside: avoid;
      margin-bottom: 1rem;
      page-break-inside: avoid;
    }

    &--virtual-scroll {
      height: auto;
      overflow: visible;
    }
  }
}

// 性能优化样式
.responsive-grid--low-performance {
  // 低性能设备优化
  contain: layout style paint;

  > * {
    contain: layout style paint;
  }
}

// 焦点管理
.responsive-grid {
  // 确保网格内的元素可以获得焦点
  &:focus-within {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
}

// 加载状态
.responsive-grid--loading {
  > * {
    opacity: 0.6;
    pointer-events: none;
  }
}

// 错误状态
.responsive-grid--error {
  > * {
    filter: grayscale(1);
    opacity: 0.7;
  }
}

// 空状态
.responsive-grid:empty {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-style: italic;

  &::before {
    content: "暂无内容";
  }
}
</style>