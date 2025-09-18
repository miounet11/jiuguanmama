<template>
  <div class="marketplace-test-page min-h-screen bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-8">市场组件测试页面</h1>

      <!-- 测试按钮组 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <el-button @click="showMarketCard = !showMarketCard" type="primary">
          {{ showMarketCard ? '隐藏' : '显示' }} 市场卡片
        </el-button>

        <el-button @click="showDetailDialog = true" type="success">
          显示详情弹窗
        </el-button>

        <el-button @click="showFilters = !showFilters" type="info">
          {{ showFilters ? '隐藏' : '显示' }} 筛选组件
        </el-button>

        <el-button @click="showPublishDialog = true" type="warning">
          显示发布对话框
        </el-button>
      </div>

      <!-- 测试组件展示区 -->
      <div class="space-y-8">
        <!-- 市场卡片测试 -->
        <div v-if="showMarketCard" class="section">
          <h2 class="text-2xl font-semibold text-white mb-4">角色市场卡片</h2>

          <div class="mb-4">
            <el-radio-group v-model="cardMode">
              <el-radio label="grid">网格模式</el-radio>
              <el-radio label="list">列表模式</el-radio>
            </el-radio-group>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CharacterMarketCard
              v-for="character in testCharacters"
              :key="character.id"
              :character="character"
              :mode="cardMode"
              @click="handleCardClick"
              @favorite="handleFavorite"
              @import="handleImport"
              @preview="handlePreview"
            />
          </div>
        </div>

        <!-- 筛选组件测试 -->
        <div v-if="showFilters" class="section">
          <h2 class="text-2xl font-semibold text-white mb-4">搜索和筛选组件</h2>

          <div class="max-w-md">
            <MarketplaceFilters
              v-model:filters="testFilters"
              :categories="testCategories"
              :popular-tags="testTags"
              @update:filters="handleFiltersUpdate"
            />
          </div>
        </div>

        <!-- 筛选结果显示 -->
        <div v-if="showFilters" class="section">
          <h3 class="text-xl font-semibold text-white mb-4">当前筛选条件</h3>
          <div class="bg-gray-800 p-4 rounded-lg">
            <pre class="text-green-400">{{ JSON.stringify(testFilters, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- 角色详情弹窗 -->
      <CharacterMarketDetail
        v-model:visible="showDetailDialog"
        :character="selectedCharacter"
        @import="handleImport"
        @favorite="handleFavorite"
      />

      <!-- 发布角色弹窗 -->
      <PublishCharacterDialog
        v-model:visible="showPublishDialog"
        @character-published="handleCharacterPublished"
      />

      <!-- 消息提示区域 -->
      <div class="fixed top-4 right-4 z-50">
        <div v-for="message in messages" :key="message.id" class="mb-2">
          <el-alert
            :title="message.title"
            :type="message.type"
            :closable="true"
            @close="removeMessage(message.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import CharacterMarketCard from '@/components/character/CharacterMarketCard.vue'
import CharacterMarketDetail from '@/components/character/CharacterMarketDetail.vue'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters.vue'
import PublishCharacterDialog from '@/components/character/PublishCharacterDialog.vue'
import type { CharacterPreview, MarketplaceFilter } from '@/services/marketplace'
import type { Character } from '@/types/character'

// 响应式数据
const showMarketCard = ref(true)
const showDetailDialog = ref(false)
const showFilters = ref(false)
const showPublishDialog = ref(false)
const cardMode = ref<'grid' | 'list'>('grid')
const selectedCharacter = ref<CharacterPreview | null>(null)

// 测试筛选条件
const testFilters = reactive<MarketplaceFilter>({
  search: '',
  category: '',
  minRating: undefined,
  tags: [],
  language: '',
  sortBy: 'popular',
  onlyFeatured: false,
  onlyNew: false,
  excludeNSFW: false
})

// 消息系统
const messages = ref<Array<{
  id: string
  title: string
  type: 'success' | 'warning' | 'error' | 'info'
}>>([])

// 测试数据
const testCharacters: CharacterPreview[] = [
  {
    id: '1',
    name: '小樱',
    avatar: '',
    description: '温柔可爱的虚拟助手，总是面带微笑，乐于助人。擅长日常聊天和情感支持。',
    category: '虚拟助手',
    rating: 4.8,
    ratingCount: 1247,
    favorites: 892,
    downloads: 3456,
    views: 12340,
    creator: {
      id: 'user1',
      username: 'AI创作者',
      avatar: '',
      isVerified: true
    },
    tags: ['温柔', '可爱', '助手', '日常', '陪伴'],
    language: '中文',
    isPublic: true,
    isNSFW: false,
    isFeatured: true,
    isNew: false,
    isFavorited: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    name: '智慧导师',
    avatar: '',
    description: '博学多才的AI导师，能够在各个学科领域提供专业指导。适合学习讨论和知识探索。',
    category: '教育助手',
    rating: 4.9,
    ratingCount: 856,
    favorites: 654,
    downloads: 2890,
    views: 8765,
    creator: {
      id: 'user2',
      username: '教育专家',
      avatar: '',
      isVerified: false
    },
    tags: ['教育', '学习', '专业', '知识', '导师'],
    language: '中文',
    isPublic: true,
    isNSFW: false,
    isFeatured: false,
    isNew: true,
    isFavorited: true,
    createdAt: '2024-01-18T16:00:00Z',
    updatedAt: '2024-01-22T09:15:00Z'
  },
  {
    id: '3',
    name: '冒险伙伴',
    avatar: '',
    description: '勇敢无畏的冒险家，热爱探索未知世界。能够带你体验刺激的冒险故事。',
    category: '游戏角色',
    rating: 4.6,
    ratingCount: 2103,
    favorites: 1456,
    downloads: 5678,
    views: 18920,
    creator: {
      id: 'user3',
      username: '游戏设计师',
      avatar: '',
      isVerified: true
    },
    tags: ['冒险', '勇敢', '探索', '刺激', '游戏'],
    language: '中文',
    isPublic: true,
    isNSFW: false,
    isFeatured: true,
    isNew: false,
    isFavorited: false,
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-25T18:45:00Z'
  }
]

// 测试分类数据
const testCategories = [
  { name: '虚拟助手', count: 1250, icon: '🤖' },
  { name: '教育助手', count: 890, icon: '👨‍🏫' },
  { name: '游戏角色', count: 2340, icon: '🎮' },
  { name: '动漫角色', count: 1890, icon: '🎭' },
  { name: '原创角色', count: 1456, icon: '✨' }
]

// 测试标签数据
const testTags = [
  { tag: '温柔', count: 1250, trend: 'up' as const },
  { tag: '可爱', count: 980, trend: 'stable' as const },
  { tag: '智慧', count: 760, trend: 'up' as const },
  { tag: '幽默', count: 650, trend: 'down' as const },
  { tag: '冷静', count: 520, trend: 'stable' as const },
  { tag: '活泼', count: 480, trend: 'up' as const }
]

// 方法
const handleCardClick = (character: CharacterPreview) => {
  selectedCharacter.value = character
  showDetailDialog.value = true
  addMessage('角色卡片点击', `点击了角色: ${character.name}`, 'info')
}

const handleFavorite = (characterId: string) => {
  const character = testCharacters.find(c => c.id === characterId)
  if (character) {
    character.isFavorited = !character.isFavorited
    character.favorites += character.isFavorited ? 1 : -1
    addMessage(
      '收藏操作',
      `${character.isFavorited ? '收藏' : '取消收藏'}了角色: ${character.name}`,
      'success'
    )
  }
}

const handleImport = (characterId: string) => {
  const character = testCharacters.find(c => c.id === characterId)
  if (character) {
    character.downloads += 1
    addMessage('导入操作', `导入了角色: ${character.name}`, 'success')
  }
}

const handlePreview = (character: CharacterPreview) => {
  selectedCharacter.value = character
  showDetailDialog.value = true
  addMessage('预览操作', `预览角色: ${character.name}`, 'info')
}

const handleFiltersUpdate = (filters: MarketplaceFilter) => {
  console.log('筛选条件更新:', filters)
  addMessage('筛选更新', '筛选条件已更新', 'info')
}

const handleCharacterPublished = (character: Character) => {
  addMessage('角色发布', `成功发布角色: ${character.name}`, 'success')
}

// 消息管理
const addMessage = (title: string, description: string, type: 'success' | 'warning' | 'error' | 'info') => {
  const message = {
    id: Date.now().toString(),
    title: `${title}: ${description}`,
    type
  }
  messages.value.push(message)

  // 3秒后自动删除
  setTimeout(() => {
    removeMessage(message.id)
  }, 3000)

  // 同时显示 Element Plus 消息
  ElMessage({
    message: `${title}: ${description}`,
    type,
    duration: 2000
  })
}

const removeMessage = (id: string) => {
  const index = messages.value.findIndex(m => m.id === id)
  if (index > -1) {
    messages.value.splice(index, 1)
  }
}
</script>

<style scoped>
.section {
  background: rgba(15, 15, 35, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:deep(.el-radio-group) {
  --el-radio-button-checked-bg-color: #8B5CF6;
  --el-radio-button-checked-border-color: #8B5CF6;
}

:deep(.el-radio__label) {
  color: white;
}

:deep(.el-alert) {
  margin-bottom: 8px;
}
</style>
