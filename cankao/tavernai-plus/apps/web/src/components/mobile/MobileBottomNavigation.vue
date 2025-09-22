<template>
  <Transition name="slide-up">
    <div
      v-if="shouldShow"
      class="mobile-bottom-navigation"
      :class="{
        'with-safe-area': supportsSafeArea,
        'hidden': isHidden
      }"
    >
      <div class="nav-container">
        <div class="nav-content">
          <TouchGestureHandler
            v-for="tab in visibleTabs"
            :key="tab.key"
            @tap="() => navigateToTab(tab.key)"
            :class="{
              'nav-item': true,
              'active': activeTab === tab.key,
              'disabled': tab.disabled
            }"
            :disabled="tab.disabled"
          >
            <div class="nav-button">
              <!-- 图标 -->
              <div class="nav-icon">
                <el-icon :size="20">
                  <component :is="tab.icon" />
                </el-icon>

                <!-- 徽章 -->
                <el-badge
                  v-if="tab.badge && tab.badge > 0"
                  :value="tab.badge"
                  :max="99"
                  class="nav-badge"
                />

                <!-- 在线状态指示器 -->
                <div
                  v-if="tab.showOnlineStatus && tab.isOnline"
                  class="online-indicator"
                />
              </div>

              <!-- 标签文字 -->
              <span class="nav-label">{{ tab.label }}</span>

              <!-- 激活指示器 -->
              <div
                v-if="activeTab === tab.key"
                class="active-indicator"
              />
            </div>
          </TouchGestureHandler>
        </div>

        <!-- 中央悬浮按钮（可选） -->
        <div
          v-if="showFab && fabConfig"
          class="fab-container"
        >
          <TouchGestureHandler
            @tap="handleFabClick"
            @long-press="handleFabLongPress"
          >
            <el-button
              type="primary"
              :icon="fabConfig.icon"
              circle
              size="large"
              class="fab-button"
              :class="{ 'fab-expanded': fabExpanded }"
            >
              <el-badge
                v-if="fabConfig.badge && fabConfig.badge > 0"
                :value="fabConfig.badge"
                :max="99"
                class="fab-badge"
              />
            </el-button>
          </TouchGestureHandler>

          <!-- 扩展菜单 -->
          <Transition name="fab-menu">
            <div
              v-if="fabExpanded"
              class="fab-menu"
              @click="collapseFab"
            >
              <div
                v-for="(action, index) in fabActions"
                :key="action.key"
                class="fab-action"
                :style="{ '--delay': `${index * 50}ms` }"
                @click.stop="handleFabAction(action)"
              >
                <el-button
                  :type="action.type || 'default'"
                  :icon="action.icon"
                  circle
                  size="small"
                  class="fab-action-button"
                />
                <span class="fab-action-label">{{ action.label }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 安全区域背景 -->
      <div
        v-if="supportsSafeArea"
        class="safe-area-bg"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMobileNavigation } from '@/composables/useMobileNavigation'

import TouchGestureHandler from './TouchGestureHandler.vue'

interface NavigationTab {
  key: string
  label: string
  icon: string
  route: string
  badge?: number
  disabled?: boolean
  showOnlineStatus?: boolean
  isOnline?: boolean
  hidden?: boolean
}

interface FabAction {
  key: string
  label: string
  icon: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
}

interface FabConfig {
  icon: string
  badge?: number
  actions?: FabAction[]
}

interface Props {
  tabs?: NavigationTab[]
  activeTab?: string
  showFab?: boolean
  fabConfig?: FabConfig
  autoHide?: boolean
  hideOnScroll?: boolean
  hideOnKeyboard?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
  showFab: false,
  autoHide: true,
  hideOnScroll: true,
  hideOnKeyboard: true
})

const emit = defineEmits<{
  'tab-change': [tabKey: string]
  'fab-click': []
  'fab-action': [actionKey: string]
}>()

const route = useRoute()
const router = useRouter()
const {
  navigationTabs,
  activeTab: currentActiveTab,
  navigateToTab: navigate,
  shouldShowBottomNav,
  vibrate
} = useMobileNavigation()

// 状态
const isHidden = ref(false)
const fabExpanded = ref(false)
const lastScrollY = ref(0)
const scrollTimeout = ref<NodeJS.Timeout>()

