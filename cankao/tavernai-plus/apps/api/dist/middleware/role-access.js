"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCreator = exports.requireAdmin = void 0;
exports.requireRole = requireRole;
exports.requirePrimaryRole = requirePrimaryRole;
exports.attachRoleInfo = attachRoleInfo;
const server_1 = require("../server");
/**
 * Middleware to restrict access to specific roles
 * Usage: router.get('/admin-only', authenticate, requireRole(['admin']), handler)
 */
function requireRole(allowedRoles) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            // Get user's role from database
            const user = await server_1.prisma.user.findUnique({
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
            if (!rolesArray.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${rolesArray.join(' or ')}`,
                    currentRole: user.role,
                    requiredRoles: rolesArray,
                });
                return;
            }
            // Attach role to request for convenience
            req.userRole = user.role;
            // User has the required role, proceed
            next();
        }
        catch (error) {
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
exports.requireAdmin = requireRole(['admin']);
/**
 * Middleware to require creator role
 * Allows both creator and admin roles
 */
exports.requireCreator = requireRole(['creator', 'admin']);
/**
 * Middleware to check if user has their primary role set to a specific value
 * This checks UserPreferenceExtended.primaryRole instead of User.role
 */
function requirePrimaryRole(allowedRoles) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
                return;
            }
            // Get user's primary role preference
            const preference = await server_1.prisma.userPreferenceExtended.findUnique({
                where: { userId },
                select: { primaryRole: true },
            });
            if (!preference) {
                // If no preference set, fall back to User.role
                const user = await server_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true },
                });
                if (!user || !rolesArray.includes(user.role)) {
                    res.status(403).json({
                        success: false,
                        message: `Access denied. Required primary role: ${rolesArray.join(' or ')}`,
                        requiredRoles: rolesArray,
                    });
                    return;
                }
                req.primaryRole = user.role;
            }
            else {
                if (!rolesArray.includes(preference.primaryRole)) {
                    res.status(403).json({
                        success: false,
                        message: `Access denied. Required primary role: ${rolesArray.join(' or ')}`,
                        currentPrimaryRole: preference.primaryRole,
                        requiredRoles: rolesArray,
                    });
                    return;
                }
                req.primaryRole = preference.primaryRole;
            }
            // User has the required primary role, proceed
            next();
        }
        catch (error) {
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
async function attachRoleInfo(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        // Get both User.role and UserPreferenceExtended.primaryRole
        const [user, preference] = await Promise.all([
            server_1.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            }),
            server_1.prisma.userPreferenceExtended.findUnique({
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
        req.userRole = user.role;
        req.primaryRole = preference?.primaryRole || user.role;
        next();
    }
    catch (error) {
        console.error('Attach role info middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load role information',
        });
    }
}
//# sourceMappingURL=role-access.js.map