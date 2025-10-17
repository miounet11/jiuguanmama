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
    <div v-else-if="scenario || enhancedScenario" class="scenario-content">
      <!-- 简化页面头部 -->
      <div class="scenario-header" :class="`scenario-theme--${getScenarioTheme()}`">
        <div class="container">
          <!-- 面包屑导航 -->
          <div class="breadcrumb-nav">
            <nav class="breadcrumb-items">
              <router-link to="/" class="breadcrumb-item">首页</router-link>
              <span class="breadcrumb-separator">›</span>
              <router-link to="/scenarios" class="breadcrumb-item">剧本管理</router-link>
              <span class="breadcrumb-separator">›</span>
              <span class="breadcrumb-item current">{{ currentScenarioData?.name || '剧本详情' }}</span>
            </nav>
          </div>

          <div class="scenario-header__main">
            <div class="scenario-title-section">
              <h1 class="scenario-title">
                {{ currentScenarioData?.name || '' }}
                <span class="scenario-icon">{{ getScenarioIcon() }}</span>
              </h1>
              <p class="scenario-subtitle">{{ currentScenarioData?.description || '无描述' }}</p>
            </div>

            <div class="scenario-actions">
              <div class="scenario-badges">
                <TavernBadge
                  :variant="currentScenarioData?.isPublic ? 'success' : 'warning'"
                  :text="currentScenarioData?.isPublic ? '公开' : '私有'"
                  class="scenario-badge"
                />
                <TavernBadge
                  v-if="isEnhanced"
                  variant="primary"
                  text="增强剧本"
                  class="scenario-badge enhanced"
                />
                <TavernBadge
                  v-if="getScenarioGenre()"
                  :text="getScenarioGenre()"
                  variant="secondary"
                  class="scenario-badge genre"
                />
              </div>

              <div class="action-buttons">
                <TavernButton
                  @click="editScenario"
                  variant="primary"
                  size="lg"
                  class="primary-action-btn"
                >
                  <TavernIcon name="edit" class="mr-2" />
                  编辑剧本
                </TavernButton>

                <div class="dropdown-wrapper">
                  <TavernButton @click="toggleDropdown" variant="outline" class="dropdown-trigger">
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
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="scenario-main-content">
        <div class="container">
          <!-- 剧本核心信息 -->
          <TavernCard class="scenario-core-info">
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
          </TavernCard>

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

// 剧场效果方法
const getLightBeamStyle = (index: number) => {
  const theme = getScenarioTheme()
  const lightColors = {
    scifi: ['rgba(0, 255, 255, 0.1)', 'rgba(255, 0, 255, 0.1)', 'rgba(255, 255, 0, 0.1)'],
    fantasy: ['rgba(255, 215, 0, 0.1)', 'rgba(255, 105, 180, 0.1)', 'rgba(0, 255, 255, 0.1)'],
    mystery: ['rgba(128, 128, 128, 0.1)', 'rgba(169, 169, 169, 0.1)', 'rgba(192, 192, 192, 0.1)'],
    horror: ['rgba(139, 0, 0, 0.1)', 'rgba(220, 20, 60, 0.1)', 'rgba(255, 0, 0, 0.1)'],
    historical: ['rgba(218, 165, 32, 0.1)', 'rgba(205, 133, 63, 0.1)', 'rgba(210, 105, 30, 0.1)'],
    default: ['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)', 'rgba(240, 147, 251, 0.1)']
  }

  const colors = lightColors[theme] || lightColors.default
  const color = colors[index % colors.length]

  return {
    position: 'absolute',
    left: `${25 + index * 25}%`,
    top: '0',
    width: '2px',
    height: '100%',
    background: `linear-gradient(180deg, ${color} 0%, transparent 50%, ${color} 100%)`,
    animation: `lightBeamSweep ${8 + index * 2}s ease-in-out infinite`,
    animationDelay: `${index * 1.5}s`,
    transform: `rotate(${-15 + index * 15}deg)`,
    transformOrigin: 'top center'
  }
}

