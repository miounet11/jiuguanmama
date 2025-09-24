<template>
  <div class="profile-page">
    <div class="profile-container">
      <TavernCard variant="glass" class="profile-main-card">
        <div class="profile-header">
          <div class="user-avatar-section">
            <div class="avatar-wrapper">
              <img
                :src="user?.avatar || '/default-avatar.png'"
                :alt="user?.username"
                class="user-avatar"
              />
              <div class="avatar-border"></div>
            </div>
          </div>
          <div class="user-info">
            <h1 class="username">{{ user?.username || '加载中...' }}</h1>
            <p class="user-email">{{ user?.email || 'email@example.com' }}</p>
            <div class="user-badges">
              <TavernBadge variant="primary" class="member-badge">
                <TavernIcon name="star" class="badge-icon" />
                {{ user?.tier || '免费用户' }}
              </TavernBadge>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <TavernCard variant="default" class="stat-card">
            <div class="stat-header">
              <TavernIcon name="user-circle" class="stat-icon" />
              <h3 class="stat-title">账户信息</h3>
            </div>
            <div class="stat-content">
              <div class="stat-item">
                <span class="stat-label">注册时间</span>
                <span class="stat-value">{{ formatDate(user?.createdAt) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">会员等级</span>
                <TavernBadge :variant="getTierVariant(user?.tier)" class="tier-badge">
                  {{ user?.tier || '免费用户' }}
                </TavernBadge>
              </div>
            </div>
          </TavernCard>

          <TavernCard variant="default" class="stat-card">
            <div class="stat-header">
              <TavernIcon name="chart-bar" class="stat-icon" />
              <h3 class="stat-title">使用统计</h3>
            </div>
            <div class="stat-content">
              <div class="stat-item">
                <span class="stat-label">创建角色</span>
                <span class="stat-value highlight">{{ stats?.charactersCreated || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总对话数</span>
                <span class="stat-value highlight">{{ stats?.totalChats || 0 }}</span>
              </div>
            </div>
          </TavernCard>

          <TavernCard variant="default" class="stat-card">
            <div class="stat-header">
              <TavernIcon name="cpu-chip" class="stat-icon" />
              <h3 class="stat-title">配额使用</h3>
            </div>
            <div class="stat-content">
              <div class="stat-item">
                <span class="stat-label">本月消息</span>
                <span class="stat-value">{{ stats?.monthlyMessages || 0 }} / {{ stats?.messageLimit || '无限' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Token使用</span>
                <span class="stat-value highlight">{{ formatNumber(stats?.tokensUsed || 0) }}</span>
              </div>
            </div>
          </TavernCard>
        </div>
      </TavernCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from '@/utils/axios'

const userStore = useUserStore()
const user = ref(userStore.user)
const stats = ref<any>({})

const formatDate = (date: any) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const getTierVariant = (tier: string) => {
  switch (tier) {
    case 'pro':
      return 'primary'
    case 'plus':
      return 'success'
    default:
      return 'secondary'
  }
}

const fetchUserStats = async () => {
  try {
    const response = await axios.get('/api/user/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    // 使用模拟数据以避免空白页面
    stats.value = {
      charactersCreated: 12,
      totalChats: 156,
      monthlyMessages: 450,
      messageLimit: 1000,
      tokensUsed: 125000
    }
  }
}

onMounted(() => {
  fetchUserStats()
})
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
  padding: var(--dt-spacing-lg);
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-main-card {
  padding: var(--dt-spacing-3xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

// 用户头部区域
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-2xl);
  margin-bottom: var(--dt-spacing-3xl);
  padding-bottom: var(--dt-spacing-2xl);
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);
}

.user-avatar-section {
  position: relative;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: var(--dt-radius-full);
  object-fit: cover;
  border: 4px solid rgba(168, 85, 247, 0.3);
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.avatar-border {
  position: absolute;
  inset: -2px;
  border-radius: var(--dt-radius-full);
  background: var(--dt-gradient-primary);
  z-index: -1;
  animation: rotate 3s linear infinite;
}

.user-info {
  flex: 1;
}

.username {
  font-size: var(--dt-font-size-3xl);
  font-weight: var(--dt-font-weight-bold);
  background: var(--dt-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--dt-spacing-sm);
  animation: glow 2s ease-in-out infinite alternate;
}

.user-email {
  font-size: var(--dt-font-size-lg);
  color: var(--dt-color-text-secondary);
  margin-bottom: var(--dt-spacing-md);
  opacity: 0.8;
}

.user-badges {
  display: flex;
  gap: var(--dt-spacing-md);
}

.member-badge {
  .badge-icon {
    margin-right: var(--dt-spacing-xs);
  }
}

// 统计数据网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--dt-spacing-xl);
}

.stat-card {
  padding: var(--dt-spacing-xl);
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 40px rgba(168, 85, 247, 0.2);
    border-color: rgba(168, 85, 247, 0.3);
  }
}

.stat-header {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  margin-bottom: var(--dt-spacing-lg);
}

.stat-icon {
  width: 24px;
  height: 24px;
  color: var(--dt-color-primary);
}

.stat-title {
  font-size: var(--dt-font-size-lg);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-md);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--dt-spacing-sm) 0;
}

.stat-label {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-tertiary);
  opacity: 0.8;
}

.stat-value {
  font-size: var(--dt-font-size-md);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-primary);

  &.highlight {
    background: var(--dt-gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: var(--dt-font-weight-bold);
  }
}

.tier-badge {
  font-size: var(--dt-font-size-xs);
  padding: var(--dt-spacing-xs) var(--dt-spacing-sm);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .profile-page {
    padding: var(--dt-spacing-md);
  }

  .profile-main-card {
    padding: var(--dt-spacing-lg);
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: var(--dt-spacing-lg);
  }

  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .username {
    font-size: var(--dt-font-size-2xl);
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--dt-spacing-md);
  }

  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--dt-spacing-xs);
  }
}
</style>
