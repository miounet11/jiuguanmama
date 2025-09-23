<template>
  <div class="appearance-step">
    <div class="form-grid">
      <!-- 外貌描述 -->
      <TavernInput
        v-model="modelValue.appearance.physicalDescription"
        type="textarea"
        label="外貌描述"
        placeholder="详细描述角色的外貌特征，如身高、体型、发色、眼睛颜色等"
        :maxlength="500"
        :show-char-count="true"
        :rows="4"
        :error-message="validation?.physicalDescription"
      />

      <!-- 服装打扮 -->
      <TavernInput
        v-model="modelValue.appearance.outfit"
        type="textarea"
        label="服装打扮"
        placeholder="描述角色的穿着风格和服装特色"
        :maxlength="300"
        :show-char-count="true"
        :rows="3"
        :error-message="validation?.outfit"
      />

      <!-- 表情预设 -->
      <div class="expressions-section">
        <label class="form-label">表情预设</label>
        <p class="form-help">添加角色常见的表情和情绪状态</p>

        <div class="expression-input">
          <div class="selected-expressions">
            <TavernCard
              v-for="(expression, index) in modelValue.appearance.expressions"
              :key="`expression-${index}`"
              variant="outlined"
              size="sm"
            >
              <div class="expression-item">
                <TavernIcon :name="getExpressionIcon(expression)" />
                <span>{{ expression }}</span>
                <button
                  type="button"
                  class="remove-expression"
                  @click="removeExpression(index)"
                >
                  <TavernIcon name="x" size="sm" />
                </button>
              </div>
            </TavernCard>
          </div>

          <div class="add-expression">
            <TavernInput
              v-model="newExpression"
              placeholder="添加表情，如：微笑、皱眉、惊讶等"
              @keydown.enter="addExpression"
            />
            <TavernButton
              variant="secondary"
              @click="addExpression"
              :disabled="!newExpression.trim()"
            >
              添加
            </TavernButton>
          </div>
        </div>

        <!-- 常用表情快捷选择 -->
        <div class="common-expressions">
          <span class="expressions-label">常用表情：</span>
          <TavernBadge
            v-for="expression in commonExpressions"
            :key="expression"
            variant="ghost"
            size="sm"
            clickable
            @click="addExpression(expression)"
          >
            <template #icon>
              <TavernIcon :name="getExpressionIcon(expression)" />
            </template>
            {{ expression }}
          </TavernBadge>
        </div>
      </div>

      <!-- 外观风格选择 -->
      <div class="style-section">
        <label class="form-label">外观风格</label>
        <p class="form-help">选择角色的整体视觉风格</p>

        <div class="style-grid">
          <TavernCard
            v-for="style in appearanceStyles"
            :key="style.id"
            variant="outlined"
            size="md"
            clickable
            :selected="selectedStyle === style.id"
            @click="selectStyle(style.id)"
          >
            <template #media>
              <div class="style-preview" :class="`style-${style.id}`">
                <TavernIcon :name="style.icon" size="xl" />
              </div>
            </template>

            <div class="style-info">
              <h5>{{ style.name }}</h5>
              <p>{{ style.description }}</p>
            </div>
          </TavernCard>
        </div>
      </div>

      <!-- AI辅助生成 -->
      <div class="ai-assist-section">
        <TavernCard variant="filled" size="md">
          <template #header>
            <div class="ai-assist-header">
              <TavernIcon name="sparkles" />
              <span>AI 外观生成助手</span>
            </div>
          </template>

          <div class="ai-assist-content">
            <p>根据角色名称和描述，AI 可以帮助生成详细的外观描述</p>

            <div class="ai-options">
              <TavernButton
                variant="primary"
                @click="generateAppearance"
                :loading="isGenerating"
                :disabled="!canGenerate"
              >
                <template #icon-left>
                  <TavernIcon name="magic-wand" />
                </template>
                生成外观描述
              </TavernButton>

              <TavernButton
                variant="secondary"
                @click="generateOutfit"
                :loading="isGeneratingOutfit"
                :disabled="!modelValue.appearance.physicalDescription"
              >
                <template #icon-left>
                  <TavernIcon name="palette" />
                </template>
                生成服装搭配
              </TavernButton>
            </div>

            <div class="generation-tips">
              <TavernIcon name="lightbulb" size="sm" />
              <span>提示：越详细的基础信息，生成的外观描述越准确</span>
            </div>
          </div>
        </TavernCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TavernInput from '@/components/design-system/TavernInput.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'

