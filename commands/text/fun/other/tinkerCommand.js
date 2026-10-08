const fs = require("fs/promises");
module.exports = {
    name: "tinker",
    description: "Test command",
    category: "other",
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
        if (message.author.id != process.env.OWNER_ID) return;

        
    },
};