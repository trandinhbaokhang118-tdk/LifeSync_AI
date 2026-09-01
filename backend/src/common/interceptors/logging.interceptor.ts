import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const { method, url } = request;
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - startTime;
                    const status = response.statusCode;
                    const message = `${method} ${url} ${status} - ${duration}ms`;

                    if (status >= 500) {
                        this.logger.error(message);
                    } else if (status >= 400) {
                        this.logger.warn(message);
                    } else {
                        this.logger.log(message);
                    }
                },
                error: (err: { status?: number }) => {
                    const duration = Date.now() - startTime;
                    const status = err?.status ?? response.statusCode ?? 500;
                    const message = `${method} ${url} ${status} - ${duration}ms`;

                    if (status >= 500) {
                        this.logger.error(message);
                    } else {
                        this.logger.warn(message);
                    }
                },
            }),
        );
    }
}
