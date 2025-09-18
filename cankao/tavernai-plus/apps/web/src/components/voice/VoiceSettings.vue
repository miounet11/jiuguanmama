<template>
  <div class="voice-settings-container">
    <!-- 头部 -->
    <div class="settings-header">
      <div class="header-info">
        <el-icon class="header-icon"><Setting /></el-icon>
        <div class="header-text">
          <h3>语音设置</h3>
          <p>配置语音合成和识别参数</p>
        </div>
      </div>

      <div class="header-actions">
        <el-button
          size="small"
          @click="resetToDefaults"
          :icon="RefreshLeft"
        >
          重置默认
        </el-button>

        <el-button
          size="small"
          type="primary"
          @click="saveSettings"
          :loading="isSaving"
          :icon="Check"
        >
          保存设置
        </el-button>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 通用设置 -->
      <el-card class="setting-card" header="通用设置">
        <div class="setting-group">
          <div class="setting-item">
            <label class="setting-label">默认语言</label>
            <el-select
              v-model="settings.defaultLanguage"
              placeholder="选择默认语言"
              class="setting-control"
            >
              <el-option
                v-for="lang in supportedLanguages"
                :key="lang.code"
                :label="lang.name"
                :value="lang.code"
              />
            </el-select>
            <div class="setting-description">
              新建语音配置时的默认语言
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">默认提供商</label>
            <el-select
              v-model="settings.defaultProvider"
              placeholder="选择默认提供商"
              class="setting-control"
            >
              <el-option
                v-for="provider in voiceProviders"
                :key="provider.value"
                :label="provider.label"
                :value="provider.value"
              />
            </el-select>
            <div class="setting-description">
              语音合成的默认服务提供商
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">音频质量</label>
            <el-select
              v-model="settings.audioQuality"
              class="setting-control"
            >
              <el-option label="标准 (16kHz)" value="standard" />
              <el-option label="高质量 (44kHz)" value="high" />
              <el-option label="超高质量 (96kHz)" value="ultra" />
            </el-select>
            <div class="setting-description">
              更高的质量会消耗更多带宽和存储空间
            </div>
          </div>
        </div>
      </el-card>

      <!-- 语音合成设置 -->
      <el-card class="setting-card" header="语音合成(TTS)">
        <div class="setting-group">
          <div class="setting-item">
            <label class="setting-label">默认语速</label>
            <div class="slider-control">
              <el-slider
                v-model="settings.tts.defaultSpeed"
                :min="0.25"
                :max="4"
                :step="0.25"
                show-stops
                :format-tooltip="formatSpeedTooltip"
              />
              <span class="slider-value">{{ settings.tts.defaultSpeed }}x</span>
            </div>
            <div class="setting-description">
              语音播放的默认速度倍率
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">默认音调</label>
            <div class="slider-control">
              <el-slider
                v-model="settings.tts.defaultPitch"
                :min="0.5"
                :max="2"
                :step="0.1"
                :format-tooltip="formatPitchTooltip"
              />
              <span class="slider-value">{{ settings.tts.defaultPitch }}</span>
            </div>
            <div class="setting-description">
              语音的音调高低，1.0为正常音调
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">默认音量</label>
            <div class="slider-control">
              <el-slider
                v-model="settings.tts.defaultVolume"
                :min="0"
                :max="100"
                :step="5"
                :format-tooltip="formatVolumeTooltip"
              />
              <span class="slider-value">{{ settings.tts.defaultVolume }}%</span>
            </div>
            <div class="setting-description">
              语音播放的默认音量大小
            </div>
          </div>

          <div class="setting-item">
            <el-checkbox v-model="settings.tts.enableSSML">
              启用 SSML 支持
            </el-checkbox>
            <div class="setting-description">
              启用语音合成标记语言，支持更精细的语音控制
            </div>
          </div>

          <div class="setting-item">
            <el-checkbox v-model="settings.tts.autoPlay">
              生成后自动播放
            </el-checkbox>
            <div class="setting-description">
              语音合成完成后自动开始播放
            </div>
          </div>

          <div class="setting-item">
            <el-checkbox v-model="settings.tts.enableCache">
              启用音频缓存
            </el-checkbox>
            <div class="setting-description">
              缓存生成的音频文件以加快重复播放速度
            </div>
          </div>
        </div>
      </el-card>

      <!-- 语音识别设置 -->
      <el-card class="setting-card" header="语音识别(STT)">
        <div class="setting-group">
          <div class="setting-item">
            <label class="setting-label">识别语言</label>
            <el-select
              v-model="settings.stt.recognitionLanguage"
              placeholder="选择识别语言"
              class="setting-control"
            >
              <el-option label="自动检测" value="auto" />
              <el-option
                v-for="lang in supportedLanguages"
                :key="lang.code"
                :label="lang.name"
                :value="lang.code"
              />
            </el-select>
            <div class="setting-description">
              语音识别时使用的语言模型
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">录音质量</label>
            <el-select
              v-model="settings.stt.recordingQuality"
              class="setting-control"
            >
              <el-option label="标准" value="standard" />
              <el-option label="高质量" value="high" />
            </el-select>
            <div class="setting-description">
              录音时的音频质量设置
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">最大录音时长</label>
            <div class="slider-control">
              <el-slider
                v-model="settings.stt.maxRecordingDuration"
                :min="30"
                :max="600"
                :step="30"
                :format-tooltip="formatDurationTooltip"
              />
              <span class="slider-value">{{ formatDuration(settings.stt.maxRecordingDuration) }}</span>
            </div>
            <div class="setting-description">
              单次录音的最大时长限制
            </div>
          </div>

          <div class="setting-item">
            <el-checkbox v-model="settings.stt.autoTranscribe">
              录音后自动转录
            </el-checkbox>
            <div class="setting-description">
              录音完成后自动进行语音转文字处理
            </div>
          </div>

          <div class="setting-item">
            <el-checkbox v-model="settings.stt.noiseSuppression">
              启用降噪
            </el-checkbox>
            <div class="setting-description">
              录音时自动减少背景噪音
            </div>
          </div>

          <div class="setting-item">
            <el-checkbox v-model="settings.stt.echoCancellation">
              启用回声消除
            </el-checkbox>
            <div class="setting-description">
              减少录音时的回声和反馈
            </div>
          </div>
        </div>
      </el-card>

      <!-- 角色语音配置 -->
      <el-card class="setting-card" header="角色语音配置">
        <div class="character-voice-section">
          <div class="section-header">
            <p>为不同角色配置专属语音</p>
            <el-button
              size="small"
              type="primary"
              @click="showCreateVoiceDialog = true"
              :icon="Plus"
            >
              新建配置
            </el-button>
          </div>

          <!-- 语音配置列表 -->
          <div class="voice-profiles-list">
            <div
              v-for="profile in voiceProfiles"
              :key="profile.id"
              class="voice-profile-item"
            >
              <div class="profile-info">
                <div class="profile-header">
                  <h4>{{ profile.name }}</h4>
                  <div class="profile-badges">
                    <el-tag size="small" type="info">{{ getProviderLabel(profile.provider) }}</el-tag>
                    <el-tag size="small">{{ getLanguageName(profile.language) }}</el-tag>
                  </div>
                </div>

                <div class="profile-details">
                  <span>语音: {{ profile.voice }}</span>
                  <span>速度: {{ profile.speed }}x</span>
                  <span>音调: {{ profile.pitch }}</span>
                  <span>音量: {{ Math.round(profile.volume * 100) }}%</span>
                </div>

                <div class="profile-character" v-if="profile.characterId">
                  <el-icon><User /></el-icon>
                  <span>绑定角色: {{ getCharacterName(profile.characterId) }}</span>
                </div>
              </div>

              <div class="profile-actions">
                <el-button
                  size="small"
                  @click="testVoiceProfile(profile)"
                  :loading="testingProfiles.includes(profile.id)"
                  :icon="VideoPlay"
                >
                  试听
                </el-button>

                <el-button
                  size="small"
                  @click="editVoiceProfile(profile)"
                  :icon="Edit"
                >
                  编辑
                </el-button>

                <el-button
                  size="small"
                  type="danger"
                  @click="deleteVoiceProfile(profile)"
                  :icon="Delete"
                >
                  删除
                </el-button>
              </div>
            </div>

            <div v-if="voiceProfiles.length === 0" class="empty-profiles">
              <el-empty description="暂无语音配置" />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 成本和使用统计 -->
      <el-card class="setting-card" header="使用统计">
        <div class="usage-stats">
          <div class="stat-item">
            <div class="stat-label">本月语音合成次数</div>
            <div class="stat-value">{{ usageStats.ttsCount }}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">本月识别时长</div>
            <div class="stat-value">{{ formatDuration(usageStats.sttDuration) }}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">本月消费金额</div>
            <div class="stat-value">¥{{ usageStats.totalCost.toFixed(2) }}</div>
          </div>

          <div class="stat-item">
            <div class="stat-label">缓存音频数量</div>
            <div class="stat-value">{{ usageStats.cachedAudioCount }}</div>
          </div>
        </div>

        <div class="usage-actions">
          <el-button
            size="small"
            @click="clearCache"
            :icon="Delete"
          >
            清空缓存
          </el-button>

          <el-button
            size="small"
            @click="exportUsageReport"
            :icon="Download"
          >
            导出报告
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑语音配置对话框 -->
    <el-dialog
      v-model="showCreateVoiceDialog"
      :title="isEditingProfile ? '编辑语音配置' : '新建语音配置'"
      width="600px"
      :close-on-click-modal="false"
    >
      <VoiceProfileEditor
        :profile="editingProfile"
        :is-editing="isEditingProfile"
        @save="handleProfileSave"
        @cancel="handleProfileCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  ElCard, ElSelect, ElOption, ElSlider, ElCheckbox, ElButton,
  ElTag, ElEmpty, ElDialog, ElMessage, ElMessageBox
} from 'element-plus'
import {
  Setting, RefreshLeft, Check, Plus, VideoPlay, Edit, Delete,
  Download, User
} from '@element-plus/icons-vue'
import VoiceProfileEditor from './VoiceProfileEditor.vue'
import { useVoice, type VoiceProfile, SUPPORTED_LANGUAGES, VOICE_PROVIDERS } from '@/composables/useVoice'

