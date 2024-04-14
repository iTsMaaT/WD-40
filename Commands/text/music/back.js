const { EmbedBuilder } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const { useHistory, useMainPlayer } = require("discord-player");

module.exports = {
    name: "back",
    description: "Goes back to the last played song",
    category: "music",
    aliases: ["previous"],
    async execute(logger, client, message, args) {
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

        const history = useHistory(message.guild.id);
        if (!history) SendErrorEmbed(message, "There is nothing in the history", "yellow");

        try {
            await history.previous();
            const skipped_embed = new EmbedBuilder()
                .setColor("#ffffff")
                .setDescription("Went back a track!")
                .setTimestamp();
            message.reply({ embeds: [skipped_embed] });
        } catch (e) {
            logger.error(e);
            SendErrorEmbed(message, "An error occurred.", "red");
        }
    },
}; 