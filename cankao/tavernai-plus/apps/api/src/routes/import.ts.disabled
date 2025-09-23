/**
 * 导入导出路由
 * 提供剧本数据的导入导出API端点
 */

import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import * as yaml from 'js-yaml'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { importExportService } from '../services/importExportService'
import { importValidators } from '../validators/importValidators'
import { scenarioService } from '../services/scenarioService'

const router = Router()

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/json',
      'text/plain',
      'text/yaml',
      'application/x-yaml',
      'text/x-yaml'
    ]

    if (allowedTypes.includes(file.mimetype) ||
        file.originalname.match(/\.(json|yaml|yml|txt)$/i)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型。请上传 JSON、YAML 或 TXT 文件。'), false)
    }
  }
})

// Zod验证schemas
const importOptionsSchema = z.object({
  format: z.enum(['sillytavern', 'json', 'yaml', 'enhanced']),
  conflictResolution: z.enum(['skip', 'overwrite', 'merge', 'rename']).default('skip'),
  validateData: z.boolean().default(true),
  preserveIds: z.boolean().default(false),
  batchSize: z.number().int().min(1).max(50).default(10)
})

const exportOptionsSchema = z.object({
  format: z.enum(['sillytavern', 'json', 'yaml', 'enhanced']).default('json'),
  includeWorldInfo: z.boolean().default(true),
  includeMetadata: z.boolean().default(false),
  compression: z.boolean().default(false)
})

const batchExportSchema = z.object({
  scenarioIds: z.array(z.string()).min(1, '至少需要选择一个剧本').max(100, '最多只能选择100个剧本'),
  options: exportOptionsSchema
})

const rollbackSchema = z.object({
  importId: z.string().min(1, '导入ID不能为空')
})

/**
 * POST /api/import/scenarios - 导入剧本数据
 */
router.post('/scenarios', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    let importData: any
    let filename = 'unknown'

    // 解析导入选项
    const optionsResult = importOptionsSchema.safeParse(
      req.body.options ? JSON.parse(req.body.options) : req.body
    )

    if (!optionsResult.success) {
      return res.status(400).json({
        success: false,
        error: '导入选项验证失败',
        details: optionsResult.error.errors
      })
    }

    const options = optionsResult.data

    // 处理文件上传或直接数据
    if (req.file) {
      filename = req.file.originalname
      const fileContent = req.file.buffer.toString('utf8')

      try {
        // 根据文件类型解析数据
        if (filename.match(/\.(json)$/i)) {
          importData = JSON.parse(fileContent)
          if (options.format === 'auto') options.format = 'json'
        } else if (filename.match(/\.(yaml|yml)$/i)) {
          importData = yaml.load(fileContent)
          if (options.format === 'auto') options.format = 'yaml'
        } else {
          // 尝试JSON解析，失败则尝试YAML
          try {
            importData = JSON.parse(fileContent)
            if (options.format === 'auto') options.format = 'json'
          } catch {
            importData = yaml.load(fileContent)
            if (options.format === 'auto') options.format = 'yaml'
          }
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: '文件解析失败',
          details: parseError.message
        })
      }
    } else if (req.body.data) {
      // 直接数据导入
      importData = req.body.data
      filename = 'direct_import'
    } else {
      return res.status(400).json({
        success: false,
        error: '请提供要导入的数据或文件'
      })
    }

    // 预验证数据
    if (options.validateData) {
      const validationResult = await importValidators.validateImportData(importData, options.format)

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: '数据验证失败',
          validation: validationResult
        })
      }

      // 如果有警告，返回给客户端确认
      if (validationResult.warnings.length > 0) {
        const criticalWarnings = validationResult.warnings.filter(w =>
          w.type === 'data_loss' || w.type === 'compatibility'
        )

        if (criticalWarnings.length > 0 && !req.body.ignoreWarnings) {
          return res.status(200).json({
            success: false,
            requiresConfirmation: true,
            message: '检测到数据验证警告，请确认是否继续',
            validation: validationResult
          })
        }
      }
    }

    // 执行导入
    const importResult = await importExportService.importScenarios(
      userId,
      importData,
      options,
      filename
    )

    if (importResult.success) {
      res.status(200).json({
        success: true,
        message: `导入完成，成功导入 ${importResult.successCount} 个剧本`,
        data: importResult
      })
    } else {
      res.status(400).json({
        success: false,
        error: '导入失败',
        data: importResult
      })
    }
  } catch (error) {
    console.error('导入剧本失败:', error)
    res.status(500).json({
      success: false,
      error: '导入过程中发生错误',
      details: error.message
    })
  }
})

