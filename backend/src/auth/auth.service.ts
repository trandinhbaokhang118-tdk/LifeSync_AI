import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto } from './dto';
import axios from 'axios';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto) {
        const user = await this.usersService.create(registerDto);
        return user;
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            });
        }

        const isPasswordValid = await this.usersService.verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            });
        }

        const tokens = await this.generateTokens(user.id);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            access: this.getAccessProfile(user.role),
        };
    }

    async refresh(refreshToken: string) {
        const tokenHash = this.hashToken(refreshToken);

        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {
                tokenHash,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!storedToken) {
            throw new UnauthorizedException({
                code: 'AUTH_REFRESH_INVALID',
                message: 'Invalid or expired refresh token',
            });
        }

        // Delete old token (rotation)
        await this.prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        // Generate new tokens
        const tokens = await this.generateTokens(storedToken.userId);
        await this.saveRefreshToken(storedToken.userId, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    async logout(refreshToken: string) {
        const tokenHash = this.hashToken(refreshToken);

        await this.prisma.refreshToken.deleteMany({
            where: { tokenHash },
        });

        return { message: 'Logged out successfully' };
    }

    async sendOtp(sendOtpDto: SendOtpDto) {
        const { phone } = sendOtpDto;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP in memory (in production, use Redis)
        this.otpStore.set(phone, { otp, expiresAt });

        // Send OTP via SMS (using a service like Twilio, Vonage, etc.)
        await this.sendSms(phone, otp);

        return { message: 'OTP sent successfully' };
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const { phone, otp } = verifyOtpDto;

        const storedOtp = this.otpStore.get(phone);
        if (!storedOtp) {
            throw new UnauthorizedException({
                code: 'OTP_NOT_FOUND',
                message: 'OTP not found or expired',
            });
        }

        if (storedOtp.expiresAt < new Date()) {
            this.otpStore.delete(phone);
            throw new UnauthorizedException({
                code: 'OTP_EXPIRED',
                message: 'OTP has expired',
            });
        }

        if (storedOtp.otp !== otp) {
            throw new UnauthorizedException({
                code: 'OTP_INVALID',
                message: 'Invalid OTP',
            });
        }

        // Delete used OTP
        this.otpStore.delete(phone);

        // Find or create user with phone number
        let user = await this.prisma.user.findFirst({ where: { phone } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    phone,
                    name: `User ${phone.slice(-4)}`,
                    email: `${phone}@phone.local`,
                    passwordHash: await argon2.hash(crypto.randomBytes(32).toString('hex')),
                },
            });
        }

        const tokens = await this.generateTokens(user.id);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            access: this.getAccessProfile(user.role),
        };
    }

    private async sendSms(phone: string, otp: string) {
        // Integration with SMS service (Twilio, Vonage, etc.)
        // For demo purposes, log a redacted notice only to avoid leaking OTPs.
        void otp;
        this.logger.log(`OTP requested for ${this.maskPhoneNumber(phone)}. SMS provider not configured.`);

        // Example with Twilio (uncomment and configure):
        // const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        // const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        // const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');
        // 
        // const client = require('twilio')(accountSid, authToken);
        // await client.messages.create({
        //     body: `Your TimeManager OTP is: ${otp}`,
        //     from: fromNumber,
        //     to: phone,
        // });
    }

    private maskPhoneNumber(phone: string): string {
        if (phone.length <= 4) {
            return '****';
        }

        return `${'*'.repeat(Math.max(phone.length - 4, 0))}${phone.slice(-4)}`;
    }

    getGoogleAuthUrl(): string {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');
        const scope = 'email profile';

        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    }

    async googleLogin(code: string) {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');

        // Exchange code for tokens
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { email, name } = userResponse.data;

        // Find or create user
        let user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash: await argon2.hash(crypto.randomBytes(32).toString('hex')),
                },
            });
        }

        const tokens = await this.generateTokens(user.id);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            access: this.getAccessProfile(user.role),
        };
    }

    getFacebookAuthUrl(): string {
        const clientId = this.configService.get('FACEBOOK_APP_ID');
        const redirectUri = this.configService.get('FACEBOOK_REDIRECT_URI');
        const scope = 'email,public_profile';

        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    }

    async facebookLogin(code: string) {
        const clientId = this.configService.get('FACEBOOK_APP_ID');
        const clientSecret = this.configService.get('FACEBOOK_APP_SECRET');
        const redirectUri = this.configService.get('FACEBOOK_REDIRECT_URI');

        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code,
            },
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email',
                access_token,
            },
        });

        const { email, name } = userResponse.data;

        if (!email) {
            throw new BadRequestException({
                code: 'FACEBOOK_NO_EMAIL',
                message: 'Email not provided by Facebook',
            });
        }

        // Find or create user
        let user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash: await argon2.hash(crypto.randomBytes(32).toString('hex')),
                },
            });
        }

        const tokens = await this.generateTokens(user.id);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            access: this.getAccessProfile(user.role),
        };
    }

    private async generateTokens(userId: string) {
        const payload = { sub: userId };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        });

        const refreshToken = crypto.randomBytes(32).toString('hex');

        return { accessToken, refreshToken };
    }

    private async saveRefreshToken(userId: string, refreshToken: string) {
        const tokenHash = this.hashToken(refreshToken);
        const expiresIn = this.configService.get('REFRESH_TOKEN_EXPIRES_IN', '7d');
        const expiresAt = this.calculateExpiry(expiresIn);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private calculateExpiry(duration: string): Date {
        const match = duration.match(/^(\d+)([dhms])$/);
        if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

        const value = parseInt(match[1]);
        const unit = match[2];

        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };

        return new Date(Date.now() + value * multipliers[unit]);
    }

    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatar: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        return {
            ...user,
            access: this.getAccessProfile(user.role),
        };
    }

    private getAccessProfile(role: Role | string) {
        const isAdmin = role === Role.ADMIN;

        return {
            portal: isAdmin ? 'admin' : 'user',
            defaultRoute: isAdmin ? '/admin' : '/app',
            allowedRoutePrefixes: isAdmin ? ['/admin'] : ['/app'],
            restrictedRoutePrefixes: isAdmin ? ['/app'] : ['/admin'],
            description: isAdmin
                ? 'Admin accounts can only access the administration portal and system management features.'
                : 'User accounts can only access personal productivity and subscription features.',
        };
    }
}
