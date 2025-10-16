<template>
  <div class="scenario-detail">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <LoadingOverlay message="加载剧本详情中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <TavernCard class="error-card">
        <div class="error-content">
          <TavernIcon name="warning" size="xl" class="error-icon" />
          <h3 class="error-title">加载失败</h3>
          <p class="error-message">{{ error }}</p>
          <div class="error-actions">
            <TavernButton type="primary" @click="loadScenario">
              重新加载
            </TavernButton>
            <TavernButton @click="$router.push('/scenarios')">
              返回列表
            </TavernButton>
          </div>
        </div>
      </TavernCard>
    </div>

    <!-- 正常内容 -->
    <div v-else-if="scenario || enhancedScenario" class="scenario-content" :class="`scenario-theme--${getScenarioTheme()}`">
      <!-- 沉浸式页面头部 -->
      <div class="immersive-header" :style="getHeaderBackground()">
        <div class="immersive-header__overlay">
          <div class="immersive-header__content">
            <div class="breadcrumb-nav">
              <nav class="breadcrumb-items">
                <router-link to="/" class="breadcrumb-item">首页</router-link>
                <span class="breadcrumb-separator">›</span>
                <router-link to="/scenarios" class="breadcrumb-item">剧本管理</router-link>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item current">{{ currentScenarioData?.name || '剧本详情' }}</span>
              </nav>
            </div>

            <div class="immersive-header__main">
              <h1 class="immersive-title">
                <span class="title-text">{{ currentScenarioData?.name || '' }}</span>
                <div class="title-decorations">
                  <div class="decoration-line decoration-left"></div>
                  <div class="decoration-icon">{{ getScenarioIcon() }}</div>
                  <div class="decoration-line decoration-right"></div>
                </div>
              </h1>
              <p class="immersive-subtitle">{{ currentScenarioData?.description || '无描述' }}</p>

              <div class="immersive-meta">
                <div class="meta-badges">
                  <TavernBadge
                    :variant="currentScenarioData?.isPublic ? 'success' : 'warning'"
                    :text="currentScenarioData?.isPublic ? '公开' : '私有'"
                    class="meta-badge"
                  />
                  <TavernBadge
                    v-if="isEnhanced"
                    variant="primary"
                    text="增强剧本"
                    class="meta-badge enhanced"
                  />
                  <TavernBadge
                    v-if="getScenarioGenre()"
                    :text="getScenarioGenre()"
                    variant="secondary"
                    class="meta-badge genre"
                  />
                </div>

                <div class="immersive-actions">
                  <TavernButton
                    @click="editScenario"
                    variant="primary"
                    size="lg"
                    class="action-btn primary-action"
                  >
                    <TavernIcon name="edit" class="mr-2" />
                    编辑剧本
                  </TavernButton>

                  <div class="dropdown-wrapper">
                    <TavernButton @click="toggleDropdown" class="dropdown-trigger action-btn">
                      <TavernIcon name="menu" />
                    </TavernButton>
                    <div v-if="showDropdown" class="dropdown-menu" @click="hideDropdown">
                      <button @click="handleCommand('clone')" class="dropdown-item">
                        <TavernIcon name="document" class="mr-2" />
                        复制剧本
                      </button>
                      <button @click="handleCommand('export')" class="dropdown-item">
                        <TavernIcon name="download" class="mr-2" />
                        导出剧本
                      </button>
                      <div class="dropdown-divider"></div>
                      <button @click="handleCommand('test')" class="dropdown-item">
                        <TavernIcon name="sparkles" class="mr-2" />
                        测试匹配
                      </button>
                      <div class="dropdown-divider"></div>
                      <button @click="handleCommand('delete')" class="dropdown-item danger">
                        <TavernIcon name="delete" class="mr-2" />
                        删除剧本
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 沉浸式背景动画效果 -->
            <div class="immersive-particles">
              <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 沉浸式主内容区域 -->
      <div class="immersive-content">
        <!-- 剧本核心信息 -->
        <div class="scenario-core-info">
          <div class="core-info-container">
            <div class="info-section">
              <h2 class="section-title-with-icon">
                <TavernIcon name="scroll" class="section-icon" />
                世界观设定
              </h2>
              <div class="world-description">
                <div class="description-text">
                  {{ currentScenarioData?.description || '暂无描述' }}
                </div>
              </div>
            </div>

            <div v-if="currentScenarioData?.content" class="info-section">
              <h2 class="section-title-with-icon">
                <TavernIcon name="book-open" class="section-icon" />
                详细内容
              </h2>
              <div class="content-detail">
                <div class="content-text">
                  {{ currentScenarioData.content }}
                </div>
              </div>
            </div>

            <!-- 增强剧本的额外信息 -->
            <div v-if="isEnhanced && enhancedScenario?.genre" class="info-section">
              <h2 class="section-title-with-icon">
                <TavernIcon name="tag" class="section-icon" />
                题材类型
              </h2>
              <div class="genre-info">
                <TavernBadge
                  :text="enhancedScenario.genre"
                  :variant="getGenreVariant(enhancedScenario.genre)"
                  size="lg"
                />
                <p class="genre-description">{{ getGenreDescription(enhancedScenario.genre) }}</p>
              </div>
            </div>

            <div v-if="isEnhanced && enhancedScenario?.complexity" class="info-section">
              <h2 class="section-title-with-icon">
                <TavernIcon name="cog" class="section-icon" />
                复杂度评估
              </h2>
              <div class="complexity-info">
                <div class="complexity-visual">
                  <div class="complexity-bar">
                    <div
                      class="complexity-fill"
                      :class="`complexity-${enhancedScenario.complexity.toLowerCase()}`"
                      :style="{ width: getComplexityWidth(enhancedScenario.complexity) }"
                    ></div>
                  </div>
                  <TavernBadge
                    :text="enhancedScenario.complexity"
                    :variant="complexityVariant(enhancedScenario.complexity)"
                    class="complexity-badge"
                  />
                </div>
                <p class="complexity-description">{{ getComplexityDescription(enhancedScenario.complexity) }}</p>
              </div>
            </div>
          </div>
        </div>

  
        <!-- 世界信息预览 -->
        <TavernCard class="entries-preview">
          <div class="entries-header">
            <h3 class="section-title">
              世界信息条目 ({{ currentScenarioData?.worldInfoEntries?.length || 0 }})
            </h3>
            <TavernButton
              @click="editScenario"
              size="sm"
              variant="primary"
              outline
            >
              管理条目
            </TavernButton>
          </div>

          <div v-if="!currentScenarioData?.worldInfoEntries || currentScenarioData.worldInfoEntries.length === 0" class="empty-state">
            <TavernIcon name="document" size="xl" class="empty-icon" />
            <h4 class="empty-title">暂无世界信息条目</h4>
            <p class="empty-description">开始添加条目来丰富你的剧本世界观</p>
            <TavernButton variant="primary" @click="editScenario">
              添加第一个条目
            </TavernButton>
          </div>

          <div v-else class="entries-grid">
            <TavernCard
              v-for="entry in currentScenarioData.worldInfoEntries.slice(0, 6)"
              :key="entry.id"
              class="entry-card"
              variant="secondary"
            >
              <div class="entry-header">
                <h4 class="entry-title">
                  {{ entry.title }}
                </h4>
                <TavernBadge
                  :variant="entry.isActive ? 'success' : 'secondary'"
                  :text="entry.isActive ? '活跃' : '禁用'"
                />
              </div>

              <p class="entry-content">
                {{ entry.content }}
              </p>

              <div class="entry-meta">
                <span class="entry-keywords">{{ entry.keywords?.length || 0 }} 个关键词</span>
                <span class="entry-priority">优先级 {{ entry.priority }}</span>
              </div>
            </TavernCard>

            <div
              v-if="currentScenarioData.worldInfoEntries.length > 6"
              class="more-entries-card"
              @click="editScenario"
            >
              <div class="more-content">
                <div class="more-count">
                  +{{ currentScenarioData.worldInfoEntries.length - 6 }}
                </div>
                <div class="more-text">更多条目</div>
              </div>
            </div>
          </div>
        </TavernCard>

        <!-- 关联角色展示 -->
        <TavernCard class="related-characters">
          <div class="section-header">
            <h3 class="section-title">
              <TavernIcon name="user" class="mr-2" />
              关联角色 ({{ relatedCharacters.length }})
            </h3>
            <TavernButton
              v-if="relatedCharacters.length > 0"
              @click="viewAllCharacters"
              size="sm"
              variant="primary"
              outline
            >
              查看全部
            </TavernButton>
          </div>

          <div v-if="loadingCharacters" class="loading-state">
            <LoadingOverlay message="加载角色中..." />
          </div>

          <div v-else-if="relatedCharacters.length === 0" class="empty-state">
            <TavernIcon name="user" size="xl" class="empty-icon" />
            <h4 class="empty-title">暂无关联角色</h4>
            <p class="empty-description">为此剧本添加一些角色来丰富故事体验</p>
            <TavernButton variant="primary" @click="$router.push('/studio/character/create')">
              创建角色
            </TavernButton>
          </div>

          <div v-else class="characters-grid">
            <div
              v-for="character in relatedCharacters.slice(0, 6)"
              :key="character.id"
              class="character-card"
              @click="goToCharacter(character.id)"
            >
              <div class="character-avatar-container">
                <img
                  :src="character.avatar || '/default-avatar.png'"
                  :alt="character.name"
                  class="character-avatar"
                  @error="handleImageError"
                />
                <div class="character-status-badge">
                  <TavernBadge
                    :variant="character.isPublic ? 'success' : 'secondary'"
                    :text="character.isPublic ? '公开' : '私有'"
                    size="small"
                  />
                </div>
              </div>

              <div class="character-info">
                <h4 class="character-name">{{ character.name }}</h4>
                <p class="character-description">
                  {{ character.description || '暂无描述' }}
                </p>

                <div class="character-meta">
                  <div class="character-stats">
                    <span class="stat-item">
                      <TavernIcon name="heart" size="sm" />
                      {{ character.favoriteCount || 0 }}
                    </span>
                    <span class="stat-item">
                      <TavernIcon name="message" size="sm" />
                      {{ character.chatCount || 0 }}
                    </span>
                    <span class="stat-item">
                      <TavernIcon name="star" size="sm" />
                      {{ character.rating || 0 }}
                    </span>
                  </div>

                  <div class="character-tags" v-if="character.tags && character.tags.length > 0">
                    <TavernBadge
                      v-for="tag in character.tags.slice(0, 2)"
                      :key="tag"
                      :text="tag"
                      variant="secondary"
                      size="small"
                    />
                  </div>
                </div>
              </div>

              <!-- 背景图预览按钮 -->
              <div v-if="character.backgroundImage" class="background-preview-btn">
                <TavernButton
                  @click.stop="previewBackground(character)"
                  size="sm"
                  variant="ghost"
                  title="预览背景图"
                >
                  <TavernIcon name="image" size="sm" />
                </TavernButton>
              </div>
            </div>

            <!-- 显示更多角色的指示器 -->
            <div v-if="relatedCharacters.length > 6" class="more-characters-indicator">
              <div class="more-count">
                +{{ relatedCharacters.length - 6 }}
              </div>
              <div class="more-text">更多角色</div>
            </div>
          </div>
        </TavernCard>

        <!-- 场景背景图预览 -->
        <TavernCard v-if="scenarioBackgrounds.length > 0" class="scenario-backgrounds">
          <div class="section-header">
            <h3 class="section-title">
              <TavernIcon name="image" class="mr-2" />
              场景背景图 ({{ scenarioBackgrounds.length }})
            </h3>
          </div>

          <div class="backgrounds-gallery">
            <div
              v-for="(background, index) in scenarioBackgrounds"
              :key="index"
              class="background-item"
              @click="previewBackgroundImage(background)"
            >
              <img
                :src="background.url"
                :alt="background.description"
                class="background-image"
                @error="handleBackgroundImageError"
              />
              <div class="background-overlay">
                <div class="background-info">
                  <h5 class="background-title">{{ background.title }}</h5>
                  <p class="background-description">{{ background.description }}</p>
                </div>
                <TavernButton
                  size="sm"
                  variant="primary"
                  @click.stop="useBackground(background)"
                >
                  使用背景
                </TavernButton>
              </div>
            </div>
          </div>
        </TavernCard>

        <!-- 增强世界建设功能展示 -->
        <div v-if="isEnhanced && enhancedScenario" class="enhanced-features">
          <!-- 世界地点 -->
          <TavernCard v-if="enhancedScenario.worldLocations?.length" class="world-section">
            <div class="section-header">
              <h3 class="section-title">
                <TavernIcon name="location" class="mr-2" />
                世界地点 ({{ enhancedScenario.worldLocations.length }})
              </h3>
            </div>
            <div class="world-grid">
              <div
                v-for="location in enhancedScenario.worldLocations.slice(0, 4)"
                :key="location.id"
                class="world-item"
              >
                <div class="world-item-header">
                  <h4 class="world-item-title">{{ location.name }}</h4>
                  <TavernBadge :text="location.type" variant="secondary" />
                </div>
                <p class="world-item-description">{{ location.description }}</p>
                <div class="world-item-meta">
                  <span class="meta-item">重要性: {{ location.significance }}</span>
                  <span class="meta-item">氛围: {{ location.atmosphere }}</span>
                </div>
              </div>
            </div>
          </TavernCard>

          <!-- 世界事件 -->
          <TavernCard v-if="enhancedScenario.worldEvents?.length" class="world-section">
            <div class="section-header">
              <h3 class="section-title">
                <TavernIcon name="calendar" class="mr-2" />
                世界事件 ({{ enhancedScenario.worldEvents.length }})
              </h3>
            </div>
            <div class="world-grid">
              <div
                v-for="event in enhancedScenario.worldEvents.slice(0, 4)"
                :key="event.id"
                class="world-item"
              >
                <div class="world-item-header">
                  <h4 class="world-item-title">{{ event.name }}</h4>
                  <TavernBadge :text="`重要性 ${event.importance}`" variant="primary" />
                </div>
                <p class="world-item-description">{{ event.description }}</p>
                <div class="world-item-meta">
                  <span class="meta-item">时间: {{ event.timeline || '未设定' }}</span>
                  <span class="meta-item">影响: {{ event.consequences || '未知' }}</span>
                </div>
              </div>
            </div>
          </TavernCard>

          <!-- 世界组织 -->
          <TavernCard v-if="enhancedScenario.worldOrganizations?.length" class="world-section">
            <div class="section-header">
              <h3 class="section-title">
                <TavernIcon name="users" class="mr-2" />
                世界组织 ({{ enhancedScenario.worldOrganizations.length }})
              </h3>
            </div>
            <div class="world-grid">
              <div
                v-for="org in enhancedScenario.worldOrganizations.slice(0, 4)"
                :key="org.id"
                class="world-item"
              >
                <div class="world-item-header">
                  <h4 class="world-item-title">{{ org.name }}</h4>
                  <TavernBadge :text="org.type" variant="secondary" />
                </div>
                <p class="world-item-description">{{ org.description }}</p>
                <div class="world-item-meta">
                  <span class="meta-item">影响力: {{ org.influence }}</span>
                  <span class="meta-item">目标: {{ org.goals || '未知' }}</span>
                </div>
              </div>
            </div>
          </TavernCard>

          <!-- 世界文化 -->
          <TavernCard v-if="enhancedScenario.worldCultures?.length" class="world-section">
            <div class="section-header">
              <h3 class="section-title">
                <TavernIcon name="star" class="mr-2" />
                世界文化 ({{ enhancedScenario.worldCultures.length }})
              </h3>
            </div>
            <div class="world-grid">
              <div
                v-for="culture in enhancedScenario.worldCultures"
                :key="culture.id"
                class="world-item"
              >
                <div class="world-item-header">
                  <h4 class="world-item-title">{{ culture.name }}</h4>
                  <TavernBadge :text="culture.type" variant="secondary" />
                </div>
                <p class="world-item-description">{{ culture.description }}</p>
                <div class="world-item-meta">
                  <span class="meta-item">价值观: {{ culture.values || '未设定' }}</span>
                  <span class="meta-item">传统: {{ culture.traditions || '未设定' }}</span>
                </div>
              </div>
            </div>
          </TavernCard>

          <!-- 世界物品 -->
          <TavernCard v-if="enhancedScenario.worldItems?.length" class="world-section">
            <div class="section-header">
              <h3 class="section-title">
                <TavernIcon name="sparkles" class="mr-2" />
                世界物品 ({{ enhancedScenario.worldItems.length }})
              </h3>
            </div>
            <div class="world-grid">
              <div
                v-for="item in enhancedScenario.worldItems"
                :key="item.id"
                class="world-item"
              >
                <div class="world-item-header">
                  <h4 class="world-item-title">{{ item.name }}</h4>
                  <TavernBadge :text="item.type" variant="secondary" />
                </div>
                <p class="world-item-description">{{ item.description }}</p>
                <div class="world-item-meta">
                  <span class="meta-item">稀有度: {{ item.rarity }}</span>
                  <span class="meta-item">功能: {{ item.properties || '未知' }}</span>
                </div>
              </div>
            </div>
          </TavernCard>

          <!-- 世界规则 -->
          <TavernCard v-if="enhancedScenario.worldRules?.length" class="world-section">
            <div class="section-header">
              <h3 class="section-title">
                <TavernIcon name="shield" class="mr-2" />
                世界规则 ({{ enhancedScenario.worldRules.length }})
              </h3>
            </div>
            <div class="rules-list">
              <div
                v-for="rule in enhancedScenario.worldRules"
                :key="rule.id"
                class="rule-item"
              >
                <div class="rule-header">
                  <h4 class="rule-title">{{ rule.name }}</h4>
                  <TavernBadge :text="rule.category" variant="secondary" />
                </div>
                <p class="rule-description">{{ rule.description }}</p>
                <div class="rule-meta">
                  <span class="meta-item">适用范围: {{ rule.scope || '全局' }}</span>
                  <span class="meta-item">限制: {{ rule.limitations || '无' }}</span>
                </div>
              </div>
            </div>
          </TavernCard>
        </div>
      </div>
    </div>

    <!-- 测试对话框 -->
    <ScenarioTestDialog
      v-if="showTestDialog"
      :scenario="currentScenarioData"
      @close="showTestDialog = false"
    />

    <!-- 确认删除对话框 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
      <TavernCard class="delete-dialog" @click.stop>
        <div class="delete-content">
          <TavernIcon name="warning" size="xl" class="delete-icon" />
          <h3 class="delete-title">确认删除</h3>
          <p class="delete-message">
            确定要删除剧本 "{{ currentScenarioData?.name }}" 吗？此操作不可恢复。
          </p>
          <div class="delete-actions">
            <TavernButton @click="showDeleteDialog = false">
              取消
            </TavernButton>
            <TavernButton variant="danger" @click="confirmDelete">
              删除
            </TavernButton>
          </div>
        </div>
      </TavernCard>
    </div>

    <!-- 克隆剧本对话框 -->
    <div v-if="showCloneDialog" class="dialog-overlay" @click="showCloneDialog = false">
      <TavernCard class="clone-dialog" @click.stop>
        <div class="clone-content">
          <h3 class="clone-title">复制剧本</h3>
          <p class="clone-description">请输入新剧本的名称：</p>
          <TavernInput
            v-model="cloneName"
            placeholder="输入剧本名称"
            class="clone-input"
          />
          <div class="clone-actions">
            <TavernButton @click="showCloneDialog = false">
              取消
            </TavernButton>
            <TavernButton variant="primary" @click="confirmClone" :disabled="!cloneName.trim()">
              复制
            </TavernButton>
          </div>
        </div>
      </TavernCard>
    </div>

    <!-- 背景预览模态框 -->
    <div v-if="showBackgroundPreview && selectedBackground" class="background-preview-modal" @click="showBackgroundPreview = false">
      <div class="background-preview-content" @click.stop>
        <button class="background-preview-close" @click="showBackgroundPreview = false">
          <TavernIcon name="close" />
        </button>
        <img
          :src="selectedBackground.url"
          :alt="selectedBackground.name"
          class="background-preview-image"
          @error="handleImageError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'
