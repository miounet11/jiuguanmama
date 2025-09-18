<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择角色"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="character-selector">
      <!-- 搜索栏 -->
      <div class="mb-6">
        <el-input
          v-model="searchQuery"
          placeholder="搜索角色名称..."
          prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>

      <!-- 筛选标签 -->
      <div class="mb-6">
        <div class="flex items-center space-x-2 mb-3">
          <span class="text-sm text-gray-400">筛选：</span>
          <el-button
            v-for="filter in filterOptions"
            :key="filter.value"
            size="small"
            :type="currentFilter === filter.value ? 'primary' : ''"
            @click="currentFilter = filter.value"
          >
            {{ filter.label }}
          </el-button>
        </div>
      </div>

      <!-- 角色列表 -->
      <div class="character-list">
        <!-- 加载状态 -->
        <div v-if="loading" class="text-center py-8">
          <el-icon class="text-2xl text-purple-400 animate-spin"><Loading /></el-icon>
          <p class="text-gray-400 mt-2">正在加载角色...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="characters.length === 0" class="text-center py-8">
          <el-icon class="text-4xl text-gray-500 mb-2"><DocumentEmpty /></el-icon>
          <p class="text-gray-400">没有找到角色</p>
        </div>

        <!-- 角色网格 -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          <div
            v-for="character in characters"
            :key="character.id"
            :class="[
              'character-card cursor-pointer p-4 rounded-lg border-2 transition-all duration-200',
              selectedCharacter?.id === character.id
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-700/30'
            ]"
            @click="selectCharacter(character)"
          >
            <div class="flex items-center space-x-3">
              <el-avatar :size="48" :src="character.avatar">
                {{ character.name.charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-white truncate">{{ character.name }}</h4>
                <p class="text-sm text-gray-400 line-clamp-2">{{ character.description }}</p>
                <div class="flex items-center space-x-2 mt-2">
                  <span v-if="character.isPublic" class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    公开
                  </span>
                  <span v-if="character.isNSFW" class="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                    NSFW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="characters.length > 0" class="flex justify-center mt-6">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          layout="prev, pager, next"
          @current-change="loadCharacters"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div v-if="selectedCharacter" class="flex items-center space-x-3">
          <el-avatar :size="32" :src="selectedCharacter.avatar">
            {{ selectedCharacter.name.charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="text-sm text-gray-300">已选择: {{ selectedCharacter.name }}</span>
        </div>
        <div class="flex space-x-3">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmSelection"
            :disabled="!selectedCharacter"
          >
            确认选择
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Character } from '@/types/character'
import { useCharacterStore } from '@/stores/character'
import { Loading, DocumentEmpty } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'

interface Props {
  modelValue: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  select: [character: Character]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const characterStore = useCharacterStore()

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const characters = ref<Character[]>([])
const selectedCharacter = ref<Character | null>(null)
const searchQuery = ref('')
const currentFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(12)
const totalCount = ref(0)

// 筛选选项
const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'mine', label: '我的角色' },
  { value: 'public', label: '公开角色' },
  { value: 'recent', label: '最近使用' }
]

// 监听
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    loadCharacters()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetState()
  }
})

watch(currentFilter, () => {
  currentPage.value = 1
  loadCharacters()
})

// 方法
const loadCharacters = async () => {
  try {
    loading.value = true

    const filter: any = {
      page: currentPage.value,
      pageSize: pageSize.value
    }

    // 根据筛选类型设置过滤条件
    switch (currentFilter.value) {
      case 'mine':
        filter.userId = characterStore.currentUserId
        break
      case 'public':
        filter.isPublic = true
        break
      case 'recent':
        filter.recentlyUsed = true
        break
    }

    // 搜索条件
    if (searchQuery.value.trim()) {
      filter.search = searchQuery.value.trim()
    }

    const response = await characterStore.getCharacters(filter)

    if (response.success && response.data) {
      characters.value = response.data.data || []
      totalCount.value = response.data.total || 0
    } else {
      throw new Error(response.error || '加载角色失败')
    }
  } catch (error) {
    console.error('加载角色失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '加载角色失败')
    characters.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = debounce(() => {
  currentPage.value = 1
  loadCharacters()
}, 300)

const selectCharacter = (character: Character) => {
  selectedCharacter.value = character
}

const confirmSelection = () => {
  if (selectedCharacter.value) {
    emit('select', selectedCharacter.value)
  }
}

const resetState = () => {
  selectedCharacter.value = null
  searchQuery.value = ''
  currentFilter.value = 'all'
  currentPage.value = 1
  characters.value = []
  totalCount.value = 0
}

// 生命周期
onMounted(() => {
  if (dialogVisible.value) {
    loadCharacters()
  }
})
</script>

<style scoped>
.character-selector {
  max-height: 70vh;
}

.character-list {
  min-height: 200px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-card:hover {
  transform: translateY(-2px);
}

/* 滚动条样式 */
.character-list .grid::-webkit-scrollbar {
  width: 6px;
}

.character-list .grid::-webkit-scrollbar-track {
  background: rgba(75, 85, 99, 0.2);
  border-radius: 3px;
}

.character-list .grid::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

.character-list .grid::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}
</style>
