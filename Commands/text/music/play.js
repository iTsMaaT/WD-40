const SendErrorEmbed = require("@functions/SendErrorEmbed");
const { QueryType } = require('discord-player');

module.exports = {
    name: "play",
    description: "Play a song",
    aliases: ["p"],
    usage: "< [Song]: song link or query >",
    category: "music",
    async execute(logger, client, message, args) {
        let res;
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

        let string = args.join(' ');
        if (!string) string = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        //return SendErrorEmbed(message, "Please enter a song URL or query to search.", "yellow");

        play_embed = {
            color: 0xffffff,
            description: `Request received, fetching...`,
            timestamp: new Date(),
        };

        const msg = await message.reply({ embeds: [play_embed] });

        try {
            const research = await player.search(string, {
                requestedBy: message.member,
                searchEngine: QueryType.AUTO
            });

            if (!research.hasTracks()) return SendErrorEmbed(message, "No results found", "red");

            res = await player.play(message.member.voice.channel.id, research, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel,
                        requestedBy: message.author
                    },
                    leaveOnEmptyCooldown: 300000,
                    leaveOnEmpty: true,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000,
                    bufferingTimeout: 0,
                    volume: 75,
                }
            });
            logger.music(`Playing [${string}]`); 

            embed = {
                color: 0xffffff,
                description: `Successfully enqueued${res.track.playlist ? ` **track(s)** from: **${res.track.playlist.title}**` : `: **${res.track.title}**`}`,
                timestamp: new Date(),
            };
    
            await msg.edit({ embeds: [embed] });

        } catch (err) {

            console.log(err);
            embed = {
                color: 0xff0000,
                description: `Failed to fetch / play the reqested track`,
                timestamp: new Date(),
            };

            await msg.edit({ embeds: [embed] });
        }
    }
};
