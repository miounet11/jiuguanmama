/**
 * 格式转换器
 * 支持多种格式的相互转换，包括SillyTavern World Info、JSON、YAML等
 */

import * as yaml from 'js-yaml'
import {
  ApiScenario,
  ApiScenarioDetail,
  ApiWorldInfoEntry
} from '../types/api'

export interface SillyTavernWorldInfo {
  entries: SillyTavernEntry[]
  name?: string
  description?: string
  version?: string
}

export interface SillyTavernEntry {
  uid?: number | string
  key: string[]
  keysecondary?: string[]
  comment?: string
  content: string
  constant?: boolean
  selective?: boolean
  order?: number
  position?: 'before_char' | 'after_char'
  disable?: boolean
  addMemo?: boolean
  excludeRecursion?: boolean
  delayUntilRecursion?: boolean
  displayIndex?: number
  probability?: number
  group?: string
  groupOverride?: boolean
  groupWeight?: number
  scanDepth?: number
  caseSensitive?: boolean
  matchWholeWords?: boolean
  useGroupScoring?: boolean
  automation_id?: string
  role?: number
  sticky?: number
  cooldown?: number
  delay?: number
}

export interface TavernAIPlusEnhanced extends ApiScenarioDetail {
  enhanced: {
    exportVersion: string
    exportedAt: string
    metadata: {
      originalFormat?: string
      conversionNotes?: string[]
      dataIntegrity: boolean
    }
    extendedFields: {
      customProperties?: Record<string, any>
      advancedSettings?: Record<string, any>
    }
  }
}

export interface ConversionOptions {
  includeWorldInfo?: boolean
  includeMetadata?: boolean
  preserveIds?: boolean
  targetVersion?: string
}

export interface ConversionResult {
  success: boolean
  data?: any
  scenarios?: any[]
  error?: string
  warnings?: string[]
  metadata?: {
    originalFormat: string
    targetFormat: string
    conversionTime: number
    dataLoss: string[]
    fieldsIgnored: string[]
  }
}

class FormatConverters {
  /**
   * 转换为TavernAI Plus内部格式
   */
  async convertToTavernAIFormat(data: any, sourceFormat: string): Promise<ConversionResult> {
    const startTime = performance.now()

    try {
      let scenarios: any[] = []
      const warnings: string[] = []
      const dataLoss: string[] = []
      const fieldsIgnored: string[] = []

      switch (sourceFormat) {
        case 'sillytavern':
          scenarios = await this.convertFromSillyTavern(data, warnings, dataLoss, fieldsIgnored)
          break

        case 'json':
          scenarios = await this.convertFromJSON(data, warnings, dataLoss, fieldsIgnored)
          break

        case 'yaml':
          scenarios = await this.convertFromYAML(data, warnings, dataLoss, fieldsIgnored)
          break

        case 'enhanced':
          scenarios = await this.convertFromEnhanced(data, warnings, dataLoss, fieldsIgnored)
          break

        default:
          throw new Error(`不支持的源格式: ${sourceFormat}`)
      }

      const conversionTime = performance.now() - startTime

      return {
        success: true,
        scenarios,
        warnings,
        metadata: {
          originalFormat: sourceFormat,
          targetFormat: 'tavernai-plus',
          conversionTime: Math.round(conversionTime),
          dataLoss,
          fieldsIgnored
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          originalFormat: sourceFormat,
          targetFormat: 'tavernai-plus',
          conversionTime: performance.now() - startTime,
          dataLoss: [],
          fieldsIgnored: []
        }
      }
    }
  }

  /**
   * 从TavernAI Plus格式转换到目标格式
   */
  async convertFromTavernAIFormat(
    scenarios: ApiScenarioDetail[],
    targetFormat: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = performance.now()

    try {
      let data: any
      const warnings: string[] = []
      const dataLoss: string[] = []
      const fieldsIgnored: string[] = []

      switch (targetFormat) {
        case 'sillytavern':
          data = await this.convertToSillyTavern(scenarios, options, warnings, dataLoss, fieldsIgnored)
          break

        case 'json':
          data = await this.convertToJSON(scenarios, options, warnings, dataLoss, fieldsIgnored)
          break

        case 'yaml':
          data = await this.convertToYAML(scenarios, options, warnings, dataLoss, fieldsIgnored)
          break

        case 'enhanced':
          data = await this.convertToEnhanced(scenarios, options, warnings, dataLoss, fieldsIgnored)
          break

        default:
          throw new Error(`不支持的目标格式: ${targetFormat}`)
      }

      const conversionTime = performance.now() - startTime

      return {
        success: true,
        data,
        warnings,
        metadata: {
          originalFormat: 'tavernai-plus',
          targetFormat,
          conversionTime: Math.round(conversionTime),
          dataLoss,
          fieldsIgnored
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          originalFormat: 'tavernai-plus',
          targetFormat,
          conversionTime: performance.now() - startTime,
          dataLoss: [],
          fieldsIgnored: []
        }
      }
    }
  }

