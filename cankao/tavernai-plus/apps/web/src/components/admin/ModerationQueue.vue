<template>
  <el-card class="moderation-queue" shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>内容审核队列</h3>
        <div class="header-stats">
          <el-badge :value="pendingCount" type="danger">
            <el-tag type="warning" size="small">待审核</el-tag>
          </el-badge>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="panel-content">
      <!-- Filter Controls -->
      <div class="filter-controls">
        <el-select v-model="typeFilter" placeholder="类型筛选" size="small" clearable>
          <el-option label="全部类型" value="" />
          <el-option label="角色" value="character" />
          <el-option label="剧本" value="scenario" />
          <el-option label="聊天消息" value="message" />
          <el-option label="用户资料" value="profile" />
        </el-select>

        <el-select v-model="statusFilter" placeholder="状态筛选" size="small" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="待审核" value="pending" />
          <el-option label="已批准" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>

        <el-select v-model="reasonFilter" placeholder="原因筛选" size="small" clearable>
          <el-option label="全部原因" value="" />
          <el-option label="用户举报" value="user_report" />
          <el-option label="AI检测" value="ai_detection" />
          <el-option label="关键词触发" value="keyword" />
          <el-option label="批量审核" value="batch" />
        </el-select>
      </div>

      <!-- Queue List -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <el-icon :size="48" color="#C0C4CC"><DocumentChecked /></el-icon>
        <p>队列为空</p>
      </div>

      <div v-else class="queue-table">
        <el-table :data="filteredItems" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />

          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small">
                {{ getTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="内容" min-width="200">
            <template #default="{ row }">
              <div class="content-preview">
                <p class="content-title">{{ row.title || '无标题' }}</p>
                <p class="content-excerpt">{{ truncate(row.content, 100) }}</p>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="原因" width="120">
            <template #default="{ row }">
              {{ getReasonText(row.reason) }}
            </template>
          </el-table-column>

          <el-table-column label="提交者" width="120">
            <template #default="{ row }">
              <div class="user-info">
                <el-icon><User /></el-icon>
                <span>{{ row.submittedBy || '未知' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button
                  v-if="row.status === 'pending'"
                  type="success"
                  size="small"
                  @click="approveItem(row.id)"
                >
                  批准
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="danger"
                  size="small"
                  @click="rejectItem(row.id)"
                >
                  拒绝
                </el-button>
                <el-button
                  size="small"
                  @click="viewDetails(row)"
                >
                  详情
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredItems.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredItems.length"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Details Dialog -->
    <el-dialog
      v-model="detailsVisible"
      title="审核详情"
      width="600px"
      :before-close="handleDialogClose"
    >
      <div v-if="selectedItem" class="details-content">
        <div class="detail-section">
          <h4>基本信息</h4>
          <p><strong>ID:</strong> {{ selectedItem.id }}</p>
          <p><strong>类型:</strong> {{ getTypeText(selectedItem.type) }}</p>
          <p><strong>状态:</strong> {{ getStatusText(selectedItem.status) }}</p>
          <p><strong>原因:</strong> {{ getReasonText(selectedItem.reason) }}</p>
        </div>

        <div class="detail-section">
          <h4>内容</h4>
          <p><strong>标题:</strong> {{ selectedItem.title || '无标题' }}</p>
          <div class="content-full">
            <pre>{{ selectedItem.content }}</pre>
          </div>
        </div>

        <div class="detail-section">
          <h4>审核备注</h4>
          <el-input
            v-model="moderationNotes"
            type="textarea"
            :rows="4"
            placeholder="添加审核备注..."
          />
        </div>

        <div class="detail-section">
          <h4>严厉措施</h4>
          <el-checkbox v-model="shouldBanUser">
            封禁提交者账号
          </el-checkbox>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailsVisible = false">取消</el-button>
        <el-button
          v-if="selectedItem?.status === 'pending'"
          type="danger"
          @click="rejectWithNotes"
        >
          拒绝并保存备注
        </el-button>
        <el-button
          v-if="selectedItem?.status === 'pending'"
          type="success"
          @click="approveWithNotes"
        >
          批准并保存备注
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  DocumentChecked,
  User,
} from '@element-plus/icons-vue';
import { useAdminConsoleStore } from '@/stores';
import { ElMessage, ElMessageBox } from 'element-plus';

const adminConsoleStore = useAdminConsoleStore();
const loading = ref(false);

// Filters
const typeFilter = ref('');
const statusFilter = ref('');
const reasonFilter = ref('');

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

// Dialog
const detailsVisible = ref(false);
const selectedItem = ref<any>(null);
const moderationNotes = ref('');
const shouldBanUser = ref(false);

const allItems = computed(() => adminConsoleStore.moderationQueue || []);

const filteredItems = computed(() => {
  let items = allItems.value;

  if (typeFilter.value) {
    items = items.filter((item: any) => item.type === typeFilter.value);
  }

  if (statusFilter.value) {
    items = items.filter((item: any) => item.status === statusFilter.value);
  }

  if (reasonFilter.value) {
    items = items.filter((item: any) => item.reason === reasonFilter.value);
  }

  return items;
});

const pendingCount = computed(() => {
  return allItems.value.filter((item: any) => item.status === 'pending').length;
});

function getTypeText(type: string): string {
  const map: Record<string, string> = {
    character: '角色',
    scenario: '剧本',
    message: '消息',
    profile: '资料',
  };
  return map[type] || '未知';
}

function getTypeTagType(type: string): 'primary' | 'success' | 'warning' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    character: 'primary',
    scenario: 'success',
    message: 'warning',
    profile: 'info',
  };
  return map[type] || 'info';
}

function getReasonText(reason: string): string {
  const map: Record<string, string> = {
    user_report: '用户举报',
    ai_detection: 'AI检测',
    keyword: '关键词',
    batch: '批量审核',
  };
  return map[reason] || '未知';
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
  };
  return map[status] || '未知';
}

