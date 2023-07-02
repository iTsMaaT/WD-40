
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

        function UpdateUserInDB(userId) {
            prisma.Blacklist.upsert({
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

        return { GrantPermission, DenyPermission, CheckPermission };
    }

    const blacklist = {};

    async function GetBlacklist(guildId) {
        if(!blacklist[guildId]) {
            blacklist[guildId] = await blacklistFn(prisma, guildId);
        }
        return blacklist[guildId];
    }

    return {init, ToggleResponses, TogglePrefix, GetGuildSettings, AddGuildToDatabase, CheckIfGuildExists, SetActiveOrCreate, GetPrefix, GetResponses, SetPersonality, GetPersonality, GetBlacklist};
});