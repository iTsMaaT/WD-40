const embedGenerator = require("@utils/helpers/embedGenerator");
const setChannelStatus = require("@utils/helpers/setChannelStatus");

module.exports = {
    name: "setchannelstatus",
    description: "Sets the status of the current voice channel",
    category: "music",
    examples: ["among us"],
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.error("You must be in a voice channel.")] });
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