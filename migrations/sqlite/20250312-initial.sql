CREATE TABLE `Blacklist` (
    `ID` INTEGER PRIMARY KEY AUTOINCREMENT,
    `GuildID` TEXT NOT NULL,
    `UserID` TEXT NOT NULL,
    `Permission` TEXT NOT NULL,
    UNIQUE(`GuildID`, `UserID`)
);

CREATE TABLE `GuildSettings` (
    `GuildID` TEXT PRIMARY KEY NOT NULL,
    `Prefix` TEXT DEFAULT ">" NOT NULL,
    `GuildName` TEXT NOT NULL,
    `Active` INTEGER DEFAULT 1 NOT NULL,
    `Responses` INTEGER DEFAULT 0 NOT NULL,
    `Personality` TEXT DEFAULT "Neutral" NOT NULL
);

CREATE TABLE `Logs` (
    `ID` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    `Date` INTEGER NOT NULL,
    `Value` TEXT NOT NULL,
    `Type` DEFAULT "INFO" NOT NULL
);

CREATE TABLE `Reactions` (
    `ID` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    `GuildID` TEXT NOT NULL,
    `ChannelString` TEXT NOT NULL,
    `String` TEXT NOT NULL,
    `Emotes` TEXT NOT NULL,
    UNIQUE(`GuildID`, `ChannelString`, `String`)
);

CREATE TABLE `Responses` (
    `ID` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    `GuildID` TEXT NOT NULL,
    `ChannelString` TEXT NOT NULL,
    `String` TEXT NOT NULL,
    `Response` TEXT NOT NULL,
    UNIQUE(`GuildID`, `ChannelString`, `String`)
);


CREATE TABLE `Snowflake` (
    `GuildID` TEXT NOT NULL,
    `UserID` TEXT NOT NULL,
    PRIMARY KEY(`GuildID`, `UserID`)
);