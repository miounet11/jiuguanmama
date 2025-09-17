<template>
  <nav class="flex items-center justify-center space-x-1">
    <!-- 上一页 -->
    <button
      :disabled="currentPage === 1"
      @click="handlePageChange(currentPage - 1)"
      class="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      <span class="ml-1 hidden sm:inline">上一页</span>
    </button>

    <!-- 第一页 -->
    <button
      v-if="showFirstPage"
      @click="handlePageChange(1)"
      :class="pageButtonClass(1)"
    >
      1
    </button>

    <!-- 左侧省略号 -->
    <span v-if="showLeftEllipsis" class="px-3 py-2 text-gray-500">...</span>

    <!-- 中间页码 -->
    <button
      v-for="page in visiblePages"
      :key="page"
      @click="handlePageChange(page)"
      :class="pageButtonClass(page)"
    >
      {{ page }}
    </button>

    <!-- 右侧省略号 -->
    <span v-if="showRightEllipsis" class="px-3 py-2 text-gray-500">...</span>

    <!-- 最后一页 -->
    <button
      v-if="showLastPage"
      @click="handlePageChange(totalPages)"
      :class="pageButtonClass(totalPages)"
    >
      {{ totalPages }}
    </button>

    <!-- 下一页 -->
    <button
      :disabled="currentPage === totalPages"
      @click="handlePageChange(currentPage + 1)"
      class="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <span class="mr-1 hidden sm:inline">下一页</span>
      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
      </svg>
    </button>

    <!-- 页面信息（移动端） -->
    <div class="sm:hidden text-sm text-gray-500 px-3">
      {{ currentPage }} / {{ totalPages }}
    </div>

    <!-- 跳转到指定页（桌面端） -->
    <div class="hidden lg:flex items-center ml-4 space-x-2">
      <span class="text-sm text-gray-500">跳转到</span>
      <input
        type="number"
        :min="1"
        :max="totalPages"
        :value="currentPage"
        @change="handleJumpToPage"
        class="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <span class="text-sm text-gray-500">页</span>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5
})

const emit = defineEmits<{
  change: [page: number]
}>()

// 计算可见页码
const visiblePages = computed(() => {
  const pages: number[] = []
  const halfVisible = Math.floor(props.maxVisible / 2)

  let start = Math.max(2, props.currentPage - halfVisible)
  let end = Math.min(props.totalPages - 1, props.currentPage + halfVisible)

  // 调整范围以保持固定数量的可见页码
  if (end - start < props.maxVisible - 1) {
    if (start === 2) {
      end = Math.min(props.totalPages - 1, start + props.maxVisible - 1)
    } else {
      start = Math.max(2, end - props.maxVisible + 1)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// 是否显示第一页
const showFirstPage = computed(() => {
  return props.totalPages > 1
})

// 是否显示最后一页
const showLastPage = computed(() => {
  return props.totalPages > 1 && !visiblePages.value.includes(props.totalPages)
})

// 是否显示左侧省略号
const showLeftEllipsis = computed(() => {
  return visiblePages.value.length > 0 && visiblePages.value[0] > 2
})

// 是否显示右侧省略号
const showRightEllipsis = computed(() => {
  return visiblePages.value.length > 0 &&
         visiblePages.value[visiblePages.value.length - 1] < props.totalPages - 1
})

// 获取页码按钮样式
const pageButtonClass = (page: number) => {
  const isActive = page === props.currentPage
  return [
    'relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
    isActive
      ? 'z-10 bg-indigo-600 text-white'
      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
  ]
}

// 处理页码变化
const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('change', page)
  }
}

// 处理跳转到指定页
const handleJumpToPage = (event: Event) => {
  const target = event.target as HTMLInputElement
  const page = parseInt(target.value, 10)

  if (!isNaN(page)) {
    handlePageChange(page)
  }
}
</script>
