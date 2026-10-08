const randomMinMax = require("@utils/functions/randomMinMax.js");
const getExactDate = require("@functions/getExactDate.js");
const { prettyString } = require("@functions/formattingFunctions");
const { StringReact } = require("@functions/discordFunctions.js");
const getPterodactylInfo = require("@utils/functions/getPterodactylInfo.js");
const getUniqueValues = require("@utils/functions/getUniqueValues.js");
const EmbedGenerator = require("@utils/helpers/embedGenerator");
const { repositories } = require("@utils/db/tableManager.js");
const guildSettings = require("@utils/guildManager/withDatabase/guildSettings.js");
const GuildManager = require("@guildManager");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        for (const guild of client.guilds.cache.values()) {
            const prefix = GuildManager.GetPrefix(guild.id);
            logger.info(`Guild ${guild.name} (${guild.id}) has prefix ${prefix}`);
        }
    },
};