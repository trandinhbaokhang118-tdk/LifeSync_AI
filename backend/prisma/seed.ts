import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Hash passwords
    const adminPassword = await argon2.hash('admin123');
    const userPassword = await argon2.hash('user123');

    // Create Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@lifesyncai.com' },
        update: {},
        create: {
            email: 'admin@lifesyncai.com',
            passwordHash: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
        },
    });
    console.log('✅ Created admin:', admin.email);

    // Create Demo User
    const user = await prisma.user.upsert({
        where: { email: 'user@demo.com' },
        update: {},
        create: {
            email: 'user@demo.com',
            passwordHash: userPassword,
            name: 'Demo User',
            role: 'USER',
        },
    });
    console.log('✅ Created user:', user.email);

    // Create Tags for demo user
    const tags = await Promise.all([
        prisma.tag.create({
            data: {
                userId: user.id,
                name: 'Work',
                color: '#3B82F6',
            },
        }),
        prisma.tag.create({
            data: {
                userId: user.id,
                name: 'Personal',
                color: '#10B981',
            },
        }),
        prisma.tag.create({
            data: {
                userId: user.id,
                name: 'Urgent',
                color: '#EF4444',
            },
        }),
    ]);
    console.log('✅ Created tags:', tags.length);

    // Create Demo Tasks
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const tasks = await Promise.all([
        prisma.task.create({
            data: {
                userId: user.id,
                title: 'Hoàn thành báo cáo tuần',
                description: 'Tổng hợp công việc tuần này và gửi cho manager',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                startAt: now,
                dueAt: tomorrow,
                tags: {
                    create: [
                        { tagId: tags[0].id }, // Work
                        { tagId: tags[2].id }, // Urgent
                    ],
                },
            },
        }),
        prisma.task.create({
            data: {
                userId: user.id,
                title: 'Học React Hooks',
                description: 'Xem video tutorial và làm bài tập',
                status: 'TODO',
                priority: 'MEDIUM',
                startAt: tomorrow,
                dueAt: nextWeek,
                tags: {
                    create: [{ tagId: tags[1].id }], // Personal
                },
            },
        }),
        prisma.task.create({
            data: {
                userId: user.id,
                title: 'Họp team',
                description: 'Daily standup meeting',
                status: 'TODO',
                priority: 'HIGH',
                startAt: tomorrow,
                dueAt: tomorrow,
                tags: {
                    create: [{ tagId: tags[0].id }], // Work
                },
            },
        }),
        prisma.task.create({
            data: {
                userId: user.id,
                title: 'Đi gym',
                description: 'Tập lưng và vai',
                status: 'DONE',
                priority: 'LOW',
                startAt: now,
                dueAt: now,
                tags: {
                    create: [{ tagId: tags[1].id }], // Personal
                },
            },
        }),
    ]);
    console.log('✅ Created tasks:', tasks.length);

    // Create Time Blocks
    const timeBlocks = await Promise.all([
        prisma.timeBlock.create({
            data: {
                userId: user.id,
                title: 'Focus Time - Coding',
                description: 'Deep work session',
                startAt: now,
                endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
            },
        }),
        prisma.timeBlock.create({
            data: {
                userId: user.id,
                title: 'Meeting',
                description: 'Team sync',
                startAt: tomorrow,
                endAt: new Date(tomorrow.getTime() + 1 * 60 * 60 * 1000), // 1 hour
            },
        }),
    ]);
    console.log('✅ Created time blocks:', timeBlocks.length);

    // Create Reminders
    const reminders = await Promise.all([
        prisma.reminder.create({
            data: {
                userId: user.id,
                message: 'Nhớ nộp báo cáo!',
                triggerAt: tomorrow,
            },
        }),
        prisma.reminder.create({
            data: {
                userId: user.id,
                message: 'Họp team lúc 2h chiều',
                triggerAt: tomorrow,
            },
        }),
    ]);
    console.log('✅ Created reminders:', reminders.length);

    // Create Notifications
    const notifications = await Promise.all([
        prisma.notification.create({
            data: {
                userId: user.id,
                title: 'Chào mừng!',
                message: 'Chào mừng bạn đến với LifeSync AI! 🎉',
            },
        }),
        prisma.notification.create({
            data: {
                userId: user.id,
                title: 'Task sắp đến hạn',
                message: 'Bạn có 2 tasks cần hoàn thành trong ngày mai',
            },
        }),
    ]);
    console.log('✅ Created notifications:', notifications.length);

    console.log('');
    console.log('🎉 Seeding completed!');
    console.log('');
    console.log('📝 Demo Accounts:');
    console.log('');
    console.log('👤 Admin:');
    console.log('   Email: admin@lifesyncai.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 User:');
    console.log('   Email: user@demo.com');
    console.log('   Password: user123');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
