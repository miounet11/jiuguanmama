<template>
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div class="mb-4">
        <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>

      <h2 class="text-xl font-semibold text-gray-900 mb-2">出现了一些问题</h2>
      <p class="text-gray-600 mb-6">{{ errorMessage }}</p>

      <div class="space-y-3">
        <button
          @click="handleReload"
          class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          刷新页面
        </button>

        <button
          @click="handleGoHome"
          class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          返回首页
        </button>
      </div>

      <details v-if="isDevelopment" class="mt-6 text-left">
        <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          技术详情
        </summary>
        <pre class="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">{{ errorDetails }}</pre>
      </details>
    </div>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasError = ref(false)
const errorMessage = ref('页面加载失败，请稍后重试')
const errorDetails = ref('')
const isDevelopment = import.meta.env.DEV

// 捕获子组件错误
onErrorCaptured((err: Error) => {
  console.error('Error caught by boundary:', err)

  hasError.value = true

  // 设置用户友好的错误消息
  if (err.message.includes('Network')) {
    errorMessage.value = '网络连接失败，请检查您的网络设置'
  } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
    errorMessage.value = '登录已过期，请重新登录'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } else if (err.message.includes('404')) {
    errorMessage.value = '请求的资源不存在'
  } else if (err.message.includes('500')) {
    errorMessage.value = '服务器错误，请稍后重试'
  } else {
    errorMessage.value = '页面加载失败，请稍后重试'
  }

  errorDetails.value = `${err.name}: ${err.message}\n${err.stack}`

  // 阻止错误继续传播
  return false
})

const handleReload = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  window.location.reload()
}

const handleGoHome = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  router.push('/')
}
</script>
