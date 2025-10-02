<template>
  <teleport to="body">
    <transition name="tooltip-fade">
      <div
        v-if="visible"
        ref="tooltipRef"
        class="tutorial-tooltip"
        :style="tooltipStyle"
        role="tooltip"
      >
        <div class="tooltip-content">
          <p class="tooltip-text">{{ text }}</p>
          <el-button
            link
            :icon="Close"
            class="tooltip-close"
            @click="dismiss"
            aria-label="关闭提示"
          />
        </div>
        <div class="tooltip-arrow" :style="arrowStyle"></div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Close } from '@element-plus/icons-vue';

interface Props {
  targetSelector?: string;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  autoDismiss?: boolean;
  dismissDelay?: number; // milliseconds
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'auto',
  autoDismiss: true,
  dismissDelay: 5000,
  visible: false,
});

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

const tooltipRef = ref<HTMLElement | null>(null);
const tooltipPosition = ref({ top: 0, left: 0 });
const actualPosition = ref<'top' | 'bottom' | 'left' | 'right'>('top');
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`,
}));

const arrowStyle = computed(() => {
  const styles: Record<string, string> = {};
  switch (actualPosition.value) {
    case 'top':
      styles.bottom = '-6px';
      styles.left = '50%';
      styles.transform = 'translateX(-50%) rotate(45deg)';
      break;
    case 'bottom':
      styles.top = '-6px';
      styles.left = '50%';
      styles.transform = 'translateX(-50%) rotate(45deg)';
      break;
    case 'left':
      styles.right = '-6px';
      styles.top = '50%';
      styles.transform = 'translateY(-50%) rotate(45deg)';
      break;
    case 'right':
      styles.left = '-6px';
      styles.top = '50%';
      styles.transform = 'translateY(-50%) rotate(45deg)';
      break;
  }
  return styles;
});

function calculatePosition() {
  if (!props.targetSelector) return;

  const target = document.querySelector(props.targetSelector);
  if (!target || !tooltipRef.value) return;

  const targetRect = target.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const padding = 12;

  let position = props.position;
  let top = 0;
  let left = 0;

  // Auto-detect best position if set to 'auto'
  if (position === 'auto') {
    const spaceAbove = targetRect.top;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceLeft = targetRect.left;
    const spaceRight = window.innerWidth - targetRect.right;

    const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight);
    if (maxSpace === spaceAbove && spaceAbove > 100) position = 'top';
    else if (maxSpace === spaceBelow && spaceBelow > 100) position = 'bottom';
    else if (maxSpace === spaceLeft && spaceLeft > 200) position = 'left';
    else position = 'right';
  }

  actualPosition.value = position;

  switch (position) {
    case 'top':
      top = targetRect.top + window.scrollY - tooltipRect.height - padding;
      left = targetRect.left + window.scrollX + targetRect.width / 2 - tooltipRect.width / 2;
      break;
    case 'bottom':
      top = targetRect.bottom + window.scrollY + padding;
      left = targetRect.left + window.scrollX + targetRect.width / 2 - tooltipRect.width / 2;
      break;
    case 'left':
      top = targetRect.top + window.scrollY + targetRect.height / 2 - tooltipRect.height / 2;
      left = targetRect.left + window.scrollX - tooltipRect.width - padding;
      break;
    case 'right':
      top = targetRect.top + window.scrollY + targetRect.height / 2 - tooltipRect.height / 2;
      left = targetRect.right + window.scrollX + padding;
      break;
  }

  // Keep within viewport bounds
  left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
  top = Math.max(10, Math.min(top, window.innerHeight + window.scrollY - tooltipRect.height - 10));

  tooltipPosition.value = { top, left };
}

function dismiss() {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  emit('dismiss');
}

function startAutoDismissTimer() {
  if (props.autoDismiss && props.dismissDelay > 0) {
    dismissTimer = setTimeout(() => {
      dismiss();
    }, props.dismissDelay);
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      calculatePosition();
      startAutoDismissTimer();
    }, 50);
  } else if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
});

onMounted(() => {
  if (props.visible) {
    setTimeout(() => {
      calculatePosition();
      startAutoDismissTimer();
    }, 50);
  }
  window.addEventListener('resize', calculatePosition);
  window.addEventListener('scroll', calculatePosition);
});

onBeforeUnmount(() => {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
  }
  window.removeEventListener('resize', calculatePosition);
  window.removeEventListener('scroll', calculatePosition);
});
</script>

<style scoped>
.tutorial-tooltip {
  position: absolute;
  max-width: 300px;
  background: #303133;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9998;
  pointer-events: auto;
}

.tooltip-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.tooltip-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.tooltip-close {
  flex-shrink: 0;
  color: white !important;
  padding: 0;
  min-height: 20px;
}

.tooltip-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #303133;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