// Props
interface Props {
  characterId?: string // 当前角色ID，用于角色专属设置
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'settings-changed', settings: any): void
  (e: 'profile-created', profile: VoiceProfile): void
  (e: 'profile-updated', profile: VoiceProfile): void
  (e: 'profile-deleted', profileId: string): void
}

const emit = defineEmits<Emits>()

// 使用语音功能
const voice = useVoice()

// 解构所需的状态和方法
const {
  voiceProfiles,
  createVoiceProfile,
  updateVoiceProfile,
  deleteVoiceProfile: deleteProfile,
  synthesizeText
} = voice

// 组件状态
const isSaving = ref(false)
const showCreateVoiceDialog = ref(false)
const isEditingProfile = ref(false)
const editingProfile = ref<VoiceProfile | null>(null)
const testingProfiles = ref<string[]>([])

// 设置数据
const settings = reactive({
  defaultLanguage: 'zh-CN',
  defaultProvider: 'openai',
  audioQuality: 'standard',
  tts: {
    defaultSpeed: 1.0,
    defaultPitch: 1.0,
    defaultVolume: 80,
    enableSSML: false,
    autoPlay: true,
    enableCache: true
  },
  stt: {
    recognitionLanguage: 'auto',
    recordingQuality: 'standard',
    maxRecordingDuration: 300, // 5分钟
    autoTranscribe: true,
    noiseSuppression: true,
    echoCancellation: true
  }
})

