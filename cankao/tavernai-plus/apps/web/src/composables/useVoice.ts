import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '@/utils/axios'

export interface VoiceProfile {
  id: string
  name: string
  voice: string
  language: string
  provider: string
  pitch: number
  speed: number
  volume: number
  characterId?: string
}

export interface AudioRecording {
  id: string
  blob: Blob
  url: string
  duration: number
  timestamp: Date
}

export interface TTSRequest {
  text: string
  voiceProfile: VoiceProfile
  options?: {
    ssml?: boolean
    emotion?: string
    style?: string
  }
}

export interface STTResult {
  text: string
  confidence: number
  language: string
  duration: number
}

// 语音状态类型
export type VoiceState = 'idle' | 'recording' | 'processing' | 'playing' | 'error'

// 音频格式支持
export const SUPPORTED_AUDIO_FORMATS = ['webm', 'mp4', 'wav', 'ogg'] as const
export type AudioFormat = typeof SUPPORTED_AUDIO_FORMATS[number]

// 语音提供商
export const VOICE_PROVIDERS = ['openai', 'elevenlabs', 'azure', 'google'] as const
export type VoiceProvider = typeof VOICE_PROVIDERS[number]

// 语言支持
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'zh-TW', name: '中文（繁体）' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'es-ES', name: 'Español' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Português (BR)' },
  { code: 'ru-RU', name: 'Русский' }
] as const

/**
 * 语音功能核心 composable
 */
