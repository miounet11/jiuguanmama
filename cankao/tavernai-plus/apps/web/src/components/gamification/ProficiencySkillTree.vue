<template>
  <el-card class="proficiency-skill-tree" shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>技能熟练度</h3>
        <el-select v-model="selectedCategory" placeholder="选择分类" size="small">
          <el-option label="全部" value="all" />
          <el-option label="对话" value="dialogue" />
          <el-option label="剧情" value="story" />
          <el-option label="创作" value="creation" />
        </el-select>
      </div>
    </template>

    <div v-loading="loading" class="panel-content">
      <div v-if="filteredSkills.length === 0" class="empty-state">
        <el-icon :size="48" color="#C0C4CC"><TrendCharts /></el-icon>
        <p>暂无技能数据</p>
      </div>

      <div v-else class="skill-tree">
        <div
          v-for="skill in filteredSkills"
          :key="skill.id"
          class="skill-node"
          :class="{ unlocked: skill.unlocked, locked: !skill.unlocked }"
        >
          <div class="skill-icon">
            <el-icon :size="32" :color="skill.unlocked ? getSkillColor(skill.level) : '#dcdfe6'">
              <component :is="getSkillIcon(skill.type)" />
            </el-icon>
          </div>

          <div class="skill-info">
            <div class="skill-header">
              <h4 class="skill-name">{{ skill.name }}</h4>
              <el-tag v-if="skill.unlocked" :type="getSkillTagType(skill.level)" size="small">
                Lv.{{ skill.level }}
              </el-tag>
              <el-tag v-else type="info" size="small">
                <el-icon><Lock /></el-icon>
                未解锁
              </el-tag>
            </div>

            <p class="skill-description">{{ skill.description }}</p>

            <div v-if="skill.unlocked" class="skill-progress">
              <div class="progress-info">
                <span class="progress-label">熟练度</span>
                <span class="progress-value">{{ skill.currentExp }} / {{ skill.expToNext }}</span>
              </div>
              <el-progress
                :percentage="getSkillProgress(skill)"
                :color="getSkillColor(skill.level)"
                :stroke-width="6"
              />
            </div>

            <div v-else class="unlock-requirement">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ skill.unlockRequirement }}</span>
            </div>

            <div v-if="skill.unlocked && skill.benefits" class="skill-benefits">
              <el-tag
                v-for="(benefit, index) in skill.benefits"
                :key="index"
                type="success"
                size="small"
                effect="plain"
              >
                {{ benefit }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  TrendCharts,
  Lock,
  InfoFilled,
  ChatLineRound,
  Document,
  Edit,
  Star,
  Trophy,
} from '@element-plus/icons-vue';
import { useGamificationStore } from '@/stores';

const gamificationStore = useGamificationStore();
const loading = ref(false);
const selectedCategory = ref('all');

const allSkills = computed(() => gamificationStore.proficiencyList || []);

const filteredSkills = computed(() => {
  if (selectedCategory.value === 'all') {
    return allSkills.value;
  }
  return allSkills.value.filter((skill: any) => skill.category === selectedCategory.value);
});

function getSkillProgress(skill: any): number {
  return Math.min(Math.round((skill.currentExp / skill.expToNext) * 100), 100);
}

function getSkillColor(level: number): string {
  if (level >= 40) return '#f56c6c'; // Master
  if (level >= 30) return '#e6a23c'; // Expert
  if (level >= 20) return '#409eff'; // Advanced
  if (level >= 10) return '#67c23a'; // Intermediate
  return '#909399'; // Novice
}

function getSkillTagType(level: number): 'danger' | 'warning' | 'primary' | 'success' | 'info' {
  if (level >= 40) return 'danger';
  if (level >= 30) return 'warning';
  if (level >= 20) return 'primary';
  if (level >= 10) return 'success';
  return 'info';
}

function getSkillIcon(type: string) {
  const iconMap: Record<string, any> = {
    dialogue: ChatLineRound,
    story: Document,
    creation: Edit,
    special: Star,
    achievement: Trophy,
  };
  return iconMap[type] || Star;
}

onMounted(async () => {
  loading.value = true;
  try {
    await gamificationStore.fetchProficiencyList();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.proficiency-skill-tree {
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-content {
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state p {
  margin-top: 12px;
}

.skill-tree {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.skill-node {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
  background: white;
}

.skill-node.unlocked {
  border-color: #67c23a;
}

.skill-node.unlocked:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
}

.skill-node.locked {
  background: #f9f9f9;
  opacity: 0.7;
}

.skill-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f4f4f5;
}

.skill-node.unlocked .skill-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.skill-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.skill-description {
  font-size: 12px;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.skill-progress {
  margin-bottom: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;
}

.progress-label {
  color: #606266;
}

.progress-value {
  color: #909399;
}

.unlock-requirement {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #f4f4f5;
  border-radius: 4px;
  font-size: 12px;
  color: #909399;
}

.skill-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .skill-tree {
    grid-template-columns: 1fr;
  }
}
</style>
