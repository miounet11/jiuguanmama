<template>
  <el-card class="works-summary" shadow="hover">
    <template #header>
      <div class="card-header">
        <h3>作品概览</h3>
        <el-button link type="primary" @click="viewAllWorks">查看全部</el-button>
      </div>
    </template>

    <div v-loading="loading" class="summary-content">
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-icon characters">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ totalCharacters }}</p>
            <p class="stat-label">角色数</p>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon scenarios">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ totalScenarios }}</p>
            <p class="stat-label">剧本数</p>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon views">
            <el-icon :size="24"><View /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ formatNumber(totalViews) }}</p>
            <p class="stat-label">总浏览量</p>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon likes">
            <el-icon :size="24"><Star /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ formatNumber(totalLikes) }}</p>
            <p class="stat-label">总点赞数</p>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="recent-works">
        <h4>最近作品</h4>
        <div v-if="recentWorks.length === 0" class="empty-state">
          <p>还没有作品,快去创建吧!</p>
          <el-button type="primary" @click="createNewWork">创建作品</el-button>
        </div>
        <div v-else class="works-list">
          <div
            v-for="work in recentWorks"
            :key="work.id"
            class="work-item"
            @click="viewWork(work.id)"
          >
            <img v-if="work.avatar" :src="work.avatar" :alt="work.name" class="work-avatar" />
            <div v-else class="work-avatar-placeholder">
              {{ work.name.charAt(0) }}
            </div>
            <div class="work-info">
              <h5 class="work-name">{{ work.name }}</h5>
              <p class="work-meta">
                <el-tag size="small" :type="work.type === 'character' ? 'primary' : 'success'">
                  {{ work.type === 'character' ? '角色' : '剧本' }}
                </el-tag>
                <span class="work-stats">
                  <el-icon><View /></el-icon>
                  {{ formatNumber(work.views) }}
                  <el-icon><Star /></el-icon>
                  {{ formatNumber(work.likes) }}
                </span>
              </p>
            </div>
            <el-dropdown trigger="click" @click.stop>
              <el-button link :icon="More" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editWork(work.id)">编辑</el-dropdown-item>
                  <el-dropdown-item @click="viewAnalytics(work.id)">查看数据</el-dropdown-item>
                  <el-dropdown-item divided @click="deleteWork(work.id)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { User, Document, View, Star, More } from '@element-plus/icons-vue';
import { useCreatorStudioStore } from '@/stores';
import { ElMessageBox, ElMessage } from 'element-plus';

const creatorStore = useCreatorStudioStore();
const loading = ref(false);

const totalCharacters = computed(() => creatorStore.totalCharacters);
const totalScenarios = computed(() => {
  return creatorStore.overview?.totalScenarios || 0;
});
const totalViews = computed(() => creatorStore.totalViews);
const totalLikes = computed(() => creatorStore.totalLikes);

const recentWorks = computed(() => {
  // Mock data - replace with actual data from store
  return creatorStore.statistics?.topWorks?.slice(0, 5) || [];
});

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function viewAllWorks() {
  window.location.href = '/creator/works';
}

function createNewWork() {
  window.location.href = '/creator/new';
}

function viewWork(workId: string) {
  window.location.href = `/creator/works/${workId}`;
}

function editWork(workId: string) {
  window.location.href = `/creator/works/${workId}/edit`;
}

function viewAnalytics(workId: string) {
  window.location.href = `/creator/works/${workId}/analytics`;
}

async function deleteWork(workId: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个作品吗?此操作无法撤销。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    // Call API to delete work
    // await workApi.delete(workId);
    ElMessage.success('作品已删除');

    // Refresh data
    loadData();
  } catch {
    // User cancelled
  }
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([
      creatorStore.fetchOverview(),
      creatorStore.fetchStatistics({ limit: 5 }),
    ]);
  } catch (error) {
    console.error('Failed to load creator data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.works-summary {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.summary-content {
  min-height: 300px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f4f4f5;
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
}

.stat-icon.characters {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.scenarios {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.views {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.likes {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0 0;
}

.recent-works h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin-bottom: 16px;
}

.works-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.work-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.work-item:hover {
  background: #f4f4f5;
}

.work-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.work-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.work-info {
  flex: 1;
  min-width: 0;
}

.work-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.work-stats {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>