// Types
interface AppearanceData {
  physicalDescription: string
  outfit: string
  expressions: string[]
}

interface CharacterData {
  name: string
  shortDescription: string
  appearance: AppearanceData
}

interface AppearanceStyle {
  id: string
  name: string
  description: string
  icon: string
}

// Props & Emits
const props = defineProps<{
  modelValue: CharacterData
  validation?: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CharacterData]
  validate: [stepId: string, errors: Record<string, string>]
}>()

// State
const newExpression = ref('')
const selectedStyle = ref('')
const isGenerating = ref(false)
const isGeneratingOutfit = ref(false)

// Data
const commonExpressions = [
  '微笑', '皱眉', '惊讶', '生气', '害羞', '思考',
  '开心', '难过', '疑惑', '兴奋', '淡定', '紧张'
]

const appearanceStyles: AppearanceStyle[] = [
  {
    id: 'anime',
    name: '动漫风格',
    description: '大眼睛、柔和线条，二次元特征明显',
    icon: 'star'
  },
  {
    id: 'realistic',
    name: '写实风格',
    description: '真实人物比例，自然细腻的特征',
    icon: 'camera'
  },
  {
    id: 'fantasy',
    name: '奇幻风格',
    description: '魔法元素、特殊种族特征',
    icon: 'wand'
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '科技改造、霓虹色彩、未来感',
    icon: 'cpu'
  },
  {
    id: 'vintage',
    name: '复古风格',
    description: '古典优雅、复古服饰、怀旧气息',
    icon: 'clock'
  },
  {
    id: 'minimalist',
    name: '简约风格',
    description: '简洁线条、纯色搭配、现代感',
    icon: 'minimize'
  }
]

// Computed
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canGenerate = computed(() => {
  return !!(modelValue.value.name && modelValue.value.shortDescription)
})

// Methods
const addExpression = (expression?: string) => {
  const expressionToAdd = expression || newExpression.value.trim()

  if (expressionToAdd && !modelValue.value.appearance.expressions.includes(expressionToAdd)) {
    modelValue.value = {
      ...modelValue.value,
      appearance: {
        ...modelValue.value.appearance,
        expressions: [...modelValue.value.appearance.expressions, expressionToAdd]
      }
    }

    if (!expression) {
      newExpression.value = ''
    }
  }
}

const removeExpression = (index: number) => {
  const expressions = [...modelValue.value.appearance.expressions]
  expressions.splice(index, 1)

  modelValue.value = {
    ...modelValue.value,
    appearance: {
      ...modelValue.value.appearance,
      expressions
    }
  }
}

const selectStyle = (styleId: string) => {
  selectedStyle.value = styleId
  // 可以根据风格预设一些外观特征
}

const getExpressionIcon = (expression: string) => {
  const iconMap: Record<string, string> = {
    '微笑': 'smile',
    '皱眉': 'frown',
    '惊讶': 'surprise',
    '生气': 'angry',
    '害羞': 'blush',
    '思考': 'thinking',
    '开心': 'happy',
    '难过': 'sad',
    '疑惑': 'question',
    '兴奋': 'excited',
    '淡定': 'calm',
    '紧张': 'nervous'
  }
  return iconMap[expression] || 'emoji'
}

const generateAppearance = async () => {
  isGenerating.value = true
  try {
    // TODO: 集成AI外观生成服务
    // const description = await generateCharacterAppearance(
    //   modelValue.value.name,
    //   modelValue.value.shortDescription,
    //   selectedStyle.value
    // )

    // 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 模拟生成结果
    const sampleDescription = `${modelValue.value.name}是一位具有温柔气质的角色，拥有柔和的面部轮廓和友善的眼神。身材匀称，举止优雅，散发着亲和力。`

    modelValue.value = {
      ...modelValue.value,
      appearance: {
        ...modelValue.value.appearance,
        physicalDescription: sampleDescription
      }
    }
  } catch (error) {
    console.error('Appearance generation failed:', error)
  } finally {
    isGenerating.value = false
  }
}

