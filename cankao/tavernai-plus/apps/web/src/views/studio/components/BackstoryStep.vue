<template>
  <div class="backstory-step">
    <div class="form-grid">
      <!-- 背景故事 -->
      <TavernInput
        v-model="modelValue.background"
        type="textarea"
        label="背景故事"
        placeholder="描述角色的成长经历、过往事件和重要经历，这将影响角色的行为和对话风格"
        :maxlength="1000"
        :show-char-count="true"
        :rows="6"
        :error-message="validation?.background"
      />

      <!-- 对话场景 -->
      <TavernInput
        v-model="modelValue.scenario"
        type="textarea"
        label="对话场景"
        placeholder="设定与角色对话的具体场景和环境，如：在学校的图书馆、在家中的客厅、在咖啡厅等"
        :maxlength="500"
        :show-char-count="true"
        :rows="4"
        :error-message="validation?.scenario"
      />

      <!-- 开场白 -->
      <TavernInput
        v-model="modelValue.firstMessage"
        type="textarea"
        label="开场白"
        placeholder="角色与用户初次见面时会说的第一句话，体现角色的性格和语言风格"
        :maxlength="200"
        :show-char-count="true"
        :rows="3"
        :error-message="validation?.firstMessage"
        required
      />

      <!-- 示例对话 -->
      <div class="sample-conversation-section">
        <label class="form-label">示例对话</label>
        <p class="form-help">添加几轮示例对话，帮助AI更好地理解角色的对话风格</p>

        <div class="conversation-messages">
          <div
            v-for="(message, index) in modelValue.sampleConversation"
            :key="`message-${index}`"
            class="message-item"
            :class="`message-${message.role}`"
          >
            <div class="message-role">
              <TavernIcon
                :name="message.role === 'user' ? 'user' : 'robot'"
                size="sm"
              />
              <span>{{ message.role === 'user' ? '用户' : '角色' }}</span>
            </div>
            <div class="message-content">
              <TavernInput
                :model-value="message.content"
                type="textarea"
                :rows="2"
                @update:model-value="updateMessage(index, $event)"
              />
              <button
                type="button"
                class="remove-message"
                @click="removeMessage(index)"
              >
                <TavernIcon name="trash" size="sm" />
              </button>
            </div>
          </div>
        </div>

        <div class="add-message-actions">
          <TavernButton
            variant="secondary"
            @click="addMessage('user')"
          >
            <template #icon-left>
              <TavernIcon name="user" />
            </template>
            添加用户消息
          </TavernButton>

          <TavernButton
            variant="secondary"
            @click="addMessage('assistant')"
          >
            <template #icon-left>
              <TavernIcon name="robot" />
            </template>
            添加角色回复
          </TavernButton>
        </div>
      </div>

      <!-- 语言风格设置 -->
      <div class="language-style-section">
        <label class="form-label">语言风格</label>
        <p class="form-help">选择角色的说话方式和语言特点</p>

        <div class="style-options">
          <TavernCard
            v-for="style in languageStyles"
            :key="style.id"
            variant="outlined"
            size="sm"
            clickable
            :selected="selectedLanguageStyles.includes(style.id)"
            @click="toggleLanguageStyle(style.id)"
          >
            <div class="style-option">
              <TavernIcon :name="style.icon" />
              <div class="style-info">
                <h6>{{ style.name }}</h6>
                <p>{{ style.description }}</p>
              </div>
            </div>
          </TavernCard>
        </div>
      </div>

      <!-- 禁忌话题 -->
      <div class="forbidden-topics-section">
        <label class="form-label">禁忌话题</label>
        <p class="form-help">设置角色不会讨论或回避的话题</p>

        <div class="forbidden-topics">
          <div class="selected-topics">
            <TavernBadge
              v-for="topic in forbiddenTopics"
              :key="topic"
              variant="error"
              closable
              @close="removeForbiddenTopic(topic)"
            >
              {{ topic }}
            </TavernBadge>
          </div>

          <div class="add-topic">
            <TavernInput
              v-model="newForbiddenTopic"
              placeholder="添加禁忌话题，如：政治、暴力等"
              @keydown.enter="addForbiddenTopic"
            />
            <TavernButton
              variant="secondary"
              @click="addForbiddenTopic"
              :disabled="!newForbiddenTopic.trim()"
            >
              添加
            </TavernButton>
          </div>
        </div>

        <div class="common-topics">
          <span class="topics-label">常见禁忌：</span>
          <TavernBadge
            v-for="topic in commonForbiddenTopics"
            :key="topic"
            variant="ghost"
            size="sm"
            clickable
            @click="addForbiddenTopic(topic)"
          >
            {{ topic }}
          </TavernBadge>
        </div>
      </div>

      <!-- AI 背景生成助手 -->
      <div class="ai-backstory-section">
        <TavernCard variant="filled" size="md">
          <template #header>
            <div class="ai-header">
              <TavernIcon name="sparkles" />
              <span>AI 背景生成助手</span>
            </div>
          </template>

          <div class="ai-content">
            <p>基于角色信息，AI可以帮助生成丰富的背景故事和对话示例</p>

            <div class="generation-options">
              <TavernButton
                variant="primary"
                @click="generateBackstory"
                :loading="isGeneratingBackstory"
                :disabled="!canGenerate"
              >
                <template #icon-left>
                  <TavernIcon name="book" />
                </template>
                生成背景故事
              </TavernButton>

              <TavernButton
                variant="secondary"
                @click="generateFirstMessage"
                :loading="isGeneratingFirstMessage"
                :disabled="!canGenerate"
              >
                <template #icon-left>
                  <TavernIcon name="message-circle" />
                </template>
                生成开场白
              </TavernButton>

              <TavernButton
                variant="secondary"
                @click="generateConversation"
                :loading="isGeneratingConversation"
                :disabled="!modelValue.firstMessage"
              >
                <template #icon-left>
                  <TavernIcon name="messages" />
                </template>
                生成示例对话
              </TavernButton>
            </div>

            <div class="backstory-tips">
              <TavernIcon name="lightbulb" size="sm" />
              <span>提示：详细的背景设定能让AI更好地理解角色，产生更真实的对话</span>
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
interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CharacterData {
  name: string
  shortDescription: string
  background: string
  scenario: string
  firstMessage: string
  sampleConversation: ConversationMessage[]
}