import TavernInput from '@/components/design-system/TavernInput.vue'
import ScenarioTestDialog from '@/components/scenario/ScenarioTestDialog.vue'
import { useScenarioStore } from '@/stores/scenario'
import type { Scenario } from '@/types/scenario'
import { api } from '@/services/api'

// 路由
const route = useRoute()
const router = useRouter()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const showTestDialog = ref(false)
const showDropdown = ref(false)
const showDeleteDialog = ref(false)
const showCloneDialog = ref(false)
const cloneName = ref('')
const enhancedScenario = ref(null)
const isEnhanced = ref(false)
const relatedCharacters = ref([])
const loadingCharacters = ref(false)
const scenarioBackgrounds = ref([])
const selectedBackground = ref(null)
const showBackgroundPreview = ref(false)

// 计算属性
const {
  currentScenario: scenario,
  isLoading,
  error
} = scenarioStore

const currentScenarioData = computed(() => {
  return isEnhanced.value ? enhancedScenario.value : scenario.value
})

const breadcrumbItems = computed(() => [
  { text: '首页', to: '/' },
  { text: '剧本管理', to: '/scenarios' },
  { text: currentScenarioData.value?.name || '剧本详情', to: `/scenarios/${route.params.id}` }
])

const activeEntriesCount = computed(() => {
  if (isEnhanced.value) {
    if (!enhancedScenario.value?.worldInfoEntries) return 0
    return enhancedScenario.value.worldInfoEntries.filter(entry => entry.isActive).length
  } else {
    if (!scenario.value?.worldInfoEntries) return 0
    return scenario.value.worldInfoEntries.filter(entry => entry.isActive).length
  }
})

