<template>
  <div 
    class="lazy-image-container"
    :class="{ 'loading': isLoading, 'error': isError }"
  >
    <!-- 占位符 -->
    <div 
      v-if="!isLoaded && !isError" 
      class="image-placeholder"
      :style="{ width: width, height: height }"
    >
      <div class="placeholder-skeleton"></div>
      <div v-if="showLoadingText" class="loading-text">
        加载中...
      </div>
    </div>

    <!-- 实际图片 -->
    <img
      ref="imgRef"
      v-show="isLoaded"
      :alt="alt"
      :class="imageClass"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- 错误状态 -->
    <div 
      v-if="isError" 
      class="error-placeholder"
      :style="{ width: width, height: height }"
    >
      <div class="error-icon">
        <el-icon><Picture /></el-icon>
      </div>
      <div class="error-text">加载失败</div>
      <el-button 
        v-if="showRetry"
        size="small" 
        @click="retry"
      >
        重试
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElIcon, ElButton } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { useLazyImage } from '@/composables/useLazyLoading'

interface Props {
  src: string
  alt?: string
  width?: string
  height?: string
  imageClass?: string
  imageStyle?: Record<string, any>
  showLoadingText?: boolean
  showRetry?: boolean
  threshold?: number
  rootMargin?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  width: '100%',
  height: 'auto',
  imageClass: '',
  showLoadingText: true,
  showRetry: true,
  threshold: 0.1,
  rootMargin: '50px'
})

const isLoading = ref(false)
const retryCount = ref(0)
const maxRetries = 3

const {
  imgRef,
  isLoaded,
  isError,
  isIntersecting,
  load
} = useLazyImage(props.src, {
  threshold: props.threshold,
  rootMargin: props.rootMargin
})

const handleLoad = () => {
  isLoading.value = false
}

const handleError = () => {
  isLoading.value = false
  // 自动重试逻辑
  if (retryCount.value < maxRetries) {
    setTimeout(() => {
      retry()
    }, 1000 * Math.pow(2, retryCount.value)) // 指数退避
  }
}

const retry = () => {
  retryCount.value++
  isLoading.value = true
  load()
}

// 监听src变化
watch(() => props.src, () => {
  retryCount.value = 0
  load()
})

onMounted(() => {
  isLoading.value = true
})
</script>

<style scoped lang="scss">
.lazy-image-container {
  position: relative;
  overflow: hidden;
  
  &.loading {
    .image-placeholder {
      animation: pulse 1.5s ease-in-out infinite;
    }
  }
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $gray-100;
  border-radius: $border-radius-base;
  
  .placeholder-skeleton {
    width: 60%;
    height: 60%;
    background: linear-gradient(
      90deg,
      $gray-200 25%, 
      $gray-300 50%, 
      $gray-200 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: $border-radius-sm;
  }
  
  .loading-text {
    margin-top: $spacing-2;
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $gray-50;
  border: 2px dashed $gray-300;
  border-radius: $border-radius-base;
  
  .error-icon {
    font-size: 2rem;
    color: $gray-400;
    margin-bottom: $spacing-2;
  }
  
  .error-text {
    font-size: $font-size-sm;
    color: $text-muted;
    margin-bottom: $spacing-2;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .image-placeholder,
  .error-placeholder {
    .loading-text,
    .error-text {
      font-size: $font-size-xs;
    }
  }
}
</style>
