"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const spacetimeTavernService_1 = require("../services/spacetimeTavernService");
const router = (0, express_1.Router)();
// ===========================================
// 角色MBTI管理
// ===========================================
// 获取角色的MBTI信息
router.get('/characters/:characterId/mbti', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterId } = req.params;
        // 验证角色所有权
        const character = await require('../lib/prisma').prisma.character.findUnique({
            where: { id: characterId },
            select: { creatorId: true }
        });
        if (!character || character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const mbti = await spacetimeTavernService_1.SpacetimeTavernService.getCharacterMbti(characterId);
        res.json({
            success: true,
            mbti
        });
    }
    catch (error) {
        next(error);
    }
});
// 更新角色的MBTI信息
router.put('/characters/:characterId/mbti', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterId } = req.params;
        const { mbtiType, mbtiDescription, mbtiTraits, mbtiCompatibility, mbtiWeaknesses } = req.body;
        // 验证角色所有权
        const character = await require('../lib/prisma').prisma.character.findUnique({
            where: { id: characterId },
            select: { creatorId: true }
        });
        if (!character || character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const updatedMbti = await spacetimeTavernService_1.SpacetimeTavernService.updateCharacterMbti(characterId, {
            mbtiType,
            mbtiDescription,
            mbtiTraits,
            mbtiCompatibility,
            mbtiWeaknesses
        });
        res.json({
            success: true,
            mbti: updatedMbti
        });
    }
    catch (error) {
        next(error);
    }
});
// ===========================================
// 角色关联网络管理
// ===========================================
// 获取角色的关联网络
router.get('/characters/:characterId/relations', auth_1.authenticate, async (req, res, next) => {
    try {
        const { characterId } = req.params;
        // 验证角色所有权
        const character = await require('../lib/prisma').prisma.character.findUnique({
            where: { id: characterId },
            select: { creatorId: true }
        });
        if (!character || character.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const relations = await spacetimeTavernService_1.SpacetimeTavernService.getCharacterRelations(characterId);
        res.json({
            success: true,
            relations
        });
    }
    catch (error) {
        next(error);
    }
});
// 创建角色关联
router.post('/character-relations', auth_1.authenticate, async (req, res, next) => {
    try {
        const { fromCharacterId, toCharacterId, relationType, description, interactionTriggers, compatibilityScore, importance } = req.body;
        // 验证两个角色的所有权
        const fromCharacter = await require('../lib/prisma').prisma.character.findUnique({
            where: { id: fromCharacterId },
            select: { creatorId: true }
        });
        const toCharacter = await require('../lib/prisma').prisma.character.findUnique({
            where: { id: toCharacterId },
            select: { creatorId: true }
        });
        if (!fromCharacter || !toCharacter || fromCharacter.creatorId !== req.user.id || toCharacter.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to one or both characters'
            });
        }
        const relation = await spacetimeTavernService_1.SpacetimeTavernService.createCharacterRelation(fromCharacterId, toCharacterId, {
            relationType,
            description,
            interactionTriggers,
            compatibilityScore,
            importance
        });
        res.status(201).json({
            success: true,
            relation
        });
    }
    catch (error) {
        next(error);
    }
});
// ===========================================
// 剧本时空酒馆管理
// ===========================================
// 更新剧本的时空酒馆设置
router.put('/scenarios/:scenarioId/spacetime-hub', auth_1.authenticate, async (req, res, next) => {
    try {
        const { scenarioId } = req.params;
        const { spacetimeHubEnabled, spacetimeAttributes, spacetimeLayout, fusionMechanisms, plotPhases } = req.body;
        // 验证剧本所有权
        const scenario = await require('../lib/prisma').prisma.scenario.findUnique({
            where: { id: scenarioId },
            select: { userId: true }
        });
        if (!scenario || scenario.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const updatedScenario = await spacetimeTavernService_1.SpacetimeTavernService.updateScenarioSpacetimeHub(scenarioId, {
            spacetimeHubEnabled,
            spacetimeAttributes,
            spacetimeLayout,
            fusionMechanisms,
            plotPhases
        });
        res.json({
            success: true,
            scenario: updatedScenario
        });
    }
    catch (error) {
        next(error);
    }
});
// ===========================================
// WorldInfo时空属性管理
// ===========================================
// 更新WorldInfo条目的时空属性
router.put('/worldinfo/:worldInfoId/spacetime', auth_1.authenticate, async (req, res, next) => {
    try {
        const { worldInfoId } = req.params;
        const { spacetimeAttributes, relationTriggers, culturalContext, plotPhases, dynamicWeight } = req.body;
        // 验证WorldInfo所有权
        const worldInfo = await require('../lib/prisma').prisma.worldInfoEntry.findUnique({
            where: { id: worldInfoId },
            include: {
                scenario: {
                    select: { userId: true }
                }
            }
        });
        if (!worldInfo || worldInfo.scenario.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const updatedWorldInfo = await spacetimeTavernService_1.SpacetimeTavernService.updateWorldInfoSpacetime(worldInfoId, {
            spacetimeAttributes,
            relationTriggers,
            culturalContext,
            plotPhases,
            dynamicWeight
        });
        res.json({
            success: true,
            worldInfo: updatedWorldInfo
        });
    }
    catch (error) {
        next(error);
    }
});
// ===========================================
// 消息时空事件管理
// ===========================================
// 记录时空事件到消息
router.post('/messages/:messageId/spacetime-events', auth_1.authenticate, async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { type, title, description, effects, triggeredBy } = req.body;
        // 验证消息所有权
        const message = await require('../lib/prisma').prisma.message.findUnique({
            where: { id: messageId },
            include: {
                session: {
                    select: { userId: true }
                }
            }
        });
        if (!message || message.session.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const spacetimeEvent = await spacetimeTavernService_1.SpacetimeTavernService.addSpacetimeEventToMessage(messageId, {
            type,
            title,
            description,
            effects,
            triggeredBy
        });
        res.json({
            success: true,
            spacetimeEvent
        });
    }
    catch (error) {
        next(error);
    }
});
// 记录关系触发到消息
router.post('/messages/:messageId/relation-triggers', auth_1.authenticate, async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { characterId, characterName, relationType, description, compatibilityScore } = req.body;
        // 验证消息所有权
        const message = await require('../lib/prisma').prisma.message.findUnique({
            where: { id: messageId },
            include: {
                session: {
                    select: { userId: true }
                }
            }
        });
        if (!message || message.session.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const relationTrigger = await spacetimeTavernService_1.SpacetimeTavernService.addRelationTriggerToMessage(messageId, {
            characterId,
            characterName,
            relationType,
            description,
            compatibilityScore
        });
        res.json({
            success: true,
            relationTrigger
        });
    }
    catch (error) {
        next(error);
    }
});
// ===========================================
// 辅助功能
// ===========================================
// 计算MBTI兼容性
router.get('/mbti-compatibility/:type1/:type2', async (req, res, next) => {
    try {
        const { type1, type2 } = req.params;
        const compatibility = spacetimeTavernService_1.SpacetimeTavernService.calculateMbtiCompatibility(type1, type2);
        res.json({
            success: true,
            compatibility,
            type1,
            type2
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=spacetime-tavern.js.map