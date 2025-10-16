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
              <button
                @click="handleImport"
                :disabled="importState.isImporting"
                :class="['action-button import-button', {
                  'importing': importState.isImporting,
                  'imported': importState.isImported,
                  'error': importState.error
                }]"
              >
                <div v-if="!importState.isImporting" class="button-content">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                  <span>{{ importState.isImported ? '✓ 已导入' : '导入到我的角色库' }}</span>
                </div>
                <div v-else class="loading-content">
                  <svg class="animate-spin w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A4.002 4.002 0 0015.999 13H18a1 1 0 110-2h-3.001a6.001 6.001 0 01-3.715-1.67 1 1 0 01-.272 1.276z" clip-rule="evenodd"/>
                  </svg>
                  <span>{{ importState.message || '正在导入...' }}</span>
                </div>
              </button>

              <button
                @click="handleFavorite"
                :disabled="favoriteState.isLoading"
                :class="['action-button favorite-button', {
                  'favorited': character.isFavorited,
                  'loading': favoriteState.isLoading
                }]"
              >
                <div v-if="!favoriteState.isLoading" class="button-content">
                  <svg v-if="character.isFavorited" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span>{{ character.isFavorited ? '已收藏' : '收藏角色' }}</span>
                </div>
                <div v-else class="loading-content">
                  <svg class="animate-spin w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A4.002 4.002 0 0015.999 13H18a1 1 0 110-2h-3.001a6.001 6.001 0 01-3.715-1.67 1 1 0 01-.272 1.276z" clip-rule="evenodd"/>
                  </svg>
                  <span>{{ favoriteState.message || '处理中...' }}</span>
                </div>
              </button>

              <button
                @click="startPreviewChat"
                class="action-button preview-button secondary-button"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd"/>
                </svg>
                <span>试聊预览</span>
                <span class="badge">即将推出</span>
              </button>
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
            <div class="rating-overview glass-card p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-white flex items-center gap-2">
                  <div class="rating-icon text-yellow-400">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                  用户评分
                </h3>
                <button @click="showRatingDialog = true" class="primary-button">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                  写评价
                </button>
              </div>

              <div class="flex items-center gap-8">
                <div class="text-center rating-main">
                  <div class="text-5xl font-bold text-yellow-400 mb-2">{{ character.rating.toFixed(1) }}</div>
                  <div class="flex justify-center mb-3">
                    <el-rate
                      v-model="character.rating"
                      disabled
                      show-score
                      text-color="#ffd04b"
                      score-template="{value} 分"
                      size="large"
                    />
                  </div>
                  <div class="text-sm text-purple-300">基于 {{ character.ratingCount }} 条评价</div>
                </div>

                <!-- 评分分布 -->
                <div class="flex-1 rating-distribution">
                  <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-3 mb-2">
                    <span class="text-sm text-purple-300 w-12 text-right">{{ star }}星</span>
                    <div class="flex-1 bg-purple-900/30 rounded-full h-3 overflow-hidden">
                      <div
                        class="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500"
                        :style="{ width: `${getStarPercentage(star)}%` }"
                      ></div>
                    </div>
                    <span class="text-sm text-purple-300 w-12 text-left">{{ getStarCount(star) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 评论列表 -->
            <div v-if="loadingReviews" class="space-y-4">
              <div v-for="i in 3" :key="i" class="review-skeleton glass-card p-6 animate-pulse">
                <div class="flex items-start gap-4 mb-4">
                  <div class="w-12 h-12 bg-purple-800 rounded-full"></div>
                  <div class="flex-1">
                    <div class="h-5 bg-purple-800 rounded w-32 mb-2"></div>
                    <div class="h-4 bg-purple-800 rounded w-48"></div>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="h-4 bg-purple-800 rounded"></div>
                  <div class="h-4 bg-purple-800 rounded w-4/5"></div>
                  <div class="h-4 bg-purple-800 rounded w-3/5"></div>
                </div>
              </div>
            </div>

            <div v-else-if="reviews.length === 0" class="empty-reviews text-center py-12">
              <div class="empty-icon mb-4">
                <svg class="w-16 h-16 mx-auto text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">暂无评价</h3>
              <p class="text-purple-300 mb-6 max-w-md mx-auto">成为第一个评价这个角色的用户吧！你的评价对其他用户非常重要。</p>
              <button @click="showRatingDialog = true" class="primary-button">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
                写评价
              </button>
            </div>

            <div v-else class="space-y-6">
              <div
                v-for="review in reviews"
                :key="review.id"
                class="review-item glass-card p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div class="flex items-start gap-4">
                  <div class="reviewer-avatar flex-shrink-0">
                    <img
                      v-if="review.user.avatar"
                      :src="review.user.avatar"
                      :alt="review.user.username"
                      class="w-12 h-12 rounded-full border-2 border-purple-500/30"
                    />
                    <div v-else class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-purple-500/30">
                      {{ review.user.username.charAt(0).toUpperCase() }}
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <span class="text-white font-semibold text-lg">{{ review.user.username }}</span>
                        <div class="review-rating">
                          <el-rate
                            v-model="review.rating"
                            disabled
                            size="small"
                            text-color="#ffd04b"
                            class="rating-stars"
                          />
                        </div>
                      </div>
                      <span class="text-sm text-purple-300">{{ formatDate(review.createdAt) }}</span>
                    </div>

                    <div v-if="review.comment" class="review-comment">
                      <p class="text-purple-100 leading-relaxed whitespace-pre-wrap">{{ review.comment }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加载更多 -->
              <div v-if="hasMoreReviews" class="text-center">
                <button @click="loadMoreReviews" :loading="loadingMoreReviews" class="secondary-button">
                  <svg v-if="!loadingMoreReviews" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                  <span v-else class="loading-text">加载中...</span>
                  <span v-if="!loadingMoreReviews">加载更多评价</span>
                </button>
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
import { ref, reactive, computed, watch } from 'vue'
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
const loadingReviews = ref(false)
const loadingMoreReviews = ref(false)
const ratingLoading = ref(false)
const showRatingDialog = ref(false)

// 导入状态管理
const importState = reactive({
  isImporting: false,
  isImported: false,
  error: null,
  message: ''
})

// 收藏状态管理
const favoriteState = reactive({
  isLoading: false,
  message: ''
})

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

    // 重置导入状态
    importState.isImporting = true
    importState.error = null
    importState.message = '正在导入角色...'
    importState.isImported = false

    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    importState.isImported = true
    importState.message = '✅ 角色导入成功！'

    ElMessage.success('角色导入成功！')
    emit('import', props.character.id)

    // 3秒后重置状态
    setTimeout(() => {
      importState.isImported = false
      importState.message = ''
    }, 3000)

  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('导入角色失败:', error)
      importState.error = '导入失败'
      importState.message = '导入失败，请稍后重试'
      ElMessage.error('导入失败，请稍后重试')
    }
  } finally {
    importState.isImporting = false
  }
}

