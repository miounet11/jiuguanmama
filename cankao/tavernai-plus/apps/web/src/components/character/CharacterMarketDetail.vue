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
      <!-- 顶部信息区 -->
      <div class="top-section mb-6">
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- 左侧头像和基础信息 -->
          <div class="flex-shrink-0">
            <div class="relative w-48 h-64 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-indigo-500/20 mx-auto lg:mx-0">
              <img
                v-if="character.avatar"
                :src="character.avatar"
                :alt="character.name"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                <span class="text-white text-6xl font-bold opacity-90">
                  {{ character.name.charAt(0).toUpperCase() }}
                </span>
              </div>

              <!-- 评分徽章 -->
              <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 flex items-center gap-1">
                <el-icon class="text-yellow-400"><Star /></el-icon>
                <span class="text-white font-medium">{{ character.rating.toFixed(1) }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-4 space-y-2">
              <el-button
                @click="handleImport"
                type="primary"
                size="large"
                class="w-full"
                :loading="importLoading"
              >
                <el-icon class="mr-2"><Download /></el-icon>
                导入到我的角色库
              </el-button>

              <el-button
                @click="handleFavorite"
                :type="character.isFavorited ? 'warning' : 'default'"
                size="large"
                class="w-full"
                :loading="favoriteLoading"
              >
                <el-icon class="mr-2">
                  <StarFilled v-if="character.isFavorited" />
                  <Star v-else />
                </el-icon>
                {{ character.isFavorited ? '已收藏' : '收藏角色' }}
              </el-button>

              <el-button
                @click="startPreviewChat"
                size="large"
                class="w-full"
              >
                <el-icon class="mr-2"><ChatRound /></el-icon>
                试聊预览
              </el-button>
            </div>
          </div>

          <!-- 右侧详细信息 -->
          <div class="flex-1 min-w-0">
            <!-- 角色标题和创作者 -->
            <div class="mb-4">
              <div class="flex items-start justify-between mb-2">
                <h2 class="text-3xl font-bold text-white">{{ character.name }}</h2>

                <!-- 状态标签 -->
                <div class="flex gap-2">
                  <el-tag v-if="character.isFeatured" type="warning" size="large">
                    <el-icon class="mr-1"><Star /></el-icon>
                    精选
                  </el-tag>
                  <el-tag v-if="character.isNew" type="success" size="large">新</el-tag>
                  <el-tag v-if="character.isNSFW" type="danger" size="large">18+</el-tag>
                </div>
              </div>

              <!-- 创作者信息 -->
              <div class="flex items-center gap-3 text-gray-300 mb-4">
                <img
                  v-if="character.creator.avatar"
                  :src="character.creator.avatar"
                  :alt="character.creator.username"
                  class="w-8 h-8 rounded-full"
                />
                <div>
                  <span class="text-sm text-gray-400">创作者:</span>
                  <span class="text-purple-400 font-medium ml-2 hover:text-purple-300 cursor-pointer">
                    {{ character.creator.username }}
                  </span>
                </div>
                <div class="text-gray-400">•</div>
                <div class="text-sm text-gray-400">
                  {{ formatDate(character.createdAt) }}
                </div>
              </div>

              <!-- 统计信息 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="bg-purple-500/10 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-purple-400">{{ character.rating.toFixed(1) }}</div>
                  <div class="text-sm text-gray-400">评分</div>
                </div>
                <div class="bg-blue-500/10 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-blue-400">{{ formatNumber(character.favorites) }}</div>
                  <div class="text-sm text-gray-400">收藏</div>
                </div>
                <div class="bg-green-500/10 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-green-400">{{ formatNumber(character.downloads || 0) }}</div>
                  <div class="text-sm text-gray-400">下载</div>
                </div>
                <div class="bg-orange-500/10 rounded-lg p-3 text-center">
                  <div class="text-2xl font-bold text-orange-400">{{ character.ratingCount }}</div>
                  <div class="text-sm text-gray-400">评价</div>
                </div>
              </div>
            </div>

            <!-- 描述 -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-white mb-2">角色简介</h3>
              <p class="text-gray-300 leading-relaxed">
                {{ character.description || '这个角色还没有简介...' }}
              </p>
            </div>

            <!-- 标签 -->
            <div v-if="character.tags.length > 0" class="mb-4">
              <h3 class="text-lg font-semibold text-white mb-2">标签</h3>
              <div class="flex flex-wrap gap-2">
                <el-tag
                  v-for="tag in character.tags"
                  :key="tag"
                  type="info"
                  effect="plain"
                  class="tag-hover"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <!-- 分类和语言 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-gray-400 mb-1">分类</h3>
                <el-tag type="info" size="large">{{ character.category }}</el-tag>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-400 mb-1">语言</h3>
                <el-tag type="info" size="large">{{ character.language || '中文' }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细信息选项卡 -->
      <el-tabs v-model="activeTab" type="border-card" class="detail-tabs">
        <!-- 角色设定 -->
        <el-tab-pane label="角色设定" name="character">
          <div class="space-y-6">
            <!-- 详细描述 -->
            <div v-if="detailData?.fullDescription">
              <h3 class="text-lg font-semibold text-white mb-3">详细描述</h3>
              <div class="bg-gray-800/50 rounded-lg p-4">
                <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ detailData.fullDescription }}
                </p>
              </div>
            </div>

            <!-- 性格特点 -->
            <div v-if="detailData?.personality">
              <h3 class="text-lg font-semibold text-white mb-3">性格特点</h3>
              <div class="bg-gray-800/50 rounded-lg p-4">
                <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ detailData.personality }}
                </p>
              </div>
            </div>

            <!-- 背景故事 -->
            <div v-if="detailData?.backstory">
              <h3 class="text-lg font-semibold text-white mb-3">背景故事</h3>
              <div class="bg-gray-800/50 rounded-lg p-4">
                <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ detailData.backstory }}
                </p>
              </div>
            </div>

            <!-- 场景设定 -->
            <div v-if="detailData?.scenario">
              <h3 class="text-lg font-semibold text-white mb-3">场景设定</h3>
              <div class="bg-gray-800/50 rounded-lg p-4">
                <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ detailData.scenario }}
                </p>
              </div>
            </div>

            <!-- 示例对话 -->
            <div v-if="detailData?.exampleDialogs && detailData.exampleDialogs.length > 0">
              <h3 class="text-lg font-semibold text-white mb-3">示例对话</h3>
              <div class="space-y-3">
                <div
                  v-for="(dialog, index) in detailData.exampleDialogs"
                  :key="index"
                  class="bg-gray-800/50 rounded-lg p-4"
                >
                  <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {{ dialog }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 评价与评论 -->
        <el-tab-pane label="评价与评论" name="reviews">
          <div class="space-y-6">
            <!-- 评分概览 -->
            <div class="bg-gray-800/50 rounded-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-white">用户评分</h3>
                <el-button @click="showRatingDialog = true" type="primary">
                  写评价
                </el-button>
              </div>

              <div class="flex items-center gap-8">
                <div class="text-center">
                  <div class="text-4xl font-bold text-yellow-400 mb-1">{{ character.rating.toFixed(1) }}</div>
                  <div class="flex justify-center mb-2">
                    <el-rate
                      v-model="character.rating"
                      disabled
                      show-score
                      text-color="#ffd04b"
                      score-template="{value} 分"
                    />
                  </div>
                  <div class="text-sm text-gray-400">基于 {{ character.ratingCount }} 条评价</div>
                </div>

                <!-- 评分分布 -->
                <div class="flex-1">
                  <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2 mb-1">
                    <span class="text-sm text-gray-400 w-8">{{ star }}星</span>
                    <div class="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${getStarPercentage(star)}%` }"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-400 w-8">{{ getStarCount(star) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 评论列表 -->
            <div v-if="loadingReviews" class="space-y-4">
              <div v-for="i in 3" :key="i" class="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-8 h-8 bg-gray-700 rounded-full"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div class="h-3 bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="h-3 bg-gray-700 rounded"></div>
                  <div class="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            <div v-else-if="reviews.length === 0" class="text-center py-8">
              <div class="text-4xl mb-4">💬</div>
              <h3 class="text-lg font-semibold text-white mb-2">暂无评价</h3>
              <p class="text-gray-400 mb-4">成为第一个评价这个角色的用户吧！</p>
              <el-button @click="showRatingDialog = true" type="primary">写评价</el-button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="review in reviews"
                :key="review.id"
                class="bg-gray-800/50 rounded-lg p-4"
              >
                <div class="flex items-start gap-3">
                  <img
                    v-if="review.user.avatar"
                    :src="review.user.avatar"
                    :alt="review.user.username"
                    class="w-8 h-8 rounded-full"
                  />
                  <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium text-sm" v-else>
                    {{ review.user.username.charAt(0).toUpperCase() }}
                  </div>

                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-white font-medium">{{ review.user.username }}</span>
                      <el-rate
                        v-model="review.rating"
                        disabled
                        size="small"
                        text-color="#ffd04b"
                      />
                      <span class="text-sm text-gray-400">{{ formatDate(review.createdAt) }}</span>
                    </div>

                    <p v-if="review.comment" class="text-gray-300 leading-relaxed">
                      {{ review.comment }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 加载更多 -->
              <div v-if="hasMoreReviews" class="text-center">
                <el-button @click="loadMoreReviews" :loading="loadingMoreReviews">
                  加载更多评价
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 相关推荐 -->
        <el-tab-pane label="相关推荐" name="recommendations">
          <div v-if="recommendedCharacters.length === 0" class="text-center py-8">
            <div class="text-4xl mb-4">🔍</div>
            <h3 class="text-lg font-semibold text-white mb-2">暂无相关推荐</h3>
            <p class="text-gray-400">稍后会为您推荐类似的角色</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CharacterMarketCard
              v-for="rec in recommendedCharacters"
              :key="rec.id"
              :character="rec"
              mode="list"
              @click="selectCharacter"
              @favorite="handleRecommendationFavorite"
              @import="handleRecommendationImport"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 评分对话框 -->
    <el-dialog
      v-model="showRatingDialog"
      title="评价角色"
      width="500px"
      append-to-body
    >
      <div class="rating-dialog">
        <div class="text-center mb-4">
          <h3 class="text-lg font-semibold text-white mb-2">为这个角色打分</h3>
          <el-rate
            v-model="newRating.rating"
            size="large"
            text-color="#ffd04b"
            :texts="['很差', '较差', '一般', '不错', '很棒']"
            show-text
          />
        </div>

        <div class="mb-4">
          <el-input
            v-model="newRating.comment"
            type="textarea"
            :rows="4"
            placeholder="分享你对这个角色的看法..."
            maxlength="500"
            show-word-limit
          />
        </div>

        <div class="flex justify-end gap-3">
          <el-button @click="showRatingDialog = false">取消</el-button>
          <el-button
            @click="submitRating"
            type="primary"
            :loading="ratingLoading"
            :disabled="newRating.rating === 0"
          >
            提交评价
          </el-button>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Star,
  StarFilled,
  Download,
  ChatRound
} from '@element-plus/icons-vue'
import CharacterMarketCard from './CharacterMarketCard.vue'
import marketplaceService, { type CharacterPreview } from '@/services/marketplace'

interface Props {
  visible: boolean
  character: CharacterPreview | null
}

interface Emits {
  'update:visible': [visible: boolean]
  import: [characterId: string]
  favorite: [characterId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = ref(false)
const activeTab = ref('character')
const importLoading = ref(false)
const favoriteLoading = ref(false)
const loadingReviews = ref(false)
const loadingMoreReviews = ref(false)
const ratingLoading = ref(false)
const showRatingDialog = ref(false)

const detailData = ref<any>(null)
const reviews = ref<any[]>([])
const recommendedCharacters = ref<CharacterPreview[]>([])
const hasMoreReviews = ref(false)
const reviewPage = ref(1)

const newRating = reactive({
  rating: 0,
  comment: ''
})

// 计算属性
const currentCharacter = computed(() => props.character)

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.character) {
    loadCharacterDetails()
    loadReviews()
    loadRecommendations()
  }
}, { immediate: true })

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 方法
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return '1天前'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}周前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const getStarPercentage = (star: number): number => {
  // 模拟数据，实际应该从API获取
  const distribution = { 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 }
  return distribution[star as keyof typeof distribution] || 0
}

