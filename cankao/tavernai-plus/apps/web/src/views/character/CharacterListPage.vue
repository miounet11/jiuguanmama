<template>
  <div class="character-list-page">
    <PageHeader title="角色广场" subtitle="探索精彩的AI角色世界" />
    
    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <div class="search-box">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索角色名称、标签或描述..."
          size="large"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="filter-options">
        <el-select v-model="sortBy" placeholder="排序方式" size="large" @change="fetchCharacters">
          <el-option label="最新创建" value="created" />
          <el-option label="评分最高" value="rating" />
          <el-option label="最受欢迎" value="popular" />
        </el-select>
        
        <el-select v-model="selectedTags" multiple placeholder="选择标签" size="large" @change="fetchCharacters">
          <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
        
        <el-button type="primary" size="large" @click="showCreateDialog = true">
          <el-icon class="mr-2"><Plus /></el-icon>
          创建角色
        </el-button>
      </div>
    </div>
    
    <!-- 角色网格 -->
    <div class="character-grid" v-loading="loading">
      <CharacterCard 
        v-for="character in characters" 
        :key="character.id"
        :character="character"
        @click="handleCharacterClick(character)"
        @favorite="handleFavorite(character)"
      />
    </div>
    
    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="totalPages > 1">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalCharacters"
        layout="total, prev, pager, next, jumper"
        @current-change="fetchCharacters"
      />
    </div>
    
    <!-- 创建角色对话框 -->
    <CharacterCreateDialog 
      v-model="showCreateDialog"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CharacterCard from '@/components/character/CharacterCard.vue'
import CharacterCreateDialog from '@/components/character/CharacterCreateDialog.vue'
import { characterService } from '@/services/character'
import type { Character } from '@/types/character'

const router = useRouter()

// 数据状态
const characters = ref<Character[]>([])
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref('created')
const selectedTags = ref<string[]>([])
const currentPage = ref(1)
const pageSize = 20
const totalCharacters = ref(0)
const showCreateDialog = ref(false)

const availableTags = [
  '动漫', '游戏', '小说', '影视', '历史',
  '科幻', '奇幻', '现实', '助手', '教育',
  '娱乐', '陪伴', '创作', 'NSFW'
]

const totalPages = computed(() => Math.ceil(totalCharacters.value / pageSize))

// 获取角色列表
const fetchCharacters = async () => {
  loading.value = true
  try {
    const response = await characterService.getCharacters({
      page: currentPage.value,
      limit: pageSize,
      sort: sortBy.value,
      search: searchQuery.value,
      tags: selectedTags.value
    })
    
    characters.value = response.characters
    totalCharacters.value = response.pagination.total
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchCharacters()
}

// 点击角色卡片
const handleCharacterClick = (character: Character) => {
  router.push(`/character/${character.id}`)
}

// 收藏/取消收藏
const handleFavorite = async (character: Character) => {
  try {
    await characterService.toggleFavorite(character.id)
    character.isFavorited = !character.isFavorited
    character.favoriteCount += character.isFavorited ? 1 : -1
    ElMessage.success(character.isFavorited ? '已添加到收藏' : '已取消收藏')
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 创建成功回调
const handleCreateSuccess = (character: Character) => {
  showCreateDialog.value = false
  ElMessage.success('角色创建成功')
  router.push(`/character/${character.id}`)
}

onMounted(() => {
  fetchCharacters()
})
</script>

<style lang="scss" scoped>
.character-list-page {
  min-height: 100vh;
  padding: 20px;
}

.filter-bar {
  margin-bottom: 30px;
  display: flex;
  gap: 20px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.search-box {
  flex: 1;
  max-width: 500px;
}

.filter-options {
  display: flex;
  gap: 10px;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  min-height: 400px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>