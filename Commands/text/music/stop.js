const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "stop",
    description: "Stop currently playing queue",
    category: "music",
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const queue = useQueue(message.guild.id);
            if (!queue) return message.guild?.me?.voice?.setChannel(null).catch(() => null);
            
            queue.delete();

            const stoppped_music_embed = embedGenerator.info({
                title: "Stopped!",
            }).withAuthor(message.author);

            message.reply({ embeds: [stoppped_music_embed] });
        } catch (e) {
            logger.error(e);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};