// 方法
const loadScenario = async () => {
  const scenarioId = route.params.id as string
  if (!scenarioId) return

  try {
    // 使用统一的数据加载逻辑
    scenarioStore.isLoading = true
    scenarioStore.error = null

    // 重置状态
    enhancedScenario.value = null
    isEnhanced.value = false

    // 首先尝试加载增强剧本
    try {
      const response = await api.get(`/api/enhanced-scenarios/${scenarioId}`)
      if (response.data) {
        // 检查是否是增强剧本：只要有基本的增强字段存在就算增强剧本
        const hasEnhancedFields = response.data.worldSetting ||
                                response.data.genre ||
                                response.data.complexity ||
                                response.data.worldLocations ||
                                response.data.worldEvents ||
                                response.data.worldOrganizations ||
                                response.data.worldCultures ||
                                response.data.worldItems ||
                                response.data.worldRules ||
                                response.data.worldInfos

        if (hasEnhancedFields) {
          enhancedScenario.value = response.data
          isEnhanced.value = true
          console.log('✅ 加载增强剧本成功:', enhancedScenario.value)
          return
        }
      }
    } catch (enhancedError) {
      console.log('ℹ️ 增强剧本不存在，回退到普通剧本:', enhancedError.response?.status)
    }

    // 如果增强剧本不存在或没有增强字段，加载普通剧本
    await scenarioStore.fetchScenario(scenarioId)
    isEnhanced.value = false
    console.log('✅ 加载普通剧本成功:', scenarioStore.currentScenario)

  } catch (error) {
    console.error('❌ 加载剧本失败:', error)
    scenarioStore.error = error.message || '加载剧本失败'
  } finally {
    scenarioStore.isLoading = false
  }
}

