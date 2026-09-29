ALTER TABLE `subscriptions` ADD COLUMN `trialUsed` BOOLEAN NOT NULL DEFAULT false;
UPDATE `subscriptions` SET `trialUsed` = true WHERE `tier` <> 'FREE';