// 使用统计
const usageStats = reactive({
  ttsCount: 0,
  sttDuration: 0,
  totalCost: 0,
  cachedAudioCount: 0
})

// 计算属性
const supportedLanguages = computed(() => SUPPORTED_LANGUAGES)

const voiceProviders = computed(() => [
  { label: 'OpenAI', value: 'openai' },
  { label: 'ElevenLabs', value: 'elevenlabs' },
  { label: 'Azure', value: 'azure' },
  { label: 'Google Cloud', value: 'google' }
])

// 方法
const saveSettings = async () => {
  isSaving.value = true
  try {
    // 保存设置到本地存储或后端
    localStorage.setItem('voice_settings', JSON.stringify(settings))

    emit('settings-changed', settings)
    ElMessage.success('设置已保存')
  } catch (err) {
    console.error('保存设置失败:', err)
    ElMessage.error('保存设置失败')
  } finally {
    isSaving.value = false
  }
}

const resetToDefaults = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置为默认值吗？此操作无法撤销。',
      '重置设置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 重置设置
    settings.defaultLanguage = 'zh-CN'
    settings.defaultProvider = 'openai'
    settings.audioQuality = 'standard'
    settings.tts.defaultSpeed = 1.0
    settings.tts.defaultPitch = 1.0
    settings.tts.defaultVolume = 80
    settings.tts.enableSSML = false
    settings.tts.autoPlay = true
    settings.tts.enableCache = true
    settings.stt.recognitionLanguage = 'auto'
    settings.stt.recordingQuality = 'standard'
    settings.stt.maxRecordingDuration = 300
    settings.stt.autoTranscribe = true
    settings.stt.noiseSuppression = true
    settings.stt.echoCancellation = true

    await saveSettings()
    ElMessage.success('设置已重置为默认值')
  } catch {
    // 用户取消
  }
}