const editScenario = () => {
  const scenarioData = currentScenarioData.value
  if (scenarioData) {
    router.push(`/scenarios/${scenarioData.id}/edit`)
  }
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const hideDropdown = () => {
  showDropdown.value = false
}

const handleCommand = async (command: string) => {
  const scenarioData = currentScenarioData.value
  if (!scenarioData) return

  switch (command) {
    case 'clone':
      showCloneDialog.value = true
      cloneName.value = `${scenarioData.name} (副本)`
      break
    case 'export':
      await handleExport()
      break
    case 'test':
      showTestDialog.value = true
      break
    case 'delete':
      showDeleteDialog.value = true
      break
  }
}

const handleExport = async () => {
  const scenarioData = currentScenarioData.value
  if (!scenarioData) return

  try {
    // 这里需要实现导出功能
    console.log('导出功能开发中...')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

const confirmClone = async () => {
  const scenarioData = currentScenarioData.value
  if (!scenarioData || !cloneName.value.trim()) return

  try {
    const newScenario = await scenarioStore.createScenario({
      name: cloneName.value.trim(),
      description: scenarioData.description,
      category: scenarioData.category,
      tags: [...(scenarioData.tags || [])],
      isPublic: false
    })

    showCloneDialog.value = false
    cloneName.value = ''
    console.log('剧本复制成功')
    router.push(`/scenarios/${newScenario.id}/edit`)
  } catch (error) {
    console.error('复制剧本失败:', error)
  }
}

const confirmDelete = async () => {
  const scenarioData = currentScenarioData.value
  if (!scenarioData) return

  try {
    await scenarioStore.deleteScenario(scenarioData.id)
    showDeleteDialog.value = false
    console.log('剧本删除成功')
    router.push('/scenarios')
  } catch (error) {
    console.error('删除剧本失败:', error)
  }
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const distance = formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    })
    const formatted = format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })
    return `${distance} (${formatted})`
  } catch {
    return '未知'
  }
}

// 处理点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-wrapper')) {
    showDropdown.value = false
  }
}

// 加载关联角色
const loadCharacters = async () => {
  const scenarioData = currentScenarioData.value
  if (!scenarioData?.id) return

  loadingCharacters.value = true
  try {
    // 统一使用API调用获取剧本关联角色
    const response = await fetch(`/api/scenarios/${scenarioData.id}/characters`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，添加Authorization header
        ...(localStorage.getItem('token') && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        relatedCharacters.value = result.data || []
      } else {
        console.error('获取角色失败:', result.error)
        relatedCharacters.value = []
      }
    } else {
      console.error('API调用失败:', response.status, response.statusText)
      relatedCharacters.value = []
    }
  } catch (error) {
    console.error('加载关联角色失败:', error)
    relatedCharacters.value = []
    // 可以显示用户友好的错误提示
    ElMessage.error('加载角色信息失败，请稍后重试')
  } finally {
    loadingCharacters.value = false
  }
}

// 加载场景背景图
const loadBackgrounds = async () => {
  const scenarioData = currentScenarioData.value
  if (!scenarioData?.id) return

  try {
    // 设置默认的场景背景图库
    // 后期可以改为从API获取或用户自定义
    scenarioBackgrounds.value = [
      {
        id: 'bg1',
        name: '酒馆内景',
        url: '/uploads/scenarios/backgrounds/timespace-tavern-interior.jpg',
        description: '酒馆内部的神秘氛围'
      },
      {
        id: 'bg2',
        name: '星际港口',
        url: '/uploads/scenarios/backgrounds/stellar-port.jpg',
        description: '繁忙的星际贸易港口'
      },
      {
        id: 'bg3',
        name: '魔法图书馆',
        url: '/uploads/scenarios/backgrounds/magic-library.jpg',
        description: '充满古老魔法书籍的图书馆'
      },
      {
        id: 'bg4',
        name: '赛博都市',
        url: '/uploads/scenarios/backgrounds/cyber-city.jpg',
        description: '霓虹闪烁的未来都市'
      },
      {
        id: 'bg5',
        name: '废土风景',
        url: '/uploads/scenarios/backgrounds/wasteland-scene.jpg',
        description: '荒凉的末世景象'
      }
    ]

    // 如果剧本有设置背景图，则设置为当前背景
    if (scenarioData.backgroundImage) {
      const existingBg = scenarioBackgrounds.value.find(bg => bg.url === scenarioData.backgroundImage)
      if (existingBg) {
        selectedBackground.value = existingBg
      } else {
        // 如果是自定义背景，添加到列表
        const customBg = {
          id: 'custom',
          name: '自定义背景',
          url: scenarioData.backgroundImage,
          description: '剧本自定义背景'
        }
        scenarioBackgrounds.value.unshift(customBg)
        selectedBackground.value = customBg
      }
    }
  } catch (error) {
    console.error('加载背景图片失败:', error)
  }
}

// 预览背景图片
const previewBackground = (image: any) => {
  selectedBackground.value = image
  showBackgroundPreview.value = true
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 避免无限循环
  if (img.src.includes('placeholder-character.png')) return

  // 设置更优雅的默认占位符图片
  img.src = '/placeholder-character.png'
  img.alt = '头像加载失败'

  // 添加错误样式
  img.classList.add('error-placeholder')
}

// 处理背景图片加载错误
const handleBackgroundImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 避免无限循环
  if (img.src.includes('placeholder-background.jpg')) return

  // 设置默认背景占位符
  img.src = '/placeholder-background.jpg'
  img.alt = '背景图加载失败'

  // 添加错误样式
  img.classList.add('error-placeholder')
}