const getStarCount = (star: number): number => {
  if (!props.character) return 0
  const percentage = getStarPercentage(star)
  return Math.round(props.character.ratingCount * percentage / 100)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const handleClose = () => {
  dialogVisible.value = false
}

const loadCharacterDetails = async () => {
  if (!props.character) return

  try {
    detailData.value = await marketplaceService.getCharacterDetails(props.character.id)
  } catch (error) {
    console.error('加载角色详情失败:', error)
  }
}

const loadReviews = async () => {
  if (!props.character) return

  try {
    loadingReviews.value = true
    const result = await marketplaceService.getCharacterRatings(props.character.id, 1, 10)
    reviews.value = result.ratings
    hasMoreReviews.value = result.ratings.length === 10
    reviewPage.value = 1
  } catch (error) {
    console.error('加载评价失败:', error)
  } finally {
    loadingReviews.value = false
  }
}

const loadMoreReviews = async () => {
  if (!props.character) return

  try {
    loadingMoreReviews.value = true
    const nextPage = reviewPage.value + 1
    const result = await marketplaceService.getCharacterRatings(props.character.id, nextPage, 10)
    reviews.value.push(...result.ratings)
    hasMoreReviews.value = result.ratings.length === 10
    reviewPage.value = nextPage
  } catch (error) {
    console.error('加载更多评价失败:', error)
  } finally {
    loadingMoreReviews.value = false
  }
}

const loadRecommendations = async () => {
  try {
    recommendedCharacters.value = await marketplaceService.getRecommendedCharacters(6)
  } catch (error) {
    console.error('加载推荐失败:', error)
  }
}

const handleImport = async () => {
  if (!props.character) return

  try {
    await ElMessageBox.confirm(
      `确定要导入角色 "${props.character.name}" 到你的角色库吗？`,
      '确认导入',
      {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    importLoading.value = true
    emit('import', props.character.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('导入角色失败:', error)
    }
  } finally {
    importLoading.value = false
  }
}

const handleFavorite = async () => {
  if (!props.character) return

  try {
    favoriteLoading.value = true
    emit('favorite', props.character.id)
  } catch (error) {
    console.error('收藏操作失败:', error)
  } finally {
    favoriteLoading.value = false
  }
}

const startPreviewChat = () => {
  ElMessage.info('试聊功能即将推出，敬请期待！')
}

const selectCharacter = (character: CharacterPreview) => {
  // 切换到新角色
  emit('update:visible', false)
  // 可以触发父组件打开新角色的详情
  setTimeout(() => {
    // 这里应该由父组件处理切换逻辑
  }, 300)
}

const handleRecommendationFavorite = (characterId: string) => {
  // 处理推荐角色的收藏
  emit('favorite', characterId)
}

const handleRecommendationImport = (characterId: string) => {
  // 处理推荐角色的导入
  emit('import', characterId)
}

const submitRating = async () => {
  if (!props.character || newRating.rating === 0) return

  try {
    ratingLoading.value = true
    await marketplaceService.rateCharacter(
      props.character.id,
      newRating.rating,
      newRating.comment || undefined
    )

    ElMessage.success('评价提交成功！')
    showRatingDialog.value = false

    // 重置表单
    newRating.rating = 0
    newRating.comment = ''

    // 重新加载评价
    await loadReviews()
  } catch (error) {
    console.error('提交评价失败:', error)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    ratingLoading.value = false
  }
}
</script>

<style scoped>
.character-detail-dialog {
  --el-dialog-bg-color: rgba(15, 15, 35, 0.95);
  --el-dialog-border-color: rgba(139, 92, 246, 0.3);
}

:deep(.el-dialog) {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  padding: 20px;
}

:deep(.el-dialog__title) {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 20px;
  color: white;
}

.detail-tabs {
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

:deep(.el-tabs__header) {
  background: rgba(15, 15, 35, 0.6);
  margin: 0;
}

:deep(.el-tabs__nav-wrap) {
  background: transparent;
}

:deep(.el-tabs__item) {
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(139, 92, 246, 0.2);
}

:deep(.el-tabs__item.is-active) {
  color: #8B5CF6;
  background: rgba(139, 92, 246, 0.1);
}

:deep(.el-tabs__content) {
  padding: 20px;
  background: rgba(15, 15, 35, 0.3);
}

.tag-hover {
  transition: all 0.2s ease;
  cursor: pointer;
}

.tag-hover:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: white;
  transform: translateY(-1px);
}

:deep(.el-rate) {
  height: auto;
}

:deep(.el-rate__text) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  background-color: rgba(15, 15, 35, 0.6);
  border-color: rgba(139, 92, 246, 0.3);
  color: white;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

/* 响应式适配 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  .top-section .flex {
    flex-direction: column;
  }

  .grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
