const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "debug",
    description: "Enables debug logging",
    category: "owner",
    usage: {
        required: {
            "server": "server to enable debug",
        },
    },
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
        config.set("defaultDebugState", !config.get("defaultDebugState"));
        return await message.reply({
            embeds: [
                embedGenerator.success(`Debug state set to ${config.get("defaultDebugState") ? "enabled" : "disabled"}`),
            ],
        });
    },
};