// 跳转到角色详情
const goToCharacter = (characterId: string) => {
  router.push(`/characters/${characterId}`)
}

// 查看所有角色
const viewAllCharacters = () => {
  const scenarioData = currentScenarioData.value
  if (scenarioData?.id) {
    router.push(`/scenarios/${scenarioData.id}/characters`)
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadScenario()
  await loadCharacters()
  await loadBackgrounds()
  document.addEventListener('click', handleClickOutside)
})

// 沉浸式设计相关方法
const getScenarioTheme = () => {
  const scenarioData = currentScenarioData.value
  if (!scenarioData) return 'default'

  // 根据剧本类型和内容返回主题类型
  if (scenarioData.category?.includes('科幻') || scenarioData.tags?.some(tag => tag.includes('科幻'))) {
    return 'scifi'
  } else if (scenarioData.category?.includes('奇幻') || scenarioData.tags?.some(tag => tag.includes('奇幻'))) {
    return 'fantasy'
  } else if (scenarioData.category?.includes('悬疑') || scenarioData.tags?.some(tag => tag.includes('悬疑'))) {
    return 'mystery'
  } else if (scenarioData.category?.includes('恐怖') || scenarioData.tags?.some(tag => tag.includes('恐怖'))) {
    return 'horror'
  } else if (scenarioData.category?.includes('历史') || scenarioData.tags?.some(tag => tag.includes('历史'))) {
    return 'historical'
  } else if (isEnhanced.value && enhancedScenario.value?.genre) {
    const genre = enhancedScenario.value.genre.toLowerCase()
    if (genre.includes('sci-fi')) return 'scifi'
    if (genre.includes('fantasy')) return 'fantasy'
    if (genre.includes('mystery')) return 'mystery'
    if (genre.includes('horror')) return 'horror'
    if (genre.includes('historical')) return 'historical'
  }

  return 'default'
}

const getHeaderBackground = () => {
  const theme = getScenarioTheme()
  const themeGradients = {
    scifi: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #e94560 100%)',
    fantasy: 'linear-gradient(135deg, #2d1b69 0%, #0f3460 25%, #533483 50%, #c77dff 75%, #e7c6ff 100%)',
    mystery: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #3a3a3a 50%, #4a4a4a 75%, #5a5a5a 100%)',
    horror: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 25%, #2a0a0a 50%, #3a0a0a 75%, #4a0a0a 100%)',
    historical: 'linear-gradient(135deg, #3e2723 0%, #5d4037 25%, #6d4c41 50%, #795548 75%, #8d6e63 100%)',
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #fecfef 75%, #fecfef 100%)'
  }

  return {
    background: themeGradients[theme] || themeGradients.default,
    position: 'relative',
    overflow: 'hidden'
  }
}

const getScenarioIcon = () => {
  const theme = getScenarioTheme()
  const themeIcons = {
    scifi: '🚀',
    fantasy: '🔮',
    mystery: '🔍',
    horror: '🌙',
    historical: '📜',
    default: '📖'
  }

  return themeIcons[theme] || themeIcons.default
}

const getParticleStyle = (index: number) => {
  const theme = getScenarioTheme()
  const particleColors = {
    scifi: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6b6b'],
    fantasy: ['#ffd700', '#ff69b4', '#00ffff', '#98fb98', '#dda0dd'],
    mystery: ['#808080', '#a9a9a9', '#c0c0c0', '#dcdcdc', '#f5f5f5'],
    horror: ['#8b0000', '#dc143c', '#ff0000', '#ff6347', '#ff4500'],
    historical: ['#daa520', '#cd853f', '#d2691e', '#8b4513', '#a0522d'],
    default: ['#667eea', '#764ba2', '#f093fb', '#fecfef', '#fecfef']
  }

  const colors = particleColors[theme] || particleColors.default
  const color = colors[index % colors.length]

  return {
    position: 'absolute',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
    backgroundColor: color,
    borderRadius: '50%',
    opacity: Math.random() * 0.8 + 0.2,
    animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
    animationDelay: `${Math.random() * 2}s`,
    boxShadow: `0 0 ${Math.random() * 10 + 5}px ${color}`
  }
}

const getScenarioGenre = () => {
  if (isEnhanced.value && enhancedScenario.value?.genre) {
    return enhancedScenario.value.genre
  }
  return currentScenarioData.value?.category || ''
}

const getGenreVariant = (genre: string) => {
  const lowerGenre = genre.toLowerCase()
  if (lowerGenre.includes('sci-fi') || lowerGenre.includes('科幻')) return 'primary'
  if (lowerGenre.includes('fantasy') || lowerGenre.includes('奇幻')) return 'success'
  if (lowerGenre.includes('mystery') || lowerGenre.includes('悬疑')) return 'warning'
  if (lowerGenre.includes('horror') || lowerGenre.includes('恐怖')) return 'danger'
  if (lowerGenre.includes('historical') || lowerGenre.includes('历史')) return 'info'
  return 'secondary'
}

const getGenreDescription = (genre: string) => {
  const descriptions: Record<string, string> = {
    'Sci-Fi': '探索未来世界的无限可能性，科技与人文的交织',
    'Fantasy': '魔法与神话的世界，奇幻冒险的史诗故事',
    'Mystery': '迷雾重重的案件，需要智慧与洞察力来解开',
    'Horror': '深入恐惧的边缘，体验心跳加速的刺激',
    'Historical': '穿越时空的长河，重现历史的重要时刻',
    'Romance': '浪漫温馨的爱情故事，感受真挚的情感',
    'Action': '紧张刺激的动作场面，充满肾上腺素的体验',
    'Comedy': '轻松幽默的剧情，带来欢声笑语',
    'Drama': '深刻感人的故事，探讨人性的复杂与美好'
  }

  return descriptions[genre] || '独特的故事类型，带来不同的体验'
}

const getComplexityWidth = (complexity: string) => {
  const widths: Record<string, string> = {
    'Simple': '25%',
    'Moderate': '50%',
    'Complex': '75%',
    'Very Complex': '100%',
    '简单': '25%',
    '中等': '50%',
    '复杂': '75%',
    '非常复杂': '100%'
  }

  return widths[complexity] || '50%'
}

const getComplexityDescription = (complexity: string) => {
  const descriptions: Record<string, string> = {
    'Simple': '适合新手，世界观简单易懂，容易上手',
    'Moderate': '适合有一定经验的玩家，世界观较为丰富',
    'Complex': '适合资深玩家，世界观复杂，需要深入理解',
    'Very Complex': '适合专业玩家，世界观极其复杂，充满挑战',
    '简单': '适合新手，世界观简单易懂，容易上手',
    '中等': '适合有一定经验的玩家，世界观较为丰富',
    '复杂': '适合资深玩家，世界观复杂，需要深入理解',
    '非常复杂': '适合专业玩家，世界观极其复杂，充满挑战'
  }

  return descriptions[complexity] || '复杂度未知'
}

