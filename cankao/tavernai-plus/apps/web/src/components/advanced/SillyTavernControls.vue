<template>
  <div class="sillytavern-controls">
    <div class="controls-header">
      <h4>高级控制</h4>
      <el-button
        type="text"
        size="small"
        @click="collapsed = !collapsed"
        :icon="collapsed ? 'ArrowDown' : 'ArrowUp'"
      />
    </div>

    <div v-if="!collapsed" class="controls-content">
      <!-- 角色一致性控制 -->
      <div class="control-group">
        <label>角色一致性</label>
        <el-slider
          v-model="controls.characterConsistency"
          :min="0"
          :max="1"
          :step="0.1"
          :show-tooltip="true"
          size="small"
        />
        <span class="control-value">{{ controls.characterConsistency }}</span>
      </div>

      <!-- 情绪表达强度 -->
      <div class="control-group">
        <label>情绪表达</label>
        <el-slider
          v-model="controls.emotionalIntensity"
          :min="0"
          :max="2"
          :step="0.1"
          :show-tooltip="true"
          size="small"
        />
        <span class="control-value">{{ controls.emotionalIntensity }}</span>
      </div>

      <!-- 创造性 vs 逻辑性 -->
      <div class="control-group">
        <label>创造性/逻辑性</label>
        <el-slider
          v-model="controls.creativityLogic"
          :min="0"
          :max="1"
          :step="0.1"
          :show-tooltip="true"
          :format-tooltip="formatCreativityTooltip"
          size="small"
        />
        <span class="control-value">{{ formatCreativityValue(controls.creativityLogic) }}</span>
      </div>

      <!-- 回复长度倾向 -->
      <div class="control-group">
        <label>回复长度</label>
        <el-select v-model="controls.responseLength" size="small">
          <el-option label="简短" value="short" />
          <el-option label="中等" value="medium" />
          <el-option label="详细" value="long" />
          <el-option label="非常详细" value="very-long" />
        </el-select>
      </div>

      <!-- 对话风格 -->
      <div class="control-group">
        <label>对话风格</label>
        <el-select v-model="controls.conversationStyle" size="small">
          <el-option label="随意聊天" value="casual" />
          <el-option label="深度交流" value="deep" />
          <el-option label="角色扮演" value="roleplay" />
          <el-option label="学术讨论" value="academic" />
          <el-option label="娱乐互动" value="entertainment" />
        </el-select>
      </div>

      <!-- 上下文记忆长度 -->
      <div class="control-group">
        <label>记忆长度</label>
        <el-slider
          v-model="controls.memoryLength"
          :min="5"
          :max="50"
          :step="5"
          :show-tooltip="true"
          size="small"
        />
        <span class="control-value">{{ controls.memoryLength }} 条</span>
      </div>

      <!-- 高级开关 -->
      <div class="control-group">
        <el-checkbox v-model="controls.enableWorldInfo">启用世界信息</el-checkbox>
      </div>

      <div class="control-group">
        <el-checkbox v-model="controls.enableAuthorNote">启用作者注释</el-checkbox>
      </div>

      <div class="control-group">
        <el-checkbox v-model="controls.enablePersonality">强化角色个性</el-checkbox>
      </div>

      <!-- 预设管理 -->
      <div class="preset-controls">
        <el-button-group size="small">
          <el-button @click="savePreset">保存预设</el-button>
          <el-button @click="loadPreset">加载预设</el-button>
          <el-button @click="resetToDefault">重置默认</el-button>
        </el-button-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface SillyTavernControls {
  characterConsistency: number
  emotionalIntensity: number
  creativityLogic: number
  responseLength: 'short' | 'medium' | 'long' | 'very-long'
  conversationStyle: 'casual' | 'deep' | 'roleplay' | 'academic' | 'entertainment'
  memoryLength: number
  enableWorldInfo: boolean
  enableAuthorNote: boolean
  enablePersonality: boolean
}

const emit = defineEmits<{
  'update:controls': [controls: SillyTavernControls]
}>()

const collapsed = ref(false)

const controls = reactive<SillyTavernControls>({
  characterConsistency: 0.8,
  emotionalIntensity: 1.0,
  creativityLogic: 0.6,
  responseLength: 'medium',
  conversationStyle: 'casual',
  memoryLength: 20,
  enableWorldInfo: true,
  enableAuthorNote: false,
  enablePersonality: true
})

const formatCreativityTooltip = (value: number) => {
  if (value < 0.3) return '逻辑性强'
  if (value < 0.7) return '平衡'
  return '创造性强'
}

const formatCreativityValue = (value: number) => {
  if (value < 0.3) return '逻辑'
  if (value < 0.7) return '平衡'
  return '创造'
}

const savePreset = () => {
  const preset = { ...controls }
  localStorage.setItem('sillytavern-preset', JSON.stringify(preset))
  ElMessage.success('预设已保存')
}

const loadPreset = () => {
  const saved = localStorage.getItem('sillytavern-preset')
  if (saved) {
    Object.assign(controls, JSON.parse(saved))
    ElMessage.success('预设已加载')
  } else {
    ElMessage.info('未找到保存的预设')
  }
}

const resetToDefault = () => {
  Object.assign(controls, {
    characterConsistency: 0.8,
    emotionalIntensity: 1.0,
    creativityLogic: 0.6,
    responseLength: 'medium',
    conversationStyle: 'casual',
    memoryLength: 20,
    enableWorldInfo: true,
    enableAuthorNote: false,
    enablePersonality: true
  })
  ElMessage.success('已重置为默认设置')
}

// 监听控制变化，通知父组件
watch(controls, (newControls) => {
  emit('update:controls', { ...newControls })
}, { deep: true })
</script>

<style lang="scss" scoped>
.sillytavern-controls {
  background: rgba(30, 30, 40, 0.6);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;

  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      font-size: 14px;
      color: #e5e7eb;
      font-weight: 600;
    }
  }

  .controls-content {
    .control-group {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      label {
        font-size: 12px;
        color: #9ca3af;
        font-weight: 500;
      }

      .control-value {
        font-size: 11px;
        color: #6b7280;
        text-align: right;
      }

      .el-select {
        width: 100%;
      }

      .el-checkbox {
        color: #d1d5db;
        font-size: 12px;
      }
    }

    .preset-controls {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(139, 92, 246, 0.2);

      .el-button-group {
        width: 100%;

        .el-button {
          flex: 1;
          font-size: 11px;
        }
      }
    }
  }
}

// 滑块样式定制
:deep(.el-slider__runway) {
  background: rgba(75, 85, 99, 0.6);
}

:deep(.el-slider__bar) {
  background: linear-gradient(90deg, #8b5cf6, #c084fc);
}

:deep(.el-slider__button) {
  border: 2px solid #8b5cf6;
  background: #1f2937;
}
</style>
