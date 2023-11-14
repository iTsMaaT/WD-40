const { SendErrorEmbed } = require("@functions/discordFunctions");
const { QueryType } = require("discord-player");
const { SoundCloudExtractor } = require("@discord-player/extractor");
const cheerio = require("cheerio");

module.exports = {
    name: "play",
    description: "Play a song",
    aliases: ["p"],
    usage: "< [Song]: song link or query >",
    category: "music",
    examples: ["never gonna give you up"],
    permissions: ["Connect"],
    async execute(logger, client, message, args) {
        let res, research;
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

        const Attachment = message.attachments.first()?.attachment;

        let string = args.join(" ");
        if (!string) string = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        // return SendErrorEmbed(message, "Please enter a song URL or query to search.", "yellow");

        play_embed = {
            color: 0xffffff,
            description: "Request received, fetching...",
            timestamp: new Date(),
            footer: { text: "Age restricted videos might not work." },
        };

        const msg = await message.reply({ embeds: [play_embed] });

        try {
            const soundgasm = await getSoundgasmLink(args.join(" "));
            if (soundgasm) string = soundgasm;

            research = await player.search(string, {
                requestedBy: message.member,
                // searchEngine: /https?:\/\/(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/.test(string) ? QueryType.YOUTUBE_PLAYLIST : QueryType.AUTO
            });

            if (!research.hasTracks()) {
                embed = {
                    color: 0xff0000,
                    description: "No results found",
                    timestamp: new Date(),
                };
    
                await msg.edit({ embeds: [embed] });
            }

            res = await player.play(message.member.voice.channel.id, Attachment ?? research, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel,
                        requestedBy: message.author,
                    },
                    leaveOnEmptyCooldown: 300000,
                    leaveOnEmpty: true,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000,
                    bufferingTimeout: 0,
                    volume: 75,
                },
            });
            logger.music(`Playing [${res.track.title}] in [${message.member.voice.channel.name}]`); 

            embed = {
                color: 0xffffff,
                description: `Successfully enqueued${res.track.playlist ? ` **track(s)** from: **${res.track.playlist.title}**` : `: **${res.track.title}**`}`,
                timestamp: new Date(),
            };
    
            await msg.edit({ embeds: [embed] });

        } catch (err) {
            logger.error(err.stack);
            embed = {
                color: 0xff0000,
                description: "Failed to fetch / play the reqested track",
                timestamp: new Date(),
            };

            await msg.edit({ embeds: [embed] });
        }
    },
};

const getSoundgasmLink = async (link) => {
    const regex = /^https:\/\/soundgasm\.net\/.*/;
    if (!regex.test(link)) return null;

    const response = await fetch(link); // Replace with the URL you want to fetch
    const html = await response.json();

    const $ = cheerio.load(html);
    const scriptContent = $("script").last().html(); // Get the content of the last script tag

    // Extracting the m4a link from the script content using string manipulation
    const startIndex = scriptContent.indexOf("\"https://media.soundgasm.net/sounds/");
    const endIndex = scriptContent.indexOf(".m4a\"", startIndex) + 4; // Adding 4 to include '.m4a'

    const m4aLink = scriptContent.substring(startIndex + 1, endIndex);
    return m4aLink; // Output the extracted m4a link
};
