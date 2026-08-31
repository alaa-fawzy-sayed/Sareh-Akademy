import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@top-pharma/types';

export const ROLES_KEY = 'roles';

/**
 * @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 * Restricts endpoint to users with any of the specified roles
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';

/**
 * @Permissions('university.create', 'university.update')
 * Restricts endpoint to users with ALL specified permissions
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public()
 * Marks a route as publicly accessible (skips JWT auth guard)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * @SkipThrottle()
 * Bypasses rate limiting for specific routes
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
