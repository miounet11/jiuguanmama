/**
 * 导入导出服务
 * 提供剧本数据的导入导出功能，支持多种格式和完整的数据验证
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../server'
import { scenarioService } from './scenarioService'
import { formatConverters } from '../utils/formatConverters'
import { importValidators } from '../validators/importValidators'
import {
  ApiScenario,
  ApiScenarioDetail,
  ApiWorldInfoEntry
} from '../types/api'

export interface ImportOptions {
  format: 'sillytavern' | 'json' | 'yaml' | 'enhanced'
  conflictResolution: 'skip' | 'overwrite' | 'merge' | 'rename'
  validateData: boolean
  preserveIds: boolean
  batchSize?: number
}

export interface ExportOptions {
  format: 'sillytavern' | 'json' | 'yaml' | 'enhanced'
  includeWorldInfo: boolean
  includeMetadata: boolean
  compression?: boolean
}

export interface ImportResult {
  success: boolean
  importId: string
  totalItems: number
  successCount: number
  failureCount: number
  skippedCount: number
  importedScenarios: ApiScenario[]
  errors: ImportError[]
  warnings: ImportWarning[]
  metadata: ImportMetadata
}

export interface ImportError {
  type: 'validation' | 'conflict' | 'system'
  message: string
  details?: any
  scenarioName?: string
  entryTitle?: string
}

export interface ImportWarning {
  type: 'data_loss' | 'format_incompatible' | 'field_ignored'
  message: string
  details?: any
  scenarioName?: string
}

export interface ImportMetadata {
  sourceFormat: string
  targetFormat: string
  timestamp: Date
  userId: string
  fileSize?: number
  processingTime: number
  dataIntegrity: {
    originalCount: number
    processedCount: number
    validationErrors: number
  }
}

export interface ExportResult {
  success: boolean
  exportId: string
  data: any
  format: string
  size: number
  checksum: string
  metadata: ExportMetadata
}

export interface ExportMetadata {
  exportedAt: Date
  userId: string
  scenarioCount: number
  worldInfoEntryCount: number
  format: string
  version: string
}

export interface ImportHistoryEntry {
  id: string
  userId: string
  filename: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalItems: number
  successCount: number
  failureCount: number
  importedAt: Date
  metadata: any
}

class ImportExportService {
  /**
   * 导入剧本数据
   */
  async importScenarios(
    userId: string,
    data: any,
    options: ImportOptions,
    filename?: string
  ): Promise<ImportResult> {
    const startTime = performance.now()
    const importId = this.generateImportId()

    try {
      // 创建导入历史记录
      await this.createImportHistory(userId, filename || 'unknown', options.format, 'processing')

      // 验证输入数据
      if (options.validateData) {
        const validationResult = await importValidators.validateImportData(data, options.format)
        if (!validationResult.isValid) {
          throw new Error(`数据验证失败: ${validationResult.errors.map(e => e.message).join(', ')}`)
        }
      }

      // 转换数据格式
      const convertedData = await formatConverters.convertToTavernAIFormat(data, options.format)
      if (!convertedData.success) {
        throw new Error(`格式转换失败: ${convertedData.error}`)
      }

      // 处理导入冲突
      const { scenarios: processedScenarios, conflicts } = await this.processImportConflicts(
        userId,
        convertedData.scenarios,
        options.conflictResolution
      )

      // 批量导入数据
      const importResults = await this.batchImportScenarios(
        userId,
        processedScenarios,
        options.batchSize || 10
      )

      const processingTime = performance.now() - startTime

      // 更新导入历史
      await this.updateImportHistory(importId, {
        status: 'completed',
        successCount: importResults.successCount,
        failureCount: importResults.failureCount
      })

      const result: ImportResult = {
        success: true,
        importId,
        totalItems: processedScenarios.length,
        successCount: importResults.successCount,
        failureCount: importResults.failureCount,
        skippedCount: conflicts.length,
        importedScenarios: importResults.importedScenarios,
        errors: importResults.errors,
        warnings: conflicts.map(c => ({
          type: 'data_loss' as const,
          message: `剧本 "${c.name}" 存在冲突，已${options.conflictResolution}`,
          scenarioName: c.name
        })),
        metadata: {
          sourceFormat: options.format,
          targetFormat: 'tavernai-plus',
          timestamp: new Date(),
          userId,
          processingTime: Math.round(processingTime),
          dataIntegrity: {
            originalCount: convertedData.scenarios.length,
            processedCount: processedScenarios.length,
            validationErrors: 0
          }
        }
      }

      return result
    } catch (error) {
      // 更新导入历史为失败状态
      await this.updateImportHistory(importId, { status: 'failed' })

      const processingTime = performance.now() - startTime
      return {
        success: false,
        importId,
        totalItems: 0,
        successCount: 0,
        failureCount: 1,
        skippedCount: 0,
        importedScenarios: [],
        errors: [{
          type: 'system',
          message: error.message || '导入过程中发生未知错误'
        }],
        warnings: [],
        metadata: {
          sourceFormat: options.format,
          targetFormat: 'tavernai-plus',
          timestamp: new Date(),
          userId,
          processingTime: Math.round(processingTime),
          dataIntegrity: {
            originalCount: 0,
            processedCount: 0,
            validationErrors: 1
          }
        }
      }
    }
  }

  /**
   * 导出单个剧本
   */
  async exportScenario(
    scenarioId: string,
    userId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 获取剧本详情
      const scenario = await scenarioService.getScenarioById(scenarioId, userId)
      if (!scenario) {
        throw new Error('剧本不存在或无权限访问')
      }

      // 转换为导出格式
      const convertedData = await formatConverters.convertFromTavernAIFormat(
        [scenario],
        options.format,
        {
          includeWorldInfo: options.includeWorldInfo,
          includeMetadata: options.includeMetadata
        }
      )

      if (!convertedData.success) {
        throw new Error(`格式转换失败: ${convertedData.error}`)
      }

      const exportId = this.generateExportId()
      const dataString = JSON.stringify(convertedData.data)
      const checksum = this.calculateChecksum(dataString)

      const result: ExportResult = {
        success: true,
        exportId,
        data: convertedData.data,
        format: options.format,
        size: dataString.length,
        checksum,
        metadata: {
          exportedAt: new Date(),
          userId,
          scenarioCount: 1,
          worldInfoEntryCount: scenario.worldInfos?.length || 0,
          format: options.format,
          version: '1.0'
        }
      }

      return result
    } catch (error) {
      throw new Error(`导出失败: ${error.message}`)
    }
  }

  /**
   * 批量导出剧本
   */
  async exportScenarios(
    scenarioIds: string[],
    userId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 获取所有剧本详情
      const scenarios: ApiScenarioDetail[] = []
      let totalWorldInfoCount = 0

      for (const scenarioId of scenarioIds) {
        const scenario = await scenarioService.getScenarioById(scenarioId, userId)
        if (scenario) {
          scenarios.push(scenario)
          totalWorldInfoCount += scenario.worldInfos?.length || 0
        }
      }

      if (scenarios.length === 0) {
        throw new Error('没有找到可导出的剧本')
      }

      // 转换为导出格式
      const convertedData = await formatConverters.convertFromTavernAIFormat(
        scenarios,
        options.format,
        {
          includeWorldInfo: options.includeWorldInfo,
          includeMetadata: options.includeMetadata
        }
      )

      if (!convertedData.success) {
        throw new Error(`格式转换失败: ${convertedData.error}`)
      }

      const exportId = this.generateExportId()
      const dataString = JSON.stringify(convertedData.data)
      const checksum = this.calculateChecksum(dataString)

      const result: ExportResult = {
        success: true,
        exportId,
        data: convertedData.data,
        format: options.format,
        size: dataString.length,
        checksum,
        metadata: {
          exportedAt: new Date(),
          userId,
          scenarioCount: scenarios.length,
          worldInfoEntryCount: totalWorldInfoCount,
          format: options.format,
          version: '1.0'
        }
      }

      return result
    } catch (error) {
      throw new Error(`批量导出失败: ${error.message}`)
    }
  }

  /**
   * 获取导入历史记录
   */
  async getImportHistory(userId: string, page: number = 1, limit: number = 20): Promise<ImportHistoryEntry[]> {
    // 注意：这里应该有一个专门的ImportHistory表，但由于当前数据库中没有定义，
    // 我们使用一个简化的实现，实际项目中应该创建相应的数据库表
    return []
  }

  /**
   * 回滚导入操作
   */
  async rollbackImport(importId: string, userId: string): Promise<boolean> {
    try {
      // 获取导入历史记录
      const importHistory = await this.getImportHistoryById(importId, userId)
      if (!importHistory) {
        throw new Error('导入记录不存在')
      }

      // 删除导入的剧本（软删除）
      if (importHistory.metadata?.importedScenarioIds) {
        for (const scenarioId of importHistory.metadata.importedScenarioIds) {
          await scenarioService.deleteScenario(scenarioId, userId)
        }
      }

      return true
    } catch (error) {
      console.error('回滚导入失败:', error)
      return false
    }
  }

  /**
   * 处理导入冲突
   */
  private async processImportConflicts(
    userId: string,
    scenarios: any[],
    conflictResolution: string
  ): Promise<{ scenarios: any[], conflicts: any[] }> {
    const processedScenarios: any[] = []
    const conflicts: any[] = []

    for (const scenario of scenarios) {
      // 检查是否存在同名剧本
      const existingScenario = await prisma.scenario.findFirst({
        where: {
          userId,
          name: scenario.name,
          isActive: true
        }
      })

      if (existingScenario) {
        switch (conflictResolution) {
          case 'skip':
            conflicts.push(scenario)
            break
          case 'overwrite':
            // 删除现有剧本，添加新剧本
            await scenarioService.deleteScenario(existingScenario.id, userId)
            processedScenarios.push(scenario)
            break
          case 'rename':
            // 重命名新剧本
            scenario.name = await this.generateUniqueName(userId, scenario.name)
            processedScenarios.push(scenario)
            break
          case 'merge':
            // 合并剧本数据（保留现有剧本，合并世界信息）
            const mergedScenario = await this.mergeScenarios(existingScenario, scenario)
            processedScenarios.push(mergedScenario)
            break
          default:
            processedScenarios.push(scenario)
        }
      } else {
        processedScenarios.push(scenario)
      }
    }

    return { scenarios: processedScenarios, conflicts }
  }

  /**
   * 批量导入剧本
   */
  private async batchImportScenarios(
    userId: string,
    scenarios: any[],
    batchSize: number
  ): Promise<{ successCount: number, failureCount: number, importedScenarios: ApiScenario[], errors: ImportError[] }> {
    let successCount = 0
    let failureCount = 0
    const importedScenarios: ApiScenario[] = []
    const errors: ImportError[] = []

    // 分批处理
    for (let i = 0; i < scenarios.length; i += batchSize) {
      const batch = scenarios.slice(i, i + batchSize)

      for (const scenarioData of batch) {
        try {
          // 创建剧本
          const scenario = await scenarioService.createScenario(userId, {
            name: scenarioData.name,
            description: scenarioData.description,
            content: scenarioData.content,
            isPublic: scenarioData.isPublic ?? true,
            tags: scenarioData.tags || [],
            category: scenarioData.category || '通用',
            language: scenarioData.language || 'zh-CN'
          })

          // 导入世界信息条目
          if (scenarioData.worldInfos && scenarioData.worldInfos.length > 0) {
            for (const entryData of scenarioData.worldInfos) {
              try {
                await scenarioService.createWorldInfoEntry(scenario.id, userId, entryData)
              } catch (entryError) {
                errors.push({
                  type: 'system',
                  message: `导入世界信息条目失败: ${entryError.message}`,
                  scenarioName: scenarioData.name,
                  entryTitle: entryData.title
                })
              }
            }
          }

          importedScenarios.push(scenario)
          successCount++
        } catch (error) {
          failureCount++
          errors.push({
            type: 'system',
            message: `导入剧本失败: ${error.message}`,
            scenarioName: scenarioData.name
          })
        }
      }
    }

    return { successCount, failureCount, importedScenarios, errors }
  }

  /**
   * 生成唯一的剧本名称
   */
  private async generateUniqueName(userId: string, baseName: string): Promise<string> {
    let counter = 1
    let newName = `${baseName} (${counter})`

    while (true) {
      const existing = await prisma.scenario.findFirst({
        where: {
          userId,
          name: newName,
          isActive: true
        }
      })

      if (!existing) {
        return newName
      }

      counter++
      newName = `${baseName} (${counter})`
    }
  }

  /**
   * 合并剧本数据
   */
  private async mergeScenarios(existingScenario: any, newScenario: any): Promise<any> {
    // 简化的合并逻辑：保留现有剧本基本信息，合并世界信息条目
    return {
      id: existingScenario.id,
      name: existingScenario.name,
      description: existingScenario.description,
      content: existingScenario.content,
      isPublic: existingScenario.isPublic,
      tags: [...new Set([...existingScenario.tags, ...(newScenario.tags || [])])],
      category: existingScenario.category,
      language: existingScenario.language,
      worldInfos: [...(existingScenario.worldInfos || []), ...(newScenario.worldInfos || [])]
    }
  }

  /**
   * 创建导入历史记录
   */
  private async createImportHistory(
    userId: string,
    filename: string,
    format: string,
    status: string
  ): Promise<string> {
    // 实际实现中应该创建数据库记录
    // 这里返回一个模拟的ID
    return this.generateImportId()
  }

  /**
   * 更新导入历史记录
   */
  private async updateImportHistory(importId: string, updates: any): Promise<void> {
    // 实际实现中应该更新数据库记录
    console.log(`更新导入历史 ${importId}:`, updates)
  }

  /**
   * 获取导入历史记录
   */
  private async getImportHistoryById(importId: string, userId: string): Promise<ImportHistoryEntry | null> {
    // 实际实现中应该从数据库查询
    return null
  }

  /**
   * 生成导入ID
   */
  private generateImportId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成导出ID
   */
  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 计算数据校验和
   */
  private calculateChecksum(data: string): string {
    // 简化的校验和实现，实际项目中应该使用更安全的算法
    let hash = 0
    if (data.length === 0) return hash.toString()

    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16)
  }
}

export const importExportService = new ImportExportService()