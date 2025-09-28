import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';
import prisma from '../lib/prisma';
import NewAPIImageGenerator from '../services/newapi-image-generator';
import { GenerationStatus } from '@prisma/client';

const router = Router();
const imageGenerator = new NewAPIImageGenerator();

// 验证角色ID参数
const validateCharacterId = [
  param('id').isUUID().withMessage('Invalid character ID')
];

// 验证批量生成请求
const validateBatchGenerate = [
  body('characterIds').isArray({ min: 1 }).withMessage('Character IDs array is required'),
  body('characterIds.*').isUUID().withMessage('Invalid character ID format'),
  body('type').isIn(['avatar', 'background', 'both']).withMessage('Type must be avatar, background, or both')
];

/**
 * POST /api/characters/:id/generate-avatar
 * 为指定角色生成头像
 */
router.post('/characters/:id/generate-avatar',
  authenticateToken,
  validateCharacterId,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // 检查角色是否存在且用户有权限
      const character = await prisma.character.findFirst({
        where: {
          id,
          OR: [
            { creatorId: userId }, // 创建者
            { isPublic: true }     // 或公开角色
          ]
        }
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found or access denied' });
      }

      // 检查是否正在生成中
      if (character.avatarStatus === 'GENERATING') {
        return res.status(409).json({ error: 'Avatar generation already in progress' });
      }

      // 更新状态为生成中
      await prisma.character.update({
        where: { id },
        data: { avatarStatus: 'GENERATING' }
      });

      try {
        // 生成头像
        const avatarUrl = await imageGenerator.generateAvatar(character);

        // 更新角色数据
        const updatedCharacter = await prisma.character.update({
          where: { id },
          data: {
            avatar: avatarUrl,
            avatarStatus: 'COMPLETED'
          }
        });

        res.json({
          success: true,
          message: 'Avatar generated successfully',
          data: {
            characterId: id,
            avatar: avatarUrl,
            status: 'COMPLETED'
          }
        });

      } catch (error) {
        // 更新状态为失败
        await prisma.character.update({
          where: { id },
          data: { avatarStatus: 'FAILED' }
        });
        throw error;
      }

    } catch (error) {
      console.error('Avatar generation error:', error);
      res.status(500).json({
        error: 'Failed to generate avatar',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/characters/:id/generate-background
 * 为指定角色生成对话背景图
 */
router.post('/characters/:id/generate-background',
  authenticateToken,
  validateCharacterId,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // 检查角色是否存在且用户有权限
      const character = await prisma.character.findFirst({
        where: {
          id,
          OR: [
            { creatorId: userId },
            { isPublic: true }
          ]
        }
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found or access denied' });
      }

      // 检查是否正在生成中
      if (character.backgroundStatus === 'GENERATING') {
        return res.status(409).json({ error: 'Background generation already in progress' });
      }

      // 更新状态为生成中
      await prisma.character.update({
        where: { id },
        data: { backgroundStatus: 'GENERATING' }
      });

      try {
        // 生成背景图
        const backgroundUrl = await imageGenerator.generateBackground(character);

        // 更新角色数据
        const updatedCharacter = await prisma.character.update({
          where: { id },
          data: {
            backgroundImage: backgroundUrl,
            backgroundStatus: 'COMPLETED'
          }
        });

        res.json({
          success: true,
          message: 'Background generated successfully',
          data: {
            characterId: id,
            backgroundImage: backgroundUrl,
            status: 'COMPLETED'
          }
        });

      } catch (error) {
        // 更新状态为失败
        await prisma.character.update({
          where: { id },
          data: { backgroundStatus: 'FAILED' }
        });
        throw error;
      }

    } catch (error) {
      console.error('Background generation error:', error);
      res.status(500).json({
        error: 'Failed to generate background',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/characters/:id/regenerate-images
 * 重新生成角色的所有图片
 */
router.post('/characters/:id/regenerate-images',
  authenticateToken,
  validateCharacterId,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // 检查角色是否存在且用户有权限
      const character = await prisma.character.findFirst({
        where: {
          id,
          creatorId: userId // 只有创建者可以重新生成
        }
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found or access denied' });
      }

      // 检查是否有图片正在生成
      if (character.avatarStatus === 'GENERATING' || character.backgroundStatus === 'GENERATING') {
        return res.status(409).json({ error: 'Image generation already in progress' });
      }

      // 更新状态为生成中
      await prisma.character.update({
        where: { id },
        data: {
          avatarStatus: 'GENERATING',
          backgroundStatus: 'GENERATING'
        }
      });

      const results = {
        avatar: null as string | null,
        backgroundImage: null as string | null,
        errors: [] as string[]
      };

      try {
        // 并行生成头像和背景图
        const [avatarResult, backgroundResult] = await Promise.allSettled([
          imageGenerator.generateAvatar(character),
          imageGenerator.generateBackground(character)
        ]);

        // 处理头像生成结果
        if (avatarResult.status === 'fulfilled') {
          results.avatar = avatarResult.value;
          await prisma.character.update({
            where: { id },
            data: {
              avatar: avatarResult.value,
              avatarStatus: 'COMPLETED'
            }
          });
        } else {
          results.errors.push(`Avatar generation failed: ${avatarResult.reason.message}`);
          await prisma.character.update({
            where: { id },
            data: { avatarStatus: 'FAILED' }
          });
        }

        // 处理背景图生成结果
        if (backgroundResult.status === 'fulfilled') {
          results.backgroundImage = backgroundResult.value;
          await prisma.character.update({
            where: { id },
            data: {
              backgroundImage: backgroundResult.value,
              backgroundStatus: 'COMPLETED'
            }
          });
        } else {
          results.errors.push(`Background generation failed: ${backgroundResult.reason.message}`);
          await prisma.character.update({
            where: { id },
            data: { backgroundStatus: 'FAILED' }
          });
        }

        res.json({
          success: results.errors.length === 0,
          message: results.errors.length === 0 ? 'All images regenerated successfully' : 'Some images failed to generate',
          data: {
            characterId: id,
            avatar: results.avatar,
            backgroundImage: results.backgroundImage,
            errors: results.errors
          }
        });

      } catch (error) {
        // 全部失败，重置状态
        await prisma.character.update({
          where: { id },
          data: {
            avatarStatus: 'FAILED',
            backgroundStatus: 'FAILED'
          }
        });
        throw error;
      }

    } catch (error) {
      console.error('Image regeneration error:', error);
      res.status(500).json({
        error: 'Failed to regenerate images',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/admin/characters/batch-generate
 * 批量生成角色图片（管理员功能）
 */
router.post('/admin/characters/batch-generate',
  authenticateToken,
  validateBatchGenerate,
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { characterIds, type } = req.body;

      // 检查管理员权限
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true }
      });

      if (!user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // 获取要处理的角色
      const characters = await prisma.character.findMany({
        where: {
          id: { in: characterIds },
          isDeleted: false
        }
      });

      if (characters.length === 0) {
        return res.status(404).json({ error: 'No valid characters found' });
      }

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // 批量处理（限制并发数量）
      const batchSize = 3; // 同时处理3个角色
      for (let i = 0; i < characters.length; i += batchSize) {
        const batch = characters.slice(i, i + batchSize);

        await Promise.all(batch.map(async (character) => {
          results.processed++;

          try {
            const promises = [];

            // 根据类型决定生成什么
            if (type === 'avatar' || type === 'both') {
              // 更新状态
              await prisma.character.update({
                where: { id: character.id },
                data: { avatarStatus: 'GENERATING' }
              });
              promises.push(
                imageGenerator.generateAvatar(character).then(async (url) => {
                  await prisma.character.update({
                    where: { id: character.id },
                    data: { avatar: url, avatarStatus: 'COMPLETED' }
                  });
                  return { type: 'avatar', url };
                }).catch(async (error) => {
                  await prisma.character.update({
                    where: { id: character.id },
                    data: { avatarStatus: 'FAILED' }
                  });
                  throw error;
                })
              );
            }

            if (type === 'background' || type === 'both') {
              // 更新状态
              await prisma.character.update({
                where: { id: character.id },
                data: { backgroundStatus: 'GENERATING' }
              });
              promises.push(
                imageGenerator.generateBackground(character).then(async (url) => {
                  await prisma.character.update({
                    where: { id: character.id },
                    data: { backgroundImage: url, backgroundStatus: 'COMPLETED' }
                  });
                  return { type: 'background', url };
                }).catch(async (error) => {
                  await prisma.character.update({
                    where: { id: character.id },
                    data: { backgroundStatus: 'FAILED' }
                  });
                  throw error;
                })
              );
            }

            await Promise.all(promises);
            results.successful++;

          } catch (error) {
            results.failed++;
            results.errors.push(`${character.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }));
      }

      res.json({
        success: results.failed === 0,
        message: `Batch generation completed. ${results.successful}/${results.processed} successful.`,
        data: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errors: results.errors.slice(0, 10) // 限制错误数量
        }
      });

    } catch (error) {
      console.error('Batch generation error:', error);
      res.status(500).json({
        error: 'Batch generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/characters/:id/generation-status
 * 获取角色图片生成状态
 */
router.get('/characters/:id/generation-status',
  authenticateToken,
  validateCharacterId,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const character = await prisma.character.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          avatar: true,
          backgroundImage: true,
          avatarStatus: true,
          backgroundStatus: true,
          emotionStatus: true,
          mbtiType: true
        }
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      res.json({
        success: true,
        data: character
      });

    } catch (error) {
      console.error('Get generation status error:', error);
      res.status(500).json({
        error: 'Failed to get generation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
