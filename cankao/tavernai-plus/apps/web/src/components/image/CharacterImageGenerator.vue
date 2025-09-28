<template>
  <el-dialog
    v-model="visible"
    title="角色图片生成器"
    width="1000px"
    :close-on-click-modal="false"
    class="image-generator-dialog"
  >
    <div class="image-generator">
      <!-- 左侧：配置区域 -->
      <div class="generator-left">
        <!-- 角色基本信息 -->
        <div class="character-info">
          <h4 class="section-title">角色信息</h4>
          <div class="character-preview">
            <img
              :src="character?.avatar || '/default-avatar.png'"
              :alt="character?.name"
              class="character-avatar"
            />
            <div class="character-details">
              <h3>{{ character?.name }}</h3>
              <p>{{ character?.description }}</p>
            </div>
          </div>
        </div>

        <!-- MBTI 性格类型 -->
        <div class="mbti-section">
          <h4 class="section-title">MBTI 性格类型</h4>
          <el-select
            v-model="imageSettings.mbtiType"
            placeholder="选择MBTI类型"
            style="width: 100%"
            @change="onMBTIChange"
          >
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
          <div v-if="imageSettings.mbtiType" class="mbti-description">
            <p class="mbti-desc">{{ getMBTIDescription(imageSettings.mbtiType) }}</p>
          </div>
        </div>

        <!-- 生成类型选择 -->
        <div class="generation-type">
          <h4 class="section-title">生成内容</h4>
          <el-checkbox-group v-model="imageSettings.generateTypes">
            <el-checkbox value="avatar" label="角色头像" />
            <el-checkbox value="background" label="对话背景图" />
          </el-checkbox-group>
        </div>

        <!-- 风格设置 -->
        <div class="style-settings">
          <h4 class="section-title">风格设置</h4>

          <div class="setting-group">
            <label class="setting-label">艺术风格</label>
            <el-select v-model="imageSettings.style" placeholder="选择风格">
              <el-option
                v-for="style in artStyles"
                :key="style.value"
                :label="style.label"
                :value="style.value"
              />
            </el-select>
          </div>

          <div class="setting-group">
            <label class="setting-label">图片质量</label>
            <el-radio-group v-model="imageSettings.quality">
              <el-radio value="standard">标准</el-radio>
              <el-radio value="hd">高清</el-radio>
            </el-radio-group>
          </div>

          <div class="setting-group">
            <label class="setting-label">创意程度</label>
            <el-slider
              v-model="imageSettings.creativity"
              :min="0"
              :max="100"
              :step="10"
              show-stops
              show-tooltip
            />
          </div>
        </div>

        <!-- 生成按钮 -->
        <div class="generation-controls">
          <el-button
            type="primary"
            size="large"
            :loading="isGenerating"
            :disabled="!character || imageSettings.generateTypes.length === 0"
            @click="startGeneration"
            block
          >
            <el-icon v-if="!isGenerating"><Picture /></el-icon>
            {{ isGenerating ? '生成中...' : '开始生成' }}
          </el-button>

          <el-progress
            v-if="isGenerating"
            :percentage="progress"
            :status="progress === 100 ? 'success' : undefined"
            class="generation-progress"
          />
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="generator-right">
        <div class="results-area">
          <!-- 头像结果 -->
          <div v-if="imageSettings.generateTypes.includes('avatar')" class="result-section">
            <h4 class="section-title">生成的头像</h4>
            <div class="avatar-results">
              <div
                v-if="generationResults.avatar"
                class="result-item"
                :class="{ 'generating': generationStatus.avatar === 'generating' }"
              >
                <div class="result-image">
                  <el-skeleton v-if="generationStatus.avatar === 'generating'" animated>
                    <template #template>
                      <el-skeleton-item variant="image" style="width: 200px; height: 200px;" />
                    </template>
                  </el-skeleton>
                  <img
                    v-else-if="generationResults.avatar"
                    :src="generationResults.avatar.url"
                    alt="Generated Avatar"
                    class="generated-image"
                  />
                  <div v-if="generationStatus.avatar === 'failed'" class="error-state">
                    <el-icon><Warning /></el-icon>
                    <span>生成失败</span>
                  </div>
                </div>
                <div class="result-actions">
                  <el-button
                    v-if="generationResults.avatar"
                    size="small"
                    @click="applyAvatar"
                  >
                    应用为头像
                  </el-button>
                  <el-button
                    v-if="generationResults.avatar"
                    size="small"
                    :icon="Download"
                    @click="downloadImage(generationResults.avatar)"
                  >
                    下载
                  </el-button>
                  <el-button
                    v-if="generationStatus.avatar !== 'generating'"
                    size="small"
                    :icon="RefreshRight"
                    @click="regenerateAvatar"
                  >
                    重新生成
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 背景图结果 -->
          <div v-if="imageSettings.generateTypes.includes('background')" class="result-section">
            <h4 class="section-title">生成的对话背景</h4>
            <div class="background-results">
              <div
                v-if="generationResults.background"
                class="result-item background-item"
                :class="{ 'generating': generationStatus.background === 'generating' }"
              >
                <div class="result-image">
                  <el-skeleton v-if="generationStatus.background === 'generating'" animated>
                    <template #template>
                      <el-skeleton-item variant="image" style="width: 100%; height: 150px;" />
                    </template>
                  </el-skeleton>
                  <img
                    v-else-if="generationResults.background"
                    :src="generationResults.background.url"
                    alt="Generated Background"
                    class="generated-background"
                  />
                  <div v-if="generationStatus.background === 'failed'" class="error-state">
                    <el-icon><Warning /></el-icon>
                    <span>生成失败</span>
                  </div>
                </div>
                <div class="result-actions">
                  <el-button
                    v-if="generationResults.background"
                    size="small"
                    @click="applyBackground"
                  >
                    应用为背景
                  </el-button>
                  <el-button
                    v-if="generationResults.background"
                    size="small"
                    :icon="Download"
                    @click="downloadImage(generationResults.background)"
                  >
                    下载
                  </el-button>
                  <el-button
                    v-if="generationStatus.background !== 'generating'"
                    size="small"
                    :icon="RefreshRight"
                    @click="regenerateBackground"
                  >
                    重新生成
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 生成历史 -->
          <div v-if="generationHistory.length > 0" class="history-section">
            <h4 class="section-title">生成历史</h4>
            <div class="history-list">
              <div
                v-for="item in generationHistory"
                :key="item.id"
                class="history-item"
                @click="viewHistoryItem(item)"
              >
                <img :src="item.thumbnail || item.url" :alt="item.type" class="history-thumbnail" />
                <div class="history-info">
                  <div class="history-type">{{ item.type === 'avatar' ? '头像' : '背景图' }}</div>
                  <div class="history-time">{{ formatTime(item.createdAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button
          v-if="hasResults"
          type="primary"
          @click="saveAllResults"
        >
          保存所有结果
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Download, RefreshRight, Warning } from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// Props & Emits
interface Props {
  modelValue: boolean
  character?: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'images-generated', results: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const character = computed(() => props.character)

const imageSettings = reactive({
  mbtiType: '',
  generateTypes: ['avatar'] as Array<'avatar' | 'background'>,
  style: 'anime',
  quality: 'standard' as 'standard' | 'hd',
  creativity: 70
})

const isGenerating = ref(false)
const progress = ref(0)

const generationStatus = reactive({
  avatar: 'idle' as 'idle' | 'generating' | 'completed' | 'failed',
  background: 'idle' as 'idle' | 'generating' | 'completed' | 'failed'
})

const generationResults = reactive({
  avatar: null as any,
  background: null as any
})

const generationHistory = ref<any[]>([])

// 配置选项
const artStyles = [
  { value: 'anime', label: '动漫风格' },
  { value: 'realistic', label: '写实风格' },
  { value: 'fantasy', label: '奇幻风格' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'steampunk', label: '蒸汽朋克' },
  { value: 'watercolor', label: '水彩风格' }
]

// MBTI 描述
const mbtiDescriptions = {
  'INTJ': '战略思想家，独立且有远见',
  'INTP': '创新思考者，好奇且理论化',
  'ENTJ': '天生的领导者，大胆且意志坚强',
  'ENTP': '聪明好奇的思想家，不断寻求新的可能性',
  'INFJ': '安静神秘但很有感召力的完美主义者',
  'INFP': '诗意且善良的利他主义者',
  'ENFJ': '魅力非凡的领导者，激励他人追求共同目标',
  'ENFP': '热情创意且善社交的自由精神',
  'ISTJ': '实用且注重事实的可靠人员',
  'ISFJ': '非常专注且温暖的守护者',
  'ESTJ': '出色的管理者，在管理事务或人员方面表现突出',
  'ESFJ': '无私热心且受欢迎的人员',
  'ISTP': '大胆而实际的实验者',
  'ISFP': '灵活有魅力的艺术家',
  'ESTP': '聪明精力充沛且善社交的享乐主义者',
  'ESFP': '自发性强、热情且友好的娱乐家'
}

// 计算属性
const hasResults = computed(() => {
  return generationResults.avatar || generationResults.background
})

// 方法
const getMBTIDescription = (type: string) => {
  return mbtiDescriptions[type as keyof typeof mbtiDescriptions] || ''
}

const onMBTIChange = (mbtiType: string) => {
  // 当MBTI类型改变时，可以自动调整某些设置
  console.log('MBTI类型更改为:', mbtiType)
}

const startGeneration = async () => {
  if (!character.value) return

  isGenerating.value = true
  progress.value = 0

  try {
    // 重置状态
    generationStatus.avatar = 'idle'
    generationStatus.background = 'idle'
    generationResults.avatar = null
    generationResults.background = null

    const promises = []

    // 生成头像
    if (imageSettings.generateTypes.includes('avatar')) {
      generationStatus.avatar = 'generating'
      progress.value = 25
      promises.push(generateAvatar())
    }

    // 生成背景图
    if (imageSettings.generateTypes.includes('background')) {
      generationStatus.background = 'generating'
      progress.value = imageSettings.generateTypes.includes('avatar') ? 50 : 25
      promises.push(generateBackground())
    }

    // 等待所有生成完成
    const results = await Promise.allSettled(promises)

    results.forEach((result, index) => {
      const type = imageSettings.generateTypes[index]
      if (result.status === 'fulfilled') {
        generationStatus[type] = 'completed'
        generationResults[type] = result.value
      } else {
        generationStatus[type] = 'failed'
        console.error(`${type} generation failed:`, result.reason)
      }
    })

    progress.value = 100

    // 发送结果事件
    emit('images-generated', {
      avatar: generationResults.avatar,
      background: generationResults.background,
      mbtiType: imageSettings.mbtiType
    })

    ElMessage.success('图片生成完成!')

  } catch (error) {
    console.error('Generation failed:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    isGenerating.value = false
  }
}

const generateAvatar = async () => {
  const response = await http.post(`/api/characters/${character.value.id}/generate-avatar`, {
    style: imageSettings.style,
    quality: imageSettings.quality,
    mbtiType: imageSettings.mbtiType,
    creativity: imageSettings.creativity
  })
  return response.data.data
}

const generateBackground = async () => {
  const response = await http.post(`/api/characters/${character.value.id}/generate-background`, {
    style: imageSettings.style,
    quality: imageSettings.quality,
    mbtiType: imageSettings.mbtiType,
    creativity: imageSettings.creativity
  })
  return response.data.data
}

const regenerateAvatar = () => {
  imageSettings.generateTypes = ['avatar']
  startGeneration()
}

const regenerateBackground = () => {
  imageSettings.generateTypes = ['background']
  startGeneration()
}

const applyAvatar = async () => {
  if (!generationResults.avatar || !character.value) return

  try {
    await http.put(`/api/characters/${character.value.id}`, {
      avatar: generationResults.avatar.url,
      mbtiType: imageSettings.mbtiType
    })
    ElMessage.success('头像已更新')
  } catch (error) {
    ElMessage.error('更新头像失败')
  }
}

const applyBackground = async () => {
  if (!generationResults.background || !character.value) return

  try {
    await http.put(`/api/characters/${character.value.id}`, {
      backgroundImage: generationResults.background.url,
      mbtiType: imageSettings.mbtiType
    })
    ElMessage.success('背景图已更新')
  } catch (error) {
    ElMessage.error('更新背景图失败')
  }
}

const downloadImage = (imageData: any) => {
  const link = document.createElement('a')
  link.href = imageData.url
  link.download = `${character.value?.name}-${imageData.type}-${Date.now()}.png`
  link.click()
}

const saveAllResults = async () => {
  try {
    const promises = []

    if (generationResults.avatar) {
      promises.push(applyAvatar())
    }

    if (generationResults.background) {
      promises.push(applyBackground())
    }

    await Promise.all(promises)
    ElMessage.success('所有结果已保存')
    visible.value = false

  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const viewHistoryItem = (item: any) => {
  // 查看历史记录详情
  console.log('查看历史记录:', item)
}

// 监听角色变化，自动设置MBTI
watch(
  () => character.value,
  (newCharacter) => {
    if (newCharacter?.mbtiType) {
      imageSettings.mbtiType = newCharacter.mbtiType
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.image-generator {
  display: flex;
  gap: 24px;
  height: 600px;
}

.generator-left,
.generator-right {
  flex: 1;
}

.generator-left {
  border-right: 1px solid #e4e7ed;
  padding-right: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.character-preview {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.character-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.character-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #303133;
}

.character-details p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.mbti-section {
  margin-bottom: 20px;
}

.mbti-description {
  margin-top: 8px;
}

.mbti-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
  font-style: italic;
}

.setting-group {
  margin-bottom: 16px;
}

.setting-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.generation-controls {
  margin-top: 24px;
}

.generation-progress {
  margin-top: 12px;
}

.results-area {
  height: 100%;
  overflow-y: auto;
}

.result-section {
  margin-bottom: 24px;
}

.result-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.result-item.generating {
  border-color: #409eff;
}

.result-image {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.generated-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-item .result-image {
  aspect-ratio: 16/9;
}

.generated-background {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
}

.result-actions {
  padding: 12px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.history-section {
  margin-top: 32px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.history-info {
  flex: 1;
}

.history-type {
  font-size: 14px;
  color: #303133;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
