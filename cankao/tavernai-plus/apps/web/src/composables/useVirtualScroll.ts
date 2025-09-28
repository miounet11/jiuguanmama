import { ref, computed, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'

/**
 * 虚拟滚动组合式函数
 * 用于优化大量数据的渲染性能
 */

export interface VirtualScrollItem {
  id: string | number
  [key: string]: any
}

export interface VirtualScrollOptions {
  /**
   * 容器高度（像素）
   */
  containerHeight?: number

  /**
   * 每个项目的估算高度（像素）
   */
  itemHeight?: number

  /**
   * 缓冲区大小（上下额外渲染的项目数量）
   */
  overscan?: number

  /**
   * 启用虚拟滚动的最小项目数量
   */
  threshold?: number

  /**
   * 是否启用动态高度计算
   */
  enableDynamicHeight?: boolean

  /**
   * 滚动方向
   */
  direction?: 'vertical' | 'horizontal'
}

const DEFAULT_OPTIONS: Required<VirtualScrollOptions> = {
  containerHeight: 600,
  itemHeight: 120,
  overscan: 5,
  threshold: 50,
  enableDynamicHeight: false,
  direction: 'vertical'
}

/**
 * 虚拟滚动组合式函数
 */
export function useVirtualScroll<T extends VirtualScrollItem>(
  items: Ref<T[]>,
  containerRef: Ref<HTMLElement | null>,
  options: VirtualScrollOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 响应式状态
  const scrollTop = ref(0)
  const containerHeight = ref(opts.containerHeight)
  const itemHeights = ref<Map<string | number, number>>(new Map())
  const isEnabled = ref(false)

  // 计算属性
  const shouldUseVirtualScroll = computed(() => {
    return items.value.length > opts.threshold && isEnabled.value
  })

  const totalHeight = computed(() => {
    if (!shouldUseVirtualScroll.value) return 0

    if (opts.enableDynamicHeight) {
      // 使用实际测量的高度
      let total = 0
      items.value.forEach(item => {
        const height = itemHeights.value.get(item.id) || opts.itemHeight
        total += height
      })
      return total
    } else {
      // 使用固定高度
      return items.value.length * opts.itemHeight
    }
  })

  const visibleRange = computed(() => {
    if (!shouldUseVirtualScroll.value) {
      return {
        startIndex: 0,
        endIndex: items.value.length - 1,
        offsetY: 0
      }
    }

    const itemHeight = opts.itemHeight
    const containerH = containerHeight.value
    const scroll = scrollTop.value

    // 计算可见范围
    let startIndex = Math.floor(scroll / itemHeight)
    let endIndex = Math.min(
      items.value.length - 1,
      Math.ceil((scroll + containerH) / itemHeight)
    )

    // 应用缓冲区
    startIndex = Math.max(0, startIndex - opts.overscan)
    endIndex = Math.min(items.value.length - 1, endIndex + opts.overscan)

    // 计算偏移量
    const offsetY = startIndex * itemHeight

    return { startIndex, endIndex, offsetY }
  })

  const visibleItems = computed(() => {
    if (!shouldUseVirtualScroll.value) {
      return items.value.map((item, index) => ({
        ...item,
        virtualIndex: index
      }))
    }

    const { startIndex, endIndex } = visibleRange.value
    return items.value
      .slice(startIndex, endIndex + 1)
      .map((item, index) => ({
        ...item,
        virtualIndex: startIndex + index
      }))
  })

  const spacerTop = computed(() => {
    if (!shouldUseVirtualScroll.value) return 0
    return visibleRange.value.offsetY
  })

  const spacerBottom = computed(() => {
    if (!shouldUseVirtualScroll.value) return 0
    const { endIndex } = visibleRange.value
    const remainingItems = items.value.length - endIndex - 1
    return Math.max(0, remainingItems * opts.itemHeight)
  })

  // 滚动处理
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop

    // 更新容器高度
    if (target.clientHeight !== containerHeight.value) {
      containerHeight.value = target.clientHeight
    }
  }

  // 测量项目高度
  const measureItemHeight = (itemId: string | number, height: number) => {
    if (opts.enableDynamicHeight) {
      itemHeights.value.set(itemId, height)
    }
  }

  // 滚动到指定项目
  const scrollToItem = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.value) return

    const targetScrollTop = index * opts.itemHeight
    containerRef.value.scrollTo({
      top: targetScrollTop,
      behavior
    })
  }

  // 滚动到底部
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.value) return

    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior
    })
  }

  // 滚动到顶部
  const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.value) return

    containerRef.value.scrollTo({
      top: 0,
      behavior
    })
  }

  // 检查是否在底部
  const isAtBottom = computed(() => {
    if (!containerRef.value) return false

    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    return scrollHeight - scrollTop - clientHeight < 50 // 50px tolerance
  })

  // 检查是否在顶部
  const isAtTop = computed(() => {
    return scrollTop.value < 50 // 50px tolerance
  })

  // 获取当前可见的第一个项目索引
  const firstVisibleIndex = computed(() => {
    if (!shouldUseVirtualScroll.value) return 0
    return visibleRange.value.startIndex
  })

  // 获取当前可见的最后一个项目索引
  const lastVisibleIndex = computed(() => {
    if (!shouldUseVirtualScroll.value) return items.value.length - 1
    return visibleRange.value.endIndex
  })

  // 启用/禁用虚拟滚动
  const enable = () => {
    isEnabled.value = true
  }

  const disable = () => {
    isEnabled.value = false
  }

  // 更新配置
  const updateOptions = (newOptions: Partial<VirtualScrollOptions>) => {
    Object.assign(opts, newOptions)
  }

  // 重新计算布局
  const recalculate = () => {
    if (!containerRef.value) return

    containerHeight.value = containerRef.value.clientHeight

    // 如果启用动态高度，重新测量所有可见项目
    if (opts.enableDynamicHeight) {
      nextTick(() => {
        const items = containerRef.value?.querySelectorAll('[data-virtual-item]')
        items?.forEach(item => {
          const element = item as HTMLElement
          const itemId = element.dataset.virtualItemId
          if (itemId) {
            measureItemHeight(itemId, element.offsetHeight)
          }
        })
      })
    }
  }

  // 生命周期管理
  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll, { passive: true })

      // 初始化容器高度
      containerHeight.value = containerRef.value.clientHeight

      // 窗口大小变化监听
      const resizeObserver = new ResizeObserver(() => {
        recalculate()
      })

      resizeObserver.observe(containerRef.value)

      onBeforeUnmount(() => {
        if (containerRef.value) {
          containerRef.value.removeEventListener('scroll', handleScroll)
        }
        resizeObserver.disconnect()
      })
    }

    // 默认启用虚拟滚动
    isEnabled.value = true
  })

  return {
    // 状态
    scrollTop: readonly(scrollTop),
    containerHeight: readonly(containerHeight),
    isEnabled: readonly(isEnabled),
    shouldUseVirtualScroll,

    // 计算属性
    totalHeight,
    visibleItems,
    spacerTop,
    spacerBottom,
    isAtBottom,
    isAtTop,
    firstVisibleIndex,
    lastVisibleIndex,

    // 方法
    handleScroll,
    measureItemHeight,
    scrollToItem,
    scrollToBottom,
    scrollToTop,
    enable,
    disable,
    updateOptions,
    recalculate
  }
}

