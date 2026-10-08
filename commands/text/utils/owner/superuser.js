const embedGenerator = require("@utils/helpers/embedGenerator");
const config = require("@utils/config/configUtils");

module.exports = {
    name: "superuser",
    description: "Makes only iTsMaaT be able to execute commands",
    category: "utils",
    usage: {
        required: {
            "server": "server to make superuser",
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
        config.set("defaultSuperuserState", !config.get("defaultSuperuserState"));
        return await message.reply({
            embeds: [
                embedGenerator.success(`Superuser state set to ${config.get("defaultSuperuserState") ? "enabled" : "disabled"}`),
            ],
        });
    },
};