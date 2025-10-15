<template>
  <teleport to="body">
    <!-- 遮罩层 -->
    <transition name="fade">
      <div
        v-if="modelValue"
        class="mobile-drawer-overlay"
        @click="handleOverlayClick"
        @touchmove.prevent
      />
    </transition>

    <!-- 抽屉主体 -->
    <transition
      :name="position === 'bottom' ? 'slide-up' : 'slide-right'"
      @after-enter="handleAfterEnter"
      @after-leave="handleAfterLeave"
    >
      <div
        v-if="modelValue"
        class="mobile-drawer"
        :class="[
          `mobile-drawer--${position}`,
          {
            'mobile-drawer--safe-area': enableSafeArea,
            'mobile-drawer--no-header': !hasHeader,
            'mobile-drawer--full-height': fullHeight
          }
        ]"
        ref="drawerRef"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- 顶部拖拽指示器（仅底部抽屉） -->
        <div
          v-if="position === 'bottom'"
          class="drawer-indicator"
          @touchstart="handleIndicatorTouchStart"
        />

        <!-- 抽屉头部 -->
        <div
          v-if="hasHeader"
          class="drawer-header"
          :class="{ 'drawer-header--compact': compactHeader }"
        >
          <div class="drawer-title">
            <slot name="title">
              <h3>{{ title }}</h3>
            </slot>
          </div>

          <div class="drawer-actions">
            <slot name="header-actions">
              <button
                class="drawer-close-btn"
                @click="close"
                :aria-label="closeButtonText"
              >
                <TavernIcon name="x-mark" />
              </button>
            </slot>
          </div>
        </div>

        <!-- 抽屉内容 -->
        <div
          class="drawer-content"
          ref="contentRef"
          :class="{
            'drawer-content--scrollable': scrollable,
            'drawer-content--padded': padded
          }"
          @scroll="handleScroll"
        >
          <slot />
        </div>

        <!-- 抽屉底部 -->
        <div
          v-if="hasFooter"
          class="drawer-footer"
          :class="{ 'drawer-footer--sticky': stickyFooter }"
        >
          <slot name="footer" />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useMobileOptimization } from '@/composables/useMobileOptimization'
import TavernIcon from '@/components/design-system/TavernIcon.vue'

interface Props {
  modelValue: boolean
  position?: 'bottom' | 'right' | 'left'
  title?: string
  closeButtonText?: string
  hasHeader?: boolean
  hasFooter?: boolean
  compactHeader?: boolean
  stickyFooter?: boolean
  fullHeight?: boolean
  scrollable?: boolean
  padded?: boolean
  enableSafeArea?: boolean
  enableSwipeToClose?: boolean
  lockBackgroundScroll?: boolean
  maxContentHeight?: string | number
  closeOnOverlayClick?: boolean
  persistent?: boolean
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom',
  title: '',
  closeButtonText: '关闭',
  hasHeader: true,
  hasFooter: false,
  compactHeader: false,
  stickyFooter: false,
  fullHeight: false,
  scrollable: true,
  padded: true,
  enableSafeArea: true,
  enableSwipeToClose: true,
  lockBackgroundScroll: true,
  closeOnOverlayClick: true,
  persistent: false,
  zIndex: 1000
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open': []
  'close': []
  'after-open': []
  'after-close': []
  'scroll': [event: Event]
}>()

// 移动端优化
const { triggerHapticFeedback, isMobile } = useMobileOptimization()

// 引用
const drawerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

// 触摸状态
const touchState = ref({
  startY: 0,
  currentY: 0,
  startTime: 0,
  isDragging: false,
  shouldClose: false
})

// 拖拽状态
const isDragging = ref(false)
const dragDistance = ref(0)

// 计算属性
const isBottomDrawer = computed(() => props.position === 'bottom')
const drawerStyle = computed(() => {
  const style: Record<string, any> = {
    zIndex: props.zIndex
  }

  if (props.maxContentHeight) {
    style['--max-content-height'] = typeof props.maxContentHeight === 'number'
      ? `${props.maxContentHeight}px`
      : props.maxContentHeight
  }

  return style
})

// 关闭抽屉
const close = () => {
  if (!props.persistent) {
    emit('update:modelValue', false)
    triggerHapticFeedback('light')
  }
}

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    close()
  }
}

// 处理动画完成后事件
const handleAfterEnter = () => {
  emit('after-open')
  lockBackgroundScroll()
}

const handleAfterLeave = () => {
  emit('after-close')
  unlockBackgroundScroll()
}

// 滚动锁定
const lockBackgroundScroll = () => {
  if (props.lockBackgroundScroll && typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  }
}

