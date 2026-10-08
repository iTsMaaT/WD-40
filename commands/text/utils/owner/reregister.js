const { registerExtractors, reload } = require("@root/utils/helpers/player/registerExtractors");
const { useMainPlayer } = require("discord-player");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "reregister",
    description: "reregisters the extractors",
    category: "owner",
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
        await reload(useMainPlayer());
        await message.reply({ embeds: [embedGenerator.success("Reloaded extractors")] });
    },
};