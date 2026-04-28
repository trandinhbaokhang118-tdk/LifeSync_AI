import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

function isPrivateNetworkOrigin(origin: string): boolean {
    try {
        const { protocol, hostname } = new URL(origin);

        if (!['http:', 'https:', 'capacitor:'].includes(protocol)) {
            return false;
        }

        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '::1' ||
            hostname === '10.0.2.2' ||
            /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
            /^192\.168\.\d+\.\d+$/.test(hostname) ||
            /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
        );
    } catch {
        return false;
    }
}

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const allowedOrigins = new Set(
        [
            'http://localhost',
            'https://localhost',
            'capacitor://localhost',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177',
            process.env.FRONTEND_URL,
            process.env.MOBILE_FRONTEND_URL,
        ].filter(Boolean) as string[],
    );

    // Serve static files
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });

    // Enable CORS
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin) || isPrivateNetworkOrigin(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
        },
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Time Manager API')
        .setDescription('API documentation for Time Manager application')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || '0.0.0.0';
    await app.listen(port, host);
    console.log(`Application is running on host ${host}:${port}`);
    console.log(`Local API: http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
}
bootstrap();
