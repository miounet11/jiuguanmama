"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const guidance_1 = require("../services/guidance");
const summon_1 = require("../services/summon");
const worldinfo_1 = require("../services/worldinfo");
const storybook_1 = require("../services/storybook");
const character_generator_1 = require("../services/character-generator");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// ==================== 指导回复 API ====================
/**
 * 应用指导回复
 */
router.post('/guidance/apply', auth_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId, messageId, guidance } = req.body;
        // 构建指导提示
        const guidancePrompt = guidance_1.guidanceService.buildGuidancePrompt({
            sessionId,
            messageId,
            guidance
        });
        // 保存指导历史
        if (messageId) {
            await guidance_1.guidanceService.saveGuidanceHistory(sessionId, messageId, guidance);
        }
        res.json({
            success: true,
            guidancePrompt,
            message: '指导已应用，将影响下一条AI回复'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取指导建议
 */
router.get('/guidance/suggestions/:sessionId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        // 获取会话上下文
        const recentMessages = await server_1.prisma.message.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        const context = recentMessages.map(m => m.content).join(' ');
        const suggestions = await guidance_1.guidanceService.getSuggestions(sessionId, context);
        res.json({
            success: true,
            suggestions
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取指导模板
 */
router.get('/guidance/templates', auth_1.authenticate, async (req, res) => {
    const templates = guidance_1.guidanceService.getGuidanceTemplates();
    res.json({
        success: true,
        templates
    });
});
// ==================== 召唤角色 API ====================
/**
 * 召唤角色
 */
router.post('/summon/character', auth_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId, characterId, summonType, context } = req.body;
        const result = await summon_1.summonService.summonCharacter({
            sessionId,
            characterId,
            summonType,
            context
        });
        res.json({
            success: true,
            result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取可召唤的角色
 */
router.get('/summon/available/:sessionId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const characters = await summon_1.summonService.getSummonableCharacters(sessionId, req.user.id);
        res.json({
            success: true,
            characters
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取自动召唤建议
 */
router.post('/summon/suggestions', auth_1.authenticate, async (req, res, next) => {
    try {
        const { sessionId, context } = req.body;
        const suggestions = await summon_1.summonService.getAutoSummonSuggestions(sessionId, context);
        res.json({
            success: true,
            suggestions
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 世界观/知识库 API ====================
/**
 * 创建世界观
 */
router.post('/worldinfo/create', auth_1.authenticate, async (req, res, next) => {
    try {
        const worldInfo = await worldinfo_1.worldInfoService.createWorldInfo(req.user.id, req.body);
        res.json({
            success: true,
            worldInfo
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 添加知识条目
 */
router.post('/worldinfo/:worldInfoId/entry', auth_1.authenticate, async (req, res, next) => {
    try {
        const { worldInfoId } = req.params;
        const entry = await worldinfo_1.worldInfoService.addEntry(worldInfoId, req.body);
        res.json({
            success: true,
            entry
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 扫描并激活知识
 */
router.post('/worldinfo/scan', auth_1.authenticate, async (req, res, next) => {
    try {
        const { worldInfoId, messages, settings } = req.body;
        const activatedEntries = await worldinfo_1.worldInfoService.scanAndActivate(worldInfoId, messages, settings);
        res.json({
            success: true,
            activatedEntries
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 导入世界观
 */
router.post('/worldinfo/import', auth_1.authenticate, async (req, res, next) => {
    try {
        const { data, format } = req.body;
        const worldInfo = await worldinfo_1.worldInfoService.importWorldInfo(req.user.id, data, format);
        res.json({
            success: true,
            worldInfo
        });
    }
    catch (error) {
        next(error);
    }
});
// ==================== 故事书 API ====================
/**
 * 创建故事书
 */
router.post('/storybook/create', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterId, ...data } = req.body;
        const storybook = await storybook_1.storybookService.createStorybook(characterId, data);
        res.json({
            success: true,
            storybook
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 检查并激活故事条目
 */
router.post('/storybook/check', auth_1.authenticate, async (req, res, next) => {
    try {
        const context = {
            ...req.body,
            flags: new Set(req.body.flags || []),
            activationCount: new Map()
        };
        const entry = await storybook_1.storybookService.checkAndActivate(context);
        if (entry) {
            const formattedMessage = storybook_1.storybookService.formatEntryAsMessage(entry);
            res.json({
                success: true,
                activated: true,
                entry,
                message: formattedMessage
            });
        }
        else {
            res.json({
                success: true,
                activated: false
            });
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * 生成分支选项
 */
router.post('/storybook/branches', auth_1.authenticate, async (req, res, next) => {
    try {
        const { entry, context } = req.body;
        const options = await storybook_1.storybookService.generateBranchingOptions(entry, {
            ...context,
            flags: new Set(context.flags || []),
            activationCount: new Map()
        });
        res.json({
            success: true,
            options
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取故事书模板
 */
router.get('/storybook/templates', auth_1.authenticate, async (req, res) => {
    const templates = storybook_1.storybookService.getTemplates();
    res.json({
        success: true,
        templates
    });
});
// ==================== AI 角色生成 API ====================
/**
 * 生成角色
 */
router.post('/generate/character', auth_1.authenticate, async (req, res, next) => {
    try {
        const character = await character_generator_1.characterGeneratorService.generateCharacter(req.body, req.user.id);
        res.json({
            success: true,
            character
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 生成开场白
 */
router.post('/generate/first-message', auth_1.authenticate, async (req, res, next) => {
    try {
        const { character, context } = req.body;
        const message = await character_generator_1.characterGeneratorService.generateFirstMessage(character, context);
        res.json({
            success: true,
            message
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 优化角色设定
 */
router.post('/generate/enhance', auth_1.authenticate, async (req, res, next) => {
    try {
        const { character, aspects } = req.body;
        const enhanced = await character_generator_1.characterGeneratorService.enhanceCharacter(character, aspects);
        res.json({
            success: true,
            character: enhanced
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 生成角色头像
 */
router.post('/generate/avatar', auth_1.authenticate, async (req, res, next) => {
    try {
        const { character, style } = req.body;
        const avatar = await character_generator_1.characterGeneratorService.generateAvatar(character, style);
        res.json({
            success: true,
            avatar
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取生成模板
 */
router.get('/generate/templates', auth_1.authenticate, async (req, res) => {
    const templates = character_generator_1.characterGeneratorService.getTemplates();
    res.json({
        success: true,
        templates
    });
});
exports.default = router;
//# sourceMappingURL=ai-features.js.map