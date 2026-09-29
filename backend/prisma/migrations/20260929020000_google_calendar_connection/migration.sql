CREATE TABLE `google_calendar_connections` (
  `userId` VARCHAR(191) NOT NULL,
  `refreshToken` TEXT NOT NULL,
  `needsReconnect` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `google_calendar_connections_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `google_calendar_oauth_states` (
  `stateHash` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `verifier` TEXT NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`stateHash`),
  INDEX `google_calendar_oauth_states_userId_idx` (`userId`),
  INDEX `google_calendar_oauth_states_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `google_calendar_oauth_states_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `reminders` ADD COLUMN `taskId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `reminders_taskId_key` ON `reminders`(`taskId`);
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
