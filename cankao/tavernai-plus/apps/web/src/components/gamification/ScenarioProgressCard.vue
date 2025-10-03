<template>
  <div class="scenario-progress-card">
    <!-- 剧本信息 -->
    <div class="scenario-header">
      <div class="scenario-avatar">
        <div class="scenario-icon">
          <el-icon size="24">
            <Document />
          </el-icon>
        </div>
      </div>

      <div class="scenario-info">
        <h3 class="scenario-title">{{ progress.scenario.name }}</h3>
        <p class="scenario-description" v-if="progress.scenario.description">
          {{ progress.scenario.description }}
        </p>
      </div>

      <div class="scenario-status">
        <el-tag
          :type="getStatusType(progress.status)"
          size="small"
        >
          {{ getStatusText(progress.status) }}
        </el-tag>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">完成进度</span>
        <span class="progress-percentage">{{ Math.round(progress.progressPercentage * 100) }}%</span>
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress.progressPercentage * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- 熟练度信息 -->
    <div class="proficiency-section">
      <div class="proficiency-header">
        <span class="proficiency-label">熟练度</span>
        <span class="proficiency-level">Lv.{{ progress.proficiencyLevel }}</span>
      </div>

      <div class="proficiency-bar">
        <div
          class="proficiency-fill"
          :style="{ width: `${(progress.proficiencyPoints % 100) / 100 * 100}%` }"
        ></div>
      </div>

      <div class="proficiency-stats">
        <span class="points">{{ progress.proficiencyPoints }} 点</span>
        <span class="next-level">
          距离下一级还需 {{ 100 - (progress.proficiencyPoints % 100) }} 点
        </span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">{{ progress.totalSessions }}</div>
        <div class="stat-label">会话次数</div>
      </div>

      <div class="stat-item">
        <div class="stat-value">{{ progress.totalMessages }}</div>
        <div class="stat-label">消息总数</div>
      </div>

      <div class="stat-item">
        <div class="stat-value">{{ formatTime(progress.averageSessionTime) }}</div>
        <div class="stat-label">平均时长</div>
      </div>

      <div class="stat-item">
        <div class="stat-value">{{ progress.totalTokens.toLocaleString() }}</div>
        <div class="stat-label">消耗Tokens</div>
      </div>
    </div>

    <!-- 难度和时间信息 -->
    <div class="meta-info">
      <div class="meta-item">
        <el-icon size="14">
          <Timer />
        </el-icon>
        <span>最后游玩: {{ formatLastPlayed(progress.lastPlayedAt) }}</span>
      </div>

      <div class="meta-item">
        <el-icon size="14">
          <Trophy />
        </el-icon>
        <span>难度: {{ getDifficultyText(progress.difficulty) }}</span>
      </div>

      <div class="meta-item" v-if="progress.completedAt">
        <el-icon size="14">
          <Check />
        </el-icon>
        <span>完成时间: {{ formatDate(progress.completedAt) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="card-actions">
      <el-button
        type="primary"
        size="small"
        @click="$emit('continue', progress)"
        :disabled="progress.status === 'completed'"
      >
        <el-icon>
          <component :is="progress.status === 'completed' ? Check : Play" />
        </el-icon>
        {{ progress.status === 'completed' ? '回顾剧本' : '继续剧本' }}
      </el-button>

      <el-dropdown @command="handleActionCommand" placement="bottom-end">
        <el-button type="default" size="small">
          <el-icon>
            <More />
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="view-details">
              <el-icon><View /></el-icon>
              查看详情
            </el-dropdown-item>
            <el-dropdown-item command="reset-progress" divided>
              <el-icon><Refresh /></el-icon>
              重置进度
            </el-dropdown-item>
            <el-dropdown-item command="abandon" class="text-red-500">
              <el-icon><Close /></el-icon>
              放弃剧本
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Document,
  Timer,
  Trophy,
  Check,
  Play,
  More,
  View,
  Refresh,
  Close
} from '@element-plus/icons-vue'
import type { ScenarioProgress } from '@/services/gamification'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Props {
  progress: ScenarioProgress
}

const props = defineProps<Props>()
const emit = defineEmits<{
  continue: [progress: ScenarioProgress]
  reset: [scenarioId: string]
  abandon: [scenarioId: string]
  'view-details': [scenarioId: string]
}>()

// 计算属性
const isCompleted = computed(() => props.progress.status === 'completed')

// 方法
const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    abandoned: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    abandoned: '已放弃'
  }
  return textMap[status] || status
}

const getDifficultyText = (difficulty: string): string => {
  const textMap: Record<string, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
    expert: '专家'
  }
  return textMap[difficulty] || difficulty
}

const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return `${hours}小时${remainingMinutes}分钟`
}

const formatLastPlayed = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return `${Math.floor(days / 30)}月前`
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const handleActionCommand = async (command: string) => {
  switch (command) {
    case 'view-details':
      // 打开详情弹窗或跳转到详情页
      emit('view-details', props.progress.scenarioId)
      break

    case 'reset-progress':
      try {
        await ElMessageBox.confirm(
          '确定要重置这个剧本的进度吗？所有数据将被清除。',
          '重置进度',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        emit('reset', props.progress.scenarioId)
      } catch {
        // 用户取消
      }
      break

    case 'abandon':
      try {
        await ElMessageBox.confirm(
          '确定要放弃这个剧本吗？进度将被保存，但不会获得完成奖励。',
          '放弃剧本',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        emit('abandon', props.progress.scenarioId)
      } catch {
        // 用户取消
      }
      break
  }
}
</script>

<style scoped lang="scss">
.scenario-progress-card {
  background: var(--surface-2);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--brand-primary-400);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--brand-secondary-500),
      var(--brand-accent-500)
    );
  }
}

.scenario-header {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  align-items: flex-start;
}

.scenario-avatar {
  flex-shrink: 0;

  .scenario-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--brand-secondary-500), var(--brand-accent-500));
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    border: 2px solid var(--border-secondary);
  }
}

.scenario-info {
  flex: 1;
  min-width: 0;

  .scenario-title {
    margin: 0 0 var(--space-1) 0;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scenario-description {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.scenario-status {
  flex-shrink: 0;
}

.progress-section,
.proficiency-section {
  margin-bottom: var(--space-4);

  .progress-header,
  .proficiency-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);

    .progress-label,
    .proficiency-label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .progress-percentage,
    .proficiency-level {
      font-size: var(--text-sm);
      font-weight: var(--font-bold);
      color: var(--brand-primary-500);
    }
  }

  .progress-bar,
  .proficiency-bar {
    height: 8px;
    background: var(--surface-3);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: var(--space-2);

    .progress-fill {
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--brand-primary-500),
        var(--brand-secondary-500)
      );
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .proficiency-fill {
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--brand-secondary-500),
        var(--brand-accent-500)
      );
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }
  }

  .progress-stats,
  .proficiency-stats {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--text-tertiary);

    .points {
      font-weight: var(--font-medium);
      color: var(--brand-primary-500);
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);

  .stat-item {
    text-align: center;
    padding: var(--space-3);
    background: var(--surface-3);
    border-radius: var(--radius-md);

    .stat-value {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .stat-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }
  }
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);

  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .el-icon {
      color: var(--brand-primary-500);
    }
  }
}

.card-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

// 响应式设计
@media (max-width: 768px) {
  .scenario-progress-card {
    padding: var(--space-4);
  }

  .scenario-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
