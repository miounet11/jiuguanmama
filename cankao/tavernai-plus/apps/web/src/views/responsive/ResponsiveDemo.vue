<template>
  <div class="responsive-demo">
    <!-- 演示导航 -->
    <nav class="demo-nav">
      <div class="nav-content">
        <h1 class="nav-title">响应式设计演示</h1>
        <div class="nav-actions">
          <button
            class="theme-toggle"
            @click="toggleTheme"
            :aria-label="isDark ? '切换到浅色主题' : '切换到深色主题'"
          >
            <SunIcon v-if="isDark" />
            <MoonIcon v-else />
          </button>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="demo-main">
      <!-- 设备信息面板 -->
      <section class="device-panel">
        <h2>当前设备信息</h2>
        <div class="device-stats">
          <div class="stat-item">
            <span class="stat-label">屏幕宽度</span>
            <span class="stat-value">{{ windowWidth }}px</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">设备类型</span>
            <span class="stat-value">{{ deviceType }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">触摸设备</span>
            <span class="stat-value">{{ isTouchDevice ? '是' : '否' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">像素比</span>
            <span class="stat-value">{{ pixelRatio }}x</span>
          </div>
        </div>
      </section>

      <!-- 响应式布局演示 -->
      <section class="layout-demo">
        <h2>响应式布局演示</h2>
        <div class="layout-grid">
          <div class="layout-item header">Header</div>
          <div class="layout-item sidebar">Sidebar</div>
          <div class="layout-item main">Main Content</div>
          <div class="layout-item footer">Footer</div>
        </div>
      </section>

      <!-- 触摸交互演示 -->
      <section class="touch-demo">
        <h2>触摸交互演示</h2>
        <div class="touch-area">
          <EnhancedTouchHandler
            class="touch-card"
            :enable-swipe="true"
            :enable-long-press="true"
            :enable-double-tap="true"
            @tap="handleTap"
            @double-tap="handleDoubleTap"
            @long-press="handleLongPress"
            @swipe="handleSwipe"
          >
            <div class="touch-content">
              <h3>触摸测试区域</h3>
              <p>尝试以下操作：</p>
              <ul>
                <li>轻击</li>
                <li>双击</li>
                <li>长按</li>
                <li>滑动</li>
              </ul>
              <div class="touch-status">
                最后操作：<strong>{{ lastTouchAction }}</strong>
              </div>
            </div>
          </EnhancedTouchHandler>
        </div>
      </section>

      <!-- 卡片网格演示 -->
      <section class="cards-demo">
        <h2>响应式卡片网格</h2>
        <ResponsiveGrid
          :mobile-columns="1"
          :tablet-columns="2"
          :desktop-columns="3"
          :gap="16"
          class="demo-grid"
        >
          <ResponsiveCard
            v-for="card in demoCards"
            :key="card.id"
            :title="card.title"
            :subtitle="card.subtitle"
            :description="card.description"
            :clickable="true"
            @click="handleCardClick(card)"
          />
        </ResponsiveGrid>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEnhancedResponsive } from '@/composables/useEnhancedResponsive'
import { useThemeStore } from '@/stores/theme'

// 组件导入
import ResponsiveCard from '@/components/design-system/ResponsiveCard.vue'
import ResponsiveGrid from '@/components/layout/ResponsiveGrid.vue'
import EnhancedTouchHandler from '@/components/mobile/EnhancedTouchHandler.vue'

// 图标组件 (简化示例)
const SunIcon = 'SunIcon'
const MoonIcon = 'MoonIcon'

// 响应式Hook
const {
  windowWidth,
  deviceType,
  isTouchDevice,
  pixelRatio,
} = useEnhancedResponsive()

// 主题Hook
const themeStore = useThemeStore()

// 状态管理
const lastTouchAction = ref('无')

// 计算属性
const isDark = computed(() => themeStore.isDark)

// 演示数据
const demoCards = ref([
  {
    id: 1,
    title: '响应式设计',
    subtitle: '核心概念',
    description: '响应式设计是一种网页设计方法，使网站能够在不同设备和屏幕尺寸上提供最佳的浏览体验。',
  },
  {
    id: 2,
    title: '移动端优先',
    subtitle: '设计原则',
    description: '移动端优先是一种设计策略，首先为移动设备设计，然后逐步增强到桌面端。',
  },
  {
    id: 3,
    title: '触摸交互',
    subtitle: '用户体验',
    description: '触摸交互设计关注用户在触摸设备上的操作体验，包括手势识别和触觉反馈。',
  },
  {
    id: 4,
    title: '性能优化',
    subtitle: '技术实现',
    description: '性能优化确保应用在各种设备上都能快速响应，提供流畅的用户体验。',
  },
  {
    id: 5,
    title: '无障碍设计',
    subtitle: '包容性设计',
    description: '无障碍设计确保所有用户，包括有特殊需求的用户，都能正常使用应用。',
  },
  {
    id: 6,
    title: '跨平台兼容',
    subtitle: '技术标准',
    description: '跨平台兼容确保应用在不同浏览器和操作系统上都能正常工作。',
  },
])

// 方法
const toggleTheme = () => {
  themeStore.toggleTheme()
}

const handleTap = () => {
  lastTouchAction.value = '轻击'
}

const handleDoubleTap = () => {
  lastTouchAction.value = '双击'
}

const handleLongPress = () => {
  lastTouchAction.value = '长按'
}

const handleSwipe = (gesture: any) => {
  lastTouchAction.value = `滑动 - ${gesture.direction}`
}

const handleCardClick = (card: any) => {
  console.log('卡片点击:', card.title)
}
</script>

<style lang="scss" scoped>
@import '@/styles/responsive.scss';

.responsive-demo {
  min-height: 100vh;
  background: var(--surface-0);
  color: var(--text-primary);
}

.demo-nav {
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-secondary);
  position: sticky;
  top: 0;
  z-index: $z-sticky;

  .nav-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: $spacing-lg;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .nav-title {
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      margin: 0;
    }

    .theme-toggle {
      @include touch-button(40px);
      background: var(--surface-2);
      border: 1px solid var(--border-secondary);
      color: var(--text-primary);
      cursor: pointer;
      border-radius: $border-radius-base;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all $transition-fast;

      &:hover {
        background: var(--surface-3);
      }
    }
  }
}

