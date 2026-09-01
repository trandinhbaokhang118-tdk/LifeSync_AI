import { Injectable, UnauthorizedException, BadRequestException, Logger, Inject, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AdminMfaVerifyDto, RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto } from './dto';
import { OTP_STORE, OtpStore } from './otp/otp-store.interface';
import axios from 'axios';
import { OAuthProvider, Prisma, Role, User } from '@prisma/client';

type AuthPortal = 'user' | 'admin';
type AdminMfaPurpose = 'admin-mfa-setup' | 'admin-mfa-login';
type SocialProvider = 'google' | 'facebook';

interface AdminMfaPayload {
    sub: string;
    purpose: AdminMfaPurpose;
    iat: number;
    exp: number;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    /** Max wrong OTP guesses allowed before the code is invalidated. */
    private static readonly MAX_OTP_ATTEMPTS = 5;
    /** OTP lifetime in milliseconds. */
    private static readonly OTP_TTL_MS = 5 * 60 * 1000;
    private static readonly OAUTH_LOGIN_CODE_TTL_MS = 2 * 60 * 1000;

    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @Inject(OTP_STORE) private readonly otpStore: OtpStore,
    ) { }

    async register(registerDto: RegisterDto) {
        const user = await this.usersService.create(registerDto);
        return user;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateCredentials(loginDto);

        if (user.role === Role.ADMIN) {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_PORTAL_REQUIRED',
                message: 'Tai khoan quan tri phai dang nhap tai cong admin',
            });
        }

        return this.createLoginSession(user, 'user', loginDto.rememberMe === true);
    }

    async adminLogin(loginDto: LoginDto) {
        const user = await this.validateCredentials(loginDto);

        if (user.role !== Role.ADMIN) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_ADMIN_CREDENTIALS',
                message: 'Invalid admin email or password',
            });
        }

        return this.createAdminMfaChallenge(user);
    }

    async verifyAdminMfa(dto: AdminMfaVerifyDto) {
        const payload = this.verifyAdminMfaToken(dto.mfaToken, 'admin-mfa-login');
        const user = await this.getAdminMfaUser(payload.sub);

        if (!user.adminTotpEnabled || !user.adminTotpSecret) {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_MFA_SETUP_REQUIRED',
                message: 'Admin MFA setup is required',
            });
        }

        const secret = this.decryptTotpSecret(user.adminTotpSecret);
        if (!this.verifyTotpCode(secret, dto.code)) {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_MFA_INVALID',
                message: 'Invalid or expired MFA code',
            });
        }

        return this.createLoginSession(user, 'admin');
    }

    async verifyAdminMfaSetup(dto: AdminMfaVerifyDto) {
        const payload = this.verifyAdminMfaToken(dto.mfaToken, 'admin-mfa-setup');
        const user = await this.getAdminMfaUser(payload.sub);

        if (!user.adminTotpSecret) {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_MFA_SETUP_REQUIRED',
                message: 'Admin MFA setup is required',
            });
        }

        const secret = this.decryptTotpSecret(user.adminTotpSecret);
        if (!this.verifyTotpCode(secret, dto.code)) {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_MFA_INVALID',
                message: 'Invalid or expired MFA code',
            });
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                adminTotpEnabled: true,
                adminTotpConfirmedAt: new Date(),
            },
        });

        return this.createLoginSession(updatedUser, 'admin');
    }

    private async validateCredentials(loginDto: LoginDto): Promise<User> {
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

        return user;
    }

    private async createLoginSession(user: User, portal: AuthPortal, rememberMe = false) {
        const tokens = await this.generateTokens(user.id, portal);
        await this.saveRefreshToken(user.id, tokens.refreshToken, rememberMe);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                portal,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            access: this.getAccessProfile(user.role, portal),
        };
    }

    private async createAdminMfaChallenge(user: User) {
        if (user.adminTotpEnabled && user.adminTotpSecret) {
            return {
                mfaRequired: true,
                mfaToken: this.generateAdminMfaToken(user.id, 'admin-mfa-login'),
                expiresInSeconds: 600,
                user: {
                    email: user.email,
                    name: user.name,
                },
            };
        }

        const secret = this.generateTotpSecret();
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                adminTotpSecret: this.encryptTotpSecret(secret),
                adminTotpEnabled: false,
                adminTotpConfirmedAt: null,
            },
        });

        return {
            mfaSetupRequired: true,
            mfaToken: this.generateAdminMfaToken(user.id, 'admin-mfa-setup'),
            expiresInSeconds: 600,
            totp: {
                issuer: 'LifeSync AI',
                accountName: user.email,
                secret,
                otpauthUrl: this.buildTotpUri(secret, user.email),
                period: 30,
                digits: 6,
            },
            user: {
                email: user.email,
                name: user.name,
            },
        };
    }

    private async getAdminMfaUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.role !== Role.ADMIN) {
            throw new UnauthorizedException({
                code: 'AUTH_INVALID_ADMIN_CREDENTIALS',
                message: 'Invalid admin MFA challenge',
            });
        }

        return user;
    }

    private generateAdminMfaToken(userId: string, purpose: AdminMfaPurpose) {
        return this.jwtService.sign(
            { sub: userId, purpose },
            { expiresIn: '10m' },
        );
    }

    private verifyAdminMfaToken(token: string, purpose: AdminMfaPurpose): AdminMfaPayload {
        try {
            const payload = this.jwtService.verify<AdminMfaPayload>(token);
            if (payload.purpose !== purpose) {
                throw new Error('Invalid MFA token purpose');
            }

            return payload;
        } catch {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_MFA_TOKEN_INVALID',
                message: 'MFA challenge has expired. Please sign in again.',
            });
        }
    }

    private generateTotpSecret() {
        return this.base32Encode(crypto.randomBytes(20));
    }

    private buildTotpUri(secret: string, email: string) {
        const issuer = 'LifeSync AI';
        const label = `${issuer}:${email}`;
        const params = new URLSearchParams({
            secret,
            issuer,
            algorithm: 'SHA1',
            digits: '6',
            period: '30',
        });

        return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
    }

    private encryptTotpSecret(secret: string) {
        const key = this.getTotpEncryptionKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return [
            'v1',
            iv.toString('base64url'),
            tag.toString('base64url'),
            encrypted.toString('base64url'),
        ].join(':');
    }

    private decryptTotpSecret(encryptedSecret: string) {
        if (!encryptedSecret.startsWith('v1:')) {
            return encryptedSecret;
        }

        const [, ivValue, tagValue, encryptedValue] = encryptedSecret.split(':');
        const key = this.getTotpEncryptionKey();
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(ivValue, 'base64url'),
        );
        decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

        return Buffer.concat([
            decipher.update(Buffer.from(encryptedValue, 'base64url')),
            decipher.final(),
        ]).toString('utf8');
    }

    private getTotpEncryptionKey() {
        return crypto
            .createHash('sha256')
            .update(this.configService.get('JWT_SECRET', 'default-secret'))
            .digest();
    }

    private verifyTotpCode(secret: string, code: string) {
        const normalizedCode = code.trim();
        const currentCounter = Math.floor(Date.now() / 30000);

        for (const drift of [-1, 0, 1]) {
            const expected = this.generateTotpCode(secret, currentCounter + drift);
            const expectedBuffer = Buffer.from(expected);
            const actualBuffer = Buffer.from(normalizedCode);

            if (
                expectedBuffer.length === actualBuffer.length &&
                crypto.timingSafeEqual(expectedBuffer, actualBuffer)
            ) {
                return true;
            }
        }

        return false;
    }

    private generateTotpCode(secret: string, counter: number) {
        const key = this.base32Decode(secret);
        const counterBuffer = Buffer.alloc(8);
        let counterValue = BigInt(counter);

        for (let index = 7; index >= 0; index -= 1) {
            counterBuffer[index] = Number(counterValue & 0xffn);
            counterValue >>= 8n;
        }

        const hash = crypto.createHmac('sha1', key).update(counterBuffer).digest();
        const offset = hash[hash.length - 1] & 0x0f;
        const binary =
            ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);

        return String(binary % 1_000_000).padStart(6, '0');
    }

    private base32Encode(buffer: Buffer) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';

        for (const byte of buffer) {
            value = (value << 8) | byte;
            bits += 8;

            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }

        return output;
    }

    private base32Decode(secret: string) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const normalizedSecret = secret.toUpperCase().replace(/[\s=]/g, '');
        const bytes: number[] = [];
        let bits = 0;
        let value = 0;

        for (const char of normalizedSecret) {
            const index = alphabet.indexOf(char);
            if (index === -1) {
                throw new UnauthorizedException({
                    code: 'AUTH_ADMIN_MFA_SECRET_INVALID',
                    message: 'Admin MFA secret is invalid',
                });
            }

            value = (value << 5) | index;
            bits += 5;

            if (bits >= 8) {
                bytes.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }

        return Buffer.from(bytes);
    }

    async refresh(refreshToken: string) {
        const tokenHash = this.hashToken(refreshToken);
        const portal = this.getRefreshTokenPortal(refreshToken);

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
        const nextPortal = portal === 'admin' && storedToken.user.role === Role.ADMIN ? 'admin' : 'user';
        const tokens = await this.generateTokens(storedToken.userId, nextPortal);
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

    async requestPasswordReset(email: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

        // Always return the same response to avoid leaking whether an email exists.
        if (!user || user.role === Role.ADMIN) {
            return { message: 'If that email exists, a password reset link has been sent.' };
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = this.calculateExpiry(this.configService.get('PASSWORD_RESET_TOKEN_EXPIRES_IN', '1h'));

        await this.prisma.$transaction([
            this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
            this.prisma.passwordResetToken.create({
                data: { userId: user.id, tokenHash, expiresAt },
            }),
        ]);

        const resetUrl = new URL('/reset-password', this.configService.get('FRONTEND_URL', 'http://localhost:5173'));
        resetUrl.searchParams.set('token', rawToken);
        await this.sendPasswordResetEmail(user.email, user.name, resetUrl.toString());

        return { message: 'If that email exists, a password reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        const tokenHash = this.hashToken(token);
        const resetToken = await this.prisma.passwordResetToken.findFirst({
            where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
            include: { user: true },
        });

        if (!resetToken) {
            throw new BadRequestException({
                code: 'PASSWORD_RESET_TOKEN_INVALID',
                message: 'Password reset link is invalid or has expired',
            });
        }

        const samePassword = await argon2.verify(resetToken.user.passwordHash, newPassword);
        if (samePassword) {
            throw new BadRequestException({
                code: 'PASSWORD_UNCHANGED',
                message: 'New password must be different from the current password',
            });
        }

        const passwordHash = await argon2.hash(newPassword);
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
            this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
            this.prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId, id: { not: resetToken.id } } }),
            this.prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
        ]);

        return { message: 'Password reset successfully. Please sign in with your new password.' };
    }

    async sendOtp(sendOtpDto: SendOtpDto) {
        const { phone } = sendOtpDto;
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = Date.now() + AuthService.OTP_TTL_MS;

        // Do not create a usable OTP if the provider could not deliver it.
        await this.sendSms(phone, otp);

        // Persist via the configured store (in-memory or Redis) with a TTL.
        await this.otpStore.set(
            phone,
            { otp, expiresAt, attempts: 0 },
            AuthService.OTP_TTL_MS,
        );
        return { message: 'OTP sent successfully' };
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const { phone, otp } = verifyOtpDto;

        const storedOtp = await this.otpStore.get(phone);
        if (!storedOtp) {
            throw new UnauthorizedException({
                code: 'OTP_NOT_FOUND',
                message: 'OTP not found or expired',
            });
        }

        if (storedOtp.expiresAt <= Date.now()) {
            await this.otpStore.delete(phone);
            throw new UnauthorizedException({
                code: 'OTP_EXPIRED',
                message: 'OTP has expired',
            });
        }

        if (storedOtp.otp !== otp) {
            // Count the failed guess and invalidate the OTP once the limit is
            // hit. This caps brute-forcing a 6-digit code even if the attacker
            // rotates IPs to dodge the per-IP rate limiter.
            const attempts = storedOtp.attempts + 1;
            if (attempts >= AuthService.MAX_OTP_ATTEMPTS) {
                await this.otpStore.delete(phone);
                throw new UnauthorizedException({
                    code: 'OTP_ATTEMPTS_EXCEEDED',
                    message: 'Too many invalid attempts. Please request a new OTP.',
                });
            }
            // Persist the incremented attempt count, preserving the remaining TTL.
            await this.otpStore.set(
                phone,
                { ...storedOtp, attempts },
                Math.max(storedOtp.expiresAt - Date.now(), 1),
            );
            throw new UnauthorizedException({
                code: 'OTP_INVALID',
                message: 'Invalid OTP',
            });
        }

        // Delete used OTP
        await this.otpStore.delete(phone);

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
                portal: 'user',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            access: this.getAccessProfile(user.role),
        };
    }

    private async sendSms(phone: string, otp: string) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID')?.trim();
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')?.trim();
        const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER')?.trim();

        // E2E never sends SMS externally. Every normal deployment must provide
        // Twilio credentials; pretending an SMS was sent is unsafe.
        if (process.env.NODE_ENV === 'test') {
            this.logger.debug(`OTP delivery skipped in test for ${this.maskPhoneNumber(phone)}.`);
            return;
        }

        if (!accountSid || !authToken || !fromNumber) {
            throw new ServiceUnavailableException({
                code: 'SMS_PROVIDER_NOT_CONFIGURED',
                message: 'SMS sign-in is unavailable because the SMS provider is not configured.',
            });
        }

        const form = new URLSearchParams({
            To: phone,
            From: fromNumber,
            Body: `Your LifeSync AI verification code is ${otp}. It expires in 5 minutes.`,
        });

        try {
            await axios.post(
                `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
                form,
                {
                    auth: { username: accountSid, password: authToken },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 15_000,
                },
            );
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || error.message
                : (error as Error).message;
            this.logger.error(`OTP delivery failed for ${this.maskPhoneNumber(phone)}: ${message}`);
            throw new ServiceUnavailableException({
                code: 'SMS_DELIVERY_FAILED',
                message: 'Unable to send the verification code. Please try again later.',
            });
        }
    }

    private maskPhoneNumber(phone: string): string {
        if (phone.length <= 4) {
            return '****';
        }

        return `${'*'.repeat(Math.max(phone.length - 4, 0))}${phone.slice(-4)}`;
    }

    getOAuthProviderStatus() {
        return {
            google: this.hasOAuthConfig([
                'GOOGLE_CLIENT_ID',
                'GOOGLE_CLIENT_SECRET',
                'GOOGLE_REDIRECT_URI',
            ]),
            facebook: this.hasOAuthConfig([
                'FACEBOOK_APP_ID',
                'FACEBOOK_APP_SECRET',
                'FACEBOOK_REDIRECT_URI',
            ]),
        };
    }

    getGoogleAuthUrl(state: string): string {
        const clientId = this.getRequiredConfig('GOOGLE_CLIENT_ID');
        const redirectUri = this.getRequiredConfig('GOOGLE_REDIRECT_URI');
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state,
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    async googleLogin(code: string) {
        const clientId = this.getRequiredConfig('GOOGLE_CLIENT_ID');
        const clientSecret = this.getRequiredConfig('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.getRequiredConfig('GOOGLE_REDIRECT_URI');

        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15_000,
            },
        );

        const { access_token } = tokenResponse.data;
        if (!access_token) {
            throw new UnauthorizedException({
                code: 'GOOGLE_TOKEN_EXCHANGE_FAILED',
                message: 'Google did not return an access token',
            });
        }

        const userResponse = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
            timeout: 15_000,
        });

        const { sub, email, email_verified, name, picture, hd } = userResponse.data;
        if (!sub || !email || email_verified !== true) {
            throw new UnauthorizedException({
                code: 'GOOGLE_EMAIL_NOT_VERIFIED',
                message: 'A verified Google email is required',
            });
        }

        const googleIsAuthoritativeForEmail = email.toLowerCase().endsWith('@gmail.com') || Boolean(hd);
        const user = await this.resolveSocialUser(
            OAuthProvider.GOOGLE,
            sub,
            email,
            name,
            picture,
            googleIsAuthoritativeForEmail,
        );
        return { code: await this.createOAuthLoginCode(user.id) };
    }

    getFacebookAuthUrl(state: string): string {
        const clientId = this.getRequiredConfig('FACEBOOK_APP_ID');
        const redirectUri = this.getRequiredConfig('FACEBOOK_REDIRECT_URI');
        const apiVersion = this.getFacebookApiVersion();
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'email,public_profile',
            state,
        });

        return `https://www.facebook.com/${apiVersion}/dialog/oauth?${params.toString()}`;
    }

    async facebookLogin(code: string) {
        const clientId = this.getRequiredConfig('FACEBOOK_APP_ID');
        const clientSecret = this.getRequiredConfig('FACEBOOK_APP_SECRET');
        const redirectUri = this.getRequiredConfig('FACEBOOK_REDIRECT_URI');
        const apiVersion = this.getFacebookApiVersion();

        // Exchange code for access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code,
            },
            timeout: 15_000,
        });

        const { access_token } = tokenResponse.data;
        if (!access_token) {
            throw new UnauthorizedException({
                code: 'FACEBOOK_TOKEN_EXCHANGE_FAILED',
                message: 'Facebook did not return an access token',
            });
        }

        const userResponse = await axios.get(`https://graph.facebook.com/${apiVersion}/me`, {
            params: {
                fields: 'id,name,email,picture.type(large)',
                access_token,
            },
            timeout: 15_000,
        });

        const { id, email, name, picture } = userResponse.data;

        if (!id || !email) {
            throw new BadRequestException({
                code: 'FACEBOOK_NO_EMAIL',
                message: 'Email not provided by Facebook',
            });
        }

        const avatar = picture?.data?.is_silhouette === false ? picture.data.url : undefined;
        const user = await this.resolveSocialUser(OAuthProvider.FACEBOOK, id, email, name, avatar, false);
        return { code: await this.createOAuthLoginCode(user.id) };
    }

    async exchangeOAuthCode(code: string) {
        const codeHash = this.hashToken(code);
        const loginCode = await this.prisma.oAuthLoginCode.findUnique({
            where: { codeHash },
        });

        if (!loginCode || loginCode.usedAt || loginCode.expiresAt <= new Date()) {
            throw new UnauthorizedException({
                code: 'OAUTH_LOGIN_CODE_INVALID',
                message: 'OAuth login code is invalid or expired',
            });
        }

        const consumed = await this.prisma.oAuthLoginCode.updateMany({
            where: {
                id: loginCode.id,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: { usedAt: new Date() },
        });

        if (consumed.count !== 1) {
            throw new UnauthorizedException({
                code: 'OAUTH_LOGIN_CODE_USED',
                message: 'OAuth login code has already been used',
            });
        }

        const user = await this.prisma.user.findUnique({ where: { id: loginCode.userId } });
        if (!user || user.role === Role.ADMIN) {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_PORTAL_REQUIRED',
                message: 'This account cannot sign in through the user OAuth portal',
            });
        }

        return this.createLoginSession(user, 'user', true);
    }

    private async resolveSocialUser(
        provider: OAuthProvider,
        providerAccountId: string,
        email: string,
        name?: string,
        avatar?: string,
        allowExistingEmailLink = false,
    ): Promise<User> {
        const normalizedEmail = email.trim().toLowerCase();
        const existingAccount = await this.prisma.socialAccount.findUnique({
            where: { provider_providerAccountId: { provider, providerAccountId } },
            include: { user: true },
        });

        if (existingAccount) {
            if (existingAccount.user.role === Role.ADMIN) {
                throw new UnauthorizedException({
                    code: 'AUTH_ADMIN_PORTAL_REQUIRED',
                    message: 'Admin accounts must sign in through the admin portal',
                });
            }
            return existingAccount.user;
        }

        let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (user?.role === Role.ADMIN) {
            throw new UnauthorizedException({
                code: 'AUTH_ADMIN_PORTAL_REQUIRED',
                message: 'Admin accounts must sign in through the admin portal',
            });
        }

        if (user && !allowExistingEmailLink) {
            throw new BadRequestException({
                code: 'SOCIAL_ACCOUNT_LINK_REQUIRED',
                message: 'Sign in with your existing account before linking this social provider',
            });
        }

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: name?.trim() || normalizedEmail.split('@')[0],
                    avatar,
                    passwordHash: await argon2.hash(crypto.randomBytes(32).toString('hex')),
                },
            });
        } else if (!user.avatar && avatar) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { avatar },
            });
        }

        try {
            await this.prisma.socialAccount.create({
                data: { userId: user.id, provider, providerAccountId },
            });
            return user;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const racedAccount = await this.prisma.socialAccount.findUnique({
                    where: { provider_providerAccountId: { provider, providerAccountId } },
                    include: { user: true },
                });
                if (racedAccount) return racedAccount.user;
                throw new BadRequestException({
                    code: 'SOCIAL_ACCOUNT_CONFLICT',
                    message: 'This account is already linked to another profile from the same provider',
                });
            }
            throw error;
        }
    }

    private async createOAuthLoginCode(userId: string) {
        const code = crypto.randomBytes(32).toString('hex');
        await this.prisma.oAuthLoginCode.create({
            data: {
                userId,
                codeHash: this.hashToken(code),
                expiresAt: new Date(Date.now() + AuthService.OAUTH_LOGIN_CODE_TTL_MS),
            },
        });

        void this.prisma.oAuthLoginCode.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { usedAt: { not: null }, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                ],
            },
        }).catch(() => undefined);

        return code;
    }

    generateOAuthState(provider: SocialProvider) {
        return this.jwtService.sign(
            {
                purpose: 'oauth-state',
                provider,
                nonce: crypto.randomBytes(16).toString('hex'),
            },
            { expiresIn: '10m' },
        );
    }

    verifyOAuthState(provider: SocialProvider, state: string) {
        try {
            const payload = this.jwtService.verify<{ purpose: string; provider: SocialProvider }>(state);
            return payload.purpose === 'oauth-state' && payload.provider === provider;
        } catch {
            return false;
        }
    }

    private getRequiredConfig(key: string) {
        const value = this.configService.get<string>(key);
        if (!value || value.trim().length === 0) {
            throw new BadRequestException({
                code: 'OAUTH_PROVIDER_NOT_CONFIGURED',
                message: `${key} is not configured`,
            });
        }

        return value.trim();
    }

    private hasOAuthConfig(keys: string[]) {
        return keys.every((key) => {
            const value = this.configService.get<string>(key)?.trim();
            return Boolean(value && value.length > 2 && !/^your[_-]/i.test(value));
        });
    }

    private getFacebookApiVersion() {
        const configuredVersion = this.configService.get<string>('FACEBOOK_API_VERSION') || 'v25.0';
        const version = configuredVersion.trim();

        return version.startsWith('v') ? version : `v${version}`;
    }

    private async generateTokens(userId: string, portal: AuthPortal = 'user') {
        const payload = { sub: userId, portal };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        });

        const refreshToken = `${portal === 'admin' ? 'adm' : 'usr'}_${crypto.randomBytes(32).toString('hex')}`;

        return { accessToken, refreshToken };
    }

    private getRefreshTokenPortal(refreshToken: string): AuthPortal {
        return refreshToken.startsWith('adm_') ? 'admin' : 'user';
    }

    private async saveRefreshToken(userId: string, refreshToken: string, rememberMe = false) {
        const tokenHash = this.hashToken(refreshToken);
        const expiresIn = rememberMe
            ? this.configService.get('REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN', '30d')
            : this.configService.get('REFRESH_TOKEN_EXPIRES_IN', '7d');
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

    private async sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
        const from = this.configService.get<string>('EMAIL_FROM')?.trim();

        if (!apiKey || !from) {
            this.logger.warn(`Password reset requested for ${this.maskEmail(email)}, but email delivery is not configured.`);
            return;
        }

        try {
            await axios.post(
                'https://api.resend.com/emails',
                {
                    from,
                    to: [email],
                    subject: 'Reset your LifeSync AI password',
                    text: `Hello ${name}, reset your LifeSync AI password using this link: ${resetUrl}\n\nThis link expires in one hour. If you did not request it, you can ignore this email.`,
                },
                { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10_000 },
            );
        } catch (error) {
            this.logger.error(`Unable to deliver password reset email to ${this.maskEmail(email)}: ${(error as Error).message}`);
        }
    }

    private maskEmail(email: string): string {
        const [local, domain] = email.split('@');
        return `${local.slice(0, 2)}***@${domain || 'unknown'}`;
    }

    async getCurrentUser(userId: string, portal: AuthPortal = 'user') {
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
            portal,
            access: this.getAccessProfile(user.role, portal),
        };
    }

    private getAccessProfile(role: Role | string, portal: AuthPortal = 'user') {
        const isAdmin = role === Role.ADMIN;
        const isAdminSession = isAdmin && portal === 'admin';

        return {
            portal: isAdminSession ? 'admin' : 'user',
            defaultRoute: isAdminSession ? '/admin' : '/app',
            allowedRoutePrefixes: isAdminSession ? ['/admin'] : ['/app'],
            restrictedRoutePrefixes: isAdminSession ? ['/app'] : ['/admin'],
            description: isAdminSession
                ? 'Admin accounts can only access the administration portal with an admin session.'
                : 'User accounts can only access personal productivity and subscription features.',
        };
    }
}