// 计算属性
const visibleTabs = computed(() => {
  const tabs = props.tabs.length > 0 ? props.tabs : navigationTabs.value
  return tabs.filter(tab => !tab.hidden)
})

const activeTab = computed(() => {
  return props.activeTab || currentActiveTab.value
})

const shouldShow = computed(() => {
  if (!shouldShowBottomNav.value) return false
  if (props.autoHide && isHidden.value) return false
  return true
})

const supportsSafeArea = computed(() => {
  return CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)')
})

const fabActions = computed(() => {
  return props.fabConfig?.actions || []
})

// 方法
const navigateToTab = async (tabKey: string) => {
  const tab = visibleTabs.value.find(t => t.key === tabKey)
  if (!tab || tab.disabled) return

  // 触觉反馈
  vibrate(25)

  // 导航
  if (props.tabs.length > 0) {
    emit('tab-change', tabKey)
  } else {
    await navigate(tabKey)
  }

  // 如果点击当前激活的标签，滚动到顶部
  if (activeTab.value === tabKey) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const handleFabClick = () => {
  if (fabActions.value.length > 0) {
    toggleFab()
  } else {
    emit('fab-click')
  }
}

const handleFabLongPress = () => {
  if (fabActions.value.length > 0) {
    expandFab()
  }
}

const toggleFab = () => {
  fabExpanded.value = !fabExpanded.value
  vibrate(fabExpanded.value ? 50 : 25)
}

const expandFab = () => {
  fabExpanded.value = true
  vibrate(50)
}

const collapseFab = () => {
  fabExpanded.value = false
}

const handleFabAction = (action: FabAction) => {
  collapseFab()
  vibrate(25)
  emit('fab-action', action.key)
}

// 滚动隐藏逻辑
const handleScroll = () => {
  if (!props.hideOnScroll) return

  const currentScrollY = window.scrollY
  const scrollDelta = currentScrollY - lastScrollY.value

  // 清除之前的定时器
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  // 向下滚动超过阈值时隐藏
  if (scrollDelta > 10 && currentScrollY > 100) {
    isHidden.value = true
    collapseFab()
  }
  // 向上滚动时显示
  else if (scrollDelta < -5) {
    isHidden.value = false
  }

  // 滚动停止后的处理
  scrollTimeout.value = setTimeout(() => {
    // 在顶部附近总是显示
    if (currentScrollY < 50) {
      isHidden.value = false
    }
  }, 150)

  lastScrollY.value = currentScrollY
}

// 键盘显示隐藏逻辑
const handleKeyboardChange = () => {
  if (!props.hideOnKeyboard) return

  // 检测虚拟键盘
  const viewportHeight = window.visualViewport?.height || window.innerHeight
  const windowHeight = window.innerHeight
  const heightDiff = windowHeight - viewportHeight

  // 键盘显示时隐藏导航栏
  isHidden.value = heightDiff > 150
}

// 路由变化处理
const handleRouteChange = () => {
  // 路由变化时折叠 FAB
  collapseFab()

  // 重置隐藏状态
  isHidden.value = false
}

// 点击外部收起 FAB
const handleClickOutside = (event: Event) => {
  if (!fabExpanded.value) return

  const target = event.target as HTMLElement
  const fabContainer = document.querySelector('.fab-container')

  if (fabContainer && !fabContainer.contains(target)) {
    collapseFab()
  }
}

// 生命周期
onMounted(() => {
  // 滚动监听
  if (props.hideOnScroll) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  // 键盘监听
  if (props.hideOnKeyboard) {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleKeyboardChange)
    } else {
      window.addEventListener('resize', handleKeyboardChange)
    }
  }

  // 点击外部监听
  document.addEventListener('click', handleClickOutside)

  // 初始化滚动位置
  lastScrollY.value = window.scrollY
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('scroll', handleScroll)

  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleKeyboardChange)
  } else {
    window.removeEventListener('resize', handleKeyboardChange)
  }

  document.removeEventListener('click', handleClickOutside)

  // 清理定时器
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

