<template>
  <div class="preview-step">
    <div class="preview-content">
      <!-- 角色信息总览 -->
      <div class="character-overview">
        <TavernCard variant="outlined" size="lg">
          <template #header>
            <div class="overview-header">
              <TavernIcon name="user" />
              <span>角色信息总览</span>
            </div>
          </template>

          <div class="overview-grid">
            <!-- 基础信息 -->
            <div class="info-section">
              <h4>基础信息</h4>
              <div class="info-items">
                <div class="info-item">
                  <span class="label">角色名称：</span>
                  <span class="value">{{ modelValue.name || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">分类：</span>
                  <span class="value">{{ getCategoryName(modelValue.category) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">描述：</span>
                  <span class="value">{{ modelValue.shortDescription || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">标签：</span>
                  <div class="tags-value">
                    <TavernBadge
                      v-for="tag in modelValue.tags"
                      :key="tag"
                      variant="secondary"
                      size="sm"
                    >
                      {{ tag }}
                    </TavernBadge>
                    <span v-if="modelValue.tags.length === 0" class="empty-value">未设置</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 外观信息 -->
            <div class="info-section">
              <h4>外观设定</h4>
              <div class="info-items">
                <div class="info-item">
                  <span class="label">外貌描述：</span>
                  <span class="value long-text">
                    {{ modelValue.appearance?.physicalDescription || '未设置' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">服装打扮：</span>
                  <span class="value long-text">
                    {{ modelValue.appearance?.outfit || '未设置' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">表情预设：</span>
                  <div class="tags-value">
                    <TavernBadge
                      v-for="expression in modelValue.appearance?.expressions"
                      :key="expression"
                      variant="info"
                      size="sm"
                    >
                      {{ expression }}
                    </TavernBadge>
                    <span v-if="!modelValue.appearance?.expressions?.length" class="empty-value">未设置</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 性格信息 -->
            <div class="info-section">
              <h4>性格设置</h4>
              <div class="info-items">
                <div class="info-item">
                  <span class="label">性格特征：</span>
                  <div class="tags-value">
                    <TavernBadge
                      v-for="trait in modelValue.personality"
                      :key="trait"
                      variant="primary"
                      size="sm"
                    >
                      {{ trait }}
                    </TavernBadge>
                    <span v-if="modelValue.personality.length === 0" class="empty-value">未设置</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="label">性格量表：</span>
                  <div class="traits-chart">
                    <div
                      v-for="(value, key) in modelValue.traits"
                      :key="key"
                      class="trait-bar"
                    >
                      <span class="trait-name">{{ getTraitName(key) }}</span>
                      <div class="trait-progress">
                        <div
                          class="trait-fill"
                          :style="{ width: value + '%' }"
                        ></div>
                        <span class="trait-percentage">{{ value }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 背景信息 -->
            <div class="info-section">
              <h4>背景故事</h4>
              <div class="info-items">
                <div class="info-item">
                  <span class="label">背景故事：</span>
                  <span class="value long-text">{{ modelValue.background || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">对话场景：</span>
                  <span class="value long-text">{{ modelValue.scenario || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">开场白：</span>
                  <span class="value long-text">{{ modelValue.firstMessage || '未设置' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">示例对话：</span>
                  <span class="value">{{ modelValue.sampleConversation?.length || 0 }} 条消息</span>
                </div>
              </div>
            </div>
          </div>
        </TavernCard>
      </div>

      <!-- 对话测试 -->
      <div class="chat-test-section">
        <TavernCard variant="filled" size="lg">
          <template #header>
            <div class="test-header">
              <TavernIcon name="messages" />
              <span>对话测试</span>
            </div>
          </template>

          <div class="chat-test-content">
            <p>在发布前，你可以测试与角色的对话效果</p>

            <div class="chat-messages" ref="chatContainer">
              <div
                v-for="(message, index) in testMessages"
                :key="`test-message-${index}`"
                class="test-message"
                :class="`message-${message.role}`"
              >
                <div v-if="message.role === 'assistant'" class="message-avatar">
                  <img
                    v-if="modelValue.avatar"
                    :src="modelValue.avatar"
                    :alt="modelValue.name"
                  />
                  <TavernIcon v-else name="robot" />
                </div>

                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>

              <div v-if="isResponding" class="test-message message-assistant">
                <div class="message-avatar">
                  <TavernIcon name="robot" />
                </div>
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <TavernInput
                v-model="testInput"
                placeholder="输入消息测试角色回复..."
                @keydown.enter="sendTestMessage"
                :disabled="isResponding"
              />
              <TavernButton
                variant="primary"
                @click="sendTestMessage"
                :loading="isResponding"
                :disabled="!testInput.trim()"
              >
                发送
              </TavernButton>
            </div>
          </div>
        </TavernCard>
      </div>

      <!-- 发布设置 -->
      <div class="publish-settings-section">
        <TavernCard variant="outlined" size="lg">
          <template #header>
            <div class="settings-header">
              <TavernIcon name="settings" />
              <span>发布设置</span>
            </div>
          </template>

          <div class="settings-content">
            <div class="setting-item">
              <label class="setting-label">可见性设置</label>
              <div class="visibility-options">
                <TavernCard
                  v-for="option in visibilityOptions"
                  :key="option.value"
                  variant="outlined"
                  size="sm"
                  clickable
                  :selected="modelValue.visibility === option.value"
                  @click="updateVisibility(option.value)"
                >
                  <div class="visibility-option">
                    <TavernIcon :name="option.icon" />
                    <div class="option-info">
                      <h6>{{ option.name }}</h6>
                      <p>{{ option.description }}</p>
                    </div>
                  </div>
                </TavernCard>
              </div>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  v-model="modelValue.isNSFW"
                  class="nsfw-checkbox"
                />
                <span>包含成人内容 (NSFW)</span>
              </label>
              <p class="setting-help">如果角色涉及成人内容，请勾选此选项</p>
            </div>
          </div>
        </TavernCard>
      </div>

      <!-- 完成度检查 -->
      <div class="completion-check">
        <TavernCard
          :variant="completionStatus.variant"
          size="md"
        >
          <div class="completion-content">
            <div class="completion-icon">
              <TavernIcon :name="completionStatus.icon" size="lg" />
            </div>
            <div class="completion-info">
              <h4>{{ completionStatus.title }}</h4>
              <p>{{ completionStatus.message }}</p>
              <ul v-if="missingItems.length > 0" class="missing-items">
                <li v-for="item in missingItems" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </TavernCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'
import TavernInput from '@/components/design-system/TavernInput.vue'

// Types
interface TestMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface VisibilityOption {
  value: 'public' | 'unlisted' | 'private'
  name: string
  description: string
  icon: string
}

// Props & Emits
const props = defineProps<{
  modelValue: any
  validation?: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  validate: [stepId: string, errors: Record<string, string>]
}>()

// State
const testMessages = ref<TestMessage[]>([])
const testInput = ref('')
const isResponding = ref(false)
const chatContainer = ref<HTMLElement>()

// Data
const categories = {
  anime: '动漫角色',
  game: '游戏角色',
  movie: '影视角色',
  book: '文学角色',
  original: '原创角色',
  historical: '历史人物',
  vtuber: 'VTuber',
  assistant: 'AI助手'
}

const traitNames = {
  introversion: '社交倾向',
  empathy: '决策方式',
  creativity: '思维模式',
  humor: '表达风格',
  intelligence: '学习方式'
}

const visibilityOptions: VisibilityOption[] = [
  {
    value: 'public',
    name: '公开',
    description: '所有用户都可以搜索和使用',
    icon: 'globe'
  },
  {
    value: 'unlisted',
    name: '不公开',
    description: '仅通过链接访问，不会出现在搜索中',
    icon: 'link'
  },
  {
    value: 'private',
    name: '私有',
    description: '只有你可以使用',
    icon: 'lock'
  }
]

// Computed
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const missingItems = computed(() => {
  const missing = []

  if (!modelValue.value.name) missing.push('角色名称')
  if (!modelValue.value.shortDescription) missing.push('角色描述')
  if (!modelValue.value.firstMessage) missing.push('开场白')
  if (!modelValue.value.category) missing.push('角色分类')

  return missing
})

const completionStatus = computed(() => {
  if (missingItems.value.length === 0) {
    return {
      variant: 'filled' as const,
      icon: 'check-circle',
      title: '角色信息完整',
      message: '恭喜！你的角色已准备就绪，可以发布了。'
    }
  } else {
    return {
      variant: 'outlined' as const,
      icon: 'warning',
      title: '信息不完整',
      message: '还有一些必填信息需要完善才能发布角色。'
    }
  }
})

// Methods
const getCategoryName = (categoryId: string) => {
  return categories[categoryId as keyof typeof categories] || '未设置'
}

const getTraitName = (traitKey: string) => {
  return traitNames[traitKey as keyof typeof traitNames] || traitKey
}

const updateVisibility = (visibility: 'public' | 'unlisted' | 'private') => {
  modelValue.value = {
    ...modelValue.value,
    visibility
  }
}

const sendTestMessage = async () => {
  if (!testInput.value.trim() || isResponding.value) return

  const userMessage: TestMessage = {
    role: 'user',
    content: testInput.value,
    timestamp: new Date()
  }

  testMessages.value.push(userMessage)
  testInput.value = ''
  isResponding.value = true

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // TODO: 实际调用AI API
    await new Promise(resolve => setTimeout(resolve, 2000))

    const assistantMessage: TestMessage = {
      role: 'assistant',
      content: generateTestResponse(userMessage.content),
      timestamp: new Date()
    }

    testMessages.value.push(assistantMessage)
  } catch (error) {
    console.error('Test message failed:', error)
    const errorMessage: TestMessage = {
      role: 'assistant',
      content: '抱歉，测试消息发送失败，请稍后再试。',
      timestamp: new Date()
    }
    testMessages.value.push(errorMessage)
  } finally {
    isResponding.value = false
    await nextTick()
    scrollToBottom()
  }
}

const generateTestResponse = (userInput: string) => {
  // 简单的测试回复生成
  const responses = [
    `作为${modelValue.value.name}，我理解你的意思。`,
    `这是一个很有趣的话题！${modelValue.value.shortDescription}`,
    `${modelValue.value.firstMessage || '你好！'}`,
    `让我想想...这确实值得讨论。`,
    `根据我的性格特征，我觉得...`
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化对话
if (modelValue.value.firstMessage) {
  testMessages.value = [{
    role: 'assistant',
    content: modelValue.value.firstMessage,
    timestamp: new Date()
  }]
}

// 验证步骤
emit('validate', 'preview', {})
</script>

<style lang="scss">
.preview-step {
  .preview-content {
    display: grid;
    gap: var(--space-8);

    .overview-header,
    .test-header,
    .settings-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .character-overview {
      .overview-grid {
        display: grid;
        gap: var(--space-6);

        .info-section {
          h4 {
            margin: 0 0 var(--space-4) 0;
            font-size: var(--text-lg);
            font-weight: var(--font-semibold);
            color: var(--text-primary);
            border-bottom: var(--space-px) solid var(--border-secondary);
            padding-bottom: var(--space-2);
          }

          .info-items {
            display: grid;
            gap: var(--space-4);

            .info-item {
              display: flex;
              gap: var(--space-3);

              .label {
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
                color: var(--text-secondary);
                min-width: 80px;
                flex-shrink: 0;
              }

              .value {
                font-size: var(--text-sm);
                color: var(--text-primary);
                line-height: var(--leading-relaxed);

                &.long-text {
                  max-width: 400px;
                }
              }

              .empty-value {
                color: var(--text-tertiary);
                font-style: italic;
              }

              .tags-value {
                display: flex;
                flex-wrap: wrap;
                gap: var(--space-1);
                align-items: center;
              }

              .traits-chart {
                flex: 1;
                max-width: 300px;

                .trait-bar {
                  display: flex;
                  align-items: center;
                  gap: var(--space-3);
                  margin-bottom: var(--space-2);

                  .trait-name {
                    font-size: var(--text-xs);
                    color: var(--text-tertiary);
                    min-width: 60px;
                  }

                  .trait-progress {
                    position: relative;
                    flex: 1;
                    height: var(--space-2);
                    background: var(--surface-3);
                    border-radius: var(--radius-full);
                    overflow: hidden;

                    .trait-fill {
                      height: 100%;
                      background: var(--brand-primary-500);
                      transition: width var(--duration-normal) ease;
                    }

                    .trait-percentage {
                      position: absolute;
                      right: var(--space-1);
                      top: 50%;
                      transform: translateY(-50%);
                      font-size: var(--text-2xs);
                      color: var(--text-tertiary);
                      line-height: 1;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    .chat-test-section {
      .chat-test-content {
        p {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
        }

        .chat-messages {
          height: 400px;
          overflow-y: auto;
          padding: var(--space-4);
          background: var(--surface-1);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
          scrollbar-width: thin;
          scrollbar-color: var(--surface-3) transparent;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-thumb {
            background: var(--surface-3);
            border-radius: var(--radius-full);
          }

          .test-message {
            display: flex;
            gap: var(--space-3);
            margin-bottom: var(--space-4);

            &.message-user {
              flex-direction: row-reverse;

              .message-content {
                background: var(--brand-primary-500);
                color: var(--brand-primary-50);
              }
            }

            &.message-assistant {
              .message-content {
                background: var(--surface-3);
                color: var(--text-primary);
              }
            }

            .message-avatar {
              width: var(--space-8);
              height: var(--space-8);
              border-radius: var(--radius-full);
              overflow: hidden;
              background: var(--surface-4);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }

            .message-content {
              max-width: 70%;
              padding: var(--space-3);
              border-radius: var(--radius-md);
              line-height: var(--leading-normal);

              .message-text {
                font-size: var(--text-sm);
              }

              .message-time {
                font-size: var(--text-2xs);
                opacity: 0.7;
                margin-top: var(--space-1);
              }

              .typing-indicator {
                display: flex;
                gap: var(--space-1);

                span {
                  width: var(--space-1);
                  height: var(--space-1);
                  background: var(--text-tertiary);
                  border-radius: var(--radius-full);
                  animation: typing 1.4s infinite ease-in-out;

                  &:nth-child(1) { animation-delay: -0.32s; }
                  &:nth-child(2) { animation-delay: -0.16s; }
                }
              }
            }
          }
        }

        .chat-input {
          display: flex;
          gap: var(--space-3);
        }
      }
    }

    .publish-settings-section {
      .settings-content {
        .setting-item {
          margin-bottom: var(--space-6);

          &:last-child {
            margin-bottom: 0;
          }

          .setting-label {
            display: block;
            font-size: var(--text-sm);
            font-weight: var(--font-medium);
            color: var(--text-secondary);
            margin-bottom: var(--space-3);

            input[type="checkbox"] {
              margin-right: var(--space-2);
            }
          }

          .setting-help {
            margin: var(--space-2) 0 0 0;
            font-size: var(--text-xs);
            color: var(--text-tertiary);
            line-height: var(--leading-relaxed);
          }

          .visibility-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--space-3);

            .visibility-option {
              display: flex;
              gap: var(--space-3);
              padding: var(--space-3);
              align-items: flex-start;

              .option-info {
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
      }
    }

    .completion-check {
      .completion-content {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;

        .completion-icon {
          color: var(--brand-primary-500);
        }

        .completion-info {
          flex: 1;

          h4 {
            margin: 0 0 var(--space-2) 0;
            font-size: var(--text-lg);
            color: var(--text-primary);
          }

          p {
            margin: 0 0 var(--space-3) 0;
            color: var(--text-secondary);
            line-height: var(--leading-relaxed);
          }

          .missing-items {
            margin: 0;
            padding-left: var(--space-5);
            color: var(--text-secondary);

            li {
              margin-bottom: var(--space-1);
              font-size: var(--text-sm);
            }
          }
        }
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}
</style>