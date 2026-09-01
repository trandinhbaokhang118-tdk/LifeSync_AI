import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the real IP address of the client
 * Supports Cloudflare headers (CF-Connecting-IP) and standard proxy headers
 * 
 * Usage:
 * @Get('test')
 * test(@RealIp() ip: string) {
 *   console.log('Client IP:', ip);
 * }
 */
export const RealIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Priority order for IP detection:
    // 1. CF-Connecting-IP (Cloudflare's real client IP)
    // 2. X-Forwarded-For (Standard proxy header, take first IP)
    // 3. X-Real-IP (Nginx proxy header)
    // 4. RemoteAddress (Direct connection)
    
    const cfIp = request.headers['cf-connecting-ip'];
    if (cfIp) {
      return cfIp;
    }
    
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
      // The first one is the real client IP
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }
    
    // Fallback to connection remote address
    return request.connection?.remoteAddress || 
           request.socket?.remoteAddress || 
           'unknown';
  },
);
