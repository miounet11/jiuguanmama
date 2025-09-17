<template>
  <div class="guidance-panel">
    <!-- 快速指导按钮 -->
    <div class="quick-guidance">
      <h4>快速指导</h4>
      <div class="guidance-buttons">
        <button
          v-for="option in quickOptions"
          :key="option.type"
          @click="applyQuickGuidance(option)"
          class="quick-btn"
          :class="option.class"
        >
          <i :class="option.icon"></i>
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- 高级指导选项 -->
    <div class="advanced-guidance" v-if="showAdvanced">
      <h4>高级指导</h4>

      <!-- 语气选择 -->
      <div class="guidance-section">
        <label>语气风格</label>
        <select v-model="guidanceOptions.tone">
          <option value="">默认</option>
          <option value="friendly">友好温暖</option>
          <option value="formal">正式严谨</option>
          <option value="casual">轻松随意</option>
          <option value="romantic">浪漫深情</option>
          <option value="dramatic">戏剧张力</option>
        </select>
      </div>

      <!-- 方向指导 -->
      <div class="guidance-section">
        <label>剧情方向</label>
        <input
          v-model="guidanceOptions.direction"
          type="text"
          placeholder="例如：向浪漫发展、增加悬疑..."
        />
      </div>

      <!-- 关键词 -->
      <div class="guidance-section">
        <label>必须包含的关键词</label>
        <div class="tag-input">
          <input
            v-model="keywordInput"
            @keydown.enter="addKeyword"
            type="text"
            placeholder="输入后按回车添加"
          />
          <div class="tags">
            <span
              v-for="(keyword, index) in guidanceOptions.keywords"
              :key="index"
              class="tag"
            >
              {{ keyword }}
              <i @click="removeKeyword(index)" class="remove">×</i>
            </span>
          </div>
        </div>
      </div>

      <!-- 避免词汇 -->
      <div class="guidance-section">
        <label>避免使用的词汇</label>
        <div class="tag-input">
          <input
            v-model="avoidInput"
            @keydown.enter="addAvoidWord"
            type="text"
            placeholder="输入后按回车添加"
          />
          <div class="tags">
            <span
              v-for="(word, index) in guidanceOptions.avoidWords"
              :key="index"
              class="tag avoid"
            >
              {{ word }}
              <i @click="removeAvoidWord(index)" class="remove">×</i>
            </span>
          </div>
        </div>
      </div>

      <!-- 长度控制 -->
      <div class="guidance-section">
        <label>回复长度</label>
        <div class="radio-group">
          <label>
            <input type="radio" v-model="guidanceOptions.length" value="short">
            简短（50-100字）
          </label>
          <label>
            <input type="radio" v-model="guidanceOptions.length" value="medium">
            适中（150-300字）
          </label>
          <label>
            <input type="radio" v-model="guidanceOptions.length" value="long">
            详细（400-800字）
          </label>
        </div>
      </div>

      <!-- 自定义指令 -->
      <div class="guidance-section">
        <label>自定义指令</label>
        <textarea
          v-model="guidanceOptions.instruction"
          placeholder="输入具体的指导要求..."
          rows="3"
        ></textarea>
      </div>

      <!-- 应用按钮 -->
      <div class="guidance-actions">
        <button @click="applyGuidance" class="btn-primary">
          <i class="fas fa-magic"></i> 应用指导
        </button>
        <button @click="resetGuidance" class="btn-secondary">
          <i class="fas fa-undo"></i> 重置
        </button>
      </div>
    </div>

    <!-- 模板选择 -->
    <div class="guidance-templates" v-if="showTemplates">
      <h4>情景模板</h4>
      <div class="template-grid">
        <div
          v-for="(template, key) in templates"
          :key="key"
          @click="applyTemplate(template)"
          class="template-card"
        >
          <i :class="template.icon"></i>
          <span>{{ template.name }}</span>
        </div>
      </div>
    </div>

    <!-- 智能建议 -->
    <div class="guidance-suggestions" v-if="suggestions.length > 0">
      <h4>智能建议</h4>
      <div class="suggestion-list">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="applySuggestion(suggestion)"
          class="suggestion-item"
        >
          <i class="fas fa-lightbulb"></i>
          {{ suggestion }}
        </div>
      </div>
    </div>

    <!-- 展开/收起按钮 -->
    <div class="panel-toggles">
      <button @click="showAdvanced = !showAdvanced" class="toggle-btn">
        <i :class="showAdvanced ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        {{ showAdvanced ? '收起' : '高级选项' }}
      </button>
      <button @click="showTemplates = !showTemplates" class="toggle-btn">
        <i class="fas fa-palette"></i>
        模板
      </button>
      <button @click="loadSuggestions" class="toggle-btn">
        <i class="fas fa-brain"></i>
        建议
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '@/services/api'

