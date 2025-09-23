import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'

// Types
export interface VoiceInputOptions {
  // 语音识别设置
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxDuration?: number // 最大录制时长（秒）

  // 自动处理
  autoStart?: boolean
  autoStop?: boolean
  autoTranscribe?: boolean

  // 质量设置
  audioFormat?: string
  sampleRate?: number
  channelCount?: number

  // 错误处理
  enableFallback?: boolean
  retryAttempts?: number
}

export interface VoiceInputResult {
  transcript: string
  confidence: number
  audioBlob?: Blob
  duration: number
  isFinal: boolean
}

export interface UseVoiceInputReturn {
  // 状态
  isSupported: Ref<boolean>
  isRecording: Ref<boolean>
  isTranscribing: Ref<boolean>
  isPaused: Ref<boolean>
  isProcessing: Ref<boolean>

  // 数据
  transcript: Ref<string>
  interimTranscript: Ref<string>
  confidence: Ref<number>
  duration: Ref<number>
  audioLevel: Ref<number>
  error: Ref<string | null>

  // 权限状态
  permissionState: Ref<'granted' | 'denied' | 'prompt' | 'unknown'>

  // 方法
  startRecording: () => Promise<void>
  stopRecording: () => Promise<VoiceInputResult | null>
  pauseRecording: () => void
  resumeRecording: () => void
  cancelRecording: () => void
  requestPermission: () => Promise<boolean>

  // 配置
  updateOptions: (options: Partial<VoiceInputOptions>) => void

  // 事件回调
  onTranscriptUpdate: (callback: (transcript: string, isFinal: boolean) => void) => void
  onRecordingStart: (callback: () => void) => void
  onRecordingStop: (callback: (result: VoiceInputResult) => void) => void
  onError: (callback: (error: string) => void) => void
}

/**
 * 语音输入 Composable
 *
 * 提供完整的语音识别和录制功能，包括：
 * - Web Speech API 语音识别
 * - MediaRecorder 音频录制
 * - 实时转录和音频级别监控
 * - 权限管理和错误处理
 * - 多语言支持
 */
