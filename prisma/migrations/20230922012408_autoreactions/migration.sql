-- CreateTable
CREATE TABLE `Reactions` (
    `ID` BIGINT NOT NULL AUTO_INCREMENT,
    `GuildID` VARCHAR(191) NOT NULL,
    `ChannelString` VARCHAR(191) NOT NULL,
    `String` VARCHAR(191) NOT NULL,
    `Emotes` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Reactions_GuildID_ChannelString_String_key`(`GuildID`, `ChannelString`, `String`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