// 监听路由变化
watch(() => route.path, handleRouteChange)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mobile-bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  transition: transform $transition-base;

  &.hidden {
    transform: translateY(100%);
  }

  &.with-safe-area {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .nav-container {
    position: relative;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .nav-content {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: $spacing-2 $spacing-1;
    min-height: 60px;
  }

  .nav-item {
    flex: 1;
    display: flex;
    justify-content: center;
    transition: all $transition-fast;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:not(.disabled):active {
      transform: scale(0.95);
    }

    .nav-button {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-1;
      padding: $spacing-2;
      border-radius: $border-radius-lg;
      min-width: 60px;
      transition: all $transition-fast;

      .nav-icon {
        position: relative;
        color: var(--el-text-color-regular);
        transition: all $transition-fast;

        .nav-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          z-index: 1;
        }

        .online-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: $success-color;
          border: 2px solid var(--el-bg-color);
          border-radius: 50%;
        }
      }

      .nav-label {
        font-size: $font-size-xs;
        color: var(--el-text-color-regular);
        text-align: center;
        line-height: 1.2;
        transition: all $transition-fast;
        @include text-truncate;
        max-width: 60px;
      }

      .active-indicator {
        position: absolute;
        top: -$spacing-2;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 3px;
        background: $primary-500;
        border-radius: 2px;
      }
    }

    &.active .nav-button {
      .nav-icon {
        color: $primary-500;
        transform: scale(1.1);
      }

      .nav-label {
        color: $primary-500;
        font-weight: $font-weight-medium;
      }
    }

    &:not(.active) .nav-button:hover {
      .nav-icon {
        color: $primary-400;
      }

      .nav-label {
        color: var(--el-text-color-primary);
      }
    }
  }

  .safe-area-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: env(safe-area-inset-bottom);
    background: var(--el-bg-color);
  }
}

// FAB 相关样式
.fab-container {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);

  .fab-button {
    position: relative;
    width: 56px;
    height: 56px;
    box-shadow: var(--el-box-shadow);
    transition: all $transition-base;

    &.fab-expanded {
      transform: rotate(45deg);
    }

    .fab-badge {
      position: absolute;
      top: -8px;
      right: -8px;
    }
  }

  .fab-menu {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    align-items: center;

    .fab-action {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      animation: fab-action-enter 0.3s ease-out;
      animation-delay: var(--delay);
      animation-fill-mode: both;

      .fab-action-button {
        width: 40px;
        height: 40px;
        box-shadow: var(--el-box-shadow-light);
      }

      .fab-action-label {
        background: var(--el-bg-color);
        color: var(--el-text-color-primary);
        padding: $spacing-1 $spacing-2;
        border-radius: $border-radius-base;
        font-size: $font-size-sm;
        white-space: nowrap;
        box-shadow: var(--el-box-shadow-light);
      }
    }
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform $transition-base;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: all 0.3s ease;
}

.fab-menu-enter-from,
.fab-menu-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.8);
}

@keyframes fab-action-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 响应式调整
@include mobile-only {
  .mobile-bottom-navigation {
    .nav-content {
      padding: $spacing-1 0;
      min-height: 56px;
    }

    .nav-item .nav-button {
      min-width: 50px;
      padding: $spacing-1;

      .nav-label {
        font-size: 10px;
        max-width: 50px;
      }
    }

    .fab-container .fab-button {
      width: 50px;
      height: 50px;
    }
  }
}

// 平板适配
@include tablet-up {
  .mobile-bottom-navigation {
    .nav-content {
      max-width: 500px;
      margin: 0 auto;
    }
  }
}

// 无障碍优化
@include prefers-reduced-motion {
  .mobile-bottom-navigation,
  .nav-item,
  .nav-button,
  .nav-icon,
  .nav-label,
  .fab-button {
    transition: none;
  }

  .fab-action {
    animation: none;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .mobile-bottom-navigation {
    border-top-width: 2px;

    .nav-item.active .nav-button {
      .nav-icon,
      .nav-label {
        font-weight: bold;
      }
    }

    .active-indicator {
      height: 4px;
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .mobile-bottom-navigation {
    background: rgba(var(--el-bg-color), 0.9);

    .safe-area-bg {
      background: var(--el-bg-color);
    }
  }
}
</style>