const unlockBackgroundScroll = () => {
  if (props.lockBackgroundScroll && typeof document !== 'undefined') {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
}

// 处理内容滚动
const handleScroll = (event: Event) => {
  emit('scroll', event)
}

// 触摸事件处理
const handleTouchStart = (event: TouchEvent) => {
  if (!props.enableSwipeToClose || !isBottomDrawer.value) return

  const touch = event.touches[0]
  touchState.value = {
    startY: touch.clientY,
    currentY: touch.clientY,
    startTime: Date.now(),
    isDragging: true,
    shouldClose: false
  }

  isDragging.value = true
}

const handleTouchMove = (event: TouchEvent) => {
  if (!isDragging.value || !isBottomDrawer.value) return

  const touch = event.touches[0]
  touchState.value.currentY = touch.clientY
  dragDistance.value = touch.clientY - touchState.value.startY

  // 只有向下拖拽才允许关闭
  if (dragDistance.value > 0) {
    // 应用拖拽变换
    if (drawerRef.value) {
      drawerRef.value.style.transform = `translateY(${dragDistance.value}px)`
    }

    // 根据拖拽距离设置透明度
    const opacity = Math.max(0, 1 - dragDistance.value / 200)
    if (drawerRef.value) {
      drawerRef.value.style.opacity = opacity.toString()
    }

    event.preventDefault()
  }
}

const handleTouchEnd = () => {
  if (!isDragging.value || !isBottomDrawer.value) return

  isDragging.value = false

  // 判断是否应该关闭
  const threshold = 100 // 拖拽阈值
  const velocity = dragDistance.value / (Date.now() - touchState.value.startTime)
  const shouldClose = dragDistance.value > threshold || velocity > 0.5

  if (shouldClose) {
    close()
  } else {
    // 回弹动画
    if (drawerRef.value) {
      drawerRef.value.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
      drawerRef.value.style.transform = 'translateY(0)'
      drawerRef.value.style.opacity = '1'

      setTimeout(() => {
        if (drawerRef.value) {
          drawerRef.value.style.transition = ''
        }
      }, 300)
    }
  }

  // 重置状态
  dragDistance.value = 0
  touchState.value.isDragging = false
}

// 指示器触摸处理
const handleIndicatorTouchStart = (event: TouchEvent) => {
  if (isBottomDrawer.value) {
    handleTouchStart(event)
  }
}

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    emit('open')
    triggerHapticFeedback('success')
  } else {
    emit('close')
  }
})

// 监听ESC键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) {
    close()
  }
}

// 组件挂载
onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeydown)
  }
})

// 组件卸载
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', handleKeydown)
  }
  unlockBackgroundScroll()
})

// 暴露方法
defineExpose({
  close,
  open: () => emit('update:modelValue', true),
  scrollToTop: () => {
    if (contentRef.value) {
      contentRef.value.scrollTop = 0
    }
  },
  scrollTo: (top: number) => {
    if (contentRef.value) {
      contentRef.value.scrollTop = top
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mobile-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: calc(v-bind(zIndex) - 1);
}

.mobile-drawer {
  position: fixed;
  background: $dark-bg-primary;
  border-radius: 20px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  z-index: v-bind(zIndex);

  &--bottom {
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 90vh;
    border-radius: 20px 20px 0 0;
    max-height: var(--max-content-height, 90vh);
  }

  &--right {
    top: 0;
    right: 0;
    bottom: 0;
    width: 85%;
    max-width: 400px;
    border-radius: 20px 0 0 20px;
  }

  &--left {
    top: 0;
    left: 0;
    bottom: 0;
    width: 85%;
    max-width: 400px;
    border-radius: 0 20px 20px 0;
  }

  &--safe-area {
    padding-bottom: env(safe-area-inset-bottom);
  }

  &--no-header {
    border-radius: 20px 20px 0 0;
  }

  &--full-height {
    max-height: 100vh;
    border-radius: 0;
  }
}

.drawer-indicator {
  width: 40px;
  height: 4px;
  background: rgba($text-secondary, 0.3);
  border-radius: 2px;
  margin: 12px auto;
  cursor: grab;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba($text-secondary, 0.5);
  }

  &:active {
    cursor: grabbing;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba($gray-600, 0.2);
  flex-shrink: 0;

  &--compact {
    padding: 12px 16px;
  }
}

.drawer-title {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.drawer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba($gray-700, 0.3);
  border-radius: 10px;
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($gray-600, 0.5);
    color: $text-primary;
  }

  &:active {
    transform: scale(0.95);
  }
}

.drawer-content {
  flex: 1;
  overflow: hidden;
  position: relative;

  &--scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  &--padded {
    padding: 20px;
  }

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($gray-600, 0.3);
    border-radius: 2px;

    &:hover {
      background: rgba($gray-600, 0.5);
    }
  }
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba($gray-600, 0.2);
  flex-shrink: 0;

  &--sticky {
    background: $dark-bg-primary;
    position: sticky;
    bottom: 0;
  }
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-drawer {
    &--right,
    &--left {
      width: 90%;
      max-width: none;
    }
  }

  .drawer-header {
    padding: 14px 16px;
  }

  .drawer-content--padded {
    padding: 16px;
  }

  .drawer-footer {
    padding: 14px 16px;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .drawer-indicator {
    height: 3px;
  }
}
</style>