const handleFavorite = async () => {
  if (!props.character) return

  try {
    favoriteState.isLoading = true
    favoriteState.message = props.character.isFavorited ? '正在取消收藏...' : '正在收藏...'

    // 模拟收藏过程
    await new Promise(resolve => setTimeout(resolve, 800))

    if (props.character.isFavorited) {
      favoriteState.message = '✓ 已取消收藏'
      ElMessage.info('已取消收藏')
    } else {
      favoriteState.message = '✓ 收藏成功！'
      ElMessage.success('收藏成功！')
    }

    emit('favorite', props.character.id)

    // 2秒后重置消息
    setTimeout(() => {
      favoriteState.message = ''
    }, 2000)

  } catch (error) {
    console.error('收藏操作失败:', error)
    favoriteState.message = '操作失败'
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    favoriteState.isLoading = false
    setTimeout(() => {
      favoriteState.message = ''
    }, 2000)
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
@import '@/styles/variables.scss';

.character-detail-dialog {
  --el-dialog-bg-color: rgba(15, 15, 35, 0.95);
  --el-dialog-border-color: rgba(139, 92, 246, 0.3);
}

// 玻璃卡片样式
.glass-card {
  background: rgba(37, 37, 68, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.glass-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
  transform: translateY(-2px);
}

// 按钮样式
.primary-button {
  background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-primary-600));
  color: white;
  border: none;
  border-radius: var(--radius-base);
  padding: var(--spacing-3) var(--spacing-6);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.primary-button:hover {
  background: linear-gradient(135deg, var(--brand-primary-600), var(--brand-primary-700));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.secondary-button {
  background: rgba(139, 92, 246, 0.1);
  color: var(--brand-primary-400);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: var(--radius-base);
  padding: var(--spacing-3) var(--spacing-6);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.secondary-button:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

// 操作按钮样式
.action-button {
  width: 100%;
  padding: var(--spacing-4);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  position: relative;
  overflow: hidden;
}

.button-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  transition: all 0.3s ease;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--text-primary);
}

// 导入按钮
.import-button {
  background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-primary-600));
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--brand-primary-600), var(--brand-primary-700));
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
  }

  &.importing {
    background: linear-gradient(135deg, var(--brand-primary-600), var(--brand-primary-700));
    color: white;
  }

  &.imported {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    animation: success-pulse 0.5s ease;
  }

  &.error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }
}

// 收藏按钮
.favorite-button {
  background: rgba(139, 92, 246, 0.1);
  color: var(--brand-primary-400);
  border: 1px solid rgba(139, 92, 246, 0.3);

  &:hover:not(:disabled) {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-2px);
  }

  &.favorited {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.3);

    &:hover:not(:disabled) {
      background: rgba(251, 191, 36, 0.2);
      border-color: rgba(251, 191, 36, 0.5);
    }
  }

  &.loading {
    background: rgba(139, 92, 246, 0.2);
    color: var(--brand-primary-300);
    border-color: rgba(139, 92, 246, 0.4);
  }
}

// 预览按钮
.preview-button {
  .badge {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    font-size: var(--font-size-xs);
    padding: 2px 6px;
    border-radius: var(--radius-base);
    margin-left: var(--spacing-2);
  }
}

// 动画效果
@keyframes success-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 评分样式
.rating-overview {
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.rating-main {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05));
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.rating-distribution {
  .bg-purple-900\/30 {
    background: rgba(88, 28, 135, 0.3);
  }
}

// 评论样式
.review-skeleton {
  .bg-purple-800 {
    background: rgba(88, 28, 135, 0.6);
  }
}

.empty-reviews {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.02));
  border-radius: var(--radius-lg);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.review-item {
  &:hover {
    background: rgba(139, 92, 246, 0.05);
    transform: translateY(-1px);
  }
}

.reviewer-avatar {
  img {
    transition: transform 0.2s ease;
  }

  img:hover {
    transform: scale(1.05);
  }
}

.review-rating {
  :deep(.el-rate__text) {
    color: var(--text-tertiary);
  }
}

.review-comment {
  background: rgba(139, 92, 246, 0.05);
  padding: var(--spacing-4);
  border-radius: var(--radius-base);
  border: 1px solid rgba(139, 92, 246, 0.1);
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