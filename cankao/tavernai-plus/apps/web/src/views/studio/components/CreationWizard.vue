<template>
  <div class="creation-wizard">
    <!-- 进度指示器 -->
    <div class="wizard-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        />
      </div>

      <div class="step-indicators">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="step-indicator"
          :class="{
            'active': currentStep === index,
            'completed': index < currentStep,
            'disabled': index > currentStep
          }"
          @click="goToStep(index)"
        >
          <div class="step-icon">
            <TavernIcon
              :name="getStepIcon(step, index)"
              size="md"
            />
          </div>
          <div class="step-label">{{ step.title }}</div>
        </div>
      </div>
    </div>

    <!-- 步骤内容 -->
    <div class="wizard-content">
      <TavernCard class="step-container" size="lg">
        <template #header>
          <div class="step-header">
            <h2 class="step-title">{{ currentStepData.title }}</h2>
            <p class="step-description">{{ currentStepData.description }}</p>
          </div>
        </template>

        <!-- 动态步骤组件 -->
        <component
          :is="currentStepComponent"
          v-model="characterData"
          :validation="validation"
          @validate="handleValidation"
          @next="nextStep"
          @prev="prevStep"
        />

        <template #footer>
          <div class="wizard-actions">
            <TavernButton
              v-if="currentStep > 0"
              variant="ghost"
              @click="prevStep"
            >
              <template #icon-left>
                <TavernIcon name="arrow-left" />
              </template>
              上一步
            </TavernButton>

            <div class="action-spacer" />

            <TavernButton
              variant="ghost"
              @click="saveDraft"
              :loading="isDraftSaving"
            >
              保存草稿
            </TavernButton>

            <TavernButton
              v-if="currentStep < steps.length - 1"
              variant="primary"
              @click="nextStep"
              :disabled="!isCurrentStepValid"
            >
              下一步
              <template #icon-right>
                <TavernIcon name="arrow-right" />
              </template>
            </TavernButton>

            <TavernButton
              v-else
              variant="primary"
              @click="createCharacter"
              :loading="isCreating"
            >
              创建角色
              <template #icon-right>
                <TavernIcon name="check" />
              </template>
            </TavernButton>
          </div>
        </template>
      </TavernCard>
    </div>

    <!-- 实时预览面板 -->
    <div class="preview-panel">
      <CharacterPreview
        :character="characterData"
        :current-step="currentStep"
        @test-chat="openChatPreview"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import CharacterPreview from './CharacterPreview.vue'
import BasicInfoStep from './BasicInfoStep.vue'
import AppearanceStep from './AppearanceStep.vue'
import PersonalityStep from './PersonalityStep.vue'
import BackstoryStep from './BackstoryStep.vue'
import PreviewStep from './PreviewStep.vue'
import { useCharacterCreation } from '@/composables/useCharacterCreation'
import { useFormValidation } from '@/composables/useFormValidation'

// Types
interface StepDefinition {
  id: string
  title: string
  description: string
  component: any
  icon: string
}

interface CharacterData {
  // 基础信息
  name: string
  avatar: string
  shortDescription: string
  category: string
  tags: string[]

  // 外观设定
  appearance: {
    physicalDescription: string
    outfit: string
    expressions: string[]
  }

  // 性格设定
  personality: string[]
  traits: {
    introversion: number
    empathy: number
    creativity: number
    humor: number
    intelligence: number
  }

  // 背景故事
  background: string
  scenario: string
  firstMessage: string
  sampleConversation: Array<{
    role: 'user' | 'assistant'
    content: string
  }>

  // 高级设置
  visibility: 'public' | 'unlisted' | 'private'
  isNSFW: boolean
}

// Composables
const router = useRouter()
const {
  characterData,
  createCharacter,
  saveDraft,
  isCreating,
  isDraftSaving
} = useCharacterCreation()

const { validation, validateStep, isStepValid } = useFormValidation()

// State
const currentStep = ref(0)

// Steps configuration
const steps: StepDefinition[] = [
  {
    id: 'basic-info',
    title: '基础信息',
    description: '设定角色的基本信息和身份标识',
    component: markRaw(BasicInfoStep),
    icon: 'user'
  },
  {
    id: 'appearance',
    title: '外观设定',
    description: '描述角色的外貌特征和穿着打扮',
    component: markRaw(AppearanceStep),
    icon: 'photo'
  },
  {
    id: 'personality',
    title: '性格设置',
    description: '定义角色的性格特征和行为模式',
    component: markRaw(PersonalityStep),
    icon: 'heart'
  },
  {
    id: 'backstory',
    title: '背景故事',
    description: '创建角色的背景设定和对话场景',
    component: markRaw(BackstoryStep),
    icon: 'book'
  },
  {
    id: 'preview',
    title: '预览确认',
    description: '最终确认角色信息并发布',
    component: markRaw(PreviewStep),
    icon: 'eye'
  }
]

