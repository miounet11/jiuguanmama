<template>
  <el-dialog
    v-model="dialogVisible"
    title="聊天室设置"
    width="600px"
    @close="handleClose"
  >
    <div class="room-settings">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="房间名称">
          <el-input v-model="settings.name" placeholder="请输入房间名称" />
        </el-form-item>

        <el-form-item label="房间描述">
          <el-input
            v-model="settings.description"
            type="textarea"
            :rows="3"
            placeholder="请输入房间描述"
          />
        </el-form-item>

        <el-form-item label="最大人数">
          <el-input-number
            v-model="settings.maxUsers"
            :min="2"
            :max="50"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="房间类型">
          <el-radio-group v-model="settings.type">
            <el-radio value="public">公开房间</el-radio>
            <el-radio value="private">私人房间</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Props {
  modelValue: boolean
  roomId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', settings: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(props.modelValue)
const settings = reactive({
  name: '',
  description: '',
  maxUsers: 10,
  type: 'public'
})

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSave = () => {
  emit('save', settings)
  handleClose()
}
</script>

<style scoped>
.room-settings {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
}
</style>
