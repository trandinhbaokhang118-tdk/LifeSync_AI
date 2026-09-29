CREATE TABLE `planning_projects` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `input` JSON NOT NULL,
    `proposal` JSON NOT NULL,
    `advice` TEXT NOT NULL,
    `conversationId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `planning_projects_userId_createdAt_idx` (`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `tasks` ADD COLUMN `projectId` VARCHAR(191) NULL;
ALTER TABLE `planning_projects` ADD CONSTRAINT `planning_projects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `planning_projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
