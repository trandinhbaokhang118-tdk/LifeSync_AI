import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Boots a full Nest application that mirrors the runtime configuration in
 * `src/main.ts` (global validation pipe + the filter/interceptors registered
 * in AppModule). Used by the e2e suites so requests behave like production.
 */
export async function createTestApp(): Promise<{
    app: INestApplication;
    prisma: PrismaService;
    baseUrl: string;
}> {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    await app.listen(0);

    const prisma = app.get(PrismaService);
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 0 : address.port;
    const baseUrl = `http://127.0.0.1:${port}`;

    return { app, prisma, baseUrl };
}

export interface ApiResult<T = unknown> {
    status: number;
    body: T;
}

/** Thin fetch wrapper that parses JSON and surfaces the HTTP status. */
export async function api<T = any>(
    baseUrl: string,
    path: string,
    options: {
        method?: string;
        token?: string;
        body?: unknown;
        /** Extra headers, e.g. a fake CF-Connecting-IP to isolate rate limiters. */
        headers?: Record<string, string>;
    } = {},
): Promise<ApiResult<T>> {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    let body: unknown = null;
    const text = await response.text();
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    return { status: response.status, body: body as T };
}

/** Generates a unique email so parallel/repeat runs never collide. */
export function uniqueEmail(prefix = 'e2e'): string {
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}.${Date.now()}.${random}@example.com`;
}
