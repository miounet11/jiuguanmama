// 图像相关类型定义

// 基础图像接口
export interface BaseImage {
  id: string
  url: string
  thumbnail?: string
  width: number
  height: number
  format: string
  size: number
  createdAt: Date
  updatedAt?: Date
}

// 生成的图像
export interface GeneratedImage extends BaseImage {
  prompt: string
  negativePrompt?: string
  model: string
  seed?: number
  settings: ImageGenerationSettings
  type: 'generated'
  rating?: number
  tags?: string[]
  isPublic?: boolean
  userId: string
}

// 上传的图像
export interface UploadedImage extends BaseImage {
  name: string
  originalName: string
  type: 'uploaded'
  userId: string
  analysis?: ImageAnalysis
  tags?: string[]
}

// 编辑后的图像
export interface EditedImage extends BaseImage {
  originalImageId: string
  editHistory: EditOperation[]
  type: 'edited'
  userId: string
}

// 图像生成设置
export interface ImageGenerationSettings {
  model: string
  style?: string
  quality: 'standard' | 'high' | 'ultra'
  size: string
  count: number
  guidance?: number
  steps?: number
  seed?: string
  scheduler?: string
  [key: string]: any
}

// 图像分析结果
export interface ImageAnalysis {
  description: string
  objects?: ObjectDetection[]
  faces?: FaceDetection[]
  text?: TextDetection[]
  colors?: ColorAnalysis
  composition?: CompositionAnalysis
  style?: StyleAnalysis
  quality?: QualityAnalysis
  emotions?: EmotionDetection[]
  metadata?: ImageMetadata
}

// 物体检测
export interface ObjectDetection {
  name: string
  confidence: number
  boundingBox?: BoundingBox
  category?: string
}

// 人脸检测
export interface FaceDetection {
  confidence: number
  boundingBox: BoundingBox
  landmarks?: FaceLandmark[]
  age?: number
  gender?: string
  emotion?: string
}

// 文字检测
export interface TextDetection {
  text: string
  confidence: number
  boundingBox: BoundingBox
  language?: string
}

// 边界框
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// 人脸关键点
export interface FaceLandmark {
  type: string
  x: number
  y: number
}

// 色彩分析
export interface ColorAnalysis {
  dominantColors: DominantColor[]
  brightness: number
  saturation: number
  contrast: number
  temperature: 'warm' | 'cool' | 'neutral'
  palette: string[]
}

// 主色调
export interface DominantColor {
  color: string
  hex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  percentage: number
}

// 构图分析
export interface CompositionAnalysis {
  type: string
  balance: number
  symmetry: number
  leadingLines: boolean
  ruleOfThirds: boolean
  focusPoint?: Point
  depth: number
}

// 坐标点
export interface Point {
  x: number
  y: number
}

// 风格分析
export interface StyleAnalysis {
  primaryStyle: string
  styleConfidence: number
  artisticMovement?: string
  technique?: string
  tags: StyleTag[]
  description: string
}

// 风格标签
export interface StyleTag {
  name: string
  confidence: number
}

// 质量分析
export interface QualityAnalysis {
  overall: number
  sharpness: number
  noise: number
  exposure: number
  contrast: number
  saturation: number
  resolution: number
  artifacts: QualityIssue[]
}

// 质量问题
export interface QualityIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  suggestion?: string
}

// 情感检测
export interface EmotionDetection {
  emotion: string
  confidence: number
  valence?: number // 正负情感值
  arousal?: number // 激活程度
}

// 图像元数据
export interface ImageMetadata {
  camera?: CameraInfo
  location?: LocationInfo
  software?: string
  copyright?: string
  exif?: { [key: string]: any }
}

// 相机信息
export interface CameraInfo {
  make?: string
  model?: string
  lens?: string
  focalLength?: number
  aperture?: number
  shutterSpeed?: string
  iso?: number
  flash?: boolean
}

// 位置信息
export interface LocationInfo {
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  country?: string
}

// 编辑操作
export interface EditOperation {
  id: string
  type: EditOperationType
  parameters: { [key: string]: any }
  timestamp: Date
  description: string
}