function getStatusType(status: string): 'warning' | 'success' | 'danger' | 'info' {
  const map: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return map[status] || 'info';
}

function truncate(text: string, length: number): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handlePageChange(page: number) {
  currentPage.value = page;
}

function viewDetails(item: any) {
  selectedItem.value = item;
  moderationNotes.value = item.notes || '';
  shouldBanUser.value = false;
  detailsVisible.value = true;
}

function handleDialogClose(done: () => void) {
  moderationNotes.value = '';
  shouldBanUser.value = false;
  done();
}

async function approveItem(itemId: string) {
  try {
    await adminConsoleStore.approveModerationItem(itemId);
    ElMessage.success('已批准内容');
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message);
  }
}

async function rejectItem(itemId: string) {
  try {
    await ElMessageBox.confirm('确认拒绝此内容？', '确认操作', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await adminConsoleStore.rejectModerationItem(itemId);
    ElMessage.success('已拒绝内容');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败：' + error.message);
    }
  }
}

async function approveWithNotes() {
  if (!selectedItem.value) return;

  try {
    await adminConsoleStore.approveModerationItem(
      selectedItem.value.id,
      moderationNotes.value
    );
    ElMessage.success('已批准内容并保存备注');
    detailsVisible.value = false;
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message);
  }
}

async function rejectWithNotes() {
  if (!selectedItem.value) return;

  try {
    await adminConsoleStore.rejectModerationItem(
      selectedItem.value.id,
      moderationNotes.value,
      shouldBanUser.value
    );

    if (shouldBanUser.value) {
      ElMessage.warning('已拒绝内容并封禁用户');
    } else {
      ElMessage.success('已拒绝内容并保存备注');
    }

    detailsVisible.value = false;
  } catch (error: any) {
    ElMessage.error('操作失败：' + error.message);
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await adminConsoleStore.fetchModerationQueue();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.moderation-queue {
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

.header-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.panel-content {
  min-height: 400px;
}

.filter-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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

.queue-table {
  margin-bottom: 20px;
}

.content-preview {
  max-width: 100%;
}

.content-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.content-excerpt {
  font-size: 12px;
  color: #909399;
  margin: 0;
  line-height: 1.4;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.details-content {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #303133;
}

.detail-section p {
  font-size: 13px;
  color: #606266;
  margin: 8px 0;
}

.content-full {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.content-full pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
  }

  .filter-controls .el-select {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
