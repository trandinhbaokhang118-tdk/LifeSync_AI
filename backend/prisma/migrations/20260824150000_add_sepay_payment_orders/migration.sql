ALTER TABLE `subscriptions`
  MODIFY `provider` ENUM('STRIPE', 'SEPAY', 'VNPAY', 'MOMO', 'ZALOPAY')
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

CREATE TABLE IF NOT EXISTS `payment_orders` (
  `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` ENUM('STRIPE', 'SEPAY', 'VNPAY', 'MOMO', 'ZALOPAY') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceNumber` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tier` ENUM('FREE', 'PRO', 'PLUS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amountVND` INTEGER NOT NULL,
  `status` ENUM('PENDING', 'PAID', 'VOID', 'CANCELED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `providerOrderId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `transactionId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `payment_orders_invoiceNumber_key` (`invoiceNumber`),
  UNIQUE INDEX `payment_orders_transactionId_key` (`transactionId`),
  INDEX `payment_orders_userId_status_idx` (`userId`, `status`),
  INDEX `payment_orders_provider_status_idx` (`provider`, `status`),
  CONSTRAINT `payment_orders_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;
