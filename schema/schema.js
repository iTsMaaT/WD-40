import { mysqlTable, primaryKey, varchar, datetime, text, unique, int, bigint, tinyint, mysqlEnum } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const blacklist = mysqlTable("blacklist", {
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

export const guildsettings = mysqlTable("guildsettings", {
    guildId: varchar("GuildID", { length: 25 }).notNull(),
    prefix: varchar("Prefix", { length: 3 }).default(">").notNull(),
    guildName: varchar("GuildName", { length: 255 }).notNull(),
    active: tinyint("Active").default(1).notNull(),
    responses: tinyint("Responses").default(0).notNull(),
    personality: varchar("Personality", { length: 500 }).default("Answer as if you are annoying.").notNull(),
},
(table) => {
    return {
        guildsettingsGuildIdPk: primaryKey({ columns: [table.guildId], name: "guildsettings_GuildID_pk" }),
    };
});

export const logs = mysqlTable("logs", {
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

export const message = mysqlTable("message", {
    id: bigint("ID", { mode: "number" }).autoincrement().notNull(),
    messageId: varchar("MessageID", { length: 191 }).notNull(),
    userId: varchar("UserID", { length: 191 }).notNull(),
    channelId: varchar("ChannelID", { length: 191 }).notNull(),
    guildId: varchar("GuildID", { length: 191 }).notNull(),
    timestamp: datetime("Timestamp", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
    content: text("Content").notNull(),
    channelName: varchar("ChannelName", { length: 191 }).notNull(),
    guildName: varchar("GuildName", { length: 191 }).notNull(),
    userName: varchar("UserName", { length: 191 }).notNull(),
},
(table) => {
    return {
        messageIdPk: primaryKey({ columns: [table.id], name: "message_ID_pk" }),
    };
});

export const reactions = mysqlTable("reactions", {
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

export const responses = mysqlTable("responses", {
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

export const snowflake = mysqlTable("snowflake", {
    guildId: varchar("GuildID", { length: 25 }).notNull(),
    userId: varchar("UserID", { length: 25 }).notNull(),
},
(table) => {
    return {
        snowflakeGuildIdUserIdPk: primaryKey({ columns: [table.guildId, table.userId], name: "snowflake_GuildID_UserID_pk" }),
        snowflakeGuildIdUserIdKey: unique("Snowflake_GuildID_UserID_key").on(table.guildId, table.userId),
    };
});