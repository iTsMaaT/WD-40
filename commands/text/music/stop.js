const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "stop",
    description: "Stop currently playing queue",
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
        if (!queue) {
            message.reply({ embeds: [embedGenerator.warning("There is no music playing.")] });
            return message.guild?.me?.voice?.setChannel(null).catch(() => null);
        }
            
        queue.delete();

        message.reply({ embeds: [embedGenerator.info({ title: "Stopped!" }).withAuthor(message.author)] });
    },
};