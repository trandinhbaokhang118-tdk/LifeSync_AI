import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        let details: Record<string, unknown> | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse as Record<string, unknown>;
                code = (resp.code as string) || this.getErrorCode(status);
                message = (resp.message as string) || exception.message;
                details = resp.details as Record<string, unknown>;

                // Handle class-validator errors
                if (Array.isArray(resp.message)) {
                    message = 'Validation failed';
                    details = { errors: resp.message };
                    code = 'VALIDATION_ERROR';
                }
            } else {
                message = exceptionResponse as string;
                code = this.getErrorCode(status);
            }
        } else if (exception instanceof Error) {
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);

            if (this.isDatabaseUnavailableError(exception)) {
                status = HttpStatus.SERVICE_UNAVAILABLE;
                code = 'DATABASE_UNAVAILABLE';
                message = 'Database is currently unavailable. Please try again shortly.';
            } else {
                message = process.env.NODE_ENV === 'development' ? exception.message : message;
            }
        }

        response.status(status).json({
            error: {
                code,
                message,
                ...(details && { details }),
            },
        });
    }

    private getErrorCode(status: number): string {
        const codeMap: Record<number, string> = {
            400: 'VALIDATION_ERROR',
            401: 'AUTH_UNAUTHORIZED',
            403: 'AUTH_FORBIDDEN',
            404: 'RESOURCE_NOT_FOUND',
            409: 'CONFLICT',
            500: 'INTERNAL_ERROR',
            503: 'SERVICE_UNAVAILABLE',
        };
        return codeMap[status] || 'UNKNOWN_ERROR';
    }

    private isDatabaseUnavailableError(exception: Error): boolean {
        if (exception instanceof Prisma.PrismaClientInitializationError) {
            const errorCode = (exception as { errorCode?: string }).errorCode;
            return errorCode === 'P1001' || exception.message.includes("Can't reach database server");
        }

        return exception.message.includes("Can't reach database server");
    }
}