/**
 * POST /api/import/scenarios/:id/export - 导出单个剧本
 */
router.post('/scenarios/:id/export', authenticate, validate(exportOptionsSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const options = req.body

    const exportResult = await importExportService.exportScenario(id, userId, options)

    if (exportResult.success) {
      // 设置下载响应头
      const filename = `scenario_${id}.${options.format === 'yaml' ? 'yaml' : 'json'}`
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Type',
        options.format === 'yaml' ? 'application/x-yaml' : 'application/json'
      )

      if (options.format === 'yaml') {
        res.send(yaml.dump(exportResult.data))
      } else {
        res.json(exportResult.data)
      }
    } else {
      res.status(400).json({
        success: false,
        error: '导出失败'
      })
    }
  } catch (error) {
    console.error('导出剧本失败:', error)

    if (error.message === '剧本不存在或无权限访问') {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: '导出过程中发生错误',
      details: error.message
    })
  }
})

/**
 * POST /api/import/scenarios/export/batch - 批量导出剧本
 */
router.post('/scenarios/export/batch', authenticate, validate(batchExportSchema), async (req: AuthRequest, res) => {
  try {
    const { scenarioIds, options } = req.body
    const userId = req.user!.id

    const exportResult = await importExportService.exportScenarios(scenarioIds, userId, options)

    if (exportResult.success) {
      // 设置下载响应头
      const filename = `scenarios_batch_${Date.now()}.${options.format === 'yaml' ? 'yaml' : 'json'}`
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Type',
        options.format === 'yaml' ? 'application/x-yaml' : 'application/json'
      )
      res.setHeader('X-Export-Metadata', JSON.stringify(exportResult.metadata))

      if (options.format === 'yaml') {
        res.send(yaml.dump(exportResult.data))
      } else {
        res.json(exportResult.data)
      }
    } else {
      res.status(400).json({
        success: false,
        error: '批量导出失败'
      })
    }
  } catch (error) {
    console.error('批量导出剧本失败:', error)

    if (error.message === '没有找到可导出的剧本') {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: '批量导出过程中发生错误',
      details: error.message
    })
  }
})

/**
 * GET /api/import/history - 获取导入历史记录
 */
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const history = await importExportService.getImportHistory(userId, page, limit)

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          total: history.length // 简化实现
        }
      }
    })
  } catch (error) {
    console.error('获取导入历史失败:', error)
    res.status(500).json({
      success: false,
      error: '获取导入历史失败'
    })
  }
})

/**
 * POST /api/import/rollback - 回滚导入操作
 */
router.post('/rollback', authenticate, validate(rollbackSchema), async (req: AuthRequest, res) => {
  try {
    const { importId } = req.body
    const userId = req.user!.id

    const success = await importExportService.rollbackImport(importId, userId)

    if (success) {
      res.json({
        success: true,
        message: '导入操作已成功回滚'
      })
    } else {
      res.status(400).json({
        success: false,
        error: '回滚操作失败'
      })
    }
  } catch (error) {
    console.error('回滚导入失败:', error)
    res.status(500).json({
      success: false,
      error: '回滚过程中发生错误',
      details: error.message
    })
  }
})

/**
 * POST /api/import/validate - 验证导入数据
 */