interface LanguageStyle {
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
const selectedLanguageStyles = ref<string[]>([])
const forbiddenTopics = ref<string[]>([])
const newForbiddenTopic = ref('')
const isGeneratingBackstory = ref(false)
const isGeneratingFirstMessage = ref(false)
const isGeneratingConversation = ref(false)

// Data
const languageStyles: LanguageStyle[] = [
  {
    id: 'formal',
    name: '正式文雅',
    description: '使用敬语和正式用词',
    icon: 'crown'
  },
  {
    id: 'casual',
    name: '轻松随意',
    description: '日常对话，亲切自然',
    icon: 'smile'
  },
  {
    id: 'playful',
    name: '俏皮活泼',
    description: '幽默风趣，充满活力',
    icon: 'zap'
  },
  {
    id: 'mysterious',
    name: '神秘深沉',
    description: '话中有话，留有悬念',
    icon: 'eye'
  },
  {
    id: 'childlike',
    name: '天真可爱',
    description: '纯真无邪，语言简单',
    icon: 'heart'
  },
  {
    id: 'intellectual',
    name: '学者风范',
    description: '用词精准，逻辑清晰',
    icon: 'book'
  }
]

const commonForbiddenTopics = [
  '政治话题', '暴力内容', '成人内容', '恶意攻击', '个人隐私', '非法活动'
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
const updateMessage = (index: number, content: string) => {
  const messages = [...modelValue.value.sampleConversation]
  messages[index] = { ...messages[index], content }

  modelValue.value = {
    ...modelValue.value,
    sampleConversation: messages
  }
}

const addMessage = (role: 'user' | 'assistant') => {
  modelValue.value = {
    ...modelValue.value,
    sampleConversation: [
      ...modelValue.value.sampleConversation,
      { role, content: '' }
    ]
  }
}

const removeMessage = (index: number) => {
  const messages = [...modelValue.value.sampleConversation]
  messages.splice(index, 1)

  modelValue.value = {
    ...modelValue.value,
    sampleConversation: messages
  }
}

const toggleLanguageStyle = (styleId: string) => {
  if (selectedLanguageStyles.value.includes(styleId)) {
    selectedLanguageStyles.value = selectedLanguageStyles.value.filter(id => id !== styleId)
  } else {
    selectedLanguageStyles.value = [...selectedLanguageStyles.value, styleId]
  }
}

const addForbiddenTopic = (topic?: string) => {
  const topicToAdd = topic || newForbiddenTopic.value.trim()

  if (topicToAdd && !forbiddenTopics.value.includes(topicToAdd)) {
    forbiddenTopics.value = [...forbiddenTopics.value, topicToAdd]

    if (!topic) {
      newForbiddenTopic.value = ''
    }
  }
}

const removeForbiddenTopic = (topic: string) => {
  forbiddenTopics.value = forbiddenTopics.value.filter(t => t !== topic)
}

const generateBackstory = async () => {
  isGeneratingBackstory.value = true
  try {
    // TODO: 集成AI背景生成服务
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 模拟生成结果
    const sampleBackstory = `${modelValue.value.name}出生在一个普通的家庭，从小就表现出${modelValue.value.shortDescription}的特质。在成长过程中，经历了许多有趣的事情，塑造了独特的性格和世界观。`

    modelValue.value = {
      ...modelValue.value,
      background: sampleBackstory
    }
  } catch (error) {
    console.error('Backstory generation failed:', error)
  } finally {
    isGeneratingBackstory.value = false
  }
}

const generateFirstMessage = async () => {
  isGeneratingFirstMessage.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const sampleFirstMessage = `你好！我是${modelValue.value.name}，很高兴认识你！有什么我可以帮助你的吗？`

    modelValue.value = {
      ...modelValue.value,
      firstMessage: sampleFirstMessage
    }
  } catch (error) {
    console.error('First message generation failed:', error)
  } finally {
    isGeneratingFirstMessage.value = false
  }
}

const generateConversation = async () => {
  isGeneratingConversation.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2500))

    const sampleConversation: ConversationMessage[] = [
      { role: 'user', content: '你好，很高兴认识你！' },
      { role: 'assistant', content: modelValue.value.firstMessage },
      { role: 'user', content: '你能告诉我一些关于你自己的事情吗？' },
      { role: 'assistant', content: `当然可以！${modelValue.value.shortDescription}。我很乐意和你聊天，有什么想了解的吗？` }
    ]

    modelValue.value = {
      ...modelValue.value,
      sampleConversation
    }
  } catch (error) {
    console.error('Conversation generation failed:', error)
  } finally {
    isGeneratingConversation.value = false
  }
}

