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

            <!-- MBTI 性格分析 -->
            <div v-if="detailData?.mbti">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                MBTI 性格分析
              </h3>
              <div class="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-lg p-4 border border-purple-500/30">
                <!-- MBTI 类型 -->
                <div class="mb-4">
                  <div class="flex items-center gap-3 mb-2">
                    <el-tag
                      size="large"
                      class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 px-4 py-2 text-lg font-bold"
                    >
                      {{ detailData.mbti.type }}
                    </el-tag>
                    <span class="text-purple-300 text-sm">人格类型</span>
                  </div>
                  <p class="text-gray-300 text-sm">
                    {{ getMbtiDescription(detailData.mbti.type) }}
                  </p>
                </div>

                <!-- 性格特质 -->
                <div v-if="detailData.mbti.traits?.length" class="mb-4">
                  <h4 class="text-white font-medium mb-2 flex items-center gap-2">
                    <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    性格特质
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-for="trait in detailData.mbti.traits"
                      :key="trait"
                      type="success"
                      effect="plain"
                      size="small"
                    >
                      {{ trait }}
                    </el-tag>
                  </div>
                </div>

                <!-- 兼容类型 -->
                <div v-if="detailData.mbti.compatibility?.length" class="mb-4">
                  <h4 class="text-white font-medium mb-2 flex items-center gap-2">
                    <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                    </svg>
                    兼容人格类型
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-for="type in detailData.mbti.compatibility"
                      :key="type"
                      type="info"
                      effect="plain"
                      size="small"
                      class="border-blue-500/50 text-blue-300"
                    >
                      {{ type }}
                    </el-tag>
                  </div>
                </div>

                <!-- 性格弱点 -->
                <div v-if="detailData.mbti.weaknesses?.length">
                  <h4 class="text-white font-medium mb-2 flex items-center gap-2">
                    <svg class="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    需要注意的弱点
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-for="weakness in detailData.mbti.weaknesses"
                      :key="weakness"
                      type="warning"
                      effect="plain"
                      size="small"
                    >
                      {{ weakness }}
                    </el-tag>
                  </div>
                </div>
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

        <!-- 时空关联 -->
        <el-tab-pane label="时空关联" name="spacetime">
          <div class="space-y-6">
            <!-- 角色关联网络 -->
            <div v-if="detailData?.characterRelations?.length">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 011 1h2a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
                </svg>
                角色关联网络
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="relation in detailData.characterRelations"
                  :key="relation.characterId"
                  class="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg p-4 border border-cyan-500/30"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <el-tag
                          :type="getRelationTypeColor(relation.relationType)"
                          size="small"
                          effect="plain"
                        >
                          {{ getRelationTypeLabel(relation.relationType) }}
                        </el-tag>
                        <span class="text-cyan-300 text-sm">
                          兼容度: {{ ((relation.compatibilityScore || 0) * 100).toFixed(0) }}%
                        </span>
                      </div>
                      <p class="text-gray-300 text-sm mb-2">
                        {{ relation.description }}
                      </p>
                    </div>
                  </div>

                  <!-- 互动触发器 -->
                  <div v-if="relation.interactionTriggers?.length">
                    <h4 class="text-white font-medium mb-2 text-sm">互动触发器:</h4>
                    <div class="flex flex-wrap gap-1">
                      <el-tag
                        v-for="trigger in relation.interactionTriggers"
                        :key="trigger"
                        size="mini"
                        type="info"
                        effect="plain"
                        class="text-xs"
                      >
                        {{ trigger }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 剧本关联 -->
            <div v-if="characterScenarios.length > 0">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
                适配剧本
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="scenario in characterScenarios"
                  :key="scenario.id"
                  class="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-4 border border-green-500/30 cursor-pointer hover:border-green-400/50 transition-colors"
                  @click="openScenario(scenario)"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <h4 class="text-white font-medium mb-1">{{ scenario.name }}</h4>
                      <p class="text-gray-400 text-sm line-clamp-2">{{ scenario.description }}</p>
                    </div>
                    <el-tag
                      v-if="scenario.isDefault"
                      type="success"
                      size="mini"
                      class="ml-2"
                    >
                      默认
                    </el-tag>
                  </div>

                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">{{ scenario.category }}</span>
                    <div class="flex items-center gap-1">
                      <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span class="text-yellow-400">{{ scenario.rating?.toFixed(1) || '0.0' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 时空酒馆兼容性分析 -->
            <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/50">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                时空酒馆兼容性分析
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- MBTI兼容性 -->
                <div class="text-center">
                  <div class="text-2xl mb-2">
                    <span v-if="detailData?.mbti?.compatibility?.length" class="text-green-400">✓</span>
                    <span v-else class="text-red-400">✗</span>
                  </div>
                  <h4 class="text-white font-medium mb-1">MBTI兼容性</h4>
                  <p class="text-gray-400 text-sm">
                    {{ detailData?.mbti?.compatibility?.length ? `${detailData.mbti.compatibility.length}个兼容类型` : '未配置兼容性' }}
                  </p>
                </div>

                <!-- 角色关联度 -->
                <div class="text-center">
                  <div class="text-2xl mb-2">
                    <span v-if="detailData?.characterRelations?.length" class="text-green-400">✓</span>
                    <span v-else class="text-yellow-400">○</span>
                  </div>
                  <h4 class="text-white font-medium mb-1">角色关联度</h4>
                  <p class="text-gray-400 text-sm">
                    {{ detailData?.characterRelations?.length || 0 }}个关联角色
                  </p>
                </div>

                <!-- 剧本适配度 -->
                <div class="text-center">
                  <div class="text-2xl mb-2">
                    <span v-if="characterScenarios.length > 0" class="text-green-400">✓</span>
                    <span v-else class="text-orange-400">△</span>
                  </div>
                  <h4 class="text-white font-medium mb-1">剧本适配度</h4>
                  <p class="text-gray-400 text-sm">
                    {{ characterScenarios.length }}个适配剧本
                  </p>
                </div>
              </div>

              <div class="mt-4 p-3 bg-black/20 rounded-lg">
                <p class="text-purple-300 text-sm">
                  💡 <strong>时空酒馆提示：</strong>这个角色已经完全适配时空酒馆系统，可以与其他时空角色进行深度互动，体验跨时代的文化碰撞与性格化学反应！
                </p>
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

// MBTI 类型描述
const getMbtiDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'INTJ': '建筑师型人格 - 富有想象力和战略性的思想家，一切皆在计划之中',
    'ENFJ': '主人公型人格 - 富有魅力和鼓舞人心的领导者，有能力让听众着迷',
    'INFJ': '提倡者型人格 - 富有创造力和洞察力的理想主义者，善于理解他人',
    'ISFJ': '守护者型人格 - 非常专注和温暖的守护者，时刻准备着保护爱的人',
    'ESFJ': '执政官型人格 - 极有同情心和受欢迎的合作者，总是热心助人',
    'INFP': '调停者型人格 - 诗意而仁慈的利他主义者，总是热衷于帮助好的事业',
    'INTP': '思想家型人格 - 具有创造性的思想家，对知识有着不可遏制的渴望',
    'ENTJ': '指挥官型人格 - 大胆而富有想象力的领导者，会为了愿景而奋斗',
    'ENTP': '辩论家型人格 - 聪明而充满好奇心的思想家，不会拒绝智力上的挑战',
    'ENFP': '竞选者型人格 - 热情而富有创造力的激励者，能看到生活中所有的可能性',
    'ESFP': '娱乐家型人格 - 自发的、热情和友好的娱乐者，乐于生活的每一刻',
    'ISTJ': '物流师型人格 - 实际和注重事实的可靠者，值得信赖',
    'ISTP': '鉴赏家型人格 - 大胆而实际的实验者，擅长使用各种工具',
    'ISFP': '探险家型人格 - 灵活而迷人的艺术家，时刻准备探索新的可能性',
    'ESTJ': '总经理型人格 - 出色的管理者，在管理事物或人员方面无与伦比',
    'ESTP': '企业家型人格 - 聪明、精力充沛和善于感知的企业家，真正地享受生活'
  }
  return descriptions[type] || `${type}人格类型 - 独特的性格特征等待探索`
}

// 关系类型颜色
const getRelationTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'complementary': 'success',
    'mentor_student': 'primary',
    'professional': 'info',
    'protector_ward': 'warning',
    'cultural_exchange': 'info',
    'technology_magic': 'primary'
  }
  return colors[type] || 'info'
}

// 关系类型标签
const getRelationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'complementary': '互补关系',
    'mentor_student': '师徒关系',
    'professional': '专业联盟',
    'protector_ward': '守护关系',
    'cultural_exchange': '文化交流',
    'technology_magic': '科技魔法'
  }
  return labels[type] || type
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
