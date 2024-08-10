const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue } = require("discord-player");
const { toggleLiveChat } = require("@utils/helpers/playerLiveChat");

module.exports = {
    name: "livechat",
    description: "Enables or disables livechat",
    category: "music",
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.error("You must be in a voice channel.")] });

        const queue = useQueue(message.guild.id);
        if (!queue || !queue.tracks || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

        const currentTrack = queue.currentTrack;

        if (!currentTrack.raw.live) return await message.reply({ embeds: [embedGenerator.error("The current track is not a live stream.")] });
        
        let livechatEnabled = false;
        try { 
            livechatEnabled = await toggleLiveChat(currentTrack.url, message.channel);
        } catch (error) {
            return await message.reply({ embeds: [embedGenerator.error("Failed to enable livechat.")] });
        }

        await message.reply({ embeds: [embedGenerator.info(`Livechat ${livechatEnabled ? "enabled" : "disabled"}.`)] });
    },
};