const complexityVariant = (complexity: string) => {
  const lowerComplexity = complexity.toLowerCase()
  if (lowerComplexity.includes('simple') || lowerComplexity.includes('简单')) return 'success'
  if (lowerComplexity.includes('moderate') || lowerComplexity.includes('中等')) return 'warning'
  if (lowerComplexity.includes('complex') || lowerComplexity.includes('复杂')) return 'danger'
  if (lowerComplexity.includes('very') || lowerComplexity.includes('非常')) return 'danger'
  return 'secondary'
}

const previewBackgroundImage = (background: any) => {
  selectedBackground.value = background
  showBackgroundPreview.value = true
}

const useBackground = (background: any) => {
  // 这里可以实现使用背景图的逻辑
  console.log('使用背景图:', background)
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.scenario-detail {
  min-height: 100vh;
  background: var(--dt-color-background-primary);
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--dt-spacing-lg);
}

.error-card {
  max-width: 500px;
  text-align: center;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-spacing-lg);
}

.error-icon {
  color: var(--dt-color-warning);
}

.error-title {
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-primary);
  margin: 0;
}

.error-message {
  color: var(--dt-color-text-secondary);
  margin: 0;
}

.error-actions {
  display: flex;
  gap: var(--dt-spacing-md);
  flex-wrap: wrap;
}

.detail-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--dt-spacing-xl) var(--dt-spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  position: relative;
}

.dropdown-wrapper {
  position: relative;
}

.dropdown-trigger {
  padding: var(--dt-spacing-sm);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--dt-color-surface-primary);
  border: 1px solid var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  box-shadow: var(--dt-shadow-lg);
  min-width: 200px;
  z-index: 50;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--dt-spacing-md);
  border: none;
  background: none;
  color: var(--dt-color-text-primary);
  font-size: var(--dt-font-size-sm);
  cursor: pointer;
  transition: var(--dt-transition-fast);

  &:hover {
    background: var(--dt-color-surface-secondary);
  }

  &.danger {
    color: var(--dt-color-danger);

    &:hover {
      background: var(--dt-color-danger-light);
    }
  }
}

.dropdown-divider {
  height: 1px;
  background: var(--dt-color-border-secondary);
}

.scenario-info-card {
  padding: var(--dt-spacing-2xl);
}

.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--dt-spacing-2xl);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--dt-spacing-xl);
  }
}

.section-title {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin: 0 0 var(--dt-spacing-lg) 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-sm);
}

.info-label {
  font-size: var(--dt-font-size-sm);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-secondary);
}

.info-value {
  color: var(--dt-color-text-primary);
  margin: 0;
}

.content-preview {
  background: var(--dt-color-surface-secondary);
  padding: var(--dt-spacing-md);
  border-radius: var(--dt-radius-md);
  max-height: 120px;
  overflow-y: auto;
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-primary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-spacing-sm);
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xs);
}

.stat-label {
  font-size: var(--dt-font-size-sm);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-secondary);
}

.stat-value {
  font-size: var(--dt-font-size-base);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);

  &.stat-date {
    font-size: var(--dt-font-size-sm);
    font-weight: var(--dt-font-weight-normal);
  }
}

.entries-preview {
  padding: var(--dt-spacing-2xl);
  width: 100%;
  box-sizing: border-box;
}

.entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--dt-spacing-lg);
}

.empty-state {
  text-align: center;
  padding: var(--dt-spacing-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.empty-icon {
  color: var(--dt-color-text-tertiary);
}

.empty-title {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-secondary);
  margin: 0;
}

.empty-description {
  color: var(--dt-color-text-tertiary);
  margin: 0;
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--dt-spacing-lg);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.entry-card {
  padding: var(--dt-spacing-lg);
  transition: var(--dt-transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--dt-shadow-md);
  }
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--dt-spacing-sm);
  gap: var(--dt-spacing-sm);
}

.entry-title {
  font-size: var(--dt-font-size-md);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-content {
  color: var(--dt-color-text-secondary);
  font-size: var(--dt-font-size-sm);
  margin: 0 0 var(--dt-spacing-sm) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-tertiary);
}

.more-entries-card {
  background: var(--dt-color-surface-secondary);
  border: 2px dashed var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--dt-transition-fast);

  &:hover {
    background: var(--dt-color-surface-tertiary);
    border-color: var(--dt-color-border-primary);
  }
}

.more-content {
  text-align: center;
  padding: var(--dt-spacing-xl);
}

.more-count {
  font-size: var(--dt-font-size-2xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-secondary);
  margin-bottom: var(--dt-spacing-xs);
}

.more-text {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-tertiary);
}

// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--dt-spacing-lg);
}

.delete-dialog,
.clone-dialog {
  max-width: 500px;
  width: 100%;
}

.delete-content,
.clone-content {
  padding: var(--dt-spacing-2xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.delete-icon {
  color: var(--dt-color-warning);
  margin: 0 auto;
}

.delete-title,
.clone-title {
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-primary);
  margin: 0;
}

.delete-message,
.clone-description {
  color: var(--dt-color-text-secondary);
  margin: 0;
}

.delete-actions,
.clone-actions {
  display: flex;
  justify-content: center;
  gap: var(--dt-spacing-md);
  flex-wrap: wrap;
}

.clone-input {
  text-align: left;
}

// 增强功能样式
.enhanced-features {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.world-section {
  padding: var(--dt-spacing-2xl);
}

.section-header {
  margin-bottom: var(--dt-spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin: 0;
}

.world-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--dt-spacing-lg);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.world-item {
  background: var(--dt-color-surface-secondary);
  border: 1px solid var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  padding: var(--dt-spacing-lg);
  transition: var(--dt-transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--dt-shadow-md);
    border-color: var(--dt-color-border-primary);
  }
}

.world-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--dt-spacing-sm);
  gap: var(--dt-spacing-sm);
}

.world-item-title {
  font-size: var(--dt-font-size-md);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.world-item-description {
  color: var(--dt-color-text-secondary);
  font-size: var(--dt-font-size-sm);
  margin: 0 0 var(--dt-spacing-sm) 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.world-item-meta {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xs);
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-tertiary);
}

.meta-item {
  display: block;
}

// 世界规则特殊样式
.rules-list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.rule-item {
  background: var(--dt-color-surface-secondary);
  border: 1px solid var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  padding: var(--dt-spacing-lg);
  transition: var(--dt-transition-fast);

  &:hover {
    border-color: var(--dt-color-border-primary);
    box-shadow: var(--dt-shadow-sm);
  }
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--dt-spacing-sm);
  gap: var(--dt-spacing-sm);
}

.rule-title {
  font-size: var(--dt-font-size-md);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-primary);
  margin: 0;
  flex: 1;
}

.rule-description {
  color: var(--dt-color-text-secondary);
  font-size: var(--dt-font-size-sm);
  margin: 0 0 var(--dt-spacing-sm) 0;
}

.rule-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-spacing-md);
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-tertiary);
}

// 角色卡展示样式
.characters-section {
  padding: var(--dt-spacing-2xl);
  width: 100%;
  box-sizing: border-box;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--dt-spacing-lg);
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--dt-spacing-md);
  }
}

.character-card {
  background: var(--dt-color-surface-primary);
  border: 1px solid var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  overflow: hidden;
  transition: var(--dt-transition-fast);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--dt-shadow-lg);
    border-color: var(--dt-color-border-primary);
  }
}

.character-avatar {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--dt-color-surface-secondary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--dt-transition-fast);
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.character-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--dt-color-surface-secondary), var(--dt-color-surface-tertiary));
  color: var(--dt-color-text-tertiary);
  font-size: var(--dt-font-size-2xl);
}

