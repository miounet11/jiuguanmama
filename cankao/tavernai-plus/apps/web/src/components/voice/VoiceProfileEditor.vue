<template>
  <div class="voice-profile-editor">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      size="default"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h4>基本信息</h4>

        <el-form-item label="配置名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入语音配置名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="语音提供商" prop="provider">
          <el-select
            v-model="formData.provider"
            placeholder="选择语音提供商"
            @change="handleProviderChange"
          >
            <el-option
              v-for="provider in voiceProviders"
              :key="provider.value"
              :label="provider.label"
              :value="provider.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="语言" prop="language">
          <el-select
            v-model="formData.language"
            placeholder="选择语言"
            @change="handleLanguageChange"
          >
            <el-option
              v-for="lang in supportedLanguages"
              :key="lang.code"
              :label="lang.name"
              :value="lang.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="语音" prop="voice">
          <el-select
            v-model="formData.voice"
            placeholder="选择语音"
            :loading="isLoadingVoices"
            filterable
          >
            <el-option
              v-for="voice in availableVoices"
              :key="voice.id"
              :label="voice.name"
              :value="voice.id"
            >
              <div class="voice-option">
                <span class="voice-name">{{ voice.name }}</span>
                <el-tag size="small" v-if="voice.gender">{{ voice.gender }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="绑定角色">
          <el-select
            v-model="formData.characterId"
            placeholder="选择要绑定的角色（可选）"
            clearable
            filterable
          >
            <el-option
              v-for="character in characters"
              :key="character.id"
              :label="character.name"
              :value="character.id"
            >
              <div class="character-option">
                <img
                  :src="character.avatar"
                  :alt="character.name"
                  class="character-avatar"
                />
                <span>{{ character.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </div>

      <!-- 语音参数 -->
      <div class="form-section">
        <h4>语音参数</h4>

        <el-form-item label="语速">
          <div class="parameter-control">
            <el-slider
              v-model="formData.speed"
              :min="0.25"
              :max="4"
              :step="0.25"
              show-stops
              :format-tooltip="formatSpeedTooltip"
            />
            <span class="parameter-value">{{ formData.speed }}x</span>
          </div>
        </el-form-item>

        <el-form-item label="音调">
          <div class="parameter-control">
            <el-slider
              v-model="formData.pitch"
              :min="0.5"
              :max="2"
              :step="0.1"
              :format-tooltip="formatPitchTooltip"
            />
            <span class="parameter-value">{{ formData.pitch }}</span>
          </div>
        </el-form-item>

        <el-form-item label="音量">
          <div class="parameter-control">
            <el-slider
              v-model="formData.volume"
              :min="0"
              :max="1"
              :step="0.1"
              :format-tooltip="formatVolumeTooltip"
            />
            <span class="parameter-value">{{ Math.round(formData.volume * 100) }}%</span>
          </div>
        </el-form-item>
      </div>

      <!-- 预览测试 -->
      <div class="form-section">
        <h4>预览测试</h4>

        <el-form-item label="测试文本">
          <el-input
            v-model="testText"
            type="textarea"
            :rows="3"
            placeholder="输入要测试的文本..."
          />
        </el-form-item>

        <el-form-item>
          <el-button
            @click="testVoice"
            :loading="isTesting"
            :disabled="!canTest"
            :icon="VideoPlay"
          >
            {{ isTesting ? '生成中...' : '试听语音' }}
          </el-button>

          <el-button
            v-if="testAudio"
            @click="playTestAudio"
            :icon="isPlaying ? 'VideoPause' : 'VideoPlay'"
          >
            {{ isPlaying ? '暂停' : '播放' }}
          </el-button>
        </el-form-item>

        <!-- 测试结果 -->
        <div v-if="testAudio" class="test-result">
          <VoicePlayer
            :audio-data="testAudio"
            compact
            :show-extensions="false"
          />
        </div>
      </div>
    </el-form>

    <!-- 对话框底部按钮 -->
    <div class="editor-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        @click="handleSave"
        :loading="isSaving"
        :disabled="!canSave"
      >
        {{ isEditing ? '更新' : '创建' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton,
  ElSlider, ElTag, type FormInstance, type FormRules
} from 'element-plus'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'
import VoicePlayer from './VoicePlayer.vue'
import { useVoice, type VoiceProfile, type AudioRecording, SUPPORTED_LANGUAGES } from '@/composables/useVoice'
import { ElMessage } from 'element-plus'

// Props
interface Props {
  profile?: VoiceProfile | null
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  profile: null,
  isEditing: false
})

// Emits
interface Emits {
  (e: 'save', profile: VoiceProfile): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 使用语音功能
const voice = useVoice()
const { synthesizeText } = voice

// 表单引用
const formRef = ref<FormInstance>()

// 组件状态
const isSaving = ref(false)
const isTesting = ref(false)
const isPlaying = ref(false)
const isLoadingVoices = ref(false)
const testText = ref('这是一个语音测试，用于预览当前配置的效果。')
const testAudio = ref<AudioRecording | null>(null)

// 表单数据
const formData = reactive<Partial<VoiceProfile>>({
  name: '',
  provider: 'openai',
  language: 'zh-CN',
  voice: '',
  speed: 1.0,
  pitch: 1.0,
  volume: 0.8,
  characterId: undefined
})

// 可用语音列表
const availableVoices = ref<Array<{
  id: string
  name: string
  gender?: string
  preview?: string
}>>([])

// 角色列表
const characters = ref<Array<{
  id: string
  name: string
  avatar: string
}>>([])

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  provider: [
    { required: true, message: '请选择语音提供商', trigger: 'change' }
  ],
  language: [
    { required: true, message: '请选择语言', trigger: 'change' }
  ],
  voice: [
    { required: true, message: '请选择语音', trigger: 'change' }
  ]
}

// 计算属性
const supportedLanguages = computed(() => SUPPORTED_LANGUAGES)

const voiceProviders = computed(() => [
  { label: 'OpenAI', value: 'openai' },
  { label: 'ElevenLabs', value: 'elevenlabs' },
  { label: 'Azure', value: 'azure' },
  { label: 'Google Cloud', value: 'google' }
])

const canTest = computed(() => {
  return formData.provider &&
         formData.language &&
         formData.voice &&
         testText.value.trim() &&
         !isTesting.value
})

const canSave = computed(() => {
  return formData.name &&
         formData.provider &&
         formData.language &&
         formData.voice &&
         !isSaving.value
})

// 方法
const handleProviderChange = async () => {
  formData.voice = ''
  await loadAvailableVoices()
}

const handleLanguageChange = async () => {
  formData.voice = ''
  await loadAvailableVoices()
}

const loadAvailableVoices = async () => {
  if (!formData.provider || !formData.language) return

  isLoadingVoices.value = true
  try {
    // 根据提供商和语言加载可用语音
    const voices = await getVoicesForProvider(formData.provider, formData.language)
    availableVoices.value = voices
  } catch (err) {
    console.error('加载语音列表失败:', err)
    ElMessage.error('加载语音列表失败')
  } finally {
    isLoadingVoices.value = false
  }
}

const getVoicesForProvider = async (provider: string, language: string) => {
  // 模拟API调用，实际应该从后端获取
  const voiceMap: { [key: string]: { [key: string]: any[] } } = {
    'openai': {
      'zh-CN': [
        { id: 'alloy', name: 'Alloy', gender: '中性' },
        { id: 'echo', name: 'Echo', gender: '男性' },
        { id: 'fable', name: 'Fable', gender: '英式男性' },
        { id: 'onyx', name: 'Onyx', gender: '男性' },
        { id: 'nova', name: 'Nova', gender: '女性' },
        { id: 'shimmer', name: 'Shimmer', gender: '女性' }
      ],
      'en-US': [
        { id: 'alloy', name: 'Alloy', gender: 'Neutral' },
        { id: 'echo', name: 'Echo', gender: 'Male' },
        { id: 'fable', name: 'Fable', gender: 'British Male' },
        { id: 'onyx', name: 'Onyx', gender: 'Male' },
        { id: 'nova', name: 'Nova', gender: 'Female' },
        { id: 'shimmer', name: 'Shimmer', gender: 'Female' }
      ]
    },
    'elevenlabs': {
      'zh-CN': [
        { id: 'adam', name: 'Adam', gender: '男性' },
        { id: 'bella', name: 'Bella', gender: '女性' },
        { id: 'charlie', name: 'Charlie', gender: '男性' },
        { id: 'emily', name: 'Emily', gender: '女性' }
      ]
    }
  }

  return voiceMap[provider]?.[language] || []
}

const testVoice = async () => {
  if (!canTest.value) return

  isTesting.value = true
  try {
    const profile: VoiceProfile = {
      id: 'test',
      name: formData.name || 'Test',
      provider: formData.provider!,
      language: formData.language!,
      voice: formData.voice!,
      speed: formData.speed!,
      pitch: formData.pitch!,
      volume: formData.volume!,
      characterId: formData.characterId
    }

    const audio = await synthesizeText({
      text: testText.value,
      voiceProfile: profile
    })

    if (audio) {
      testAudio.value = audio
      ElMessage.success('语音测试生成成功')
    }
  } catch (err) {
    console.error('语音测试失败:', err)
    ElMessage.error('语音测试失败')
  } finally {
    isTesting.value = false
  }
}

const playTestAudio = () => {
  if (testAudio.value) {
    const audioElement = new Audio(testAudio.value.url)

    if (isPlaying.value) {
      audioElement.pause()
      isPlaying.value = false
    } else {
      audioElement.play()
      isPlaying.value = true

      audioElement.onended = () => {
        isPlaying.value = false
      }
    }
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    isSaving.value = true

    const profile: VoiceProfile = {
      id: props.profile?.id || '',
      name: formData.name!,
      provider: formData.provider!,
      language: formData.language!,
      voice: formData.voice!,
      speed: formData.speed!,
      pitch: formData.pitch!,
      volume: formData.volume!,
      characterId: formData.characterId
    }

    emit('save', profile)
  } catch (err) {
    console.error('验证失败:', err)
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

const loadCharacters = async () => {
  // 模拟加载角色列表
  characters.value = [
    {
      id: '1',
      name: '助手小爱',
      avatar: '/avatars/xiaoai.png'
    },
    {
      id: '2',
      name: '博士',
      avatar: '/avatars/doctor.png'
    }
  ]
}

// 工具函数
const formatSpeedTooltip = (value: number) => `${value}x`
const formatPitchTooltip = (value: number) => `${value}`
const formatVolumeTooltip = (value: number) => `${Math.round(value * 100)}%`

// 监听器
watch(() => props.profile, (profile) => {
  if (profile) {
    Object.assign(formData, profile)
    loadAvailableVoices()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  loadCharacters()

  if (!props.isEditing) {
    // 新建时设置默认值
    formData.name = ''
    formData.provider = 'openai'
    formData.language = 'zh-CN'
    formData.voice = ''
    formData.speed = 1.0
    formData.pitch = 1.0
    formData.volume = 0.8

    loadAvailableVoices()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.voice-profile-editor {
  .form-section {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-light);
      padding-bottom: 8px;
    }

    .parameter-control {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;

      .el-slider {
        flex: 1;
      }

      .parameter-value {
        min-width: 60px;
        text-align: right;
        font-family: monospace;
        color: var(--el-text-color-secondary);
      }
    }

    .test-result {
      margin-top: 16px;
      padding: 12px;
      background: var(--el-fill-color-extra-light);
      border-radius: 6px;
    }
  }

  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
  }
}

// 自定义选项样式
:deep(.voice-option) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .voice-name {
    color: var(--el-text-color-primary);
  }
}

:deep(.character-option) {
  display: flex;
  align-items: center;
  gap: 8px;

  .character-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }
}

// 响应式设计
@media (max-width: 600px) {
  .voice-profile-editor {
    .parameter-control {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;

      .parameter-value {
        text-align: center;
      }
    }

    .editor-actions {
      flex-direction: column-reverse;
    }
  }
}
</style>
