-- AlterTable
ALTER TABLE `Logs` MODIFY `Type` ENUM('ERROR', 'SEVERE', 'WARNING', 'INFO', 'DEBUG', 'MUSIC', 'CONSOLE', 'EVENT') NOT NULL DEFAULT 'INFO';

-- CreateTable
CREATE TABLE `Responses` (
    `ID` BIGINT NOT NULL AUTO_INCREMENT,
    `GuildID` VARCHAR(191) NOT NULL,
    `ChannelString` VARCHAR(191) NOT NULL,
    `String` VARCHAR(191) NOT NULL,
    `Response` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Responses_GuildID_ChannelString_String_key`(`GuildID`, `ChannelString`, `String`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
