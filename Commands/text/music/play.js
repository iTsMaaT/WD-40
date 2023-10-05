const { SendErrorEmbed } = require("@functions/discordFunctions");
const { QueryType } = require('discord-player');
const { SoundCloudExtractor } = require("@discord-player/extractor");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "play",
    description: "Play a song",
    aliases: ["p"],
    usage: "< [Song]: song link or query >",
    category: "music",
    examples: ["never gonna give you up"],
    permissions: [PermissionFlagsBits.Connect],
    async execute(logger, client, message, args) {
        let res, research;
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

        const Attachment = message.attachments.first()?.attachment;

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
            research = await player.search(string, {
                requestedBy: message.member,
                //searchEngine: /https?:\/\/(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/.test(string) ? QueryType.YOUTUBE_PLAYLIST : QueryType.AUTO
            });

            if (!research.hasTracks()) {
                embed = {
                    color: 0xff0000,
                    description: `No results found`,
                    timestamp: new Date(),
                };
    
                await msg.edit({ embeds: [embed] });
            }

            res = await player.play(message.member.voice.channel.id, Attachment ?? research, {
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
            logger.music(`Playing [${res.track.title}]`); 

            embed = {
                color: 0xffffff,
                description: `Successfully enqueued${res.track.playlist ? ` **track(s)** from: **${res.track.playlist.title}**` : `: **${res.track.title}**`}`,
                timestamp: new Date(),
            };
    
            await msg.edit({ embeds: [embed] });

        } catch (err) {
            logger.error(err.stack);

            if (err.toString().includes("Error: Status code: 410")) {

                try{

                    embed = {
                        color: 0xffffff,
                        description: `Failed to get stream from Youtube, attempting SoundCloud`,
                        timestamp: new Date(),
                        footer: { text: "This is due to the video being age restricted (this is a temporary fix)"}
                    };

                    await msg.edit({ embeds: [embed] });

                    research = await player.search(research._data.tracks[0].title, {
                        requestedBy: message.member,
                        searchEngine: `ext:${SoundCloudExtractor.identifier}`
                    });

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
                    logger.music(`Playing [${res.track.title}]`); 
    
                    embed = {
                        color: 0xffffff,
                        description: `Successfully enqueued${res.track.playlist ? ` **track(s)** from: **${res.track.playlist.title}**` : `: **${res.track.title}**`}`,
                        timestamp: new Date(),
                        footer: { text: "Attempted to use SoundCloud instead of Youtube due to age restriction" }
                    };

                    await msg.edit({ embeds: [embed] });

                    return;
                } catch(err) {

                    logger.error(err.stack);

                    embed = {
                        color: 0xff0000,
                        description: `Failed to fetch / play the reqested track`,
                        timestamp: new Date(),
                        footer: { text: "" }
                    };

                    await msg.edit({ embeds: [embed] });
                }
            }


            embed = {
                color: 0xff0000,
                description: `Failed to fetch / play the reqested track`,
                timestamp: new Date(),
            };

            await msg.edit({ embeds: [embed] });
        }
    }
};