// Computed
const progressPercentage = computed(() =>
  ((currentStep.value + 1) / steps.length) * 100
)

const currentStepData = computed(() => steps[currentStep.value])

const currentStepComponent = computed(() =>
  currentStepData.value.component
)

const isCurrentStepValid = computed(() =>
  isStepValid(currentStepData.value.id)
)

// Methods
const getStepIcon = (step: StepDefinition, index: number) => {
  if (index < currentStep.value) {
    return 'check'
  }
  return step.icon
}

const goToStep = (stepIndex: number) => {
  // 只允许前往已完成或当前步骤
  if (stepIndex <= currentStep.value) {
    currentStep.value = stepIndex
  }
}

const nextStep = async () => {
  // 验证当前步骤
  const isValid = await validateStep(currentStepData.value.id, characterData.value)

  if (isValid && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleValidation = (stepId: string, errors: Record<string, string>) => {
  validation.value[stepId] = errors
}

const openChatPreview = () => {
  // 打开对话预览弹窗
  // TODO: 实现对话预览功能
}

// 初始化默认数据
characterData.value = {
  name: '',
  avatar: '',
  shortDescription: '',
  category: '',
  tags: [],
  appearance: {
    physicalDescription: '',
    outfit: '',
    expressions: []
  },
  personality: [],
  traits: {
    introversion: 50,
    empathy: 50,
    creativity: 50,
    humor: 50,
    intelligence: 50
  },
  background: '',
  scenario: '',
  firstMessage: '',
  sampleConversation: [],
  visibility: 'public',
  isNSFW: false
}
</script>

<style lang="scss">
.creation-wizard {
  display: grid;
  grid-template-areas:
    "progress progress"
    "content preview";
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto 1fr;
  gap: var(--space-6);
  padding: var(--container-padding);
  min-height: calc(100vh - var(--space-16));

  @media (max-width: 1024px) {
    grid-template-areas:
      "progress"
      "content"
      "preview";
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
}

.wizard-progress {
  grid-area: progress;
  padding: var(--space-4) 0;

  .progress-bar {
    height: var(--space-1);
    background: var(--surface-3);
    border-radius: var(--radius-full);
    margin-bottom: var(--space-6);
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--brand-primary-500),
        var(--brand-primary-400)
      );
      transition: width var(--duration-normal) ease;
    }
  }

  .step-indicators {
    display: flex;
    justify-content: space-between;

    @media (max-width: 640px) {
      flex-direction: column;
      gap: var(--space-4);
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      transition: all var(--duration-fast) ease;

      @media (max-width: 640px) {
        flex-direction: row;
        gap: var(--space-3);
        width: 100%;
        text-align: left;
      }

      &.active {
        .step-icon {
          background: var(--brand-primary-500);
          color: var(--brand-primary-50);
          transform: scale(1.1);
        }

        .step-label {
          color: var(--text-primary);
          font-weight: var(--font-semibold);
        }
      }

      &.completed {
        .step-icon {
          background: var(--success);
          color: var(--neutral-50);
        }
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .step-icon {
      width: var(--space-12);
      height: var(--space-12);
      border-radius: var(--radius-full);
      background: var(--surface-3);
      border: var(--space-px-2) solid var(--border-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--duration-fast) ease;
    }

    .step-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      text-align: center;
      max-width: 120px;

      @media (max-width: 640px) {
        max-width: none;
        text-align: left;
      }
    }
  }
}

.wizard-content {
  grid-area: content;

  .step-container {
    min-height: 600px;
  }

  .step-header {
    margin-bottom: var(--space-4);

    .step-title {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-2xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }

    .step-description {
      margin: 0;
      font-size: var(--text-base);
      color: var(--text-secondary);
      line-height: var(--leading-relaxed);
    }
  }

  .wizard-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);

    .action-spacer {
      flex: 1;
    }
  }
}

.preview-panel {
  grid-area: preview;
  position: sticky;
  top: var(--space-4);
  height: fit-content;

  @media (max-width: 1024px) {
    position: static;
  }
}
</style>