.character-info {
  padding: var(--dt-spacing-lg);
}

.character-name {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin: 0 0 var(--dt-spacing-sm) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.character-description {
  color: var(--dt-color-text-secondary);
  font-size: var(--dt-font-size-sm);
  margin: 0 0 var(--dt-spacing-md) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-spacing-xs);
  margin-bottom: var(--dt-spacing-md);
}

.character-tag {
  padding: var(--dt-spacing-xs) var(--dt-spacing-sm);
  background: var(--dt-color-surface-tertiary);
  color: var(--dt-color-text-secondary);
  border-radius: var(--dt-radius-sm);
  font-size: var(--dt-font-size-xs);
  border: 1px solid var(--dt-color-border-tertiary);
}

.character-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-tertiary);
}

.character-rating {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-xs);
}

// 背景画廊样式
.backgrounds-section {
  padding: var(--dt-spacing-2xl);
  width: 100%;
  box-sizing: border-box;
}

.backgrounds-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--dt-spacing-md);
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

.background-item {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: var(--dt-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--dt-transition-fast);
  background: var(--dt-color-surface-secondary);

  &:hover {
    transform: scale(1.05);
    box-shadow: var(--dt-shadow-md);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.background-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--dt-color-surface-secondary), var(--dt-color-surface-tertiary));
  color: var(--dt-color-text-tertiary);
  font-size: var(--dt-font-size-lg);
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.7));
  display: flex;
  align-items: flex-end;
  padding: var(--dt-spacing-sm);
  opacity: 0;
  transition: var(--dt-transition-fast);
}

.background-item:hover .background-overlay {
  opacity: 1;
}

.background-label {
  color: white;
  font-size: var(--dt-font-size-sm);
  font-weight: var(--dt-font-weight-medium);
}

// 背景预览模态框
.background-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--dt-spacing-lg);
}

.background-preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.background-preview-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--dt-radius-lg);
}

.background-preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: var(--dt-font-size-2xl);
  cursor: pointer;
  padding: var(--dt-spacing-sm);
  border-radius: var(--dt-radius-sm);
  transition: var(--dt-transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

// 空状态样式
.characters-empty-state,
.backgrounds-empty-state {
  text-align: center;
  padding: var(--dt-spacing-3xl);
  color: var(--dt-color-text-tertiary);
}

.empty-state-icon {
  font-size: var(--dt-font-size-3xl);
  margin-bottom: var(--dt-spacing-md);
}

.empty-state-title {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-secondary);
  margin: 0 0 var(--dt-spacing-sm) 0;
}

.empty-state-description {
  color: var(--dt-color-text-tertiary);
  margin: 0;
}

// 加载状态
.characters-loading {
  display: flex;
  justify-content: center;
  padding: var(--dt-spacing-3xl);
}

// 响应式设计
@media (max-width: 768px) {
  .detail-content {
    padding: var(--dt-spacing-lg) var(--dt-spacing-md);
  }

  .scenario-info-card,
  .entries-preview,
  .world-section,
  .characters-section,
  .backgrounds-section {
    padding: var(--dt-spacing-lg);
  }

  .header-actions {
    flex-wrap: wrap;
    gap: var(--dt-spacing-sm);
  }

  .entries-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--dt-spacing-md);
  }

  .world-item-header,
  .rule-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--dt-spacing-xs);
  }

  .world-item-title,
  .rule-title {
    white-space: normal;
  }

  .character-info {
    padding: var(--dt-spacing-md);
  }

  .background-preview-modal {
    padding: var(--dt-spacing-md);
  }
}

// 图片错误处理样式
.error-placeholder {
  opacity: 0.6;
  filter: grayscale(100%);
  border: 2px dashed var(--dt-color-border-secondary);
  background-color: var(--dt-color-surface-secondary);
  position: relative;

  &::after {
    content: '图片加载失败';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--dt-color-text-tertiary);
    font-size: var(--dt-font-size-xs);
    background: var(--dt-color-surface-primary);
    padding: var(--dt-spacing-xs) var(--dt-spacing-sm);
    border-radius: var(--dt-radius-sm);
    z-index: 1;
  }
}

// 专业度提升样式
.scenario-detail {
  // 页面整体渐变背景，营造专业感
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    color-mix(in srgb, var(--dt-color-background-primary) 95%, var(--dt-color-primary) 5%) 100%
  );
}

.character-item {
  // 角色卡片悬浮效果优化
  transition: all var(--dt-transition-medium);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--dt-shadow-lg);

    .character-avatar {
      transform: scale(1.05);
    }
  }
}

.character-avatar {
  transition: transform var(--dt-transition-medium);
  // 确保头像在悬浮时保持圆形
  overflow: hidden;
}

.background-item {
  // 背景图片卡片优化
  position: relative;
  transition: all var(--dt-transition-medium);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--dt-shadow-md);

    .background-overlay {
      opacity: 1;
    }
  }
}

.background-overlay {
  // 背景图片悬浮信息优化
  transition: opacity var(--dt-transition-medium);
  opacity: 0.9;

  &:hover {
    opacity: 1;
  }
}

// 加载状态优化
.characters-loading {
  .loading-spinner {
    color: var(--dt-color-primary);
  }
}

// 沉浸式设计样式
.scenario-content {
  // 主题背景色
  &.scenario-theme--scifi {
    --immersive-primary: #1a1a2e;
    --immersive-secondary: #0f3460;
    --immersive-accent: #e94560;
    --immersive-glow: #00ffff;
  }

  &.scenario-theme--fantasy {
    --immersive-primary: #2d1b69;
    --immersive-secondary: #533483;
    --immersive-accent: #c77dff;
    --immersive-glow: #ffd700;
  }

  &.scenario-theme--mystery {
    --immersive-primary: #1a1a1a;
    --immersive-secondary: #3a3a3a;
    --immersive-accent: #4a4a4a;
    --immersive-glow: #808080;
  }

  &.scenario-theme--horror {
    --immersive-primary: #0a0a0a;
    --immersive-secondary: #2a0a0a;
    --immersive-accent: #4a0a0a;
    --immersive-glow: #dc143c;
  }

  &.scenario-theme--historical {
    --immersive-primary: #3e2723;
    --immersive-secondary: #6d4c41;
    --immersive-accent: #8d6e63;
    --immersive-glow: #daa520;
  }

  &.scenario-theme--default {
    --immersive-primary: #667eea;
    --immersive-secondary: #764ba2;
    --immersive-accent: #f093fb;
    --immersive-glow: #fecfef;
  }
}

// 沉浸式头部
.immersive-header {
  height: 60vh;
  min-height: 400px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1;
  }
}

.immersive-header__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
  z-index: 2;
}

.immersive-header__content {
  position: relative;
  z-index: 3;
  text-align: center;
  max-width: 1200px;
  padding: 0 var(--dt-spacing-lg);
  width: 100%;
}

// 面包屑导航
.breadcrumb-nav {
  margin-bottom: var(--dt-spacing-xl);
}

.breadcrumb-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--dt-spacing-sm);
  font-size: var(--dt-font-size-sm);
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: var(--dt-transition-fast);

  &:hover {
    color: white;
    text-decoration: underline;
  }

  &.current {
    color: white;
    font-weight: var(--dt-font-weight-medium);
  }
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.6);
}

