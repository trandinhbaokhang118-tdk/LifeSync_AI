-- AlterTable
ALTER TABLE `users`
    ADD COLUMN `adminTotpSecret` VARCHAR(191) NULL,
    ADD COLUMN `adminTotpEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `adminTotpConfirmedAt` DATETIME(3) NULL;