export function useVoice() {
  // 状态管理
  const state = ref<VoiceState>('idle')
  const isSupported = ref(false)
  const error = ref<string | null>(null)

  // 录音相关
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const audioStream = ref<MediaStream | null>(null)
  const recordingDuration = ref(0)
  const recordingTimer = ref<number | null>(null)
  const audioChunks = ref<Blob[]>([])

  // 播放相关
  const audioPlayer = ref<HTMLAudioElement | null>(null)
  const currentAudio = ref<AudioRecording | null>(null)
  const playbackProgress = ref(0)
  const playbackDuration = ref(0)
  const isPlaying = ref(false)
  const volume = ref(0.8)
  const playbackSpeed = ref(1.0)

  // 音频分析
  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)
  const frequencyData = ref<Uint8Array | null>(null)

  // 缓存管理
  const audioCache = reactive<Map<string, string>>(new Map())
  const voiceProfiles = ref<VoiceProfile[]>([])
  const currentVoiceProfile = ref<VoiceProfile | null>(null)

  // 计算属性
  const canRecord = computed(() =>
    isSupported.value && state.value === 'idle' && !isRecordingActive.value
  )

  const canPlay = computed(() =>
    currentAudio.value && state.value !== 'recording'
  )

  const isRecordingActive = computed(() =>
    state.value === 'recording'
  )

  const isProcessing = computed(() =>
    state.value === 'processing'
  )

  const hasError = computed(() =>
    state.value === 'error' && error.value
  )

  const recordingDurationText = computed(() => {
    const minutes = Math.floor(recordingDuration.value / 60)
    const seconds = recordingDuration.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // 错误处理
  const setError = (message: string) => {
    error.value = message
    state.value = 'error'
    ElMessage.error(message)
  }

  const clearError = () => {
    error.value = null
    if (state.value === 'error') {
      state.value = 'idle'
    }
  }

  // 浏览器支持检查
  const checkBrowserSupport = () => {
    try {
      isSupported.value = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.MediaRecorder &&
        window.AudioContext
      )

      if (!isSupported.value) {
        setError('浏览器不支持语音功能')
        return false
      }

      return true
    } catch (err) {
      setError('检查浏览器支持时出错')
      return false
    }
  }

  // 获取音频格式支持
  const getSupportedAudioFormat = (): AudioFormat => {
    const formats: AudioFormat[] = ['webm', 'mp4', 'wav', 'ogg']

    for (const format of formats) {
      const mimeType = `audio/${format}`
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return format
      }
    }

    return 'webm' // 默认格式
  }

  // 初始化音频上下文
  const initAudioContext = async () => {
    try {
      if (!audioContext.value) {
        audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (audioContext.value.state === 'suspended') {
        await audioContext.value.resume()
      }

      // 创建分析器
      if (!analyser.value) {
        analyser.value = audioContext.value.createAnalyser()
        analyser.value.fftSize = 256
        frequencyData.value = new Uint8Array(analyser.value.frequencyBinCount)
      }

      return true
    } catch (err) {
      console.error('初始化音频上下文失败:', err)
      setError('音频系统初始化失败')
      return false
    }
  }

  // 录音功能
  const startRecording = async () => {
    if (!checkBrowserSupport()) return false

    try {
      clearError()
      state.value = 'recording'
      recordingDuration.value = 0
      audioChunks.value = []

      // 获取麦克风权限
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      }

      audioStream.value = await navigator.mediaDevices.getUserMedia(constraints)

      // 初始化音频上下文
      await initAudioContext()

      // 创建录音器
      const format = getSupportedAudioFormat()
      const options: MediaRecorderOptions = {
        mimeType: `audio/${format}`,
        audioBitsPerSecond: 128000
      }

      mediaRecorder.value = new MediaRecorder(audioStream.value, options)

      // 设置事件监听
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        if (audioChunks.value.length > 0) {
          const audioBlob = new Blob(audioChunks.value, { type: `audio/${format}` })
          const audioUrl = URL.createObjectURL(audioBlob)

          currentAudio.value = {
            id: Date.now().toString(),
            blob: audioBlob,
            url: audioUrl,
            duration: recordingDuration.value,
            timestamp: new Date()
          }
        }

        // 清理资源
        if (audioStream.value) {
          audioStream.value.getTracks().forEach(track => track.stop())
          audioStream.value = null
        }

        state.value = 'idle'
      }

      mediaRecorder.value.onerror = (event) => {
        console.error('录音错误:', event)
        setError('录音过程中出现错误')
        stopRecording()
      }

      // 开始录音
      mediaRecorder.value.start(1000) // 每秒收集一次数据

      // 启动计时器
      recordingTimer.value = window.setInterval(() => {
        recordingDuration.value++

        // 最大录音时长限制（5分钟）
        if (recordingDuration.value >= 300) {
          stopRecording()
          ElMessage.warning('已达到最大录音时长（5分钟）')
        }
      }, 1000)

      return true
    } catch (err) {
      console.error('开始录音失败:', err)
      setError('无法访问麦克风，请检查权限设置')
      state.value = 'idle'
      return false
    }
  }

  const stopRecording = () => {
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }

    if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
      mediaRecorder.value.stop()
    }

    if (audioStream.value) {
      audioStream.value.getTracks().forEach(track => track.stop())
      audioStream.value = null
    }
  }

  // 音频播放功能
  const playAudio = (audio?: AudioRecording) => {
    try {
      const audioToPlay = audio || currentAudio.value
      if (!audioToPlay) return false

      // 停止当前播放
      stopAudio()

      // 创建新的音频元素
      audioPlayer.value = new Audio(audioToPlay.url)
      audioPlayer.value.volume = volume.value
      audioPlayer.value.playbackRate = playbackSpeed.value

      // 设置事件监听
      audioPlayer.value.onloadedmetadata = () => {
        if (audioPlayer.value) {
          playbackDuration.value = audioPlayer.value.duration || 0
        }
      }

      audioPlayer.value.ontimeupdate = () => {
        if (audioPlayer.value) {
          playbackProgress.value = audioPlayer.value.currentTime
        }
      }

      audioPlayer.value.onended = () => {
        isPlaying.value = false
        playbackProgress.value = 0
        state.value = 'idle'
      }

      audioPlayer.value.onerror = () => {
        setError('音频播放失败')
        isPlaying.value = false
        state.value = 'idle'
      }

      // 开始播放
      audioPlayer.value.play()
      isPlaying.value = true
      state.value = 'playing'

      return true
    } catch (err) {
      console.error('播放音频失败:', err)
      setError('音频播放失败')
      return false
    }
  }

  const pauseAudio = () => {
    if (audioPlayer.value && isPlaying.value) {
      audioPlayer.value.pause()
      isPlaying.value = false
      state.value = 'idle'
    }
  }

  const resumeAudio = () => {
    if (audioPlayer.value && !isPlaying.value) {
      audioPlayer.value.play()
      isPlaying.value = true
      state.value = 'playing'
    }
  }

  const stopAudio = () => {
    if (audioPlayer.value) {
      audioPlayer.value.pause()
      audioPlayer.value.currentTime = 0
      audioPlayer.value = null
    }

    isPlaying.value = false
    playbackProgress.value = 0

    if (state.value === 'playing') {
      state.value = 'idle'
    }
  }

  const seekAudio = (time: number) => {
    if (audioPlayer.value) {
      audioPlayer.value.currentTime = Math.max(0, Math.min(time, playbackDuration.value))
      playbackProgress.value = audioPlayer.value.currentTime
    }
  }

  const setVolume = (newVolume: number) => {
    volume.value = Math.max(0, Math.min(1, newVolume))
    if (audioPlayer.value) {
      audioPlayer.value.volume = volume.value
    }
  }

  const setPlaybackSpeed = (speed: number) => {
    playbackSpeed.value = Math.max(0.25, Math.min(4, speed))
    if (audioPlayer.value) {
      audioPlayer.value.playbackRate = playbackSpeed.value
    }
  }

  // 语音识别 (STT)
  const transcribeAudio = async (audio?: AudioRecording): Promise<STTResult | null> => {
    try {
      const audioToTranscribe = audio || currentAudio.value
      if (!audioToTranscribe) {
        setError('没有可转录的音频')
        return null
      }

      state.value = 'processing'
      clearError()

      const formData = new FormData()
      formData.append('audio', audioToTranscribe.blob, `audio_${audioToTranscribe.id}.webm`)
      formData.append('language', 'auto') // 自动检测语言

      const response = await http.post('/multimodal/voice/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const result: STTResult = {
        text: response.text,
        confidence: response.confidence || 0.95,
        language: response.language || 'zh-CN',
        duration: audioToTranscribe.duration
      }

      state.value = 'idle'
      return result
    } catch (err) {
      console.error('语音转文字失败:', err)
      setError('语音转文字失败')
      return null
    }
  }

  // 语音合成 (TTS)
  const synthesizeText = async (request: TTSRequest): Promise<AudioRecording | null> => {
    try {
      state.value = 'processing'
      clearError()

      // 检查缓存
      const cacheKey = `${request.text}_${request.voiceProfile.id}_${JSON.stringify(request.options || {})}`
      const cachedUrl = audioCache.get(cacheKey)

      if (cachedUrl) {
        // 从缓存返回
        const response = await fetch(cachedUrl)
        const blob = await response.blob()

        const audio: AudioRecording = {
          id: Date.now().toString(),
          blob,
          url: cachedUrl,
          duration: 0, // 实际播放时会更新
          timestamp: new Date()
        }

        state.value = 'idle'
        return audio
      }

      // 调用 API
      const response = await http.post('/multimodal/voice/synthesize', {
        text: request.text,
        voice: request.voiceProfile.voice,
        language: request.voiceProfile.language,
        provider: request.voiceProfile.provider,
        pitch: request.voiceProfile.pitch,
        speed: request.voiceProfile.speed,
        volume: request.voiceProfile.volume,
        options: request.options
      })

      // 处理响应
      let audioBlob: Blob
      let audioUrl: string

      if (response.audioUrl) {
        // 如果返回 URL，下载音频
        const audioResponse = await fetch(response.audioUrl)
        audioBlob = await audioResponse.blob()
        audioUrl = URL.createObjectURL(audioBlob)
      } else if (response.audioData) {
        // 如果返回 base64 数据
        const binaryString = atob(response.audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        audioBlob = new Blob([bytes], { type: 'audio/mp3' })
        audioUrl = URL.createObjectURL(audioBlob)
      } else {
        throw new Error('无效的音频响应格式')
      }

      // 缓存音频
      audioCache.set(cacheKey, audioUrl)

      const audio: AudioRecording = {
        id: response.id || Date.now().toString(),
        blob: audioBlob,
        url: audioUrl,
        duration: response.duration || 0,
        timestamp: new Date()
      }

      state.value = 'idle'
      return audio
    } catch (err) {
      console.error('语音合成失败:', err)
      setError('语音合成失败')
      return null
    }
  }

  // 语音配置管理
  const loadVoiceProfiles = async () => {
    try {
      const response = await http.get('/multimodal/voice/profiles')
      voiceProfiles.value = response.profiles || []

      // 设置默认语音配置
      if (!currentVoiceProfile.value && voiceProfiles.value.length > 0) {
        currentVoiceProfile.value = voiceProfiles.value[0]
      }
    } catch (err) {
      console.error('加载语音配置失败:', err)
      // 使用默认配置
      voiceProfiles.value = [{
        id: 'default',
        name: '默认语音',
        voice: 'alloy',
        language: 'zh-CN',
        provider: 'openai',
        pitch: 1.0,
        speed: 1.0,
        volume: 0.8
      }]
      currentVoiceProfile.value = voiceProfiles.value[0]
    }
  }

  const createVoiceProfile = async (profile: Omit<VoiceProfile, 'id'>): Promise<VoiceProfile | null> => {
    try {
      const response = await http.post('/multimodal/voice/profiles', profile)
      const newProfile: VoiceProfile = {
        id: response.id,
        ...profile
      }

      voiceProfiles.value.push(newProfile)
      return newProfile
    } catch (err) {
      console.error('创建语音配置失败:', err)
      setError('创建语音配置失败')
      return null
    }
  }

  const updateVoiceProfile = async (profile: VoiceProfile): Promise<boolean> => {
    try {
      await http.put(`/multimodal/voice/profiles/${profile.id}`, profile)

      const index = voiceProfiles.value.findIndex(p => p.id === profile.id)
      if (index !== -1) {
        voiceProfiles.value[index] = profile
      }

      return true
    } catch (err) {
      console.error('更新语音配置失败:', err)
      setError('更新语音配置失败')
      return false
    }
  }

  const deleteVoiceProfile = async (profileId: string): Promise<boolean> => {
    try {
      await http.delete(`/multimodal/voice/profiles/${profileId}`)

      voiceProfiles.value = voiceProfiles.value.filter(p => p.id !== profileId)

      if (currentVoiceProfile.value?.id === profileId) {
        currentVoiceProfile.value = voiceProfiles.value[0] || null
      }

      return true
    } catch (err) {
      console.error('删除语音配置失败:', err)
      setError('删除语音配置失败')
      return false
    }
  }

  // 音频分析
  const getFrequencyData = (): Uint8Array | null => {
    if (analyser.value && frequencyData.value) {
      analyser.value.getByteFrequencyData(frequencyData.value)
      return frequencyData.value
    }
    return null
  }

  const getAudioLevel = (): number => {
    const data = getFrequencyData()
    if (!data) return 0

    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i]
    }
    return sum / data.length / 255 // 归一化到 0-1
  }

  // 资源清理
  const cleanup = () => {
    stopRecording()
    stopAudio()

    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }

    // 清理缓存的 URL
    audioCache.forEach(url => {
      URL.revokeObjectURL(url)
    })
    audioCache.clear()

    if (currentAudio.value?.url) {
      URL.revokeObjectURL(currentAudio.value.url)
    }
  }

  // 生命周期
  onMounted(() => {
    checkBrowserSupport()
    loadVoiceProfiles()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    state,
    isSupported,
    error,
    hasError,

    // 录音相关
    canRecord,
    isRecordingActive,
    recordingDuration,
    recordingDurationText,
    currentAudio,

    // 播放相关
    canPlay,
    isPlaying,
    playbackProgress,
    playbackDuration,
    volume,
    playbackSpeed,

    // 处理状态
    isProcessing,

    // 语音配置
    voiceProfiles,
    currentVoiceProfile,

    // 音频分析
    getFrequencyData,
    getAudioLevel,

    // 方法
    startRecording,
    stopRecording,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    seekAudio,
    setVolume,
    setPlaybackSpeed,
    transcribeAudio,
    synthesizeText,
    loadVoiceProfiles,
    createVoiceProfile,
    updateVoiceProfile,
    deleteVoiceProfile,
    clearError
  }
}

