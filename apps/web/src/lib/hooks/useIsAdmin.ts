import { useAuthStore } from '@/lib/store/auth.store';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'];

/**
 * Returns true if the current user has admin-level privileges.
 * Admins: SUPER_ADMIN, ADMIN, CONTENT_MANAGER
 */
export function useIsAdmin(): boolean {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !user) return false;
  return user.roles?.some((r) => ADMIN_ROLES.includes(r)) ?? false;
}

/**
 * Returns true only for SUPER_ADMIN
 */
export function useIsSuperAdmin(): boolean {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !user) return false;
  return user.roles?.includes('SUPER_ADMIN') ?? false;
}
