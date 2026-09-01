import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

interface CliOptions {
    email?: string;
    password?: string;
    list: boolean;
    json: boolean;
    limit: number;
    positional: string[];
}

const accountSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    adminTotpEnabled: true,
};

function parseArgs(argv: string[]): CliOptions {
    const options: CliOptions = {
        list: false,
        json: false,
        limit: 50,
        positional: [],
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        const [key, inlineValue] = arg.split('=', 2);
        const nextValue = inlineValue ?? argv[index + 1];

        if (arg === '--list') {
            options.list = true;
            continue;
        }

        if (arg === '--json') {
            options.json = true;
            continue;
        }

        if (key === '--email' && nextValue) {
            options.email = nextValue;
            if (inlineValue === undefined) index += 1;
            continue;
        }

        if (key === '--password' && nextValue) {
            options.password = nextValue;
            if (inlineValue === undefined) index += 1;
            continue;
        }

        if (key === '--limit' && nextValue) {
            const parsedLimit = Number.parseInt(nextValue, 10);
            if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
                options.limit = parsedLimit;
            }
            if (inlineValue === undefined) index += 1;
            continue;
        }

        if (!arg.startsWith('--')) {
            options.positional.push(arg);
        }
    }

    if (options.positional.includes('json')) {
        options.json = true;
        options.positional = options.positional.filter((item) => item !== 'json');
    }

    if (options.positional[0] === 'list') {
        options.list = true;
        const parsedLimit = Number.parseInt(options.positional[1], 10);
        if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
            options.limit = parsedLimit;
        }
        return options;
    }

    if (!options.email && options.positional[0]) {
        options.email = options.positional[0];
    }

    if (!options.password && options.positional[1]) {
        options.password = options.positional[1];
    }

    return options;
}

function printUsage() {
    console.log('Usage:');
    console.log('  npm run account:check -- list');
    console.log('  npm run account:check -- user@example.com');
    console.log('  npm run account:check -- user@example.com password123');
    console.log('  npx ts-node scripts/check-account.ts --email user@example.com --password password123 --json');
    console.log('');
    console.log('Notes:');
    console.log('  - This script never prints password hashes, tokens, or MFA secrets.');
    console.log('  - Run it only on a trusted machine with access to DATABASE_URL.');
}

function printResult(result: unknown, json: boolean) {
    if (json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    if (Array.isArray(result)) {
        console.table(result);
        return;
    }

    console.dir(result, { depth: null, colors: true });
}

async function listAccounts(options: CliOptions) {
    const accounts = await prisma.user.findMany({
        take: options.limit,
        orderBy: { createdAt: 'asc' },
        select: accountSelect,
    });

    printResult(accounts, options.json);
}

async function checkAccount(options: CliOptions) {
    if (!options.email) {
        printUsage();
        process.exitCode = 1;
        return;
    }

    const account = await prisma.user.findUnique({
        where: { email: options.email },
        select: {
            ...accountSelect,
            passwordHash: true,
        },
    });

    if (!account) {
        printResult({ exists: false, email: options.email }, options.json);
        process.exitCode = 2;
        return;
    }

    const { passwordHash, ...safeAccount } = account;
    const passwordChecked = options.password !== undefined;
    const passwordMatch = passwordChecked
        ? await argon2.verify(passwordHash, options.password as string)
        : undefined;

    printResult(
        {
            exists: true,
            account: safeAccount,
            passwordChecked,
            ...(passwordChecked && { passwordMatch }),
        },
        options.json,
    );

    if (passwordChecked && !passwordMatch) {
        process.exitCode = 3;
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.list) {
        await listAccounts(options);
        return;
    }

    await checkAccount(options);
}

main()
    .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
