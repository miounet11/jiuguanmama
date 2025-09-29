import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import { extensionService } from '../services/extensions/ExtensionService';
import { sandboxService } from '../services/extensions/SandboxService';
import { marketplaceService } from '../services/extensions/MarketplaceService';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for extension uploads
const upload = multer({
  dest: 'temp/extensions/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.tar.gz', '.tgz'];
    const fileExt = file.originalname.toLowerCase();

    if (allowedTypes.some(ext => fileExt.endsWith(ext))) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .zip, .tar.gz, and .tgz files are allowed.'));
    }
  }
});

// Validation middleware helper
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Install extension from marketplace
 * POST /api/extensions/install
 */
router.post('/install',
  authMiddleware,
  [
    body('extensionId').notEmpty().withMessage('Extension ID is required'),
    body('version').optional().isString().withMessage('Version must be a string'),
    body('source').optional().isIn(['marketplace', 'file', 'git', 'npm']).withMessage('Invalid source'),
    body('skipPermissionCheck').optional().isBoolean().withMessage('Skip permission check must be boolean'),
    body('skipDependencyCheck').optional().isBoolean().withMessage('Skip dependency check must be boolean')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionId, version, source = 'marketplace', skipPermissionCheck, skipDependencyCheck } = req.body;
      const userId = req.user!.id;

      const extension = await extensionService.installExtension(extensionId, userId, {
        source,
        version,
        skipPermissionCheck,
        skipDependencyCheck
      });

      res.status(201).json({
        success: true,
        extension
      });
    } catch (error) {
      logger.error('Extension installation failed', {
        extensionId: req.body.extensionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Extension installation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXTENSION_INSTALL_FAILED'
      });
    }
  }
);

/**
 * Upload and install extension from file
 * POST /api/extensions/upload
 */
router.post('/upload',
  authMiddleware,
  upload.single('extension'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No extension file provided',
          code: 'NO_FILE_PROVIDED'
        });
      }

      const userId = req.user!.id;
      const extensionId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Install from uploaded file
      const extension = await extensionService.installExtension(extensionId, userId, {
        source: 'file',
        skipPermissionCheck: false,
        skipDependencyCheck: false
      });

      res.status(201).json({
        success: true,
        extension
      });
    } catch (error) {
      logger.error('Extension upload failed', {
        userId: req.user?.id,
        filename: req.file?.originalname,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Extension upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXTENSION_UPLOAD_FAILED'
      });
    }
  }
);

/**
 * Uninstall extension
 * DELETE /api/extensions/:extensionId
 */
router.delete('/:extensionId',
  authMiddleware,
  [
    param('extensionId').notEmpty().withMessage('Extension ID is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionId } = req.params;
      const userId = req.user!.id;

      const success = await extensionService.uninstallExtension(extensionId, userId);

      if (success) {
        res.json({
          success: true,
          extensionId
        });
      } else {
        res.status(500).json({
          error: 'Extension uninstallation failed',
          code: 'EXTENSION_UNINSTALL_FAILED'
        });
      }
    } catch (error) {
      logger.error('Extension uninstallation failed', {
        extensionId: req.params.extensionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Extension uninstallation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXTENSION_UNINSTALL_FAILED'
      });
    }
  }
);

/**
 * Enable extension
 * POST /api/extensions/:extensionId/enable
 */
router.post('/:extensionId/enable',
  authMiddleware,
  [
    param('extensionId').notEmpty().withMessage('Extension ID is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionId } = req.params;
      const userId = req.user!.id;

      const success = await extensionService.enableExtension(extensionId, userId);

      if (success) {
        res.json({
          success: true,
          extensionId,
          status: 'enabled'
        });
      } else {
        res.status(500).json({
          error: 'Extension enabling failed',
          code: 'EXTENSION_ENABLE_FAILED'
        });
      }
    } catch (error) {
      logger.error('Extension enabling failed', {
        extensionId: req.params.extensionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Extension enabling failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXTENSION_ENABLE_FAILED'
      });
    }
  }
);

/**
 * Disable extension
 * POST /api/extensions/:extensionId/disable
 */
router.post('/:extensionId/disable',
  authMiddleware,
  [
    param('extensionId').notEmpty().withMessage('Extension ID is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionId } = req.params;
      const userId = req.user!.id;

      const success = await extensionService.disableExtension(extensionId, userId);

      if (success) {
        res.json({
          success: true,
          extensionId,
          status: 'disabled'
        });
      } else {
        res.status(500).json({
          error: 'Extension disabling failed',
          code: 'EXTENSION_DISABLE_FAILED'
        });
      }
    } catch (error) {
      logger.error('Extension disabling failed', {
        extensionId: req.params.extensionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Extension disabling failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXTENSION_DISABLE_FAILED'
      });
    }
  }
);

