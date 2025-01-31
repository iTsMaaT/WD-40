const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "stop",
    description: "Stop currently playing queue",
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue();
        if (!queue) return message.guild?.me?.voice?.setChannel(null).catch(() => null);
            
        queue.delete();

        const stoppped_music_embed = embedGenerator.info({
            title: "Stopped!",
        }).withAuthor(message.author);

        message.reply({ embeds: [stoppped_music_embed] });
    },
};