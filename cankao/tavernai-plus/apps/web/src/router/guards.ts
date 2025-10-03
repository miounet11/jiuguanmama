import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useFeatureStore } from '@/stores';

/**
 * Route Guards for Feature Gating and Access Control
 * T068: Feature-Gated Route Guards
 */

/**
 * Check if user has access to a feature-gated route
 * @param featureCode - Feature code (e.g., 'F4', 'F5', 'F6')
 * @returns Promise<boolean> - True if user has access
 */
export async function checkFeatureAccess(featureCode: string): Promise<{ canAccess: boolean; reason?: string }> {
  const featuresStore = useFeatureStore();

  // Load features if not already loaded
  if (!featuresStore.isLoaded) {
    try {
      await Promise.all([
        featuresStore.fetchFeatures(),
        featuresStore.fetchUserUnlocks(),
      ]);
    } catch (error) {
      console.error('Failed to load feature access:', error);
      return {
        canAccess: false,
        reason: 'Failed to verify feature access',
      };
    }
  }

  // Check if feature is unlocked
  if (!featuresStore.isFeatureUnlocked(featureCode)) {
    return {
      canAccess: false,
      reason: 'Feature not unlocked',
    };
  }

  return { canAccess: true };
}

/**
 * Authentication guard - checks if user is logged in
 */
export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const userStore = useUserStore();

  // Try to restore session if not authenticated
  if (!userStore.isAuthenticated) {
    await userStore.restoreSession();
  }

  // Check if user is authenticated
  if (!userStore.isAuthenticated) {
    userStore.setRedirectPath(to.fullPath);
    next({
      name: 'Login',
      query: { redirect: to.fullPath },
    });
    return;
  }

  next();
}

/**
 * Admin guard - checks if user has admin role
 */
export function adminGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const userStore = useUserStore();

  if (!userStore.isAdmin) {
    next({ name: 'Home' });
    return;
  }

  next();
}

/**
 * Role guard - checks if user has required role
 */
export function roleGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const userStore = useUserStore();
  const requiredRole = to.meta.requiresRole as string;

  if (!requiredRole) {
    next();
    return;
  }

  // Admin users can access all roles
  if (userStore.isAdmin) {
    next();
    return;
  }

  // Check if user has required role
  if (userStore.currentUser?.role !== requiredRole) {
    next({ name: 'Home' });
    return;
  }

  next();
}

/**
 * Feature gate guard - checks if user has access to feature
 */
export async function featureGateGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const featureCode = to.meta.featureGate as string;

  if (!featureCode) {
    next();
    return;
  }

  const { canAccess } = await checkFeatureAccess(featureCode);

  if (!canAccess) {
    // Redirect to subscription/upgrade page
    next({
      name: 'Subscription',
      query: {
        feature: featureCode,
        redirect: to.fullPath,
      },
    });
    return;
  }

  next();
}

/**
 * Combined guard that applies all checks in order
 */
export async function combinedGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  // 1. Check authentication
  if (to.meta.requiresAuth) {
    const userStore = useUserStore();

    if (!userStore.isAuthenticated) {
      await userStore.restoreSession();
    }

    if (!userStore.isAuthenticated) {
      userStore.setRedirectPath(to.fullPath);
      next({
        name: 'Login',
        query: { redirect: to.fullPath },
      });
      return;
    }

    // 2. Check admin role
    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      next({ name: 'Home' });
      return;
    }

    // 3. Check specific role
    if (to.meta.requiresRole) {
      const requiredRole = to.meta.requiresRole as string;
      if (userStore.currentUser?.role !== requiredRole && !userStore.isAdmin) {
        next({ name: 'Home' });
        return;
      }
    }

    // 4. Check feature access
    if (to.meta.featureGate) {
      const featureCode = to.meta.featureGate as string;
      const { canAccess } = await checkFeatureAccess(featureCode);

      if (!canAccess) {
        next({
          name: 'Subscription',
          query: {
            feature: featureCode,
            redirect: to.fullPath,
          },
        });
        return;
      }
    }
  }

  next();
}