.demo-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: $spacing-xl;

  @include mobile-only {
    padding: $spacing-lg;
  }

  h2 {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    margin: 0 0 $spacing-lg;
    color: var(--text-primary);

    @include mobile-only {
      font-size: $font-size-xl;
    }
  }
}

.device-panel {
  background: var(--surface-1);
  border: 1px solid var(--border-secondary);
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;

  .device-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-md;

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-md;
      background: var(--surface-2);
      border-radius: $border-radius-base;

      .stat-label {
        font-size: $font-size-sm;
        color: var(--text-secondary);
      }

      .stat-value {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
        color: var(--primary-color);
      }
    }
  }
}

.layout-demo {
  margin-bottom: $spacing-xl;

  .layout-grid {
    display: grid;
    grid-template-areas:
      "header header"
      "sidebar main"
      "footer footer";
    grid-template-columns: 200px 1fr;
    grid-template-rows: 60px 1fr 40px;
    gap: 1px;
    background: var(--border-secondary);
    border: 1px solid var(--border-secondary);
    border-radius: $border-radius-lg;
    overflow: hidden;

    @include mobile-only {
      grid-template-areas:
        "header"
        "main"
        "sidebar"
        "footer";
      grid-template-columns: 1fr;
      grid-template-rows: 60px 1fr auto 40px;
    }

    .layout-item {
      background: var(--surface-1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: $font-weight-medium;
      color: var(--text-secondary);

      &.header {
        grid-area: header;
        background: var(--surface-2);
      }

      &.sidebar {
        grid-area: sidebar;
        background: var(--surface-3);
      }

      &.main {
        grid-area: main;
        background: var(--surface-0);
      }

      &.footer {
        grid-area: footer;
        background: var(--surface-2);
      }
    }
  }
}

.touch-demo {
  margin-bottom: $spacing-xl;

  .touch-area {
    background: var(--surface-1);
    border: 1px solid var(--border-secondary);
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    min-height: 200px;

    .touch-card {
      width: 100%;
      height: 100%;
      min-height: 150px;
      background: var(--surface-2);
      border: 2px dashed var(--border-secondary);
      border-radius: $border-radius-base;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: var(--primary-color);
        background: var(--surface-3);
      }

      .touch-content {
        text-align: center;

        h3 {
          font-size: $font-size-lg;
          margin: 0 0 $spacing-md;
          color: var(--text-primary);
        }

        p {
          color: var(--text-secondary);
          margin: 0 0 $spacing-md;
        }

        ul {
          text-align: left;
          color: var(--text-secondary);
          margin: 0 0 $spacing-lg;
          padding-left: $spacing-lg;

          li {
            margin-bottom: $spacing-xs;
          }
        }

        .touch-status {
          font-size: $font-size-sm;
          color: var(--text-secondary);
          padding: $spacing-sm $spacing-md;
          background: var(--surface-1);
          border-radius: $border-radius-base;
          display: inline-block;
        }
      }
    }
  }
}

.cards-demo {
  .demo-grid {
    margin-top: $spacing-lg;
  }
}

// 响应式调整
@include mobile-only {
  .responsive-demo {
    .demo-main {
      .device-panel .device-stats {
        grid-template-columns: 1fr;
      }
    }
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .responsive-demo {
    * {
      transition: none !important;
    }
  }
}
</style>