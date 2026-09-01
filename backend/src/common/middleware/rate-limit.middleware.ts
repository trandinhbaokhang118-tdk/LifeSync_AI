import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware for API endpoints
 * Protects against brute force and DDoS attacks.
 *
 * NOTE: Proxy trust (for Cloudflare / reverse proxies) is configured once at the
 * app level via `app.set('trust proxy', 1)` in main.ts. express-rate-limit v7
 * reads that setting, so we do NOT set `trustProxy` here (it was removed in v7).
 */

/**
 * Resolve the real client IP, preferring Cloudflare's header, then standard
 * proxy headers, then Express's resolved `req.ip`.
 */
const clientIpKey = (req: Request): string => {
    return (
        (req.headers['cf-connecting-ip'] as string) ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        'unknown'
    );
};

/**
 * Disable rate limiting during automated tests so E2E suites (which register
 * and log in many times from a single IP) are not blocked. Production and
 * development keep full protection.
 *
 * A dedicated security E2E suite can opt back IN by setting
 * `RATE_LIMIT_FORCE=1`, allowing us to assert the limiter actually blocks
 * abusive traffic. Evaluated per-request, so it reads env at call time.
 */
const skipInTest = (): boolean =>
    process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_FORCE !== '1';

const isProduction = process.env.NODE_ENV === 'production';

function readLimit(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function resolveLimit(name: string, productionDefault: number, developmentDefault: number): number {
    const useProductionDefaults = isProduction || process.env.RATE_LIMIT_FORCE === '1';
    return readLimit(name, useProductionDefaults ? productionDefault : developmentDefault);
}

const skipHealthCheck = (req: Request): boolean =>
    req.path === '/health' || req.originalUrl === '/health';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: () => resolveLimit('RATE_LIMIT_API_MAX', 100, 1000),
    message: {
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later.',
        error: 'Too Many Requests',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIpKey,
    skip: (req) => skipInTest() || skipHealthCheck(req),
});

// Strict limiter for authentication endpoints (login)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: () => resolveLimit('RATE_LIMIT_AUTH_MAX', 5, 50),
    message: {
        statusCode: 429,
        message: 'Too many login attempts, please try again after 15 minutes.',
        error: 'Too Many Requests',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    keyGenerator: clientIpKey,
    skip: skipInTest,
});

// Limiter for registration endpoint
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: () => resolveLimit('RATE_LIMIT_REGISTER_MAX', 3, 30),
    message: {
        statusCode: 429,
        message: 'Too many accounts created from this IP, please try again after 1 hour.',
        error: 'Too Many Requests',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIpKey,
    skip: skipInTest,
});

// Limiter for password reset / OTP endpoints
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: () => resolveLimit('RATE_LIMIT_PASSWORD_RESET_MAX', 3, 30),
    message: {
        statusCode: 429,
        message: 'Too many requests, please try again after 1 hour.',
        error: 'Too Many Requests',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIpKey,
    skip: skipInTest,
});

export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: () => resolveLimit('RATE_LIMIT_AI_MAX', 30, 300),
    message: {
        statusCode: 429,
        message: 'AI request limit reached. Please try again later.',
        error: 'Too Many Requests',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIpKey,
    skip: skipInTest,
});

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        apiLimiter(req, res, next);
    }
}
