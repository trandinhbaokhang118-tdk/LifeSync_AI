-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tier` ENUM('FREE', 'PRO', 'PLUS') NOT NULL DEFAULT 'FREE',
    `status` ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING') NOT NULL DEFAULT 'ACTIVE',
    `provider` ENUM('STRIPE', 'VNPAY', 'MOMO', 'ZALOPAY') NULL,
    `providerSubId` VARCHAR(191) NULL,
    `providerCustomerId` VARCHAR(191) NULL,
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `canceledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_userId_key`(`userId`),
    INDEX `subscriptions_userId_idx`(`userId`),
    INDEX `subscriptions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `tier` ENUM('FREE', 'PRO', 'PLUS') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `priceVND` INTEGER NOT NULL,
    `priceUSD` INTEGER NOT NULL,
    `interval` VARCHAR(191) NOT NULL DEFAULT 'month',
    `features` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `subscription_plans_tier_key`(`tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fitness_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `height` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `goalWeight` DOUBLE NULL,
    `activityLevel` VARCHAR(191) NOT NULL DEFAULT 'moderate',
    `stepGoal` INTEGER NOT NULL DEFAULT 10000,
    `calorieGoal` INTEGER NOT NULL DEFAULT 500,
    `healthConnect` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fitness_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercises` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `subCategory` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL,
    `distance` DOUBLE NULL,
    `steps` INTEGER NULL,
    `caloriesBurned` INTEGER NULL,
    `avgHeartRate` INTEGER NULL,
    `avgPace` DOUBLE NULL,
    `intensity` VARCHAR(191) NOT NULL DEFAULT 'moderate',
    `notes` VARCHAR(191) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exercises_userId_idx`(`userId`),
    INDEX `exercises_performedAt_idx`(`performedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gps_routes` (
    `id` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `polyline` VARCHAR(191) NULL,
    `startLat` DOUBLE NOT NULL,
    `startLng` DOUBLE NOT NULL,
    `endLat` DOUBLE NOT NULL,
    `endLng` DOUBLE NOT NULL,
    `totalDistance` DOUBLE NOT NULL,
    `elevationGain` DOUBLE NULL,
    `duration` INTEGER NULL,

    UNIQUE INDEX `gps_routes_exerciseId_key`(`exerciseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_activities` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `steps` INTEGER NOT NULL DEFAULT 0,
    `distance` DOUBLE NOT NULL DEFAULT 0,
    `calories` INTEGER NOT NULL DEFAULT 0,
    `activeMinutes` INTEGER NOT NULL DEFAULT 0,
    `sleepMinutes` INTEGER NULL,
    `heartRateAvg` INTEGER NULL,
    `syncedAt` DATETIME(3) NULL,
    `source` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `daily_activities_userId_idx`(`userId`),
    INDEX `daily_activities_date_idx`(`date`),
    UNIQUE INDEX `daily_activities_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fitness_profiles` ADD CONSTRAINT `fitness_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gps_routes` ADD CONSTRAINT `gps_routes_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_activities` ADD CONSTRAINT `daily_activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
