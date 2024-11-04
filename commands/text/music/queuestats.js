const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue } = require("discord-player");
const { useStats } = require("@utils/helpers/playerHelpers");

module.exports = {
    name: "queuestats",
    description: "Gives you the stats of the current queue",
    category: "music",
    private: true,
    async execute(logger, client, message, args) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.error("You must be in a voice channel.")] });

        const queue = useQueue(message.guild.id);
        if (!queue || !queue.tracks || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

        const stats = useStats(message.guild.id);
        if (!stats) return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

        console.log(stats);

        await message.reply({ embeds: [embedGenerator.info({
            title: "Queue Stats",
            description: stats.toString(),
        })] });
    },
};