router.post('/validate', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    let data: any
    let format = req.body.format || 'json'

    // 处理文件上传或直接数据
    if (req.file) {
      const fileContent = req.file.buffer.toString('utf8')
      const filename = req.file.originalname

      try {
        if (filename.match(/\.(json)$/i)) {
          data = JSON.parse(fileContent)
          format = 'json'
        } else if (filename.match(/\.(yaml|yml)$/i)) {
          data = yaml.load(fileContent)
          format = 'yaml'
        } else {
          // 尝试自动检测格式
          try {
            data = JSON.parse(fileContent)
            format = 'json'
          } catch {
            data = yaml.load(fileContent)
            format = 'yaml'
          }
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: '文件解析失败',
          details: parseError.message
        })
      }
    } else if (req.body.data) {
      data = req.body.data
    } else {
      return res.status(400).json({
        success: false,
        error: '请提供要验证的数据或文件'
      })
    }

    // 执行验证
    const validationResult = await importValidators.validateImportData(data, format)

    res.json({
      success: true,
      data: validationResult
    })
  } catch (error) {
    console.error('验证数据失败:', error)
    res.status(500).json({
      success: false,
      error: '验证过程中发生错误',
      details: error.message
    })
  }
})

/**
 * POST /api/import/detect-conflicts - 检测导入冲突
 */
router.post('/detect-conflicts', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { importData, format } = req.body

    if (!importData || !format) {
      return res.status(400).json({
        success: false,
        error: '请提供导入数据和格式信息'
      })
    }

    // 获取用户现有剧本
    const { scenarios: existingScenarios } = await scenarioService.getScenarios(userId, {
      page: 1,
      limit: 1000 // 获取所有剧本进行冲突检测
    })

    // 转换导入数据为标准格式进行比较
    // 这里简化处理，实际应该使用formatConverters
    const importScenarios = Array.isArray(importData) ? importData : [importData]

    const conflicts = await importValidators.detectConflicts(existingScenarios, importScenarios)

    res.json({
      success: true,
      data: conflicts
    })
  } catch (error) {
    console.error('检测冲突失败:', error)
    res.status(500).json({
      success: false,
      error: '冲突检测过程中发生错误',
      details: error.message
    })
  }
})

/**
 * GET /api/import/formats - 获取支持的格式信息
 */
router.get('/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      importFormats: [
        {
          key: 'sillytavern',
          name: 'SillyTavern World Info',
          description: '完全兼容SillyTavern的世界信息格式',
          extensions: ['.json'],
          features: ['世界信息条目', '关键词匹配', '优先级设置']
        },
        {
          key: 'json',
          name: 'JSON标准格式',
          description: 'TavernAI Plus标准JSON格式',
          extensions: ['.json'],
          features: ['完整剧本数据', '世界信息条目', '元数据']
        },
        {
          key: 'yaml',
          name: 'YAML格式',
          description: '易读的YAML格式',
          extensions: ['.yaml', '.yml'],
          features: ['可读性强', '支持注释', '层次结构清晰']
        },
        {
          key: 'enhanced',
          name: 'TavernAI Plus增强格式',
          description: '包含扩展字段的增强格式',
          extensions: ['.json'],
          features: ['完整数据', '扩展字段', '版本信息', '数据完整性校验']
        }
      ],
      exportFormats: [
        {
          key: 'sillytavern',
          name: 'SillyTavern World Info',
          description: '导出为SillyTavern兼容格式',
          extensions: ['.json'],
          limitations: ['部分字段可能丢失', '不支持剧本详细内容']
        },
        {
          key: 'json',
          name: 'JSON标准格式',
          description: '导出为标准JSON格式',
          extensions: ['.json'],
          limitations: []
        },
        {
          key: 'yaml',
          name: 'YAML格式',
          description: '导出为YAML格式',
          extensions: ['.yaml'],
          limitations: []
        },
        {
          key: 'enhanced',
          name: 'TavernAI Plus增强格式',
          description: '导出为包含扩展信息的增强格式',
          extensions: ['.json'],
          limitations: []
        }
      ],
      conflictResolutions: [
        {
          key: 'skip',
          name: '跳过',
          description: '跳过冲突的剧本，不导入'
        },
        {
          key: 'overwrite',
          name: '覆盖',
          description: '覆盖现有剧本'
        },
        {
          key: 'rename',
          name: '重命名',
          description: '自动重命名导入的剧本'
        },
        {
          key: 'merge',
          name: '合并',
          description: '合并剧本内容（保留现有剧本，合并世界信息）'
        }
      ]
    }
  })
})

export default router