const route = useRoute()
const sessionId = computed(() => route.params.sessionId as string)

// 界面状态
const showAdvanced = ref(false)
const showTemplates = ref(false)
const suggestions = ref<string[]>([])

// 指导选项
const guidanceOptions = reactive({
  type: 'custom' as 'continue' | 'rewrite' | 'expand' | 'shorten' | 'custom',
  tone: '',
  direction: '',
  keywords: [] as string[],
  avoidWords: [] as string[],
  length: 'medium' as 'short' | 'medium' | 'long',
  instruction: ''
})

// 输入状态
const keywordInput = ref('')
const avoidInput = ref('')

// 快速选项
const quickOptions = [
  {
    type: 'continue',
    label: '继续',
    icon: 'fas fa-play',
    class: 'btn-continue'
  },
  {
    type: 'rewrite',
    label: '重写',
    icon: 'fas fa-redo',
    class: 'btn-rewrite'
  },
  {
    type: 'expand',
    label: '扩展',
    icon: 'fas fa-expand-alt',
    class: 'btn-expand'
  },
  {
    type: 'shorten',
    label: '精简',
    icon: 'fas fa-compress-alt',
    class: 'btn-shorten'
  }
]

// 模板
const templates = {
  romantic: {
    name: '浪漫',
    icon: 'fas fa-heart',
    tone: 'romantic',
    keywords: ['爱', '心动', '温柔'],
    direction: '增加浪漫氛围'
  },
  adventure: {
    name: '冒险',
    icon: 'fas fa-compass',
    tone: 'dramatic',
    keywords: ['冒险', '挑战', '勇气'],
    direction: '推动冒险剧情'
  },
  mystery: {
    name: '悬疑',
    icon: 'fas fa-mask',
    tone: 'formal',
    keywords: ['线索', '谜题', '真相'],
    direction: '深化悬疑氛围'
  },
  comedy: {
    name: '喜剧',
    icon: 'fas fa-laugh',
    tone: 'casual',
    keywords: ['搞笑', '幽默', '轻松'],
    direction: '增加喜剧效果'
  }
}

// 应用快速指导
const applyQuickGuidance = async (option: any) => {
  try {
    const response = await api.post('/api/ai/guidance/apply', {
      sessionId: sessionId.value,
      guidance: {
        type: option.type
      }
    })

    if (response.data.success) {
      ElMessage.success(`已应用${option.label}指导`)
      emit('guidanceApplied', response.data.guidancePrompt)
    }
  } catch (error) {
    ElMessage.error('应用指导失败')
  }
}

// 应用高级指导
const applyGuidance = async () => {
  try {
    const response = await api.post('/api/ai/guidance/apply', {
      sessionId: sessionId.value,
      guidance: guidanceOptions
    })

    if (response.data.success) {
      ElMessage.success('指导已应用')
      emit('guidanceApplied', response.data.guidancePrompt)
      showAdvanced.value = false
    }
  } catch (error) {
    ElMessage.error('应用指导失败')
  }
}

// 应用模板
const applyTemplate = (template: any) => {
  guidanceOptions.tone = template.tone
  guidanceOptions.direction = template.direction
  guidanceOptions.keywords = [...template.keywords]
  showAdvanced.value = true
  ElMessage.success(`已加载${template.name}模板`)
}

// 加载智能建议
const loadSuggestions = async () => {
  try {
    const response = await api.get(`/api/ai/guidance/suggestions/${sessionId.value}`)
    suggestions.value = response.data.suggestions
  } catch (error) {
    ElMessage.error('加载建议失败')
  }
}