const testVoiceProfile = async (profile: VoiceProfile) => {
  testingProfiles.value.push(profile.id)

  try {
    const testText = '这是一个语音测试，您听到的是' + profile.name + '的声音。'

    const audio = await synthesizeText({
      text: testText,
      voiceProfile: profile
    })

    if (audio) {
      // 播放测试音频
      const audioElement = new Audio(audio.url)
      audioElement.play()
    }
  } catch (err) {
    console.error('语音测试失败:', err)
    ElMessage.error('语音测试失败')
  } finally {
    testingProfiles.value = testingProfiles.value.filter(id => id !== profile.id)
  }
}

const editVoiceProfile = (profile: VoiceProfile) => {
  editingProfile.value = { ...profile }
  isEditingProfile.value = true
  showCreateVoiceDialog.value = true
}

const deleteVoiceProfile = async (profile: VoiceProfile) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除语音配置"${profile.name}"吗？此操作无法撤销。`,
      '删除配置',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteProfile(profile.id)
    emit('profile-deleted', profile.id)
    ElMessage.success('语音配置已删除')
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败:', err)
      ElMessage.error('删除失败')
    }
  }
}

const handleProfileSave = async (profile: VoiceProfile) => {
  try {
    if (isEditingProfile.value) {
      await updateVoiceProfile(profile)
      emit('profile-updated', profile)
      ElMessage.success('语音配置已更新')
    } else {
      const newProfile = await createVoiceProfile(profile)
      if (newProfile) {
        emit('profile-created', newProfile)
        ElMessage.success('语音配置已创建')
      }
    }

    showCreateVoiceDialog.value = false
    isEditingProfile.value = false
    editingProfile.value = null
  } catch (err) {
    console.error('保存配置失败:', err)
    ElMessage.error('保存配置失败')
  }
}

const handleProfileCancel = () => {
  showCreateVoiceDialog.value = false
  isEditingProfile.value = false
  editingProfile.value = null
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有缓存的音频文件吗？这将释放存储空间但可能影响播放速度。',
      '清空缓存',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 清空缓存逻辑
    usageStats.cachedAudioCount = 0
    ElMessage.success('缓存已清空')
  } catch {
    // 用户取消
  }
}

const exportUsageReport = () => {
  // 导出使用报告
  const report = {
    period: '本月',
    stats: usageStats,
    settings: settings,
    exportTime: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `voice-usage-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('使用报告已导出')
}

