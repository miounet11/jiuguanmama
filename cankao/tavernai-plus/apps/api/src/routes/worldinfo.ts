import { Router } from 'express'
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../server'

const router = Router()

// WorldInfo条目接口
interface WorldInfoEntry {
  id: string
  bookId: string
  title: string
  content: string
  keywords: string[]
  secondaryKeywords?: string[]
  keywordFilter: 'AND' | 'OR' | 'NOT'
  priority: number
  order: number
  isEnabled: boolean
  probability: number
  insertionPosition: 'before' | 'after' | 'top' | 'bottom'
  insertionDepth: number
  contextLength: number
  preventRecursion: boolean
  selectiveLogic: string
  constant: boolean
  comment?: string
  createdAt: string
  updatedAt: string
}

// WorldInfo Book接口
interface WorldInfoBook {
  id: string
  name: string
  description?: string
  isGlobal: boolean
  createdBy: string
  characterIds: string[]
  entries: WorldInfoEntry[]
  metadata: {
    version: number
    category: string
    tags: string[]
    totalEntries: number
    activeEntries: number
  }
  createdAt: string
  updatedAt: string
}

// 获取所有WorldInfo Books
router.get('/books', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { includeGlobal = true, characterId } = req.query

    // TODO: 从数据库获取，这里先返回示例数据
    const sampleBooks: WorldInfoBook[] = [
      {
        id: 'book_1',
        name: '幻想世界设定集',
        description: '包含魔法系统、种族设定、地理信息等',
        isGlobal: true,
        createdBy: req.user!.id,
        characterIds: [],
        entries: [
          {
            id: 'entry_1',
            bookId: 'book_1',
            title: '魔法系统',
            content: '这个世界的魔法分为元素魔法、神圣魔法和禁忌魔法三大类。元素魔法包括火、水、土、风四种基本元素...',
            keywords: ['魔法', '法术', '咒语'],
            keywordFilter: 'OR',
            priority: 100,
            order: 1,
            isEnabled: true,
            probability: 100,
            insertionPosition: 'before',
            insertionDepth: 3,
            contextLength: 500,
            preventRecursion: true,
            selectiveLogic: '',
            constant: false,
            comment: '核心魔法系统设定',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        metadata: {
          version: 1,
          category: 'fantasy',
          tags: ['魔法', '幻想', '设定'],
          totalEntries: 1,
          activeEntries: 1
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    res.json({
      success: true,
      books: sampleBooks,
      total: sampleBooks.length
    })
  } catch (error) {
    next(error)
  }
})

// 获取单个WorldInfo Book
router.get('/books/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const { includeEntries = true } = req.query

    // TODO: 从数据库获取
    res.status(404).json({
      success: false,
      message: 'WorldInfo Book不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 创建新的WorldInfo Book
router.post('/books', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      name,
      description,
      isGlobal = false,
      characterIds = [],
      metadata = {}
    } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '书名不能为空'
      })
    }

    const newBook: WorldInfoBook = {
      id: `book_${Date.now()}`,
      name,
      description,
      isGlobal,
      createdBy: req.user!.id,
      characterIds,
      entries: [],
      metadata: {
        version: 1,
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        totalEntries: 0,
        activeEntries: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // TODO: 保存到数据库

    res.json({
      success: true,
      book: newBook,
      message: 'WorldInfo Book创建成功'
    })
  } catch (error) {
    next(error)
  }
})

// 更新WorldInfo Book
router.put('/books/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // TODO: 验证权限并更新
    res.status(404).json({
      success: false,
      message: 'WorldInfo Book不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 删除WorldInfo Book
router.delete('/books/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // TODO: 验证权限并删除
    res.status(404).json({
      success: false,
      message: 'WorldInfo Book不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 获取Book中的所有条目
router.get('/books/:bookId/entries', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { bookId } = req.params
    const { enabled, keyword } = req.query

    // TODO: 从数据库获取条目
    res.json({
      success: true,
      entries: [],
      total: 0
    })
  } catch (error) {
    next(error)
  }
})

// 创建新的WorldInfo条目
router.post('/books/:bookId/entries', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { bookId } = req.params
    const {
      title,
      content,
      keywords = [],
      secondaryKeywords = [],
      keywordFilter = 'OR',
      priority = 100,
      isEnabled = true,
      probability = 100,
      insertionPosition = 'before',
      insertionDepth = 3,
      contextLength = 500,
      preventRecursion = true,
      constant = false,
      comment = ''
    } = req.body

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      })
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要一个关键词'
      })
    }

    const newEntry: WorldInfoEntry = {
      id: `entry_${Date.now()}`,
      bookId,
      title,
      content,
      keywords,
      secondaryKeywords,
      keywordFilter,
      priority,
      order: 0, // TODO: 计算当前最大order + 1
      isEnabled,
      probability,
      insertionPosition,
      insertionDepth,
      contextLength,
      preventRecursion,
      selectiveLogic: '',
      constant,
      comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // TODO: 保存到数据库

    res.json({
      success: true,
      entry: newEntry,
      message: 'WorldInfo条目创建成功'
    })
  } catch (error) {
    next(error)
  }
})

