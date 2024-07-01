const { SendErrorEmbed } = require("@functions/discordFunctions");
const { QueryType, useMainPlayer, useQueue } = require("discord-player");
const cheerio = require("cheerio");

const player = useMainPlayer();

module.exports = {
    name: "play",
    description: "Play a song (works best with YouTube or Soucloud links)",
    aliases: ["p"],
    usage: {
        required: {
            "song": "song link or query",
        },
        optional: {
            "shuffle|s": {
                hasValue: false,
                description: "shuffles before playing",
            },
            "playnext|pn": {
                hasValue: false,
                description: "puts the song in top of the queue",
            },
        },
    },
    category: "music",
    examples: ["never gonna give you up"],
    permissions: ["Connect"],
    async execute(logger, client, message, args, found) {
        let res, research, embed;
        const queue = useQueue(message.guild.id);
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");
        
        const Attachment = message.attachments.first()?.attachment;

        let string = args.join(" ");
        if (!string) string = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        // return SendErrorEmbed(message, "Please enter a song URL or query to search.", "yellow");

        embed = {
            color: 0xffffff,
            description: "Request received, fetching...",
            timestamp: new Date(),
            footer: { text: "Age restricted videos might not work." },
        };

        research = await player.search(string, {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO_SEARCH,
        });
        
        const msg = await message.reply({ embeds: [embed] });
        
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

                embed = {
                    color: 0xffffff,
                    title: "Type in chat the number you want to play",
                    description: "Not entering a number will make it play the best match",
                    fields: [],
                    timestamp: new Date(),
                };

                const choices = research.tracks.slice(0, 10);
                choices.map((track, index) => {
                    embed.fields.push({ name: `${index + 1} - ${track.title}`, value: `By ${track.author}` });
                });

                await msg.edit({ embeds: [embed] });

                const filter = (m) => m.author.id === message.author.id;
                await message.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ["time"] })
                    .then((collected) => {
                        const responseMessage = collected.first();
                        research = choices[parseInt(responseMessage.content) - 1];
                    })
                    .catch(() => research = choices[0]);
                    
            } else {

                const soundgasm = await getSoundgasmLink(args.join(" "));
                if (soundgasm) string = soundgasm;

                research = await player.search(string, {
                    requestedBy: message.member,
                    searchEngine: QueryType.AUTO,
                });
                

                if (!research.hasTracks()) {
                    embed = {
                        color: 0xff0000,
                        description: "No results found",
                        timestamp: new Date(),
                    };
    
                    await msg.edit({ embeds: [embed] });
                }
            }

            if (found["shuffle|s"]) await research?.tracks?.shuffle();
            if (found["playnext|pn"] && queue) {
                queue.insertTrack(research.tracks[0], 0);
                res = {};
                res.track = research.tracks[0];
            } else {
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
            }
            logger.music(`Playing [${res.track.title}] in [${message.member.voice.channel.name}]`); 

            embed = {
                color: 0xffffff,
                description: `Successfully enqueued${res.track.playlist ? ` **track(s)** from: **${res.track.playlist.title}**` : `: **${res.track.title}**`}`,
                timestamp: new Date(),
            };
    
            await msg.edit({ embeds: [embed] });

        } catch (err) {
            logger.error(err);
            embed = {
                color: 0xff0000,
                description: "Failed to fetch / play the requested track",
                timestamp: new Date(),
            };

            await msg.edit({ embeds: [embed] });
        }
    },
};

const getSoundgasmLink = async (link) => {
    const regex = /^https:\/\/soundgasm\.net\/.*/;
    if (!regex.test(link)) return null;

    const response = await fetch(link);
    const html = await response.json();

    const $ = cheerio.load(html);
    const scriptContent = $("script").last().html();

    const startIndex = scriptContent.indexOf("\"https://media.soundgasm.net/sounds/");
    const endIndex = scriptContent.indexOf(".m4a\"", startIndex) + 4;

    const m4aLink = scriptContent.substring(startIndex + 1, endIndex);
    return m4aLink;
};
