<template>
  <el-card class="affinity-card" shadow="hover" :body-style="{ padding: '20px' }" @click="handleClick">
    <div class="card-content">
      <div class="character-avatar">
        <img v-if="character.avatar" :src="character.avatar" :alt="character.name" />
        <div v-else class="avatar-placeholder">
          {{ character.name.charAt(0) }}
        </div>
        <div class="affinity-badge">
          <el-icon><Star /></el-icon>
          <span>{{ character.affinityLevel }}</span>
        </div>
      </div>

      <div class="character-info">
        <h3 class="character-name">{{ character.name }}</h3>
        <p class="character-milestone">{{ currentMilestone }}</p>

        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">亲密度进度</span>
            <span class="progress-value">{{ character.currentExp }} / {{ character.expToNext }}</span>
          </div>
          <el-progress
            :percentage="progressPercentage"
            :color="progressColor"
            :stroke-width="8"
          />
        </div>

        <div class="next-milestone">
          <el-icon><Trophy /></el-icon>
          <span>下一里程碑：{{ nextMilestone }}</span>
        </div>

        <div class="interaction-stats">
          <div class="stat-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ character.totalMessages || 0 }} 对话</span>
          </div>
          <div class="stat-item">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDuration(character.totalTime || 0) }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Star, Trophy, ChatDotRound, Clock } from '@element-plus/icons-vue';

interface Character {
  id: string;
  name: string;
  avatar?: string;
  affinityLevel: number;
  currentExp: number;
  expToNext: number;
  totalMessages?: number;
  totalTime?: number;
}

interface Props {
  character: Character;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'click', character: Character): void;
}>();

const milestones = [
  '陌生人',
  '初识',
  '熟人',
  '朋友',
  '好友',
  '挚友',
  '知己',
  '灵魂伴侣',
  '命中注定',
  '永恒羁绊',
];

const progressPercentage = computed(() => {
  return Math.round((props.character.currentExp / props.character.expToNext) * 100);
});

const progressColor = computed(() => {
  const level = props.character.affinityLevel;
  if (level >= 8) return '#f56c6c';
  if (level >= 5) return '#e6a23c';
  if (level >= 3) return '#67c23a';
  return '#409eff';
});

const currentMilestone = computed(() => {
  const level = Math.min(props.character.affinityLevel, milestones.length - 1);
  return milestones[level];
});

const nextMilestone = computed(() => {
  const nextLevel = Math.min(props.character.affinityLevel + 1, milestones.length - 1);
  return milestones[nextLevel];
});

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时`;
  const days = Math.floor(hours / 24);
  return `${days}天`;
}

function handleClick() {
  emit('click', props.character);
}
</script>

<style scoped>
.affinity-card {
  cursor: pointer;
  transition: all 0.3s;
}

.affinity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
}

.card-content {
  display: flex;
  gap: 16px;
}

.character-avatar {
  position: relative;
  flex-shrink: 0;
}

.character-avatar img,
.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
}

.affinity-badge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.character-info {
  flex: 1;
  min-width: 0;
}

.character-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.character-milestone {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px 0;
}

.progress-section {
  margin-bottom: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.progress-label {
  color: #606266;
}

.progress-value {
  color: #909399;
}

.next-milestone {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #409eff;
  margin-bottom: 12px;
  padding: 8px;
  background: #ecf5ff;
  border-radius: 6px;
}

.interaction-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .card-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .character-avatar {
    margin-bottom: 8px;
  }

  .interaction-stats {
    justify-content: center;
  }
}
</style>
