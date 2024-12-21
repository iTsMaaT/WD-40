const config = require("@utils/config/configUtils");
const dbConfig = config.get("withoutDatabaseConfig");

const prefixes = {};
const responses = {};
const personality = {};

/**
 * Initializes the settings for all guilds, adding them to the database if they do not exist.
 * @async
 * @param {Array<object>} guilds - An array of guild objects to initialize.
 * @param {object} client - The Discord client instance.
 */
async function init(guilds, client) {
    guilds.forEach(async (guild) => {
        const exists = await CheckIfGuildExists(guild);
        if (!exists) await AddGuildToDatabase(guild);
        const settings = await GetGuildSettings(guild);
        prefixes[guild.id] = settings.prefix;
        responses[guild.id] = settings.responses;
        personality[guild.id] = settings.personality;
    });
}

/**
 * Sets a guild as active or inactive, adding it to the database if it does not exist.
 * @async
 * @param {object} guild - The guild object to update or create.
 * @param {boolean} [status=true] - The active status to set for the guild.
 */
async function SetActiveOrCreate(guild, status = true) {
    if (await CheckIfGuildExists(guild))
        await UpdateGuild(guild, { active: status });
    else
        await AddGuildToDatabase(guild);
}
    
/**
 * Checks if a guild exists in the database.
 * @async
 * @param {object} guild - The guild object to check.
 * @returns {Promise<boolean>} Resolves to `true` if the guild exists, otherwise `false`.
 */
async function CheckIfGuildExists(guild) {
    return true;
}
    
/**
 * Adds a guild to the database and initializes its default settings.
 * @async
 * @param {object} guild - The guild object to add.
 */
async function AddGuildToDatabase(guild) {
    prefixes[guild.id] = dbConfig.prefix;
    responses[guild.id] = dbConfig.responses;
}
    
/**
 * Retrieves the settings for a given guild.
 * @async
 * @param {object} guild - The guild object to retrieve settings for.
 * @returns {Promise<object>} Resolves with the guild settings.
 */
async function GetGuildSettings(guild) {
    return {
        ...dbConfig,
        guildId: guild.id,
        guildName: guild.name || "",
        active: 1,
    };
}
    
/**
 * Updates the settings for a given guild in the database.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {object} data - The data to update for the guild.
 */
async function UpdateGuild(guild, data) {
    // ...
}

/**
 * Toggles the response status for a given guild.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {boolean} status - The response status to set.
 */
async function ToggleResponses(guild, status) {
    responses[guild.id] = status;
}

/**
 * Sets or updates the prefix for a given guild.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {string} prefix - The new prefix to set for the guild.
 */
async function TogglePrefix(guild, prefix) {
    prefixes[guild.id] = prefix;
}

/**
 * Sets or updates the personality for a given guild.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {string} persona - The new personality string to set.
 */
async function SetPersonality(guild, persona) {
    persona[guild.id] = persona;
}

/**
 * Retrieves the prefix for a given guild.
 * @param {object} guild - The guild object to retrieve the prefix for.
 * @returns {string} The prefix for the guild.
 */
function GetPrefix(guild) {
    return prefixes[guild.id];
}

/**
 * Retrieves the response status for a given guild.
 * @param {object} guild - The guild object to retrieve the response status for.
 * @returns {boolean} The response status for the guild.
 */
function GetResponses(guild) {
    return responses[guild.id];
}

/**
 * Retrieves the personality setting for a given guild.
 * @param {object} guild - The guild object to retrieve the personality for.
 * @returns {string} The personality setting for the guild.
 */
function GetPersonality(guild) {
    return personality[guild.id];
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
};