// 编辑操作类型
export type EditOperationType =
  | 'resize'
  | 'crop'
  | 'rotate'
  | 'flip'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'hue'
  | 'filter'
  | 'denoise'
  | 'sharpen'
  | 'blur'
  | 'style-transfer'
  | 'enhancement'
  | 'restoration'

// 提示词模板
export interface PromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  negativePrompt?: string
  category: string
  tags: string[]
  style?: string
  settings?: Partial<ImageGenerationSettings>
  preview?: string
  isPublic: boolean
  userId: string
  usageCount: number
  rating: number
  createdAt: Date
}

// 提示词历史
export interface PromptHistory {
  id: string
  prompt: string
  negativePrompt?: string
  settings: ImageGenerationSettings
  result?: GeneratedImage
  rating?: number
  userId: string
  createdAt: Date
}

// 图像收藏
export interface ImageFavorite {
  id: string
  imageId: string
  image: BaseImage
  userId: string
  tags?: string[]
  notes?: string
  createdAt: Date
}

// 图像分享
export interface ImageShare {
  id: string
  imageId: string
  image: BaseImage
  shareToken: string
  isPublic: boolean
  allowDownload: boolean
  expiresAt?: Date
  viewCount: number
  userId: string
  createdAt: Date
}

// 图像集合/画廊
export interface ImageCollection {
  id: string
  name: string
  description?: string
  images: BaseImage[]
  isPublic: boolean
  tags?: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

// 角色头像相关
export interface CharacterAvatar extends GeneratedImage {
  characterId: string
  isActive: boolean
  version: number
}

// 角色特征提取
export interface CharacterTrait {
  name: string
  type: 'appearance' | 'personality' | 'background' | 'style'
  confidence: number
  description?: string
}

// 场景上下文
export interface SceneContext {
  currentScene: string
  characters: string[]
  environment: string
  mood: string
  timeOfDay?: string
  weather?: string
  location?: string
  objects?: string[]
}

// 表情包
export interface EmojiSticker {
  id: string
  url: string
  emotion: string
  text?: string
  characterId?: string
  style: string
  tags: string[]
  isPublic: boolean
  userId: string
  createdAt: Date
}

// API响应类型
export interface ImageGenerationResponse {
  success: boolean
  jobId?: string
  images?: GeneratedImage[]
  error?: string
  message?: string
}

export interface ImageAnalysisResponse {
  success: boolean
  analysis?: ImageAnalysis
  error?: string
  message?: string
}

export interface ImageUploadResponse {
  success: boolean
  image?: UploadedImage
  error?: string
  message?: string
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// 图像搜索过滤器
export interface ImageSearchFilters {
  query?: string
  type?: ('generated' | 'uploaded' | 'edited')[]
  style?: string[]
  tags?: string[]
  userId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  sizeRange?: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  }
  qualityRange?: {
    min: number
    max: number
  }
  isPublic?: boolean
  sortBy?: 'createdAt' | 'rating' | 'size' | 'name'
  sortOrder?: 'asc' | 'desc'
}

// 错误类型
export interface ImageError {
  code: string
  message: string
  details?: any
}

// 事件类型
export type ImageEvent =
  | 'image-generated'
  | 'image-uploaded'
  | 'image-edited'
  | 'image-deleted'
  | 'image-shared'
  | 'image-favorited'
  | 'analysis-completed'
  | 'generation-started'
  | 'generation-progress'
  | 'generation-completed'
  | 'generation-failed'

// 事件数据
export interface ImageEventData {
  type: ImageEvent
  imageId?: string
  image?: BaseImage
  progress?: number
  error?: ImageError
  timestamp: Date
  userId: string
}

// 使用统计
export interface ImageUsageStats {
  totalGenerated: number
  totalUploaded: number
  totalEdited: number
  storageUsed: number // bytes
  apiCalls: number
  favoriteCount: number
  shareCount: number
  period: 'day' | 'week' | 'month' | 'year'
  date: Date
}

// 配置选项
export interface ImageConfig {
  maxFileSize: number
  allowedFormats: string[]
  maxGenerationsPerDay: number
  defaultQuality: string
  defaultStyle: string
  enableAIAnalysis: boolean
  enablePublicSharing: boolean
  storageQuota: number
}