// Watch for validation
watch(
  () => [modelValue.value.background, modelValue.value.firstMessage],
  () => {
    const errors: Record<string, string> = {}

    if (!modelValue.value.firstMessage.trim()) {
      errors.firstMessage = '开场白不能为空'
    } else if (modelValue.value.firstMessage.length > 200) {
      errors.firstMessage = '开场白不能超过200个字符'
    }

    if (modelValue.value.background && modelValue.value.background.length < 50) {
      errors.background = '背景故事建议至少50个字符'
    }

    emit('validate', 'backstory', errors)
  },
  { deep: true }
)
</script>

<style lang="scss">
.backstory-step {
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

    .sample-conversation-section {
      .conversation-messages {
        display: grid;
        gap: var(--space-4);
        margin-bottom: var(--space-4);

        .message-item {
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: var(--space-px) solid var(--border-secondary);

          &.message-user {
            border-left: var(--space-1) solid var(--brand-primary-500);
          }

          &.message-assistant {
            border-left: var(--space-1) solid var(--brand-secondary-500);
          }

          .message-role {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-2) var(--space-4);
            background: var(--surface-3);
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
            color: var(--text-secondary);
          }

          .message-content {
            position: relative;
            padding: var(--space-3);

            .remove-message {
              position: absolute;
              top: var(--space-2);
              right: var(--space-2);
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
      }

      .add-message-actions {
        display: flex;
        gap: var(--space-3);

        @media (max-width: 640px) {
          flex-direction: column;
        }
      }
    }

    .language-style-section {
      .style-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-3);

        .style-option {
          display: flex;
          gap: var(--space-3);
          padding: var(--space-3);
          align-items: flex-start;

          .style-info {
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

    .forbidden-topics-section {
      .forbidden-topics {
        .selected-topics {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
          min-height: var(--space-8);
        }

        .add-topic {
          display: flex;
          gap: var(--space-2);
          align-items: flex-end;
          margin-bottom: var(--space-4);
        }
      }

      .common-topics {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        align-items: center;

        .topics-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin-right: var(--space-2);
        }
      }
    }

    .ai-backstory-section {
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
          flex-wrap: wrap;
        }

        .backstory-tips {
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