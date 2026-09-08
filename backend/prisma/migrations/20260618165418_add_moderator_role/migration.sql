-- AlterTable
ALTER TABLE `daily_activities` MODIFY `date` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('USER', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'USER';
