import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

/**
 * Valid audit log action types
 */
export type AuditAction =
  | 'ban_user'
  | 'unban_user'
  | 'approve_content'
  | 'reject_content'
  | 'flag_content'
  | 'change_config'
  | 'update_feature'
  | 'delete_content'
  | 'promote_user'
  | 'demote_user'
  | 'create_announcement'
  | 'resolve_alert'
  | 'emergency_shutdown'
  | 'other';

/**
 * Audit log entry creation options
 */
interface AuditLogOptions {
  action: AuditAction;
  resource: string;
  changes?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
async function createAuditLog(
  adminId: string,
  options: AuditLogOptions,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: options.action,
        resource: options.resource,
        changes: JSON.stringify(options.changes || {}),
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the main operation
  }
}

/**
 * Middleware to automatically log admin actions
 * Usage: router.post('/ban-user', authenticate, requireAdmin, auditLog('ban_user'), handler)
 */
export function auditLog(action: AuditAction, getResource?: (req: AuthRequest) => string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get resource identifier
    let resource = 'unknown';
    if (getResource) {
      resource = getResource(req);
    } else if (req.params.id) {
      resource = `${req.baseUrl}:${req.params.id}`;
    } else if (req.params.userId) {
      resource = `user:${req.params.userId}`;
    } else if (req.params.characterId) {
      resource = `character:${req.params.characterId}`;
    } else {
      resource = req.baseUrl || req.path;
    }

    // Get IP and user agent
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Store the original res.json to intercept it
    const originalJson = res.json.bind(res);

    // Intercept res.json to log after successful response
    res.json = function (body: any) {
      // Only log if the operation was successful
      if (body?.success !== false && res.statusCode < 400) {
        // Extract changes from request body
        const changes: Record<string, any> = {};

        if (req.body) {
          // Common fields to log
          const fieldsToLog = [
            'reason',
            'duration',
            'status',
            'enabled',
            'value',
            'config',
            'settings',
          ];

          fieldsToLog.forEach((field) => {
            if (req.body[field] !== undefined) {
              changes[field] = req.body[field];
            }
          });

          // Include action-specific data
          if (req.body.action) {
            changes.action = req.body.action;
          }
        }

        // Create audit log entry asynchronously (don't wait)
        createAuditLog(userId, { action, resource, changes }, ipAddress, userAgent);
      }

      // Call original res.json
      return originalJson(body);
    } as any;

    // Proceed to the next middleware/handler
    next();
  };
}

/**
 * Middleware to manually create an audit log from within a route handler
 * Attaches an auditLog function to the request object
 */
export function auditLogManual(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // Attach manual audit log function to request
  (req as any).createAuditLog = async (options: AuditLogOptions): Promise<void> => {
    await createAuditLog(userId, options, ipAddress, userAgent);
  };

  next();
}

/**
 * Predefined audit log middleware for common actions
 */

export const auditBanUser = auditLog('ban_user', (req) => `user:${req.params.userId}`);
export const auditUnbanUser = auditLog('unban_user', (req) => `user:${req.params.userId}`);
export const auditApproveContent = auditLog('approve_content', (req) => `content:${req.params.id}`);
export const auditRejectContent = auditLog('reject_content', (req) => `content:${req.params.id}`);
export const auditFlagContent = auditLog('flag_content', (req) => `content:${req.params.id}`);
export const auditChangeConfig = auditLog('change_config', () => 'system:config');
export const auditUpdateFeature = auditLog('update_feature', (req) => `feature:${req.params.featureId}`);
export const auditDeleteContent = auditLog('delete_content', (req) => `content:${req.params.id}`);
export const auditPromoteUser = auditLog('promote_user', (req) => `user:${req.params.userId}`);
export const auditDemoteUser = auditLog('demote_user', (req) => `user:${req.params.userId}`);
export const auditResolveAlert = auditLog('resolve_alert', (req) => `alert:${req.params.alertId}`);

/**
 * Utility function to manually create an audit log entry
 * Can be called from anywhere with adminId
 */
export async function logAdminAction(
  adminId: string,
  action: AuditAction,
  resource: string,
  changes?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog(adminId, { action, resource, changes }, ipAddress, userAgent);
}
