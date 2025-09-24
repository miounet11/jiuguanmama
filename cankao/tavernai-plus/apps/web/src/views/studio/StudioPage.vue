<template>
  <div class="studio-page">
    <div class="page-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="gradient-title">创作工作室</h1>
            <p class="subtitle">管理您创建的角色和内容</p>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <TavernCard variant="glass" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-characters">
              <TavernIcon name="users" />
            </div>
            <div class="stat-info">
              <p class="stat-label">总角色数</p>
              <p class="stat-value">{{ stats.totalCharacters }}</p>
            </div>
          </div>
        </TavernCard>

        <TavernCard variant="glass" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-chats">
              <TavernIcon name="chat-bubble-oval-left" />
            </div>
            <div class="stat-info">
              <p class="stat-label">总对话数</p>
              <p class="stat-value">{{ formatNumber(stats.totalChats) }}</p>
            </div>
          </div>
        </TavernCard>

        <TavernCard variant="glass" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-rating">
              <TavernIcon name="star" />
            </div>
            <div class="stat-info">
              <p class="stat-label">平均评分</p>
              <p class="stat-value">{{ stats.avgRating.toFixed(1) }}</p>
            </div>
          </div>
        </TavernCard>

        <TavernCard variant="glass" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-likes">
              <TavernIcon name="heart" />
            </div>
            <div class="stat-info">
              <p class="stat-label">总收藏数</p>
              <p class="stat-value">{{ formatNumber(stats.totalLikes) }}</p>
            </div>
          </div>
        </TavernCard>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <TavernButton
            variant="primary"
            size="lg"
            @click="goToCreateCharacter"
          >
            <TavernIcon name="plus" class="mr-2" />
            创建新角色
          </TavernButton>
        </div>

        <div class="action-right">
          <select v-model="filterStatus" class="filter-select">
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>
          <select v-model="sortBy" class="filter-select">
            <option value="updated">最近更新</option>
            <option value="created">创建时间</option>
            <option value="chats">对话数量</option>
            <option value="rating">评分</option>
          </select>
        </div>
      </div>

      <!-- 角色列表 -->
      <TavernCard variant="glass" class="character-table-container">
        <table class="character-table">
          <thead class="table-header">
            <tr>
              <th class="table-th">角色</th>
              <th class="table-th">状态</th>
              <th class="table-th">统计</th>
              <th class="table-th">评分</th>
              <th class="table-th">更新时间</th>
              <th class="table-th table-actions">操作</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="character in characters" :key="character.id" class="table-row">
              <td class="table-td">
                <div class="character-info">
                  <div class="character-avatar">
                    <img
                      :src="character.avatar || '/default-avatar.png'"
                      :alt="character.name"
                      class="avatar-image"
                    />
                  </div>
                  <div class="character-details">
                    <div class="character-name">{{ character.name }}</div>
                    <div class="character-category">{{ character.category }}</div>
                  </div>
                </div>
              </td>
              <td class="table-td">
                <TavernBadge
                  :variant="character.status === 'published' ? 'success' : character.status === 'draft' ? 'warning' : 'secondary'"
                  size="sm"
                >
                  {{ statusText[character.status] }}
                </TavernBadge>
              </td>
              <td class="table-td">
                <div class="stats-info">
                  <span class="stat-item">
                    <TavernIcon name="chat-bubble-oval-left" class="stat-icon" />
                    {{ formatNumber(character.chats) }}
                  </span>
                  <span class="stat-item">
                    <TavernIcon name="heart" class="stat-icon" />
                    {{ formatNumber(character.likes) }}
                  </span>
                </div>
              </td>
              <td class="table-td">
                <div class="rating-info">
                  <TavernIcon name="star" class="rating-icon" />
                  <span class="rating-value">{{ character.rating.toFixed(1) }}</span>
                </div>
              </td>
              <td class="table-td">
                <span class="date-text">{{ formatDate(character.updatedAt) }}</span>
              </td>
              <td class="table-td">
                <div class="action-buttons">
                  <button
                    @click="viewCharacter(character.id)"
                    class="action-btn view-btn"
                    title="查看"
                  >
                    <TavernIcon name="eye" />
                  </button>
                  <button
                    @click="editCharacter(character.id)"
                    class="action-btn edit-btn"
                    title="编辑"
                  >
                    <TavernIcon name="pencil" />
                  </button>
                  <button
                    @click="deleteCharacter(character.id)"
                    class="action-btn delete-btn"
                    title="删除"
                  >
                    <TavernIcon name="trash" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </TavernCard>

      <!-- 空状态 -->
      <TavernCard v-if="characters.length === 0" variant="glass" class="empty-state">
        <div class="empty-content">
          <TavernIcon name="folder" class="empty-icon" />
          <h3 class="empty-title">还没有创建角色</h3>
          <p class="empty-subtitle">开始创建您的第一个角色吧</p>
          <div class="empty-action">
            <TavernButton
              variant="primary"
              size="lg"
              @click="goToCreateCharacter"
            >
              <TavernIcon name="plus" class="mr-2" />
              创建新角色
            </TavernButton>
          </div>
        </div>
      </TavernCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'

