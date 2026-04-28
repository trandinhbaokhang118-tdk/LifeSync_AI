import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, SendOtpDto, VerifyOtpDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
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
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
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
        return this.authService.getCurrentUser(user.id);
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
        const url = this.authService.getGoogleAuthUrl();
        res.redirect(url);
    }

    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        try {
            const code = req.query.code as string;
            const error = req.query.error as string;
            const frontendUrl = process.env.FRONTEND_URL;

            if (error || !code) {
                return res.redirect(`${frontendUrl}/auth/callback?error=google_auth_failed`);
            }

            const result = await this.authService.googleLogin(code);
            const query = new URLSearchParams({
                token: result.accessToken,
                refreshToken: result.refreshToken,
            });

            return res.redirect(`${frontendUrl}/auth/callback?${query.toString()}`);
        } catch (error) {
            console.error('Google OAuth error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=google_auth_failed`);
        }
    }

    @Get('facebook')
    @ApiOperation({ summary: 'Login with Facebook' })
    async facebookAuth(@Res() res: Response) {
        const url = this.authService.getFacebookAuthUrl();
        res.redirect(url);
    }

    @Get('facebook/callback')
    @ApiOperation({ summary: 'Facebook OAuth callback' })
    async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
        try {
            const code = req.query.code as string;
            const error = req.query.error as string;
            const frontendUrl = process.env.FRONTEND_URL;

            if (error || !code) {
                return res.redirect(`${frontendUrl}/auth/callback?error=facebook_auth_failed`);
            }

            const result = await this.authService.facebookLogin(code);
            const query = new URLSearchParams({
                token: result.accessToken,
                refreshToken: result.refreshToken,
            });

            return res.redirect(`${frontendUrl}/auth/callback?${query.toString()}`);
        } catch (error) {
            console.error('Facebook OAuth error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=facebook_auth_failed`);
        }
    }
}
