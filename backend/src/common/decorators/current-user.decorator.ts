import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'MODERATOR' | 'ADMIN';
    portal?: 'user' | 'admin';
}

export const CurrentUser = createParamDecorator(
    (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | string | undefined => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as CurrentUserData;

        if (data) {
            return user[data];
        }

        return user;
    },
);
