const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useHistory, useMainPlayer } = require("discord-player");

module.exports = {
    name: "back",
    description: "Goes back to the last played song",
    category: "music",
    aliases: ["previous"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });

        const history = useHistory(message.guild.id);
        if (!history) return await message.reply({ embeds: [embedGenerator.error("There is no history to go back to.")] });

        try {
            await history.previous();
            const skipped_embed = new EmbedBuilder()
                .setColor("#ffffff")
                .setDescription("Went back a track!")
                .setTimestamp();
            message.reply({ embeds: [skipped_embed] });
        } catch (e) {
            logger.error(e);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
}; 