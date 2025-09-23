/**
 * 导入数据验证器
 * 提供全面的数据验证和完整性检查
 */

import { z } from 'zod'
import { SillyTavernWorldInfo, SillyTavernEntry } from '../utils/formatConverters'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  metadata: ValidationMetadata
}

export interface ValidationError {
  type: 'format' | 'structure' | 'content' | 'security'
  code: string
  message: string
  path?: string
  details?: any
}

export interface ValidationWarning {
  type: 'compatibility' | 'data_loss' | 'performance' | 'recommendation'
  code: string
  message: string
  path?: string
  suggestion?: string
}

export interface ValidationMetadata {
  format: string
  totalItems: number
  validItems: number
  errorCount: number
  warningCount: number
  dataSize: number
  validationTime: number
  securityChecks: {
    maliciousContent: boolean
    excessiveSize: boolean
    suspiciousPatterns: boolean
  }
}

export interface ConflictDetection {
  duplicateNames: ConflictItem[]
  similarContent: ConflictItem[]
  keywordOverlaps: ConflictItem[]
}

export interface ConflictItem {
  name: string
  type: 'duplicate' | 'similar' | 'overlap'
  severity: 'low' | 'medium' | 'high'
  description: string
  existingId?: string
  suggestions: string[]
}

// Zod schemas for validation
const sillyTavernEntrySchema = z.object({
  uid: z.union([z.number(), z.string()]).optional(),
  key: z.array(z.string()).min(1, '至少需要一个关键词'),
  keysecondary: z.array(z.string()).optional(),
  comment: z.string().optional(),
  content: z.string().min(1, '内容不能为空'),
  constant: z.boolean().optional(),
  selective: z.boolean().optional(),
  order: z.number().optional(),
  position: z.enum(['before_char', 'after_char']).optional(),
  disable: z.boolean().optional(),
  addMemo: z.boolean().optional(),
  excludeRecursion: z.boolean().optional(),
  delayUntilRecursion: z.boolean().optional(),
  displayIndex: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  group: z.string().optional(),
  groupOverride: z.boolean().optional(),
  groupWeight: z.number().optional(),
  scanDepth: z.number().min(0).max(1000).optional(),
  caseSensitive: z.boolean().optional(),
  matchWholeWords: z.boolean().optional(),
  useGroupScoring: z.boolean().optional(),
  automation_id: z.string().optional(),
  role: z.number().optional(),
  sticky: z.number().optional(),
  cooldown: z.number().optional(),
  delay: z.number().optional()
})

const sillyTavernWorldInfoSchema = z.object({
  entries: z.array(sillyTavernEntrySchema),
  name: z.string().optional(),
  description: z.string().optional(),
  version: z.string().optional()
})

const worldInfoEntrySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().min(1, '内容不能为空').max(10000, '内容不能超过10000字符'),
  keywords: z.array(z.string()).min(1, '至少需要一个关键词'),
  priority: z.number().int().min(0).max(999).optional(),
  insertDepth: z.number().int().min(0).max(10).optional(),
  probability: z.number().min(0).max(1).optional(),
  matchType: z.enum(['exact', 'contains', 'regex', 'starts_with', 'ends_with', 'wildcard']).optional(),
  caseSensitive: z.boolean().optional(),
  isActive: z.boolean().optional(),
  triggerOnce: z.boolean().optional(),
  excludeRecursion: z.boolean().optional(),
  category: z.string().optional(),
  group: z.string().optional(),
  position: z.enum(['before', 'after', 'replace']).optional()
})

const scenarioSchema = z.object({
  name: z.string().min(1, '剧本名称不能为空').max(100, '剧本名称不能超过100字符'),
  description: z.string().max(500, '描述不能超过500字符').optional(),
  content: z.string().max(50000, '内容不能超过50000字符').optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().max(50, '分类不能超过50字符').optional(),
  language: z.string().max(10, '语言代码不能超过10字符').optional(),
  worldInfos: z.array(worldInfoEntrySchema).optional()
})

const tavernAIDataSchema = z.union([
  scenarioSchema,
  z.array(scenarioSchema)
])

class ImportValidators {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  private readonly MAX_ENTRIES_PER_SCENARIO = 1000
  private readonly MAX_SCENARIOS_PER_IMPORT = 100

