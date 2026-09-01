import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Req, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AdminMfaVerifyDto, RegisterDto, LoginDto, RefreshTokenDto, SendOtpDto, VerifyOtpDto, RequestPasswordResetDto, ResetPasswordDto, OAuthExchangeDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { RealIp } from '../common/decorators/real-ip.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private authService: AuthService) { }

    /** Mask an IP address so logs never store the full client IP. */
    private maskIp(ip: string): string {
        if (!ip || ip === 'unknown') return 'unknown';
        // IPv4: keep first two octets, mask the rest (e.g. 203.0.x.x)
        const ipv4 = ip.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
        if (ipv4) return `${ipv4[1]}.${ipv4[2]}.x.x`;
        // IPv6 or other: keep first segment only
        return `${ip.split(':')[0]}:****`;
    }

    private getFrontendUrl() {
        return process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    private buildFrontendCallbackUrl(params: Record<string, string>, useFragment = false) {
        const callbackUrl = new URL('/auth/callback', this.getFrontendUrl());
        const serializedParams = new URLSearchParams(params).toString();

        if (useFragment) {
            callbackUrl.hash = serializedParams;
        } else {
            callbackUrl.search = serializedParams;
        }

        return callbackUrl.toString();
    }

    private getCookie(req: Request, name: string) {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return undefined;

        return cookieHeader
            .split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith(`${name}=`))
            ?.slice(name.length + 1);
    }

    private setOAuthStateCookie(res: Response, provider: 'google' | 'facebook', state: string) {
        res.cookie(`oauth_state_${provider}`, state, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 10 * 60 * 1000,
            path: `/auth/${provider}/callback`,
        });
    }

    private clearOAuthStateCookie(res: Response, provider: 'google' | 'facebook') {
        res.clearCookie(`oauth_state_${provider}`, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: `/auth/${provider}/callback`,
        });
    }

    private hasValidOAuthState(req: Request, provider: 'google' | 'facebook', state: string | undefined) {
        const cookieState = this.getCookie(req, `oauth_state_${provider}`);
        const decodedCookieState = cookieState ? decodeURIComponent(cookieState) : undefined;

        return (
            Boolean(state) &&
            Boolean(decodedCookieState) &&
            state === decodedCookieState &&
            this.authService.verifyOAuthState(provider, state as string)
        );
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    @ApiResponse({ status: 429, description: 'Too many registration attempts' })
    async register(
        @Body() registerDto: RegisterDto,
        @RealIp() ip: string,
    ) {
        // Rate limiting is applied via middleware registered in AuthModule.
        this.logger.log(`Registration attempt from IP: ${this.maskIp(ip)}`);
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 429, description: 'Too many login attempts' })
    async login(
        @Body() loginDto: LoginDto,
        @RealIp() ip: string,
    ) {
        // Rate limiting is applied via middleware registered in AuthModule.
        this.logger.log(`Login attempt from IP: ${this.maskIp(ip)}`);
        return this.authService.login(loginDto);
    }

    @Post('password-reset/request')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request a password reset email' })
    async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Post('password-reset/confirm')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset a password using a one-time token' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @Post('admin/login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login admin user' })
    @ApiResponse({ status: 200, description: 'Admin login successful' })
    @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
    @ApiResponse({ status: 429, description: 'Too many login attempts' })
    async adminLogin(
        @Body() loginDto: LoginDto,
        @RealIp() ip: string,
    ) {
        // Rate limiting is applied via middleware registered in AuthModule.
        this.logger.log(`Admin login attempt from IP: ${this.maskIp(ip)}`);
        return this.authService.adminLogin(loginDto);
    }

    @Post('admin/mfa/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify admin MFA challenge' })
    @ApiResponse({ status: 200, description: 'Admin MFA verified' })
    @ApiResponse({ status: 401, description: 'Invalid or expired MFA challenge' })
    async verifyAdminMfa(@Body() dto: AdminMfaVerifyDto) {
        return this.authService.verifyAdminMfa(dto);
    }

    @Post('admin/mfa/setup/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify and enable admin MFA setup' })
    @ApiResponse({ status: 200, description: 'Admin MFA setup verified' })
    @ApiResponse({ status: 401, description: 'Invalid or expired MFA setup challenge' })
    async verifyAdminMfaSetup(@Body() dto: AdminMfaVerifyDto) {
        return this.authService.verifyAdminMfaSetup(dto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refresh(refreshTokenDto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    async logout(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.logout(refreshTokenDto.refreshToken);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    async getCurrentUser(@CurrentUser() user: CurrentUserData) {
        return this.authService.getCurrentUser(user.id, user.portal);
    }

    @Post('oauth/exchange')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Exchange a one-time OAuth login code for an app session' })
    async exchangeOAuthCode(@Body() dto: OAuthExchangeDto) {
        return this.authService.exchangeOAuthCode(dto.code);
    }

    @Get('oauth/status')
    @ApiOperation({ summary: 'Get configured OAuth providers' })
    getOAuthProviderStatus() {
        return this.authService.getOAuthProviderStatus();
    }

    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send OTP to phone number' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    async sendOtp(@Body() sendOtpDto: SendOtpDto) {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP and login' })
    @ApiResponse({ status: 200, description: 'OTP verified successfully' })
    @ApiResponse({ status: 401, description: 'Invalid OTP' })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyOtp(verifyOtpDto);
    }

    @Get('google')
    @ApiOperation({ summary: 'Login with Google' })
    async googleAuth(@Res() res: Response) {
        try {
            const state = this.authService.generateOAuthState('google');
            this.setOAuthStateCookie(res, 'google', state);
            const url = this.authService.getGoogleAuthUrl(state);
            res.redirect(url);
        } catch (error) {
            this.logger.error('Google OAuth configuration error', (error as Error)?.stack);
            res.redirect(this.buildFrontendCallbackUrl({ error: 'google_oauth_not_configured' }));
        }
    }

    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        try {
            const code = req.query.code as string;
            const error = req.query.error as string;
            const state = req.query.state as string | undefined;
            this.clearOAuthStateCookie(res, 'google');

            if (error || !code) {
                return res.redirect(this.buildFrontendCallbackUrl({ error: 'google_auth_failed' }));
            }

            if (!this.hasValidOAuthState(req, 'google', state)) {
                return res.redirect(this.buildFrontendCallbackUrl({ error: 'oauth_state_invalid' }));
            }

            const result = await this.authService.googleLogin(code);
            return res.redirect(this.buildFrontendCallbackUrl({ code: result.code }));
        } catch (error) {
            this.logger.error('Google OAuth error', (error as Error)?.stack);
            return res.redirect(this.buildFrontendCallbackUrl({ error: 'google_auth_failed' }));
        }
    }

    @Get('facebook')
    @ApiOperation({ summary: 'Login with Facebook' })
    async facebookAuth(@Res() res: Response) {
        try {
            const state = this.authService.generateOAuthState('facebook');
            this.setOAuthStateCookie(res, 'facebook', state);
            const url = this.authService.getFacebookAuthUrl(state);
            res.redirect(url);
        } catch (error) {
            this.logger.error('Facebook OAuth configuration error', (error as Error)?.stack);
            res.redirect(this.buildFrontendCallbackUrl({ error: 'facebook_oauth_not_configured' }));
        }
    }

    @Get('facebook/callback')
    @ApiOperation({ summary: 'Facebook OAuth callback' })
    async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
        try {
            const code = req.query.code as string;
            const error = req.query.error as string;
            const state = req.query.state as string | undefined;
            this.clearOAuthStateCookie(res, 'facebook');

            if (error || !code) {
                return res.redirect(this.buildFrontendCallbackUrl({ error: 'facebook_auth_failed' }));
            }

            if (!this.hasValidOAuthState(req, 'facebook', state)) {
                return res.redirect(this.buildFrontendCallbackUrl({ error: 'oauth_state_invalid' }));
            }

            const result = await this.authService.facebookLogin(code);
            return res.redirect(this.buildFrontendCallbackUrl({ code: result.code }));
        } catch (error) {
            this.logger.error('Facebook OAuth error', (error as Error)?.stack);
            return res.redirect(this.buildFrontendCallbackUrl({ error: 'facebook_auth_failed' }));
        }
    }
}
