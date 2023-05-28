
module.exports = (function(prisma) {

    let prefixes = {};
    let responses = {};
    let personality = {};

    function init(guilds) {
        guilds.forEach(async (g) => {
            let exists = await CheckIfGuildExists(g);
            if(!exists) await AddGuildToDatabase(g);
            let settings = await GetGuildSettings(g);
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
        let result = await GetGuildSettings(guild);
        return result != undefined && result != null;
    }

    async function AddGuildToDatabase(guild) {
        await prisma.GuildSettings.create({
            data: {
                GuildID: BigInt(parseInt(guild.id)),
                GuildName:  guild.name
            }
        });
        prefixes[guild.id] = ">";
        responses[guild.id] = false;
    }

    async function GetGuildSettings(guild) {
        return await prisma.GuildSettings.findUnique({
            where: {
                GuildID: BigInt(parseInt(guild.id))
            }
        });
    }

    async function UpdateGuild(guild, data) {
        await prisma.GuildSettings.update({
            where: {
                GuildID: BigInt(parseInt(guild.id))
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

    return {init, ToggleResponses, TogglePrefix, GetGuildSettings, AddGuildToDatabase, CheckIfGuildExists, SetActiveOrCreate, GetPrefix, GetResponses, SetPersonality, GetPersonality};
});