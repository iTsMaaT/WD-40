
module.exports = (function(prisma) {

    const prefixes = {};
    const responses = {};
    const personality = {};

    function init(guilds) {
        guilds.forEach(async (g) => {
            const exists = await CheckIfGuildExists(g);
            if(!exists) await AddGuildToDatabase(g);
            const settings = await GetGuildSettings(g);
            prefixes[g.id] = settings.Prefix;
            responses[g.id] = settings.Responses;
            personality[g.id] = settings.Personality;
        });
    }

    async function SetActiveOrCreate(guild, status = true) {
        if(await CheckIfGuildExists(guild)) {
            await UpdateGuild(guild, {Active: status});
        } else {
            await AddGuildToDatabase(guild);
        }
    } 

    async function CheckIfGuildExists(guild) {
        const result = await GetGuildSettings(guild);
        return result != undefined && result != null;
    }

    async function AddGuildToDatabase(guild) {
        await prisma.GuildSettings.create({
            data: {
                GuildID: guild.id,
                GuildName:  guild.name
            }
        });
        prefixes[guild.id] = ">";
        responses[guild.id] = false;
    }

    async function GetGuildSettings(guild) {
        return await prisma.GuildSettings.findUnique({
            where: {
                GuildID: guild.id
            }
        });
    }

    async function UpdateGuild(guild, data) {
        await prisma.GuildSettings.update({
            where: {
                GuildID: guild.id
            },
            data
        });
    }

    async function ToggleResponses(guild, status) {
        await UpdateGuild(guild, {Responses: status});
        responses[guild.id] = status;
    }

    async function TogglePrefix(guild, prefix) {
        await UpdateGuild(guild, {Prefix: prefix});
        prefixes[guild.id] = prefix;
    }

    async function SetPersonality(guild, personality) {
        await UpdateGuild(guild, {Personality: personality});
        personality[guild.id] = personality;
    }

    function GetPrefix(guild){
        return prefixes[guild.id];
    }

    function GetResponses(guild) {
        return responses[guild.id];
    }

    function GetPersonality(guild) {
        return personality[guild.id];
    }

    async function blacklistFn(prisma, guildId) {
        const bl = {};

        try{
            const data = await prisma.Blacklist.findMany({
                where: {
                    GuildID: guildId
                }
            });
            if(data.length > 0) {
                for(const i in data){
                    const value = data[i];
                    if(value.UserID === undefined) continue;
                    bl[value.UserID] = new String(value.Permission).toLowerCase().split(";");
                }
            }
        }catch(e) {
            global.logger.error("Silently failing blacklist init for guild " + guildId + ", " + e.stack);
        }

        function GrantPermission(userId, permission) {
            if(!CheckPermission(userId, permission)) {
                bl[userId] = bl[userId].filter(p => p != permission?.toLowerCase());
                UpdateUserInDB(userId);
            }
        }

        function DenyPermission(userId, permission) {
            if(CheckPermission(userId, permission)) {
                if(bl[userId] === null || bl[userId] === undefined) {
                    bl[userId] = [permission?.toLowerCase()];
                } else {
                    bl[userId].push(permission?.toLowerCase());
                }
                UpdateUserInDB(userId);
            }
        }
           
        async function UpdateUserInDB(userId) {
            await prisma.Blacklist.upsert({
                where: {
                    GuildID_UserID: {
                        GuildID: guildId,
                        UserID: userId
                    } 
                },
                update: {
                    Permission: bl[userId].join(";").toLowerCase()
                },
                create: {
                    GuildID: guildId,
                    UserID: userId,
                    Permission: bl[userId].join(";").toLowerCase()
                }
            }).catch(e => global.logger.error(`Unable to update Blacklist table (U: ${userId} | G: ${guildId} | P: '${bl[userId].join(";")}')\r\n${e.stack}`));
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
        if(!blacklist[guildId]) {
            blacklist[guildId] = await blacklistFn(prisma, guildId);
        }
        return blacklist[guildId];
    }

    async function autoReactFn(prisma, guildId) {
        const bl = {};
    
        try {
            const data = await prisma.Reactions.findMany({
                where: {
                    GuildID: guildId
                }
            });
    
            if (data.length > 0) {
                for (const i in data) {
                    if (data[i].ChannelString === undefined) continue;
                    const value = data[i];
                    if (!bl[value.ChannelString]) {
                        bl[value.ChannelString] = [];
                    }
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
            if (!bl[ChannelPrompt]) {
                bl[ChannelPrompt] = [];
            }
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
                    if(!ChannelPrompt.includes(channelPrompt)) continue;
                    for (const entry of bl[channelPrompt]) {
                        const { string, emotes } = entry;
        
                        // Check if the string matches <media> or <link> for URLs
                        if ((/(https?:\/\/[^\s]+)/.test(String) || hasAttachment) && string === '<media>') {
                            matchedReactions.push(...emotes.split(';'));
                        }
        
                        if (/(https?:\/\/[^\s]+)/.test(String) && string === '<link>') {
                            matchedReactions.push(...emotes.split(';'));
                        }
        
                        // Check if the string matches <attachment> for attachments
                        if (hasAttachment && string === '<attachment>') {
                            matchedReactions.push(...emotes.split(';'));
                        }
        
                        // Check for other matches anywhere in the strings
                        if (String.includes(string)) {
                            matchedReactions.push(...emotes.split(';'));
                        }
                    }
                }
            }
        
            //if (!matchedReactions[0]) return null;
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
                            }
                        },
                        update: {
                            Emotes,
                        },
                        create: {
                            GuildID: guildId,
                            ChannelString: ChannelPrompt,
                            String,
                            Emotes,
                        }
                    });
                } else {
                    await prisma.Reactions.delete({
                        where: {
                            GuildID_ChannelString_String: {
                                GuildID: guildId,
                                ChannelString: ChannelPrompt,
                                String,
                            }
                        }
                    });
                }
            } else {
                // Delete all entries for this channel prompt
                await prisma.Reactions.deleteMany({
                    where: {
                        GuildID: guildId,
                        ChannelString: ChannelPrompt,
                    }
                });
            }
        }
    
        return { addReaction, removeReaction, matchReactions, getReactions };
    }
    
    const reactions = {};
    
    async function getAutoReactions(guildId) {
        if (!reactions[guildId]) {
            reactions[guildId] = await autoReactFn(prisma, guildId);
        }
        return reactions[guildId];
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
        getAutoReactions
    };
});