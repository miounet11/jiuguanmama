/**
 * 导入导出 API 服务
 * 提供剧本数据的导入导出功能
 */

import apiClient from './api'

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
  importedScenarios: any[]
  errors: any[]
  warnings: any[]
  metadata: any
}

export interface ExportResult {
  success: boolean
  exportId: string
  data: any
  format: string
  size: number
  checksum: string
  metadata: any
}

export interface ValidationResult {
  isValid: boolean
  errors: any[]
  warnings: any[]
  metadata: any
}

export interface ConflictDetection {
  duplicateNames: any[]
  similarContent: any[]
  keywordOverlaps: any[]
}

class ImportExportAPI {
  /**
   * 导入剧本数据
   */
  async importScenarios(formData: FormData): Promise<{
    success: boolean
    data?: ImportResult
    error?: string
    requiresConfirmation?: boolean
    validation?: ValidationResult
  }> {
    try {
      const response = await apiClient.post('/import/scenarios', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5分钟超时
      })

      return response.data
    } catch (error: any) {
      console.error('导入剧本失败:', error)

      if (error.response?.data) {
        return error.response.data
      }

      return {
        success: false,
        error: error.message || '导入过程中发生网络错误'
      }
    }
  }

  /**
   * 导出单个剧本
   */
  async exportScenario(scenarioId: string, options: ExportOptions): Promise<Blob | null> {
    try {
      const response = await apiClient.post(`/import/scenarios/${scenarioId}/export`, options, {
        responseType: 'blob',
        timeout: 60000 // 1分钟超时
      })

      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition']
      let filename = `scenario_${scenarioId}.${options.format === 'yaml' ? 'yaml' : 'json'}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // 创建下载链接
      this.downloadBlob(response.data, filename)

      return response.data
    } catch (error: any) {
      console.error('导出剧本失败:', error)

      if (error.response?.data) {
        // 如果是错误响应，尝试解析错误信息
        const errorText = await error.response.data.text()
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || '导出失败')
        } catch {
          throw new Error('导出过程中发生错误')
        }
      }

      throw new Error(error.message || '导出过程中发生网络错误')
    }
  }

  /**
   * 批量导出剧本
   */
  async exportScenarios(data: {
    scenarioIds: string[]
    options: ExportOptions
  }): Promise<Blob | null> {
    try {
      const response = await apiClient.post('/import/scenarios/export/batch', data, {
        responseType: 'blob',
        timeout: 300000 // 5分钟超时
      })

      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition']
      let filename = `scenarios_batch_${Date.now()}.${data.options.format === 'yaml' ? 'yaml' : 'json'}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // 创建下载链接
      this.downloadBlob(response.data, filename)

      return response.data
    } catch (error: any) {
      console.error('批量导出剧本失败:', error)

      if (error.response?.data) {
        // 如果是错误响应，尝试解析错误信息
        const errorText = await error.response.data.text()
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || '批量导出失败')
        } catch {
          throw new Error('批量导出过程中发生错误')
        }
      }

      throw new Error(error.message || '批量导出过程中发生网络错误')
    }
  }

  /**
   * 获取导入历史记录
   */
  async getImportHistory(page: number = 1, limit: number = 20): Promise<{
    success: boolean
    data?: {
      history: any[]
      pagination: any
    }
    error?: string
  }> {
    try {
      const response = await apiClient.get('/import/history', {
        params: { page, limit }
      })

      return response.data
    } catch (error: any) {
      console.error('获取导入历史失败:', error)

      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取导入历史失败'
      }
    }
  }

  /**
   * 回滚导入操作
   */
  async rollbackImport(importId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const response = await apiClient.post('/import/rollback', {
        importId
      })

      return response.data
    } catch (error: any) {
      console.error('回滚导入失败:', error)

      return {
        success: false,
        error: error.response?.data?.error || error.message || '回滚导入失败'
      }
    }
  }

  /**
   * 验证导入数据
   */
  async validateData(formData: FormData): Promise<{
    success: boolean
    data?: ValidationResult
    error?: string
  }> {
    try {
      const response = await apiClient.post('/import/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 1分钟超时
      })

      return response.data
    } catch (error: any) {
      console.error('验证数据失败:', error)

      return {
        success: false,
        error: error.response?.data?.error || error.message || '验证数据失败'
      }
    }
  }

  /**
   * 检测导入冲突
   */
  async detectConflicts(data: {
    importData: any
    format: string
  }): Promise<{
    success: boolean
    data?: ConflictDetection
    error?: string
  }> {
    try {
      const response = await apiClient.post('/import/detect-conflicts', data)

      return response.data
    } catch (error: any) {
      console.error('检测冲突失败:', error)

      return {
        success: false,
        error: error.response?.data?.error || error.message || '检测冲突失败'
      }
    }
  }

  /**
   * 获取支持的格式信息
   */
  async getFormats(): Promise<{
    success: boolean
    data?: {
      importFormats: any[]
      exportFormats: any[]
      conflictResolutions: any[]
    }
    error?: string
  }> {
    try {
      const response = await apiClient.get('/import/formats')

      return response.data
    } catch (error: any) {
      console.error('获取格式信息失败:', error)

      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取格式信息失败'
      }
    }
  }

  /**
   * 下载 Blob 数据
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename

    // 添加到 DOM 并触发点击
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 解析导入预览数据
   */
  parseImportPreview(data: any, format: string): {
    scenarioCount: number
    worldInfoCount: number
    estimatedSize: string
  } {
    let scenarioCount = 0
    let worldInfoCount = 0

    switch (format) {
      case 'sillytavern':
        const worldInfos = Array.isArray(data) ? data : [data]
        scenarioCount = worldInfos.length
        worldInfoCount = worldInfos.reduce((total, wi) => total + (wi.entries?.length || 0), 0)
        break

      case 'json':
      case 'yaml':
      case 'enhanced':
        const scenarios = Array.isArray(data) ? data : [data]
        scenarioCount = scenarios.length
        worldInfoCount = scenarios.reduce(
          (total, scenario) => total + (scenario.worldInfos?.length || 0),
          0
        )
        break
    }

    const estimatedSize = this.formatFileSize(JSON.stringify(data).length)

    return {
      scenarioCount,
      worldInfoCount,
      estimatedSize
    }
  }

  /**
   * 验证导入文件格式
   */
  validateImportFile(file: File): {
    isValid: boolean
    error?: string
    detectedFormat?: string
  } {
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: '文件大小不能超过 50MB'
      }
    }

    const filename = file.name.toLowerCase()
    let detectedFormat: string | undefined

    if (filename.endsWith('.json')) {
      detectedFormat = 'json'
    } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      detectedFormat = 'yaml'
    } else if (filename.endsWith('.txt')) {
      // TXT 文件需要根据内容判断格式
      detectedFormat = 'json' // 默认假设为 JSON
    } else {
      return {
        isValid: false,
        error: '不支持的文件格式，请上传 JSON、YAML 或 TXT 文件'
      }
    }

    return {
      isValid: true,
      detectedFormat
    }
  }

  /**
   * 生成导出文件名
   */
  generateExportFilename(
    scenarioNames: string[],
    format: string,
    isBatch: boolean = false
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const extension = format === 'yaml' ? 'yaml' : 'json'

    if (isBatch || scenarioNames.length > 1) {
      return `scenarios_export_${timestamp}.${extension}`
    } else {
      const safeName = scenarioNames[0]
        ?.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')
        ?.substring(0, 50) || 'scenario'
      return `${safeName}_${timestamp}.${extension}`
    }
  }
}

export const importExportApi = new ImportExportAPI()
export default importExportApi