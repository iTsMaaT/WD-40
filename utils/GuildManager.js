const { eq, and } = require("drizzle-orm");
const blacklistSchema = require("./db/BlacklistRepository.js").default;
const selectBL = require("./db/BlacklistRepository.js").select;
const insertBL = require("./db/BlacklistRepository.js").insert;
const updateDB = require("./db/BlacklistRepository.js").update;

const tableManager = require("./db/tableManager.js");
const schema = require("../schema/schema.js");
const repositories = tableManager.generateRepositories(schema);

module.exports = (function(prisma) {

    const prefixes = {};
    const responses = {};
    const personality = {};

    function init(guilds) {
        guilds.forEach(async (g) => {
            const exists = await CheckIfGuildExists(g);
            if (!exists) await AddGuildToDatabase(g);
            const settings = await GetGuildSettings(g);
            prefixes[g.id] = settings.Prefix;
            responses[g.id] = settings.Responses;
            personality[g.id] = settings.Personality;
        });
    }

    async function SetActiveOrCreate(guild, status = true) {
        if (await CheckIfGuildExists(guild))
            await UpdateGuild(guild, { Active: status });
        else
            await AddGuildToDatabase(guild);
    }
    
    async function CheckIfGuildExists(guild) {
        const result = await repositories.guildsettings.select().where(eq(schema.guildsettings.guildId, guild.id));
        return result != undefined && result != null;
    }
    
    async function AddGuildToDatabase(guild) {
        await repositories.guildsettings.insert(
            eq(schema.guildsettings.guildId, guildID),
            eq(schema.guildsettings.GuildName, guild.name),
        );
        prefixes[guild.id] = ">";
        responses[guild.id] = false;
    }
    
    async function GetGuildSettings(guild) {
        return await repositories.guildsettings.select().where(eq(schema.guildsettings.guildId, guild.id));
    }
    
    async function UpdateGuild(guild, data) {
        await repositories.guildsettings.update(data).where(eq(schema.guildsettings.guildId, guild.id));
    }

    async function ToggleResponses(guild, status) {
        await UpdateGuild(guild, { Responses: status });
        responses[guild.id] = status;
    }

    async function TogglePrefix(guild, prefix) {
        await UpdateGuild(guild, { Prefix: prefix });
        prefixes[guild.id] = prefix;
    }

    async function SetPersonality(guild, persona) {
        await UpdateGuild(guild, { Persona: persona });
        persona[guild.id] = persona;
    }

    function GetPrefix(guild) {
        return prefixes[guild.id];
    }

    function GetResponses(guild) {
        return responses[guild.id];
    }

    function GetPersonality(guild) {
        return personality[guild.id];
    }

    async function blacklistFn(guildId) {
        const bl = {};

        try {
            const data = await selectBL().where(eq(blacklistSchema.guildId, guildId));
            if (data.length > 0) {
                data.forEach((value) => {
                    if (value.userId)
                        bl[value.userId] = new String(value.permission).toLowerCase().split(";");

                });
            }
        } catch (e) {
            global.logger.error("Error while initializing blacklist for guild " + guildId + ": " + e.stack);
        }

        function GrantPermission(userId, permission) {
            if (!CheckPermission(userId, permission)) {
                bl[userId] = bl[userId].filter(p => p != permission?.toLowerCase());
                UpdateUserInDB(userId);
            }
        }

        function DenyPermission(userId, permission) {
            if (CheckPermission(userId, permission)) {
                if (bl[userId] === null || bl[userId] === undefined)
                    bl[userId] = [permission?.toLowerCase()];
                else
                    bl[userId].push(permission?.toLowerCase());

                UpdateUserInDB(userId);
            }
        }

        async function UpdateUserInDB(userId) {
            try {
                const exists = await selectBL().where(and(
                    eq(blacklistSchema.guildId, guildId),
                    eq(blacklistSchema.userId, userId),
                ));
                if (exists.length > 0) {
                    await updateDB({ permission: bl[userId].join(";").toLowerCase() }).where(and(
                        eq(blacklistSchema.guildId, guildId),
                        eq(blacklistSchema.userId, userId),
                    ));
                } else {
                    await insertBL({
                        guildId,
                        userId,
                        permission: bl[userId].join(";").toLowerCase(),
                    });
                }
            } catch (e) {
                global.logger.error(`Unable to update Blacklist table (U: ${userId} | G: ${guildId} | P: '${bl[userId].join(";")}')\r\n${e.stack}`);
            }
        }

        function CheckPermission(userId, permission) {
            return bl[userId] === null || bl[userId] === undefined || !bl[userId].includes(permission?.toLowerCase());
        }

        function GetPermissions(userId) {
            return bl[userId];
        }

        return { GrantPermission, DenyPermission, CheckPermission, GetPermissions };
    }

    const blacklist = {};

    async function GetBlacklist(guildId) {
        if (!blacklist[guildId])
            blacklist[guildId] = blacklistFn(guildId);

        return blacklist[guildId];
    }

    async function autoReactFn(guildId) {
        const bl = {};

        try {
            const data = await prisma.Reactions.findMany({
                where: {
                    GuildID: guildId,
                },
            });

            if (data.length > 0) {
                for (const i in data) {
                    if (data[i].ChannelString === undefined) continue;
                    const value = data[i];
                    if (!bl[value.ChannelString])
                        bl[value.ChannelString] = [];

                    bl[value.ChannelString].push({
                        "string": value.String,
                        "emotes": value.Emotes,
                    });
                }
            }
        } catch (e) {
            global.logger.error("Silently failing auto reaction init for guild " + guildId + ", " + e.stack);
        }

        async function addReaction(ChannelPrompt, string, reactions) {
            if (!bl[ChannelPrompt])
                bl[ChannelPrompt] = [];

            bl[ChannelPrompt].push({
                "string": string,
                "emotes": reactions,
            });
            await updateReactionDB(ChannelPrompt, string);
        }

        async function removeReaction(ChannelPrompt, string = null) {
            if (!string) delete bl[ChannelPrompt];
            if (bl[ChannelPrompt]) {
                // Remove the entry with the matching string
                bl[ChannelPrompt] = bl[ChannelPrompt].filter(entry => entry.string !== string);
                if (bl[ChannelPrompt].length == 0) delete bl[ChannelPrompt];
            }
            await updateReactionDB(ChannelPrompt, string);
        }

        async function matchReactions(ChannelPrompt, String, hasAttachment = false) {
            const matchedReactions = [];

            if (bl) {
                for (const channelPrompt of Object.keys(bl)) {
                    if (!ChannelPrompt.includes(channelPrompt)) continue;
                    for (const entry of bl[channelPrompt]) {
                        const { string, emotes } = entry;

                        // Check if the string matches <media> or <link> for URLs
                        if ((/(https?:\/\/[^\s]+)/.test(String) || hasAttachment) && string === "<media>")
                            matchedReactions.push(...emotes.split(";"));


                        if (/(https?:\/\/[^\s]+)/.test(String) && string === "<link>")
                            matchedReactions.push(...emotes.split(";"));


                        // Check if the string matches <attachment> for attachments
                        if (hasAttachment && string === "<attachment>")
                            matchedReactions.push(...emotes.split(";"));


                        // Check for other matches anywhere in the strings
                        if (String.includes(string))
                            matchedReactions.push(...emotes.split(";"));


                        if (string === "<all>")
                            matchedReactions.push(...emotes.split(";"));

                    }
                }
            }

            // if (!matchedReactions[0]) return null;
            return matchedReactions;
        }


        async function getReactions() {
            return bl;
        }

        async function updateReactionDB(ChannelPrompt, String) {
            if (bl[ChannelPrompt]) {
                const EmotesTable = bl[ChannelPrompt].filter(val => val.string === String);
                if (EmotesTable.length > 0) {
                    const Emotes = EmotesTable[0].emotes;

                    // Update or create entries for each string and emotes pair
                    await prisma.Reactions.upsert({
                        where: {
                            GuildID_ChannelString_String: {
                                GuildID: guildId,
                                ChannelString: ChannelPrompt,
                                String,
                            },
                        },
                        update: {
                            Emotes,
                        },
                        create: {
                            GuildID: guildId,
                            ChannelString: ChannelPrompt,
                            String,
                            Emotes,
                        },
                    });
                } else {
                    await prisma.Reactions.delete({
                        where: {
                            GuildID_ChannelString_String: {
                                GuildID: guildId,
                                ChannelString: ChannelPrompt,
                                String,
                            },
                        },
                    });
                }
            } else {
                // Delete all entries for this channel prompt
                await prisma.Reactions.deleteMany({
                    where: {
                        GuildID: guildId,
                        ChannelString: ChannelPrompt,
                    },
                });
            }
        }

        return { addReaction, removeReaction, matchReactions, getReactions };
    }

    const reactions = {};

    async function getAutoReactions(guildId) {
        if (!reactions[guildId])
            reactions[guildId] = await autoReactFn(guildId);

        return reactions[guildId];
    }

    // eefefef

    async function autoResponseFn(guildId) {
        const cache = {};

        try {
            const data = await prisma.Responses.findMany({
                where: {
                    GuildID: guildId,
                },
            });

            if (data.length > 0) {
                for (const i in data) {
                    if (data[i].ChannelString === undefined) continue;
                    const value = data[i];
                    if (!cache[value.ChannelString])
                        cache[value.ChannelString] = [];

                    cache[value.ChannelString].push({
                        "string": value.String,
                        "response": value.Response,
                    });
                }
            }
        } catch (e) {
            global.logger.error("Silently failing auto response init for guild " + guildId + ", " + e.stack);
        }

        async function addResponse(ChannelPrompt, string, response) {
            if (!cache[ChannelPrompt])
                cache[ChannelPrompt] = [];

            cache[ChannelPrompt].push({
                "string": string,
                "response": response,
            });
            await updateResponseDB(ChannelPrompt, string);
        }

        async function removeResponse(ChannelPrompt, string = null) {
            if (!string) delete cache[ChannelPrompt];
            if (cache[ChannelPrompt]) {
                // Remove the entry with the matching string
                cache[ChannelPrompt] = cache[ChannelPrompt].filter(entry => entry.string !== string);
                if (cache[ChannelPrompt].length == 0) delete cache[ChannelPrompt];
            }
            await updateResponseDB(ChannelPrompt, string);
        }

        async function matchResponses(ChannelPrompt, String, hasAttachment = false) {
            const matchedResponses = [];

            if (cache) {
                for (const channelPrompt of Object.keys(cache)) {
                    if (!ChannelPrompt.includes(channelPrompt)) continue;
                    for (const entry of cache[channelPrompt]) {
                        const { string, response } = entry;

                        // Check if the string matches <media> or <link> for URLs
                        if ((/(https?:\/\/[^\s]+)/.test(String) || hasAttachment) && string === "<media>")
                            matchedResponses.push(...response.split(";"));


                        if (/(https?:\/\/[^\s]+)/.test(String) && string === "<link>")
                            matchedResponses.push(...response.split(";"));


                        // Check if the string matches <attachment> for attachments
                        if (hasAttachment && string === "<attachment>")
                            matchedResponses.push(...response.split(";"));


                        // Check for other matches anywhere in the strings
                        if (String.includes(string))
                            matchedResponses.push(...response.split(";"));


                        if (string === "<all>")
                            matchedResponses.push(...response.split(";"));

                    }
                }
            }

            // if (!matchedResponses[0]) return null;
            return matchedResponses;
        }


        async function getResponses() {
            return cache;
        }

        async function updateResponseDB(ChannelPrompt, String) {
            if (cache[ChannelPrompt]) {
                const ResponseTable = cache[ChannelPrompt].filter(val => val.string === String);
                if (ResponseTable.length > 0) {
                    const Response = ResponseTable[0].response;

                    // Update or create entries for each string and Responses pair
                    await prisma.Responses.upsert({
                        where: {
                            GuildID_ChannelString_String: {
                                GuildID: guildId,
                                ChannelString: ChannelPrompt,
                                String,
                            },
                        },
                        update: {
                            Response,
                        },
                        create: {
                            GuildID: guildId,
                            ChannelString: ChannelPrompt,
                            String,
                            Response,
                        },
                    });
                } else {
                    await prisma.Responses.delete({
                        where: {
                            GuildID_ChannelString_String: {
                                GuildID: guildId,
                                ChannelString: ChannelPrompt,
                                String,
                            },
                        },
                    });
                }
            } else {
                // Delete all entries for this channel prompt
                await prisma.Responses.deleteMany({
                    where: {
                        GuildID: guildId,
                        ChannelString: ChannelPrompt,
                    },
                });
            }
        }

        return { addResponse, removeResponse, matchResponses, getResponses };
    }

    const autoResponses = {};

    async function getAutoResponses(guildId) {
        if (!autoResponses[guildId])
            autoResponses[guildId] = await autoResponseFn(guildId);

        return autoResponses[guildId];
    }


    return {
        init,
        ToggleResponses,
        TogglePrefix,
        GetGuildSettings,
        AddGuildToDatabase,
        CheckIfGuildExists,
        SetActiveOrCreate,
        GetPrefix,
        GetResponses,
        SetPersonality,
        GetPersonality,
        GetBlacklist,
        getAutoReactions,
        getAutoResponses,
    };
});