const generateOutfit = async () => {
  isGeneratingOutfit.value = true
  try {
    // TODO: 集成AI服装生成服务
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟生成结果
    const sampleOutfit = '穿着简约而优雅的日常服装，色彩搭配和谐，体现出个人品味。'

    modelValue.value = {
      ...modelValue.value,
      appearance: {
        ...modelValue.value.appearance,
        outfit: sampleOutfit
      }
    }
  } catch (error) {
    console.error('Outfit generation failed:', error)
  } finally {
    isGeneratingOutfit.value = false
  }
}

// Watch for validation
watch(
  () => [modelValue.value.appearance.physicalDescription, modelValue.value.appearance.outfit],
  () => {
    const errors: Record<string, string> = {}

    // 验证逻辑相对宽松，允许用户有更多自由度
    if (modelValue.value.appearance.physicalDescription && modelValue.value.appearance.physicalDescription.length < 20) {
      errors.physicalDescription = '外貌描述太简单，建议至少20个字符'
    }

    emit('validate', 'appearance', errors)
  },
  { deep: true }
)
</script>

<style lang="scss">
.appearance-step {
  .form-grid {
    display: grid;
    gap: var(--space-6);

    .form-label {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
      margin-bottom: var(--space-1);
    }

    .form-help {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      line-height: var(--leading-relaxed);
    }

    .expressions-section {
      .expression-input {
        .selected-expressions {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-3);
          margin-bottom: var(--space-4);

          .expression-item {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-2) var(--space-3);

            span {
              flex: 1;
              font-size: var(--text-sm);
            }

            .remove-expression {
              background: none;
              border: none;
              padding: var(--space-1);
              cursor: pointer;
              color: var(--text-tertiary);
              border-radius: var(--radius-sm);
              transition: var(--transition-colors);

              &:hover {
                color: var(--error);
                background: rgba(var(--error), 0.1);
              }
            }
          }
        }

        .add-expression {
          display: flex;
          gap: var(--space-2);
          align-items: flex-end;
        }
      }

      .common-expressions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        align-items: center;
        margin-top: var(--space-4);

        .expressions-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin-right: var(--space-2);
        }
      }
    }

    .style-section {
      .style-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--space-4);

        .style-preview {
          aspect-ratio: 16/9;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--surface-3), var(--surface-4));
          color: var(--text-tertiary);

          &.style-anime {
            background: linear-gradient(135deg, #ff6b9d, #ffc0cb);
            color: white;
          }

          &.style-realistic {
            background: linear-gradient(135deg, #8b7355, #d2b48c);
            color: white;
          }

          &.style-fantasy {
            background: linear-gradient(135deg, #9d4edd, #c77dff);
            color: white;
          }

          &.style-cyberpunk {
            background: linear-gradient(135deg, #00ffff, #ff00ff);
            color: black;
          }

          &.style-vintage {
            background: linear-gradient(135deg, #d4a574, #f4e4bc);
            color: #8b4513;
          }

          &.style-minimalist {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            color: #495057;
          }
        }

        .style-info {
          padding: var(--space-3);

          h5 {
            margin: 0 0 var(--space-1) 0;
            font-size: var(--text-base);
            font-weight: var(--font-semibold);
            color: var(--text-primary);
          }

          p {
            margin: 0;
            font-size: var(--text-sm);
            color: var(--text-secondary);
            line-height: var(--leading-relaxed);
          }
        }
      }
    }

    .ai-assist-section {
      .ai-assist-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--brand-primary-400);
        font-weight: var(--font-medium);
      }

      .ai-assist-content {
        p {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
        }

        .ai-options {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-4);

          @media (max-width: 640px) {
            flex-direction: column;
          }
        }

        .generation-tips {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: rgba(var(--brand-primary-500), 0.1);
          border-radius: var(--radius-md);
          border-left: var(--space-1) solid var(--brand-primary-500);

          span {
            font-size: var(--text-sm);
            color: var(--text-secondary);
          }
        }
      }
    }
  }
}
</style>