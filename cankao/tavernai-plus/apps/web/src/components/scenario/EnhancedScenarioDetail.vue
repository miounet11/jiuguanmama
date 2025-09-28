<template>
  <div class="enhanced-scenario-detail">
    <!-- 剧本头部信息 -->
    <div class="scenario-header">
      <div class="header-main">
        <div class="title-section">
          <h1 class="scenario-title">{{ scenario.name }}</h1>
          <div class="scenario-meta">
            <span class="category">{{ scenario.category }}</span>
            <span class="complexity">复杂度: {{ scenario.complexityLevel }}/5</span>
            <span class="scope">{{ scopeLabels[scenario.worldScope] }}</span>
            <span class="tech-level">{{ techLabels[scenario.technologyLevel] }}</span>
            <span class="magic-level">{{ magicLabels[scenario.magicLevel] }}</span>
          </div>
          <div class="scenario-tags">
            <el-tag v-for="tag in scenario.tags" :key="tag" size="small">{{ tag }}</el-tag>
            <el-tag
              v-for="tag in scenario.genreTags"
              :key="tag"
              type="success"
              size="small"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <div class="stats-section">
          <div class="stat-item">
            <i class="el-icon-star-on"></i>
            <span>{{ scenario.rating.toFixed(1) }}</span>
          </div>
          <div class="stat-item">
            <i class="el-icon-view"></i>
            <span>{{ scenario.viewCount }}</span>
          </div>
          <div class="stat-item">
            <i class="el-icon-collection"></i>
            <span>{{ scenario.favoriteCount }}</span>
          </div>
          <div class="stat-item">
            <i class="el-icon-user"></i>
            <span>{{ scenario.playerCount }}</span>
          </div>
        </div>
      </div>

      <div class="scenario-description">
        <p>{{ scenario.description }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="startChat">开始对话</el-button>
        <el-button @click="toggleFavorite">
          <i :class="isFavorited ? 'el-icon-star-on' : 'el-icon-star-off'"></i>
          {{ isFavorited ? '取消收藏' : '收藏' }}
        </el-button>
        <el-button @click="cloneScenario">克隆剧本</el-button>
        <el-button v-if="canEdit" @click="editScenario">编辑</el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="scenario-content">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息 -->
        <el-tab-pane label="剧本详情" name="overview">
          <div class="overview-content">
            <div class="content-section" v-if="scenario.content">
              <h3>详细描述</h3>
              <div class="scenario-content-text" v-html="formatContent(scenario.content)"></div>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <h4>基本信息</h4>
                <div class="info-list">
                  <div class="info-item">
                    <span class="label">创建者:</span>
                    <span class="value">{{ scenario.user?.username }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">创建时间:</span>
                    <span class="value">{{ formatDate(scenario.createdAt) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">最后更新:</span>
                    <span class="value">{{ formatDate(scenario.updatedAt) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">预计时长:</span>
                    <span class="value">{{ scenario.estimatedDuration || '未指定' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">内容等级:</span>
                    <span class="value">{{ contentRatingLabels[scenario.contentRating] }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">许可协议:</span>
                    <span class="value">{{ licenseLabels[scenario.licenseType] }}</span>
                  </div>
                </div>
              </div>

              <div class="info-card">
                <h4>世界设定</h4>
                <div class="world-info">
                  <div class="world-stat">
                    <span class="icon">🏛️</span>
                    <span class="count">{{ scenario.locations?.length || 0 }}</span>
                    <span class="label">地点</span>
                  </div>
                  <div class="world-stat">
                    <span class="icon">📜</span>
                    <span class="count">{{ scenario.events?.length || 0 }}</span>
                    <span class="label">事件</span>
                  </div>
                  <div class="world-stat">
                    <span class="icon">🏢</span>
                    <span class="count">{{ scenario.organizations?.length || 0 }}</span>
                    <span class="label">组织</span>
                  </div>
                  <div class="world-stat">
                    <span class="icon">🎭</span>
                    <span class="count">{{ scenario.cultures?.length || 0 }}</span>
                    <span class="label">文化</span>
                  </div>
                  <div class="world-stat">
                    <span class="icon">⚔️</span>
                    <span class="count">{{ scenario.items?.length || 0 }}</span>
                    <span class="label">物品</span>
                  </div>
                  <div class="world-stat">
                    <span class="icon">📖</span>
                    <span class="count">{{ scenario.rules?.length || 0 }}</span>
                    <span class="label">规则</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 世界地理 -->
        <el-tab-pane label="地理环境" name="locations" v-if="scenario.locations?.length">
          <div class="locations-content">
            <div class="location-grid">
              <div
                v-for="location in scenario.locations"
                :key="location.id"
                class="location-card"
                @click="selectLocation(location)"
                :class="{ active: selectedLocation?.id === location.id }"
              >
                <h4>{{ location.name }}</h4>
                <span class="location-type">{{ locationTypeLabels[location.locationType] }}</span>
                <p class="location-desc">{{ location.description }}</p>
                <div class="location-features" v-if="location.notableFeatures?.length">
                  <el-tag
                    v-for="feature in location.notableFeatures.slice(0, 2)"
                    :key="feature"
                    size="mini"
                  >
                    {{ feature }}
                  </el-tag>
                  <span v-if="location.notableFeatures.length > 2" class="more-features">
                    +{{ location.notableFeatures.length - 2 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 地点详情 -->
            <div v-if="selectedLocation" class="location-detail">
              <h3>{{ selectedLocation.name }}</h3>
              <div class="location-info">
                <div class="basic-info">
                  <p>{{ selectedLocation.description }}</p>
                  <div class="location-meta">
                    <span><strong>类型:</strong> {{ locationTypeLabels[selectedLocation.locationType] }}</span>
                    <span><strong>人口:</strong> {{ selectedLocation.population || '未知' }}</span>
                    <span><strong>气候:</strong> {{ selectedLocation.climate || '温带' }}</span>
                  </div>
                </div>

                <div class="feature-lists">
                  <div v-if="selectedLocation.notableFeatures?.length" class="feature-group">
                    <h5>📍 重要特征</h5>
                    <ul>
                      <li v-for="feature in selectedLocation.notableFeatures" :key="feature">
                        {{ feature }}
                      </li>
                    </ul>
                  </div>

                  <div v-if="selectedLocation.resources?.length" class="feature-group">
                    <h5>💎 资源</h5>
                    <ul>
                      <li v-for="resource in selectedLocation.resources" :key="resource">
                        {{ resource }}
                      </li>
                    </ul>
                  </div>

                  <div v-if="selectedLocation.dangers?.length" class="feature-group">
                    <h5>⚠️ 危险</h5>
                    <ul>
                      <li v-for="danger in selectedLocation.dangers" :key="danger">
                        {{ danger }}
                      </li>
                    </ul>
                  </div>

                  <div v-if="selectedLocation.secrets?.length" class="feature-group">
                    <h5>🔮 秘密</h5>
                    <ul>
                      <li v-for="secret in selectedLocation.secrets" :key="secret">
                        {{ secret }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 历史事件 -->
        <el-tab-pane label="历史事件" name="events" v-if="scenario.events?.length">
          <div class="events-content">
            <div class="timeline">
              <div
                v-for="event in sortedEvents"
                :key="event.id"
                class="timeline-item"
                :class="event.eventType"
              >
                <div class="timeline-marker">
                  <span class="importance-badge">{{ event.importanceLevel }}</span>
                </div>
                <div class="timeline-content">
                  <div class="event-header">
                    <h4>{{ event.title }}</h4>
                    <span class="event-date">{{ event.dateDescription }}</span>
                    <span class="event-type">{{ eventTypeLabels[event.eventType] }}</span>
                  </div>
                  <p class="event-description">{{ event.description }}</p>

                  <div v-if="event.consequences" class="event-consequences">
                    <h5>影响后果</h5>
                    <p>{{ event.consequences }}</p>
                  </div>

                  <div v-if="event.participants?.length" class="event-participants">
                    <h5>相关人物</h5>
                    <div class="participants-list">
                      <el-tag
                        v-for="participant in event.participants"
                        :key="participant"
                        size="small"
                      >
                        {{ participant }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 组织势力 -->
        <el-tab-pane label="组织势力" name="organizations" v-if="scenario.organizations?.length">
          <div class="organizations-content">
            <div class="organization-grid">
              <div
                v-for="org in scenario.organizations"
                :key="org.id"
                class="organization-card"
              >
                <div class="org-header">
                  <h4>{{ org.name }}</h4>
                  <div class="org-meta">
                    <span class="org-type">{{ organizationTypeLabels[org.organizationType] }}</span>
                    <span class="power-level">
                      影响力:
                      <el-rate
                        v-model="org.powerLevel"
                        disabled
                        show-score
                        :max="5"
                      ></el-rate>
                    </span>
                  </div>
                </div>

                <p class="org-description">{{ org.description }}</p>

                <div class="org-details">
                  <div class="detail-item">
                    <strong>成立时间:</strong> {{ org.foundingDate || '未知' }}
                  </div>
                  <div class="detail-item">
                    <strong>成员数量:</strong> {{ org.memberCount || '未知' }}
                  </div>
                  <div class="detail-item">
                    <strong>当前状态:</strong> {{ orgStatusLabels[org.currentStatus] }}
                  </div>
                  <div class="detail-item" v-if="org.alignment">
                    <strong>阵营倾向:</strong> {{ alignmentLabels[org.alignment] }}
                  </div>
                </div>

                <div v-if="org.goals?.length" class="org-goals">
                  <h5>组织目标</h5>
                  <div class="goals-list">
                    <div v-for="goal in org.goals" :key="goal.description" class="goal-item">
                      <span class="goal-desc">{{ goal.description }}</span>
                      <el-progress
                        :percentage="goal.progress"
                        :color="getProgressColor(goal.priority)"
                        :stroke-width="6"
                      ></el-progress>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 世界信息 -->
        <el-tab-pane label="世界信息" name="worldInfo" v-if="scenario.worldInfoEntries?.length">
          <div class="world-info-content">
            <div class="info-categories">
              <el-button-group>
                <el-button
                  v-for="category in infoCategories"
                  :key="category"
                  :type="selectedInfoCategory === category ? 'primary' : 'default'"
                  @click="selectedInfoCategory = category"
                >
                  {{ category }}
                </el-button>
              </el-button-group>
            </div>

            <div class="info-entries">
              <div
                v-for="entry in filteredWorldInfo"
                :key="entry.id"
                class="info-entry"
              >
                <div class="entry-header">
                  <h4>{{ entry.title }}</h4>
                  <div class="entry-meta">
                    <span class="entry-type">{{ entryTypeLabels[entry.entryType] }}</span>
                    <span class="priority">优先级: {{ entry.priority }}</span>
                    <span class="visibility">{{ visibilityLabels[entry.visibility] }}</span>
                  </div>
                </div>

                <div class="entry-content">
                  <p>{{ entry.content }}</p>
                </div>

                <div class="entry-keywords" v-if="entry.keywords?.length">
                  <h5>关键词</h5>
                  <el-tag
                    v-for="keyword in entry.keywords"
                    :key="keyword"
                    size="mini"
                    type="info"
                  >
                    {{ keyword }}
                  </el-tag>
                </div>

                <div class="entry-conditions" v-if="entry.conditions?.length">
                  <h5>触发条件</h5>
                  <div class="conditions-list">
                    <span
                      v-for="condition in entry.conditions"
                      :key="condition.type + condition.requirement"
                      class="condition-tag"
                    >
                      {{ condition.description || condition.requirement }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 角色设定 -->
        <el-tab-pane label="角色设定" name="characters" v-if="scenario.characterSettings?.length">
          <div class="characters-content">
            <div class="character-settings">
              <div
                v-for="setting in scenario.characterSettings"
                :key="setting.id"
                class="character-setting-card"
              >
                <h4>角色世界设定</h4>

                <div v-if="setting.backgroundOverride" class="setting-section">
                  <h5>背景设定</h5>
                  <p>{{ setting.backgroundOverride }}</p>
                </div>

                <div v-if="setting.specialAbilities?.length" class="setting-section">
                  <h5>特殊能力</h5>
                  <div class="abilities-list">
                    <div v-for="ability in setting.specialAbilities" :key="ability.name" class="ability-item">
                      <strong>{{ ability.name }}</strong> ({{ abilityTypeLabels[ability.type] }})
                      <p>{{ ability.description }}</p>
                      <div v-if="ability.limitations?.length" class="limitations">
                        <small>限制: {{ ability.limitations.join(', ') }}</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="setting.personalGoals?.length" class="setting-section">
                  <h5>个人目标</h5>
                  <div class="goals-list">
                    <div v-for="goal in setting.personalGoals" :key="goal.description" class="goal-item">
                      <strong>{{ goal.description }}</strong>
                      <p><em>动机:</em> {{ goal.motivation }}</p>
                      <el-progress :percentage="goal.progress" :color="'#67C23A'"></el-progress>
                      <div v-if="goal.obstacles?.length" class="obstacles">
                        <small>障碍: {{ goal.obstacles.join(', ') }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'EnhancedScenarioDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()

    const scenario = ref({})
    const selectedLocation = ref(null)
    const selectedInfoCategory = ref('全部')
    const activeTab = ref('overview')
    const isFavorited = ref(false)
    const canEdit = ref(false)

    // 标签映射
    const scopeLabels = {
      room: '房间级',
      building: '建筑级',
      district: '区域级',
      city: '城市级',
      region: '地区级',
      country: '国家级',
      continent: '大陆级',
      planet: '行星级',
      system: '星系级',
      galaxy: '银河级',
      multiverse: '多元宇宙'
    }

    const techLabels = {
      stone_age: '石器时代',
      bronze_age: '青铜时代',
      iron_age: '铁器时代',
      classical: '古典时代',
      medieval: '中世纪',
      renaissance: '文艺复兴',
      industrial: '工业时代',
      modern: '现代',
      near_future: '近未来',
      far_future: '远未来',
      post_apocalyptic: '后末日',
      magitech: '魔导科技'
    }

    const magicLabels = {
      forbidden: '被禁止',
      extinct: '已消失',
      rare: '稀少',
      uncommon: '不常见',
      common: '常见',
      integral: '不可或缺',
      overwhelming: '压倒性',
      unknown: '未知'
    }

    const contentRatingLabels = {
      general: '全年龄',
      teen: '青少年',
      mature: '成人',
      adult: '仅限成人'
    }

    const licenseLabels = {
      private: '私人所有',
      cc_by: 'CC BY',
      cc_by_sa: 'CC BY-SA',
      cc_by_nc: 'CC BY-NC',
      cc_by_nc_sa: 'CC BY-NC-SA',
      commercial: '商业授权',
      open_source: '开源'
    }

    const locationTypeLabels = {
      area: '区域',
      building: '建筑',
      room: '房间',
      landmark: '地标',
      natural: '自然景观',
      magical: '魔法场所',
      hidden: '隐秘地点'
    }

    const eventTypeLabels = {
      historical: '历史事件',
      current: '当前事件',
      future: '未来事件',
      cyclical: '周期事件',
      mythical: '神话传说',
      prophecy: '预言'
    }

    const organizationTypeLabels = {
      guild: '公会',
      government: '政府',
      military: '军事',
      religious: '宗教',
      commercial: '商业',
      criminal: '犯罪',
      academic: '学术',
      secret: '秘密'
    }

    const orgStatusLabels = {
      active: '活跃',
      disbanded: '解散',
      hidden: '隐藏',
      declining: '衰落',
      growing: '发展',
      reforming: '重组'
    }

    const alignmentLabels = {
      good: '善良',
      neutral: '中立',
      evil: '邪恶',
      lawful: '守序',
      chaotic: '混乱',
      lawful_good: '守序善良',
      lawful_neutral: '守序中立',
      lawful_evil: '守序邪恶',
      neutral_good: '中立善良',
      true_neutral: '绝对中立',
      neutral_evil: '中立邪恶',
      chaotic_good: '混乱善良',
      chaotic_neutral: '混乱中立',
      chaotic_evil: '混乱邪恶'
    }

    const entryTypeLabels = {
      knowledge: '知识',
      description: '描述',
      rule: '规则',
      secret: '秘密',
      relationship: '关系',
      history: '历史',
      prophecy: '预言'
    }

    const visibilityLabels = {
      public: '公开',
      private: '私人',
      conditional: '条件性',
      secret: '秘密',
      gm_only: '仅GM'
    }

    const abilityTypeLabels = {
      innate: '天赋',
      learned: '习得',
      granted: '获得',
      cursed: '诅咒',
      temporary: '临时'
    }

    // 计算属性
    const sortedEvents = computed(() => {
      if (!scenario.value.events) return []
      return [...scenario.value.events].sort((a, b) => a.timelineOrder - b.timelineOrder)
    })

    const infoCategories = computed(() => {
      if (!scenario.value.worldInfoEntries) return ['全部']
      const categories = new Set(['全部'])
      scenario.value.worldInfoEntries.forEach(entry => {
        if (entry.category) categories.add(entry.category)
      })
      return Array.from(categories)
    })

    const filteredWorldInfo = computed(() => {
      if (!scenario.value.worldInfoEntries) return []
      if (selectedInfoCategory.value === '全部') {
        return scenario.value.worldInfoEntries
      }
      return scenario.value.worldInfoEntries.filter(entry =>
        entry.category === selectedInfoCategory.value
      )
    })

    // 方法
    const loadScenario = async () => {
      try {
        // 这里应该调用实际的API
        // const response = await scenarioApi.getEnhancedScenario(route.params.id)
        // scenario.value = response.data

        // 临时使用示例数据
        const exampleData = await import('../../../../../../enhanced-scenario-example.json')
        scenario.value = exampleData.scenario
        scenario.value.locations = exampleData.locations
        scenario.value.events = exampleData.events
        scenario.value.organizations = exampleData.organizations
        scenario.value.cultures = exampleData.cultures
        scenario.value.items = exampleData.items
        scenario.value.rules = exampleData.rules
        scenario.value.worldInfoEntries = exampleData.worldInfoEntries
        scenario.value.characterSettings = exampleData.characterSettings

        // 模拟用户数据
        scenario.value.user = { username: '示例用户' }
        scenario.value.rating = 4.8
        scenario.value.viewCount = 1234
        scenario.value.favoriteCount = 567
        scenario.value.createdAt = new Date().toISOString()
        scenario.value.updatedAt = new Date().toISOString()

      } catch (error) {
        console.error('加载剧本失败:', error)
        ElMessage.error('加载剧本失败')
      }
    }

    const formatContent = (content) => {
      // 简单的Markdown格式化
      return content
        .replace(/# (.*)/g, '<h3>$1</h3>')
        .replace(/## (.*)/g, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('zh-CN')
    }

    const selectLocation = (location) => {
      selectedLocation.value = location
    }

    const getProgressColor = (priority) => {
      const colors = {
        1: '#909399',
        2: '#E6A23C',
        3: '#F56C6C',
        4: '#67C23A',
        5: '#409EFF'
      }
      return colors[priority] || '#909399'
    }

    const startChat = () => {
      router.push(`/chat?scenario=${scenario.value.id}`)
    }

    const toggleFavorite = () => {
      isFavorited.value = !isFavorited.value
      ElMessage.success(isFavorited.value ? '已收藏' : '已取消收藏')
    }

    const cloneScenario = () => {
      ElMessage.success('剧本克隆功能开发中')
    }

    const editScenario = () => {
      router.push(`/scenarios/${scenario.value.id}/edit`)
    }

    onMounted(() => {
      loadScenario()
    })

    return {
      scenario,
      selectedLocation,
      selectedInfoCategory,
      activeTab,
      isFavorited,
      canEdit,

      scopeLabels,
      techLabels,
      magicLabels,
      contentRatingLabels,
      licenseLabels,
      locationTypeLabels,
      eventTypeLabels,
      organizationTypeLabels,
      orgStatusLabels,
      alignmentLabels,
      entryTypeLabels,
      visibilityLabels,
      abilityTypeLabels,

      sortedEvents,
      infoCategories,
      filteredWorldInfo,

      formatContent,
      formatDate,
      selectLocation,
      getProgressColor,
      startChat,
      toggleFavorite,
      cloneScenario,
      editScenario
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/mixins.scss";

.enhanced-scenario-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.scenario-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    .title-section {
      flex: 1;

      .scenario-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 15px 0;
        line-height: 1.2;
      }

      .scenario-meta {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        flex-wrap: wrap;

        span {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          backdrop-filter: blur(10px);
        }
      }

      .scenario-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }

    .stats-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 120px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;

        i {
          font-size: 1.2rem;
        }
      }
    }
  }

  .scenario-description {
    margin-bottom: 25px;
    font-size: 1.1rem;
    line-height: 1.6;
    opacity: 0.95;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.scenario-content {
  .overview-content {
    .content-section {
      margin-bottom: 30px;

      h3 {
        color: $primary-color;
        margin-bottom: 15px;
        font-size: 1.5rem;
      }

      .scenario-content-text {
        line-height: 1.8;
        font-size: 1.05rem;

        :deep(h3) {
          color: $primary-color;
          margin: 25px 0 15px 0;
        }

        :deep(h4) {
          color: $text-color-primary;
          margin: 20px 0 10px 0;
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .info-card {
        background: $bg-color-light;
        border-radius: 8px;
        padding: 20px;

        h4 {
          margin: 0 0 15px 0;
          color: $primary-color;
          font-size: 1.2rem;
        }

        .info-list {
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid $border-color-light;

            &:last-child {
              border-bottom: none;
            }

            .label {
              font-weight: 600;
              color: $text-color-regular;
            }

            .value {
              color: $text-color-primary;
            }
          }
        }

        .world-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;

          @media (max-width: 480px) {
            grid-template-columns: repeat(2, 1fr);
          }

          .world-stat {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid $border-color-light;

            .icon {
              font-size: 1.5rem;
              display: block;
              margin-bottom: 8px;
            }

            .count {
              font-size: 1.5rem;
              font-weight: 700;
              color: $primary-color;
              display: block;
            }

            .label {
              font-size: 0.9rem;
              color: $text-color-regular;
            }
          }
        }
      }
    }
  }

  .locations-content {
    .location-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;

      .location-card {
        background: $bg-color-light;
        border: 1px solid $border-color-light;
        border-radius: 8px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: $primary-color;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &.active {
          border-color: $primary-color;
          background: rgba($primary-color, 0.05);
        }

        h4 {
          margin: 0 0 8px 0;
          color: $primary-color;
          font-size: 1.2rem;
        }

        .location-type {
          display: inline-block;
          background: $primary-color;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-bottom: 10px;
        }

        .location-desc {
          color: $text-color-regular;
          line-height: 1.5;
          margin-bottom: 15px;
        }

        .location-features {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;

          .more-features {
            color: $text-color-placeholder;
            font-size: 0.9rem;
          }
        }
      }
    }

    .location-detail {
      background: $bg-color-light;
      border-radius: 8px;
      padding: 25px;

      h3 {
        color: $primary-color;
        margin: 0 0 20px 0;
        font-size: 1.5rem;
      }

      .location-info {
        .basic-info {
          margin-bottom: 25px;

          p {
            line-height: 1.6;
            margin-bottom: 15px;
          }

          .location-meta {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;

            span {
              color: $text-color-regular;
              font-size: 0.95rem;
            }
          }
        }

        .feature-lists {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;

          .feature-group {
            h5 {
              color: $primary-color;
              margin: 0 0 10px 0;
              font-size: 1.1rem;
            }

            ul {
              list-style: none;
              padding: 0;
              margin: 0;

              li {
                padding: 6px 0;
                color: $text-color-regular;
                line-height: 1.4;

                &:before {
                  content: "•";
                  color: $primary-color;
                  margin-right: 8px;
                }
              }
            }
          }
        }
      }
    }
  }

  .events-content {
    .timeline {
      position: relative;

      &:before {
        content: '';
        position: absolute;
        left: 30px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: $border-color-light;
      }

      .timeline-item {
        position: relative;
        margin-bottom: 40px;
        padding-left: 80px;

        &.historical {
          .timeline-marker {
            background: #67C23A;
          }
        }

        &.current {
          .timeline-marker {
            background: #E6A23C;
          }
        }

        &.future, &.prophecy {
          .timeline-marker {
            background: #409EFF;
          }
        }

        .timeline-marker {
          position: absolute;
          left: 15px;
          top: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: $primary-color;
          display: flex;
          align-items: center;
          justify-content: center;

          .importance-badge {
            color: white;
            font-weight: 700;
            font-size: 0.9rem;
          }
        }

        .timeline-content {
          background: $bg-color-light;
          border-radius: 8px;
          padding: 20px;

          .event-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;

            h4 {
              margin: 0;
              color: $primary-color;
              font-size: 1.3rem;
              flex: 1;
            }

            .event-date {
              background: rgba($primary-color, 0.1);
              color: $primary-color;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.9rem;
              font-weight: 600;
            }

            .event-type {
              background: $text-color-placeholder;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.9rem;
            }
          }

          .event-description {
            line-height: 1.6;
            color: $text-color-regular;
            margin-bottom: 15px;
          }

          .event-consequences {
            margin-top: 20px;

            h5 {
              color: $primary-color;
              margin: 0 0 10px 0;
              font-size: 1.1rem;
            }

            p {
              line-height: 1.5;
              color: $text-color-regular;
            }
          }

          .event-participants {
            margin-top: 15px;

            h5 {
              color: $primary-color;
              margin: 0 0 10px 0;
              font-size: 1.1rem;
            }

            .participants-list {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }
          }
        }
      }
    }
  }

  .organizations-content {
    .organization-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 25px;

      .organization-card {
        background: $bg-color-light;
        border: 1px solid $border-color-light;
        border-radius: 8px;
        padding: 25px;

        .org-header {
          margin-bottom: 15px;

          h4 {
            margin: 0 0 10px 0;
            color: $primary-color;
            font-size: 1.3rem;
          }

          .org-meta {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;

            .org-type {
              background: $primary-color;
              color: white;
              padding: 3px 10px;
              border-radius: 12px;
              font-size: 0.85rem;
            }

            .power-level {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.9rem;
              color: $text-color-regular;
            }
          }
        }

        .org-description {
          line-height: 1.6;
          color: $text-color-regular;
          margin-bottom: 20px;
        }

        .org-details {
          margin-bottom: 20px;

          .detail-item {
            padding: 5px 0;
            color: $text-color-regular;
            font-size: 0.95rem;

            strong {
              color: $text-color-primary;
            }
          }
        }

        .org-goals {
          h5 {
            color: $primary-color;
            margin: 0 0 15px 0;
            font-size: 1.1rem;
          }

          .goals-list {
            .goal-item {
              margin-bottom: 15px;

              .goal-desc {
                display: block;
                color: $text-color-primary;
                font-weight: 600;
                margin-bottom: 8px;
              }
            }
          }
        }
      }
    }
  }

  .world-info-content {
    .info-categories {
      margin-bottom: 25px;
    }

    .info-entries {
      .info-entry {
        background: $bg-color-light;
        border: 1px solid $border-color-light;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;

          h4 {
            margin: 0;
            color: $primary-color;
            font-size: 1.2rem;
            flex: 1;
          }

          .entry-meta {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;

            span {
              background: rgba($primary-color, 0.1);
              color: $primary-color;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 0.8rem;
            }
          }
        }

        .entry-content {
          line-height: 1.6;
          color: $text-color-regular;
          margin-bottom: 15px;
        }

        .entry-keywords {
          margin-bottom: 15px;

          h5 {
            color: $primary-color;
            margin: 0 0 8px 0;
            font-size: 1rem;
          }
        }

        .entry-conditions {
          h5 {
            color: $primary-color;
            margin: 0 0 8px 0;
            font-size: 1rem;
          }

          .conditions-list {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;

            .condition-tag {
              background: rgba($warning-color, 0.1);
              color: $warning-color;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 0.8rem;
            }
          }
        }
      }
    }
  }

  .characters-content {
    .character-settings {
      .character-setting-card {
        background: $bg-color-light;
        border: 1px solid $border-color-light;
        border-radius: 8px;
        padding: 25px;
        margin-bottom: 25px;

        h4 {
          margin: 0 0 20px 0;
          color: $primary-color;
          font-size: 1.3rem;
        }

        .setting-section {
          margin-bottom: 25px;

          h5 {
            color: $primary-color;
            margin: 0 0 12px 0;
            font-size: 1.1rem;
          }

          p {
            line-height: 1.6;
            color: $text-color-regular;
            margin-bottom: 10px;
          }

          .abilities-list {
            .ability-item {
              background: rgba($primary-color, 0.05);
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 10px;

              strong {
                color: $primary-color;
              }

              p {
                margin: 8px 0;
              }

              .limitations {
                margin-top: 8px;

                small {
                  color: $text-color-placeholder;
                }
              }
            }
          }

          .goals-list {
            .goal-item {
              background: rgba($success-color, 0.05);
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 15px;

              strong {
                color: $success-color;
              }

              p {
                margin: 8px 0;
                font-style: italic;
              }

              .obstacles {
                margin-top: 10px;

                small {
                  color: $text-color-placeholder;
                }
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .enhanced-scenario-detail {
    padding: 10px;
  }

  .scenario-header {
    padding: 20px;

    .header-main {
      flex-direction: column;
      gap: 20px;

      .title-section .scenario-title {
        font-size: 2rem;
      }
    }
  }
}
</style>
