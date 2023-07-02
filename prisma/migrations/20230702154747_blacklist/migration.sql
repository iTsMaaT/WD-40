/*
  Warnings:

  - The primary key for the `GuildSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `snowflake` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `GuildSettings` DROP PRIMARY KEY,
    MODIFY `GuildID` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`GuildID`);

-- AlterTable
ALTER TABLE `Snowflake` DROP PRIMARY KEY,
    MODIFY `GuildID` VARCHAR(191) NOT NULL,
    MODIFY `UserID` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`GuildID`, `UserID`);

-- CreateTable
CREATE TABLE `Blacklist` (
    `ID` BIGINT NOT NULL AUTO_INCREMENT,
    `GuildID` VARCHAR(191) NOT NULL,
    `UserID` VARCHAR(191) NOT NULL,
    `Permission` TEXT NOT NULL,

    UNIQUE INDEX `Blacklist_GuildID_UserID_key`(`GuildID`, `UserID`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
