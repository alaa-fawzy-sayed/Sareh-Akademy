import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * @CurrentUser() — extracts the authenticated user from the request
 * Usage: @CurrentUser() user: User
 * Usage: @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user) return null;
    if (data) return user[data];
    return user;
  },
);
