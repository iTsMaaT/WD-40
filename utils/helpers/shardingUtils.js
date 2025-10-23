const config = require("@utils/config/configUtils");
const { Collection } = require("discord.js");

/**
 * Get the total number of guilds the bot is in.
 *
 * @param {import("discord.js").Client} client - The Discord client.
 */
async function getGuildCount(client) {
    const result = await client.shard.fetchClientValues("guilds.cache.size");
    return result.reduce((acc, count) => acc + count, 0);
}

module.exports = {
    getGuildCount,
};