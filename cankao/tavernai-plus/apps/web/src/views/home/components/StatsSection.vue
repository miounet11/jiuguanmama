<template>
  <section class="stats-section">
    <!-- 背景装饰 -->
    <div class="stats-background">
      <div class="background-grid" />
      <div class="background-glow" />
    </div>

    <div class="stats-container">
      <!-- 区块头部 -->
      <div class="stats-header">
        <div class="header-badge">
          <TavernBadge variant="accent" size="sm" soft>
            <TavernIcon name="trending-up" size="xs" />
            实时数据
          </TavernBadge>
        </div>

        <h2 class="stats-title">
          平台<span class="title-highlight">数据概览</span>
        </h2>

        <p class="stats-subtitle">
          见证九馆爸爸的成长轨迹，每一个数字都是用户信任的体现
        </p>
      </div>

      <!-- 主要统计数据 -->
      <div class="main-stats">
        <div class="stats-grid">
          <!-- 用户数据卡片 -->
          <div class="stat-card stat-card--primary" data-aos="fade-up" data-aos-delay="0">
            <div class="card-icon">
              <TavernIcon name="users" size="xl" />
            </div>
            <div class="card-content">
              <div class="stat-number" :class="{ 'counting': isAnimating('totalUsers') }">
                {{ formatNumber(getAnimatedValue('totalUsers')) }}
                <span class="stat-suffix">+</span>
              </div>
              <div class="stat-label">注册用户</div>
              <div class="stat-growth">
                <TavernIcon name="trending-up" size="xs" />
                今日新增 {{ getAnimatedValue('newUsersToday') }}
              </div>
            </div>
            <div class="card-sparkline">
              <svg viewBox="0 0 200 50" class="sparkline-svg">
                <path
                  d="M0,40 Q50,20 100,25 T200,15"
                  stroke="currentColor"
                  stroke-width="2"
                  fill="none"
                />
              </svg>
            </div>
          </div>

          <!-- 角色数据卡片 -->
          <div class="stat-card stat-card--secondary" data-aos="fade-up" data-aos-delay="100">
            <div class="card-icon">
              <TavernIcon name="star" size="xl" />
            </div>
            <div class="card-content">
              <div class="stat-number" :class="{ 'counting': isAnimating('totalCharacters') }">
                {{ formatNumber(getAnimatedValue('totalCharacters')) }}
              </div>
              <div class="stat-label">精选角色</div>
              <div class="stat-growth">
                <TavernIcon name="plus" size="xs" />
                今日新增 {{ getAnimatedValue('newCharactersToday') }}
              </div>
            </div>
            <div class="card-decoration">
              <div class="floating-icon floating-icon-1">✨</div>
              <div class="floating-icon floating-icon-2">🎭</div>
              <div class="floating-icon floating-icon-3">🎨</div>
            </div>
          </div>

          <!-- 对话数据卡片 -->
          <div class="stat-card stat-card--accent" data-aos="fade-up" data-aos-delay="200">
            <div class="card-icon">
              <TavernIcon name="chat" size="xl" />
            </div>
            <div class="card-content">
              <div class="stat-number" :class="{ 'counting': isAnimating('totalChats') }">
                {{ formatNumber(getAnimatedValue('totalChats')) }}
              </div>
              <div class="stat-label">对话次数</div>
              <div class="stat-growth">
                <TavernIcon name="message" size="xs" />
                今日对话 {{ getAnimatedValue('newChatsToday') }}
              </div>
            </div>
            <div class="card-pulse">
              <div class="pulse-dot" />
              <div class="pulse-ring" />
            </div>
          </div>

          <!-- 在线用户卡片 -->
          <div class="stat-card stat-card--success" data-aos="fade-up" data-aos-delay="300">
            <div class="card-icon">
              <TavernIcon name="globe" size="xl" />
            </div>
            <div class="card-content">
              <div class="stat-number" :class="{ 'counting': isAnimating('activeUsersNow') }">
                {{ getAnimatedValue('activeUsersNow') }}
              </div>
              <div class="stat-label">在线用户</div>
              <div class="stat-growth">
                <div class="online-indicator">
                  <div class="status-dot" />
                  实时更新
                </div>
              </div>
            </div>
            <div class="card-live-indicator">
              <span class="live-badge">LIVE</span>
            </div>
          </div>
        </div>

        <!-- 次要统计指标 -->
        <div class="secondary-stats" data-aos="fade-up" data-aos-delay="400">
          <div class="secondary-stat-item">
            <div class="secondary-icon">
              <TavernIcon name="heart" size="md" />
            </div>
            <div class="secondary-content">
              <div class="secondary-number">{{ formatNumber(stats.totalFavorites) }}</div>
              <div class="secondary-label">收藏总数</div>
            </div>
          </div>

          <div class="secondary-stat-item">
            <div class="secondary-icon">
              <TavernIcon name="star" size="md" />
            </div>
            <div class="secondary-content">
              <div class="secondary-number">{{ stats.averageRating.toFixed(1) }}</div>
              <div class="secondary-label">平均评分</div>
            </div>
          </div>

          <div class="secondary-stat-item">
            <div class="secondary-icon">
              <TavernIcon name="zap" size="md" />
            </div>
            <div class="secondary-content">
              <div class="secondary-number">{{ stats.responseTime }}s</div>
              <div class="secondary-label">响应时间</div>
            </div>
          </div>

          <div class="secondary-stat-item">
            <div class="secondary-icon">
              <TavernIcon name="thumbs-up" size="md" />
            </div>
            <div class="secondary-content">
              <div class="secondary-number">{{ stats.satisfaction }}%</div>
              <div class="secondary-label">用户满意度</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类统计 -->
      <div class="category-stats" data-aos="fade-up" data-aos-delay="500">
        <h3 class="category-title">热门分类</h3>
        <div class="category-grid">
          <div
            v-for="(category, index) in stats.topCategories"
            :key="category.name"
            class="category-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="category-bar">
              <div
                class="category-progress"
                :style="{
                  width: `${(category.count / maxCategoryCount) * 100}%`,
                  background: getCategoryColor(index)
                }"
              />
            </div>
            <div class="category-info">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-count">{{ category.count }} 个角色</div>
            </div>
            <div class="category-growth" :class="getGrowthClass(category.growth)">
              <TavernIcon
                :name="category.growth >= 0 ? 'trending-up' : 'trending-down'"
                size="xs"
              />
              {{ Math.abs(category.growth) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 时间线统计 -->
      <div class="timeline-stats" data-aos="fade-up" data-aos-delay="600">
        <h3 class="timeline-title">成长轨迹</h3>
        <div class="timeline">
          <div
            v-for="milestone in milestones"
            :key="milestone.id"
            class="timeline-item"
            :class="milestone.type"
          >
            <div class="timeline-marker">
              <TavernIcon :name="milestone.icon" size="sm" />
            </div>
            <div class="timeline-content">
              <div class="timeline-date">{{ milestone.date }}</div>
              <div class="timeline-title">{{ milestone.title }}</div>
              <div class="timeline-description">{{ milestone.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  TavernBadge,
  TavernIcon
} from '@/components/design-system'
import { useHomeStats } from '../composables/useHomeStats'

const {
  stats,
  loading,
  formatNumber,
  getAnimatedValue,
  isAnimating
} = useHomeStats()

// 里程碑数据
const milestones = ref([
  {
    id: 1,
    type: 'major',
    icon: 'rocket',
    date: '2024年1月',
    title: '九馆爸爸正式上线',
    description: '首个版本发布，开启AI角色扮演新纪元'
  },
  {
    id: 2,
    type: 'minor',
    icon: 'users',
    date: '2024年3月',
    title: '用户突破1万',
    description: '感谢广大用户的支持与信任'
  },
  {
    id: 3,
    type: 'major',
    icon: 'star',
    title: '角色市场开放',
    date: '2024年5月',
    description: '用户可以分享和交换自己创作的角色'
  },
  {
    id: 4,
    type: 'minor',
    icon: 'chat',
    date: '2024年7月',
    title: '对话次数破百万',
    description: 'AI对话技术持续优化，用户体验不断提升'
  },
  {
    id: 5,
    type: 'current',
    icon: 'sparkles',
    date: '2024年9月',
    title: '新功能持续上线',
    description: '语音对话、多人聊天室等功能即将推出'
  }
])

// 计算属性
const maxCategoryCount = computed(() => {
  return Math.max(...stats.topCategories.map(cat => cat.count))
})

// 方法
const getCategoryColor = (index: number): string => {
  const colors = [
    'linear-gradient(135deg, var(--brand-primary-500), var(--brand-primary-400))',
    'linear-gradient(135deg, var(--brand-secondary-500), var(--brand-secondary-400))',
    'linear-gradient(135deg, var(--brand-accent-500), var(--brand-accent-400))',
    'linear-gradient(135deg, var(--warning), #fbbf24)',
    'linear-gradient(135deg, var(--error), #f87171)'
  ]
  return colors[index % colors.length]
}

const getGrowthClass = (growth: number): string => {
  if (growth > 0) return 'growth-positive'
  if (growth < 0) return 'growth-negative'
  return 'growth-neutral'
}

// 生命周期
onMounted(() => {
  // 初始化AOS动画 (如果有的话)
  // 这里可以添加滚动动画库的初始化
})
</script>

<style lang="scss">
.stats-section {
  padding: var(--section-padding-y) 0;
  background: var(--surface-0);
  position: relative;
  overflow: hidden;

  // 背景装饰
  .stats-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-below);
  }

  .background-grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.03;
    background-image:
      linear-gradient(var(--border-secondary) 1px, transparent 1px),
      linear-gradient(90deg, var(--border-secondary) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .background-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 800px;
    height: 600px;
    background: radial-gradient(
      ellipse,
      rgba(168, 85, 247, 0.1) 0%,
      transparent 70%
    );
    transform: translate(-50%, -50%);
  }

  .stats-container {
    width: 100%;
    max-width: var(--container-2xl);
    margin: 0 auto;
    padding: 0 var(--container-padding);
    position: relative;
    z-index: var(--z-content);
  }

  // === 头部区域 ===
  .stats-header {
    text-align: center;
    margin-bottom: var(--space-16);

    .header-badge {
      margin-bottom: var(--space-4);
      display: inline-block;
    }
  }

  .stats-title {
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0 0 var(--space-4) 0;
    line-height: var(--leading-tight);

    .title-highlight {
      background: linear-gradient(
        135deg,
        var(--brand-accent-400),
        var(--brand-primary-400)
      );
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
  }

  .stats-subtitle {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0 auto;
    max-width: 600px;
  }

  // === 主要统计数据 ===
  .main-stats {
    margin-bottom: var(--space-20);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-12);
  }

  .stat-card {
    position: relative;
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    overflow: hidden;
    transition: var(--card-transition);

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--card-shadow-hover);
    }

    // 卡片变体
    &--primary {
      background: linear-gradient(135deg, var(--surface-2), rgba(168, 85, 247, 0.05));
      border-color: rgba(168, 85, 247, 0.2);

      .card-icon {
        color: var(--brand-primary-400);
      }
    }

    &--secondary {
      background: linear-gradient(135deg, var(--surface-2), rgba(59, 130, 246, 0.05));
      border-color: rgba(59, 130, 246, 0.2);

      .card-icon {
        color: var(--brand-secondary-400);
      }
    }

    &--accent {
      background: linear-gradient(135deg, var(--surface-2), rgba(16, 185, 129, 0.05));
      border-color: rgba(16, 185, 129, 0.2);

      .card-icon {
        color: var(--brand-accent-400);
      }
    }

    &--success {
      background: linear-gradient(135deg, var(--surface-2), rgba(34, 197, 94, 0.05));
      border-color: rgba(34, 197, 94, 0.2);

      .card-icon {
        color: var(--success);
      }
    }
  }

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--space-16);
    height: var(--space-16);
    background: var(--surface-3);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-6);
    flex-shrink: 0;
  }

  .card-content {
    position: relative;
    z-index: var(--z-content);
  }

  .stat-number {
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: var(--space-2);
    transition: var(--transition-colors);

    &.counting {
      color: var(--brand-primary-400);
    }

    .stat-suffix {
      font-size: var(--text-2xl);
      color: var(--text-tertiary);
    }
  }

  .stat-label {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
    font-weight: var(--font-medium);
  }

  .stat-growth {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--success);
    font-weight: var(--font-medium);

    .tavern-icon {
      flex-shrink: 0;
    }
  }

  .online-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .status-dot {
      width: var(--space-2);
      height: var(--space-2);
      background: var(--success);
      border-radius: var(--radius-full);
      animation: pulse 2s infinite;
    }
  }

  // 卡片装饰元素
  .card-sparkline {
    position: absolute;
    bottom: var(--space-4);
    right: var(--space-4);
    width: 100px;
    height: 30px;
    opacity: 0.3;

    .sparkline-svg {
      width: 100%;
      height: 100%;
      color: currentColor;
    }
  }

  .card-decoration {
    position: absolute;
    top: 0;
    right: 0;
    width: 120px;
    height: 120px;
    opacity: 0.1;
    overflow: hidden;

    .floating-icon {
      position: absolute;
      font-size: var(--text-2xl);
      animation: float 3s ease-in-out infinite;

      &.floating-icon-1 {
        top: 20%;
        right: 20%;
        animation-delay: 0s;
      }

      &.floating-icon-2 {
        top: 60%;
        right: 40%;
        animation-delay: 1s;
      }

      &.floating-icon-3 {
        top: 40%;
        right: 60%;
        animation-delay: 2s;
      }
    }
  }

  .card-pulse {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);

    .pulse-dot {
      width: var(--space-3);
      height: var(--space-3);
      background: var(--brand-accent-400);
      border-radius: var(--radius-full);
      position: relative;
    }

    .pulse-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: var(--space-6);
      height: var(--space-6);
      border: 2px solid var(--brand-accent-400);
      border-radius: var(--radius-full);
      transform: translate(-50%, -50%);
      animation: pulse-ring 2s infinite;
    }
  }

  .card-live-indicator {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);

    .live-badge {
      display: inline-block;
      padding: var(--space-1) var(--space-2);
      background: var(--error);
      color: white;
      font-size: var(--text-2xs);
      font-weight: var(--font-bold);
      border-radius: var(--radius-sm);
      animation: blink 1.5s infinite;
    }
  }

  // === 次要统计指标 ===
  .secondary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
  }

  .secondary-stat-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface-1);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    transition: var(--card-transition);

    &:hover {
      background: var(--surface-2);
    }
  }

  .secondary-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--space-10);
    height: var(--space-10);
    background: var(--surface-3);
    border-radius: var(--radius-base);
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .secondary-content {
    .secondary-number {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: var(--space-1);
    }

    .secondary-label {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }
  }

  // === 分类统计 ===
  .category-stats {
    margin-bottom: var(--space-20);
  }

  .category-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    text-align: center;
    margin: 0 0 var(--space-8) 0;
  }

  .category-grid {
    display: grid;
    gap: var(--space-4);
  }

  .category-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--surface-2);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    align-items: center;
    transition: var(--card-transition);

    &:hover {
      background: var(--surface-3);
    }
  }

  .category-bar {
    height: var(--space-2);
    background: var(--surface-3);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: var(--space-2);

    .category-progress {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 1s ease-out;
      animation: slideInLeft 1s ease-out;
    }
  }

  .category-info {
    .category-name {
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .category-count {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }
  }

  .category-growth {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);

    &.growth-positive {
      color: var(--success);
    }

    &.growth-negative {
      color: var(--error);
    }

    &.growth-neutral {
      color: var(--text-tertiary);
    }
  }

  // === 时间线统计 ===
  .timeline-stats {
    .timeline-title {
      font-size: var(--text-2xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      text-align: center;
      margin: 0 0 var(--space-12) 0;
    }
  }

  .timeline {
    position: relative;
    max-width: 800px;
    margin: 0 auto;

    &::before {
      content: '';
      position: absolute;
      left: var(--space-6);
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border-secondary);
    }
  }

  .timeline-item {
    position: relative;
    display: flex;
    gap: var(--space-6);
    margin-bottom: var(--space-8);

    &.major .timeline-marker {
      background: var(--brand-primary-500);
      color: white;
    }

    &.minor .timeline-marker {
      background: var(--brand-secondary-500);
      color: white;
    }

    &.current .timeline-marker {
      background: var(--brand-accent-500);
      color: white;
      animation: glow 2s infinite;
    }
  }

  .timeline-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--space-12);
    height: var(--space-12);
    background: var(--surface-3);
    border: 2px solid var(--border-secondary);
    border-radius: var(--radius-full);
    flex-shrink: 0;
    z-index: var(--z-content);
  }

  .timeline-content {
    flex: 1;
    padding-top: var(--space-2);

    .timeline-date {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
      margin-bottom: var(--space-1);
    }

    .timeline-title {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }

    .timeline-description {
      font-size: var(--text-base);
      color: var(--text-secondary);
      line-height: var(--leading-relaxed);
    }
  }

  // === 响应式设计 ===

  @media (max-width: 1024px) {
    .stats-title {
      font-size: var(--text-3xl);
    }

    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
    }

    .secondary-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    padding: var(--space-16) 0;

    .stats-container {
      padding: 0 var(--space-4);
    }

    .stats-title {
      font-size: var(--text-2xl);
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }

    .stat-card {
      padding: var(--space-6);
    }

    .stat-number {
      font-size: var(--text-3xl);
    }

    .secondary-stats {
      grid-template-columns: 1fr;
    }

    .category-item {
      grid-template-columns: 1fr;
      gap: var(--space-2);
    }

    .timeline {
      &::before {
        left: var(--space-4);
      }
    }

    .timeline-item {
      gap: var(--space-4);
    }

    .timeline-marker {
      width: var(--space-8);
      height: var(--space-8);
    }
  }
}

// === 动画定义 ===

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.5;
  }
}

@keyframes slideInLeft {
  from {
    width: 0;
  }
  to {
    width: var(--final-width, 100%);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
  }
}

// === 可访问性优化 ===

@media (prefers-reduced-motion: reduce) {
  .floating-icon,
  .pulse-dot,
  .pulse-ring,
  .live-badge,
  .timeline-marker {
    animation: none !important;
  }

  .stat-card:hover {
    transform: none;
  }

  .category-progress {
    transition: none;
  }
}
</style>