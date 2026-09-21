CREATE TABLE `landing_content` (
 `id` VARCHAR(191) NOT NULL DEFAULT 'landing',
 `draft` JSON NOT NULL, `published` JSON NULL,
 `revision` INTEGER NOT NULL DEFAULT 0,
 `publishedAt` DATETIME(3) NULL, `updatedAt` DATETIME(3) NOT NULL,
 `updatedBy` VARCHAR(191) NULL,
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `landing_assets` (
 `id` VARCHAR(191) NOT NULL, `mime` VARCHAR(191) NOT NULL,
 `bytes` LONGBLOB NOT NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