/**
 * 专门用于聊天消息的虚拟滚动
 */
export function useChatVirtualScroll<T extends VirtualScrollItem>(
  messages: Ref<T[]>,
  containerRef: Ref<HTMLElement | null>
) {
  const virtualScroll = useVirtualScroll(messages, containerRef, {
    itemHeight: 100, // 聊天消息平均高度
    overscan: 3,
    threshold: 100, // 超过100条消息启用虚拟滚动
    enableDynamicHeight: true // 聊天消息高度不固定
  })

  // 新消息时自动滚动到底部
  const autoScrollToBottom = ref(true)

  // 监听新消息
  watch(messages, (newMessages, oldMessages) => {
    if (newMessages.length > oldMessages.length && autoScrollToBottom.value) {
      // 有新消息且启用自动滚动
      nextTick(() => {
        virtualScroll.scrollToBottom()
      })
    }
  }, { deep: true })

  // 当用户手动滚动时，禁用自动滚动
  watch(virtualScroll.isAtBottom, (atBottom) => {
    if (!atBottom) {
      autoScrollToBottom.value = false
    }
  })

  // 滚动到底部时，重新启用自动滚动
  const enableAutoScroll = () => {
    autoScrollToBottom.value = true
    virtualScroll.scrollToBottom()
  }

  return {
    ...virtualScroll,
    autoScrollToBottom: readonly(autoScrollToBottom),
    enableAutoScroll
  }
}

// 工具函数：创建虚拟滚动样式
export const createVirtualScrollStyles = (
  totalHeight: number,
  spacerTop: number,
  spacerBottom: number
) => {
  return {
    containerStyle: {
      height: '100%',
      overflow: 'auto'
    },
    listStyle: {
      position: 'relative' as const,
      height: `${totalHeight}px`
    },
    spacerTopStyle: {
      height: `${spacerTop}px`
    },
    spacerBottomStyle: {
      height: `${spacerBottom}px`
    }
  }
}
