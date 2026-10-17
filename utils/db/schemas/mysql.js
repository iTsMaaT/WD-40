const { mysqlTable, primaryKey, varchar, datetime, text, unique, int, bigint, tinyint, mysqlEnum } = require("drizzle-orm/mysql-core");
const { sql } = require("drizzle-orm");

const blacklist = mysqlTable("Blacklist", {
    id: bigint("ID", { mode: "number" }).autoincrement().notNull(),
    guildId: varchar("GuildID", { length: 25 }).notNull(),
    userId: varchar("UserID", { length: 25 }).notNull(),
    permission: text("Permission").notNull(),
},
(table) => {
    return {
        blacklistIdPk: primaryKey({ columns: [table.id], name: "blacklist_ID_pk" }),
        blacklistUic: unique("Blacklist_UIC").on(table.guildId, table.userId),
    };
});

const guildsettings = mysqlTable("GuildSettings", {
    guildId: varchar("GuildID", { length: 25 }).notNull(),
    prefix: varchar("Prefix", { length: 3 }).default(">").notNull(),
    guildName: varchar("GuildName", { length: 255 }).notNull(),
    active: tinyint("Active").default(1).notNull(),
    responses: tinyint("Responses").default(0).notNull(),
    personality: varchar("Personality", { length: 500 }).default("Neutral").notNull(),
},
(table) => {
    return {
        guildsettingsGuildIdPk: primaryKey({ columns: [table.guildId], name: "guildsettings_GuildID_pk" }),
    };
});

const logs = mysqlTable("Logs", {
    date: datetime("Date", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
    value: text("Value").notNull(),
    type: mysqlEnum("Type", ["ERROR", "SEVERE", "WARNING", "INFO", "DEBUG", "MUSIC", "CONSOLE", "EVENT"]).default("INFO").notNull(),
    id: bigint("ID", { mode: "number" }).autoincrement().notNull(),
},
(table) => {
    return {
        logsIdPk: primaryKey({ columns: [table.id], name: "logs_ID_pk" }),
    };
});

const reactions = mysqlTable("Reactions", {
    id: bigint("ID", { mode: "number" }).autoincrement().notNull(),
    guildId: varchar("GuildID", { length: 25 }).notNull(),
    channelString: varchar("ChannelString", { length: 25 }).notNull(),
    string: varchar("String", { length: 191 }).notNull(),
    emotes: varchar("Emotes", { length: 191 }).notNull(),
},
(table) => {
    return {
        reactionsIdPk: primaryKey({ columns: [table.id], name: "reactions_ID_pk" }),
        reactionsGuildIdChannelStringStringKey: unique("Reactions_GuildID_ChannelString_String_key").on(table.guildId, table.channelString, table.string),
    };
});

const responses = mysqlTable("Responses", {
    id: bigint("ID", { mode: "number" }).autoincrement().notNull(),
    guildId: varchar("GuildID", { length: 25 }).notNull(),
    channelString: varchar("ChannelString", { length: 25 }).notNull(),
    string: varchar("String", { length: 191 }).notNull(),
    response: varchar("Response", { length: 191 }).notNull(),
},
(table) => {
    return {
        responsesIdPk: primaryKey({ columns: [table.id], name: "responses_ID_pk" }),
        responsesGuildIdChannelStringStringKey: unique("Responses_GuildID_ChannelString_String_key").on(table.guildId, table.channelString, table.string),
    };
});

const snowflake = mysqlTable("Snowflake", {
    guildId: varchar("GuildID", { length: 25 }).notNull(),
    userId: varchar("UserID", { length: 25 }).notNull(),
},
(table) => {
    return {
        snowflakeGuildIdUserIdPk: primaryKey({ columns: [table.guildId, table.userId], name: "snowflake_GuildID_UserID_pk" }),
        snowflakeGuildIdUserIdKey: unique("Snowflake_GuildID_UserID_key").on(table.guildId, table.userId),
    };
});

module.exports = {
    blacklist,
    guildsettings,
    logs,
    reactions,
    responses,
    snowflake,
};