/**
 * 快速录音功能
 */
export function useQuickRecord() {
  const voice = useVoice()
  const isRecording = ref(false)

  const toggleRecording = async () => {
    if (isRecording.value) {
      voice.stopRecording()
      isRecording.value = false
    } else {
      const success = await voice.startRecording()
      if (success) {
        isRecording.value = true
      }
    }
  }

  // 监听录音状态变化
  const stopWatcher = computed(() => {
    if (voice.state.value !== 'recording' && isRecording.value) {
      isRecording.value = false
    }
  })

  return {
    isRecording,
    toggleRecording,
    ...voice
  }
}

/**
 * 快速TTS功能
 */
export function useQuickTTS() {
  const voice = useVoice()

  const speakText = async (text: string, voiceId?: string) => {
    if (!text.trim()) return null

    let profile = voice.currentVoiceProfile.value
    if (voiceId) {
      profile = voice.voiceProfiles.value.find(p => p.id === voiceId) || profile
    }

    if (!profile) {
      ElMessage.error('没有可用的语音配置')
      return null
    }

    const audio = await voice.synthesizeText({
      text,
      voiceProfile: profile
    })

    if (audio) {
      voice.playAudio(audio)
    }

    return audio
  }

  return {
    speakText,
    ...voice
  }
}
