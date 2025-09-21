<template>
  <el-dialog
    v-model="dialogVisible"
    title="召唤角色"
    width="700px"
    @close="handleClose"
  >
    <div class="character-summon">
      <!-- 搜索框 -->
      <div class="mb-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索角色名称..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>

      <!-- 角色列表 -->
      <div class="character-list">
        <div
          v-for="character in filteredCharacters"
          :key="character.id"
          class="character-item"
          :class="{ active: selectedCharacter?.id === character.id }"
          @click="selectCharacter(character)"
        >
          <el-avatar :src="character.avatar" :size="50">
            {{ character.name.charAt(0) }}
          </el-avatar>

          <div class="character-info">
            <h4 class="character-name">{{ character.name }}</h4>
            <p class="character-description">{{ character.description }}</p>
            <div class="character-tags">
              <el-tag
                v-for="tag in character.tags.slice(0, 3)"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <div class="character-actions">
            <el-icon class="summon-icon">
              <User />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredCharacters.length === 0" class="empty-state">
        <el-empty description="没有找到匹配的角色" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectedCharacter"
          @click="handleSummon"
        >
          召唤角色
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, User } from '@element-plus/icons-vue'

interface Character {
  id: string
  name: string
  description: string
  avatar?: string
  tags: string[]
}

interface Props {
  modelValue: boolean
  roomId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'summon', character: Character): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(props.modelValue)
const searchQuery = ref('')
const selectedCharacter = ref<Character | null>(null)
const characters = ref<Character[]>([])

// 模拟角色数据
const mockCharacters: Character[] = [
  {
    id: '1',
    name: '小助手',
    description: '智能AI助手，可以帮助您解决各种问题',
    avatar: '/avatars/assistant.png',
    tags: ['助手', 'AI', '智能']
  },
  {
    id: '2',
    name: '艾莉',
    description: '活泼可爱的少女，喜欢聊天和交朋友',
    avatar: '/avatars/ellie.png',
    tags: ['可爱', '活泼', '聊天']
  },
  {
    id: '3',
    name: '博士',
    description: '知识渊博的学者，对各种学科都有深入了解',
    avatar: '/avatars/doctor.png',
    tags: ['学者', '知识', '教育']
  }
]

const filteredCharacters = computed(() => {
  if (!searchQuery.value) {
    return characters.value
  }

  return characters.value.filter(character =>
    character.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    character.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    character.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const handleSearch = () => {
  // 搜索逻辑在computed中处理
}

const selectCharacter = (character: Character) => {
  selectedCharacter.value = character
}

const handleClose = () => {
  emit('update:modelValue', false)
  selectedCharacter.value = null
}

const handleSummon = () => {
  if (selectedCharacter.value) {
    emit('summon', selectedCharacter.value)
    handleClose()
  }
}

onMounted(() => {
  // 加载角色列表
  characters.value = mockCharacters
})
</script>

<style scoped>
.character-summon {
  max-height: 500px;
}

.character-list {
  max-height: 400px;
  overflow-y: auto;
}

.character-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  margin-bottom: 8px;
}

.character-item:hover {
  background-color: var(--el-bg-color-page);
}

.character-item.active {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.character-info {
  flex: 1;
  margin-left: 16px;
  min-width: 0;
}

.character-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.character-description {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.character-actions {
  display: flex;
  align-items: center;
}

.summon-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.dialog-footer {
  text-align: right;
}
</style>
