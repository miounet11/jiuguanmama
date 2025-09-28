<template>
  <div class="enhanced-scenario-detail">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>加载增强剧本详情中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">加载失败</h3>
          <p class="error-message">{{ error }}</p>
          <div class="error-actions">
            <button @click="loadScenario" class="btn-primary">
              重新加载
            </button>
            <button @click="$router.push('/scenarios')" class="btn-secondary">
              返回列表
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div v-else-if="scenario" class="scenario-content">
      <!-- 剧本头部信息 -->
      <div class="scenario-header">
        <div class="header-info">
          <h1 class="scenario-title">{{ scenario.name }}</h1>
          <p class="scenario-description">{{ scenario.description }}</p>

          <!-- 增强剧本特有的元数据 -->
          <div class="scenario-metadata" v-if="hasEnhancedFeatures">
            <div class="metadata-item">
              <span class="label">类型:</span>
              <span class="badge">{{ genreLabel }}</span>
            </div>
            <div class="metadata-item" v-if="scenario.complexity">
              <span class="label">复杂度:</span>
              <span class="badge">{{ complexityLabel }}</span>
            </div>
            <div class="metadata-item" v-if="scenario.contentRating">
              <span class="label">内容分级:</span>
              <span class="badge">{{ contentRatingLabel }}</span>
            </div>
            <div class="metadata-item" v-if="scenario.worldScope">
              <span class="label">世界规模:</span>
              <span class="badge">{{ worldScopeLabel }}</span>
            </div>
            <div class="metadata-item" v-if="scenario.playerCount">
              <span class="label">玩家数:</span>
              <span class="badge">{{ scenario.playerCount }}人</span>
            </div>
            <div class="metadata-item" v-if="scenario.estimatedDuration">
              <span class="label">预计时长:</span>
              <span class="badge">{{ scenario.estimatedDuration }}小时</span>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="scenario-stats">
            <div class="stat-item">
              <span class="stat-label">世界地点</span>
              <span class="stat-value">{{ scenario.worldLocations?.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">世界事件</span>
              <span class="stat-value">{{ scenario.worldEvents?.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">组织机构</span>
              <span class="stat-value">{{ scenario.worldOrganizations?.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">世界信息</span>
              <span class="stat-value">{{ scenario.worldInfos?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <button v-if="scenario.isFeatured" class="btn-featured">
            ⭐ 精选剧本
          </button>
          <button class="btn-primary">开始对话</button>
          <button class="btn-secondary">收藏剧本</button>
        </div>
      </div>

      <!-- 标签页导航 -->
      <div class="tabs-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-button', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 概览标签 -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <div class="overview-content">
            <!-- 世界设定 -->
            <div class="content-section" v-if="scenario.worldSetting">
              <h3 class="section-title">🌍 世界设定</h3>
              <div class="world-setting">
                <p>{{ scenario.worldSetting }}</p>
              </div>
            </div>

            <!-- 剧本内容 -->
            <div class="content-section" v-if="scenario.content">
              <h3 class="section-title">📜 剧本内容</h3>
              <div class="scenario-content-text">
                <pre>{{ scenario.content }}</pre>
              </div>
            </div>

            <!-- 标签 -->
            <div class="content-section" v-if="parsedTags.length > 0">
              <h3 class="section-title">🏷️ 标签</h3>
              <div class="tags-list">
                <span v-for="tag in parsedTags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 地点标签 -->
        <div v-if="activeTab === 'locations'" class="tab-panel">
          <div class="locations-grid">
            <div
              v-for="location in scenario.worldLocations"
              :key="location.id"
              class="location-card"
            >
              <div class="location-header">
                <h4 class="location-name">{{ location.name }}</h4>
                <span class="location-type">{{ locationTypeLabel(location.locationType) }}</span>
                <span class="location-significance">{{ significanceLabel(location.significance) }}</span>
              </div>
              <p class="location-description">{{ location.description }}</p>
              <div v-if="location.atmosphere" class="location-atmosphere">
                <strong>氛围:</strong> {{ location.atmosphere }}
              </div>
              <div v-if="location.coordinates" class="location-coordinates">
                <strong>位置:</strong> {{ location.coordinates }}
              </div>
              <div v-if="location.accessRequirements" class="location-access">
                <strong>访问要求:</strong> {{ location.accessRequirements }}
              </div>
            </div>
          </div>
        </div>

        <!-- 事件标签 -->
        <div v-if="activeTab === 'events'" class="tab-panel">
          <div class="events-timeline">
            <div
              v-for="event in scenario.worldEvents"
              :key="event.id"
              class="event-card"
            >
              <div class="event-header">
                <h4 class="event-name">{{ event.name }}</h4>
                <span class="event-type">{{ eventTypeLabel(event.eventType) }}</span>
                <span class="event-importance">{{ importanceLabel(event.importance) }}</span>
              </div>
              <p class="event-description">{{ event.description }}</p>
              <div class="event-details">
                <div class="event-time">
                  <strong>时间:</strong> {{ event.timeReference }}
                </div>
                <div v-if="event.consequences" class="event-consequences">
                  <strong>后果:</strong> {{ event.consequences }}
                </div>
                <div v-if="event.involvedCharacters && parsedArray(event.involvedCharacters).length > 0" class="event-characters">
                  <strong>相关角色:</strong> {{ parsedArray(event.involvedCharacters).join(', ') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 组织标签 -->
        <div v-if="activeTab === 'organizations'" class="tab-panel">
          <div class="organizations-grid">
            <div
              v-for="org in scenario.worldOrganizations"
              :key="org.id"
              class="organization-card"
            >
              <div class="organization-header">
                <h4 class="organization-name">{{ org.name }}</h4>
                <span class="organization-type">{{ organizationTypeLabel(org.organizationType) }}</span>
                <span class="organization-influence">{{ influenceLabel(org.influence) }}</span>
              </div>
              <p class="organization-description">{{ org.description }}</p>
              <div class="organization-details">
                <div v-if="org.leadership" class="organization-leadership">
                  <strong>领导层:</strong> {{ org.leadership }}
                </div>
                <div v-if="org.memberCount" class="organization-members">
                  <strong>成员数量:</strong> {{ org.memberCount }}
                </div>
                <div v-if="org.headquarters" class="organization-headquarters">
                  <strong>总部:</strong> {{ org.headquarters }}
                </div>
                <div v-if="org.goals && parsedArray(org.goals).length > 0" class="organization-goals">
                  <strong>目标:</strong> {{ parsedArray(org.goals).join(', ') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 世界信息标签 -->
        <div v-if="activeTab === 'worldinfo'" class="tab-panel">
          <div class="worldinfo-list">
            <div
              v-for="info in scenario.worldInfos"
              :key="info.id"
              class="worldinfo-card"
            >
              <div class="worldinfo-header">
                <h4 class="worldinfo-title">{{ info.title }}</h4>
                <span class="worldinfo-category">{{ info.category }}</span>
                <span v-if="info.isActive" class="worldinfo-status active">活跃</span>
                <span v-else class="worldinfo-status inactive">禁用</span>
              </div>
              <p class="worldinfo-content">{{ info.content }}</p>
              <div v-if="info.keywords && parsedArray(info.keywords).length > 0" class="worldinfo-keywords">
                <strong>关键词:</strong>
                <span v-for="keyword in parsedArray(info.keywords)" :key="keyword" class="keyword">{{ keyword }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const isLoading = ref(false)
const error = ref('')
const scenario = ref(null)
const activeTab = ref('overview')

// 计算属性
const hasEnhancedFeatures = computed(() => {
  return scenario.value && (
    scenario.value.genre ||
    scenario.value.complexity ||
    scenario.value.contentRating ||
    scenario.value.worldScope ||
    scenario.value.worldLocations?.length > 0 ||
    scenario.value.worldEvents?.length > 0 ||
    scenario.value.worldOrganizations?.length > 0
  )
})

const parsedTags = computed(() => {
  if (!scenario.value?.tags) return []
  try {
    return JSON.parse(scenario.value.tags)
  } catch {
    return []
  }
})

const tabs = computed(() => [
  { key: 'overview', label: '概览', icon: '📋' },
  {
    key: 'locations',
    label: '地点',
    icon: '🏛️',
    count: scenario.value?.worldLocations?.length || 0
  },
  {
    key: 'events',
    label: '事件',
    icon: '⚡',
    count: scenario.value?.worldEvents?.length || 0
  },
  {
    key: 'organizations',
    label: '组织',
    icon: '🏢',
    count: scenario.value?.worldOrganizations?.length || 0
  },
  {
    key: 'worldinfo',
    label: '世界信息',
    icon: '📚',
    count: scenario.value?.worldInfos?.length || 0
  }
])

// 标签映射
const genreLabel = computed(() => {
  const genres = {
    fantasy: '奇幻',
    scifi: '科幻',
    modern: '现代',
    historical: '历史',
    horror: '恐怖',
    romance: '浪漫',
    mystery: '悬疑',
    adventure: '冒险'
  }
  return genres[scenario.value?.genre] || scenario.value?.genre
})

const complexityLabel = computed(() => {
  const complexities = {
    simple: '简单',
    moderate: '中等',
    complex: '复杂',
    epic: '史诗'
  }
  return complexities[scenario.value?.complexity] || scenario.value?.complexity
})

const contentRatingLabel = computed(() => {
  const ratings = {
    general: '普遍',
    teen: '青少年',
    mature: '成人',
    adult: '限制级'
  }
  return ratings[scenario.value?.contentRating] || scenario.value?.contentRating
})

const worldScopeLabel = computed(() => {
  const scopes = {
    local: '本地',
    regional: '地区',
    continental: '大陆',
    global: '全球',
    multiverse: '多元宇宙'
  }
  return scopes[scenario.value?.worldScope] || scenario.value?.worldScope
})

// 工具函数
const parsedArray = (str) => {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

const locationTypeLabel = (type) => {
  const types = {
    city: '城市',
    building: '建筑',
    room: '房间',
    landmark: '地标',
    region: '区域',
    dimension: '维度'
  }
  return types[type] || type
}

const significanceLabel = (significance) => {
  const levels = {
    minor: '次要',
    moderate: '一般',
    major: '重要',
    legendary: '传奇'
  }
  return levels[significance] || significance
}

const eventTypeLabel = (type) => {
  const types = {
    historical: '历史',
    ongoing: '进行中',
    future: '未来',
    cyclical: '周期性',
    legendary: '传说'
  }
  return types[type] || type
}

const importanceLabel = (importance) => {
  const levels = {
    minor: '轻微',
    moderate: '中等',
    major: '重大',
    world_changing: '改变世界'
  }
  return levels[importance] || importance
}

const organizationTypeLabel = (type) => {
  const types = {
    guild: '公会',
    government: '政府',
    religious: '宗教',
    military: '军事',
    academic: '学术',
    commercial: '商业',
    criminal: '犯罪',
    secret: '秘密'
  }
  return types[type] || type
}

const influenceLabel = (influence) => {
  const levels = {
    local: '本地',
    regional: '地区',
    national: '国家',
    international: '国际',
    interdimensional: '跨维度'
  }
  return levels[influence] || influence
}

// 方法
const loadScenario = async () => {
  const scenarioId = route.params.id as string
  if (!scenarioId) return

  isLoading.value = true
  error.value = ''

  try {
    // 使用增强剧本API端点
    const response = await api.get(`/enhanced-scenarios/${scenarioId}`)
    scenario.value = response.data
  } catch (err) {
    console.error('Failed to load enhanced scenario:', err)
    error.value = err.response?.data?.error || '加载剧本详情失败'
  } finally {
    isLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadScenario()
})
</script>

<style scoped>
.enhanced-scenario-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-card {
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.error-message {
  color: #666;
  margin-bottom: 24px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.scenario-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-info {
  flex: 1;
}

.scenario-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.scenario-description {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
}

.scenario-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label {
  font-weight: 500;
  color: #555;
}

.badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.scenario-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.btn-primary, .btn-secondary, .btn-featured {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-featured {
  background: linear-gradient(135deg, #ffd700, #ffb300);
  color: #333;
  font-weight: bold;
}

.tabs-navigation {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tab-button.active {
  background: #1976d2;
  color: white;
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  font-weight: 500;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.tab-button.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.world-setting, .scenario-content-text {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  line-height: 1.6;
  color: #333;
}

.scenario-content-text pre {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.locations-grid, .organizations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.location-card, .organization-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #1976d2;
}

.location-header, .organization-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.location-name, .organization-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.location-type, .location-significance, .organization-type, .organization-influence {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.location-description, .organization-description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.location-atmosphere, .location-coordinates, .location-access,
.organization-details > div {
  font-size: 14px;
  color: #555;
  margin-bottom: 4px;
}

.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #ff9800;
}

.event-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.event-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.event-type, .event-importance {
  background: #fff3e0;
  color: #ef6c00;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.event-description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.event-details > div {
  font-size: 14px;
  color: #555;
  margin-bottom: 4px;
}

.worldinfo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.worldinfo-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #4caf50;
}

.worldinfo-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.worldinfo-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.worldinfo-category {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.worldinfo-status.active {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.worldinfo-status.inactive {
  background: #fafafa;
  color: #757575;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.worldinfo-content {
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.worldinfo-keywords {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #555;
}

.keyword {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .enhanced-scenario-detail {
    padding: 12px;
  }

  .scenario-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    align-items: stretch;
    width: 100%;
  }

  .scenario-stats {
    flex-wrap: wrap;
    gap: 16px;
  }

  .tabs-navigation {
    overflow-x: auto;
  }

  .tab-button {
    flex: none;
    min-width: 120px;
  }

  .locations-grid, .organizations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