/**
 * Update extension
 * PUT /api/extensions/:extensionId
 */
router.put('/:extensionId',
  authMiddleware,
  [
    param('extensionId').notEmpty().withMessage('Extension ID is required'),
    body('version').optional().isString().withMessage('Version must be a string')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionId } = req.params;
      const { version } = req.body;
      const userId = req.user!.id;

      const extension = await extensionService.updateExtension(extensionId, userId, version);

      if (extension) {
        res.json({
          success: true,
          extension
        });
      } else {
        res.status(500).json({
          error: 'Extension update failed',
          code: 'EXTENSION_UPDATE_FAILED'
        });
      }
    } catch (error) {
      logger.error('Extension update failed', {
        extensionId: req.params.extensionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Extension update failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXTENSION_UPDATE_FAILED'
      });
    }
  }
);

/**
 * Get installed extensions
 * GET /api/extensions
 */
router.get('/',
  authMiddleware,
  [
    query('category').optional().isIn(['character', 'chat', 'ui', 'ai', 'utility', 'theme']).withMessage('Invalid category'),
    query('enabled').optional().isBoolean().withMessage('Enabled filter must be boolean'),
    query('search').optional().isString().withMessage('Search term must be string')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { category, enabled, search } = req.query;

      const filter: any = {};
      if (category) filter.category = category;
      if (enabled !== undefined) filter.enabled = enabled === 'true';
      if (search) filter.search = search;

      const extensions = await extensionService.getInstalledExtensions(userId, filter);

      res.json({
        success: true,
        extensions
      });
    } catch (error) {
      logger.error('Failed to get installed extensions', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to get extensions',
        code: 'EXTENSIONS_GET_FAILED'
      });
    }
  }
);

/**
 * Get extension statistics
 * GET /api/extensions/stats
 */
router.get('/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const stats = await extensionService.getStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Failed to get extension stats', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to get extension statistics',
        code: 'EXTENSION_STATS_FAILED'
      });
    }
  }
);

/**
 * Batch operations on extensions
 * POST /api/extensions/batch
 */
router.post('/batch',
  authMiddleware,
  [
    body('extensionIds').isArray().withMessage('Extension IDs must be an array'),
    body('extensionIds.*').notEmpty().withMessage('Extension ID cannot be empty'),
    body('operation').isIn(['enable', 'disable', 'uninstall']).withMessage('Invalid operation')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionIds, operation } = req.body;
      const userId = req.user!.id;

      const result = await extensionService.batchOperation(extensionIds, operation, userId);

      res.json({
        success: true,
        operation,
        totalRequested: extensionIds.length,
        successful: result.success,
        failed: result.failed,
        results: result
      });
    } catch (error) {
      logger.error('Batch extension operation failed', {
        operation: req.body.operation,
        extensionCount: req.body.extensionIds?.length,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Batch operation failed',
        code: 'BATCH_OPERATION_FAILED'
      });
    }
  }
);

/**
 * Execute extension function in sandbox
 * POST /api/extensions/:extensionId/execute
 */
router.post('/:extensionId/execute',
  authMiddleware,
  [
    param('extensionId').notEmpty().withMessage('Extension ID is required'),
    body('functionName').notEmpty().withMessage('Function name is required'),
    body('args').optional().isArray().withMessage('Arguments must be an array'),
    body('timeout').optional().isInt({ min: 1, max: 30000 }).withMessage('Timeout must be between 1 and 30000ms')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionId } = req.params;
      const { functionName, args = [], timeout = 5000 } = req.body;
      const userId = req.user!.id;

      // Verify extension ownership and status
      const extensions = await extensionService.getInstalledExtensions(userId, { search: extensionId });
      const extension = extensions.find(ext => ext.id === extensionId);

      if (!extension) {
        return res.status(404).json({
          error: 'Extension not found',
          code: 'EXTENSION_NOT_FOUND'
        });
      }

      if (!extension.isEnabled) {
        return res.status(403).json({
          error: 'Extension is disabled',
          code: 'EXTENSION_DISABLED'
        });
      }

      // Create sandbox context
      const contextId = await sandboxService.createContext(extensionId, { timeout });

      try {
        // Load extension and execute function
        await sandboxService.loadExtension(contextId, extension.installPath!);
        const result = await sandboxService.callFunction(contextId, functionName, args);

        res.json({
          success: result.success,
          result: result.result,
          error: result.error,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed
        });
      } finally {
        // Always cleanup sandbox context
        await sandboxService.destroyContext(contextId);
      }
    } catch (error) {
      logger.error('Extension execution failed', {
        extensionId: req.params.extensionId,
        functionName: req.body.functionName,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Extension execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXTENSION_EXECUTION_FAILED'
      });
    }
  }
);

