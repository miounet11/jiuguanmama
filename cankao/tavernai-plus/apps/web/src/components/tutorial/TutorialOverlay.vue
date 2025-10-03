<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="isActive && currentStep" class="tutorial-overlay">
        <!-- Backdrop -->
        <div class="tutorial-backdrop" @click="handleBackdropClick"></div>

        <!-- Highlight box -->
        <div
          v-if="highlightPosition"
          class="tutorial-highlight"
          :style="highlightStyle"
        ></div>

        <!-- Tutorial card -->
        <div
          class="tutorial-card"
          :style="cardStyle"
        >
          <!-- Header -->
          <div class="tutorial-header">
            <span class="tutorial-step-indicator">
              步骤 {{ currentStepNumber }} / {{ totalSteps }}
            </span>
            <el-button
              link
              :icon="Close"
              @click="skipTutorial"
              title="跳过教程"
            />
          </div>

          <!-- Content -->
          <div class="tutorial-content">
            <h3 class="tutorial-title">{{ currentStep.title }}</h3>
            <p class="tutorial-description">{{ currentStep.description }}</p>
          </div>

          <!-- Progress -->
          <div class="tutorial-progress">
            <div
              class="tutorial-progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>

          <!-- Actions -->
          <div class="tutorial-actions">
            <el-button
              v-if="currentStepNumber > 1"
              @click="previousStep"
            >
              上一步
            </el-button>
            <div v-else></div>
            <el-button
              type="primary"
              @click="nextStep"
            >
              {{ isLastStep ? '完成' : '下一步' }}
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { useTutorialStore } from '@/stores';

// Props
interface Props {
  tutorialId?: string;
  autoStart?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
});

// Store
const tutorialStore = useTutorialStore();

// Component State
const highlightPosition = ref<DOMRect | null>(null);
const cardPosition = ref({ top: 0, left: 0 });

// Computed
const isActive = computed(() => {
  return tutorialStore.currentTutorial !== null && !tutorialStore.currentTutorial?.completed;
});

const currentStep = computed(() => tutorialStore.currentStep);
const currentStepNumber = computed(() => {
  if (!tutorialStore.currentTutorial) return 0;
  return (tutorialStore.currentTutorial.currentStepIndex || 0) + 1;
});

const totalSteps = computed(() => {
  return tutorialStore.currentTutorial?.steps.length || 0;
});

const isLastStep = computed(() => {
  return currentStepNumber.value === totalSteps.value;
});

const progressPercentage = computed(() => {
  if (totalSteps.value === 0) return 0;
  return (currentStepNumber.value / totalSteps.value) * 100;
});

const highlightStyle = computed(() => {
  if (!highlightPosition.value) return {};
  return {
    top: `${highlightPosition.value.top}px`,
    left: `${highlightPosition.value.left}px`,
    width: `${highlightPosition.value.width}px`,
    height: `${highlightPosition.value.height}px`,
  };
});

const cardStyle = computed(() => {
  return {
    top: `${cardPosition.value.top}px`,
    left: `${cardPosition.value.left}px`,
  };
});

// Methods
function updateHighlight() {
  if (!currentStep.value?.targetSelector) {
    highlightPosition.value = null;
    return;
  }

  const target = document.querySelector(currentStep.value.targetSelector);
  if (!target) {
    console.warn(`Tutorial target not found: ${currentStep.value.targetSelector}`);
    highlightPosition.value = null;
    return;
  }

  const rect = target.getBoundingClientRect();
  highlightPosition.value = {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  } as DOMRect;

  // Calculate card position (below or above the highlight)
  const cardHeight = 300; // Approximate card height
  const padding = 20;

  if (rect.bottom + cardHeight + padding < window.innerHeight) {
    // Position below
    cardPosition.value = {
      top: rect.bottom + window.scrollY + padding,
      left: Math.max(20, Math.min(rect.left + window.scrollX, window.innerWidth - 420)),
    };
  } else {
    // Position above
    cardPosition.value = {
      top: Math.max(20, rect.top + window.scrollY - cardHeight - padding),
      left: Math.max(20, Math.min(rect.left + window.scrollX, window.innerWidth - 420)),
    };
  }

  // Scroll to highlight if needed
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function nextStep() {
  if (isLastStep.value) {
    await completeTutorial();
  } else {
    await tutorialStore.nextStep();
    updateHighlight();
  }
}

async function previousStep() {
  if (currentStepNumber.value > 1) {
    await tutorialStore.previousStep();
    updateHighlight();
  }
}

async function skipTutorial() {
  if (tutorialStore.currentTutorial) {
    await tutorialStore.skipTutorial(tutorialStore.currentTutorial.id);
  }
}

async function completeTutorial() {
  if (tutorialStore.currentTutorial) {
    await tutorialStore.completeTutorial(tutorialStore.currentTutorial.id);
  }
}

function handleBackdropClick() {
  // Optional: allow clicking backdrop to skip
  // skipTutorial();
}

// Watch for tutorial changes
watch(currentStep, () => {
  if (currentStep.value) {
    setTimeout(updateHighlight, 100); // Delay to ensure DOM is ready
  }
}, { immediate: true });

// Handle window resize
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  window.addEventListener('resize', updateHighlight);
  window.addEventListener('scroll', updateHighlight);

  // Optional: Start tutorial if autoStart
  if (props.autoStart && props.tutorialId) {
    tutorialStore.startTutorial(props.tutorialId);
  }

  // Set up ResizeObserver for better highlight tracking
  if (currentStep.value?.targetSelector) {
    const target = document.querySelector(currentStep.value.targetSelector);
    if (target) {
      resizeObserver = new ResizeObserver(updateHighlight);
      resizeObserver.observe(target);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHighlight);
  window.removeEventListener('scroll', updateHighlight);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// Expose methods for parent components
defineExpose({
  nextStep,
  previousStep,
  skipTutorial,
});
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
}

.tutorial-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  pointer-events: auto;
}

.tutorial-highlight {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.4), 0 0 0 9999px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 10000;
}

.tutorial-card {
  position: absolute;
  width: 400px;
  max-width: calc(100vw - 40px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  pointer-events: auto;
  z-index: 10001;
  transition: all 0.3s ease;
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tutorial-step-indicator {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.tutorial-content {
  margin-bottom: 1rem;
}

.tutorial-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #303133;
}

.tutorial-description {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.tutorial-progress {
  width: 100%;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.tutorial-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  transition: width 0.3s ease;
}

.tutorial-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .tutorial-card {
    width: calc(100vw - 40px);
    padding: 1rem;
  }

  .tutorial-title {
    font-size: 16px;
  }

  .tutorial-description {
    font-size: 13px;
  }
}
</style>