// 工具函数
const formatSpeedTooltip = (value: number) => `${value}x`
const formatPitchTooltip = (value: number) => `${value}`
const formatVolumeTooltip = (value: number) => `${value}%`
const formatDurationTooltip = (value: number) => formatDuration(value)

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

const getProviderLabel = (provider: string): string => {
  const providerMap: { [key: string]: string } = {
    'openai': 'OpenAI',
    'elevenlabs': 'ElevenLabs',
    'azure': 'Azure',
    'google': 'Google'
  }
  return providerMap[provider] || provider
}

const getLanguageName = (code: string): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
  return lang?.name || code
}

const getCharacterName = (characterId: string): string => {
  // 这里应该从角色列表中获取角色名称
  return '未知角色'
}

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('voice_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      Object.assign(settings, parsed)
    }
  } catch (err) {
    console.error('加载设置失败:', err)
  }
}

const loadUsageStats = () => {
  // 模拟使用统计数据
  usageStats.ttsCount = 125
  usageStats.sttDuration = 1800 // 30分钟
  usageStats.totalCost = 12.50
  usageStats.cachedAudioCount = 45
}

// 生命周期
onMounted(() => {
  loadSettings()
  loadUsageStats()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.voice-settings-container {
  max-width: 800px;
  margin: 0 auto;

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        font-size: 24px;
        color: var(--el-color-primary);
      }

      .header-text {
        h3 {
          margin: 0 0 4px 0;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .setting-card {
      :deep(.el-card__header) {
        background: var(--el-fill-color-extra-light);
        border-bottom: 1px solid var(--el-border-color-light);
        font-weight: 500;
      }

      .setting-group {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .setting-item {
          .setting-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .setting-control {
            width: 100%;
            max-width: 300px;
          }

          .slider-control {
            display: flex;
            align-items: center;
            gap: 16px;
            max-width: 400px;

            .el-slider {
              flex: 1;
            }

            .slider-value {
              min-width: 50px;
              text-align: right;
              font-family: monospace;
              color: var(--el-text-color-secondary);
            }
          }

          .setting-description {
            margin-top: 4px;
            font-size: 12px;
            color: var(--el-text-color-placeholder);
            line-height: 1.4;
          }
        }
      }
    }

    .character-voice-section {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        p {
          margin: 0;
          color: var(--el-text-color-secondary);
        }
      }

      .voice-profiles-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .voice-profile-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--el-fill-color-extra-light);
          border: 1px solid var(--el-border-color-light);
          border-radius: 8px;

          .profile-info {
            flex: 1;

            .profile-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;

              h4 {
                margin: 0;
                color: var(--el-text-color-primary);
              }

              .profile-badges {
                display: flex;
                gap: 4px;
              }
            }

            .profile-details {
              display: flex;
              gap: 16px;
              font-size: 12px;
              color: var(--el-text-color-secondary);
              margin-bottom: 4px;
            }

            .profile-character {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: var(--el-text-color-placeholder);
            }
          }

          .profile-actions {
            display: flex;
            gap: 8px;
          }
        }

        .empty-profiles {
          text-align: center;
          padding: 40px 20px;
        }
      }
    }

    .usage-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;

      .stat-item {
        text-align: center;
        padding: 16px;
        background: var(--el-fill-color-extra-light);
        border-radius: 8px;

        .stat-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }
    }

    .usage-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .voice-settings-container {
    padding: 0 16px;

    .settings-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .header-actions {
        justify-content: center;
      }
    }

    .voice-profile-item {
      flex-direction: column !important;
      gap: 12px;
      align-items: stretch !important;

      .profile-actions {
        justify-content: center;
      }
    }

    .usage-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .setting-control {
      max-width: none !important;
    }

    .slider-control {
      max-width: none !important;
    }
  }
}

// 暗色主题适配
.dark {
  .voice-settings-container {
    .setting-card {
      :deep(.el-card__header) {
        background: var(--el-fill-color);
      }
    }

    .voice-profile-item,
    .stat-item {
      background: var(--el-fill-color);
      border-color: var(--el-border-color);
    }
  }
}
</style>
