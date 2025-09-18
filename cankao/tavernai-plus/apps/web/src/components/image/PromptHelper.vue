<template>
  <el-dialog
    v-model="visible"
    title="AI提示词助手"
    width="800px"
    :close-on-click-modal="false"
    class="prompt-helper-dialog"
  >
    <div class="prompt-helper">
      <!-- 助手顶部工具栏 -->
      <div class="helper-header">
        <div class="header-tabs">
          <el-button
            v-for="tab in helperTabs"
            :key="tab.key"
            :type="activeTab === tab.key ? 'primary' : ''"
            size="small"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </el-button>
        </div>
        <div class="header-actions">
          <el-button
            size="small"
            :icon="MagicStick"
            @click="generateSmartPrompt"
            :loading="isGenerating"
          >
            智能生成
          </el-button>
          <el-button
            size="small"
            :icon="Refresh"
            @click="clearAll"
          >
            清空
          </el-button>
        </div>
      </div>

      <!-- 当前提示词显示 -->
      <div class="current-prompt-section">
        <label class="section-label">当前提示词</label>
        <el-input
          v-model="currentPrompt"
          type="textarea"
          :rows="3"
          placeholder="在这里编辑你的提示词..."
          @input="onPromptChange"
        />
        <div class="prompt-stats">
          <span class="stat-item">长度: {{ currentPrompt.length }}/2000</span>
          <span class="stat-item">词数: {{ promptWordCount }}</span>
          <span class="stat-item">质量评分: {{ promptQualityScore }}/100</span>
        </div>
      </div>

      <!-- 构建器标签页 -->
      <div v-if="activeTab === 'builder'" class="builder-content">
        <!-- 主题选择 -->
        <div class="builder-section">
          <h4 class="section-title">主题</h4>
          <div class="subject-grid">
            <div
              v-for="subject in subjects"
              :key="subject.name"
              class="subject-item"
              :class="{ 'selected': selectedSubject === subject.name }"
              @click="selectSubject(subject.name)"
            >
              <div class="subject-icon">{{ subject.icon }}</div>
              <span class="subject-label">{{ subject.label }}</span>
            </div>
          </div>
        </div>

        <!-- 风格选择 -->
        <div class="builder-section">
          <h4 class="section-title">艺术风格</h4>
          <div class="style-tags">
            <el-tag
              v-for="style in artStyles"
              :key="style"
              :type="selectedStyles.includes(style) ? 'primary' : ''"
              @click="toggleStyle(style)"
              class="style-tag"
            >
              {{ style }}
            </el-tag>
          </div>
        </div>

        <!-- 质量修饰词 -->
        <div class="builder-section">
          <h4 class="section-title">质量增强</h4>
          <div class="quality-grid">
            <el-checkbox-group v-model="selectedQualities">
              <el-checkbox
                v-for="quality in qualityModifiers"
                :key="quality"
                :value="quality"
              >
                {{ quality }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 构图设置 -->
        <div class="builder-section">
          <h4 class="section-title">构图</h4>
          <div class="composition-controls">
            <div class="control-group">
              <label>视角</label>
              <el-select v-model="composition.viewpoint" placeholder="选择视角">
                <el-option
                  v-for="view in viewpoints"
                  :key="view"
                  :label="view"
                  :value="view"
                />
              </el-select>
            </div>
            <div class="control-group">
              <label>镜头</label>
              <el-select v-model="composition.shot" placeholder="选择镜头">
                <el-option
                  v-for="shot in shotTypes"
                  :key="shot"
                  :label="shot"
                  :value="shot"
                />
              </el-select>
            </div>
            <div class="control-group">
              <label>光照</label>
              <el-select v-model="composition.lighting" placeholder="选择光照">
                <el-option
                  v-for="light in lightingTypes"
                  :key="light"
                  :label="light"
                  :value="light"
                />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 颜色主题 -->
        <div class="builder-section">
          <h4 class="section-title">色彩主题</h4>
          <div class="color-themes">
            <div
              v-for="theme in colorThemes"
              :key="theme.name"
              class="color-theme"
              :class="{ 'selected': selectedColorTheme === theme.name }"
              @click="selectColorTheme(theme.name)"
            >
              <div class="theme-colors">
                <div
                  v-for="color in theme.colors"
                  :key="color"
                  class="theme-color"
                  :style="{ backgroundColor: color }"
                ></div>
              </div>
              <span class="theme-name">{{ theme.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 模板标签页 -->
      <div v-if="activeTab === 'templates'" class="templates-content">
        <div class="template-categories">
          <el-button
            v-for="category in templateCategories"
            :key="category"
            :type="selectedTemplateCategory === category ? 'primary' : ''"
            size="small"
            @click="selectTemplateCategory(category)"
          >
            {{ category }}
          </el-button>
        </div>

        <div class="templates-grid">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-card"
            @click="applyTemplate(template)"
          >
            <div class="template-preview">
              <img
                v-if="template.preview"
                :src="template.preview"
                :alt="template.name"
                class="template-image"
              />
              <div v-else class="template-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
            <div class="template-info">
              <h4 class="template-name">{{ template.name }}</h4>
              <p class="template-description">{{ template.description }}</p>
              <div class="template-prompt">{{ template.prompt.slice(0, 100) }}...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 修饰词标签页 -->
      <div v-if="activeTab === 'modifiers'" class="modifiers-content">
        <div class="modifier-categories">
          <div
            v-for="category in modifierCategories"
            :key="category.name"
            class="modifier-category"
          >
            <h4 class="category-title">{{ category.label }}</h4>
            <div class="modifier-items">
              <el-tag
                v-for="modifier in category.items"
                :key="modifier"
                :type="selectedModifiers.includes(modifier) ? 'primary' : 'info'"
                @click="toggleModifier(modifier)"
                class="modifier-tag"
                size="small"
              >
                {{ modifier }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 优化建议标签页 -->
      <div v-if="activeTab === 'optimize'" class="optimize-content">
        <div class="optimization-panel">
          <div class="analysis-section">
            <h4 class="section-title">提示词分析</h4>
            <div class="analysis-results">
              <div class="analysis-item">
                <span class="analysis-label">结构完整性:</span>
                <el-progress
                  :percentage="promptAnalysis.structure"
                  :color="getProgressColor(promptAnalysis.structure)"
                  :show-text="false"
                />
                <span class="analysis-score">{{ promptAnalysis.structure }}%</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">描述清晰度:</span>
                <el-progress
                  :percentage="promptAnalysis.clarity"
                  :color="getProgressColor(promptAnalysis.clarity)"
                  :show-text="false"
                />
                <span class="analysis-score">{{ promptAnalysis.clarity }}%</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">创意独特性:</span>
                <el-progress
                  :percentage="promptAnalysis.creativity"
                  :color="getProgressColor(promptAnalysis.creativity)"
                  :show-text="false"
                />
                <span class="analysis-score">{{ promptAnalysis.creativity }}%</span>
              </div>
            </div>
          </div>

          <div class="suggestions-section">
            <h4 class="section-title">优化建议</h4>
            <div class="suggestions-list">
              <div
                v-for="suggestion in optimizationSuggestions"
                :key="suggestion.id"
                class="suggestion-item"
              >
                <div class="suggestion-icon">
                  <el-icon><component :is="suggestion.icon" /></el-icon>
                </div>
                <div class="suggestion-content">
                  <h5 class="suggestion-title">{{ suggestion.title }}</h5>
                  <p class="suggestion-description">{{ suggestion.description }}</p>
                  <el-button
                    v-if="suggestion.action"
                    size="small"
                    type="primary"
                    text
                    @click="applySuggestion(suggestion)"
                  >
                    应用建议
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div class="enhancement-section">
            <h4 class="section-title">AI增强</h4>
            <div class="enhancement-options">
              <el-button
                @click="enhancePrompt('clarity')"
                :loading="isEnhancing.clarity"
                size="small"
              >
                提高清晰度
              </el-button>
              <el-button
                @click="enhancePrompt('creativity')"
                :loading="isEnhancing.creativity"
                size="small"
              >
                增强创意
              </el-button>
              <el-button
                @click="enhancePrompt('detail')"
                :loading="isEnhancing.detail"
                size="small"
              >
                添加细节
              </el-button>
              <el-button
                @click="enhancePrompt('style')"
                :loading="isEnhancing.style"
                size="small"
              >
                风格化
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史记录标签页 -->
      <div v-if="activeTab === 'history'" class="history-content">
        <div class="history-list">
          <div
            v-for="item in promptHistory"
            :key="item.id"
            class="history-item"
            @click="loadHistoryPrompt(item)"
          >
            <div class="history-info">
              <div class="history-prompt">{{ item.prompt.slice(0, 100) }}...</div>
              <div class="history-meta">
                <span class="history-date">{{ formatDate(item.createdAt) }}</span>
                <span class="history-score">评分: {{ item.qualityScore }}</span>
              </div>
            </div>
            <div class="history-actions">
              <el-button
                size="small"
                circle
                :icon="Download"
                @click.stop="loadHistoryPrompt(item)"
                title="加载"
              />
              <el-button
                size="small"
                circle
                :icon="Delete"
                @click.stop="deleteHistoryItem(item)"
                title="删除"
              />
            </div>
          </div>
        </div>

        <div v-if="promptHistory.length === 0" class="empty-history">
          <p>暂无历史记录</p>
        </div>
      </div>

      <!-- 负面提示词 -->
      <div class="negative-prompt-section">
        <label class="section-label">负面提示词</label>
        <el-input
          v-model="negativePrompt"
          type="textarea"
          :rows="2"
          placeholder="描述不想要的元素..."
        />
        <div class="negative-suggestions">
          <el-tag
            v-for="neg in commonNegatives"
            :key="neg"
            size="small"
            type="info"
            @click="addNegative(neg)"
            class="negative-tag"
          >
            + {{ neg }}
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button
            size="small"
            :icon="Collection"
            @click="saveToFavorites"
            :disabled="!currentPrompt.trim()"
          >
            保存收藏
          </el-button>
          <el-button
            size="small"
            :icon="Share"
            @click="sharePrompt"
            :disabled="!currentPrompt.trim()"
          >
            分享
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="visible = false">取消</el-button>
          <el-button
            type="primary"
            @click="applyPrompt"
            :disabled="!currentPrompt.trim()"
          >
            应用提示词
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
  MagicStick, Refresh, Picture, Download, Delete, Collection, Share,
  TrendCharts, Bulb, Star, Warning
} from '@element-plus/icons-vue'
import { http } from '@/utils/axios'

// Props & Emits
const props = defineProps<{
  modelValue: boolean
  currentPrompt?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'prompt-updated': [prompt: string, negativePrompt?: string]
}>()

// 接口定义
interface PromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  preview?: string
  tags: string[]
}

interface HistoryItem {
  id: string
  prompt: string
  negativePrompt?: string
  qualityScore: number
  createdAt: Date
}

interface OptimizationSuggestion {
  id: string
  title: string
  description: string
  icon: string
  action?: string
  before?: string
  after?: string
}

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentPrompt = ref(props.currentPrompt || '')
const negativePrompt = ref('')
const activeTab = ref('builder')
const isGenerating = ref(false)

// 构建器状态
const selectedSubject = ref('')
const selectedStyles = ref<string[]>([])
const selectedQualities = ref<string[]>([])
const selectedModifiers = ref<string[]>([])
const selectedColorTheme = ref('')
const selectedTemplateCategory = ref('全部')

const composition = reactive({
  viewpoint: '',
  shot: '',
  lighting: ''
})

// 优化相关
const promptAnalysis = reactive({
  structure: 85,
  clarity: 78,
  creativity: 92
})

const isEnhancing = reactive({
  clarity: false,
  creativity: false,
  detail: false,
  style: false
})

// 数据集合
const promptHistory = ref<HistoryItem[]>([])
const promptTemplates = ref<PromptTemplate[]>([])
const optimizationSuggestions = ref<OptimizationSuggestion[]>([])

// 助手标签页
const helperTabs = [
  { key: 'builder', label: '构建器' },
  { key: 'templates', label: '模板' },
  { key: 'modifiers', label: '修饰词' },
  { key: 'optimize', label: '优化' },
  { key: 'history', label: '历史' }
]

// 主题数据
const subjects = [
  { name: 'person', label: '人物', icon: '👤' },
  { name: 'animal', label: '动物', icon: '🐾' },
  { name: 'landscape', label: '风景', icon: '🏔️' },
  { name: 'architecture', label: '建筑', icon: '🏛️' },
  { name: 'fantasy', label: '奇幻', icon: '🧙‍♂️' },
  { name: 'scifi', label: '科幻', icon: '🚀' },
  { name: 'abstract', label: '抽象', icon: '🎨' },
  { name: 'food', label: '食物', icon: '🍕' }
]

// 艺术风格
const artStyles = [
  '写实主义', '印象派', '超现实主义', '抽象主义', '立体主义',
  '波普艺术', '极简主义', '巴洛克', '洛可可', '新古典主义',
  '表现主义', '野兽派', '未来主义', '达达主义', '装饰艺术',
  '油画', '水彩画', '素描', '版画', '雕塑'
]

// 质量修饰词
const qualityModifiers = [
  '高清', '超高清', '4K', '8K', '专业摄影', '获奖作品',
  '完美构图', '精细细节', '锐利对焦', '完美光照',
  '艺术杰作', '博物馆收藏级', '摄影大师作品'
]

// 视角选项
const viewpoints = [
  '正面视角', '侧面视角', '背面视角', '四分之三视角',
  '俯视视角', '仰视视角', '平视视角', '斜视视角'
]

// 镜头类型
const shotTypes = [
  '特写镜头', '中景镜头', '远景镜头', '全景镜头',
  '微距镜头', '广角镜头', '长焦镜头', '鱼眼镜头'
]

// 光照类型
const lightingTypes = [
  '自然光', '工作室光照', '黄金时刻', '蓝色时刻',
  '戏剧性光照', '柔和光照', '硬光', '背光',
  '侧光', '顶光', '环境光', '人工光源'
]

// 颜色主题
const colorThemes = [
  { name: '暖色调', colors: ['#FF6B6B', '#FF8E53', '#FF6B9D', '#FFA726'] },
  { name: '冷色调', colors: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] },
  { name: '单色调', colors: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7'] },
  { name: '彩虹色', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'] },
  { name: '复古色', colors: ['#D63031', '#E17055', '#FDCB6E', '#6C5CE7'] },
  { name: '自然色', colors: ['#00B894', '#00CEC9', '#55A3FF', '#FD79A8'] }
]

// 模板分类
const templateCategories = ['全部', '人物', '风景', '抽象', '动物', '建筑', '艺术']

// 修饰词分类
const modifierCategories = [
  {
    name: 'camera',
    label: '相机设置',
    items: ['景深', '浅景深', 'f/1.4', 'f/2.8', '35mm镜头', '85mm镜头', '广角', '长焦']
  },
  {
    name: 'composition',
    label: '构图技巧',
    items: ['三分法', '黄金比例', '引导线', '对称', '框架构图', '重复', '对比', '平衡']
  },
  {
    name: 'mood',
    label: '情绪氛围',
    items: ['宁静', '神秘', '浪漫', '史诗', '忧郁', '欢快', '紧张', '温馨']
  },
  {
    name: 'texture',
    label: '材质纹理',
    items: ['丝滑', '粗糙', '光滑', '毛茸茸', '金属质感', '玻璃质感', '木质', '石质']
  },
  {
    name: 'effects',
    label: '视觉效果',
    items: ['光线追踪', '体积光', '粒子效果', '运动模糊', '景深', '辉光', '反射', '折射']
  }
]

// 常见负面提示词
const commonNegatives = [
  '低质量', '模糊', '失真', '畸形', '多余的手指', '错误解剖',
  '噪点', '伪影', '水印', '签名', '文字', 'logo', '边框'
]

// 计算属性
const promptWordCount = computed(() => {
  return currentPrompt.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const promptQualityScore = computed(() => {
  // 简单的质量评分算法
  let score = 0

  // 长度评分
  const length = currentPrompt.value.length
  if (length > 50) score += 20
  if (length > 100) score += 20

  // 词汇丰富度
  const words = currentPrompt.value.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)
  score += Math.min(30, (uniqueWords.size / words.length) * 100)

  // 包含质量修饰词
  const hasQuality = qualityModifiers.some(q =>
    currentPrompt.value.toLowerCase().includes(q.toLowerCase())
  )
  if (hasQuality) score += 15

  // 包含风格描述
  const hasStyle = artStyles.some(s =>
    currentPrompt.value.toLowerCase().includes(s.toLowerCase())
  )
  if (hasStyle) score += 15

  return Math.min(100, Math.round(score))
})

const filteredTemplates = computed(() => {
  if (selectedTemplateCategory.value === '全部') {
    return promptTemplates.value
  }
  return promptTemplates.value.filter(t => t.category === selectedTemplateCategory.value)
})

// 方法
const switchTab = (tab: string) => {
  activeTab.value = tab
  if (tab === 'optimize') {
    analyzePrompt()
  }
}

const onPromptChange = () => {
  // 实时分析提示词
  if (activeTab.value === 'optimize') {
    analyzePrompt()
  }
}

const selectSubject = (subject: string) => {
  selectedSubject.value = subject
  buildPromptFromSelections()
}

const toggleStyle = (style: string) => {
  const index = selectedStyles.value.indexOf(style)
  if (index > -1) {
    selectedStyles.value.splice(index, 1)
  } else {
    selectedStyles.value.push(style)
  }
  buildPromptFromSelections()
}

const selectColorTheme = (theme: string) => {
  selectedColorTheme.value = theme
  buildPromptFromSelections()
}

const toggleModifier = (modifier: string) => {
  const index = selectedModifiers.value.indexOf(modifier)
  if (index > -1) {
    selectedModifiers.value.splice(index, 1)
  } else {
    selectedModifiers.value.push(modifier)
  }
  buildPromptFromSelections()
}

const buildPromptFromSelections = () => {
  const parts = []

  // 添加主题
  if (selectedSubject.value) {
    const subject = subjects.find(s => s.name === selectedSubject.value)
    if (subject) {
      parts.push(subject.label)
    }
  }

  // 添加风格
  if (selectedStyles.value.length > 0) {
    parts.push(...selectedStyles.value)
  }

  // 添加构图
  if (composition.viewpoint) parts.push(composition.viewpoint)
  if (composition.shot) parts.push(composition.shot)
  if (composition.lighting) parts.push(composition.lighting)

  // 添加颜色主题
  if (selectedColorTheme.value) {
    parts.push(`${selectedColorTheme.value}主题`)
  }

  // 添加质量修饰词
  if (selectedQualities.value.length > 0) {
    parts.push(...selectedQualities.value)
  }

  // 添加其他修饰词
  if (selectedModifiers.value.length > 0) {
    parts.push(...selectedModifiers.value)
  }

  // 保持用户已有的内容
  const userContent = currentPrompt.value.trim()
  if (userContent && !parts.some(part => userContent.includes(part))) {
    parts.unshift(userContent)
  }

  currentPrompt.value = parts.join(', ')
}

const selectTemplateCategory = (category: string) => {
  selectedTemplateCategory.value = category
}

const applyTemplate = (template: PromptTemplate) => {
  currentPrompt.value = template.prompt
  ElMessage.success(`已应用模板: ${template.name}`)
}

const generateSmartPrompt = async () => {
  isGenerating.value = true

  try {
    const response = await http.post('/multimodal/image/generate-prompt', {
      basePrompt: currentPrompt.value,
      subject: selectedSubject.value,
      styles: selectedStyles.value,
      composition: composition,
      colorTheme: selectedColorTheme.value
    })

    if (response.prompt) {
      currentPrompt.value = response.prompt
      if (response.negativePrompt) {
        negativePrompt.value = response.negativePrompt
      }
      ElMessage.success('智能提示词生成完成')
    }
  } catch (error) {
    console.error('智能生成失败:', error)
    ElMessage.error('智能生成失败')
  } finally {
    isGenerating.value = false
  }
}

const analyzePrompt = async () => {
  if (!currentPrompt.value.trim()) return

  try {
    const response = await http.post('/multimodal/image/analyze-prompt', {
      prompt: currentPrompt.value
    })

    if (response.analysis) {
      Object.assign(promptAnalysis, response.analysis)
    }

    if (response.suggestions) {
      optimizationSuggestions.value = response.suggestions
    }
  } catch (error) {
    console.error('分析提示词失败:', error)
  }
}

const enhancePrompt = async (type: string) => {
  isEnhancing[type as keyof typeof isEnhancing] = true

  try {
    const response = await http.post('/multimodal/image/enhance-prompt', {
      prompt: currentPrompt.value,
      type: type
    })

    if (response.enhancedPrompt) {
      currentPrompt.value = response.enhancedPrompt
      ElMessage.success(`提示词${type}增强完成`)
    }
  } catch (error) {
    console.error('增强提示词失败:', error)
    ElMessage.error('增强提示词失败')
  } finally {
    isEnhancing[type as keyof typeof isEnhancing] = false
  }
}

const applySuggestion = (suggestion: OptimizationSuggestion) => {
  if (suggestion.after && suggestion.before) {
    currentPrompt.value = currentPrompt.value.replace(suggestion.before, suggestion.after)
  }
  ElMessage.success('建议已应用')
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 60) return '#E6A23C'
  return '#F56C6C'
}

const addNegative = (negative: string) => {
  if (!negativePrompt.value.includes(negative)) {
    if (negativePrompt.value) {
      negativePrompt.value += ', ' + negative
    } else {
      negativePrompt.value = negative
    }
  }
}

const loadHistoryPrompt = (item: HistoryItem) => {
  currentPrompt.value = item.prompt
  if (item.negativePrompt) {
    negativePrompt.value = item.negativePrompt
  }
  ElMessage.success('历史提示词已加载')
}

const deleteHistoryItem = async (item: HistoryItem) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条历史记录吗？',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const index = promptHistory.value.findIndex(h => h.id === item.id)
    if (index > -1) {
      promptHistory.value.splice(index, 1)
    }

    // 同步删除服务器记录
    await http.delete(`/user/prompt-history/${item.id}`)

    ElMessage.success('历史记录已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveToFavorites = async () => {
  try {
    await http.post('/user/prompt-favorites', {
      prompt: currentPrompt.value,
      negativePrompt: negativePrompt.value,
      qualityScore: promptQualityScore.value
    })

    ElMessage.success('已保存到收藏')
  } catch (error) {
    console.error('保存收藏失败:', error)
    ElMessage.error('保存收藏失败')
  }
}

const sharePrompt = async () => {
  try {
    const shareText = `AI图像生成提示词：${currentPrompt.value}`

    if (navigator.share) {
      await navigator.share({
        title: 'AI提示词分享',
        text: shareText
      })
    } else {
      await navigator.clipboard.writeText(shareText)
      ElMessage.success('提示词已复制到剪贴板')
    }
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享失败')
  }
}

const clearAll = () => {
  currentPrompt.value = ''
  negativePrompt.value = ''
  selectedSubject.value = ''
  selectedStyles.value = []
  selectedQualities.value = []
  selectedModifiers.value = []
  selectedColorTheme.value = ''
  Object.assign(composition, { viewpoint: '', shot: '', lighting: '' })
}

const applyPrompt = () => {
  emit('prompt-updated', currentPrompt.value, negativePrompt.value)

  // 保存到历史记录
  saveToHistory()

  visible.value = false
}

const saveToHistory = async () => {
  if (!currentPrompt.value.trim()) return

  const historyItem: HistoryItem = {
    id: Date.now().toString(),
    prompt: currentPrompt.value,
    negativePrompt: negativePrompt.value || undefined,
    qualityScore: promptQualityScore.value,
    createdAt: new Date()
  }

  promptHistory.value.unshift(historyItem)

  // 限制历史记录数量
  if (promptHistory.value.length > 50) {
    promptHistory.value.splice(50)
  }

  try {
    await http.post('/user/prompt-history', historyItem)
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(async () => {
  // 加载模板数据
  try {
    const [templatesRes, historyRes] = await Promise.all([
      http.get('/multimodal/image/prompt-templates'),
      http.get('/user/prompt-history')
    ])

    if (templatesRes.templates) {
      promptTemplates.value = templatesRes.templates
    }

    if (historyRes.history) {
      promptHistory.value = historyRes.history
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
})

// 监听器
watch(() => props.currentPrompt, (newPrompt) => {
  if (newPrompt) {
    currentPrompt.value = newPrompt
  }
})

watch([composition], () => {
  buildPromptFromSelections()
}, { deep: true })
</script>

<style scoped>
.prompt-helper-dialog {
  --el-dialog-margin-top: 5vh;
}

.prompt-helper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 70vh;
}

.helper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-tabs {
  display: flex;
  gap: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.current-prompt-section,
.negative-prompt-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.prompt-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.builder-content,
.templates-content,
.modifiers-content,
.optimize-content,
.history-content {
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
}

.builder-section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.subject-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.subject-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.subject-item.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
}

.subject-icon {
  font-size: 24px;
}

.subject-label {
  font-size: 12px;
  text-align: center;
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.style-tag:hover {
  transform: scale(1.05);
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.composition-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-group label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.color-themes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.color-theme {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-theme:hover {
  border-color: var(--el-color-primary);
}

.color-theme.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.theme-colors {
  display: flex;
  gap: 2px;
}

.theme-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.theme-name {
  font-size: 11px;
  text-align: center;
}

.template-categories {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.template-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-preview {
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: var(--el-bg-color-page);
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-placeholder {
  font-size: 32px;
  color: var(--el-text-color-placeholder);
}

.template-info {
  padding: 12px;
}

.template-name {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.template-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.template-prompt {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-family: monospace;
  background: var(--el-bg-color-page);
  padding: 4px 6px;
  border-radius: 3px;
}

.modifier-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modifier-category {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 16px;
}

.category-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.modifier-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.modifier-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.modifier-tag:hover {
  transform: scale(1.05);
}

.optimization-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.analysis-section,
.suggestions-section,
.enhancement-section {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 16px;
}

.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analysis-label {
  min-width: 80px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.analysis-score {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
}

.suggestion-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-8);
  border-radius: 50%;
  color: var(--el-color-primary);
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.suggestion-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.enhancement-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.history-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .history-actions {
  opacity: 1;
}

.empty-history {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--el-text-color-secondary);
}

.negative-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.negative-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.negative-tag:hover {
  transform: scale(1.05);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .composition-controls {
    grid-template-columns: 1fr;
  }

  .color-themes {
    grid-template-columns: repeat(2, 1fr);
  }

  .templates-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .helper-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-tabs {
    overflow-x: auto;
    white-space: nowrap;
  }

  .subject-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .quality-grid {
    grid-template-columns: 1fr;
  }

  .color-themes {
    grid-template-columns: 1fr;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .footer-left,
  .footer-right {
    justify-content: center;
  }
}
</style>
