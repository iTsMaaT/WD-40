const { eq, and } = require("drizzle-orm");
const logger = require("@utils/log");
const { repositories, schema } = require("../../db/tableManager.js");

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

    const DBguildIDs = (await repositories.guildsettings.select()).map(item => item.guildId);
    const botGuildIds = client.guilds.cache.map(gui => gui.id);
    const notInGuildIds = DBguildIDs.filter(id => !botGuildIds.includes(id));
    for (const notInGuildId of notInGuildIds)
        await SetActiveOrCreate({ id: notInGuildId }, false);
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
    const result = await repositories.guildsettings.select().where(eq(schema.guildsettings.guildId, guild.id));
    return !result.length == 0;
}

/**
 * Adds a guild to the database and initializes its default settings.
 * @async
 * @param {object} guild - The guild object to add.
 */
async function AddGuildToDatabase(guild) {
    await repositories.guildsettings.insert({
        guildId: guild.id,
        guildName: guild.name,
    });
    prefixes[guild.id] = ">";
    responses[guild.id] = false;
}

/**
 * Retrieves the settings for a given guild.
 * @async
 * @param {object} guild - The guild object to retrieve settings for.
 * @returns {Promise<object>} Resolves with the guild settings.
 */
async function GetGuildSettings(guild) {
    return (await repositories.guildsettings.select().where(eq(schema.guildsettings.guildId, guild.id)).limit(1))[0] ?? {};
}

/**
 * Updates the settings for a given guild in the database.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {object} data - The data to update for the guild.
 */
async function UpdateGuild(guild, data) {
    await repositories.guildsettings.update(data).where(eq(schema.guildsettings.guildId, guild.id));
}

/**
 * Toggles the response status for a given guild.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {boolean} status - The response status to set.
 */
async function ToggleResponses(guild, status) {
    await UpdateGuild(guild, { responses: status });
    responses[guild.id] = status;
}

/**
 * Sets or updates the prefix for a given guild.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {string} prefix - The new prefix to set for the guild.
 */
async function TogglePrefix(guild, prefix) {
    await UpdateGuild(guild, { prefix: prefix });
    prefixes[guild.id] = prefix;
}

/**
 * Sets or updates the personality for a given guild.
 * @async
 * @param {object} guild - The guild object to update.
 * @param {string} persona - The new personality string to set.
 */
async function SetPersonality(guild, persona) {
    await UpdateGuild(guild, { Persona: persona });
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