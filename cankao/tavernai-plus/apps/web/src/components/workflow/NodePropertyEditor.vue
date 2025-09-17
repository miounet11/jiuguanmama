<template>
  <div class="node-property-editor">
    <h4 class="property-title">
      <i :class="getNodeIcon(node.type)"></i>
      {{ getNodeLabel(node.type) }}
    </h4>

    <!-- 开始节点 -->
    <div v-if="node.type === 'start'" class="property-section">
      <p class="help-text">工作流的起始节点，每个工作流只能有一个开始节点。</p>
    </div>

    <!-- 结束节点 -->
    <div v-if="node.type === 'end'" class="property-section">
      <el-form-item label="输出数据">
        <el-input
          v-model="localData.output"
          type="textarea"
          :rows="4"
          placeholder="设置工作流的输出结果，支持变量引用如: {{variableName}}"
          @input="updateData"
        />
      </el-form-item>
    </div>

    <!-- AI对话节点 -->
    <div v-if="node.type === 'ai_chat'" class="property-section">
      <el-form-item label="提示词" required>
        <el-input
          v-model="localData.prompt"
          type="textarea"
          :rows="4"
          placeholder="输入AI对话提示词，支持变量引用如: {{input}}"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="AI模型">
        <el-select v-model="localData.model" @change="updateData" placeholder="选择AI模型">
          <el-option label="Grok-3" value="grok-3" />
          <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
          <el-option label="GPT-4" value="gpt-4" />
          <el-option label="Claude-3" value="claude-3" />
        </el-select>
      </el-form-item>

      <el-form-item label="创造性">
        <el-slider
          v-model="localData.temperature"
          :min="0"
          :max="2"
          :step="0.1"
          show-tooltip
          @change="updateData"
        />
        <span class="help-text">较低值更保守，较高值更有创造性</span>
      </el-form-item>

      <el-form-item label="最大输出长度">
        <el-input-number
          v-model="localData.maxTokens"
          :min="1"
          :max="4000"
          @change="updateData"
        />
      </el-form-item>

      <el-form-item label="系统提示">
        <el-input
          v-model="localData.systemPrompt"
          type="textarea"
          :rows="3"
          placeholder="可选的系统级提示词"
          @input="updateData"
        />
      </el-form-item>
    </div>

    <!-- 条件判断节点 -->
    <div v-if="node.type === 'condition'" class="property-section">
      <el-form-item label="条件表达式" required>
        <el-input
          v-model="localData.condition"
          placeholder="例如: {{score}} > 80"
          @input="updateData"
        />
        <span class="help-text">支持变量引用和基本运算符 >, <, >=, <=, ==, !=</span>
      </el-form-item>

      <el-form-item label="变量类型">
        <el-select v-model="localData.valueType" @change="updateData">
          <el-option label="字符串" value="string" />
          <el-option label="数字" value="number" />
          <el-option label="布尔值" value="boolean" />
        </el-select>
      </el-form-item>

      <div class="condition-preview">
        <h5>分支说明：</h5>
        <div class="branch-item true">
          <div class="branch-dot true"></div>
          <span>条件为真时执行</span>
        </div>
        <div class="branch-item false">
          <div class="branch-dot false"></div>
          <span>条件为假时执行</span>
        </div>
      </div>
    </div>

    <!-- 变量设置节点 -->
    <div v-if="node.type === 'variable'" class="property-section">
      <el-form-item label="变量名" required>
        <el-input
          v-model="localData.name"
          placeholder="变量名称"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="变量值" required>
        <el-input
          v-model="localData.value"
          placeholder="变量值，支持引用其他变量如: {{input}}"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="数据类型">
        <el-select v-model="localData.valueType" @change="updateData">
          <el-option label="自动检测" value="auto" />
          <el-option label="字符串" value="string" />
          <el-option label="数字" value="number" />
          <el-option label="布尔值" value="boolean" />
          <el-option label="JSON对象" value="object" />
        </el-select>
      </el-form-item>
    </div>

    <!-- HTTP请求节点 -->
    <div v-if="node.type === 'http_request'" class="property-section">
      <el-form-item label="请求URL" required>
        <el-input
          v-model="localData.url"
          placeholder="https://api.example.com/data"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="请求方法">
        <el-select v-model="localData.method" @change="updateData">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
        </el-select>
      </el-form-item>

      <el-form-item label="请求头">
        <div class="headers-editor">
          <div
            v-for="(header, index) in localData.headers"
            :key="index"
            class="header-item"
          >
            <el-input
              v-model="header.key"
              placeholder="Header名"
              size="small"
              style="width: 40%"
              @input="updateData"
            />
            <el-input
              v-model="header.value"
              placeholder="Header值"
              size="small"
              style="width: 40%; margin-left: 10px"
              @input="updateData"
            />
            <el-button
              type="danger"
              size="small"
              icon="Delete"
              @click="removeHeader(index)"
              style="margin-left: 10px"
            />
          </div>
          <el-button @click="addHeader" type="primary" size="small">
            添加Header
          </el-button>
        </div>
      </el-form-item>

      <el-form-item v-if="localData.method !== 'GET'" label="请求体">
        <el-input
          v-model="localData.body"
          type="textarea"
          :rows="4"
          placeholder="JSON格式的请求体，支持变量引用"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="超时时间(秒)">
        <el-input-number
          v-model="localData.timeout"
          :min="1"
          :max="300"
          @change="updateData"
        />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="localData.followRedirects" @change="updateData">
          跟随重定向
        </el-checkbox>
      </el-form-item>
    </div>

    <!-- 延迟节点 -->
    <div v-if="node.type === 'delay'" class="property-section">
      <el-form-item label="延迟时间">
        <el-input-number
          v-model="localData.duration"
          :min="100"
          :max="300000"
          :step="1000"
          @change="updateData"
        />
        <span class="help-text">毫秒 (1000毫秒 = 1秒)</span>
      </el-form-item>

      <div class="delay-preview">
        <p>预计延迟: {{ formatDuration(localData.duration) }}</p>
      </div>
    </div>

    <!-- 角色召唤节点 -->
    <div v-if="node.type === 'character_summon'" class="property-section">
      <el-form-item label="角色ID" required>
        <el-input
          v-model="localData.characterId"
          placeholder="角色的唯一标识符"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="聊天室ID" required>
        <el-input
          v-model="localData.roomId"
          placeholder="目标聊天室ID"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="自定义提示">
        <el-input
          v-model="localData.customPrompt"
          type="textarea"
          :rows="3"
          placeholder="角色加入时的自定义行为指令"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="localData.autoGreeting" @change="updateData">
          自动发送问候消息
        </el-checkbox>
      </el-form-item>
    </div>

    <!-- 通用设置 -->
    <div class="property-section">
      <h5>节点设置</h5>

      <el-form-item label="节点备注">
        <el-input
          v-model="localData.description"
          type="textarea"
          :rows="2"
          placeholder="为这个节点添加描述或备注"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item v-if="node.type !== 'start' && node.type !== 'end'">
        <el-checkbox v-model="localData.continueOnError" @change="updateData">
          出错时继续执行
        </el-checkbox>
      </el-form-item>

      <el-form-item v-if="node.type !== 'start' && node.type !== 'end'" label="重试次数">
        <el-input-number
          v-model="localData.retryCount"
          :min="0"
          :max="5"
          @change="updateData"
        />
      </el-form-item>
    </div>

    <!-- 变量引用帮助 -->
    <div class="help-section">
      <el-collapse accordion>
        <el-collapse-item title="变量引用帮助" name="variables">
          <div class="help-content">
            <p><strong>如何引用变量：</strong></p>
            <ul>
              <li><code>{{'{{'}}variableName{{'}}'}}</code> - 引用变量</li>
              <li><code>{{'{{'}}input{{'}}'}}</code> - 工作流输入参数</li>
              <li><code>{{'{{'}}previousStep.result{{'}}'}}</code> - 引用上一步结果</li>
              <li><code>{{'{{'}}user.name{{'}}'}}</code> - 访问嵌套属性</li>
            </ul>

            <p><strong>内置变量：</strong></p>
            <ul>
              <li><code>{{'{{'}}userId{{'}}'}}</code> - 当前用户ID</li>
              <li><code>{{'{{'}}timestamp{{'}}'}}</code> - 当前时间戳</li>
              <li><code>{{'{{'}}instanceId{{'}}'}}</code> - 工作流实例ID</li>
            </ul>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, onMounted } from 'vue'

