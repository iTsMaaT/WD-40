const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "femboys",
    description: "Boys that are acting not like boys but that are boys",
    category: "NSFW",

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw || message.guild && Number(message.guild.nsfwLevel) >= 1, ["femboys", "traps"], 5)] });
    },
};

