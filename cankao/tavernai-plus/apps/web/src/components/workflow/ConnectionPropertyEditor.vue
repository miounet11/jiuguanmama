<template>
  <div class="connection-property-editor">
    <h4 class="property-title">
      <i class="el-icon-connection"></i>
      连接属性
    </h4>

    <div class="connection-info">
      <div class="connection-nodes">
        <div class="node-info">
          <span class="node-label">来源节点:</span>
          <div class="node-display">
            <i :class="getNodeIcon(fromNodeType)"></i>
            <span>{{ getNodeLabel(fromNodeType) }}</span>
          </div>
        </div>

        <div class="arrow">
          <i class="el-icon-right"></i>
        </div>

        <div class="node-info">
          <span class="node-label">目标节点:</span>
          <div class="node-display">
            <i :class="getNodeIcon(toNodeType)"></i>
            <span>{{ getNodeLabel(toNodeType) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="property-section">
      <el-form-item v-if="fromNodeType === 'condition'" label="条件分支">
        <el-select v-model="localData.condition" @change="updateData" placeholder="选择条件分支">
          <el-option label="条件为真" value="true">
            <div class="condition-option">
              <div class="branch-dot true"></div>
              <span>条件为真时执行</span>
            </div>
          </el-option>
          <el-option label="条件为假" value="false">
            <div class="condition-option">
              <div class="branch-dot false"></div>
              <span>条件为假时执行</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="连接名称">
        <el-input
          v-model="localData.name"
          placeholder="为这个连接添加名称（可选）"
          @input="updateData"
        />
      </el-form-item>

      <el-form-item label="连接描述">
        <el-input
          v-model="localData.description"
          type="textarea"
          :rows="2"
          placeholder="描述这个连接的作用"
          @input="updateData"
        />
      </el-form-item>

      <!-- 高级设置 -->
      <el-collapse accordion>
        <el-collapse-item title="高级设置" name="advanced">
          <el-form-item label="执行条件">
            <el-input
              v-model="localData.executionCondition"
              placeholder="额外的执行条件，如: {{variable}} > 5"
              @input="updateData"
            />
            <span class="help-text">只有当条件为真时才会通过此连接执行</span>
          </el-form-item>

          <el-form-item label="数据映射">
            <div class="data-mapping">
              <el-input
                v-model="localData.dataMapping"
                type="textarea"
                :rows="3"
                placeholder='{"targetVar": "{{sourceVar}}", "processedData": "{{previousStep.result}}"}'
                @input="updateData"
              />
              <span class="help-text">JSON格式，将源节点的输出映射到目标节点的输入</span>
            </div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="localData.async" @change="updateData">
              异步执行
            </el-checkbox>
            <span class="help-text">不等待此分支完成即可继续执行其他分支</span>
          </el-form-item>

          <el-form-item label="优先级">
            <el-select v-model="localData.priority" @change="updateData">
              <el-option label="低" value="low" />
              <el-option label="普通" value="normal" />
              <el-option label="高" value="high" />
            </el-select>
            <span class="help-text">多个并行分支的执行优先级</span>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="actions">
      <el-button @click="deleteConnection" type="danger" size="small" icon="Delete">
        删除连接
      </el-button>
    </div>
  </div>
</template>

<script>
import { reactive, computed, onMounted, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'ConnectionPropertyEditor',
  props: {
    connection: {
      type: Object,
      required: true
    }
  },
  emits: ['update', 'delete'],
  setup(props, { emit }) {
    const workflowDefinition = inject('workflowDefinition')

    const localData = reactive({
      name: '',
      description: '',
      condition: '',
      executionCondition: '',
      dataMapping: '',
      async: false,
      priority: 'normal'
    })

    // 计算来源和目标节点类型
    const fromNode = computed(() => {
      return workflowDefinition?.nodes?.find(n => n.id === props.connection.from)
    })

    const toNode = computed(() => {
      return workflowDefinition?.nodes?.find(n => n.id === props.connection.to)
    })

    const fromNodeType = computed(() => fromNode.value?.type || 'unknown')
    const toNodeType = computed(() => toNode.value?.type || 'unknown')

    // 初始化本地数据
    const initLocalData = () => {
      Object.assign(localData, {
        name: '',
        description: '',
        condition: '',
        executionCondition: '',
        dataMapping: '',
        async: false,
        priority: 'normal',
        ...props.connection
      })
    }

    // 更新数据
    const updateData = () => {
      emit('update', { ...localData })
    }

    // 删除连接
    const deleteConnection = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要删除这个连接吗？',
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        emit('delete', props.connection)
      } catch {
        // 用户取消删除
      }
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
        start: '开始',
        end: '结束',
        ai_chat: 'AI对话',
        condition: '条件判断',
        variable: '设置变量',
        http_request: 'HTTP请求',
        delay: '延迟',
        character_summon: '角色召唤'
      }
      return labels[type] || type
    }

    onMounted(() => {
      initLocalData()
    })

    return {
      localData,
      fromNodeType,
      toNodeType,
      updateData,
      deleteConnection,
      getNodeIcon,
      getNodeLabel
    }
  }
}
</script>

<style scoped>
.connection-property-editor {
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

.connection-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.connection-nodes {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.node-info {
  flex: 1;
}

.node-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.node-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 13px;
}

.arrow {
  padding: 0 16px;
  color: #909399;
  font-size: 16px;
}

.property-section {
  margin-bottom: 24px;
}

.condition-option {
  display: flex;
  align-items: center;
  gap: 8px;
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

.data-mapping {
  position: relative;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0 0;
  display: block;
}

.actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
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

:deep(.el-select .el-input__inner) {
  padding-right: 30px;
}

:deep(.el-option .condition-option) {
  width: 100%;
}
</style>