const { SendErrorEmbed } = require("@functions/discordFunctions");
const { QueryType } = require("discord-player");
const { SoundCloudExtractor } = require("@discord-player/extractor");
const fs = require("fs/promises");
const cheerio = require("cheerio");
const util = require("util");


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
        // if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

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

        research = await player.search(string, {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO_SEARCH,
        });
        
        const msg = await message.reply({ embeds: [play_embed] });
        
        try {
            const linkRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/igm;
            const spotifyRegex = /^(?:https:\/\/open\.spotify\.com\/(?:intl-[a-zA-Z]{0,3}\/)?(?:user\/[A-Za-z0-9]+\/)?|spotify:)(?:track\/)([A-Za-z0-9]+).*$/;
            if (spotifyRegex.test(string) || !linkRegex.test(string)) {
                
                if (spotifyRegex.test(string)) {
                    research = await player.search(string, {
                        requestedBy: message.member,
                        searchEngine: QueryType.SPOTIFY_SONG,
                    });
                }

                let newResearch = "";
                if (research && research.hasTracks()) newResearch = `${research.tracks[0].title} - ${research.tracks[0].author}`;
                else if (!linkRegex.test(string)) newResearch = string;

                research = await player.search(newResearch, {
                    requestedBy: message.member,
                    searchEngine: QueryType.YOUTUBE_SEARCH,
                });

                const embed = {
                    color: 0xffffff,
                    title: "Type in chat the number you want to play",
                    fields: [],
                    timestamp: new Date(),
                };

                research.tracks.slice(10).map((track, index) => {
                    embed.fields.push({ name: `${index + 1} - ${track.title}`, value: `By ${track.author}` });
                });

                await msg.edit({ embeds: [embed] });

                const filter = (m) => m.author.id === message.author.id;
                await message.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ["time"] })
                    .then((collected) => {
                        const responseMessage = collected.first();
                        console.log(research.tracks);
                        research = research.tracks.slice(10)[parseInt(responseMessage.content) - 1];
                    })
                    .catch(() => research = research.tracks[0]);
                    
                console.log(research);
            } else {

                const soundgasm = await getSoundgasmLink(args.join(" "));
                if (soundgasm) string = soundgasm;

                if (!research) {
                    research = await player.search(string, {
                        requestedBy: message.member,
                        searchEngine: QueryType.AUTO,
                    });}
                

                if (!research.hasTracks()) {
                    embed = {
                        color: 0xff0000,
                        description: "No results found",
                        timestamp: new Date(),
                    };
    
                    await msg.edit({ embeds: [embed] });
                }
            }

            res = await player.play(message.member.voice.channel.id, Attachment ?? research, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel,
                        client: message.guild.members.me,
                        requestedBy: message.user,
                    },
                    bufferingTimeout: 15000,
                    leaveOnStop: true,
                    leaveOnStopCooldown: 5000,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 15000,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000,
                    skipOnNoStream: true,
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
