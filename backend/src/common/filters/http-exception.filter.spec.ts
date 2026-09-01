import { ArgumentsHost, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        jest.restoreAllMocks();
    });

    it('does not expose raw Prisma database connection errors to clients', () => {
        process.env.NODE_ENV = 'development';
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const host = {
            switchToHttp: () => ({
                getResponse: () => ({ status }),
            }),
        } as unknown as ArgumentsHost;
        const filter = new HttpExceptionFilter();

        filter.catch(
            new Error(
                "Invalid `this.prisma.user.findUnique()` invocation: Can't reach database server at `localhost:3306`",
            ),
            host,
        );

        expect(status).toHaveBeenCalledWith(503);
        expect(json).toHaveBeenCalledWith({
            error: {
                code: 'DATABASE_UNAVAILABLE',
                message: 'Database is currently unavailable. Please try again shortly.',
            },
        });
    });
});
