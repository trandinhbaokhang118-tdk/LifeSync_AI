import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { api, uniqueEmail } from './e2e-app';

export interface TestUser {
    id: string;
    email: string;
    password: string;
    name: string;
    accessToken: string;
    refreshToken: string;
}

/**
 * Registers a fresh user through the public API and logs them in, returning the
 * tokens needed for authenticated requests. Tracks the created user id so tests
 * can clean up afterwards.
 */
export async function registerAndLogin(
    baseUrl: string,
    createdUserIds: string[],
    overrides: { email?: string; password?: string; name?: string } = {},
): Promise<TestUser> {
    const email = overrides.email ?? uniqueEmail();
    const password = overrides.password ?? 'password123';
    const name = overrides.name ?? 'E2E User';

    const register = await api<{ data: { id: string } }>(baseUrl, '/auth/register', {
        method: 'POST',
        body: { email, password, name },
    });

    if (register.status !== 201) {
        throw new Error(`Failed to register test user: ${JSON.stringify(register.body)}`);
    }

    const userId = register.body.data.id;
    createdUserIds.push(userId);

    const login = await api<{ data: { accessToken: string; refreshToken: string } }>(
        baseUrl,
        '/auth/login',
        {
            method: 'POST',
            body: { email, password },
        },
    );

    if (login.status !== 200) {
        throw new Error(`Failed to login test user: ${JSON.stringify(login.body)}`);
    }

    return {
        id: userId,
        email,
        password,
        name,
        accessToken: login.body.data.accessToken,
        refreshToken: login.body.data.refreshToken,
    };
}

/** Promotes a user and issues the post-MFA admin session used by RBAC tests. */
export async function promoteToAdmin(
    prisma: PrismaService,
    jwtService: JwtService,
    user: TestUser,
): Promise<string> {
    await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.ADMIN },
    });

    return jwtService.sign({ sub: user.id, portal: 'admin' });
}

/** Removes users (and their cascading data) created during a test run. */
export async function cleanupUsers(prisma: PrismaService, userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
        return;
    }

    await prisma.user.deleteMany({
        where: { id: { in: userIds } },
    });
}