// 沉浸式标题
.immersive-header__main {
  margin-bottom: var(--dt-spacing-2xl);
}

.immersive-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: var(--dt-font-weight-bold);
  color: white;
  margin: 0 0 var(--dt-spacing-lg) 0;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.title-text {
  letter-spacing: 2px;
  animation: titleGlow 3s ease-in-out infinite alternate;
}

.title-decorations {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-lg);
}

.decoration-line {
  height: 2px;
  width: 80px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--immersive-glow) 50%,
    transparent 100%
  );
  animation: lineGlow 2s ease-in-out infinite alternate;

  &.decoration-left {
    animation-delay: 0s;
  }

  &.decoration-right {
    animation-delay: 1s;
  }
}

.decoration-icon {
  font-size: 2rem;
  filter: drop-shadow(0 0 20px var(--immersive-glow));
  animation: iconFloat 4s ease-in-out infinite;
}

.immersive-subtitle {
  font-size: var(--dt-font-size-lg);
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  max-width: 800px;
  line-height: 1.6;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
}

// 沉浸式元信息
.immersive-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-spacing-lg);
}

.meta-badges {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

.meta-badge {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);

  &.enhanced {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.4);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  }

  &.genre {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.immersive-actions {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-lg);
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  transition: var(--dt-transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  &.primary-action {
    background: var(--immersive-accent);
    border-color: var(--immersive-accent);
    box-shadow: 0 5px 20px rgba(233, 69, 96, 0.4);

    &:hover {
      background: color-mix(in srgb, var(--immersive-accent) 90%, white 10%);
      box-shadow: 0 8px 30px rgba(233, 69, 96, 0.6);
    }
  }
}

// 粒子动画
.immersive-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

.particle {
  pointer-events: none;
  will-change: transform, opacity;
}

// 沉浸式内容区域
.immersive-content {
  position: relative;
  z-index: 10;
  margin-top: -80px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 var(--dt-spacing-lg) var(--dt-spacing-xl);
  max-width: 1400px;
  width: 100%;
  box-sizing: border-box;
}

// 确保所有TavernCard组件正确对齐
.immersive-content :deep(.tavern-card) {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: var(--dt-spacing-xl);
}

.immersive-content :deep(.scenario-backgrounds) {
  width: 100%;
  box-sizing: border-box;
}

.immersive-content :deep(.related-characters) {
  width: 100%;
  box-sizing: border-box;
}

// 核心信息区域
.scenario-core-info {
  margin-bottom: var(--dt-spacing-2xl);
  width: 100%;
}

.core-info-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--dt-radius-xl);
  padding: var(--dt-spacing-2xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  box-sizing: border-box;
}

.info-section {
  margin-bottom: var(--dt-spacing-2xl);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title-with-icon {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
  margin: 0 0 var(--dt-spacing-lg) 0;
}

.section-icon {
  color: var(--immersive-accent);
  font-size: 1.5rem;
}

.world-description,
.content-detail {
  .description-text,
  .content-text {
    line-height: 1.8;
    color: var(--dt-color-text-primary);
    background: var(--dt-color-surface-secondary);
    padding: var(--dt-spacing-lg);
    border-radius: var(--dt-radius-lg);
    border-left: 4px solid var(--immersive-accent);
    white-space: pre-wrap;
  }
}

// 题材信息
.genre-info {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-lg);
  flex-wrap: wrap;
}

.genre-description {
  flex: 1;
  color: var(--dt-color-text-secondary);
  font-style: italic;
  min-width: 300px;
}

// 复杂度信息
.complexity-info {
  .complexity-visual {
    display: flex;
    align-items: center;
    gap: var(--dt-spacing-lg);
    margin-bottom: var(--dt-spacing-md);
  }

  .complexity-bar {
    flex: 1;
    height: 12px;
    background: var(--dt-color-surface-secondary);
    border-radius: var(--dt-radius-full);
    overflow: hidden;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s ease-in-out infinite;
    }
  }

  .complexity-fill {
    height: 100%;
    transition: width 1s ease-out;
    border-radius: var(--dt-radius-full);

    &.complexity-simple {
      background: linear-gradient(90deg, #4caf50, #8bc34a);
    }

    &.complexity-moderate {
      background: linear-gradient(90deg, #ff9800, #ffc107);
    }

    &.complexity-complex {
      background: linear-gradient(90deg, #f44336, #ff5722);
    }

    &.complexity-very-complex {
      background: linear-gradient(90deg, #9c27b0, #e91e63);
    }
  }

  .complexity-badge {
    font-weight: var(--dt-font-weight-semibold);
  }

  .complexity-description {
    color: var(--dt-color-text-secondary);
    line-height: 1.6;
  }
}

// 统计概览
.stats-overview {
  margin-bottom: var(--dt-spacing-2xl);
}

.stats-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--dt-radius-xl);
  padding: var(--dt-spacing-2xl);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--dt-spacing-lg);
}

.stat-card {
  background: var(--dt-color-surface-primary);
  border: 1px solid var(--dt-color-border-secondary);
  border-radius: var(--dt-radius-lg);
  padding: var(--dt-spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  transition: var(--dt-transition-fast);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--immersive-accent), var(--immersive-glow));
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--dt-shadow-lg);
    border-color: var(--immersive-accent);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--immersive-accent), var(--immersive-glow));
  border-radius: var(--dt-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--dt-font-size-lg);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-bold);
  color: var(--dt-color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-secondary);
  margin-top: var(--dt-spacing-xs);
}

// 动画定义
@keyframes titleGlow {
  0% {
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5), 0 0 30px var(--immersive-glow);
  }
  100% {
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5), 0 0 50px var(--immersive-glow);
  }
}

@keyframes lineGlow {
  0% {
    opacity: 0.3;
    transform: scaleX(0.8);
  }
  100% {
    opacity: 1;
    transform: scaleX(1.2);
  }
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) translateX(0px);
  }
  33% {
    transform: translateY(-10px) translateX(5px);
  }
  66% {
    transform: translateY(5px) translateX(-5px);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .immersive-header {
    height: 50vh;
    min-height: 300px;
  }

  .immersive-title {
    font-size: clamp(2rem, 8vw, 3rem);
  }

  .title-decorations {
    flex-direction: column;
    gap: var(--dt-spacing-md);
  }

  .decoration-line {
    width: 60px;
  }

  .immersive-meta {
    gap: var(--dt-spacing-md);
  }

  .meta-badges,
  .immersive-actions {
    gap: var(--dt-spacing-sm);
  }

  .immersive-content {
    margin-top: -60px;
    padding: 0 var(--dt-spacing-md) var(--dt-spacing-lg);
  }

  .core-info-container,
  .stats-container {
    padding: var(--dt-spacing-lg);
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--dt-spacing-md);
  }

  .stat-card {
    padding: var(--dt-spacing-md);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: var(--dt-font-size-md);
  }

  .genre-info {
    flex-direction: column;
    align-items: stretch;
    gap: var(--dt-spacing-md);
  }

  .complexity-visual {
    flex-direction: column;
    align-items: stretch;
    gap: var(--dt-spacing-md);
  }
}

@media (max-width: 480px) {
  .breadcrumb-items {
    flex-wrap: wrap;
    justify-content: center;
  }

  .immersive-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
