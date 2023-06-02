/*
  Warnings:

  - Added the required column `ChannelName` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `GuildName` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UserName` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` ADD COLUMN `ChannelName` VARCHAR(191) NOT NULL,
    ADD COLUMN `GuildName` VARCHAR(191) NOT NULL,
    ADD COLUMN `UserName` VARCHAR(191) NOT NULL;
