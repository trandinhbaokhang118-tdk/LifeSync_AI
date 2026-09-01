import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AdminSessionGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest<{ user?: CurrentUserData }>();

        if (user?.portal === 'admin') {
            return true;
        }

        throw new ForbiddenException({
            code: 'AUTH_ADMIN_SESSION_REQUIRED',
            message: 'Please sign in through the admin portal to access this resource',
        });
    }
}
