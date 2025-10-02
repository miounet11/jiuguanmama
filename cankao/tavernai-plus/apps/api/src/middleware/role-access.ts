import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

/**
 * Valid user roles in the system
 */
export type UserRole = 'player' | 'creator' | 'admin';

/**
 * Middleware to restrict access to specific roles
 * Usage: router.get('/admin-only', authenticate, requireRole(['admin']), handler)
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get user's role from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Check if user's role is in the allowed roles
      if (!rolesArray.includes(user.role as UserRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${rolesArray.join(' or ')}`,
          currentRole: user.role,
          requiredRoles: rolesArray,
        });
        return;
      }

      // Attach role to request for convenience
      (req as any).userRole = user.role;

      // User has the required role, proceed
      next();
    } catch (error) {
      console.error('Role access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check role access',
      });
    }
  };
}

/**
 * Middleware to require admin role
 * Shorthand for requireRole(['admin'])
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to require creator role
 * Allows both creator and admin roles
 */
export const requireCreator = requireRole(['creator', 'admin']);

/**
 * Middleware to check if user has their primary role set to a specific value
 * This checks UserPreferenceExtended.primaryRole instead of User.role
 */
export function requirePrimaryRole(allowedRoles: UserRole | UserRole[]) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get user's primary role preference
      const preference = await prisma.userPreferenceExtended.findUnique({
        where: { userId },
        select: { primaryRole: true },
      });

      if (!preference) {
        // If no preference set, fall back to User.role
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (!user || !rolesArray.includes(user.role as UserRole)) {
          res.status(403).json({
            success: false,
            message: `Access denied. Required primary role: ${rolesArray.join(' or ')}`,
            requiredRoles: rolesArray,
          });
          return;
        }

        (req as any).primaryRole = user.role;
      } else {
        if (!rolesArray.includes(preference.primaryRole as UserRole)) {
          res.status(403).json({
            success: false,
            message: `Access denied. Required primary role: ${rolesArray.join(' or ')}`,
            currentPrimaryRole: preference.primaryRole,
            requiredRoles: rolesArray,
          });
          return;
        }

        (req as any).primaryRole = preference.primaryRole;
      }

      // User has the required primary role, proceed
      next();
    } catch (error) {
      console.error('Primary role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check primary role',
      });
    }
  };
}

/**
 * Middleware to attach user's role information to the request
 */
export async function attachRoleInfo(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get both User.role and UserPreferenceExtended.primaryRole
    const [user, preference] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
      prisma.userPreferenceExtended.findUnique({
        where: { userId },
        select: { primaryRole: true },
      }),
    ]);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Attach role information to request
    (req as any).userRole = user.role;
    (req as any).primaryRole = preference?.primaryRole || user.role;

    next();
  } catch (error) {
    console.error('Attach role info middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load role information',
    });
  }
}