// 更新WorldInfo条目
router.put('/books/:bookId/entries/:entryId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { bookId, entryId } = req.params

    // TODO: 验证权限并更新
    res.status(404).json({
      success: false,
      message: 'WorldInfo条目不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 删除WorldInfo条目
router.delete('/books/:bookId/entries/:entryId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { bookId, entryId } = req.params

    // TODO: 验证权限并删除
    res.status(404).json({
      success: false,
      message: 'WorldInfo条目不存在'
    })
  } catch (error) {
    next(error)
  }
})

// 重新排序条目
router.post('/books/:bookId/entries/reorder', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { bookId } = req.params
    const { entryIds } = req.body

    if (!Array.isArray(entryIds)) {
      return res.status(400).json({
        success: false,
        message: '条目ID列表格式错误'
      })
    }

    // TODO: 更新条目顺序
    res.json({
      success: true,
      message: '条目顺序更新成功'
    })
  } catch (error) {
    next(error)
  }
})

// 导入WorldInfo (SillyTavern格式)
router.post('/books/import', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { worldInfoData, bookName } = req.body

    if (!worldInfoData) {
      return res.status(400).json({
        success: false,
        message: '请提供WorldInfo数据'
      })
    }

    // 解析SillyTavern WorldInfo格式
    let parsedData
    if (typeof worldInfoData === 'string') {
      try {
        parsedData = JSON.parse(worldInfoData)
      } catch {
        return res.status(400).json({
          success: false,
          message: '无效的JSON格式'
        })
      }
    } else {
      parsedData = worldInfoData
    }

    // 转换格式并创建新的WorldInfo Book
    const importedBook: WorldInfoBook = {
      id: `book_${Date.now()}`,
      name: bookName || '导入的WorldInfo',
      description: '从SillyTavern导入',
      isGlobal: false,
      createdBy: req.user!.id,
      characterIds: [],
      entries: [], // TODO: 转换条目格式
      metadata: {
        version: 1,
        category: 'imported',
        tags: ['导入', 'SillyTavern'],
        totalEntries: 0,
        activeEntries: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // TODO: 保存到数据库

    res.json({
      success: true,
      book: importedBook,
      message: 'WorldInfo导入成功'
    })
  } catch (error) {
    next(error)
  }
})

// 导出WorldInfo (SillyTavern格式)
router.get('/books/:id/export', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // TODO: 从数据库获取WorldInfo Book
    // 转换为SillyTavern格式并返回

    const sillytavernFormat = {
      entries: {},
      originalData: {},
      uid: Date.now()
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="worldinfo_${id}.json"`)
    res.json(sillytavernFormat)
  } catch (error) {
    next(error)
  }
})

// 搜索WorldInfo条目
router.get('/search', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { query, bookId, keywords } = req.query

    if (!query) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      })
    }

    // TODO: 在数据库中搜索匹配的条目
    res.json({
      success: true,
      results: [],
      total: 0,
      query: query
    })
  } catch (error) {
    next(error)
  }
})

// 测试关键词匹配
router.post('/test-keywords', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { text, bookIds = [] } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '请提供测试文本'
      })
    }

    // TODO: 模拟关键词匹配逻辑
    const matchedEntries = [
      {
        entryId: 'entry_1',
        title: '示例匹配条目',
        keywords: ['测试'],
        matchType: 'keyword',
        priority: 100,
        insertionPosition: 'before'
      }
    ]

    res.json({
      success: true,
      matches: matchedEntries,
      text: text,
      totalMatches: matchedEntries.length
    })
  } catch (error) {
    next(error)
  }
})

export default router