  /**
   * 验证导入数据
   */
  async validateImportData(data: any, format: string): Promise<ValidationResult> {
    const startTime = performance.now()
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // 基础数据检查
      if (!data) {
        errors.push({
          type: 'structure',
          code: 'EMPTY_DATA',
          message: '导入数据为空'
        })
        return this.createValidationResult(false, errors, warnings, format, 0, startTime)
      }

      // 数据大小检查
      const dataSize = this.calculateDataSize(data)
      if (dataSize > this.MAX_FILE_SIZE) {
        errors.push({
          type: 'format',
          code: 'FILE_TOO_LARGE',
          message: `文件大小超过限制 (${Math.round(dataSize / 1024 / 1024)}MB > 50MB)`
        })
      }

      // 安全检查
      const securityChecks = await this.performSecurityChecks(data)
      if (securityChecks.maliciousContent) {
        errors.push({
          type: 'security',
          code: 'MALICIOUS_CONTENT',
          message: '检测到可疑内容，可能包含恶意代码'
        })
      }

      // 格式特定验证
      let validationResult: ValidationResult
      switch (format) {
        case 'sillytavern':
          validationResult = await this.validateSillyTavernFormat(data, errors, warnings)
          break
        case 'json':
          validationResult = await this.validateJSONFormat(data, errors, warnings)
          break
        case 'yaml':
          validationResult = await this.validateYAMLFormat(data, errors, warnings)
          break
        case 'enhanced':
          validationResult = await this.validateEnhancedFormat(data, errors, warnings)
          break
        default:
          errors.push({
            type: 'format',
            code: 'UNSUPPORTED_FORMAT',
            message: `不支持的格式: ${format}`
          })
          return this.createValidationResult(false, errors, warnings, format, 0, startTime)
      }

      // 合并验证结果
      errors.push(...validationResult.errors)
      warnings.push(...validationResult.warnings)

      const isValid = errors.length === 0
      const totalItems = this.countTotalItems(data, format)
      const validItems = isValid ? totalItems : 0

      return {
        isValid,
        errors,
        warnings,
        metadata: {
          format,
          totalItems,
          validItems,
          errorCount: errors.length,
          warningCount: warnings.length,
          dataSize,
          validationTime: Math.round(performance.now() - startTime),
          securityChecks
        }
      }
    } catch (error) {
      errors.push({
        type: 'format',
        code: 'VALIDATION_ERROR',
        message: `验证过程中发生错误: ${error.message}`
      })

      return this.createValidationResult(false, errors, warnings, format, 0, startTime)
    }
  }

  /**
   * 检测导入冲突
   */
  async detectConflicts(existingScenarios: any[], importScenarios: any[]): Promise<ConflictDetection> {
    const duplicateNames: ConflictItem[] = []
    const similarContent: ConflictItem[] = []
    const keywordOverlaps: ConflictItem[] = []

    // 检测重名
    for (const importScenario of importScenarios) {
      const duplicate = existingScenarios.find(existing =>
        existing.name.toLowerCase() === importScenario.name.toLowerCase()
      )

      if (duplicate) {
        duplicateNames.push({
          name: importScenario.name,
          type: 'duplicate',
          severity: 'high',
          description: '存在同名剧本',
          existingId: duplicate.id,
          suggestions: [
            '重命名导入的剧本',
            '覆盖现有剧本',
            '跳过此剧本',
            '合并剧本内容'
          ]
        })
      }
    }

    // 检测相似内容
    for (const importScenario of importScenarios) {
      for (const existing of existingScenarios) {
        const similarity = this.calculateContentSimilarity(
          importScenario.description || importScenario.content || '',
          existing.description || existing.content || ''
        )

        if (similarity > 0.8 && importScenario.name !== existing.name) {
          similarContent.push({
            name: importScenario.name,
            type: 'similar',
            severity: similarity > 0.9 ? 'high' : 'medium',
            description: `与现有剧本 "${existing.name}" 内容相似度 ${Math.round(similarity * 100)}%`,
            existingId: existing.id,
            suggestions: [
              '检查是否为重复内容',
              '考虑合并或跳过',
              '添加区分标识'
            ]
          })
        }
      }
    }

    // 检测关键词重叠
    for (const importScenario of importScenarios) {
      if (!importScenario.worldInfos) continue

      for (const importEntry of importScenario.worldInfos) {
        for (const existing of existingScenarios) {
          if (!existing.worldInfos) continue

          for (const existingEntry of existing.worldInfos) {
            const overlap = this.calculateKeywordOverlap(
              importEntry.keywords || [],
              existingEntry.keywords || []
            )

            if (overlap.percentage > 0.5 && overlap.count > 1) {
              keywordOverlaps.push({
                name: `${importScenario.name} - ${importEntry.title}`,
                type: 'overlap',
                severity: overlap.percentage > 0.8 ? 'high' : 'medium',
                description: `与 "${existing.name} - ${existingEntry.title}" 关键词重叠 ${Math.round(overlap.percentage * 100)}%`,
                existingId: existing.id,
                suggestions: [
                  '调整关键词避免冲突',
                  '合并相似条目',
                  '设置不同优先级'
                ]
              })
            }
          }
        }
      }
    }

    return {
      duplicateNames,
      similarContent,
      keywordOverlaps
    }
  }

  /**
   * 内容清理和安全检查
   */
  sanitizeContent(content: string): string {
    // 移除潜在的恶意脚本
    content = content.replace(/<script[^>]*>.*?<\/script>/gi, '')
    content = content.replace(/javascript:/gi, '')
    content = content.replace(/on\w+\s*=/gi, '')

    // 清理HTML标签（保留基本格式）
    const allowedTags = ['b', 'i', 'u', 'br', 'p', 'strong', 'em']
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi

    content = content.replace(tagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        return match
      }
      return ''
    })

    // 限制长度
    if (content.length > 50000) {
      content = content.substring(0, 50000) + '...[内容已截断]'
    }

    return content.trim()
  }

  /**
   * 验证SillyTavern格式
   */
  private async validateSillyTavernFormat(
    data: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    try {
      // 检查是否为数组或单个对象
      const worldInfos = Array.isArray(data) ? data : [data]

      for (let i = 0; i < worldInfos.length; i++) {
        const worldInfo = worldInfos[i]
        const path = `worldInfo[${i}]`

        // 验证基本结构
        const result = sillyTavernWorldInfoSchema.safeParse(worldInfo)
        if (!result.success) {
          result.error.errors.forEach(error => {
            errors.push({
              type: 'structure',
              code: 'INVALID_STRUCTURE',
              message: `${path}: ${error.message}`,
              path: `${path}.${error.path.join('.')}`
            })
          })
          continue
        }

        // 检查条目数量
        if (worldInfo.entries && worldInfo.entries.length > this.MAX_ENTRIES_PER_SCENARIO) {
          warnings.push({
            type: 'performance',
            code: 'TOO_MANY_ENTRIES',
            message: `${path}: 条目数量过多 (${worldInfo.entries.length} > ${this.MAX_ENTRIES_PER_SCENARIO})`,
            path,
            suggestion: '考虑分割为多个剧本或减少条目数量'
          })
        }

        // 验证每个条目
        for (let j = 0; j < worldInfo.entries.length; j++) {
          const entry = worldInfo.entries[j]
          const entryPath = `${path}.entries[${j}]`

          this.validateSillyTavernEntry(entry, entryPath, errors, warnings)
        }
      }

      return this.createValidationResult(errors.length === 0, [], [], 'sillytavern', worldInfos.length, 0)
    } catch (error) {
      errors.push({
        type: 'format',
        code: 'PARSE_ERROR',
        message: `SillyTavern格式解析失败: ${error.message}`
      })

      return this.createValidationResult(false, [], [], 'sillytavern', 0, 0)
    }
  }

  /**
   * 验证SillyTavern条目
   */
  private validateSillyTavernEntry(
    entry: SillyTavernEntry,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // 检查必要字段
    if (!entry.content || entry.content.trim().length === 0) {
      errors.push({
        type: 'content',
        code: 'EMPTY_CONTENT',
        message: `${path}: 条目内容为空`,
        path
      })
    }

    if (!entry.key || entry.key.length === 0) {
      errors.push({
        type: 'content',
        code: 'NO_KEYWORDS',
        message: `${path}: 条目缺少关键词`,
        path
      })
    }

    // 检查内容长度
    if (entry.content && entry.content.length > 10000) {
      warnings.push({
        type: 'performance',
        code: 'LARGE_CONTENT',
        message: `${path}: 条目内容过长 (${entry.content.length} 字符)`,
        path,
        suggestion: '考虑分割为多个条目或精简内容'
      })
    }

    // 检查关键词数量
    const totalKeywords = (entry.key?.length || 0) + (entry.keysecondary?.length || 0)
    if (totalKeywords > 20) {
      warnings.push({
        type: 'performance',
        code: 'TOO_MANY_KEYWORDS',
        message: `${path}: 关键词过多 (${totalKeywords})`,
        path,
        suggestion: '过多关键词可能影响匹配性能'
      })
    }

    // 检查正则表达式关键词
    if (entry.key) {
      for (const keyword of entry.key) {
        if (keyword.includes('.*') || keyword.includes('\\')) {
          try {
            new RegExp(keyword)
          } catch (regexError) {
            errors.push({
              type: 'content',
              code: 'INVALID_REGEX',
              message: `${path}: 无效的正则表达式关键词 "${keyword}"`,
              path
            })
          }
        }
      }
    }
  }

  /**
   * 验证JSON格式
   */
  private async validateJSONFormat(
    data: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    try {
      // 如果是字符串，尝试解析JSON
      let parsedData = data
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data)
        } catch (parseError) {
          errors.push({
            type: 'format',
            code: 'INVALID_JSON',
            message: `JSON解析失败: ${parseError.message}`
          })
          return this.createValidationResult(false, [], [], 'json', 0, 0)
        }
      }

      // 验证TavernAI格式
      const result = tavernAIDataSchema.safeParse(parsedData)
      if (!result.success) {
        result.error.errors.forEach(error => {
          errors.push({
            type: 'structure',
            code: 'INVALID_STRUCTURE',
            message: error.message,
            path: error.path.join('.')
          })
        })
      }

      const scenarios = Array.isArray(parsedData) ? parsedData : [parsedData]

      // 检查剧本数量
      if (scenarios.length > this.MAX_SCENARIOS_PER_IMPORT) {
        warnings.push({
          type: 'performance',
          code: 'TOO_MANY_SCENARIOS',
          message: `剧本数量过多 (${scenarios.length} > ${this.MAX_SCENARIOS_PER_IMPORT})`,
          suggestion: '考虑分批导入'
        })
      }

      return this.createValidationResult(errors.length === 0, [], [], 'json', scenarios.length, 0)
    } catch (error) {
      errors.push({
        type: 'format',
        code: 'VALIDATION_ERROR',
        message: `JSON验证失败: ${error.message}`
      })

      return this.createValidationResult(false, [], [], 'json', 0, 0)
    }
  }

  /**
   * 验证YAML格式
   */
  private async validateYAMLFormat(
    data: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    try {
      // YAML数据应该已经被解析为对象
      return this.validateJSONFormat(data, errors, warnings)
    } catch (error) {
      errors.push({
        type: 'format',
        code: 'YAML_ERROR',
        message: `YAML验证失败: ${error.message}`
      })

      return this.createValidationResult(false, [], [], 'yaml', 0, 0)
    }
  }

  /**
   * 验证增强格式
   */
  private async validateEnhancedFormat(
    data: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<ValidationResult> {
    try {
      const items = Array.isArray(data) ? data : [data]

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const path = `item[${i}]`

        // 检查增强格式结构
        if (!item.enhanced) {
          warnings.push({
            type: 'compatibility',
            code: 'MISSING_ENHANCED_DATA',
            message: `${path}: 缺少增强格式数据`,
            path,
            suggestion: '将按普通格式处理'
          })
        } else {
          // 验证增强格式版本
          if (!item.enhanced.exportVersion) {
            warnings.push({
              type: 'compatibility',
              code: 'MISSING_VERSION',
              message: `${path}: 缺少导出版本信息`,
              path
            })
          }

          // 检查数据完整性标记
          if (item.enhanced.metadata && item.enhanced.metadata.dataIntegrity === false) {
            warnings.push({
              type: 'data_loss',
              code: 'DATA_INTEGRITY_WARNING',
              message: `${path}: 数据完整性标记为false，可能存在数据丢失`,
              path
            })
          }
        }

        // 验证基础剧本数据
        const { enhanced, ...baseData } = item
        const baseResult = tavernAIDataSchema.safeParse(baseData)
        if (!baseResult.success) {
          baseResult.error.errors.forEach(error => {
            errors.push({
              type: 'structure',
              code: 'INVALID_BASE_STRUCTURE',
              message: `${path}: ${error.message}`,
              path: `${path}.${error.path.join('.')}`
            })
          })
        }
      }

      return this.createValidationResult(errors.length === 0, [], [], 'enhanced', items.length, 0)
    } catch (error) {
      errors.push({
        type: 'format',
        code: 'ENHANCED_FORMAT_ERROR',
        message: `增强格式验证失败: ${error.message}`
      })

      return this.createValidationResult(false, [], [], 'enhanced', 0, 0)
    }
  }

  /**
   * 执行安全检查
   */
  private async performSecurityChecks(data: any): Promise<{
    maliciousContent: boolean
    excessiveSize: boolean
    suspiciousPatterns: boolean
  }> {
    const dataString = JSON.stringify(data)

    // 检查恶意内容模式
    const maliciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i
    ]

    const maliciousContent = maliciousPatterns.some(pattern => pattern.test(dataString))

    // 检查文件大小
    const excessiveSize = dataString.length > this.MAX_FILE_SIZE

    // 检查可疑模式
    const suspiciousPatternList = [
      /\b(password|token|secret|key)\b.*[:=]\s*["'][\w+/=]{20,}/i,
      /\b(api[_-]?key|access[_-]?token)\b.*[:=]\s*["'][\w\-]{20,}/i
    ]

    const suspiciousPatterns = suspiciousPatternList.some(pattern => pattern.test(dataString))

    return {
      maliciousContent,
      excessiveSize,
      suspiciousPatterns
    }
  }

  /**
   * 计算数据大小
   */
  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length
  }

  /**
   * 计算总条目数
   */
  private countTotalItems(data: any, format: string): number {
    switch (format) {
      case 'sillytavern':
        const worldInfos = Array.isArray(data) ? data : [data]
        return worldInfos.reduce((total, wi) => total + (wi.entries?.length || 0), 0)

      case 'json':
      case 'yaml':
      case 'enhanced':
        const scenarios = Array.isArray(data) ? data : [data]
        return scenarios.length

      default:
        return 0
    }
  }

  /**
   * 计算内容相似度
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    if (!content1 || !content2) return 0

    // 简化的相似度计算 - 实际项目中可以使用更复杂的算法
    const words1 = content1.toLowerCase().split(/\s+/)
    const words2 = content2.toLowerCase().split(/\s+/)

    const allWords = new Set([...words1, ...words2])
    const intersection = words1.filter(word => words2.includes(word))

    return intersection.length / allWords.size
  }

  /**
   * 计算关键词重叠
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): {
    count: number
    percentage: number
  } {
    if (!keywords1.length || !keywords2.length) {
      return { count: 0, percentage: 0 }
    }

    const set1 = new Set(keywords1.map(k => k.toLowerCase()))
    const set2 = new Set(keywords2.map(k => k.toLowerCase()))

    const intersection = new Set([...set1].filter(k => set2.has(k)))
    const union = new Set([...set1, ...set2])

    return {
      count: intersection.size,
      percentage: intersection.size / union.size
    }
  }

  /**
   * 创建验证结果
   */
  private createValidationResult(
    isValid: boolean,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    format: string,
    totalItems: number,
    startTime: number
  ): ValidationResult {
    return {
      isValid,
      errors,
      warnings,
      metadata: {
        format,
        totalItems,
        validItems: isValid ? totalItems : 0,
        errorCount: errors.length,
        warningCount: warnings.length,
        dataSize: 0,
        validationTime: startTime > 0 ? Math.round(performance.now() - startTime) : 0,
        securityChecks: {
          maliciousContent: false,
          excessiveSize: false,
          suspiciousPatterns: false
        }
      }
    }
  }
}

export const importValidators = new ImportValidators()