export function useVoiceInput(initialOptions: VoiceInputOptions = {}): UseVoiceInputReturn {
  // === 配置选项 ===
  const options = ref<VoiceInputOptions>({
    language: 'zh-CN',
    continuous: true,
    interimResults: true,
    maxDuration: 300, // 5分钟
    autoStart: false,
    autoStop: false,
    autoTranscribe: true,
    audioFormat: 'audio/webm',
    sampleRate: 44100,
    channelCount: 1,
    enableFallback: true,
    retryAttempts: 3,
    ...initialOptions
  })

  // === 状态管理 ===
  const isSupported = ref(false)
  const isRecording = ref(false)
  const isTranscribing = ref(false)
  const isPaused = ref(false)
  const isProcessing = ref(false)

  const transcript = ref('')
  const interimTranscript = ref('')
  const confidence = ref(0)
  const duration = ref(0)
  const audioLevel = ref(0)
  const error = ref<string | null>(null)
  const permissionState = ref<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')

  // === 内部状态 ===
  let recognition: SpeechRecognition | null = null
  let mediaRecorder: MediaRecorder | null = null
  let audioStream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let durationTimer: number | null = null
  let audioLevelTimer: number | null = null
  let audioChunks: Blob[] = []
  let retryCount = 0

  // 事件回调
  const callbacks = {
    onTranscriptUpdate: [] as Array<(transcript: string, isFinal: boolean) => void>,
    onRecordingStart: [] as Array<() => void>,
    onRecordingStop: [] as Array<(result: VoiceInputResult) => void>,
    onError: [] as Array<(error: string) => void>
  }

  // === 初始化检查 ===
  const checkSupport = () => {
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    const hasMediaRecorder = 'MediaRecorder' in window
    const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia

    isSupported.value = hasSpeechRecognition && hasMediaRecorder && hasGetUserMedia

    if (!isSupported.value) {
      console.warn('语音输入功能不受支持')
    }

    return isSupported.value
  }

  // === 权限管理 ===
  const requestPermission = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      permissionState.value = 'granted'
      return true
    } catch (err) {
      permissionState.value = 'denied'
      error.value = '麦克风权限被拒绝'
      return false
    }
  }

  const checkPermission = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      permissionState.value = permissionStatus.state as any

      permissionStatus.addEventListener('change', () => {
        permissionState.value = permissionStatus.state as any
      })
    } catch (err) {
      // 某些浏览器不支持权限查询API
      permissionState.value = 'unknown'
    }
  }

  // === 语音识别 ===
  const initializeSpeechRecognition = () => {
    if (!isSupported.value) return false

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition = new SpeechRecognition()

      recognition.continuous = options.value.continuous!
      recognition.interimResults = options.value.interimResults!
      recognition.lang = options.value.language!

      recognition.onstart = () => {
        isTranscribing.value = true
        error.value = null
        console.log('语音识别已开始')
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcriptText = result[0].transcript

          if (result.isFinal) {
            finalTranscript += transcriptText
            confidence.value = result[0].confidence || 0
          } else {
            interimTranscript += transcriptText
          }
        }

        if (finalTranscript) {
          transcript.value += finalTranscript
          callbacks.onTranscriptUpdate.forEach(cb => cb(transcript.value, true))
        }

        if (interimTranscript) {
          interimTranscript.value = interimTranscript
          callbacks.onTranscriptUpdate.forEach(cb => cb(interimTranscript, false))
        }
      }

      recognition.onerror = (event) => {
        const errorMessage = getRecognitionErrorMessage(event.error)
        error.value = errorMessage
        isTranscribing.value = false

        console.error('语音识别错误:', event.error)
        callbacks.onError.forEach(cb => cb(errorMessage))

        // 重试机制
        if (options.value.enableFallback && retryCount < options.value.retryAttempts!) {
          retryCount++
          console.log(`正在重试语音识别... (${retryCount}/${options.value.retryAttempts})`)
          setTimeout(() => {
            if (isRecording.value) {
              recognition?.start()
            }
          }, 1000)
        }
      }

      recognition.onend = () => {
        isTranscribing.value = false
        console.log('语音识别已结束')

        // 如果仍在录制且启用了连续识别，重新开始
        if (isRecording.value && options.value.continuous && !isPaused.value) {
          try {
            recognition?.start()
          } catch (err) {
            console.warn('重新开始语音识别失败:', err)
          }
        }
      }

      return true
    } catch (err) {
      console.error('初始化语音识别失败:', err)
      error.value = '语音识别初始化失败'
      return false
    }
  }

  // === 音频录制 ===
  const initializeMediaRecorder = async () => {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: options.value.sampleRate,
          channelCount: options.value.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: options.value.audioFormat
      })

      audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        console.log('音频录制已停止')
      }

      mediaRecorder.onerror = (event) => {
        console.error('音频录制错误:', event)
        error.value = '音频录制失败'
        callbacks.onError.forEach(cb => cb('音频录制失败'))
      }

      // 初始化音频分析器
      initializeAudioAnalyser()

      return true
    } catch (err: any) {
      console.error('初始化媒体录制器失败:', err)
      error.value = err.message || '无法访问麦克风'
      callbacks.onError.forEach(cb => cb(error.value!))
      return false
    }
  }

  // === 音频级别分析 ===
  const initializeAudioAnalyser = () => {
    if (!audioStream) return

    try {
      audioContext = new AudioContext()
      analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(audioStream)

      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      startAudioLevelMonitoring()
    } catch (err) {
      console.warn('音频分析器初始化失败:', err)
    }
  }

  const startAudioLevelMonitoring = () => {
    if (!analyser) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateAudioLevel = () => {
      if (!analyser || !isRecording.value) return

      analyser.getByteFrequencyData(dataArray)

      // 计算音频平均强度
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const average = sum / dataArray.length
      audioLevel.value = Math.round((average / 255) * 100)

      audioLevelTimer = requestAnimationFrame(updateAudioLevel)
    }

    updateAudioLevel()
  }

  // === 主要方法 ===

  /**
   * 开始录制
   */
  const startRecording = async (): Promise<void> => {
    if (!isSupported.value) {
      throw new Error('浏览器不支持语音输入功能')
    }

    if (isRecording.value) {
      console.warn('已经在录制中')
      return
    }

    try {
      error.value = null
      retryCount = 0

      // 请求权限
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        throw new Error('需要麦克风权限才能使用语音输入')
      }

      // 初始化媒体录制器
      const mediaInitialized = await initializeMediaRecorder()
      if (!mediaInitialized) {
        throw new Error('媒体录制器初始化失败')
      }

      // 初始化语音识别
      if (options.value.autoTranscribe) {
        const speechInitialized = initializeSpeechRecognition()
        if (!speechInitialized) {
          console.warn('语音识别初始化失败，将只进行音频录制')
        }
      }

      // 开始录制
      isRecording.value = true
      isPaused.value = false
      transcript.value = ''
      interimTranscript.value = ''
      duration.value = 0

      // 开始媒体录制
      mediaRecorder?.start(100) // 每100ms收集一次数据

      // 开始语音识别
      if (options.value.autoTranscribe && recognition) {
        recognition.start()
      }

      // 开始计时
      startDurationTimer()

      // 触发回调
      callbacks.onRecordingStart.forEach(cb => cb())

      console.log('录制已开始')

    } catch (err: any) {
      error.value = err.message
      isRecording.value = false
      cleanup()
      callbacks.onError.forEach(cb => cb(err.message))
      throw err
    }
  }

  /**
   * 停止录制
   */
  const stopRecording = async (): Promise<VoiceInputResult | null> => {
    if (!isRecording.value) {
      console.warn('当前没有在录制')
      return null
    }

    try {
      isRecording.value = false
      isPaused.value = false

      // 停止语音识别
      if (recognition) {
        recognition.stop()
      }

      // 停止媒体录制
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }

      // 停止计时器
      stopTimers()

      // 创建音频Blob
      const audioBlob = audioChunks.length > 0
        ? new Blob(audioChunks, { type: options.value.audioFormat })
        : undefined

      // 创建结果对象
      const result: VoiceInputResult = {
        transcript: transcript.value,
        confidence: confidence.value,
        audioBlob,
        duration: duration.value,
        isFinal: true
      }

      // 清理资源
      cleanup()

      // 触发回调
      callbacks.onRecordingStop.forEach(cb => cb(result))

      console.log('录制已停止:', result)
      return result

    } catch (err: any) {
      error.value = err.message
      callbacks.onError.forEach(cb => cb(err.message))
      cleanup()
      return null
    }
  }

  /**
   * 暂停录制
   */
  const pauseRecording = () => {
    if (!isRecording.value || isPaused.value) return

    isPaused.value = true

    // 暂停语音识别
    if (recognition) {
      recognition.stop()
    }

    // 暂停媒体录制
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause()
    }

    console.log('录制已暂停')
  }

  /**
   * 恢复录制
   */
  const resumeRecording = () => {
    if (!isRecording.value || !isPaused.value) return

    isPaused.value = false

    // 恢复语音识别
    if (recognition && options.value.autoTranscribe) {
      try {
        recognition.start()
      } catch (err) {
        console.warn('恢复语音识别失败:', err)
      }
    }

    // 恢复媒体录制
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
    }

    console.log('录制已恢复')
  }

  /**
   * 取消录制
   */
  const cancelRecording = () => {
    if (!isRecording.value) return

    isRecording.value = false
    isPaused.value = false

    // 清空转录内容
    transcript.value = ''
    interimTranscript.value = ''

    // 停止所有活动
    if (recognition) {
      recognition.stop()
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }

    // 清理资源
    cleanup()

    console.log('录制已取消')
  }

  /**
   * 更新配置选项
   */
  const updateOptions = (newOptions: Partial<VoiceInputOptions>) => {
    Object.assign(options.value, newOptions)

    // 如果正在录制，应用新的语言设置
    if (recognition && options.value.language) {
      recognition.lang = options.value.language
    }
  }

  // === 辅助方法 ===

  const startDurationTimer = () => {
    durationTimer = window.setInterval(() => {
      duration.value++

      // 检查最大时长
      if (duration.value >= options.value.maxDuration!) {
        console.log('达到最大录制时长，自动停止')
        stopRecording()
      }
    }, 1000)
  }

  const stopTimers = () => {
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }

    if (audioLevelTimer) {
      cancelAnimationFrame(audioLevelTimer)
      audioLevelTimer = null
    }
  }

  const cleanup = () => {
    // 停止计时器
    stopTimers()

    // 清理音频流
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      audioStream = null
    }

    // 清理音频上下文
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close()
      audioContext = null
      analyser = null
    }

    // 重置状态
    isTranscribing.value = false
    isProcessing.value = false
    audioLevel.value = 0
  }

  const getRecognitionErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'no-speech': '没有检测到语音',
      'aborted': '语音识别被中断',
      'audio-capture': '音频捕获失败',
      'network': '网络错误',
      'not-allowed': '麦克风权限被拒绝',
      'service-not-allowed': '语音识别服务不可用',
      'bad-grammar': '语法错误',
      'language-not-supported': '不支持的语言'
    }

    return errorMessages[errorCode] || `语音识别错误: ${errorCode}`
  }

  // === 事件回调注册 ===

  const onTranscriptUpdate = (callback: (transcript: string, isFinal: boolean) => void) => {
    callbacks.onTranscriptUpdate.push(callback)
  }

  const onRecordingStart = (callback: () => void) => {
    callbacks.onRecordingStart.push(callback)
  }

  const onRecordingStop = (callback: (result: VoiceInputResult) => void) => {
    callbacks.onRecordingStop.push(callback)
  }

  const onError = (callback: (error: string) => void) => {
    callbacks.onError.push(callback)
  }

  // === 计算属性 ===

  const canRecord = computed(() => {
    return isSupported.value && permissionState.value === 'granted' && !isRecording.value
  })

  const recordingState = computed(() => {
    if (!isRecording.value) return 'idle'
    if (isPaused.value) return 'paused'
    return 'recording'
  })

  // === 初始化 ===

  // 检查支持性
  checkSupport()

  // 检查权限状态
  if (isSupported.value) {
    checkPermission()
  }

  // === 生命周期 ===

  onUnmounted(() => {
    cancelRecording()
    cleanup()
  })

  return {
    // 状态
    isSupported,
    isRecording,
    isTranscribing,
    isPaused,
    isProcessing,

    // 数据
    transcript,
    interimTranscript,
    confidence,
    duration,
    audioLevel,
    error,

    // 权限状态
    permissionState,

    // 方法
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    requestPermission,

    // 配置
    updateOptions,

    // 事件回调
    onTranscriptUpdate,
    onRecordingStart,
    onRecordingStop,
    onError
  }
}

/**
 * 简化版语音输入钩子
 * 适用于只需要基本语音转文字功能的场景
 */
export function useSimpleVoiceInput(options: VoiceInputOptions = {}) {
  const {
    isSupported,
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    requestPermission
  } = useVoiceInput(options)

  const toggleRecording = async () => {
    if (isRecording.value) {
      return await stopRecording()
    } else {
      await startRecording()
      return null
    }
  }

  return {
    isSupported,
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    requestPermission
  }
}

export default useVoiceInput