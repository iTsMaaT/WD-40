import randomMinMax from "#utils/functions/randomMinMax.js";
import getExactDate from "#functions/getExactDate.js";
import { prettyString } from "#functions/formattingFunctions.js";
import * as discordFunctions from "#functions/discordFunctions.js";
const { StringReact } = discordFunctions;
import getPterodactylInfo from "#utils/functions/getPterodactylInfo.js";
import getUniqueValues from "#utils/functions/getUniqueValues.js";
import EmbedGenerator from "#utils/helpers/embedGenerator.js";
import { repositories } from "#utils/db/tableManager.js";
import * as guildSettings from "#utils/guildManager/withDatabase/guildSettings.js";
import GuildManager from "#guildManager";

export default {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
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