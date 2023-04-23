-- CreateTable
CREATE TABLE `GuildSettings` (
    `GuildID` BIGINT NOT NULL,
    `Prefix` VARCHAR(3) NOT NULL DEFAULT '>',
    `GuildName` VARCHAR(255) NOT NULL,
    `Active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`GuildID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Snowflake` (
    `GuildID` BIGINT NOT NULL,
    `UserID` BIGINT NOT NULL,

    UNIQUE INDEX `Snowflake_GuildID_UserID_key`(`GuildID`, `UserID`),
    PRIMARY KEY (`GuildID`, `UserID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Logs` (
    `Date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Value` TEXT NOT NULL,
    `Type` ENUM('ERROR', 'SEVERE', 'WARNING', 'INFO', 'DEBUG', 'MUSIC') NOT NULL DEFAULT 'INFO',

    PRIMARY KEY (`Date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
