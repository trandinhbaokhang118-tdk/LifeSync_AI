import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as public so JwtAuthGuard skips authentication.
 * Used for endpoints that cannot present a user JWT, such as
 * payment provider webhooks.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
