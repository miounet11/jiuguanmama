<template>
  <div class="character-image-management">
    <div class="page-header">
      <el-page-header @back="$router.push('/admin')">
        <template #content>
          <div class="header-content">
            <h1>角色图片管理</h1>
            <p>批量生成和管理角色头像、背景图</p>
          </div>
        </template>
      </el-page-header>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索角色名称"
          :prefix-icon="Search"
          style="width: 300px"
          @change="handleSearch"
        />
        <el-select
          v-model="filterStatus"
          placeholder="筛选状态"
          style="width: 150px"
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="待生成" value="PENDING" />
          <el-option label="生成中" value="GENERATING" />
          <el-option label="已完成" value="COMPLETED" />
          <el-option label="生成失败" value="FAILED" />
        </el-select>
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
      </div>

      <div class="toolbar-right">
        <el-button
          type="primary"
          :icon="PictureFilled"
          :disabled="selectedCharacters.length === 0"
          @click="showBatchGenerateDialog = true"
        >
          批量生成 ({{ selectedCharacters.length }})
        </el-button>
        <el-dropdown @command="handleBatchAction">
          <el-button :icon="More">
            批量操作
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="regenerate-avatar">重新生成头像</el-dropdown-item>
              <el-dropdown-item command="regenerate-background">重新生成背景</el-dropdown-item>
              <el-dropdown-item command="clear-images" divided>清除图片</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="name" label="角色名称" min-width="150" sortable="custom">
          <template #default="{ row }">
            <div class="character-info">
              <img
                :src="row.avatar || '/default-avatar.png'"
                :alt="row.name"
                class="character-avatar-small"
              />
              <div class="character-details">
                <div class="character-name">{{ row.name }}</div>
                <div class="character-creator">by {{ row.creator?.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="mbtiType" label="MBTI类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.mbtiType" size="small" type="info">
              {{ row.mbtiType }}
            </el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="头像状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.avatarStatus)"
              size="small"
            >
              {{ getStatusText(row.avatarStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="背景状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.backgroundStatus)"
              size="small"
            >
              {{ getStatusText(row.backgroundStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="预览" width="200">
          <template #default="{ row }">
            <div class="image-previews">
              <div class="preview-item">
                <img
                  v-if="row.avatar"
                  :src="row.avatar"
                  :alt="`${row.name} 头像`"
                  class="preview-image"
                  @click="previewImage(row.avatar, `${row.name} 头像`)"
                />
                <div v-else class="preview-placeholder">无头像</div>
              </div>
              <div class="preview-item">
                <img
                  v-if="row.backgroundImage"
                  :src="row.backgroundImage"
                  :alt="`${row.name} 背景`"
                  class="preview-image background-preview"
                  @click="previewImage(row.backgroundImage, `${row.name} 背景`)"
                />
                <div v-else class="preview-placeholder">无背景</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="chatCount" label="使用次数" width="100" sortable="custom" />

        <el-table-column prop="createdAt" label="创建时间" width="150" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                size="small"
                type="primary"
                :icon="PictureFilled"
                @click="generateSingle(row)"
                :loading="generatingIds.includes(row.id)"
              >
                生成
              </el-button>
              <el-button
                size="small"
                :icon="View"
                @click="viewCharacter(row)"
              >
                查看
              </el-button>
              <el-dropdown @command="(cmd) => handleSingleAction(cmd, row)">
                <el-button size="small" :icon="More" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="regenerate-avatar">重新生成头像</el-dropdown-item>
                    <el-dropdown-item command="regenerate-background">重新生成背景</el-dropdown-item>
                    <el-dropdown-item command="edit-mbti">编辑MBTI</el-dropdown-item>
                    <el-dropdown-item command="view-history" divided>查看历史</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 批量生成对话框 -->
    <el-dialog
      v-model="showBatchGenerateDialog"
      title="批量生成图片"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="batch-generate-content">
        <div class="generate-options">
          <h4>生成选项</h4>
          <el-checkbox-group v-model="batchSettings.types">
            <el-checkbox value="avatar" label="角色头像" />
            <el-checkbox value="background" label="对话背景" />
          </el-checkbox-group>
        </div>

        <div class="style-settings">
          <h4>风格设置</h4>
          <div class="setting-row">
            <label>艺术风格：</label>
            <el-select v-model="batchSettings.style" style="width: 200px">
              <el-option value="anime" label="动漫风格" />
              <el-option value="realistic" label="写实风格" />
              <el-option value="fantasy" label="奇幻风格" />
            </el-select>
          </div>
          <div class="setting-row">
            <label>图片质量：</label>
            <el-radio-group v-model="batchSettings.quality">
              <el-radio value="standard">标准</el-radio>
              <el-radio value="hd">高清</el-radio>
            </el-radio-group>
          </div>
        </div>

        <div class="selected-characters">
          <h4>选中的角色 ({{ selectedCharacters.length }})</h4>
          <div class="character-list">
            <div
              v-for="character in selectedCharacters.slice(0, 5)"
              :key="character.id"
              class="character-item"
            >
              <img :src="character.avatar || '/default-avatar.png'" :alt="character.name" />
              <span>{{ character.name }}</span>
            </div>
            <div v-if="selectedCharacters.length > 5" class="more-count">
              还有 {{ selectedCharacters.length - 5 }} 个角色...
            </div>
          </div>
        </div>

        <!-- 批量生成进度 -->
        <div v-if="batchGenerating" class="batch-progress">
          <h4>生成进度</h4>
          <el-progress
            :percentage="batchProgress.percentage"
            :status="batchProgress.status"
          />
          <div class="progress-details">
            <span>{{ batchProgress.current }} / {{ batchProgress.total }}</span>
            <span class="progress-text">{{ batchProgress.text }}</span>
          </div>
          <div class="progress-logs">
            <div
              v-for="log in batchProgress.logs.slice(-3)"
              :key="log.id"
              class="progress-log"
              :class="log.type"
            >
              {{ log.message }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showBatchGenerateDialog = false" :disabled="batchGenerating">
          {{ batchGenerating ? '生成中...' : '取消' }}
        </el-button>
        <el-button
          type="primary"
          :loading="batchGenerating"
          :disabled="batchSettings.types.length === 0"
          @click="startBatchGeneration"
        >
          开始批量生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="showImagePreview"
      :title="previewImageTitle"
      width="800px"
      :close-on-click-modal="true"
    >
      <div class="image-preview-content">
        <img :src="previewImageUrl" :alt="previewImageTitle" class="preview-full-image" />
      </div>
      <template #footer>
        <el-button @click="downloadImage(previewImageUrl, previewImageTitle)">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button @click="showImagePreview = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- MBTI编辑对话框 -->
    <el-dialog
      v-model="showMBTIEditDialog"
      title="编辑MBTI类型"
      width="500px"
    >
      <div v-if="editingCharacter" class="mbti-edit-content">
        <div class="character-info">
          <img :src="editingCharacter.avatar || '/default-avatar.png'" :alt="editingCharacter.name" />
          <div>
            <h3>{{ editingCharacter.name }}</h3>
            <p>{{ editingCharacter.description }}</p>
          </div>
        </div>

        <el-form :model="editingCharacter" label-width="100px">
          <el-form-item label="MBTI类型">
            <el-select v-model="editingCharacter.mbtiType" placeholder="选择MBTI类型" style="width: 100%">
              <el-option-group label="分析家 (NT)">
                <el-option value="INTJ" label="INTJ - 建筑师" />
                <el-option value="INTP" label="INTP - 思想家" />
                <el-option value="ENTJ" label="ENTJ - 指挥官" />
                <el-option value="ENTP" label="ENTP - 辩论家" />
              </el-option-group>
              <el-option-group label="外交家 (NF)">
                <el-option value="INFJ" label="INFJ - 提倡者" />
                <el-option value="INFP" label="INFP - 调停者" />
                <el-option value="ENFJ" label="ENFJ - 主人公" />
                <el-option value="ENFP" label="ENFP - 竞选者" />
              </el-option-group>
              <el-option-group label="守护者 (SJ)">
                <el-option value="ISTJ" label="ISTJ - 物流师" />
                <el-option value="ISFJ" label="ISFJ - 守护者" />
                <el-option value="ESTJ" label="ESTJ - 总经理" />
                <el-option value="ESFJ" label="ESFJ - 执政官" />
              </el-option-group>
              <el-option-group label="探险家 (SP)">
                <el-option value="ISTP" label="ISTP - 鉴赏家" />
                <el-option value="ISFP" label="ISFP - 探险家" />
                <el-option value="ESTP" label="ESTP - 企业家" />
                <el-option value="ESFP" label="ESFP - 娱乐家" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showMBTIEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMBTI">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, PictureFilled, More, View, Download,
  ArrowDown
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// 响应式数据
const loading = ref(false)
const tableData = ref([])
const selectedCharacters = ref([])
const generatingIds = ref([])

const searchQuery = ref('')
const filterStatus = ref('')

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 批量生成相关
const showBatchGenerateDialog = ref(false)
const batchGenerating = ref(false)
const batchSettings = reactive({
  types: ['avatar'] as Array<'avatar' | 'background'>,
  style: 'anime',
  quality: 'standard' as 'standard' | 'hd'
})

const batchProgress = reactive({
  percentage: 0,
  current: 0,
  total: 0,
  text: '',
  status: undefined as any,
  logs: [] as Array<{ id: number, message: string, type: 'success' | 'error' | 'info' }>
})

// 图片预览相关
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const previewImageTitle = ref('')

// MBTI编辑相关
const showMBTIEditDialog = ref(false)
const editingCharacter = ref(null as any)

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const response = await http.get('/api/admin/characters', {
      params: {
        page: pagination.page,
        size: pagination.size,
        search: searchQuery.value,
        status: filterStatus.value,
        include: 'avatar,backgroundImage,mbtiType,avatarStatus,backgroundStatus'
      }
    })

    tableData.value = response.data.data.characters
    pagination.total = response.data.data.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleFilter = () => {
  pagination.page = 1
  loadData()
}

const refreshData = () => {
  loadData()
}

const handleSelectionChange = (selection: any[]) => {
  selectedCharacters.value = selection
}

const handleSortChange = ({ prop, order }: any) => {
  // 处理排序
  loadData()
}

const handlePageChange = () => {
  loadData()
}

const handleSizeChange = () => {
  pagination.page = 1
  loadData()
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'PENDING': return 'info'
    case 'GENERATING': return 'warning'
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'danger'
    default: return ''
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return '待生成'
    case 'GENERATING': return '生成中'
    case 'COMPLETED': return '已完成'
    case 'FAILED': return '失败'
    default: return '未知'
  }
}

const generateSingle = async (character: any) => {
  generatingIds.value.push(character.id)

  try {
    await http.post(`/api/characters/${character.id}/regenerate-images`)
    ElMessage.success(`${character.name} 图片生成已开始`)
    await loadData()
  } catch (error) {
    ElMessage.error(`${character.name} 图片生成失败`)
  } finally {
    generatingIds.value = generatingIds.value.filter(id => id !== character.id)
  }
}

const startBatchGeneration = async () => {
  batchGenerating.value = true
  batchProgress.percentage = 0
  batchProgress.current = 0
  batchProgress.total = selectedCharacters.value.length
  batchProgress.text = '准备开始批量生成...'
  batchProgress.logs = []

  try {
    const response = await http.post('/api/admin/characters/batch-generate', {
      characterIds: selectedCharacters.value.map(c => c.id),
      type: batchSettings.types.includes('avatar') && batchSettings.types.includes('background')
        ? 'both'
        : batchSettings.types[0],
      style: batchSettings.style,
      quality: batchSettings.quality
    })

    // 模拟进度更新
    const updateProgress = () => {
      if (batchProgress.current < batchProgress.total) {
        batchProgress.current++
        batchProgress.percentage = Math.round((batchProgress.current / batchProgress.total) * 100)
        batchProgress.text = `正在处理第 ${batchProgress.current} 个角色...`

        batchProgress.logs.push({
          id: Date.now(),
          message: `${selectedCharacters.value[batchProgress.current - 1]?.name} 处理完成`,
          type: 'success'
        })

        setTimeout(updateProgress, 2000)
      } else {
        batchProgress.percentage = 100
        batchProgress.text = '批量生成完成！'
        batchProgress.status = 'success'

        setTimeout(() => {
          batchGenerating.value = false
          showBatchGenerateDialog.value = false
          loadData()
          ElMessage.success('批量生成完成')
        }, 1000)
      }
    }

    updateProgress()

  } catch (error) {
    batchGenerating.value = false
    batchProgress.status = 'exception'
    ElMessage.error('批量生成失败')
  }
}

const previewImage = (url: string, title: string) => {
  previewImageUrl.value = url
  previewImageTitle.value = title
  showImagePreview.value = true
}

const downloadImage = (url: string, title: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = `${title}-${Date.now()}.png`
  link.click()
}

const handleBatchAction = (command: string) => {
  if (selectedCharacters.value.length === 0) {
    ElMessage.warning('请先选择角色')
    return
  }

  switch (command) {
    case 'regenerate-avatar':
      batchSettings.types = ['avatar']
      showBatchGenerateDialog.value = true
      break
    case 'regenerate-background':
      batchSettings.types = ['background']
      showBatchGenerateDialog.value = true
      break
    case 'clear-images':
      handleClearImages()
      break
  }
}

const handleSingleAction = (command: string, character: any) => {
  switch (command) {
    case 'regenerate-avatar':
      generateSingleType(character, 'avatar')
      break
    case 'regenerate-background':
      generateSingleType(character, 'background')
      break
    case 'edit-mbti':
      editingCharacter.value = { ...character }
      showMBTIEditDialog.value = true
      break
    case 'view-history':
      viewGenerationHistory(character)
      break
  }
}

const generateSingleType = async (character: any, type: 'avatar' | 'background') => {
  generatingIds.value.push(character.id)

  try {
    await http.post(`/api/characters/${character.id}/generate-${type}`)
    ElMessage.success(`${character.name} ${type === 'avatar' ? '头像' : '背景图'}生成已开始`)
    await loadData()
  } catch (error) {
    ElMessage.error(`生成失败`)
  } finally {
    generatingIds.value = generatingIds.value.filter(id => id !== character.id)
  }
}

const handleClearImages = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清除选中的 ${selectedCharacters.value.length} 个角色的所有图片吗？`,
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 执行清除操作
    await http.post('/api/admin/characters/clear-images', {
      characterIds: selectedCharacters.value.map(c => c.id)
    })

    ElMessage.success('图片清除完成')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除失败')
    }
  }
}

const saveMBTI = async () => {
  try {
    await http.put(`/api/characters/${editingCharacter.value.id}`, {
      mbtiType: editingCharacter.value.mbtiType
    })

    ElMessage.success('MBTI类型已更新')
    showMBTIEditDialog.value = false
    await loadData()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const viewCharacter = (character: any) => {
  window.open(`/characters/${character.id}`, '_blank')
}

const viewGenerationHistory = (character: any) => {
  // 查看生成历史
  console.log('查看生成历史:', character)
}

const formatDateTime = (date: string) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.character-image-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-content p {
  margin: 8px 0 0 0;
  color: #909399;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.character-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.character-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.character-details {
  flex: 1;
}

.character-name {
  font-weight: 500;
  color: #303133;
}

.character-creator {
  font-size: 12px;
  color: #909399;
}

.image-previews {
  display: flex;
  gap: 8px;
}

.preview-item {
  position: relative;
}

.preview-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-image:hover {
  transform: scale(1.1);
}

.background-preview {
  height: 35px;
}

.preview-placeholder {
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.batch-generate-content {
  padding: 20px 0;
}

.generate-options,
.style-settings,
.selected-characters {
  margin-bottom: 24px;
}

.generate-options h4,
.style-settings h4,
.selected-characters h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.setting-row label {
  width: 80px;
  font-size: 14px;
  color: #606266;
}

.character-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
}

.character-item img {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

.more-count {
  padding: 8px 12px;
  color: #909399;
  font-size: 14px;
}

.batch-progress {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.batch-progress h4 {
  margin: 0 0 12px 0;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}

.progress-logs {
  margin-top: 12px;
  max-height: 100px;
  overflow-y: auto;
}

.progress-log {
  padding: 4px 0;
  font-size: 13px;
}

.progress-log.success {
  color: #67c23a;
}

.progress-log.error {
  color: #f56c6c;
}

.progress-log.info {
  color: #909399;
}

.image-preview-content {
  text-align: center;
}

.preview-full-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.mbti-edit-content .character-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.mbti-edit-content .character-info img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.mbti-edit-content .character-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.mbti-edit-content .character-info p {
  margin: 0;
  color: #606266;
  line-height: 1.4;
}

.text-muted {
  color: #c0c4cc;
}
</style>
