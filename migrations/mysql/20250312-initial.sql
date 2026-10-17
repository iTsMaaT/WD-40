CREATE TABLE `Blacklist` (
    `ID`         BIGINT PRIMARY KEY AUTO_INCREMENT,
    `GuildID`    VARCHAR(191) NOT NULL,
    `UserID`     VARCHAR(25)  NOT NULL,
    `Permission` TEXT         NOT NULL,
    CONSTRAINT `Blacklist_UIC` UNIQUE (`GuildID`, `UserID`)
) ENGINE = InnoDB COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `GuildSettings` (
    `GuildID`     VARCHAR(191) PRIMARY KEY       NOT NULL,
    `Prefix`      VARCHAR(3)   DEFAULT '>'       NOT NULL,
    `GuildName`   VARCHAR(255)                   NOT NULL,
    `Active`      TINYINT(1)   DEFAULT 1         NOT NULL,
    `Responses`   TINYINT(1)   DEFAULT 0         NOT NULL,
    `Personality` VARCHAR(500) DEFAULT 'Neutral' NOT NULL
) ENGINE = InnoDB COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `Logs` (
    `ID`    BIGINT PRIMARY KEY AUTO_INCREMENT,
    `Date`  DATETIME(3)                                                                                  DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    `Value` TEXT                                                                                                                      NOT NULL,
    `Type`  ENUM ('ERROR', 'SEVERE', 'WARNING', 'INFO', 'DEBUG', 'MUSIC', 'CONSOLE', 'EVENT', 'COMMAND') DEFAULT 'INFO'               NOT NULL
) ENGINE = InnoDB COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `Reactions` (
    `ID`            BIGINT PRIMARY KEY AUTO_INCREMENT,
    `GuildID`       VARCHAR(191) NOT NULL,
    `ChannelString` VARCHAR(25)  NOT NULL,
    `String`        VARCHAR(191) NOT NULL,
    `Emotes`        VARCHAR(191) NOT NULL,
    CONSTRAINT `Reactions_GuildID_ChannelString_String_key` UNIQUE (`GuildID`, `ChannelString`, `String`)
) ENGINE = InnoDB COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `Responses` (
    `ID`            BIGINT PRIMARY KEY AUTO_INCREMENT,
    `GuildID`       VARCHAR(191) NOT NULL,
    `ChannelString` VARCHAR(25)  NOT NULL,
    `String`        VARCHAR(191) NOT NULL,
    `Response`      VARCHAR(191) NOT NULL,
    CONSTRAINT Responses_GuildID_ChannelString_String_key UNIQUE (`GuildID`, `ChannelString`, `String`)
) ENGINE = InnoDB COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `Snowflake` (
    `GuildID` VARCHAR(191) NOT NULL,
    `UserID`  VARCHAR(25)  NOT NULL,
    PRIMARY KEY (`GuildID`, `UserID`),
    CONSTRAINT `Snowflake_GuildID_UserID_key` UNIQUE (`GuildID`, `UserID`)
) ENGINE = InnoDB COLLATE = utf8mb4_unicode_ci;