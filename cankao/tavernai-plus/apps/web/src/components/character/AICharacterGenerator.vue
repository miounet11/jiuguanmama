<template>
  <el-dialog
    v-model="dialogVisible"
    title="AI角色生成器"
    :width="isMobile ? '95%' : '600px'"
    @close="handleClose"
  >
    <div class="ai-generator">
      <div v-if="!generating && !result" class="generator-form">
        <div class="form-item">
          <label>角色名称</label>
          <el-input v-model="characterName" placeholder="输入角色名称" readonly />
        </div>

        <div class="form-item">
          <label>基础描述</label>
          <el-input
            v-model="baseDescription"
            type="textarea"
            :rows="3"
            placeholder="基础的角色描述"
          />
        </div>

        <div class="form-item">
          <label>生成内容</label>
          <el-checkbox-group v-model="generateTypes">
            <el-checkbox label="personality">性格特征</el-checkbox>
            <el-checkbox label="backstory">背景故事</el-checkbox>
            <el-checkbox label="speakingStyle">说话风格</el-checkbox>
            <el-checkbox label="firstMessage">首条消息</el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="form-item">
          <label>角色风格</label>
          <el-select v-model="characterStyle" placeholder="选择角色风格">
            <el-option label="动漫风格" value="anime" />
            <el-option label="现实风格" value="realistic" />
            <el-option label="奇幻风格" value="fantasy" />
            <el-option label="科幻风格" value="scifi" />
            <el-option label="历史风格" value="historical" />
          </el-select>
        </div>

        <div class="form-item">
          <label>性格倾向</label>
          <el-select v-model="personalityType" placeholder="选择性格倾向">
            <el-option label="开朗活泼" value="cheerful" />
            <el-option label="温柔体贴" value="gentle" />
            <el-option label="冷静理性" value="rational" />
            <el-option label="神秘深沉" value="mysterious" />
            <el-option label="幽默风趣" value="humorous" />
            <el-option label="随机生成" value="random" />
          </el-select>
        </div>
      </div>

      <div v-if="generating" class="generating-status">
        <div class="loading-animation">
          <el-icon class="rotating"><Loading /></el-icon>
        </div>
        <h3>AI正在创造你的角色...</h3>
        <p>{{ generatingStep }}</p>
        <el-progress :percentage="generatingProgress" />
      </div>

      <div v-if="result" class="generation-result">
        <h3>生成完成</h3>
        <div class="result-content">
          <div v-if="result.personality" class="result-item">
            <h4>性格特征</h4>
            <p>{{ result.personality }}</p>
          </div>

          <div v-if="result.backstory" class="result-item">
            <h4>背景故事</h4>
            <p>{{ result.backstory }}</p>
          </div>

          <div v-if="result.speakingStyle" class="result-item">
            <h4>说话风格</h4>
            <p>{{ result.speakingStyle }}</p>
          </div>

          <div v-if="result.firstMessage" class="result-item">
            <h4>首条消息</h4>
            <p class="first-message">{{ result.firstMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="result" @click="regenerate">重新生成</el-button>
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="!generating && !result"
          type="primary"
          @click="startGeneration"
          :disabled="!canGenerate"
        >
          开始生成
        </el-button>
        <el-button
          v-if="result"
          type="primary"
          @click="applyResult"
        >
          应用到角色
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { api } from '@/services/api'

interface Props {
  modelValue: boolean
  characterName: string
  initialDescription?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'generated', result: any): void
}

const props = withDefaults(defineProps<Props>(), {
  initialDescription: ''
})

const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const baseDescription = ref('')
const characterStyle = ref('anime')
const personalityType = ref('random')
const generateTypes = ref(['personality', 'backstory', 'speakingStyle', 'firstMessage'])
const generating = ref(false)
const generatingStep = ref('')
const generatingProgress = ref(0)
const result = ref<any>(null)

const isMobile = computed(() => window.innerWidth <= 768)

const canGenerate = computed(() => {
  return props.characterName && generateTypes.value.length > 0
})

// 监听props变化
watch(() => props.initialDescription, (newDesc) => {
  baseDescription.value = newDesc
}, { immediate: true })

// 方法
const handleClose = () => {
  emit('update:modelValue', false)
  resetGenerator()
}

const resetGenerator = () => {
  generating.value = false
  generatingStep.value = ''
  generatingProgress.value = 0
  result.value = null
}

const startGeneration = async () => {
  try {
    generating.value = true
    generatingProgress.value = 0

    const steps = [
      '分析角色基础信息...',
      '构建角色世界观...',
      '生成性格特征...',
      '创作背景故事...',
      '设定说话风格...',
      '编写首条消息...',
      '完善角色细节...'
    ]

    // 模拟生成过程
    for (let i = 0; i < steps.length; i++) {
      generatingStep.value = steps[i]
      generatingProgress.value = ((i + 1) / steps.length) * 100
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // 调用AI生成API
    const response = await api.post('/api/ai/generate-character', {
      name: props.characterName,
      description: baseDescription.value,
      style: characterStyle.value,
      personalityType: personalityType.value,
      generateTypes: generateTypes.value
    })

    if (response.data.success) {
      result.value = response.data.character
      ElMessage.success('角色生成成功')
    } else {
      throw new Error(response.data.message || '生成失败')
    }
  } catch (error: any) {
    console.error('AI生成失败:', error)
    ElMessage.error('生成失败: ' + (error.response?.data?.message || error.message))

    // 生成模拟数据作为fallback
    result.value = generateMockData()
    ElMessage.info('使用模拟数据代替AI生成')
  } finally {
    generating.value = false
  }
}

const generateMockData = () => {
  const mockData: any = {}

  if (generateTypes.value.includes('personality')) {
    mockData.personality = '开朗活泼，充满好奇心，喜欢与人交流，有着温暖的笑容和积极的人生态度。'
  }

  if (generateTypes.value.includes('backstory')) {
    mockData.backstory = `${props.characterName}来自一个充满魅力的世界，拥有独特的成长经历。从小就展现出与众不同的特质，经历了许多有趣的冒险和挑战，塑造了今天的性格和价值观。`
  }

  if (generateTypes.value.includes('speakingStyle')) {
    mockData.speakingStyle = '语言轻松自然，偶尔会使用一些有趣的比喻，说话时带着微笑，让人感到亲切和温暖。'
  }

  if (generateTypes.value.includes('firstMessage')) {
    mockData.firstMessage = `你好！我是${props.characterName}，很高兴认识你！你今天过得怎么样呢？有什么有趣的事情想分享吗？`
  }

  return mockData
}

const regenerate = () => {
  result.value = null
  startGeneration()
}

const applyResult = () => {
  emit('generated', result.value)
  handleClose()
}
</script>

<style lang="scss" scoped>
.ai-generator {
  .generator-form {
    .form-item {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #e5e7eb;
      }

      .el-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .el-checkbox {
          color: #d1d5db;
        }
      }
    }
  }

  .generating-status {
    text-align: center;
    padding: 40px 20px;

    .loading-animation {
      margin-bottom: 20px;

      .rotating {
        font-size: 32px;
        color: #8b5cf6;
        animation: rotate 2s linear infinite;
      }
    }

    h3 {
      margin-bottom: 10px;
      color: #e5e7eb;
    }

    p {
      margin-bottom: 20px;
      color: #9ca3af;
    }
  }

  .generation-result {
    .result-content {
      .result-item {
        margin-bottom: 20px;
        padding: 16px;
        background: rgba(30, 30, 40, 0.4);
        border-radius: 8px;
        border-left: 4px solid #8b5cf6;

        h4 {
          margin: 0 0 8px;
          color: #c084fc;
          font-size: 14px;
          font-weight: 600;
        }

        p {
          margin: 0;
          color: #d1d5db;
          line-height: 1.6;

          &.first-message {
            font-style: italic;
            background: rgba(139, 92, 246, 0.1);
            padding: 12px;
            border-radius: 6px;
            border: 1px solid rgba(139, 92, 246, 0.2);
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 深色主题样式
:deep(.el-input__inner) {
  background: rgba(30, 30, 40, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: #e5e7eb;
}

:deep(.el-textarea__inner) {
  background: rgba(30, 30, 40, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: #e5e7eb;
}

:deep(.el-select .el-input__inner) {
  background: rgba(30, 30, 40, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: #e5e7eb;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

:deep(.el-progress-bar__outer) {
  background: rgba(75, 85, 99, 0.6);
}

:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #8b5cf6, #c084fc);
}
</style>