// 应用建议
const applySuggestion = (suggestion: string) => {
  guidanceOptions.instruction = suggestion
  showAdvanced.value = true
}

// 关键词管理
const addKeyword = () => {
  if (keywordInput.value.trim()) {
    guidanceOptions.keywords.push(keywordInput.value.trim())
    keywordInput.value = ''
  }
}

const removeKeyword = (index: number) => {
  guidanceOptions.keywords.splice(index, 1)
}

const addAvoidWord = () => {
  if (avoidInput.value.trim()) {
    guidanceOptions.avoidWords.push(avoidInput.value.trim())
    avoidInput.value = ''
  }
}

const removeAvoidWord = (index: number) => {
  guidanceOptions.avoidWords.splice(index, 1)
}

// 重置指导
const resetGuidance = () => {
  guidanceOptions.type = 'custom'
  guidanceOptions.tone = ''
  guidanceOptions.direction = ''
  guidanceOptions.keywords = []
  guidanceOptions.avoidWords = []
  guidanceOptions.length = 'medium'
  guidanceOptions.instruction = ''
}

// 事件
const emit = defineEmits<{
  guidanceApplied: [prompt: any]
}>()
</script>

<style scoped lang="scss">
.guidance-panel {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h4 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 14px;
    font-weight: 600;
  }

  .quick-guidance {
    .guidance-buttons {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .quick-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 12px;

        i {
          margin-right: 4px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        &.btn-continue {
          &:hover {
            background: #4caf50;
            color: white;
            border-color: #4caf50;
          }
        }

        &.btn-rewrite {
          &:hover {
            background: #2196f3;
            color: white;
            border-color: #2196f3;
          }
        }

        &.btn-expand {
          &:hover {
            background: #ff9800;
            color: white;
            border-color: #ff9800;
          }
        }

        &.btn-shorten {
          &:hover {
            background: #9c27b0;
            color: white;
            border-color: #9c27b0;
          }
        }
      }
    }
  }

  .advanced-guidance {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;

    .guidance-section {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 6px;
        color: #666;
        font-size: 13px;
        font-weight: 500;
      }

      input, select, textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        font-size: 14px;

        &:focus {
          outline: none;
          border-color: #6366f1;
        }
      }

      .tag-input {
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;

          .tag {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            background: #f0f0f0;
            border-radius: 4px;
            font-size: 12px;

            &.avoid {
              background: #ffebee;
              color: #c62828;
            }

            .remove {
              margin-left: 4px;
              cursor: pointer;
              font-style: normal;
              color: #999;

              &:hover {
                color: #333;
              }
            }
          }
        }
      }

      .radio-group {
        display: flex;
        gap: 16px;

        label {
          display: flex;
          align-items: center;
          font-size: 13px;
          font-weight: normal;

          input {
            width: auto;
            margin-right: 6px;
          }
        }
      }
    }

    .guidance-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;

      button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;

        &.btn-primary {
          background: #6366f1;
          color: white;

          &:hover {
            background: #5558e3;
          }
        }

        &.btn-secondary {
          background: #f0f0f0;
          color: #666;

          &:hover {
            background: #e0e0e0;
          }
        }
      }
    }
  }

  .guidance-templates {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;

    .template-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .template-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        background: #f8f8f8;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;

        i {
          font-size: 20px;
          margin-bottom: 4px;
          color: #6366f1;
        }

        span {
          font-size: 12px;
          color: #666;
        }

        &:hover {
          background: #6366f1;
          color: white;

          i, span {
            color: white;
          }
        }
      }
    }
  }

  .guidance-suggestions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;

    .suggestion-list {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .suggestion-item {
        padding: 8px 12px;
        background: #f0f9ff;
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 13px;
        color: #1e40af;

        i {
          margin-right: 8px;
          color: #fbbf24;
        }

        &:hover {
          background: #dbeafe;
          transform: translateX(4px);
        }
      }
    }
  }

  .panel-toggles {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;

    .toggle-btn {
      flex: 1;
      padding: 6px;
      background: #f8f8f8;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      color: #666;
      transition: all 0.3s;

      i {
        margin-right: 4px;
      }

      &:hover {
        background: #e0e0e0;
        color: #333;
      }
    }
  }
}
</style>
