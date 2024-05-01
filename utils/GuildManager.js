/* eslint-disable no-shadow */
const { eq, and } = require("drizzle-orm");
const logger = require("@root/index.js");
const { repositories } = require("./db/tableManager.js");
const schema = require("../schema/schema.js");

const prefixes = {};
const responses = {};
const personality = {};

function init(guilds) {
    guilds.forEach(async (guild) => {
        const exists = await CheckIfGuildExists(guild);
        if (!exists) await AddGuildToDatabase(guild);
        const settings = await GetGuildSettings(guild);
        prefixes[guild.id] = settings.prefix;
        responses[guild.id] = settings.responses;
        personality[guild.id] = settings.personality;
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
    await repositories.guildsettings.insert({
        guildId: guild.id,
        guildName: guild.name,
    });
    prefixes[guild.id] = ">";
    responses[guild.id] = false;
}
    
async function GetGuildSettings(guild) {
    return (await repositories.guildsettings.select().where(eq(schema.guildsettings.guildId, guild.id)).limit(1))[0] ?? {};
}
    
async function UpdateGuild(guild, data) {
    await repositories.guildsettings.update(data).where(eq(schema.guildsettings.guildId, guild.id));
}

async function ToggleResponses(guild, status) {
    await UpdateGuild(guild, { responses: status });
    responses[guild.id] = status;
}

async function TogglePrefix(guild, prefix) {
    await UpdateGuild(guild, { prefix: prefix });
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
        const data = await repositories.blacklist.select().where(eq(schema.blacklist.guildId, guildId));
        if (data.length > 0) {
            data.forEach((value) => {
                if (value.userId)
                    bl[value.userId] = new String(value.permission).toLowerCase().split(";");

            });
        }
    } catch (e) {
        logger.error("Error while initializing blacklist for guild " + guildId + ": " + e.stack);
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
        const blacklistRepository = await repositories.blacklist;
        try {
            const exists = blacklistRepository.select().where(and(
                eq(schema.blacklist.guildId, guildId),
                eq(schema.blacklist.userId, userId),
            ));
            if (exists.length > 0) {
                await blacklistRepository.update({ permission: bl[userId].join(";").toLowerCase() }).where(and(
                    eq(blacklistSchema.guildId, guildId),
                    eq(blacklistSchema.userId, userId),
                ));
            } else {
                await blacklistRepository.insert({
                    guildId,
                    userId,
                    permission: bl[userId].join(";").toLowerCase(),
                });
            }
        } catch (e) {
            logger.error(`Unable to update Blacklist table (U: ${userId} | G: ${guildId} | P: '${bl[userId].join(";")}')\r\n${e.stack}`);
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
    const cache = {};

    try {
        const reactionsRepository = repositories.reactions;
        if (reactionsRepository) {
            const data = await reactionsRepository.select()
                .where(eq(schema.reactions.guildId, guildId));

            if (data.length > 0) {
                for (const i in data) {
                    if (data[i].channelString === undefined) continue;
                    const value = data[i];
                    if (!cache[value.channelString])
                        cache[value.channelString] = [];

                    cache[value.channelString].push({
                        "string": value.string,
                        "emotes": value.emotes,
                    });
                }
            }
        }
    } catch (e) {
        logger.error("Silently failing auto reaction init for guild " + guildId + ", " + e.stack);
    }

    async function addReaction(ChannelPrompt, string, reactions) {
        if (!cache[ChannelPrompt])
            cache[ChannelPrompt] = [];

        cache[ChannelPrompt].push({
            "string": string,
            "emotes": reactions,
        });
        await updateReactionDB(guildId, ChannelPrompt, string);
    }

    async function removeReaction(ChannelPrompt, string = null) {
        if (!string) delete cache[ChannelPrompt];
        if (cache[ChannelPrompt]) {
            // Remove the entry with the matching string
            cache[ChannelPrompt] = cache[ChannelPrompt].filter(entry => entry.string !== string);
            if (cache[ChannelPrompt].length == 0) delete cache[ChannelPrompt];
        }
        await updateReactionDB(guildId, ChannelPrompt, string);
    }

    async function matchReactions(ChannelPrompt, String, hasAttachment = false) {
        const matchedReactions = [];

        if (cache) {
            for (const channelPrompt of Object.keys(cache)) {
                if (!ChannelPrompt.includes(channelPrompt)) continue;
                for (const entry of cache[channelPrompt]) {
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
        return cache;
    }

    async function updateReactionDB(guildId, ChannelPrompt, String) {
        const reactionsRepository = repositories.reactions;

        if (reactionsRepository) {
            if (cache[ChannelPrompt]) {
                const reactionsTable = cache[ChannelPrompt].filter(val => val.string === String);
                if (reactionsTable.length > 0) {
                    const Reaction = reactionsTable[0].emotes;

                    await reactionsRepository.insert({ 
                        guildId: guildId,
                        emotes: Reaction,
                        channelString: ChannelPrompt,
                        string: String,
                    });
                } else {
                    await reactionsRepository.update()
                        .where(and(
                            eq(schema.reactions.guildId, guildId),
                            eq(schema.reactions.channelString, ChannelPrompt),
                            eq(schema.reactions.string, String),
                        ));
                }
            } else {
                // Delete all entries for this channel prompt
                await reactionsRepository.remove().where(and(
                    eq(schema.reactions.guildId, guildId),
                    eq(schema.reactions.channelString, ChannelPrompt),
                ));
            }
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
        const responsesRepository = repositories.responses;
        if (responsesRepository) {
            const data = await responsesRepository.select()
                .where(eq(schema.responses.guildId, guildId));

            if (data.length > 0) {
                for (const i in data) {
                    if (data[i].channelString === undefined) continue;
                    const value = data[i];
                    if (!cache[value.channelString])
                        cache[value.channelString] = [];

                    cache[value.channelString].push({
                        "string": value.string,
                        "response": value.response,
                    });
                }
            }
        }
    } catch (e) {
        logger.error("Silently failing auto response init for guild " + guildId + ", " + e.stack);
    }

    async function addResponse(ChannelPrompt, string, response) {
        if (!cache[ChannelPrompt])
            cache[ChannelPrompt] = [];

        cache[ChannelPrompt].push({
            "string": string,
            "response": response,
        });
        await updateResponseDB(guildId, ChannelPrompt, string);
    }

    async function removeResponse(ChannelPrompt, string = null) {
        if (!string) delete cache[ChannelPrompt];
        if (cache[ChannelPrompt]) {
            // Remove the entry with the matching string
            cache[ChannelPrompt] = cache[ChannelPrompt].filter(entry => entry.string !== string);
            if (cache[ChannelPrompt].length == 0) delete cache[ChannelPrompt];
        }
        await updateResponseDB(guildId, ChannelPrompt, string);
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

    async function updateResponseDB(guildId, ChannelPrompt, String) {
        const responsesRepository = repositories.responses;

        if (responsesRepository) {
            if (cache[ChannelPrompt]) {
                const ResponseTable = cache[ChannelPrompt].filter(val => val.string === String);
                if (ResponseTable.length > 0) {
                    const Response = ResponseTable[0].response;

                    await responsesRepository.insert({ 
                        guildId: guildId,
                        response: Response,
                        channelString: ChannelPrompt,
                        string: String,
                    });
                } else {
                    await responsesRepository.update()
                        .where(and(
                            eq(schema.responses.guildId, guildId),
                            eq(schema.responses.channelString, ChannelPrompt),
                            eq(schema.responses.string, String),
                        ));
                }
            } else {
                // Delete all entries for this channel prompt
                await responsesRepository.remove().where(and(
                    eq(schema.responses.guildId, guildId),
                    eq(schema.responses.channelString, ChannelPrompt),
                ));
            }
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


module.exports = {
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