<template>
  <div class="personality-step">
    <div class="form-grid">
      <!-- 性格特征标签 -->
      <div class="personality-traits-section">
        <label class="form-label">性格特征</label>
        <p class="form-help">选择或添加描述角色性格的关键词</p>

        <div class="traits-input">
          <div class="selected-traits">
            <TavernBadge
              v-for="trait in modelValue.personality"
              :key="trait"
              variant="primary"
              closable
              @close="removeTrait(trait)"
            >
              {{ trait }}
            </TavernBadge>
          </div>

          <div class="add-trait">
            <TavernInput
              v-model="newTrait"
              placeholder="添加性格特征，如：温柔、活泼、内向等"
              @keydown.enter="addTrait"
            />
            <TavernButton
              variant="secondary"
              @click="addTrait"
              :disabled="!newTrait.trim()"
            >
              添加
            </TavernButton>
          </div>
        </div>

        <!-- 性格特征分类选择 -->
        <div class="trait-categories">
          <div
            v-for="category in traitCategories"
            :key="category.name"
            class="trait-category"
          >
            <h5 class="category-title">
              <TavernIcon :name="category.icon" />
              {{ category.name }}
            </h5>
            <div class="category-traits">
              <TavernBadge
                v-for="trait in category.traits"
                :key="trait"
                variant="ghost"
                size="sm"
                clickable
                @click="addTrait(trait)"
              >
                {{ trait }}
              </TavernBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- 性格量表 -->
      <div class="personality-scales-section">
        <label class="form-label">性格量表</label>
        <p class="form-help">通过滑块调整角色的性格维度，帮助AI更好理解角色特点</p>

        <div class="personality-scales">
          <div
            v-for="trait in personalityTraits"
            :key="trait.key"
            class="trait-scale"
          >
            <div class="trait-header">
              <div class="trait-labels">
                <span class="trait-left">{{ trait.leftLabel }}</span>
                <span class="trait-name">{{ trait.name }}</span>
                <span class="trait-right">{{ trait.rightLabel }}</span>
              </div>
              <div class="trait-value">{{ modelValue.traits[trait.key] }}%</div>
            </div>

            <div class="trait-slider">
              <input
                type="range"
                min="0"
                max="100"
                :value="modelValue.traits[trait.key]"
                @input="updateTrait(trait.key, Number(($event.target as HTMLInputElement).value))"
                class="slider"
              />
            </div>

            <div class="trait-description">
              <p>{{ getTraitDescription(trait.key, modelValue.traits[trait.key]) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 行为模式 -->
      <div class="behavior-section">
        <label class="form-label">行为模式</label>
        <p class="form-help">描述角色的典型行为和反应方式</p>

        <div class="behavior-options">
          <TavernCard
            v-for="behavior in behaviorPatterns"
            :key="behavior.id"
            variant="outlined"
            size="sm"
            clickable
            :selected="selectedBehaviors.includes(behavior.id)"
            @click="toggleBehavior(behavior.id)"
          >
            <div class="behavior-item">
              <TavernIcon :name="behavior.icon" />
              <div class="behavior-info">
                <h6>{{ behavior.name }}</h6>
                <p>{{ behavior.description }}</p>
              </div>
            </div>
          </TavernCard>
        </div>
      </div>

      <!-- AI 性格生成助手 -->
      <div class="ai-personality-section">
        <TavernCard variant="filled" size="md">
          <template #header>
            <div class="ai-header">
              <TavernIcon name="sparkles" />
              <span>AI 性格生成助手</span>
            </div>
          </template>

          <div class="ai-content">
            <p>根据已有信息，AI可以帮助完善角色的性格设定</p>

            <div class="generation-options">
              <TavernButton
                variant="primary"
                @click="generatePersonality"
                :loading="isGenerating"
                :disabled="!canGenerate"
              >
                <template #icon-left>
                  <TavernIcon name="brain" />
                </template>
                生成性格特征
              </TavernButton>

              <TavernButton
                variant="secondary"
                @click="balanceTraits"
                :loading="isBalancing"
              >
                <template #icon-left>
                  <TavernIcon name="balance" />
                </template>
                平衡性格量表
              </TavernButton>
            </div>

            <div class="personality-suggestions" v-if="suggestions.length > 0">
              <h6>建议的性格特征：</h6>
              <div class="suggestions-list">
                <TavernBadge
                  v-for="suggestion in suggestions"
                  :key="suggestion"
                  variant="info"
                  clickable
                  @click="addTrait(suggestion)"
                >
                  {{ suggestion }}
                </TavernBadge>
              </div>
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
interface PersonalityTraits {
  introversion: number    // 内向 vs 外向
  empathy: number        // 理性 vs 感性
  creativity: number     // 保守 vs 创新
  humor: number         // 严肃 vs 幽默
  intelligence: number  // 直觉 vs 理性
}

interface CharacterData {
  name: string
  shortDescription: string
  personality: string[]
  traits: PersonalityTraits
}

interface TraitCategory {
  name: string
  icon: string
  traits: string[]
}

interface BehaviorPattern {
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
const newTrait = ref('')
const selectedBehaviors = ref<string[]>([])
const isGenerating = ref(false)
const isBalancing = ref(false)
const suggestions = ref<string[]>([])

// Data
const traitCategories: TraitCategory[] = [
  {
    name: '情感表达',
    icon: 'heart',
    traits: ['温柔', '热情', '冷静', '易怒', '敏感', '包容']
  },
  {
    name: '社交方式',
    icon: 'users',
    traits: ['外向', '内向', '健谈', '安静', '友善', '独立']
  },
  {
    name: '思维特点',
    icon: 'brain',
    traits: ['聪明', '睿智', '直觉', '理性', '创新', '传统']
  },
  {
    name: '行为风格',
    icon: 'zap',
    traits: ['积极', '消极', '主动', '被动', '谨慎', '冲动']
  },
  {
    name: '兴趣爱好',
    icon: 'star',
    traits: ['艺术', '运动', '科技', '阅读', '音乐', '游戏']
  }
]

const personalityTraits = [
  {
    key: 'introversion' as keyof PersonalityTraits,
    name: '社交倾向',
    leftLabel: '内向',
    rightLabel: '外向'
  },
  {
    key: 'empathy' as keyof PersonalityTraits,
    name: '决策方式',
    leftLabel: '理性',
    rightLabel: '感性'
  },
  {
    key: 'creativity' as keyof PersonalityTraits,
    name: '思维模式',
    leftLabel: '保守',
    rightLabel: '创新'
  },
  {
    key: 'humor' as keyof PersonalityTraits,
    name: '表达风格',
    leftLabel: '严肃',
    rightLabel: '幽默'
  },
  {
    key: 'intelligence' as keyof PersonalityTraits,
    name: '学习方式',
    leftLabel: '直觉',
    rightLabel: '分析'
  }
]

const behaviorPatterns: BehaviorPattern[] = [
  {
    id: 'helpful',
    name: '乐于助人',
    description: '主动帮助他人，关心别人的需要',
    icon: 'hand-heart'
  },
  {
    id: 'curious',
    name: '好奇探索',
    description: '对新事物充满兴趣，喜欢探索',
    icon: 'search'
  },
  {
    id: 'loyal',
    name: '忠诚可靠',
    description: '对朋友忠诚，信守承诺',
    icon: 'shield-check'
  },
  {
    id: 'playful',
    name: '活泼好动',
    description: '喜欢玩耍，充满活力',
    icon: 'smile'
  },
  {
    id: 'protective',
    name: '保护他人',
    description: '有保护欲，关心弱者',
    icon: 'shield'
  },
  {
    id: 'competitive',
    name: '争强好胜',
    description: '喜欢竞争，追求胜利',
    icon: 'trophy'
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
const addTrait = (trait?: string) => {
  const traitToAdd = trait || newTrait.value.trim()

  if (traitToAdd && !modelValue.value.personality.includes(traitToAdd)) {
    modelValue.value = {
      ...modelValue.value,
      personality: [...modelValue.value.personality, traitToAdd]
    }

    if (!trait) {
      newTrait.value = ''
    }
  }
}

const removeTrait = (trait: string) => {
  modelValue.value = {
    ...modelValue.value,
    personality: modelValue.value.personality.filter(t => t !== trait)
  }
}

const updateTrait = (key: keyof PersonalityTraits, value: number) => {
  modelValue.value = {
    ...modelValue.value,
    traits: {
      ...modelValue.value.traits,
      [key]: value
    }
  }
}

const toggleBehavior = (behaviorId: string) => {
  if (selectedBehaviors.value.includes(behaviorId)) {
    selectedBehaviors.value = selectedBehaviors.value.filter(id => id !== behaviorId)
  } else {
    selectedBehaviors.value = [...selectedBehaviors.value, behaviorId]
  }
}

const getTraitDescription = (key: keyof PersonalityTraits, value: number) => {
  const descriptions: Record<keyof PersonalityTraits, { low: string, mid: string, high: string }> = {
    introversion: {
      low: '倾向于独处，在小群体中更舒适，需要独处时间恢复精力',
      mid: '在社交和独处之间保持平衡，适应不同的社交场合',
      high: '享受与他人交往，从社交互动中获得能量，善于表达'
    },
    empathy: {
      low: '更注重逻辑和客观分析，决策基于事实和数据',
      mid: '在理性分析和情感考量之间寻求平衡',
      high: '重视情感和人际关系，决策时考虑他人感受'
    },
    creativity: {
      low: '喜欢传统和稳定的方法，重视经验和既定规则',
      mid: '在创新和传统之间取得平衡，适度接受新想法',
      high: '喜欢创新和变化，善于产生新想法和解决方案'
    },
    humor: {
      low: '表达较为严肃和正式，注重事情的严肃性',
      mid: '能够在适当的时候展现幽默感',
      high: '经常使用幽默，善于活跃气氛，表达轻松有趣'
    },
    intelligence: {
      low: '更依赖直觉和感觉做决定，注重整体印象',
      mid: '结合直觉和分析，灵活运用不同思维方式',
      high: '喜欢深入分析和思考，注重细节和逻辑推理'
    }
  }

  if (value <= 33) return descriptions[key].low
  if (value <= 66) return descriptions[key].mid
  return descriptions[key].high
}

const generatePersonality = async () => {
  isGenerating.value = true
  try {
    // TODO: 集成AI性格生成服务
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟生成建议
    suggestions.value = ['友善', '好奇', '乐观', '耐心', '善解人意']
  } catch (error) {
    console.error('Personality generation failed:', error)
  } finally {
    isGenerating.value = false
  }
}

const balanceTraits = async () => {
  isBalancing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 基于现有特征平衡性格量表
    const balanced: PersonalityTraits = {
      introversion: 50,
      empathy: 60,
      creativity: 70,
      humor: 55,
      intelligence: 65
    }

    modelValue.value = {
      ...modelValue.value,
      traits: balanced
    }
  } catch (error) {
    console.error('Trait balancing failed:', error)
  } finally {
    isBalancing.value = false
  }
}

// Watch for validation
watch(
  () => modelValue.value.personality,
  () => {
    const errors: Record<string, string> = {}

    if (modelValue.value.personality.length === 0) {
      errors.personality = '请至少添加一个性格特征'
    }

    emit('validate', 'personality', errors)
  },
  { deep: true }
)
</script>

<style lang="scss">
.personality-step {
  .form-grid {
    display: grid;
    gap: var(--space-8);

    .form-label {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
      margin-bottom: var(--space-1);
    }

    .form-help {
      margin: 0 0 var(--space-4) 0;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      line-height: var(--leading-relaxed);
    }

    .personality-traits-section {
      .traits-input {
        .selected-traits {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
          min-height: var(--space-8);
        }

        .add-trait {
          display: flex;
          gap: var(--space-2);
          align-items: flex-end;
          margin-bottom: var(--space-6);
        }
      }

      .trait-categories {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-4);

        .trait-category {
          .category-title {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            margin: 0 0 var(--space-3) 0;
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
            color: var(--text-primary);
          }

          .category-traits {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-1);
          }
        }
      }
    }

    .personality-scales-section {
      .personality-scales {
        display: grid;
        gap: var(--space-6);

        .trait-scale {
          .trait-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--space-3);

            .trait-labels {
              display: flex;
              align-items: center;
              gap: var(--space-4);

              .trait-left,
              .trait-right {
                font-size: var(--text-sm);
                color: var(--text-tertiary);
                min-width: 60px;
              }

              .trait-name {
                font-size: var(--text-base);
                font-weight: var(--font-medium);
                color: var(--text-primary);
              }
            }

            .trait-value {
              font-size: var(--text-sm);
              font-weight: var(--font-semibold);
              color: var(--brand-primary-500);
            }
          }

          .trait-slider {
            margin-bottom: var(--space-3);

            .slider {
              width: 100%;
              height: 6px;
              border-radius: var(--radius-full);
              background: var(--surface-3);
              outline: none;
              appearance: none;
              cursor: pointer;

              &::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: var(--radius-full);
                background: var(--brand-primary-500);
                border: 2px solid var(--surface-1);
                box-shadow: var(--shadow-sm);
                cursor: pointer;
                transition: var(--transition-transform);

                &:hover {
                  transform: scale(1.1);
                }
              }

              &::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: var(--radius-full);
                background: var(--brand-primary-500);
                border: 2px solid var(--surface-1);
                cursor: pointer;
              }
            }
          }

          .trait-description {
            p {
              margin: 0;
              font-size: var(--text-sm);
              color: var(--text-secondary);
              line-height: var(--leading-relaxed);
            }
          }
        }
      }
    }

    .behavior-section {
      .behavior-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-3);

        .behavior-item {
          display: flex;
          gap: var(--space-3);
          padding: var(--space-3);
          align-items: flex-start;

          .behavior-info {
            flex: 1;

            h6 {
              margin: 0 0 var(--space-1) 0;
              font-size: var(--text-sm);
              font-weight: var(--font-medium);
              color: var(--text-primary);
            }

            p {
              margin: 0;
              font-size: var(--text-xs);
              color: var(--text-secondary);
              line-height: var(--leading-normal);
            }
          }
        }
      }
    }

    .ai-personality-section {
      .ai-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--brand-primary-400);
        font-weight: var(--font-medium);
      }

      .ai-content {
        p {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
        }

        .generation-options {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-4);

          @media (max-width: 640px) {
            flex-direction: column;
          }
        }

        .personality-suggestions {
          h6 {
            margin: 0 0 var(--space-3) 0;
            font-size: var(--text-sm);
            color: var(--text-primary);
          }

          .suggestions-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-2);
          }
        }
      }
    }
  }
}
</style>