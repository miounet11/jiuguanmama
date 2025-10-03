"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const scenarioService_1 = require("../services/scenarioService");
const validate_1 = require("../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const scenarioService = new scenarioService_1.ScenarioService();
// 验证schema
const createScenarioSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(1000),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isPublic: zod_1.z.boolean().optional(),
    worldInfo: zod_1.z.array(zod_1.z.object({
        key: zod_1.z.string(),
        value: zod_1.z.string(),
        priority: zod_1.z.number().min(0).max(1000).optional(),
        matchType: zod_1.z.enum(['exact', 'contains', 'regex', 'starts_with', 'ends_with']).optional(),
        isEnabled: zod_1.z.boolean().optional()
    })).optional()
});
const updateScenarioSchema = createScenarioSchema.partial();
const scenarioQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional(),
    limit: zod_1.z.string().transform(Number).optional(),
    sort: zod_1.z.enum(['created', 'updated', 'rating', 'usage']).optional(),
    search: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    isPublic: zod_1.z.string().transform(val => val === 'true').optional(),
    tags: zod_1.z.string().optional()
});
const worldInfoSchema = zod_1.z.object({
    key: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1),
    priority: zod_1.z.number().min(0).max(1000).optional(),
    matchType: zod_1.z.enum(['exact', 'contains', 'regex', 'starts_with', 'ends_with']).optional(),
    isEnabled: zod_1.z.boolean().optional(),
    groupId: zod_1.z.string().optional()
});
// GET /scenarios - 获取剧本列表
router.get('/', auth_1.optionalAuth, (0, validate_1.validate)(scenarioQuerySchema, 'query'), async (req, res) => {
    try {
        const userId = req.user?.id;
        const rawQuery = req.query;
        // 确保数字参数的正确类型转换
        const query = {
            ...rawQuery,
            page: rawQuery.page ? parseInt(rawQuery.page) : 1,
            limit: rawQuery.limit ? parseInt(rawQuery.limit) : 20,
            tags: rawQuery.tags ? rawQuery.tags.split(',') : undefined
        };
        const result = await scenarioService.getScenarios(userId, query);
        res.json({
            success: true,
            data: {
                scenarios: result.scenarios,
                pagination: {
                    page: query.page || 1,
                    limit: query.limit || 20,
                    total: result.total,
                    totalPages: Math.ceil(result.total / (query.limit || 20))
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching scenarios:', error);
        res.status(500).json({
            success: false,
            error: '获取剧本列表失败'
        });
    }
});
// GET /scenarios/categories - 获取剧本分类
router.get('/categories', async (req, res) => {
    try {
        const categories = await scenarioService.getCategories();
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: '获取分类失败'
        });
    }
});
// GET /scenarios/tags - 获取标签列表
router.get('/tags', async (req, res) => {
    try {
        const tags = await scenarioService.getTags();
        res.json({
            success: true,
            data: tags
        });
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({
            success: false,
            error: '获取标签失败'
        });
    }
});
// GET /scenarios/stats - 获取剧本统计
router.get('/stats', auth_1.optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const stats = await scenarioService.getScenarioStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching scenario stats:', error);
        res.status(500).json({
            success: false,
            error: '获取统计数据失败'
        });
    }
});
// GET /scenarios/:id - 获取特定剧本详情
router.get('/:id', auth_1.optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const scenario = await scenarioService.getScenarioById(id, userId);
        if (!scenario) {
            return res.status(404).json({
                success: false,
                error: '剧本不存在'
            });
        }
        res.json({
            success: true,
            data: scenario
        });
    }
    catch (error) {
        console.error('Error fetching scenario:', error);
        res.status(500).json({
            success: false,
            error: '获取剧本详情失败'
        });
    }
});
// POST /scenarios - 创建新剧本
router.post('/', auth_1.authenticate, (0, validate_1.validate)(createScenarioSchema, 'body'), async (req, res) => {
    try {
        const userId = req.user.id;
        const scenarioData = req.body;
        const scenario = await scenarioService.createScenario(userId, scenarioData);
        res.status(201).json({
            success: true,
            data: scenario
        });
    }
    catch (error) {
        console.error('Error creating scenario:', error);
        res.status(500).json({
            success: false,
            error: '创建剧本失败'
        });
    }
});
// PUT /scenarios/:id - 更新剧本
router.put('/:id', auth_1.authenticate, (0, validate_1.validate)(updateScenarioSchema, 'body'), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;
        const scenario = await scenarioService.updateScenario(id, userId, updateData);
        if (!scenario) {
            return res.status(404).json({
                success: false,
                error: '剧本不存在或无权限修改'
            });
        }
        res.json({
            success: true,
            data: scenario
        });
    }
    catch (error) {
        console.error('Error updating scenario:', error);
        res.status(500).json({
            success: false,
            error: '更新剧本失败'
        });
    }
});
// DELETE /scenarios/:id - 删除剧本
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await scenarioService.deleteScenario(id, userId);
        res.json({
            success: true,
            message: '剧本删除成功'
        });
    }
    catch (error) {
        console.error('Error deleting scenario:', error);
        res.status(500).json({
            success: false,
            error: '删除剧本失败'
        });
    }
});
// POST /scenarios/:id/clone - 克隆剧本
router.post('/:id/clone', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const clonedScenario = await scenarioService.cloneScenario(id, userId);
        if (!clonedScenario) {
            return res.status(404).json({
                success: false,
                error: '剧本不存在或无权限克隆'
            });
        }
        res.status(201).json({
            success: true,
            data: clonedScenario
        });
    }
    catch (error) {
        console.error('Error cloning scenario:', error);
        res.status(500).json({
            success: false,
            error: '克隆剧本失败'
        });
    }
});
// =================
// 世界信息条目管理
// =================
// GET /scenarios/:id/worldinfo - 获取剧本的世界信息条目
router.get('/:id/worldinfo', auth_1.optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const worldInfoEntries = await scenarioService.getWorldInfoEntries(id, userId);
        res.json({
            success: true,
            data: worldInfoEntries
        });
    }
    catch (error) {
        console.error('Error fetching world info entries:', error);
        res.status(500).json({
            success: false,
            error: '获取世界信息失败'
        });
    }
});
// POST /scenarios/:id/worldinfo - 添加世界信息条目
router.post('/:id/worldinfo', auth_1.authenticate, (0, validate_1.validate)(worldInfoSchema, 'body'), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const entryData = req.body;
        const entry = await scenarioService.createWorldInfoEntry(id, userId, entryData);
        if (!entry) {
            return res.status(404).json({
                success: false,
                error: '剧本不存在或无权限修改'
            });
        }
        res.status(201).json({
            success: true,
            data: entry
        });
    }
    catch (error) {
        console.error('Error creating world info entry:', error);
        res.status(500).json({
            success: false,
            error: '添加世界信息失败'
        });
    }
});
// PUT /scenarios/:scenarioId/worldinfo/:entryId - 更新世界信息条目
router.put('/:scenarioId/worldinfo/:entryId', auth_1.authenticate, (0, validate_1.validate)(worldInfoSchema.partial(), 'body'), async (req, res) => {
    try {
        const { scenarioId, entryId } = req.params;
        const userId = req.user.id;
        const updateData = req.body;
        const entry = await scenarioService.updateWorldInfoEntry(scenarioId, entryId, userId, updateData);
        if (!entry) {
            return res.status(404).json({
                success: false,
                error: '世界信息条目不存在或无权限修改'
            });
        }
        res.json({
            success: true,
            data: entry
        });
    }
    catch (error) {
        console.error('Error updating world info entry:', error);
        res.status(500).json({
            success: false,
            error: '更新世界信息失败'
        });
    }
});
// DELETE /scenarios/:scenarioId/worldinfo/:entryId - 删除世界信息条目
router.delete('/:scenarioId/worldinfo/:entryId', auth_1.authenticate, async (req, res) => {
    try {
        const { scenarioId, entryId } = req.params;
        const userId = req.user.id;
        await scenarioService.deleteWorldInfoEntry(scenarioId, entryId, userId);
        res.json({
            success: true,
            message: '世界信息删除成功'
        });
    }
    catch (error) {
        console.error('Error deleting world info entry:', error);
        res.status(500).json({
            success: false,
            error: '删除世界信息失败'
        });
    }
});
// POST /scenarios/:id/worldinfo/test - 测试世界信息匹配
router.post('/:id/worldinfo/test', auth_1.optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const userId = req.user?.id;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                error: '测试文本不能为空'
            });
        }
        const matchResults = await scenarioService.testWorldInfoMatching(id, text, userId);
        res.json({
            success: true,
            data: matchResults
        });
    }
    catch (error) {
        console.error('Error testing world info matching:', error);
        res.status(500).json({
            success: false,
            error: '测试匹配失败'
        });
    }
});
// PUT /scenarios/:id/worldinfo/reorder - 重新排序世界信息条目
router.put('/:id/worldinfo/reorder', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { entryIds } = req.body;
        const userId = req.user.id;
        if (!Array.isArray(entryIds)) {
            return res.status(400).json({
                success: false,
                error: '条目ID列表格式错误'
            });
        }
        const success = await scenarioService.reorderWorldInfoEntries(id, entryIds, userId);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: '剧本不存在或无权限修改'
            });
        }
        res.json({
            success: true,
            message: '重新排序成功'
        });
    }
    catch (error) {
        console.error('Error reordering world info entries:', error);
        res.status(500).json({
            success: false,
            error: '重新排序失败'
        });
    }
});
exports.default = router;
//# sourceMappingURL=scenarios.js.map