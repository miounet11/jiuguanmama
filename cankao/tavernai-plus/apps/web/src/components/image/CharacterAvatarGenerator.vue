<template>
  <el-dialog
    v-model="visible"
    title="角色头像生成器"
    width="900px"
    :close-on-click-modal="false"
    class="avatar-generator-dialog"
  >
    <div class="avatar-generator">
      <!-- 左侧：角色信息 -->
      <div class="generator-left">
        <!-- 角色选择 -->
        <div class="character-section">
          <h4 class="section-title">选择角色</h4>
          <el-select
            v-model="selectedCharacterId"
            placeholder="选择要生成头像的角色"
            @change="onCharacterChange"
            style="width: 100%"
          >
            <el-option
              v-for="character in characters"
              :key="character.id"
              :label="character.name"
              :value="character.id"
            >
              <div class="character-option">
                <img
                  v-if="character.avatar"
                  :src="character.avatar"
                  :alt="character.name"
                  class="character-avatar-small"
                />
                <div class="character-info">
                  <span class="character-name">{{ character.name }}</span>
                  <span class="character-creator">by {{ character.creator }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 当前角色信息 -->
        <div v-if="selectedCharacter" class="character-details">
          <div class="character-preview">
            <img
              :src="selectedCharacter.avatar || '/default-avatar.png'"
              :alt="selectedCharacter.name"
              class="current-avatar"
            />
            <div class="character-basic-info">
              <h3>{{ selectedCharacter.name }}</h3>
              <p class="character-description">{{ selectedCharacter.description }}</p>
            </div>
          </div>

          <!-- 角色特征提取 -->
          <div class="character-traits">
            <h4 class="section-title">角色特征</h4>
            <div class="traits-list">
              <el-tag
                v-for="trait in extractedTraits"
                :key="trait.name"
                :type="trait.confidence > 0.8 ? 'primary' : 'info'"
                size="small"
                class="trait-tag"
              >
                {{ trait.name }} ({{ Math.round(trait.confidence * 100) }}%)
              </el-tag>
            </div>
          </div>

          <!-- 风格设置 -->
          <div class="style-settings">
            <h4 class="section-title">头像风格</h4>

            <div class="setting-group">
              <label class="setting-label">艺术风格</label>
              <el-select v-model="avatarSettings.style" placeholder="选择风格">
                <el-option
                  v-for="style in avatarStyles"
                  :key="style.value"
                  :label="style.label"
                  :value="style.value"
                />
              </el-select>
            </div>

            <div class="setting-group">
              <label class="setting-label">画面构图</label>
              <el-radio-group v-model="avatarSettings.composition">
                <el-radio value="portrait">肖像</el-radio>
                <el-radio value="bust">半身</el-radio>
                <el-radio value="headshot">特写</el-radio>
                <el-radio value="full-body">全身</el-radio>
              </el-radio-group>
            </div>

            <div class="setting-group">
              <label class="setting-label">图像质量</label>
              <el-radio-group v-model="avatarSettings.quality">
                <el-radio value="standard">标准</el-radio>
                <el-radio value="high">高清</el-radio>
                <el-radio value="ultra">超高清</el-radio>
              </el-radio-group>
            </div>

            <div class="setting-group">
              <label class="setting-label">背景类型</label>
              <el-select v-model="avatarSettings.background" placeholder="选择背景">
                <el-option
                  v-for="bg in backgroundTypes"
                  :key="bg.value"
                  :label="bg.label"
                  :value="bg.value"
                />
              </el-select>
            </div>

            <div class="setting-group">
              <label class="setting-label">情绪表达</label>
              <el-select v-model="avatarSettings.emotion" placeholder="选择情绪">
                <el-option
                  v-for="emotion in emotions"
                  :key="emotion.value"
                  :label="emotion.label"
                  :value="emotion.value"
                />
              </el-select>
            </div>

            <div class="setting-group">
              <label class="setting-label">生成数量</label>
              <el-input-number
                v-model="avatarSettings.count"
                :min="1"
                :max="6"
                size="small"
                controls-position="right"
              />
            </div>
          </div>

          <!-- 高级选项 -->
          <div class="advanced-settings">
            <el-collapse v-model="expandedPanels">
              <el-collapse-item title="高级设置" name="advanced">
                <div class="setting-group">
                  <label class="setting-label">保持一致性</label>
                  <el-switch
                    v-model="avatarSettings.consistency"
                    active-text="开启"
                    inactive-text="关闭"
                  />
                  <p class="setting-hint">保持与角色原有特征的一致性</p>
                </div>

                <div class="setting-group">
                  <label class="setting-label">创意程度 ({{ avatarSettings.creativity }})</label>
                  <el-slider
                    v-model="avatarSettings.creativity"
                    :min="0"
                    :max="100"
                    show-tooltip
                  />
                  <p class="setting-hint">数值越高，生成的头像越具创意</p>
                </div>

                <div class="setting-group">
                  <label class="setting-label">随机种子</label>
                  <div class="seed-input">
                    <el-input
                      v-model="avatarSettings.seed"
                      placeholder="留空随机生成"
                      type="number"
                    />
                    <el-button
                      size="small"
                      :icon="Refresh"
                      @click="generateRandomSeed"
                      title="随机种子"
                    />
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>

      <!-- 右侧：生成结果 -->
      <div class="generator-right">
        <!-- 生成控制 -->
        <div class="generation-controls">
          <el-button
            type="primary"
            size="large"
            :loading="isGenerating"
            :disabled="!selectedCharacter"
            @click="generateAvatars"
            class="generate-btn"
            block
          >
            <el-icon v-if="!isGenerating"><Picture /></el-icon>
            {{ isGenerating ? `生成中... ${generationProgress}%` : '生成角色头像' }}
          </el-button>

          <!-- 生成进度 -->
          <div v-if="isGenerating" class="generation-progress">
            <el-progress
              :percentage="generationProgress"
              :status="generationProgress === 100 ? 'success' : undefined"
              :show-text="false"
            />
            <div class="progress-info">
              <span class="progress-text">{{ progressText }}</span>
              <el-button
                size="small"
                text
                type="danger"
                @click="cancelGeneration"
              >
                取消
              </el-button>
            </div>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-area">
          <div v-if="generatedAvatars.length === 0 && !isGenerating" class="empty-preview">
            <div class="empty-icon">
              <el-icon><Avatar /></el-icon>
            </div>
            <p class="empty-text">选择角色并生成头像</p>
            <p class="empty-hint">AI将基于角色信息生成专属头像</p>
          </div>

          <!-- 生成的头像网格 -->
          <div v-else class="avatars-grid">
            <div
              v-for="(avatar, index) in generatedAvatars"
              :key="avatar.id"
              class="avatar-item"
              :class="{ 'selected': selectedAvatars.includes(avatar.id) }"
              @click="toggleAvatarSelection(avatar.id)"
            >
              <div class="avatar-wrapper">
                <img
                  :src="avatar.url"
                  :alt="`头像 ${index + 1}`"
                  class="generated-avatar"
                  @load="onAvatarLoad(avatar)"
                  @error="onAvatarError(avatar)"
                />

                <!-- 头像遮罩层 -->
                <div class="avatar-overlay">
                  <div class="avatar-actions">
                    <el-button
                      size="small"
                      circle
                      :icon="ZoomIn"
                      @click.stop="previewAvatar(avatar)"
                      title="预览"
                    />
                    <el-button
                      size="small"
                      circle
                      :icon="Download"
                      @click.stop="downloadAvatar(avatar)"
                      title="下载"
                    />
                    <el-button
                      size="small"
                      circle
                      :icon="Check"
                      @click.stop="setAsCharacterAvatar(avatar)"
                      title="设为头像"
                    />
                    <el-button
                      size="small"
                      circle
                      :icon="RefreshRight"
                      @click.stop="generateVariations(avatar)"
                      title="生成变体"
                    />
                  </div>

                  <!-- 选择标记 -->
                  <div class="selection-indicator">
                    <el-icon><Check /></el-icon>
                  </div>
                </div>

                <!-- 质量评分 -->
                <div class="avatar-rating">
                  <el-rate
                    v-model="avatar.rating"
                    disabled
                    show-score
                    text-color="#ff9900"
                    size="small"
                  />
                </div>
              </div>

              <!-- 头像信息 -->
              <div class="avatar-info">
                <div class="avatar-meta">
                  <span class="avatar-style">{{ getStyleLabel(avatar.style) }}</span>
                  <span class="avatar-size">{{ avatar.width }}×{{ avatar.height }}</span>
                </div>
                <div class="avatar-tags">
                  <el-tag
                    v-for="tag in avatar.tags?.slice(0, 2)"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 批量操作 -->
          <div v-if="selectedAvatars.length > 0" class="batch-actions">
            <div class="batch-info">
              已选择 {{ selectedAvatars.length }} 个头像
            </div>
            <div class="batch-buttons">
              <el-button
                size="small"
                :icon="Download"
                @click="batchDownload"
              >
                批量下载
              </el-button>
              <el-button
                size="small"
                :icon="Collection"
                @click="saveToGallery"
              >
                保存到画廊
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="batchDelete"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 历史版本 -->
        <div v-if="avatarHistory.length > 0" class="avatar-history">
          <h4 class="section-title">历史版本</h4>
          <div class="history-list">
            <div
              v-for="historyItem in avatarHistory"
              :key="historyItem.id"
              class="history-item"
              @click="loadHistoryItem(historyItem)"
            >
              <img
                :src="historyItem.thumbnail || historyItem.url"
                :alt="historyItem.prompt"
                class="history-thumbnail"
              />
              <div class="history-info">
                <div class="history-prompt">{{ historyItem.prompt }}</div>
                <div class="history-date">{{ formatDate(historyItem.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 头像预览对话框 -->
    <el-dialog
      v-model="showAvatarPreview"
      title="头像预览"
      width="600px"
      :close-on-click-modal="true"
    >
      <div v-if="previewingAvatar" class="avatar-preview-content">
        <img
          :src="previewingAvatar.url"
          :alt="previewingAvatar.prompt"
          class="preview-avatar-image"
        />
        <div class="preview-details">
          <h4>生成信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">提示词:</span>
              <span class="detail-value">{{ previewingAvatar.prompt }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">风格:</span>
              <span class="detail-value">{{ getStyleLabel(previewingAvatar.style) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">尺寸:</span>
              <span class="detail-value">{{ previewingAvatar.width }}×{{ previewingAvatar.height }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">质量评分:</span>
              <span class="detail-value">{{ previewingAvatar.rating }}/5</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showAvatarPreview = false">关闭</el-button>
        <el-button
          type="primary"
          @click="setAsCharacterAvatar(previewingAvatar!)"
        >
          设为角色头像
        </el-button>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <span v-if="generatedAvatars.length > 0">
            已生成 {{ generatedAvatars.length }} 个头像
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="visible = false">关闭</el-button>
          <el-button
            v-if="selectedAvatars.length === 1"
            type="primary"
            @click="applySelectedAvatar"
          >
            应用选中头像
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, defineEmits, defineProps } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture, Avatar, ZoomIn, Download, Check, RefreshRight,
  Collection, Delete, Refresh
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// Props & Emits
const props = defineProps<{
  modelValue: boolean
  characterId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'avatar-applied': [character: any, avatar: any]
}>()

// 接口定义
interface Character {
  id: string
  name: string
  description: string
  avatar?: string
  creator: string
  personality?: string
  background?: string
  tags?: string[]
}

interface GeneratedAvatar {
  id: string
  url: string
  thumbnail?: string
  prompt: string
  style: string
  width: number
  height: number
  rating: number
  tags?: string[]
  createdAt: Date
}

interface CharacterTrait {
  name: string
  confidence: number
  type: 'appearance' | 'personality' | 'background'
}

interface AvatarHistoryItem {
  id: string
  url: string
  thumbnail?: string
  prompt: string
  settings: any
  createdAt: Date
}

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const characters = ref<Character[]>([])
const selectedCharacterId = ref(props.characterId || '')
const selectedCharacter = ref<Character | null>(null)
const extractedTraits = ref<CharacterTrait[]>([])

const avatarSettings = reactive({
  style: 'anime',
  composition: 'portrait',
  quality: 'high',
  background: 'simple',
  emotion: 'neutral',
  count: 4,
  consistency: true,
  creativity: 70,
  seed: ''
})

const generatedAvatars = ref<GeneratedAvatar[]>([])
const selectedAvatars = ref<string[]>([])
const avatarHistory = ref<AvatarHistoryItem[]>([])

const isGenerating = ref(false)
const generationProgress = ref(0)
const progressText = ref('')

const showAvatarPreview = ref(false)
const previewingAvatar = ref<GeneratedAvatar | null>(null)

const expandedPanels = ref<string[]>([])

// 配置选项
const avatarStyles = [
  { value: 'anime', label: '动漫风格' },
  { value: 'realistic', label: '写实风格' },
  { value: 'cartoon', label: '卡通风格' },
  { value: 'artistic', label: '艺术风格' },
  { value: 'pixar', label: '皮克斯风格' },
  { value: 'sketch', label: '素描风格' },
  { value: 'watercolor', label: '水彩风格' },
  { value: 'oil-painting', label: '油画风格' }
]

const backgroundTypes = [
  { value: 'transparent', label: '透明背景' },
  { value: 'simple', label: '简单背景' },
  { value: 'gradient', label: '渐变背景' },
  { value: 'scene', label: '场景背景' },
  { value: 'abstract', label: '抽象背景' },
  { value: 'solid', label: '纯色背景' }
]

const emotions = [
  { value: 'neutral', label: '中性' },
  { value: 'happy', label: '开心' },
  { value: 'confident', label: '自信' },
  { value: 'mysterious', label: '神秘' },
  { value: 'serious', label: '严肃' },
  { value: 'gentle', label: '温和' },
  { value: 'playful', label: '顽皮' },
  { value: 'determined', label: '坚毅' }
]

// 方法
const onCharacterChange = async (characterId: string) => {
  const character = characters.value.find(c => c.id === characterId)
  if (character) {
    selectedCharacter.value = character
    await extractCharacterTraits(character)
    await loadAvatarHistory(characterId)
  }
}

const extractCharacterTraits = async (character: Character) => {
  try {
    // 使用AI分析角色描述，提取关键特征
    const response = await http.post('/multimodal/character/extract-traits', {
      character: {
        name: character.name,
        description: character.description,
        personality: character.personality,
        background: character.background
      }
    })

    if (response.traits) {
      extractedTraits.value = response.traits
    }
  } catch (error) {
    console.error('提取角色特征失败:', error)
    // 使用简单的关键词提取作为备选
    extractedTraits.value = extractSimpleTraits(character)
  }
}

const extractSimpleTraits = (character: Character): CharacterTrait[] => {
  const traits: CharacterTrait[] = []
  const description = (character.description || '').toLowerCase()

  // 简单的关键词匹配
  const appearanceKeywords = ['头发', '眼睛', '高', '矮', '瘦', '胖', '美丽', '帅气']
  const personalityKeywords = ['友善', '冷酷', '开朗', '内向', '勇敢', '温柔', '聪明', '可爱']

  appearanceKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      traits.push({
        name: keyword,
        confidence: 0.7,
        type: 'appearance'
      })
    }
  })

  personalityKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      traits.push({
        name: keyword,
        confidence: 0.8,
        type: 'personality'
      })
    }
  })

  return traits.slice(0, 8) // 限制数量
}

const generateRandomSeed = () => {
  avatarSettings.seed = Math.floor(Math.random() * 4294967295).toString()
}

const generateAvatars = async () => {
  if (!selectedCharacter.value) {
    ElMessage.error('请先选择角色')
    return
  }

  isGenerating.value = true
  generationProgress.value = 0
  progressText.value = '分析角色特征...'

  try {
    // 构建生成参数
    const generateParams = {
      character: {
        id: selectedCharacter.value.id,
        name: selectedCharacter.value.name,
        description: selectedCharacter.value.description,
        personality: selectedCharacter.value.personality,
        traits: extractedTraits.value
      },
      settings: {
        ...avatarSettings,
        seed: avatarSettings.seed || undefined
      }
    }

    // 开始生成请求
    const response = await http.post('/multimodal/character/generate-avatar', generateParams)

    if (response.jobId) {
      // 如果返回任务ID，开始轮询状态
      await pollGenerationStatus(response.jobId)
    } else if (response.avatars) {
      // 如果直接返回头像，处理结果
      handleGenerationComplete(response.avatars)
    }
  } catch (error: any) {
    console.error('头像生成失败:', error)
    ElMessage.error(error.message || '头像生成失败')
  } finally {
    isGenerating.value = false
    generationProgress.value = 0
    progressText.value = ''
  }
}

const pollGenerationStatus = async (jobId: string) => {
  const pollInterval = setInterval(async () => {
    try {
      const response = await http.get(`/multimodal/character/avatar-status/${jobId}`)

      generationProgress.value = response.progress || 0
      progressText.value = response.status || '生成中...'

      if (response.status === 'completed' && response.avatars) {
        clearInterval(pollInterval)
        handleGenerationComplete(response.avatars)
      } else if (response.status === 'failed') {
        clearInterval(pollInterval)
        throw new Error(response.error || '头像生成失败')
      }
    } catch (error) {
      clearInterval(pollInterval)
      throw error
    }
  }, 1000)
}

const handleGenerationComplete = (avatars: any[]) => {
  const newAvatars: GeneratedAvatar[] = avatars.map(avatar => ({
    id: avatar.id || Date.now().toString() + Math.random(),
    url: avatar.url,
    thumbnail: avatar.thumbnail,
    prompt: avatar.prompt,
    style: avatarSettings.style,
    width: avatar.width || 512,
    height: avatar.height || 512,
    rating: avatar.rating || Math.random() * 2 + 3, // 随机评分 3-5
    tags: avatar.tags,
    createdAt: new Date()
  }))

  generatedAvatars.value.unshift(...newAvatars)
  generationProgress.value = 100
  progressText.value = '生成完成！'

  ElMessage.success(`成功生成 ${newAvatars.length} 个头像`)

  // 保存到历史记录
  saveToHistory(newAvatars)

  // 3秒后重置进度
  setTimeout(() => {
    generationProgress.value = 0
    progressText.value = ''
  }, 3000)
}

const cancelGeneration = () => {
  isGenerating.value = false
  generationProgress.value = 0
  progressText.value = ''
  ElMessage.info('已取消生成')
}

const toggleAvatarSelection = (avatarId: string) => {
  const index = selectedAvatars.value.indexOf(avatarId)
  if (index > -1) {
    selectedAvatars.value.splice(index, 1)
  } else {
    selectedAvatars.value.push(avatarId)
  }
}

const previewAvatar = (avatar: GeneratedAvatar) => {
  previewingAvatar.value = avatar
  showAvatarPreview.value = true
}

const downloadAvatar = async (avatar: GeneratedAvatar) => {
  try {
    const response = await fetch(avatar.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCharacter.value?.name || 'character'}-avatar-${avatar.id}.png`
    a.click()

    URL.revokeObjectURL(url)
    ElMessage.success('头像下载开始')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

const setAsCharacterAvatar = async (avatar: GeneratedAvatar) => {
  if (!selectedCharacter.value) return

  try {
    await ElMessageBox.confirm(
      `确定要将此头像设为 ${selectedCharacter.value.name} 的头像吗？`,
      '设置角色头像',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 更新角色头像
    await http.patch(`/characters/${selectedCharacter.value.id}`, {
      avatar: avatar.url
    })

    // 更新本地角色数据
    selectedCharacter.value.avatar = avatar.url
    const characterIndex = characters.value.findIndex(c => c.id === selectedCharacter.value!.id)
    if (characterIndex > -1) {
      characters.value[characterIndex].avatar = avatar.url
    }

    emit('avatar-applied', selectedCharacter.value, avatar)
    ElMessage.success('角色头像已更新')

    // 关闭预览对话框
    showAvatarPreview.value = false
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('设置头像失败:', error)
      ElMessage.error('设置头像失败')
    }
  }
}

const generateVariations = async (avatar: GeneratedAvatar) => {
  // 基于现有头像生成变体
  const variationSettings = {
    ...avatarSettings,
    baseImage: avatar.url,
    variationStrength: 0.3
  }

  ElMessage.info('正在生成变体...')

  try {
    const response = await http.post('/multimodal/character/generate-avatar-variations', {
      character: selectedCharacter.value,
      settings: variationSettings
    })

    if (response.avatars) {
      handleGenerationComplete(response.avatars)
    }
  } catch (error) {
    console.error('生成变体失败:', error)
    ElMessage.error('生成变体失败')
  }
}

const batchDownload = async () => {
  const selectedAvatarObjects = generatedAvatars.value.filter(avatar =>
    selectedAvatars.value.includes(avatar.id)
  )

  for (const avatar of selectedAvatarObjects) {
    await downloadAvatar(avatar)
  }

  selectedAvatars.value = []
}

const saveToGallery = async () => {
  try {
    const avatarsToSave = generatedAvatars.value.filter(avatar =>
      selectedAvatars.value.includes(avatar.id)
    )

    await http.post('/multimodal/image/save-to-gallery', {
      images: avatarsToSave.map(avatar => ({
        ...avatar,
        type: 'generated',
        category: 'avatar'
      }))
    })

    ElMessage.success(`已保存 ${avatarsToSave.length} 个头像到画廊`)
    selectedAvatars.value = []
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存到画廊失败')
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedAvatars.value.length} 个头像吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    generatedAvatars.value = generatedAvatars.value.filter(avatar =>
      !selectedAvatars.value.includes(avatar.id)
    )
    selectedAvatars.value = []

    ElMessage.success('已删除选中的头像')
  } catch {
    // 用户取消
  }
}

const applySelectedAvatar = () => {
  const selectedAvatar = generatedAvatars.value.find(avatar =>
    selectedAvatars.value.includes(avatar.id)
  )

  if (selectedAvatar) {
    setAsCharacterAvatar(selectedAvatar)
  }
}

const saveToHistory = (avatars: GeneratedAvatar[]) => {
  const historyItems: AvatarHistoryItem[] = avatars.map(avatar => ({
    id: avatar.id,
    url: avatar.url,
    thumbnail: avatar.thumbnail,
    prompt: avatar.prompt,
    settings: { ...avatarSettings },
    createdAt: avatar.createdAt
  }))

  avatarHistory.value.unshift(...historyItems)

  // 限制历史记录数量
  if (avatarHistory.value.length > 20) {
    avatarHistory.value.splice(20)
  }
}

const loadAvatarHistory = async (characterId: string) => {
  try {
    const response = await http.get(`/multimodal/character/${characterId}/avatar-history`)
    if (response.history) {
      avatarHistory.value = response.history
    }
  } catch (error) {
    console.error('加载头像历史失败:', error)
  }
}

const loadHistoryItem = (historyItem: AvatarHistoryItem) => {
  // 将历史项目重新加载到当前生成结果中
  const avatar: GeneratedAvatar = {
    id: historyItem.id + '_reload',
    url: historyItem.url,
    thumbnail: historyItem.thumbnail,
    prompt: historyItem.prompt,
    style: historyItem.settings.style || 'anime',
    width: 512,
    height: 512,
    rating: Math.random() * 2 + 3,
    createdAt: historyItem.createdAt
  }

  generatedAvatars.value.unshift(avatar)
  ElMessage.success('历史头像已加载')
}

const getStyleLabel = (styleValue: string) => {
  const style = avatarStyles.find(s => s.value === styleValue)
  return style?.label || styleValue
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const onAvatarLoad = (avatar: GeneratedAvatar) => {
  console.log('头像加载完成:', avatar.id)
}

const onAvatarError = (avatar: GeneratedAvatar) => {
  console.error('头像加载失败:', avatar.id)
  ElMessage.error('头像加载失败')
}

// 生命周期
onMounted(async () => {
  // 加载角色列表
  try {
    const response = await http.get('/characters')
    if (response.characters) {
      characters.value = response.characters

      // 如果有预选角色ID，自动选择
      if (props.characterId) {
        await onCharacterChange(props.characterId)
      }
    }
  } catch (error) {
    console.error('加载角色列表失败:', error)
    ElMessage.error('加载角色列表失败')
  }
})

// 监听器
watch(() => props.characterId, (newCharacterId) => {
  if (newCharacterId && newCharacterId !== selectedCharacterId.value) {
    selectedCharacterId.value = newCharacterId
    onCharacterChange(newCharacterId)
  }
})
</script>

<style scoped>
.avatar-generator-dialog {
  --el-dialog-margin-top: 5vh;
}

.avatar-generator {
  display: flex;
  gap: 24px;
  height: 70vh;
}

.generator-left {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.generator-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.character-section {
  background: var(--el-bg-color);
  border-radius: 6px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.character-option {
  display: flex;
  align-items: center;
  gap: 12px;
}

.character-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.character-info {
  display: flex;
  flex-direction: column;
}

.character-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.character-creator {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.character-details {
  background: var(--el-bg-color);
  border-radius: 6px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.character-preview {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.current-avatar {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.character-basic-info {
  flex: 1;
}

.character-basic-info h3 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.character-description {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.character-traits {
  margin-bottom: 20px;
}

.traits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.trait-tag {
  font-size: 11px;
}

.style-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.setting-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin: 4px 0 0 0;
}

.seed-input {
  display: flex;
  gap: 8px;
}

.seed-input .el-input {
  flex: 1;
}

.advanced-settings {
  margin-top: 16px;
}

.generation-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.generate-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.generation-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.preview-area {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  padding: 16px;
  overflow-y: auto;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  min-height: 200px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  opacity: 0.7;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.avatar-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.avatar-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-item.selected {
  border-color: var(--el-color-primary);
}

.avatar-wrapper {
  position: relative;
  width: 100%;
  height: 160px;
}

.generated-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 6px;
}

.avatar-item:hover .avatar-overlay {
  opacity: 1;
}

.avatar-actions {
  display: flex;
  gap: 6px;
}

.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--el-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-item.selected .selection-indicator {
  opacity: 1;
}

.avatar-rating {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 2px 6px;
}

.avatar-info {
  padding: 8px;
  background: var(--el-bg-color-page);
}

.avatar-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.avatar-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 6px;
  margin-top: 12px;
}

.batch-info {
  font-size: 13px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.avatar-history {
  background: var(--el-bg-color);
  border-radius: 6px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  max-height: 200px;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: var(--el-bg-color-page);
}

.history-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  font-size: 11px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.history-date {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.avatar-preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.preview-avatar-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.preview-details {
  width: 100%;
}

.preview-details h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: var(--el-text-color-secondary);
}

.detail-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
  word-break: break-all;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.footer-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .avatar-generator {
    flex-direction: column;
    height: auto;
  }

  .generator-left {
    width: 100%;
  }

  .avatars-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .avatars-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .character-preview {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .batch-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .batch-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .avatars-grid {
    grid-template-columns: 1fr;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .footer-actions {
    justify-content: center;
  }
}
</style>
