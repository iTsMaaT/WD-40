const { sqliteTable, primaryKey, text, unique, integer, customType } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

const datetime = customType({
    dataType() {
        return 'integer';
    },
    fromDriver(v) {
        let d = new Date(v);
        if (typeof v !== 'number') {
            d = new Date(parseInt(v));
        }
        let date = `${d.getFullYear()}-${d.getMonth() >= 9 ? d.getMonth() + 1 : '0' + (d.getMonth() + 1)}-${d.getDate() <= 9 ? '0' + d.getDate() : d.getDate()}`;
        let time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
        return `${date} ${time}`;
    },
    toDriver(v) {
        return (new Date(v)).getTime();
    }
});

const blacklist = sqliteTable("Blacklist", {
    id: integer("ID", { mode: "number" }).primaryKey({ autoIncrement: true }).notNull(),
    guildId: text("GuildID", { length: 25 }).notNull(),
    userId: text("UserID", { length: 25 }).notNull(),
    permission: text("Permission").notNull(),
},
    (table) => {
        return {
            blacklistUic: unique("Blacklist_UIC").on(table.guildId, table.userId),
        };
    });

const guildsettings = sqliteTable("GuildSettings", {
    guildId: text("GuildID", { length: 25 }).notNull(),
    prefix: text("Prefix", { length: 3 }).default(">").notNull(),
    guildName: text("GuildName", { length: 255 }).notNull(),
    active: integer("Active", { mode: "boolean" }).default(1).notNull(),
    responses: integer("Responses", { mode: "boolean" }).default(0).notNull(),
    personality: text("Personality", { length: 500 }).default("Neutral").notNull(),
},
    (table) => {
        return {
            guildsettingsGuildIdPk: primaryKey({ columns: [table.guildId], name: "guildsettings_GuildID_pk" }),
        };
    });

const logs = sqliteTable("Logs", {
    date: datetime("Date", { mode: "string", fsp: 3 }).default(Date.now()).notNull(),
    value: text("Value").notNull(),
    type: text("Type").default("INFO").notNull(),
    id: integer("ID", { mode: "number" }).primaryKey({ autoIncrement: true }).notNull(),
});

const reactions = sqliteTable("Reactions", {
    id: integer("ID", { mode: "number" }).primaryKey({ autoIncrement: true }).notNull(),
    guildId: text("GuildID", { length: 25 }).notNull(),
    channelString: text("ChannelString", { length: 25 }).notNull(),
    string: text("String", { length: 191 }).notNull(),
    emotes: text("Emotes", { length: 191 }).notNull(),
},
    (table) => {
        return {
            reactionsGuildIdChannelStringStringKey: unique("Reactions_GuildID_ChannelString_String_key").on(table.guildId, table.channelString, table.string),
        };
    });

const responses = sqliteTable("Responses", {
    id: integer("ID", { mode: "number" }).primaryKey({ autoIncrement: true }).notNull(),
    guildId: text("GuildID", { length: 25 }).notNull(),
    channelString: text("ChannelString", { length: 25 }).notNull(),
    string: text("String", { length: 191 }).notNull(),
    response: text("Response", { length: 191 }).notNull(),
},
    (table) => {
        return {
            responsesGuildIdChannelStringStringKey: unique("Responses_GuildID_ChannelString_String_key").on(table.guildId, table.channelString, table.string),
        };
    });

const snowflake = sqliteTable("Snowflake", {
    guildId: text("GuildID", { length: 25 }).notNull(),
    userId: text("UserID", { length: 25 }).notNull(),
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