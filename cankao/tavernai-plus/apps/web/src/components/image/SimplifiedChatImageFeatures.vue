<template>
  <div class="chat-image-features">
    <!-- 简化的图像功能按钮 -->
    <div class="simplified-image-controls">
      <el-dropdown @command="handleAction" trigger="click" placement="top-start">
        <el-button
          size="small"
          :icon="Picture"
          type="primary"
          title="对话图像功能"
        >
          图像 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="scene-generate">
              <el-icon><Camera /></el-icon>
              场景插图
            </el-dropdown-item>
            <el-dropdown-item command="emoji-generate">
              <el-icon><Promotion /></el-icon>
              表情包
            </el-dropdown-item>
            <el-dropdown-item command="upload-analyze">
              <el-icon><Upload /></el-icon>
              图片分析
            </el-dropdown-item>
            <el-dropdown-item divided command="image-history">
              <el-icon><Folder /></el-icon>
              图像历史
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 聊天中的图像历史 -->
    <div v-if="imageMessages.length > 0" class="image-messages-section">
      <h4 class="section-title">对话中的图像</h4>
      <div class="image-messages-grid">
        <div
          v-for="imageMsg in imageMessages"
          :key="imageMsg.id"
          class="image-message-item"
          @click="showImageInChat(imageMsg)"
        >
          <img
            :src="imageMsg.thumbnail || imageMsg.url"
            :alt="imageMsg.description"
            class="message-image-thumb"
          />
          <div class="image-message-info">
            <span class="image-description">{{ imageMsg.description }}</span>
            <span class="image-timestamp">{{ formatTime(imageMsg.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 场景插图生成器 -->
    <el-dialog
      v-model="showSceneGenerator"
      title="场景插图生成"
      width="600px"
      :close-on-click-modal="false"
      class="image-generator-dialog"
      :z-index="2500"
    >
      <div class="scene-generator-content">
        <!-- 对话上下文分析 -->
        <div class="context-analysis">
          <h4>当前对话场景</h4>
          <div class="context-info">
            <div class="context-item">
              <span class="context-label">场景:</span>
              <span class="context-value">{{ sceneContext.currentScene }}</span>
            </div>
            <div class="context-item">
              <span class="context-label">角色:</span>
              <span class="context-value">{{ sceneContext.characters.join(', ') }}</span>
            </div>
            <div class="context-item">
              <span class="context-label">氛围:</span>
              <span class="context-value">{{ sceneContext.environment }}</span>
            </div>
          </div>
        </div>

        <!-- 场景设置 -->
        <div class="scene-settings">
          <div class="setting-group">
            <label>视角选择:</label>
            <el-radio-group v-model="sceneSettings.viewpoint">
              <el-radio value="wide">全景视角</el-radio>
              <el-radio value="medium">中景视角</el-radio>
              <el-radio value="close">近景视角</el-radio>
            </el-radio-group>
          </div>

          <div class="setting-group">
            <label>包含元素:</label>
            <el-checkbox-group v-model="sceneSettings.elements">
              <el-checkbox value="characters">角色</el-checkbox>
              <el-checkbox value="environment">环境</el-checkbox>
              <el-checkbox value="objects">道具</el-checkbox>
              <el-checkbox value="effects">特效</el-checkbox>
            </el-checkbox-group>
          </div>

          <div class="setting-group">
            <label>氛围调性:</label>
            <el-select v-model="sceneSettings.mood" placeholder="选择氛围">
              <el-option value="peaceful" label="宁静" />
              <el-option value="dramatic" label="戏剧化" />
              <el-option value="mysterious" label="神秘" />
              <el-option value="romantic" label="浪漫" />
              <el-option value="action" label="动作" />
            </el-select>
          </div>
        </div>

        <!-- 生成预览 -->
        <div v-if="scenePreview" class="scene-preview">
          <img :src="scenePreview.url" :alt="scenePreview.description" />
          <div class="preview-actions">
            <el-button @click="regenerateScene">重新生成</el-button>
            <el-button type="primary" @click="sendSceneToChat">发送到聊天</el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showSceneGenerator = false">关闭</el-button>
        <el-button
          type="primary"
          @click="generateSceneIllustration"
          :loading="isGeneratingScene"
        >
          生成场景插图
        </el-button>
      </template>
    </el-dialog>

    <!-- 表情包生成器 -->
    <el-dialog
      v-model="showEmojiGenerator"
      title="表情包生成器"
      width="500px"
      :close-on-click-modal="false"
      class="image-generator-dialog image-generator-dialog--small"
      :z-index="2500"
    >
      <div class="emoji-generator-content">
        <!-- 表情选择 -->
        <div class="emotion-selection">
          <h4>选择表情</h4>
          <div class="emotion-grid">
            <div
              v-for="emotion in emotions"
              :key="emotion.value"
              class="emotion-item"
              :class="{ 'selected': selectedEmotion === emotion.value }"
              @click="selectedEmotion = emotion.value"
            >
              <div class="emotion-icon">{{ emotion.icon }}</div>
              <span class="emotion-label">{{ emotion.label }}</span>
            </div>
          </div>
        </div>

        <!-- 文字设置 -->
        <div class="text-settings">
          <el-input
            v-model="emojiText"
            placeholder="输入表情包文字（可选）"
            maxlength="20"
          />

          <div class="text-style-options">
            <el-radio-group v-model="emojiTextStyle" size="small">
              <el-radio value="none">无文字</el-radio>
              <el-radio value="top">顶部文字</el-radio>
              <el-radio value="bottom">底部文字</el-radio>
              <el-radio value="center">居中文字</el-radio>
            </el-radio-group>
          </div>
        </div>

        <!-- 生成的表情包 -->
        <div v-if="generatedEmoji" class="generated-emoji">
          <img :src="generatedEmoji.url" :alt="generatedEmoji.text" />
          <div class="emoji-actions">
            <el-button @click="regenerateEmoji">重新生成</el-button>
            <el-button type="primary" @click="sendEmojiToChat">发送</el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showEmojiGenerator = false">关闭</el-button>
        <el-button
          type="primary"
          @click="generateEmoji"
          :loading="isGeneratingEmoji"
          :disabled="!selectedEmotion"
        >
          生成表情包
        </el-button>
      </template>
    </el-dialog>

    <!-- 图像上传分析 -->
    <input
      ref="imageUploadInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageUpload"
    />

    <!-- 图像分析结果对话框 -->
    <el-dialog
      v-model="showAnalysisResult"
      title="图像分析结果"
      width="600px"
      :close-on-click-modal="false"
      class="image-generator-dialog"
      :z-index="2500"
    >
      <div v-if="analysisResult" class="analysis-content">
        <div class="uploaded-image">
          <img :src="analysisResult.imageUrl" :alt="analysisResult.description" />
        </div>
        <div class="analysis-details">
          <h4>AI分析结果</h4>
          <p class="analysis-description">{{ analysisResult.description }}</p>

          <!-- 识别的物体 -->
          <div v-if="analysisResult.objects?.length > 0" class="detected-objects">
            <h5>识别物体:</h5>
            <div class="objects-list">
              <el-tag
                v-for="obj in analysisResult.objects"
                :key="obj.name"
                size="small"
                type="info"
              >
                {{ obj.name }} ({{ Math.round(obj.confidence * 100) }}%)
              </el-tag>
            </div>
          </div>

          <!-- 情感分析 -->
          <div v-if="analysisResult.emotions?.length > 0" class="emotion-analysis">
            <h5>情感分析:</h5>
            <div class="emotions-list">
              <el-tag
                v-for="emotion in analysisResult.emotions"
                :key="emotion.name"
                size="small"
                :type="getEmotionType(emotion.confidence)"
              >
                {{ emotion.name }} ({{ Math.round(emotion.confidence * 100) }}%)
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showAnalysisResult = false">关闭</el-button>
        <el-button
          type="primary"
          @click="sendAnalysisToChat"
        >
          将分析结果发送到聊天
        </el-button>
      </template>
    </el-dialog>

    <!-- 图像历史对话框 -->
    <el-dialog
      v-model="showImageHistory"
      title="对话图像历史"
      width="700px"
      :close-on-click-modal="false"
      class="image-generator-dialog image-generator-dialog--large"
      :z-index="2500"
    >
      <div class="image-history-content">
        <div v-if="imageMessages.length === 0" class="empty-history">
          <div class="empty-icon">📷</div>
          <p>此对话中还没有图像</p>
        </div>
        <div v-else class="history-grid">
          <div
            v-for="imageMsg in imageMessages"
            :key="imageMsg.id"
            class="history-item"
          >
            <img
              :src="imageMsg.thumbnail || imageMsg.url"
              :alt="imageMsg.description"
              @click="previewImage(imageMsg)"
            />
            <div class="history-info">
              <span class="history-description">{{ imageMsg.description }}</span>
              <span class="history-timestamp">{{ formatTime(imageMsg.timestamp) }}</span>
              <div class="history-actions">
                <el-button size="small" @click="resendImage(imageMsg)">重新发送</el-button>
                <el-button size="small" @click="downloadImage(imageMsg)">下载</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Picture, ArrowDown, Camera, Promotion, Upload, Folder
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// Props & Emits
const props = defineProps<{
  currentCharacter?: any
  messages?: any[]
  isVisible?: boolean
}>()

const emit = defineEmits<{
  'image-generated': [image: any]
  'image-message': [message: any]
}>()

// 接口定义
interface ImageMessage {
  id: string
  url: string
  thumbnail?: string
  description: string
  timestamp: Date
  sender: 'user' | 'assistant'
}

interface SceneContext {
  currentScene: string
  characters: string[]
  environment: string
  mood: string
}

interface AnalysisResult {
  imageUrl: string
  description: string
  objects?: Array<{ name: string; confidence: number }>
  emotions?: Array<{ name: string; confidence: number }>
  colors?: any
}

// 响应式数据
// 对话框状态
const showSceneGenerator = ref(false)
const showEmojiGenerator = ref(false)
const showAnalysisResult = ref(false)
const showImageHistory = ref(false)

// 场景生成
const isGeneratingScene = ref(false)
const sceneContext = reactive<SceneContext>({
  currentScene: '',
  characters: [],
  environment: '',
  mood: ''
})

const sceneSettings = reactive({
  viewpoint: 'medium',
  elements: ['characters', 'environment'],
  mood: 'peaceful'
})

const scenePreview = ref<any>(null)

// 表情包生成
const isGeneratingEmoji = ref(false)
const selectedEmotion = ref('')
const emojiText = ref('')
const emojiTextStyle = ref('none')
const generatedEmoji = ref<any>(null)

// 图像分析
const imageUploadInput = ref<HTMLInputElement>()
const analysisResult = ref<AnalysisResult | null>(null)

// 聊天中的图像
const imageMessages = ref<ImageMessage[]>([])

// 表情选项
const emotions = [
  { value: 'happy', label: '开心', icon: '😊' },
  { value: 'sad', label: '难过', icon: '😢' },
  { value: 'angry', label: '生气', icon: '😠' },
  { value: 'surprised', label: '惊讶', icon: '😮' },
  { value: 'confused', label: '困惑', icon: '😕' },
  { value: 'excited', label: '兴奋', icon: '🤩' },
  { value: 'thinking', label: '思考', icon: '🤔' },
  { value: 'laughing', label: '大笑', icon: '😂' }
]

// 方法
const handleAction = (command: string) => {
  switch (command) {
    case 'scene-generate':
      analyzeSceneContext()
      showSceneGenerator.value = true
      break
    case 'emoji-generate':
      showEmojiGenerator.value = true
      break
    case 'upload-analyze':
      imageUploadInput.value?.click()
      break
    case 'image-history':
      showImageHistory.value = true
      break
  }
}

// 场景插图生成
const analyzeSceneContext = () => {
  if (!props.messages || props.messages.length === 0) {
    sceneContext.currentScene = '默认场景'
    sceneContext.characters = props.currentCharacter ? [props.currentCharacter.name] : []
    sceneContext.environment = '温馨环境'
    sceneContext.mood = 'peaceful'
    return
  }

  // 分析最近的对话内容
  const recentMessages = props.messages.slice(-5)
  const content = recentMessages.map(m => m.content).join(' ')

  // 简单的场景分析
  sceneContext.currentScene = extractScene(content)
  sceneContext.characters = extractCharacters(content)
  sceneContext.environment = extractEnvironment(content)
  sceneContext.mood = extractMood(content)
}

const extractScene = (content: string): string => {
  const sceneKeywords = ['房间', '花园', '森林', '海边', '城市', '学校', '咖啡厅']
  for (const keyword of sceneKeywords) {
    if (content.includes(keyword)) {
      return keyword
    }
  }
  return '室内场景'
}

const extractCharacters = (content: string): string[] => {
  const characters = []
  if (props.currentCharacter) {
    characters.push(props.currentCharacter.name)
  }
  return characters
}

const extractEnvironment = (content: string): string => {
  const envKeywords = ['阳光明媚', '昏暗', '温馨', '寒冷', '炎热']
  for (const keyword of envKeywords) {
    if (content.includes(keyword)) {
      return keyword
    }
  }
  return '普通环境'
}

const extractMood = (content: string): string => {
  const moodKeywords = ['开心', '难过', '紧张', '轻松', '浪漫']
  for (const keyword of moodKeywords) {
    if (content.includes(keyword)) {
      return keyword
    }
  }
  return 'peaceful'
}

const generateSceneIllustration = async () => {
  isGeneratingScene.value = true

  try {
    const scenePrompt = buildScenePrompt()

    const response = await http.post('/multimodal/image/generate-scene', {
      prompt: scenePrompt,
      context: sceneContext,
      settings: sceneSettings
    })

    if (response.image) {
      scenePreview.value = {
        url: response.image.url,
        description: scenePrompt
      }
    }
  } catch (error) {
    console.error('场景生成失败:', error)
    ElMessage.error('场景生成失败')
  } finally {
    isGeneratingScene.value = false
  }
}

const buildScenePrompt = () => {
  let prompt = `${sceneContext.currentScene} scene`

  if (sceneSettings.elements.includes('characters')) {
    prompt += `, featuring ${sceneContext.characters.join(' and ')}`
  }

  if (sceneSettings.elements.includes('environment')) {
    prompt += `, ${sceneContext.environment} atmosphere`
  }

  prompt += `, ${sceneSettings.viewpoint} view, ${sceneSettings.mood} mood`

  return prompt
}

const regenerateScene = () => {
  generateSceneIllustration()
}

const sendSceneToChat = () => {
  if (scenePreview.value) {
    const imageMessage = {
      id: Date.now().toString(),
      type: 'image',
      content: scenePreview.value.url,
      description: scenePreview.value.description,
      sender: 'user',
      timestamp: new Date()
    }

    emit('image-message', imageMessage)
    showSceneGenerator.value = false
    ElMessage.success('场景插图已发送到聊天')
  }
}

// 表情包生成
const generateEmoji = async () => {
  if (!selectedEmotion.value) return

  isGeneratingEmoji.value = true

  try {
    const emojiPrompt = buildEmojiPrompt()

    const response = await http.post('/multimodal/image/generate-emoji', {
      prompt: emojiPrompt,
      emotion: selectedEmotion.value,
      text: emojiTextStyle.value !== 'none' ? emojiText.value : null,
      textStyle: emojiTextStyle.value,
      character: props.currentCharacter
    })

    if (response.emoji) {
      generatedEmoji.value = {
        url: response.emoji.url,
        text: emojiText.value
      }
    }
  } catch (error) {
    console.error('表情包生成失败:', error)
    ElMessage.error('表情包生成失败')
  } finally {
    isGeneratingEmoji.value = false
  }
}

const buildEmojiPrompt = () => {
  let prompt = `${selectedEmotion.value} emoji`

  if (props.currentCharacter) {
    prompt += ` of ${props.currentCharacter.name}`
  }

  prompt += ', simple, expressive, cartoon style'

  return prompt
}

const regenerateEmoji = () => {
  generateEmoji()
}

const sendEmojiToChat = () => {
  if (generatedEmoji.value) {
    const emojiMessage = {
      id: Date.now().toString(),
      type: 'emoji',
      content: generatedEmoji.value.url,
      text: generatedEmoji.value.text,
      sender: 'user',
      timestamp: new Date()
    }

    emit('image-message', emojiMessage)
    showEmojiGenerator.value = false
    ElMessage.success('表情包已发送')
  }
}

// 图像上传分析
const handleImageUpload = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  const file = files[0]

  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await http.post('/multimodal/image/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.analysis) {
      analysisResult.value = {
        imageUrl: URL.createObjectURL(file),
        description: response.analysis.description,
        objects: response.analysis.objects,
        emotions: response.analysis.emotions,
        colors: response.analysis.colors
      }

      showAnalysisResult.value = true
    }
  } catch (error) {
    console.error('图像分析失败:', error)
    ElMessage.error('图像分析失败')
  }
}

const sendAnalysisToChat = () => {
  if (analysisResult.value) {
    const analysisMessage = {
      id: Date.now().toString(),
      type: 'analysis',
      content: analysisResult.value.description,
      image: analysisResult.value.imageUrl,
      analysis: analysisResult.value,
      sender: 'user',
      timestamp: new Date()
    }

    emit('image-message', analysisMessage)
    showAnalysisResult.value = false
    ElMessage.success('分析结果已发送')
  }
}

const getEmotionType = (confidence: number) => {
  if (confidence > 0.8) return 'success'
  if (confidence > 0.6) return 'warning'
  return 'info'
}

// 图像历史功能
const previewImage = (imageMsg: ImageMessage) => {
  // 实现图像预览功能
  console.log('预览图像:', imageMsg)
}

const resendImage = (imageMsg: ImageMessage) => {
  emit('image-message', {
    ...imageMsg,
    id: Date.now().toString(),
    timestamp: new Date()
  })
  ElMessage.success('图像已重新发送')
}

const downloadImage = async (imageMsg: ImageMessage) => {
  try {
    const response = await fetch(imageMsg.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `chat-image-${imageMsg.id}.png`
    a.click()

    URL.revokeObjectURL(url)
    ElMessage.success('下载开始')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 工具函数
const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showImageInChat = (imageMsg: ImageMessage) => {
  // 在聊天中显示图像的逻辑
  previewImage(imageMsg)
}

// 监听器
watch(() => props.messages, (newMessages) => {
  if (newMessages) {
    // 提取图像消息
    const extractedImages = newMessages.filter(msg =>
      msg.type === 'image' || msg.type === 'emoji' || msg.type === 'analysis'
    ).map(msg => ({
      id: msg.id,
      url: msg.content,
      description: msg.description || msg.text || '图像',
      timestamp: new Date(msg.timestamp),
      sender: msg.sender
    }))

    imageMessages.value = extractedImages
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  // 初始化
})
</script>

<style scoped>
.chat-image-features {
  position: relative;
  z-index: 1;
}

.simplified-image-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.image-messages-section {
  margin: 16px 0;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.image-messages-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.image-message-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.image-message-item:hover {
  border-color: var(--el-color-primary);
}

.message-image-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.image-message-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.image-description {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.image-timestamp {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

/* 对话框样式 */
.scene-generator-content,
.emoji-generator-content,
.analysis-content,
.image-history-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.context-analysis {
  background: var(--el-bg-color-page);
  border-radius: 6px;
  padding: 16px;
}

.context-analysis h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.context-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.context-item {
  display: flex;
  gap: 8px;
}

.context-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 50px;
}

.context-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.scene-settings,
.emotion-selection,
.text-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.emotion-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.emotion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.emotion-item:hover {
  border-color: var(--el-color-primary);
}

.emotion-item.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.emotion-icon {
  font-size: 24px;
}

.emotion-label {
  font-size: 11px;
  text-align: center;
}

.text-style-options {
  margin-top: 8px;
}

.scene-preview,
.generated-emoji {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.scene-preview img,
.generated-emoji img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 6px;
}

.preview-actions,
.emoji-actions {
  display: flex;
  gap: 8px;
}

.uploaded-image img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 6px;
}

.analysis-details h4,
.analysis-details h5 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.analysis-description {
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.objects-list,
.emotions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-history {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.empty-history img {
  width: 80px;
  height: 80px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.history-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
}

.history-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  cursor: pointer;
}

.history-info {
  padding: 12px;
}

.history-description {
  display: block;
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.history-timestamp {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.history-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

/* 图片生成对话框专用样式管理 */
:deep(.image-generator-dialog) {
  .el-dialog {
    background: var(--dt-color-surface-primary, var(--el-bg-color));
    border: 1px solid var(--dt-color-border-primary, var(--el-border-color));
    backdrop-filter: blur(20px);
    box-shadow: var(--dt-shadow-2xl, var(--el-box-shadow-light));
    border-radius: var(--dt-border-radius-xl, 12px);
    margin: 5vh auto;
    max-height: 90vh;
    overflow: hidden;
  }

  .el-dialog__header {
    background: var(--dt-gradient-primary, linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3)));
    padding: var(--dt-spacing-lg, 20px);
    border-bottom: 1px solid var(--dt-color-border-primary, var(--el-border-color));

    .el-dialog__title {
      color: white;
      font-weight: var(--dt-font-weight-semibold, 600);
    }

    .el-dialog__close {
      color: white;
      font-size: var(--dt-font-size-lg, 18px);

      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .el-dialog__body {
    padding: var(--dt-spacing-lg, 20px);
    max-height: 60vh;
    overflow-y: auto;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--dt-color-surface-secondary, var(--el-bg-color-page));
    }

    &::-webkit-scrollbar-thumb {
      background: var(--dt-color-primary-400, var(--el-color-primary-light-3));
      border-radius: 3px;
    }
  }

  .el-dialog__footer {
    padding: var(--dt-spacing-md, 16px) var(--dt-spacing-lg, 20px);
    border-top: 1px solid var(--dt-color-border-secondary, var(--el-border-color-light));
    background: var(--dt-color-surface-secondary, var(--el-bg-color-page));
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.image-generator-dialog) {
    .el-dialog {
      width: 95vw !important;
      margin: 2vh auto;
      max-height: 95vh;
    }

    .el-dialog__body {
      max-height: 70vh;
      padding: var(--dt-spacing-md, 16px);
    }

    .el-dialog__header {
      padding: var(--dt-spacing-md, 16px);
    }
  }

  :deep(.image-generator-dialog--large) {
    .el-dialog {
      width: 98vw !important;
    }
  }

  :deep(.image-generator-dialog--small) {
    .el-dialog {
      width: 90vw !important;
    }
  }

  .emotion-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .history-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  :deep(.image-generator-dialog) {
    .el-dialog {
      width: 100vw !important;
      margin: 0;
      height: 100vh !important;
      max-height: 100vh;
      border-radius: 0;
    }

    .el-dialog__body {
      max-height: calc(100vh - 120px);
    }
  }
}
</style>
