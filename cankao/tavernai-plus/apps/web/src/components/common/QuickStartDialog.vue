<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title=""
    :width="800"
    :show-close="false"
    :close-on-click-modal="false"
    class="quick-start-dialog"
    destroy-on-close
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">快速开始聊天</h2>
          <p class="text-gray-600 mt-1">选择一个角色开始对话，或创建你的专属角色</p>
        </div>
        <el-button
          :icon="Close"
          type="text"
          size="large"
          @click="$emit('update:visible', false)"
          class="text-gray-400 hover:text-gray-600"
        />
      </div>
    </template>

    <div class="quick-start-content">
      <!-- 搜索栏 -->
      <div class="search-section mb-6">
        <el-input
          v-model="searchQuery"
          placeholder="搜索角色名称、标签或描述..."
          :prefix-icon="Search"
          size="large"
          clearable
          @input="handleSearch"
          class="search-input"
        />

        <!-- 快速筛选标签 -->
        <div class="flex flex-wrap gap-2 mt-4" v-if="quickTags.length">
          <el-tag
            v-for="tag in quickTags"
            :key="tag"
            :type="selectedTag === tag ? 'primary' : undefined"
            @click="toggleTag(tag)"
            class="cursor-pointer transition-all hover:scale-105"
            effect="plain"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <!-- 角色选择区域 -->
      <div class="character-section">
        <!-- 推荐角色 -->
        <div v-if="!searchQuery && !selectedTag" class="recommended-section mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <el-icon class="mr-2 text-yellow-500"><Star /></el-icon>
            推荐角色
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CharacterQuickCard
              v-for="char in recommendedCharacters"
              :key="char.id"
              :character="char"
              @select="handleCharacterSelect"
              class="animate-fade-in"
            />
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchQuery || selectedTag" class="search-results">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">
              {{ searchQuery ? `搜索结果 "${searchQuery}"` : `标签: ${selectedTag}` }}
            </h3>
            <el-text type="info" size="small">
              找到 {{ filteredCharacters.length }} 个角色
            </el-text>
          </div>

          <div v-if="filteredCharacters.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CharacterQuickCard
              v-for="char in filteredCharacters.slice(0, 9)"
              :key="char.id"
              :character="char"
              @select="handleCharacterSelect"
              class="animate-fade-in"
            />
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-12">
            <el-icon size="64" class="text-gray-300 mb-4"><Search /></el-icon>
            <p class="text-gray-500 mb-4">没有找到匹配的角色</p>
            <el-button type="primary" @click="openCreateCharacter">
              创建新角色
            </el-button>
          </div>
        </div>

        <!-- 最近对话 -->
        <div v-if="!searchQuery && !selectedTag && recentChats.length" class="recent-section mb-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <el-icon class="mr-2 text-blue-500"><Clock /></el-icon>
            最近对话
          </h3>
          <div class="space-y-2">
            <div
              v-for="chat in recentChats.slice(0, 5)"
              :key="chat.id"
              @click="resumeChat(chat)"
              class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <el-avatar :src="chat.character.avatar" size="small" class="mr-3" />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900">{{ chat.character.name }}</div>
                <div class="text-sm text-gray-500 truncate">{{ chat.lastMessage }}</div>
              </div>
              <div class="text-xs text-gray-400">
                {{ formatTime(chat.updatedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="action-section border-t pt-6 mt-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <el-button @click="openCreateCharacter" type="primary" plain>
              <el-icon class="mr-2"><Plus /></el-icon>
              创建角色
            </el-button>
            <el-button @click="exploreMarketplace" type="default" plain>
              <el-icon class="mr-2"><Compass /></el-icon>
              浏览市场
            </el-button>
          </div>

          <div class="text-sm text-gray-500">
            <el-icon class="mr-1"><InfoFilled /></el-icon>
            提示：可以使用 Ctrl+K 快速打开此对话框
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <el-loading
        element-loading-text="正在加载角色..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.8)"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
// import { useCharacterStore } from '@/stores/character' // 暂时未使用
import { useChatStore } from '@/stores/chat'
import {
  Search,
  Star,
  Clock,
  Plus,
  Compass,
  Close,
  InfoFilled
} from '@element-plus/icons-vue'
import CharacterQuickCard from './CharacterQuickCard.vue'
import { debounce } from 'lodash-es'

interface Props {
  visible: boolean
}

interface Character {
  id: string
  name: string
  avatar?: string
  description: string
  tags: string[]
  creator: string
  isRecommended?: boolean
  chatCount?: number
  rating?: number
}

interface RecentChat {
  id: string
  character: Character
  lastMessage: string
  updatedAt: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const router = useRouter()
// const characterStore = useCharacterStore() // 暂时未使用
// const chatStore = useChatStore() // 暂时未使用

// 状态
const loading = ref(false)
const searchQuery = ref('')
const selectedTag = ref('')

// 数据
const characters = ref<Character[]>([])
const recentChats = ref<RecentChat[]>([])

// 快速标签
const quickTags = ref([
  '动漫', '游戏', '虚拟主播', '历史人物', '原创角色',
  '助手', '老师', '朋友', '恋人', 'NSFW'
])

// 计算属性
const recommendedCharacters = computed(() =>
  characters.value.filter(char => char.isRecommended).slice(0, 6)
)

const filteredCharacters = computed(() => {
  let filtered = characters.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(char =>
      char.name.toLowerCase().includes(query) ||
      char.description.toLowerCase().includes(query) ||
      char.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  if (selectedTag.value) {
    filtered = filtered.filter(char =>
      char.tags.includes(selectedTag.value)
    )
  }

  return filtered
})

// 方法
const handleSearch = debounce((_query: string) => {
  // 搜索逻辑已在 computed 中处理
}, 300)

const toggleTag = (tag: string) => {
  selectedTag.value = selectedTag.value === tag ? '' : tag
  searchQuery.value = '' // 清空搜索框
}

const handleCharacterSelect = (character: Character) => {
  emit('update:visible', false)
  // 直接跳转到聊天页面
  router.push(`/chat/${character.id}`)
}

const resumeChat = (chat: RecentChat) => {
  emit('update:visible', false)
  router.push(`/chat/${chat.character.id}?session=${chat.id}`)
}

const openCreateCharacter = () => {
  emit('update:visible', false)
  router.push('/studio/character/create')
}

const exploreMarketplace = () => {
  emit('update:visible', false)
  router.push('/characters')
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 模拟加载推荐角色
    characters.value = [
      {
        id: '1',
        name: '小助手',
        avatar: '/avatars/assistant.png',
        description: '友善的AI助手，可以帮助你解答问题和聊天',
        tags: ['助手', '友善'],
        creator: '官方',
        isRecommended: true,
        chatCount: 1234,
        rating: 4.8
      },
      {
        id: '2',
        name: '艾莉',
        avatar: '/avatars/ellie.png',
        description: '活泼可爱的二次元少女，喜欢动漫和游戏',
        tags: ['动漫', '少女', '可爱'],
        creator: 'AICreator',
        isRecommended: true,
        chatCount: 567,
        rating: 4.9
      },
      // 更多角色...
    ]

    // 加载最近对话 - TODO: 实现 getRecentChats 方法
    // recentChats.value = await chatStore.getRecentChats()
    recentChats.value = []
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听对话框显示状态
watch(() => props.visible, (visible) => {
  if (visible) {
    loadData()
  }
})

// 键盘快捷键
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      emit('update:visible', true)
    }
  }

  document.addEventListener('keydown', handleKeydown)

  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style lang="scss" scoped>
.quick-start-dialog {
  :deep(.el-dialog) {
    border-radius: var(--radius-2xl);

    .el-dialog__header {
      padding: var(--space-6) var(--space-6) 0;
      border-bottom: none;
    }

    .el-dialog__body {
      padding: var(--space-6);
      padding-top: var(--space-4);
    }
  }
}

.search-input {
  :deep(.el-input__wrapper) {
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    border: 2px solid transparent;
    transition: var(--transition-all);

    &.is-focus {
      border-color: var(--tavern-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式优化
@media (max-width: 768px) {
  .quick-start-dialog :deep(.el-dialog) {
    width: 95vw !important;
    margin: 5vh auto;

    .el-dialog__header,
    .el-dialog__body {
      padding: var(--space-4);
    }
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
