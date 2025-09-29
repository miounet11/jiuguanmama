<template>
  <div class="tavern-loading-wrapper">
    <!-- 全屏加载 -->
    <el-loading
      v-if="fullscreen"
      v-model="visible"
      :text="text"
      :background="background"
      :spinner="customSpinner"
      :svg="svg"
      :svg-view-box="svgViewBox"
    />

    <!-- 内联加载 -->
    <div
      v-else
      :class="[
        'tavern-loading',
        `tavern-loading--${variant}`,
        `tavern-loading--${size}`,
        {
          'tavern-loading--inline': inline,
          'tavern-loading--overlay': overlay,
          'tavern-loading--center': center
        }
      ]"
    >
      <!-- 自定义加载图标 -->
      <div v-if="customSpinner" class="tavern-loading__spinner">
        <component :is="customSpinner" />
      </div>

      <!-- SVG加载图标 -->
      <div v-else-if="svg" class="tavern-loading__spinner">
        <svg
          :viewBox="svgViewBox"
          class="tavern-loading__svg"
          v-html="svg"
        />
      </div>

      <!-- 默认旋转加载图标 -->
      <div v-else class="tavern-loading__spinner">
        <div class="tavern-loading__dots">
          <div
            v-for="i in 3"
            :key="i"
            class="tavern-loading__dot"
            :style="{ animationDelay: `${(i - 1) * 0.2}s` }"
          />
        </div>
      </div>

      <!-- 加载文本 -->
      <div v-if="text" class="tavern-loading__text">
        {{ text }}
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress" class="tavern-loading__progress">
        <div
          class="tavern-loading__progress-bar"
          :style="{ width: `${progress}%` }"
        />
        <div class="tavern-loading__progress-text">
          {{ progress }}%
        </div>
      </div>

      <!-- 插槽内容 -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElLoading } from 'element-plus'

export interface TavernLoadingProps {
  visible?: boolean
  text?: string
  fullscreen?: boolean
  background?: string
  customSpinner?: any
  svg?: string
  svgViewBox?: string
  variant?: 'primary' | 'secondary' | 'neutral'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  inline?: boolean
  overlay?: boolean
  center?: boolean
  showProgress?: boolean
  progress?: number
}

const props = withDefaults(defineProps<TavernLoadingProps>(), {
  visible: true,
  fullscreen: false,
  background: 'rgba(0, 0, 0, 0.8)',
  variant: 'primary',
  size: 'md',
  inline: false,
  overlay: false,
  center: false,
  showProgress: false,
  progress: 0
})

// 默认SVG加载图标
const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/>
  <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
</svg>`

const svgViewBox = computed(() => {
  return props.svgViewBox || '0 0 24 24'
})

const background = computed(() => {
  if (props.fullscreen) {
    return props.background
  }
  return 'transparent'
})
</script>

<style lang="scss" scoped>
.tavern-loading-wrapper {
  .tavern-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--loading-gap);

    &__spinner {
      display: flex;
      align-items: center;
      justify-content: center;

      .tavern-loading__dots {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .tavern-loading__dot {
        width: var(--loading-dot-size);
        height: var(--loading-dot-size);
        border-radius: 50%;
        background: var(--loading-color);
        animation: tavern-loading-bounce 1.4s ease-in-out infinite both;
      }

      .tavern-loading__svg {
        width: var(--loading-size);
        height: var(--loading-size);
        color: var(--loading-color);
        animation: tavern-loading-spin 1s linear infinite;

        :deep(svg) {
          width: 100%;
          height: 100%;
        }
      }
    }

    &__text {
      color: var(--text-color);
      font-size: var(--loading-text-size);
      font-weight: 500;
      text-align: center;
      line-height: 1.4;
    }

    &__progress {
      width: 100%;
      max-width: 200px;
      margin-top: 8px;

      .tavern-loading__progress-bar {
        height: 4px;
        background: var(--loading-color);
        border-radius: 2px;
        transition: width 0.3s ease;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: tavern-loading-shimmer 1.5s ease-in-out infinite;
        }
      }

      .tavern-loading__progress-text {
        text-align: center;
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 4px;
      }
    }

    // 变体样式
    &--primary {
      --loading-color: var(--tavern-primary);
    }

    &--secondary {
      --loading-color: var(--tavern-secondary);
    }

    &--neutral {
      --loading-color: var(--text-muted);
    }

    // 尺寸样式
    &--xs {
      --loading-size: 16px;
      --loading-dot-size: 4px;
      --loading-gap: 4px;
      --loading-text-size: 11px;
    }

    &--sm {
      --loading-size: 20px;
      --loading-dot-size: 6px;
      --loading-gap: 6px;
      --loading-text-size: 12px;
    }

    &--md {
      --loading-size: 24px;
      --loading-dot-size: 8px;
      --loading-gap: 8px;
      --loading-text-size: 14px;
    }

    &--lg {
      --loading-size: 32px;
      --loading-dot-size: 10px;
      --loading-gap: 12px;
      --loading-text-size: 16px;
    }

    &--xl {
      --loading-size: 48px;
      --loading-dot-size: 12px;
      --loading-gap: 16px;
      --loading-text-size: 18px;
    }

    // 显示模式
    &--inline {
      display: inline-flex;
      flex-direction: row;

      .tavern-loading__text {
        margin-left: 8px;
      }
    }

    &--overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(2px);
      z-index: 1000;
      border-radius: var(--card-radius);
    }

    &--center {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2000;
    }
  }
}

// 动画定义
@keyframes tavern-loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes tavern-loading-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes tavern-loading-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 暗色主题适配
.dark {
  .tavern-loading-wrapper {
    .tavern-loading {
      &__text {
        color: var(--text-color-dark);
      }

      &__progress .tavern-loading__progress-text {
        color: var(--text-muted-dark);
      }

      &--overlay {
        background: rgba(0, 0, 0, 0.8);
      }
    }
  }
}

// Element Plus Loading 样式覆盖
:deep(.el-loading-mask) {
  background-color: v-bind(background);

  .el-loading-spinner {
    .el-loading-text {
      color: var(--text-color);
      font-size: 14px;
      margin-top: 8px;
    }
  }
}
</style>
