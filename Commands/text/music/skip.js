const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "skip",
    description: "Skip a currently playing song",
    category: "music",
    aliases: ["next"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });

        const queue = useQueue(message.guild.id);
        if (!queue || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });

        try {
            queue.node.skip();
            
            const skipped_embed = embedGenerator.info({
                title: "Skipped!",
                description: "Skipped the current song.",
            }).withAuthor(message.author);

            message.reply({ embeds: [skipped_embed] });
        } catch (e) {
            logger.error(e);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
}; 