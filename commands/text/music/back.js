const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useHistory } = require("discord-player");

module.exports = {
    name: "back",
    description: "Go back to the last played song",
    category: "music",
    aliases: ["previous"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) 
            return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        

        const queue = useQueue();
        if (!queue) 
            return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });
        

        const history = useHistory();
        if (!history || !history.tracks.length) 
            return await message.reply({ embeds: [embedGenerator.error("There is no history to go back to.")] });
        

        try {
            await history.previous();

            const currentTrack = queue.currentTrack;
            if (currentTrack) {
                await message.reply({
                    embeds: [embedGenerator.info({
                        title: "Went Back",
                        thumbnail: { url: currentTrack.thumbnail },
                        description: currentTrack.url ? `[${currentTrack.title}](${currentTrack.url})` : currentTrack.title,
                    }).withAuthor(message.author)],
                });
            } else {
                return await message.channel.send({ embeds: [embedGenerator.error("There is no track currently playing.")] });
            }

            const nextTrack = history.tracks[0];
            if (!nextTrack) 
                return await message.channel.send({ embeds: [embedGenerator.warning("No more songs in the history to play.")] });
            

            await message.channel.send({
                embeds: [embedGenerator.info({
                    title: "Now Playing",
                    thumbnail: { url: nextTrack.thumbnail },
                    description: nextTrack.url ? `[${nextTrack.title}](${nextTrack.url})` : nextTrack.title,
                })],
            });
        } catch (e) {
            logger.error(e);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};
