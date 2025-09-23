<template>
  <div class="home-page">
    <!-- 页面加载进度条 -->
    <div v-if="isLoading" class="page-loading">
      <div class="loading-progress" :style="{ width: `${loadProgress}%` }" />
    </div>

    <!-- 英雄区域 - 品牌主视觉 -->
    <HeroSection />

    <!-- 精选角色展示 -->
    <FeaturedCharacters />

    <!-- 功能亮点 -->
    <FeatureHighlights />

    <!-- 平台统计数据 -->
    <StatsSection />

    <!-- 行动号召 -->
    <CTASection />

    <!-- 快速开始对话框 -->
    <QuickStartDialog v-model:visible="showQuickStart" />

    <!-- 快速开始浮动按钮 -->
    <ElAffix :offset="20" position="bottom">
      <div class="fixed bottom-6 right-6 z-50">
        <TavernButton
          variant="primary"
          size="lg"
          class="quick-start-fab"
          icon-left="chat"
          @click="openQuickStart"
        >
          快速对话
        </TavernButton>
      </div>
    </ElAffix>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElAffix } from 'element-plus'
import HeroSection from './home/components/HeroSection.vue'
import FeaturedCharacters from './home/components/FeaturedCharacters.vue'
import FeatureHighlights from './home/components/FeatureHighlights.vue'
import StatsSection from './home/components/StatsSection.vue'
import CTASection from './home/components/CTASection.vue'
import QuickStartDialog from '@/components/common/QuickStartDialog.vue'
import { TavernButton } from '@/components/design-system'
import { useScrollAnimations } from './home/composables/useScrollAnimations'
import { usePerformanceOptimization } from './home/composables/usePerformanceOptimization'

const router = useRouter()
const showQuickStart = ref(false)

// 使用组合式函数
const { setupHomePageAnimations } = useScrollAnimations()
const { setupHomePageOptimizations, isLoading, loadProgress } = usePerformanceOptimization()

// 快速开始功能
const openQuickStart = () => {
  showQuickStart.value = true
}

// SEO优化
const setSEOData = () => {
  // 设置页面标题
  document.title = '九馆爸爸 - AI角色扮演对话平台 | 与AI角色深度交流'

  // 设置meta描述
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.setAttribute('content', '九馆爸爸是专为宅男宅女打造的AI角色扮演平台。拥有3000+精选角色，支持深度对话，创作自由，隐私安全。立即注册获得100免费积分！')
  }

  // 设置关键词
  const metaKeywords = document.querySelector('meta[name="keywords"]')
  if (metaKeywords) {
    metaKeywords.setAttribute('content', 'AI角色扮演,AI对话,虚拟角色,人工智能聊天,角色创作,二次元,动漫角色,AI助手')
  }
}

// 性能监控
const trackPerformance = () => {
  // 监控首屏加载时间
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      console.log(`Homepage loaded in ${loadTime.toFixed(2)}ms`)

      // 可以发送到分析服务
      // analytics.track('homepage_load_time', { time: loadTime })
    })
  }
}

onMounted(async () => {
  // 设置SEO数据
  setSEOData()

  // 开始性能监控
  trackPerformance()

  // 设置性能优化
  await setupHomePageOptimizations()

  // 设置滚动动画
  nextTick(() => {
    setupHomePageAnimations()
  })
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: var(--surface-0);

  // 确保各个section之间的间距合理
  > * + * {
    margin-top: 0; // 重置margin，让各section自己管理spacing
  }
}

// 页面加载进度条
.page-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(168, 85, 247, 0.1);
  z-index: var(--z-maximum);

  .loading-progress {
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--brand-primary-500),
      var(--brand-accent-400)
    );
    transition: width var(--duration-normal) ease-out;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }
}

// 快速开始浮动按钮样式
.quick-start-fab {
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(var(--space-2));
  transition: var(--button-transition);

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: var(--shadow-2xl), var(--shadow-primary);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

// 响应式优化
@media (max-width: 768px) {
  .quick-start-fab {
    // 移动端稍微小一点
    .tavern-button {
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-sm);
    }
  }
}

// 针对低性能设备的优化
@media (prefers-reduced-motion: reduce) {
  .quick-start-fab {
    &:hover {
      transform: none;
    }
  }
}

// 暗色主题优化
@media (prefers-color-scheme: dark) {
  .home-page {
    // 确保在系统暗色主题下的显示效果
    background: var(--surface-0);
  }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
  .quick-start-fab {
    border: 2px solid var(--text-primary);
  }
}

// 大字体模式支持
@media (prefers-font-size: large) {
  .quick-start-fab {
    font-size: 1.2em;
    padding: var(--space-4) var(--space-6);
  }
}
</style>
