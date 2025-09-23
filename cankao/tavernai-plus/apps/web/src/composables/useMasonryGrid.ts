import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Ref, ComputedRef } from 'vue'

export interface MasonryGridItem {
  id: string | number
  [key: string]: any
}

export interface MasonryGridOptions {
  items: ComputedRef<MasonryGridItem[]>
  columnCount: ComputedRef<number | 'auto'>
  gap: ComputedRef<number | string>
  minItemWidth: ComputedRef<number>
  maxItemWidth: ComputedRef<number>
  virtualScroll: ComputedRef<boolean>
  bufferSize: ComputedRef<number>
  containerRef: Ref<HTMLElement | undefined>
}

export interface ItemLayout {
  x: number
  y: number
  width: number
  height: number
  column: number
  visible: boolean
}

/**
 * 瀑布流网格布局组合式函数
 * 提供高性能的瀑布流布局计算和虚拟滚动支持
 */
export function useMasonryGrid(options: MasonryGridOptions) {
  const {
    items,
    columnCount,
    gap,
    minItemWidth,
    maxItemWidth,
    virtualScroll,
    bufferSize,
    containerRef
  } = options

  // 状态管理
  const layouts = ref<Map<string | number, ItemLayout>>(new Map())
  const columnHeights = ref<number[]>([])
  const containerWidth = ref(0)
  const containerHeight = ref(0)
  const scrollTop = ref(0)
  const viewportHeight = ref(0)
  const actualColumns = ref(1)
  const itemHeights = ref<Map<string | number, number>>(new Map())

  // ResizeObserver 实例
  let resizeObserver: ResizeObserver | null = null
  let intersectionObserver: IntersectionObserver | null = null

  // 计算列数
  const calculateColumns = (): number => {
    if (columnCount.value === 'auto') {
      if (containerWidth.value === 0) return 1

      const availableWidth = containerWidth.value
      const gapValue = typeof gap.value === 'number' ? gap.value : 16
      const minWidth = minItemWidth.value

      // 计算最佳列数
      let cols = Math.floor((availableWidth + gapValue) / (minWidth + gapValue))
      cols = Math.max(1, cols)

      // 限制最大列数以避免项目过窄
      const maxCols = Math.floor(availableWidth / 200) // 最小200px宽度
      cols = Math.min(cols, maxCols)

      return cols
    } else {
      return Math.max(1, columnCount.value)
    }
  }

  // 计算项目宽度
  const calculateItemWidth = (): number => {
    const cols = actualColumns.value
    const gapValue = typeof gap.value === 'number' ? gap.value : 16
    const availableWidth = containerWidth.value - (gapValue * (cols - 1))
    return Math.floor(availableWidth / cols)
  }

  // 获取间隙值
  const getGapValue = (): number => {
    return typeof gap.value === 'number' ? gap.value : 16
  }

  // 计算项目布局
  const calculateItemLayout = (item: MasonryGridItem, index: number): ItemLayout => {
    const itemId = item.id
    const cols = actualColumns.value
    const gapValue = getGapValue()
    const itemWidth = calculateItemWidth()

    // 估算高度（如果没有实际测量值）
    let itemHeight = itemHeights.value.get(itemId) || 300 // 默认高度

    // 找到最短的列
    let minColumnIndex = 0
    let minHeight = columnHeights.value[0] || 0

    for (let i = 1; i < cols; i++) {
      const height = columnHeights.value[i] || 0
      if (height < minHeight) {
        minHeight = height
        minColumnIndex = i
      }
    }

    // 计算位置
    const x = minColumnIndex * (itemWidth + gapValue)
    const y = minHeight

    // 更新列高度
    const newColumnHeights = [...columnHeights.value]
    newColumnHeights[minColumnIndex] = (newColumnHeights[minColumnIndex] || 0) + itemHeight + gapValue
    columnHeights.value = newColumnHeights

    return {
      x,
      y,
      width: itemWidth,
      height: itemHeight,
      column: minColumnIndex,
      visible: !virtualScroll.value || isInViewport(y, itemHeight)
    }
  }

  // 判断项目是否在视口内
  const isInViewport = (itemY: number, itemHeight: number): boolean => {
    const buffer = bufferSize.value * viewportHeight.value
    const itemTop = itemY
    const itemBottom = itemY + itemHeight
    const viewTop = scrollTop.value - buffer
    const viewBottom = scrollTop.value + viewportHeight.value + buffer

    return itemBottom >= viewTop && itemTop <= viewBottom
  }

  // 重新计算所有布局
  const updateLayout = async () => {
    if (!containerRef.value) return

    // 更新容器尺寸
    const rect = containerRef.value.getBoundingClientRect()
    containerWidth.value = rect.width

    // 重新计算列数
    const newColumns = calculateColumns()
    if (newColumns !== actualColumns.value) {
      actualColumns.value = newColumns
      columnHeights.value = new Array(newColumns).fill(0)
    } else {
      columnHeights.value = new Array(actualColumns.value).fill(0)
    }

    // 重新计算所有项目布局
    const newLayouts = new Map<string | number, ItemLayout>()

    items.value.forEach((item, index) => {
      const layout = calculateItemLayout(item, index)
      newLayouts.set(item.id, layout)
    })

    layouts.value = newLayouts

    // 计算总高度
    const maxHeight = Math.max(...columnHeights.value, 0)
    containerHeight.value = maxHeight

    await nextTick()
  }

  // 更新项目高度
  const updateItemHeight = (itemId: string | number, height: number) => {
    if (itemHeights.value.get(itemId) !== height) {
      itemHeights.value.set(itemId, height)
      updateLayout()
    }
  }

  // 获取项目样式
  const getItemStyle = (item: MasonryGridItem, index: number) => {
    const layout = layouts.value.get(item.id)

    if (!layout) {
      return {
        opacity: '0',
        transform: 'translateY(20px)'
      }
    }

    const baseStyle: Record<string, string> = {
      position: 'absolute' as const,
      left: `${layout.x}px`,
      top: `${layout.y}px`,
      width: `${layout.width}px`,
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }

    if (virtualScroll.value) {
      baseStyle.opacity = layout.visible ? '1' : '0'
      baseStyle.transform = layout.visible ? 'translateY(0)' : 'translateY(20px)'
    }

    return baseStyle
  }

  // 判断项目是否可见
  const isItemVisible = (index: number): boolean => {
    if (!virtualScroll.value) return true

    const item = items.value[index]
    if (!item) return false

    const layout = layouts.value.get(item.id)
    return layout?.visible ?? false
  }

  // 获取可见项目
  const visibleItems = computed(() => {
    if (!virtualScroll.value) {
      return items.value
    }

    return items.value.filter((item, index) => {
      const layout = layouts.value.get(item.id)
      return layout?.visible ?? true
    })
  })

  // 容器样式
  const containerStyles = computed(() => {
    const gapValue = getGapValue()
    const cols = actualColumns.value

    return {
      '--masonry-columns': cols.toString(),
      '--masonry-gap': `${gapValue}px`,
      '--masonry-min-width': `${minItemWidth.value}px`,
      '--masonry-max-width': `${maxItemWidth.value}px`,
      position: 'relative' as const,
      height: `${containerHeight.value}px`,
      width: '100%'
    }
  })

  // 设置 ResizeObserver
  const setupResizeObserver = () => {
    if (typeof ResizeObserver === 'undefined') return

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width } = entry.contentRect
        if (Math.abs(width - containerWidth.value) > 1) { // 避免小幅度变化
          containerWidth.value = width
          updateLayout()
        }
      }
    })

    if (containerRef.value) {
      resizeObserver.observe(containerRef.value)
    }
  }

  // 设置 IntersectionObserver 用于虚拟滚动
  const setupIntersectionObserver = () => {
    if (!virtualScroll.value || typeof IntersectionObserver === 'undefined') return

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        let needsUpdate = false

        entries.forEach((entry) => {
          const itemElement = entry.target as HTMLElement
          const itemId = itemElement.dataset.itemId

          if (itemId) {
            const layout = layouts.value.get(itemId)
            if (layout && layout.visible !== entry.isIntersecting) {
              layout.visible = entry.isIntersecting
              needsUpdate = true
            }
          }
        })

        if (needsUpdate) {
          // 触发响应式更新
          layouts.value = new Map(layouts.value)
        }
      },
      {
        root: containerRef.value,
        rootMargin: `${bufferSize.value * 100}px`,
        threshold: 0.1
      }
    )
  }

  // 监听滚动事件
  const handleScroll = () => {
    if (!virtualScroll.value) return

    scrollTop.value = window.scrollY || document.documentElement.scrollTop
    viewportHeight.value = window.innerHeight

    // 更新可见项目
    let needsUpdate = false
    layouts.value.forEach((layout, itemId) => {
      const wasVisible = layout.visible
      const isVisible = isInViewport(layout.y, layout.height)

      if (wasVisible !== isVisible) {
        layout.visible = isVisible
        needsUpdate = true
      }
    })

    if (needsUpdate) {
      layouts.value = new Map(layouts.value)
    }
  }

  // 节流滚动处理
  let scrollThrottleTimer: number | null = null
  const throttledHandleScroll = () => {
    if (scrollThrottleTimer) return

    scrollThrottleTimer = requestAnimationFrame(() => {
      handleScroll()
      scrollThrottleTimer = null
    })
  }

  // 监听 items 变化
  watch(items, async () => {
    await nextTick()
    updateLayout()
  }, { deep: true })

  // 监听配置变化
  watch([columnCount, gap, minItemWidth, maxItemWidth], () => {
    updateLayout()
  })

  // 监听虚拟滚动开关
  watch(virtualScroll, (enabled) => {
    if (enabled) {
      window.addEventListener('scroll', throttledHandleScroll, { passive: true })
      setupIntersectionObserver()
    } else {
      window.removeEventListener('scroll', throttledHandleScroll)
      intersectionObserver?.disconnect()
      intersectionObserver = null
    }
    updateLayout()
  })

  // 初始化
  onMounted(() => {
    setupResizeObserver()

    if (virtualScroll.value) {
      window.addEventListener('scroll', throttledHandleScroll, { passive: true })
      setupIntersectionObserver()
    }

    // 获取初始视口信息
    viewportHeight.value = window.innerHeight
    scrollTop.value = window.scrollY || document.documentElement.scrollTop

    nextTick(updateLayout)
  })

  // 清理
  onUnmounted(() => {
    resizeObserver?.disconnect()
    intersectionObserver?.disconnect()

    if (scrollThrottleTimer) {
      cancelAnimationFrame(scrollThrottleTimer)
    }

    window.removeEventListener('scroll', throttledHandleScroll)
  })

  return {
    // 状态
    layouts: computed(() => layouts.value),
    visibleItems,
    containerStyles,
    actualColumns: computed(() => actualColumns.value),
    containerHeight: computed(() => containerHeight.value),

    // 方法
    updateLayout,
    updateItemHeight,
    getItemStyle,
    isItemVisible,
    calculateColumns,

    // ResizeObserver 实例（供外部使用）
    resizeObserver: computed(() => resizeObserver)
  }
}