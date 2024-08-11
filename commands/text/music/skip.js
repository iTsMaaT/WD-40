const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "skip",
    description: "Skip a currently playing song",
    category: "music",
    aliases: ["next"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });

        let queue = useQueue(message.guild.id);
        if (!queue || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });

        try {
            queue.node.skip();
            
            await message.reply({ embeds: [embedGenerator.info({
                title: "Skipped",
                thumbnail: { url: queue.currentTrack.thumbnail },
                description: `[${queue.currentTrack.title}](${queue.currentTrack.url})`,
            }).withAuthor(message.author)] });

            queue = useQueue(message.guild.id);
            if (!queue || !queue.currentTrack) return await message.channel.send({ embeds: [embedGenerator.error("There is nothing left to play.")] });

            await message.channel.send({ embeds: [embedGenerator.info({
                title: "Now playing",
                thumbnail: { url: queue.currentTrack.thumbnail },
                description: `[${queue.currentTrack.title}](${queue.currentTrack.url})`,
            })] });
        } catch (e) {
            logger.error(e);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
}; 