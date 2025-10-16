<template>
  <el-dialog
    v-model="dialogVisible"
    :title="character?.name || '角色详情'"
    width="90%"
    max-width="1200px"
    :before-close="handleClose"
    class="character-detail-dialog"
    append-to-body
    destroy-on-close
  >
    <div v-if="character" class="character-detail-content">
      <div class="character-info">
        <h2>{{ character.name }}</h2>
        <p>{{ character.description }}</p>
        <div class="actions">
          <el-button @click="handleImport" type="primary">导入角色</el-button>
          <el-button @click="handleFavorite">{{ character.isFavorited ? '取消收藏' : '收藏角色' }}</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  visible: boolean
  character: any | null
}

interface Emits {
  'update:visible': [visible: boolean]
  import: [characterId: string]
  favorite: [characterId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

const handleClose = () => {
  dialogVisible.value = false
}

const handleImport = () => {
  if (props.character) {
    ElMessage.success('角色导入成功！')
    emit('import', props.character.id)
  }
}

const handleFavorite = () => {
  if (props.character) {
    ElMessage.success(props.character.isFavorited ? '已取消收藏' : '收藏成功！')
    emit('favorite', props.character.id)
  }
}
</script>

<style scoped>
.character-detail-dialog {
  --el-dialog-bg-color: rgba(15, 15, 35, 0.95);
  --el-dialog-border-color: rgba(139, 92, 246, 0.3);
}

.character-detail-content {
  padding: 20px;
  color: white;
}

.character-info h2 {
  color: white;
  margin-bottom: 16px;
}

.character-info p {
  color: #ccc;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 12px;
}
</style>