  /**
   * 从SillyTavern World Info格式转换
   */
  private async convertFromSillyTavern(
    data: SillyTavernWorldInfo | SillyTavernWorldInfo[],
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<any[]> {
    const worldInfos = Array.isArray(data) ? data : [data]
    const scenarios: any[] = []

    for (const worldInfo of worldInfos) {
      const scenario = {
        name: worldInfo.name || 'Imported Scenario',
        description: worldInfo.description || '从SillyTavern导入的剧本',
        content: worldInfo.description || '',
        isPublic: true,
        tags: ['imported', 'sillytavern'],
        category: '导入',
        language: 'zh-CN',
        worldInfos: []
      }

      // 转换条目
      if (worldInfo.entries && worldInfo.entries.length > 0) {
        for (const entry of worldInfo.entries) {
          const convertedEntry = this.convertSillyTavernEntry(entry, warnings, fieldsIgnored)
          if (convertedEntry) {
            scenario.worldInfos.push(convertedEntry)
          }
        }
      }

      scenarios.push(scenario)
    }

    return scenarios
  }

  /**
   * 转换SillyTavern条目
   */
  private convertSillyTavernEntry(
    entry: SillyTavernEntry,
    warnings: string[],
    fieldsIgnored: string[]
  ): any | null {
    try {
      // 检查必要字段
      if (!entry.content || (!entry.key || entry.key.length === 0)) {
        warnings.push(`跳过无效条目: 缺少内容或关键词`)
        return null
      }

      // 处理位置映射
      let position = 'before'
      if (entry.position === 'after_char') {
        position = 'after'
      }

      // 处理匹配类型
      let matchType = 'contains'
      if (entry.matchWholeWords) {
        matchType = 'exact'
      }

      // 忽略的字段
      const ignoredFields = [
        'uid', 'keysecondary', 'automation_id', 'role', 'sticky',
        'cooldown', 'delay', 'addMemo', 'delayUntilRecursion',
        'displayIndex', 'groupOverride', 'groupWeight', 'useGroupScoring'
      ]

      ignoredFields.forEach(field => {
        if (entry[field] !== undefined && entry[field] !== null) {
          fieldsIgnored.push(`SillyTavern字段 '${field}' 在转换中被忽略`)
        }
      })

      return {
        title: entry.comment || entry.key[0] || 'Untitled',
        content: entry.content,
        keywords: [...entry.key, ...(entry.keysecondary || [])],
        priority: Math.max(0, Math.min(999, entry.order || 0)),
        insertDepth: Math.max(1, Math.min(10, entry.scanDepth || 4)),
        probability: Math.max(0, Math.min(1, entry.probability !== undefined ? entry.probability / 100 : 1.0)),
        matchType,
        caseSensitive: entry.caseSensitive || false,
        isActive: !entry.disable,
        triggerOnce: !entry.constant,
        excludeRecursion: entry.excludeRecursion !== false,
        category: entry.group || '通用',
        position
      }
    } catch (error) {
      warnings.push(`转换条目失败: ${error.message}`)
      return null
    }
  }

  /**
   * 转换为SillyTavern格式
   */
  private async convertToSillyTavern(
    scenarios: ApiScenarioDetail[],
    options: ConversionOptions,
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<SillyTavernWorldInfo[]> {
    const worldInfos: SillyTavernWorldInfo[] = []

    for (const scenario of scenarios) {
      const worldInfo: SillyTavernWorldInfo = {
        name: scenario.name,
        description: scenario.description || '',
        version: '2.0',
        entries: []
      }

      if (options.includeWorldInfo && scenario.worldInfos) {
        for (let i = 0; i < scenario.worldInfos.length; i++) {
          const entry = scenario.worldInfos[i]
          const convertedEntry = this.convertToSillyTavernEntry(entry, i, warnings, fieldsIgnored)
          if (convertedEntry) {
            worldInfo.entries.push(convertedEntry)
          }
        }
      }

      // 记录数据丢失
      if (scenario.content && scenario.content !== scenario.description) {
        dataLoss.push('剧本详细内容无法在SillyTavern格式中保留')
      }

      if (scenario.tags && scenario.tags.length > 0) {
        dataLoss.push('剧本标签无法在SillyTavern格式中保留')
      }

      worldInfos.push(worldInfo)
    }

    return worldInfos
  }

  /**
   * 转换为SillyTavern条目
   */
  private convertToSillyTavernEntry(
    entry: ApiWorldInfoEntry,
    index: number,
    warnings: string[],
    fieldsIgnored: string[]
  ): SillyTavernEntry | null {
    try {
      // TavernAI Plus特有字段将被忽略
      const ignoredFields = ['insertDepth', 'excludeRecursion', 'category']
      ignoredFields.forEach(field => {
        if (entry[field] !== undefined) {
          fieldsIgnored.push(`TavernAI Plus字段 '${field}' 在转换为SillyTavern格式时被忽略`)
        }
      })

      return {
        uid: index,
        key: entry.keywords.slice(0, 1), // SillyTavern主关键词
        keysecondary: entry.keywords.slice(1), // 其余关键词
        comment: entry.title,
        content: entry.content,
        constant: !entry.triggerOnce,
        selective: false,
        order: entry.priority,
        position: entry.position === 'after' ? 'after_char' : 'before_char',
        disable: !entry.isActive,
        probability: Math.round(entry.probability * 100),
        group: entry.group || '',
        scanDepth: entry.insertDepth,
        caseSensitive: entry.caseSensitive,
        matchWholeWords: entry.matchType === 'exact'
      }
    } catch (error) {
      warnings.push(`转换条目到SillyTavern格式失败: ${error.message}`)
      return null
    }
  }

  /**
   * 从JSON格式转换
   */
  private async convertFromJSON(
    data: any,
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<any[]> {
    try {
      // 如果是字符串，先解析JSON
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      // 如果是单个对象，包装成数组
      if (!Array.isArray(data)) {
        data = [data]
      }

      // 验证和转换每个剧本
      const scenarios: any[] = []
      for (const item of data) {
        const scenario = this.validateAndConvertScenario(item, warnings)
        if (scenario) {
          scenarios.push(scenario)
        }
      }

      return scenarios
    } catch (error) {
      throw new Error(`JSON解析失败: ${error.message}`)
    }
  }

  /**
   * 从YAML格式转换
   */
  private async convertFromYAML(
    data: any,
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<any[]> {
    try {
      let parsedData: any

      // 如果是字符串，解析YAML
      if (typeof data === 'string') {
        parsedData = yaml.load(data)
      } else {
        parsedData = data
      }

      // 转换为JSON格式处理
      return this.convertFromJSON(parsedData, warnings, dataLoss, fieldsIgnored)
    } catch (error) {
      throw new Error(`YAML解析失败: ${error.message}`)
    }
  }

  /**
   * 从增强格式转换
   */
  private async convertFromEnhanced(
    data: TavernAIPlusEnhanced | TavernAIPlusEnhanced[],
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<any[]> {
    const items = Array.isArray(data) ? data : [data]
    const scenarios: any[] = []

    for (const item of items) {
      // 提取基础剧本数据
      const { enhanced, ...baseScenario } = item

      // 处理扩展字段
      if (enhanced?.extendedFields) {
        fieldsIgnored.push('增强格式的扩展字段在转换中被保留但可能不完全兼容')
      }

      scenarios.push(baseScenario)
    }

    return scenarios
  }

  /**
   * 转换为JSON格式
   */
  private async convertToJSON(
    scenarios: ApiScenarioDetail[],
    options: ConversionOptions,
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<any> {
    const data = scenarios.map(scenario => {
      const result: any = {
        name: scenario.name,
        description: scenario.description,
        content: scenario.content,
        isPublic: scenario.isPublic,
        tags: scenario.tags,
        category: scenario.category,
        language: scenario.language
      }

      if (options.includeWorldInfo && scenario.worldInfos) {
        result.worldInfos = scenario.worldInfos
      }

      if (options.includeMetadata) {
        result.metadata = {
          version: scenario.version,
          createdAt: scenario.createdAt,
          updatedAt: scenario.updatedAt,
          creator: scenario.user
        }
      }

      return result
    })

    return scenarios.length === 1 ? data[0] : data
  }

  /**
   * 转换为YAML格式
   */
  private async convertToYAML(
    scenarios: ApiScenarioDetail[],
    options: ConversionOptions,
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<string> {
    const jsonData = await this.convertToJSON(scenarios, options, warnings, dataLoss, fieldsIgnored)
    return yaml.dump(jsonData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: true
    })
  }

  /**
   * 转换为增强格式
   */
  private async convertToEnhanced(
    scenarios: ApiScenarioDetail[],
    options: ConversionOptions,
    warnings: string[],
    dataLoss: string[],
    fieldsIgnored: string[]
  ): Promise<TavernAIPlusEnhanced[]> {
    return scenarios.map(scenario => ({
      ...scenario,
      enhanced: {
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        metadata: {
          originalFormat: 'tavernai-plus',
          conversionNotes: warnings,
          dataIntegrity: dataLoss.length === 0
        },
        extendedFields: {
          customProperties: {},
          advancedSettings: {
            includeWorldInfo: options.includeWorldInfo,
            includeMetadata: options.includeMetadata
          }
        }
      }
    }))
  }

  /**
   * 验证和转换剧本对象
   */
  private validateAndConvertScenario(item: any, warnings: string[]): any | null {
    if (!item || typeof item !== 'object') {
      warnings.push('跳过无效的剧本对象')
      return null
    }

    if (!item.name || typeof item.name !== 'string') {
      warnings.push('跳过没有有效名称的剧本')
      return null
    }

    return {
      name: item.name,
      description: item.description || '',
      content: item.content || item.description || '',
      isPublic: item.isPublic !== false,
      tags: Array.isArray(item.tags) ? item.tags : [],
      category: item.category || '通用',
      language: item.language || 'zh-CN',
      worldInfos: Array.isArray(item.worldInfos) ? item.worldInfos : []
    }
  }
}

export const formatConverters = new FormatConverters()