CREATE TABLE `user_presence` (
  `userId` VARCHAR(191) NOT NULL,
  `seenAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`),
  INDEX `user_presence_seenAt_idx` (`seenAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
