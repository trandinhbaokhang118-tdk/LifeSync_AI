import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest<{ user?: CurrentUserData }>();

        if (!user) {
            throw new ForbiddenException({
                code: 'AUTH_ROLE_CONTEXT_MISSING',
                message: 'Authenticated user context is required for role-based access control',
            });
        }

        const hasRequiredRole = requiredRoles.some((role) => user.role === role);

        if (!hasRequiredRole) {
            throw new ForbiddenException({
                code: 'AUTH_ROLE_FORBIDDEN',
                message: 'You do not have permission to access this resource',
                details: {
                    currentRole: user.role,
                    requiredRoles,
                },
            });
        }

        return true;
    }
}
