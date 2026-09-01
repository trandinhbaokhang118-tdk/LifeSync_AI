import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
    sub: string;
    portal?: 'user' | 'admin';
    purpose?: string;
    iat: number;
    exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET', 'default-secret'),
        });
    }

    async validate(payload: JwtPayload) {
        if (payload.purpose) {
            throw new UnauthorizedException({
                code: 'AUTH_TOKEN_INVALID',
                message: 'Invalid access token',
            });
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException({
                code: 'AUTH_TOKEN_INVALID',
                message: 'User not found',
            });
        }

        return {
            ...user,
            portal: payload.portal === 'admin' ? 'admin' : 'user',
        };
    }
}
