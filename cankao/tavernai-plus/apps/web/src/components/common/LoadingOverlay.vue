<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <!-- 加载内容 -->
      <div class="relative bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <!-- 加载动画 -->
        <div class="flex justify-center mb-4">
          <div class="relative">
            <!-- 外圈旋转 -->
            <div class="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin">
              <div class="absolute top-0 left-0 w-4 h-4 bg-indigo-600 rounded-full" />
            </div>

            <!-- 内圈反向旋转 -->
            <div class="absolute inset-2 border-4 border-purple-200 rounded-full animate-spin-reverse">
              <div class="absolute bottom-0 right-0 w-2 h-2 bg-purple-600 rounded-full" />
            </div>
          </div>
        </div>

        <!-- 加载文字 -->
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-800 mb-1">
            {{ title || '加载中' }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ message || '请稍候...' }}
          </p>
        </div>

        <!-- 进度条（可选） -->
        <div v-if="progress !== null" class="mt-4">
          <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <p class="text-xs text-gray-500 text-center mt-1">
            {{ progress }}%
          </p>
        </div>

        <!-- 取消按钮（可选） -->
        <button
          v-if="cancellable"
          @click="handleCancel"
          class="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  message?: string
  progress?: number | null
  cancellable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  message: '',
  progress: null,
  cancellable: false
})

const emit = defineEmits<{
  cancel: []
}>()

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 反向旋转动画 */
@keyframes spin-reverse {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

.animate-spin-reverse {
  animation: spin-reverse 2s linear infinite;
}
</style>