const getAtmosphereParticleStyle = (index: number) => {
  const theme = getScenarioTheme()
  const atmosphereColors = {
    scifi: ['rgba(0, 255, 255, 0.3)', 'rgba(255, 0, 255, 0.3)', 'rgba(255, 255, 0, 0.3)'],
    fantasy: ['rgba(255, 215, 0, 0.3)', 'rgba(255, 105, 180, 0.3)', 'rgba(147, 112, 219, 0.3)'],
    mystery: ['rgba(105, 105, 105, 0.3)', 'rgba(128, 128, 128, 0.3)', 'rgba(169, 169, 169, 0.3)'],
    horror: ['rgba(139, 0, 0, 0.3)', 'rgba(178, 34, 34, 0.3)', 'rgba(255, 69, 0, 0.3)'],
    historical: ['rgba(222, 184, 135, 0.3)', 'rgba(244, 164, 96, 0.3)', 'rgba(210, 180, 140, 0.3)'],
    default: ['rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.3)', 'rgba(240, 147, 251, 0.3)']
  }

  const colors = atmosphereColors[theme] || atmosphereColors.default
  const color = colors[index % colors.length]

  return {
    position: 'absolute',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${Math.random() * 80 + 20}px`,
    height: `${Math.random() * 80 + 20}px`,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    borderRadius: '50%',
    opacity: 0,
    animation: `atmosphereFloat ${10 + Math.random() * 5}s ease-in-out infinite`,
    animationDelay: `${Math.random() * 5}s`,
    filter: `blur(${Math.random() * 3 + 1}px)`
  }
}

const getSparkleStyle = (index: number) => {
  const theme = getScenarioTheme()
  const sparkleColors = {
    scifi: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'],
    fantasy: ['#ffd700', '#ff69b4', '#00ffff', '#dda0dd'],
    mystery: ['#c0c0c0', '#dcdcdc', '#f5f5f5', '#e0e0e0'],
    horror: ['#ff6347', '#ff4500', '#dc143c', '#ff0000'],
    historical: ['#ffd700', '#daa520', '#f4a460', '#d2691e'],
    default: ['#ffffff', '#f0f0f0', '#e0e0e0', '#fafafa']
  }

  const colors = sparkleColors[theme] || sparkleColors.default
  const color = colors[index % colors.length]

  return {
    position: 'absolute',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: '2px',
    height: '2px',
    backgroundColor: color,
    borderRadius: '50%',
    opacity: 0,
    animation: `sparkle ${3 + Math.random() * 2}s ease-in-out infinite`,
    animationDelay: `${Math.random() * 3}s`,
    boxShadow: `0 0 6px ${color}`
  }
}

const getRippleStyle = (index: number) => {
  const theme = getScenarioTheme()
  const rippleColors = {
    scifi: 'rgba(0, 255, 255, 0.2)',
    fantasy: 'rgba(255, 215, 0, 0.2)',
    mystery: 'rgba(128, 128, 128, 0.2)',
    horror: 'rgba(139, 0, 0, 0.2)',
    historical: 'rgba(218, 165, 32, 0.2)',
    default: 'rgba(102, 126, 234, 0.2)'
  }

  const color = rippleColors[theme] || rippleColors.default

  return {
    position: 'absolute',
    left: `${40 + index * 10}%`,
    top: `${30 + index * 10}%`,
    width: '100px',
    height: '100px',
    border: `2px solid ${color}`,
    borderRadius: '50%',
    opacity: 0,
    animation: `rippleExpand ${6 + index * 2}s ease-out infinite`,
    animationDelay: `${index * 1.5}s`,
    transform: 'translate(-50%, -50%)'
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
  background: var(--surface-0);
  color: var(--text-primary);
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
}

.error-card {
  max-width: 500px;
  text-align: center;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.error-icon {
  color: var(--warning);
}

.error-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.error-message {
  color: var(--text-secondary);
  margin: 0;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

// 容器
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

// 剧本头部
.scenario-header {
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-primary);
  padding: var(--spacing-xl) 0;
  margin-bottom: var(--spacing-xl);

  .breadcrumb-nav {
    margin-bottom: var(--spacing-lg);
  }

  .breadcrumb-items {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .breadcrumb-item {
    color: var(--text-secondary);
    text-decoration: none;
    transition: var(--transition-colors);

    &:hover {
      color: var(--text-primary);
    }

    &.current {
      color: var(--text-primary);
      font-weight: var(--font-medium);
    }
  }

  .breadcrumb-separator {
    color: var(--text-tertiary);
  }

  .scenario-header__main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-lg);

    @media (max-width: 768px) {
      flex-direction: column;
      gap: var(--spacing-md);
    }
  }

  .scenario-title-section {
    flex: 1;
  }

  .scenario-title {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .scenario-icon {
    font-size: var(--text-2xl);
    opacity: 0.8;
  }

  .scenario-subtitle {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.6;
  }

  .scenario-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-end;

    @media (max-width: 768px) {
      align-items: stretch;
    }
  }

  .scenario-badges {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .action-buttons {
    display: flex;
    gap: var(--spacing-md);
  }

  .primary-action-btn {
    background: var(--tavern-primary);
    border-color: var(--tavern-primary);
    color: white;

    &:hover {
      background: var(--tavern-primary-hover);
      border-color: var(--tavern-primary-hover);
    }
  }
}

// 主内容区域
.scenario-main-content {
  margin-bottom: var(--spacing-3xl);
}

.scenario-core-info {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-2xl);
}

.entries-preview {
  padding: var(--spacing-2xl);
  width: 100%;
  box-sizing: border-box;
  margin-bottom: var(--spacing-xl);
}

.entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

// 信息区块
.info-section {
  margin-bottom: var(--spacing-2xl);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title-with-icon {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.section-icon {
  color: var(--tavern-primary);
  font-size: 1.5rem;
}

.world-description,
.content-detail {
  .description-text,
  .content-text {
    line-height: 1.8;
    color: var(--text-primary);
    background: var(--surface-2);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    border-left: 4px solid var(--tavern-primary);
    white-space: pre-wrap;
    margin: 0;
  }
}

// 题材和复杂度信息
.genre-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
}

.genre-description {
  flex: 1;
  color: var(--text-secondary);
  font-style: italic;
  min-width: 300px;
}

.complexity-info {
  .complexity-visual {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-md);

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-md);
    }
  }

  .complexity-bar {
    flex: 1;
    height: 12px;
    background: var(--surface-2);
    border-radius: var(--radius-full);
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
    border-radius: var(--radius-full);

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
    font-weight: var(--font-semibold);
  }

  .complexity-description {
    color: var(--text-secondary);
    line-height: 1.6;
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.empty-icon {
  color: var(--text-tertiary);
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: 0;
}

.empty-description {
  color: var(--text-tertiary);
  margin: 0;
}

// 网格布局
.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.entry-card {
  padding: var(--spacing-lg);
  transition: var(--transition-colors), var(--transition-shadow);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.entry-title {
  font-size: var(--text-md);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-content {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0 0 var(--spacing-sm) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entry-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.more-entries-card {
  background: var(--surface-2);
  border: 2px dashed var(--border-secondary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-colors);

  &:hover {
    background: var(--surface-3);
    border-color: var(--border-primary);
  }
}

.more-content {
  text-align: center;
  padding: var(--spacing-xl);
}

.more-count {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.more-text {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

// 下拉菜单
.dropdown-wrapper {
  position: relative;
}

.dropdown-trigger {
  padding: var(--spacing-sm);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--surface-1);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  z-index: 50;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-md);
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-colors);

  &:hover {
    background: var(--surface-2);
  }

  &.danger {
    color: var(--error);

    &:hover {
      background: rgba(248, 113, 113, 0.1);
    }
  }
}

.dropdown-divider {
  height: 1px;
  background: var(--border-secondary);
}

// 动画
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 主题色彩
.scenario-header,
.scenario-content {
  &.scenario-theme--scifi {
    .scenario-icon {
      color: #00ffff;
    }
  }

  &.scenario-theme--fantasy {
    .scenario-icon {
      color: #ffd700;
    }
  }

  &.scenario-theme--mystery {
    .scenario-icon {
      color: #808080;
    }
  }

  &.scenario-theme--horror {
    .scenario-icon {
      color: #dc143c;
    }
  }

  &.scenario-theme--historical {
    .scenario-icon {
      color: #daa520;
    }
  }

  &.scenario-theme--default {
    .scenario-icon {
      color: var(--tavern-primary);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .scenario-header {
    padding: var(--spacing-lg) 0;
  }

  .scenario-core-info,
  .entries-preview {
    padding: var(--spacing-lg);
  }
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
  padding: var(--spacing-lg);
}

.delete-dialog,
.clone-dialog {
  max-width: 500px;
  width: 100%;
}

.delete-content,
.clone-content {
  padding: var(--spacing-2xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.delete-icon {
  color: var(--warning);
  margin: 0 auto;
}

.delete-title,
.clone-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.delete-message,
.clone-description {
  color: var(--text-secondary);
  margin: 0;
}

.delete-actions,
.clone-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.clone-input {
  text-align: left;
}

// 增强功能样式
.enhanced-features {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.world-section {
  padding: var(--spacing-2xl);
}

.section-header {
  margin-bottom: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.world-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.world-item {
  background: var(--surface-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-colors), var(--transition-shadow);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-primary);
  }
}

.world-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.world-item-title {
  font-size: var(--text-md);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.world-item-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0 0 var(--spacing-sm) 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.world-item-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.meta-item {
  display: block;
}

// 世界规则特殊样式
.rules-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.rule-item {
  background: var(--surface-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-colors), var(--transition-shadow);

  &:hover {
    border-color: var(--border-primary);
    box-shadow: var(--shadow-sm);
  }
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.rule-title {
  font-size: var(--text-md);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.rule-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0 0 var(--spacing-sm) 0;
}

.rule-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

// 角色卡展示样式
.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.character-card {
  background: var(--surface-1);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition-colors), var(--transition-shadow);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--border-primary);
  }
}

.character-avatar-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--surface-2);
}

.character-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-colors), var(--transition-transform);
}

.character-avatar:hover {
  transform: scale(1.05);
}

.character-status-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
}

.character-info {
  padding: var(--spacing-lg);
}

.character-name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.character-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0 0 var(--spacing-md) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.character-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.character-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.background-preview-btn {
  position: absolute;
  bottom: var(--spacing-sm);
  right: var(--spacing-sm);
}

// 背景画廊样式
.backgrounds-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.background-item {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-colors), var(--transition-shadow);
  background: var(--surface-2);

  &:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-md);
  }
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  padding: var(--spacing-sm);
  opacity: 0;
  transition: var(--transition-colors);
}

.background-item:hover .background-overlay {
  opacity: 1;
}

.background-info {
  color: white;
  padding: var(--spacing-md);
}

.background-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  margin-bottom: var(--spacing-xs);
}

.background-description {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.8);
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
  padding: var(--spacing-lg);
}

.background-preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.background-preview-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-lg);
}

.background-preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: var(--text-2xl);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: var(--transition-colors);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

// 更多角色指示器
.more-characters-indicator {
  text-align: center;
  padding: var(--spacing-xl);
  cursor: pointer;
  color: var(--text-tertiary);
  transition: var(--transition-colors);

  &:hover {
    color: var(--text-secondary);
  }
}

.more-count {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin-bottom: var(--spacing-xs);
}

.more-text {
  font-size: var(--text-sm);
}

// 图片错误处理样式
.error-placeholder {
  opacity: 0.6;
  filter: grayscale(100%);
  border: 2px dashed var(--border-secondary);
  background-color: var(--surface-2);
  position: relative;

  &::after {
    content: '图片加载失败';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    background: var(--surface-1);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    z-index: 1;
  }
}
</style>