export default {
  name: 'NodePropertyEditor',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const localData = reactive({})

    // 初始化本地数据
    const initLocalData = () => {
      Object.assign(localData, {
        // 通用属性
        description: '',
        continueOnError: false,
        retryCount: 0,

        // 节点特定的默认值
        ...getDefaultData(props.node.type),

        // 覆盖已有数据
        ...props.node.data
      })
    }

    // 获取节点类型的默认数据
    const getDefaultData = (type) => {
      const defaults = {
        ai_chat: {
          prompt: '',
          model: 'grok-3',
          temperature: 0.8,
          maxTokens: 1000,
          systemPrompt: ''
        },
        condition: {
          condition: '',
          valueType: 'string'
        },
        variable: {
          name: '',
          value: '',
          valueType: 'auto'
        },
        http_request: {
          url: '',
          method: 'GET',
          headers: [],
          body: '',
          timeout: 30,
          followRedirects: true
        },
        delay: {
          duration: 1000
        },
        character_summon: {
          characterId: '',
          roomId: '',
          customPrompt: '',
          autoGreeting: true
        },
        end: {
          output: ''
        }
      }
      return defaults[type] || {}
    }

    // 更新数据
    const updateData = () => {
      emit('update', { ...localData })
    }

    // 添加Header
    const addHeader = () => {
      if (!localData.headers) {
        localData.headers = []
      }
      localData.headers.push({ key: '', value: '' })
      updateData()
    }

    // 删除Header
    const removeHeader = (index) => {
      localData.headers.splice(index, 1)
      updateData()
    }

    // 格式化延迟时间
    const formatDuration = (ms) => {
      if (ms < 1000) return `${ms}毫秒`
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}秒`
      return `${(ms / 60000).toFixed(1)}分钟`
    }

    // 获取节点图标
    const getNodeIcon = (type) => {
      const icons = {
        start: 'el-icon-video-play',
        end: 'el-icon-video-pause',
        ai_chat: 'el-icon-chat-dot-square',
        condition: 'el-icon-s-operation',
        variable: 'el-icon-coin',
        http_request: 'el-icon-connection',
        delay: 'el-icon-timer',
        character_summon: 'el-icon-user'
      }
      return icons[type] || 'el-icon-help'
    }

    // 获取节点标签
    const getNodeLabel = (type) => {
      const labels = {
        start: '开始节点',
        end: '结束节点',
        ai_chat: 'AI对话',
        condition: '条件判断',
        variable: '设置变量',
        http_request: 'HTTP请求',
        delay: '延迟执行',
        character_summon: '角色召唤'
      }
      return labels[type] || type
    }

    // 监听节点变化
    watch(() => props.node, () => {
      initLocalData()
    }, { deep: true })

    // 组件挂载时初始化
    onMounted(() => {
      initLocalData()
    })

    return {
      localData,
      updateData,
      addHeader,
      removeHeader,
      formatDuration,
      getNodeIcon,
      getNodeLabel
    }
  }
}
</script>

<style scoped>
.node-property-editor {
  padding: 0;
}

.property-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
}

.property-section {
  margin-bottom: 24px;
}

.property-section h5 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0 0;
}

.headers-editor {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.header-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.header-item:last-child {
  margin-bottom: 12px;
}

.condition-preview {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
}

.condition-preview h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
}

.branch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.branch-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.branch-dot.true {
  background: #67c23a;
}

.branch-dot.false {
  background: #f56c6c;
}

.delay-preview {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 8px;
}

.delay-preview p {
  margin: 0;
  font-size: 12px;
  color: #409eff;
}

.help-section {
  margin-top: 24px;
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.help-content ul {
  margin: 8px 0;
  padding-left: 16px;
}

.help-content li {
  margin-bottom: 4px;
  font-size: 12px;
}

.help-content code {
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: Monaco, Consolas, monospace;
  font-size: 11px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

:deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 500;
}
</style>