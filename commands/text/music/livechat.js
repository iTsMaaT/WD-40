const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue } = require("discord-player");
const { toggleLiveChat } = require("@root/utils/helpers/player/playerLiveChat");

module.exports = {
    name: "livechat",
    description: "Enables or disables livechat",
    category: "music",
    aliases: ["lc"],
    private: true,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
        if (!queue || !queue.tracks || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

        const currentTrack = queue.currentTrack;

        if (!currentTrack.raw.live) return await message.reply({ embeds: [embedGenerator.error("The current track is not a live stream.")] });
        
        let livechatEnabled;
        try { 
            livechatEnabled = await toggleLiveChat(currentTrack.url, message.channel);
        } catch (error) {
            logger.error(error);
            return await message.reply({ embeds: [embedGenerator.error("Failed to enable livechat.")] });
        }

        await message.reply({ embeds: [embedGenerator.info(`Livechat ${livechatEnabled ? "enabled" : "disabled"}.`)] });
    },
};