const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "otter",
    description: "birb pics!",
    category: "posts",
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
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw || message.guild && Number(message.guild.nsfwLevel) >= 1, ["otters"], 5)] });
    },
};