<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- 错误边界包装 -->
    <ErrorBoundary>
      <!-- 页面头部 -->
      <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">探索角色</h1>
              <p class="mt-1 text-sm text-gray-500">
                发现有趣的AI角色，开始你的对话之旅
              </p>
            </div>

            <!-- 创建角色按钮 -->
            <button
              @click="handleCreateCharacter"
              class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              创建角色
            </button>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选栏 -->
      <div class="bg-white shadow-sm border-b sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- 搜索框 -->
            <div class="flex-1">
              <div class="relative">
                <input
                  v-model="searchInput"
                  type="text"
                  placeholder="搜索角色名称或描述..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  @input="handleSearchDebounced"
                  @keyup.enter="handleSearch"
                />
                <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>

                <!-- 清除按钮 -->
                <button
                  v-if="searchInput"
                  @click="clearSearch"
                  class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 分类筛选 -->
            <div class="flex gap-2">
              <select
                v-model="characterStore.selectedCategory"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @change="handleCategoryChange"
              >
                <option value="">所有分类</option>
                <option value="anime">动漫</option>
                <option value="game">游戏</option>
                <option value="movie">电影</option>
                <option value="book">书籍</option>
                <option value="original">原创</option>
                <option value="historical">历史</option>
                <option value="vtuber">VTuber</option>
                <option value="assistant">助手</option>
              </select>

              <!-- 排序 -->
              <select
                v-model="characterStore.sortBy"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @change="handleSortChange"
              >
                <option value="popular">最受欢迎</option>
                <option value="newest">最新添加</option>
                <option value="rating">评分最高</option>
                <option value="chats">对话最多</option>
              </select>

              <!-- 筛选按钮 -->
              <button
                @click="showFilters = !showFilters"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
                筛选
              </button>
            </div>
          </div>

          <!-- 高级筛选面板 -->
          <Transition name="slide-down">
            <div v-if="showFilters" class="mt-4 p-4 bg-gray-50 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">评分</label>
                  <select class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">不限</option>
                    <option value="4.5">4.5分以上</option>
                    <option value="4.0">4.0分以上</option>
                    <option value="3.5">3.5分以上</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">内容分级</label>
                  <select class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">不限</option>
                    <option value="safe">安全</option>
                    <option value="nsfw">NSFW</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">特殊标签</label>
                  <div class="flex gap-2">
                    <label class="inline-flex items-center">
                      <input type="checkbox" class="rounded text-indigo-600" />
                      <span class="ml-2 text-sm">新角色</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input type="checkbox" class="rounded text-indigo-600" />
                      <span class="ml-2 text-sm">高级角色</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- 加载状态 -->
        <LoadingOverlay
          :visible="characterStore.isLoading && !characterStore.characters.length"
          title="加载角色中"
          message="正在获取角色列表..."
        />

        <!-- 角色网格 -->
        <div v-if="!characterStore.isLoading || characterStore.characters.length > 0">
          <!-- 角色卡片网格 -->
          <div v-if="characterStore.characters.length > 0"
               class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <TransitionGroup name="fade-slide">
              <CharacterCard
                v-for="character in characterStore.characters"
                :key="character.id"
                :character="character"
                @click="handleCharacterClick(character)"
                @favorite="handleFavorite(character.id)"
              />
            </TransitionGroup>
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-16">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">没有找到角色</h3>
            <p class="text-gray-500 mb-4">试试调整筛选条件或搜索其他内容</p>
            <button
              @click="handleResetFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              重置筛选
            </button>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="characterStore.totalPages > 1" class="mt-8">
          <Pagination
            :current-page="characterStore.currentPage"
            :total-pages="characterStore.totalPages"
            @change="handlePageChange"
          />
        </div>
      </div>

      <!-- 角色创建对话框 -->
      <CharacterCreateDialog
        v-if="showCreateDialog"
        @close="showCreateDialog = false"
        @created="handleCharacterCreated"
      />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import CharacterCard from '@/components/character/CharacterCard.vue'
import CharacterCreateDialog from '@/components/character/CharacterCreateDialog.vue'
import Pagination from '@/components/common/Pagination.vue'

const router = useRouter()
const characterStore = useCharacterStore()
const chatStore = useChatStore()

// 本地状态
const searchInput = ref('')
const showFilters = ref(false)
const showCreateDialog = ref(false)

// 生命周期
onMounted(() => {
  // 加载角色列表
  characterStore.fetchCharacters()
})

// 搜索防抖
const handleSearchDebounced = debounce(() => {
  characterStore.searchCharacters(searchInput.value)
}, 500)

// 立即搜索
const handleSearch = () => {
  characterStore.searchCharacters(searchInput.value)
}

// 清除搜索
const clearSearch = () => {
  searchInput.value = ''
  characterStore.searchCharacters('')
}

// 分类变化
const handleCategoryChange = () => {
  characterStore.filterByCategory(characterStore.selectedCategory)
}

// 排序变化
const handleSortChange = () => {
  characterStore.sortCharacters(characterStore.sortBy)
}

// 重置筛选
const handleResetFilters = () => {
  searchInput.value = ''
  showFilters.value = false
  characterStore.resetFilters()
  characterStore.fetchCharacters()
}

// 分页变化
const handlePageChange = (page: number) => {
  characterStore.goToPage(page)

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 点击角色卡片
const handleCharacterClick = async (character: any) => {
  try {
    // 创建或加载会话
    const session = await chatStore.createSession(
      character.id,
      character.name,
      character.avatar
    )

    if (session) {
      // 导航到聊天页面
      router.push(`/chat/${session.id}`)
    }
  } catch (error) {
    ElMessage.error('创建会话失败，请重试')
  }
}

// 收藏角色
const handleFavorite = async (characterId: string) => {
  try {
    await characterStore.toggleFavorite(characterId)
    ElMessage.success('操作成功')
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  }
}

// 创建角色
const handleCreateCharacter = () => {
  showCreateDialog.value = true
}

// 角色创建成功
const handleCharacterCreated = (character: any) => {
  showCreateDialog.value = false
  ElMessage.success('角色创建成功！')

  // 刷新列表
  characterStore.fetchCharacters()
}
</script>

<style scoped>
/* 滑动动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 淡入滑动动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.fade-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
