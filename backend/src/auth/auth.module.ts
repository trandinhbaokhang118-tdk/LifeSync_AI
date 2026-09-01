import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { otpStoreProvider } from './otp/otp-store.provider';
import {
    authLimiter,
    registerLimiter,
    passwordResetLimiter,
} from '../common/middleware/rate-limit.middleware';

@Module({
    imports: [
        UsersModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET', 'default-secret'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, otpStoreProvider],
    exports: [AuthService, JwtModule],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Brute-force protection on sensitive auth endpoints.
        // Limiters self-disable when NODE_ENV=test (see rate-limit.middleware).
        consumer
            .apply(authLimiter)
            .forRoutes(
                { path: 'auth/login', method: RequestMethod.POST },
                { path: 'auth/admin/login', method: RequestMethod.POST },
                { path: 'auth/admin/mfa/verify', method: RequestMethod.POST },
                { path: 'auth/admin/mfa/setup/verify', method: RequestMethod.POST },
                { path: 'auth/password-reset/confirm', method: RequestMethod.POST },
                { path: 'auth/oauth/exchange', method: RequestMethod.POST },
            );

        consumer
            .apply(registerLimiter)
            .forRoutes({ path: 'auth/register', method: RequestMethod.POST });

        consumer
            .apply(passwordResetLimiter)
            .forRoutes(
                { path: 'auth/send-otp', method: RequestMethod.POST },
                { path: 'auth/verify-otp', method: RequestMethod.POST },
                { path: 'auth/password-reset/request', method: RequestMethod.POST },
            );
    }
}
