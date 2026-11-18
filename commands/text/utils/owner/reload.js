import config from "#utils/config/configUtils.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";

export default {
    name: "reload",
    description: "Reload the config",
    category: "owner",
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
        config.reload();
        await message.reply({ embeds: [embedGenerator.success("Reloaded the config.")] });
    },
};