/**
 * Get sandbox statistics
 * GET /api/extensions/sandbox/stats
 */
router.get('/sandbox/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const stats = sandboxService.getStats();
      const activeContexts = sandboxService.getActiveContexts();

      res.json({
        success: true,
        stats,
        activeContexts: activeContexts.length,
        contexts: activeContexts.map(ctx => ({
          id: ctx.id,
          extensionId: ctx.extensionId,
          executionCount: ctx.executionCount,
          memoryUsage: ctx.memoryUsage,
          cpuTime: ctx.cpuTime,
          createdAt: ctx.createdAt,
          lastActivity: ctx.lastActivity
        }))
      });
    } catch (error) {
      logger.error('Failed to get sandbox stats', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to get sandbox statistics',
        code: 'SANDBOX_STATS_FAILED'
      });
    }
  }
);

/**
 * Marketplace endpoints
 */

/**
 * Search marketplace extensions
 * GET /api/extensions/marketplace/search
 */
router.get('/marketplace/search',
  authMiddleware,
  [
    query('query').optional().isString().withMessage('Search query must be string'),
    query('category').optional().isIn(['character', 'chat', 'ui', 'ai', 'utility', 'theme']).withMessage('Invalid category'),
    query('author').optional().isString().withMessage('Author must be string'),
    query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Min rating must be between 0 and 5'),
    query('maxRating').optional().isFloat({ min: 0, max: 5 }).withMessage('Max rating must be between 0 and 5'),
    query('sortBy').optional().isIn(['relevance', 'downloads', 'rating', 'updated', 'published', 'name']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('official').optional().isBoolean().withMessage('Official filter must be boolean'),
    query('featured').optional().isBoolean().withMessage('Featured filter must be boolean'),
    query('verified').optional().isBoolean().withMessage('Verified filter must be boolean'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const filter = {
        query: req.query.query as string,
        category: req.query.category as string,
        author: req.query.author as string,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        maxRating: req.query.maxRating ? parseFloat(req.query.maxRating as string) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        official: req.query.official === 'true',
        featured: req.query.featured === 'true',
        verified: req.query.verified === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await marketplaceService.searchExtensions(filter);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Marketplace search failed', {
        filter: req.query,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Marketplace search failed',
        code: 'MARKETPLACE_SEARCH_FAILED'
      });
    }
  }
);

/**
 * Get marketplace extension details
 * GET /api/extensions/marketplace/:extensionId
 */
router.get('/marketplace/:extensionId',
  authMiddleware,
  [
    param('extensionId').notEmpty().withMessage('Extension ID is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { extensionId } = req.params;
      const extension = await marketplaceService.getExtension(extensionId);

      if (!extension) {
        return res.status(404).json({
          error: 'Extension not found in marketplace',
          code: 'MARKETPLACE_EXTENSION_NOT_FOUND'
        });
      }

      // Track download for analytics
      await marketplaceService.trackDownload(extensionId, req.user!.id);

      res.json({
        success: true,
        extension
      });
    } catch (error) {
      logger.error('Failed to get marketplace extension', {
        extensionId: req.params.extensionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to get marketplace extension',
        code: 'MARKETPLACE_GET_FAILED'
      });
    }
  }
);

/**
 * Get featured extensions
 * GET /api/extensions/marketplace/featured
 */
router.get('/marketplace/featured',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const extensions = await marketplaceService.getFeaturedExtensions(limit);

      res.json({
        success: true,
        extensions
      });
    } catch (error) {
      logger.error('Failed to get featured extensions', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to get featured extensions',
        code: 'FEATURED_EXTENSIONS_FAILED'
      });
    }
  }
);

/**
 * Get marketplace statistics
 * GET /api/extensions/marketplace/stats
 */
router.get('/marketplace/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const stats = await marketplaceService.getStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Failed to get marketplace stats', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Failed to get marketplace statistics',
        code: 'MARKETPLACE_STATS_FAILED'
      });
    }
  }
);

export default router;