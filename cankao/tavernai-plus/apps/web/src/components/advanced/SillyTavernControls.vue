<template>
  <div class="silly-tavern-controls">
    <!-- 高级参数控制面板 -->
    <el-card class="control-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <el-icon><Setting /></el-icon>
          <span>高级生成控制</span>
          <el-button
            type="primary"
            size="small"
            @click="showPresetDialog = true"
          >
            预设管理
          </el-button>
        </div>
      </template>

      <div class="controls-grid">
        <!-- 温度控制 -->
        <div class="control-item">
          <label>温度 (Temperature)</label>
          <el-slider
            v-model="parameters.temperature"
            :min="0"
            :max="2"
            :step="0.01"
            show-input
            :input-size="'small'"
          />
          <span class="help-text">控制回复的随机性和创意程度</span>
        </div>

        <!-- Top-P控制 -->
        <div class="control-item">
          <label>Top-P</label>
          <el-slider
            v-model="parameters.topP"
            :min="0"
            :max="1"
            :step="0.01"
            show-input
            :input-size="'small'"
          />
          <span class="help-text">控制词汇选择的多样性</span>
        </div>

        <!-- 频率惩罚 -->
        <div class="control-item">
          <label>频率惩罚 (Frequency Penalty)</label>
          <el-slider
            v-model="parameters.frequencyPenalty"
            :min="-2"
            :max="2"
            :step="0.01"
            show-input
            :input-size="'small'"
          />
          <span class="help-text">减少重复内容</span>
        </div>

        <!-- 存在惩罚 -->
        <div class="control-item">
          <label>存在惩罚 (Presence Penalty)</label>
          <el-slider
            v-model="parameters.presencePenalty"
            :min="-2"
            :max="2"
            :step="0.01"
            show-input
            :input-size="'small'"
          />
          <span class="help-text">鼓励谈论新话题</span>
        </div>

        <!-- 最大令牌数 -->
        <div class="control-item">
          <label>最大令牌数</label>
          <el-input-number
            v-model="parameters.maxTokens"
            :min="1"
            :max="4096"
            :step="1"
            size="small"
          />
          <span class="help-text">限制回复长度</span>
        </div>
      </div>

      <!-- 快速预设按钮 -->
      <div class="preset-buttons">
        <el-button
          v-for="preset in quickPresets"
          :key="preset.id"
          :type="currentPreset === preset.id ? 'primary' : ''"
          size="small"
          @click="applyPreset(preset)"
        >
          {{ preset.name }}
        </el-button>
      </div>
    </el-card>

    <!-- WorldInfo管理 -->
    <el-card class="world-info-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <el-icon><Collection /></el-icon>
          <span>世界信息 (WorldInfo)</span>
          <el-button
            type="success"
            size="small"
            @click="showWorldInfoDialog = true"
          >
            管理
          </el-button>
        </div>
      </template>

      <div class="world-info-list">
        <div
          v-for="book in worldInfoBooks"
          :key="book.id"
          class="world-info-item"
          @click="toggleWorldInfo(book)"
        >
          <el-checkbox
            v-model="book.enabled"
            @change="updateWorldInfo(book)"
          />
          <div class="book-info">
            <span class="book-name">{{ book.name }}</span>
            <span class="book-entries">{{ book.entries }}条目</span>
          </div>
          <el-tag size="small" :type="book.enabled ? 'success' : 'info'">
            {{ book.enabled ? '已启用' : '已禁用' }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 用户人格选择 -->
    <el-card class="persona-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <el-icon><User /></el-icon>
          <span>用户人格</span>
          <el-button
            type="warning"
            size="small"
            @click="showPersonaDialog = true"
          >
            切换
          </el-button>
        </div>
      </template>

      <div class="current-persona">
        <el-avatar :src="currentPersona.avatar" :size="40">
          {{ currentPersona.name[0] }}
        </el-avatar>
        <div class="persona-info">
          <div class="persona-name">{{ currentPersona.name }}</div>
          <div class="persona-desc">{{ currentPersona.description }}</div>
        </div>
      </div>
    </el-card>

    <!-- 群组聊天控制 -->
    <el-card class="group-chat-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <el-icon><ChatDotRound /></el-icon>
          <span>群组聊天</span>
          <el-button
            type="danger"
            size="small"
            @click="showGroupDialog = true"
          >
            创建群组
          </el-button>
        </div>
      </template>

      <div class="group-participants">
        <div
          v-for="participant in groupParticipants"
          :key="participant.id"
          class="participant-item"
        >
          <el-avatar :src="participant.avatar" :size="32">
            {{ participant.name[0] }}
          </el-avatar>
          <div class="participant-info">
            <span class="participant-name">{{ participant.name }}</span>
            <el-tag size="small" :type="participant.type === 'user' ? 'primary' : 'success'">
              {{ participant.type === 'user' ? '用户' : 'AI' }}
            </el-tag>
          </div>
          <el-switch
            v-if="participant.type === 'character'"
            v-model="participant.autoReply"
            size="small"
            active-text="自动回复"
          />
        </div>
      </div>
    </el-card>

    <!-- 预设管理对话框 -->
    <el-dialog
      v-model="showPresetDialog"
      title="聊天预设管理"
      width="60%"
      :before-close="handlePresetDialogClose"
    >
      <div class="preset-manager">
        <el-tabs v-model="activePresetTab">
          <el-tab-pane label="内置预设" name="builtin">
            <div class="preset-grid">
              <div
                v-for="preset in builtinPresets"
                :key="preset.id"
                class="preset-card"
                @click="selectPreset(preset)"
              >
                <div class="preset-name">{{ preset.name }}</div>
                <div class="preset-desc">{{ preset.description }}</div>
                <div class="preset-params">
                  <small>温度: {{ preset.parameters.temperature }}</small>
                  <small>Top-P: {{ preset.parameters.topP }}</small>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="自定义预设" name="custom">
            <div class="custom-presets">
              <el-button type="primary" @click="createCustomPreset">
                创建新预设
              </el-button>
              <!-- 自定义预设列表 -->
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 其他对话框... -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const parameters = reactive({
  temperature: 0.8,
  topP: 0.9,
  frequencyPenalty: 0.1,
  presencePenalty: 0.1,
  maxTokens: 1024
})

const currentPreset = ref('roleplay')
const showPresetDialog = ref(false)
const showWorldInfoDialog = ref(false)
const showPersonaDialog = ref(false)
const showGroupDialog = ref(false)
const activePresetTab = ref('builtin')

// 快速预设
const quickPresets = ref([
  {
    id: 'creative',
    name: '创意写作',
    parameters: { temperature: 0.9, topP: 0.9, frequencyPenalty: 0.1, presencePenalty: 0.1, maxTokens: 2048 }
  },
  {
    id: 'roleplay',
    name: '角色扮演',
    parameters: { temperature: 0.8, topP: 0.85, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 1024 }
  },
  {
    id: 'precise',
    name: '精确回答',
    parameters: { temperature: 0.3, topP: 0.6, frequencyPenalty: 0.0, presencePenalty: 0.0, maxTokens: 1024 }
  }
])

const builtinPresets = ref([])
const worldInfoBooks = ref([
  {
    id: 'book1',
    name: '魔法世界设定',
    entries: 15,
    enabled: true
  },
  {
    id: 'book2',
    name: '角色背景故事',
    entries: 8,
    enabled: false
  }
])

const currentPersona = ref({
  name: '默认用户',
  description: '友好、好奇的普通用户',
  avatar: null
})

const groupParticipants = ref([
  {
    id: 'user1',
    name: '用户',
    type: 'user',
    avatar: null,
    autoReply: false
  },
  {
    id: 'char1',
    name: '艾莉丝',
    type: 'character',
    avatar: '/avatars/alice.png',
    autoReply: true
  }
])

// 方法
const applyPreset = (preset: any) => {
  Object.assign(parameters, preset.parameters)
  currentPreset.value = preset.id
  ElMessage.success(`已应用预设: ${preset.name}`)
}

const toggleWorldInfo = (book: any) => {
  book.enabled = !book.enabled
  updateWorldInfo(book)
}

const updateWorldInfo = (book: any) => {
  // TODO: 调用API更新WorldInfo状态
  ElMessage.success(`${book.name} ${book.enabled ? '已启用' : '已禁用'}`)
}

const selectPreset = (preset: any) => {
  applyPreset(preset)
  showPresetDialog.value = false
}

const createCustomPreset = () => {
  ElMessage.info('自定义预设功能开发中...')
}

const handlePresetDialogClose = (done: Function) => {
  done()
}

// 生命周期
onMounted(() => {
  // 加载预设和其他数据
  loadBuiltinPresets()
})

const loadBuiltinPresets = async () => {
  try {
    // TODO: 从API加载内置预设
    builtinPresets.value = [
      {
        id: 'builtin_0',
        name: 'Creative Writing',
        description: '高创意写作模式，适合故事创作和诗歌',
        parameters: { temperature: 0.9, topP: 0.9, frequencyPenalty: 0.1, presencePenalty: 0.1, maxTokens: 2048 }
      }
    ]
  } catch (error) {
    console.error('加载预设失败:', error)
  }
}
</script>

<style scoped lang="scss">
.silly-tavern-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--tavern-bg-primary);

  .control-panel {
    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: space-between;

      span {
        font-weight: 600;
        color: var(--tavern-text-primary);
      }
    }

    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 16px;

      .control-item {
        label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--tavern-text-primary);
        }

        .help-text {
          display: block;
          font-size: 12px;
          color: var(--tavern-text-secondary);
          margin-top: 4px;
        }
      }
    }

    .preset-buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
  }

  .world-info-panel {
    .world-info-list {
      .world-info-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: var(--tavern-bg-hover);
        }

        .book-info {
          flex: 1;

          .book-name {
            display: block;
            font-weight: 500;
            color: var(--tavern-text-primary);
          }

          .book-entries {
            display: block;
            font-size: 12px;
            color: var(--tavern-text-secondary);
          }
        }
      }
    }
  }

  .persona-panel {
    .current-persona {
      display: flex;
      align-items: center;
      gap: 12px;

      .persona-info {
        flex: 1;

        .persona-name {
          font-weight: 500;
          color: var(--tavern-text-primary);
        }

        .persona-desc {
          font-size: 12px;
          color: var(--tavern-text-secondary);
          margin-top: 2px;
        }
      }
    }
  }

  .group-chat-panel {
    .group-participants {
      .participant-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;

        .participant-info {
          flex: 1;

          .participant-name {
            font-weight: 500;
            color: var(--tavern-text-primary);
            margin-right: 8px;
          }
        }
      }
    }
  }

  .preset-manager {
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;

      .preset-card {
        padding: 16px;
        border: 1px solid var(--tavern-border-light);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: var(--tavern-primary);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .preset-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .preset-desc {
          font-size: 14px;
          color: var(--tavern-text-secondary);
          margin-bottom: 8px;
        }

        .preset-params {
          display: flex;
          gap: 8px;

          small {
            color: var(--tavern-text-muted);
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .silly-tavern-controls {
    .controls-grid {
      grid-template-columns: 1fr !important;
    }

    .preset-buttons {
      justify-content: center;
    }
  }
}
</style>
