const embedGenerator = require("@utils/helpers/embedGenerator");
const setChannelStatus = require("@utils/helpers/setChannelStatus");

module.exports = {
    name: "setchannelstatus",
    description: "Sets the status of the current voice channel",
    category: "music",
    examples: ["among us"],
    private: true,
    inVoiceChannel: true,
    inSameVoiceChannel: true,

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("Please provide a status.")] });

        const status = args.join(" ").toLowerCase();
        try {
            await setChannelStatus(message.member.voice.channel.id, status);
            await message.reply({ embeds: [embedGenerator.info(`Status set to \`${status}\`.`)] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};