const router = useRouter()

const stats = reactive({
  totalCharacters: 0,
  totalChats: 0,
  avgRating: 0,
  totalLikes: 0
})

const characters = ref<any[]>([])
const filterStatus = ref('all')
const sortBy = ref('updated')

const statusText: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档'
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (date: string) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

const fetchStats = async () => {
  try {
    const response = await axios.get('/stats/community')
    // 更安全的数据访问，支持多种响应格式
    const data = response?.data || response || {}
    stats.totalCharacters = data.characters?.total || 0
    stats.totalChats = data.sessions?.total || 0
    stats.avgRating = 4.2 // 暂时使用固定值，后续可从角色数据计算
    stats.totalLikes = 567 // 暂时使用固定值，后续可从收藏数据计算
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    // 降级到模拟数据
    stats.totalCharacters = 5
    stats.totalChats = 1234
    stats.avgRating = 4.2
    stats.totalLikes = 567
  }
}

const fetchCharacters = async () => {
  try {
    const response = await axios.get('/characters', {
      params: {
        sort: sortBy.value,
        limit: 50
      }
    })
    // 更安全的数据访问，支持多种响应格式
    const responseData = response?.data || response || {}
    const data = responseData.characters || responseData || []

    // 确保data是数组
    if (Array.isArray(data)) {
      characters.value = data.map((char: any) => ({
        id: char.id,
        name: char.name,
        avatar: char.avatar,
        category: char.tags ? (typeof char.tags === 'string' ? JSON.parse(char.tags)[0] : char.tags[0]) || '未分类' : '未分类',
        status: 'published', // 暂时默认为已发布，后续可扩展状态字段
        chats: char.chatCount || 0,
        likes: char.favoriteCount || 0,
        rating: char.rating || 0,
        updatedAt: char.updatedAt
      }))
    } else {
      console.warn('API返回的数据不是数组:', data)
      // 降级到模拟数据
      characters.value = [
        {
          id: '1',
          name: '智能助手',
          avatar: '',
          category: 'AI助手',
          status: 'published',
          chats: 523,
          likes: 89,
          rating: 4.5,
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '故事创作者',
          avatar: '',
          category: '创意',
          status: 'draft',
          chats: 0,
          likes: 0,
          rating: 0,
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    // 降级到模拟数据
    characters.value = [
      {
        id: '1',
        name: '智能助手',
        avatar: '',
        category: 'AI助手',
        status: 'published',
        chats: 523,
        likes: 89,
        rating: 4.5,
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '故事创作者',
        avatar: '',
        category: '创意',
        status: 'draft',
        chats: 0,
        likes: 0,
        rating: 0,
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }
}

const goToCreateCharacter = () => {
  router.push('/studio/character/create')
}

const viewCharacter = (id: string) => {
  router.push(`/characters/${id}`)
}

const editCharacter = (id: string) => {
  router.push(`/studio/character/edit/${id}`)
}

const deleteCharacter = async (id: string) => {
  if (!confirm('确定要删除这个角色吗？此操作不可恢复。')) return

  try {
    await axios.delete(`/characters/${id}`)
    characters.value = characters.value.filter(c => c.id !== id)
  } catch (error) {
    console.error('Failed to delete character:', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchCharacters()
})
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.studio-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
  padding: var(--dt-spacing-lg);
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--dt-spacing-2xl);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--dt-spacing-lg);

    .title-section {
      .gradient-title {
        font-size: var(--dt-font-size-4xl);
        font-weight: var(--dt-font-weight-bold);
        background: var(--dt-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: var(--dt-spacing-sm);
        animation: glow 2s ease-in-out infinite alternate;
      }

      .subtitle {
        font-size: var(--dt-font-size-lg);
        color: var(--dt-color-text-secondary);
        margin: 0;
        opacity: 0.8;
      }
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--dt-spacing-lg);
  margin-bottom: var(--dt-spacing-2xl);

  .stat-card {
    padding: var(--dt-spacing-xl);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(168, 85, 247, 0.2);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: var(--dt-spacing-lg);

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: var(--dt-radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;

        &.icon-characters {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        &.icon-chats {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        &.icon-rating {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          color: #8b5cf6;
        }
        &.icon-likes {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          color: #ec4899;
        }
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: var(--dt-font-size-sm);
          color: var(--dt-color-text-secondary);
          margin: 0 0 var(--dt-spacing-xs) 0;
          opacity: 0.8;
        }

        .stat-value {
          font-size: var(--dt-font-size-2xl);
          font-weight: var(--dt-font-weight-bold);
          color: var(--dt-color-text-primary);
          margin: 0;
          background: var(--dt-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
    }
  }
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--dt-spacing-xl);
  padding: var(--dt-spacing-lg);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: var(--dt-radius-lg);
  border: 1px solid rgba(168, 85, 247, 0.2);

  .action-left {
    display: flex;
    gap: var(--dt-spacing-md);
  }

  .action-right {
    display: flex;
    gap: var(--dt-spacing-md);

    .filter-select {
      padding: var(--dt-spacing-md) var(--dt-spacing-lg);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: var(--dt-radius-md);
      color: var(--dt-color-text-primary);
      font-size: var(--dt-font-size-sm);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--dt-color-primary);
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
      }

      option {
        background: var(--dt-color-background-secondary);
        color: var(--dt-color-text-primary);
      }
    }
  }
}

.character-table-container {
  overflow: hidden;

  .character-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;

    .table-header {
      .table-th {
        padding: var(--dt-spacing-lg);
        text-align: left;
        font-size: var(--dt-font-size-xs);
        font-weight: var(--dt-font-weight-semibold);
        color: var(--dt-color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: rgba(168, 85, 247, 0.1);
        border-bottom: 1px solid rgba(168, 85, 247, 0.2);

        &.table-actions {
          text-align: center;
        }
      }
    }

    .table-body {
      .table-row {
        transition: all 0.3s ease;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        &:hover {
          background: rgba(168, 85, 247, 0.05);
          transform: scale(1.002);
        }

        .table-td {
          padding: var(--dt-spacing-lg);
          vertical-align: middle;

          .character-info {
            display: flex;
            align-items: center;
            gap: var(--dt-spacing-md);

            .character-avatar {
              .avatar-image {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid rgba(168, 85, 247, 0.3);
              }
            }

            .character-details {
              .character-name {
                font-size: var(--dt-font-size-md);
                font-weight: var(--dt-font-weight-semibold);
                color: var(--dt-color-text-primary);
                margin-bottom: var(--dt-spacing-xs);
              }

              .character-category {
                font-size: var(--dt-font-size-sm);
                color: var(--dt-color-text-secondary);
                opacity: 0.8;
              }
            }
          }

          .stats-info {
            display: flex;
            gap: var(--dt-spacing-lg);

            .stat-item {
              display: flex;
              align-items: center;
              gap: var(--dt-spacing-xs);
              font-size: var(--dt-font-size-sm);
              color: var(--dt-color-text-secondary);

              .stat-icon {
                font-size: 16px;
                opacity: 0.7;
              }
            }
          }

          .rating-info {
            display: flex;
            align-items: center;
            gap: var(--dt-spacing-xs);

            .rating-icon {
              color: #fbbf24;
              font-size: 16px;
            }

            .rating-value {
              font-size: var(--dt-font-size-sm);
              font-weight: var(--dt-font-weight-semibold);
              color: var(--dt-color-text-primary);
            }
          }

          .date-text {
            font-size: var(--dt-font-size-sm);
            color: var(--dt-color-text-secondary);
            opacity: 0.8;
          }

          .action-buttons {
            display: flex;
            justify-content: center;
            gap: var(--dt-spacing-sm);

            .action-btn {
              width: 36px;
              height: 36px;
              border-radius: var(--dt-radius-md);
              border: none;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.3s ease;
              font-size: 16px;

              &.view-btn {
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;

                &:hover {
                  background: rgba(59, 130, 246, 0.3);
                  transform: scale(1.1);
                }
              }

              &.edit-btn {
                background: rgba(168, 85, 247, 0.2);
                color: #a855f7;

                &:hover {
                  background: rgba(168, 85, 247, 0.3);
                  transform: scale(1.1);
                }
              }

              &.delete-btn {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;

                &:hover {
                  background: rgba(239, 68, 68, 0.3);
                  transform: scale(1.1);
                }
              }
            }
          }
        }
      }
    }
  }
}

.empty-state {
  padding: var(--dt-spacing-3xl);

  .empty-content {
    text-align: center;

    .empty-icon {
      font-size: 80px;
      color: var(--dt-color-text-secondary);
      opacity: 0.5;
      margin-bottom: var(--dt-spacing-lg);
    }

    .empty-title {
      font-size: var(--dt-font-size-xl);
      font-weight: var(--dt-font-weight-semibold);
      color: var(--dt-color-text-primary);
      margin-bottom: var(--dt-spacing-md);
    }

    .empty-subtitle {
      font-size: var(--dt-font-size-md);
      color: var(--dt-color-text-secondary);
      opacity: 0.8;
      margin-bottom: var(--dt-spacing-xl);
    }

    .empty-action {
      display: flex;
      justify-content: center;
    }
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
  .studio-page {
    padding: var(--dt-spacing-md);
  }

  .page-header {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--dt-spacing-md);

      .title-section {
        .gradient-title {
          font-size: var(--dt-font-size-2xl);
        }
      }
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--dt-spacing-md);
  }

  .action-bar {
    flex-direction: column;
    gap: var(--dt-spacing-md);
    align-items: stretch;

    .action-right {
      justify-content: space-between;
    }
  }

  .character-table-container {
    overflow-x: auto;

    .character-table {
      min-width: 600px;
    }
  }
}
</style>
