const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { getLoopMode } = require("@utils/helpers/playerHelpers");
const { QueryType, useMainPlayer, useQueue } = require("discord-player");
const config = require("@utils/config/configUtils");
const { parse } = require("node-html-parser");

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
    permissions: [PermissionsBitField.Flags.Connect],
    async execute(logger, client, message, args, optionalArgs) {
        let res, research, embed;
        const queue = useQueue(message.guild.id);
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        
        const Attachment = message.attachments.first()?.attachment;

        let string = args.join(" ");
        // string = string.split("&list=")[0];
        if (!string) string = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        // return await message.reply({ embeds: [embedGenerator.warning("Please enter a song URL or query to search.")] });

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
            if ((spotifyRegex.test(string) || !linkRegex.test(string)) && !config.get("discordPlayerConf")?.removeYoutube) {
                
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
                        responseMessage.delete();
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

            if (optionalArgs["shuffle|s"]) await research?.tracks?.shuffle();
            if (optionalArgs["playnext|pn"] && queue) {
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
                            guild: message.guild,
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

            embed = embedGenerator.info({
                title: `${res.searchResult.hasPlaylist() ? "Playlist" : "Track"} enqueued!`,
                thumbnail: { url: res.track.thumbnail },
                description: `[${res.track.title}](${res.track.url})`,
                fields: res.searchResult?.playlist ? [{ name: "Playlist", value: res.searchResult.playlist.title }] : [],
                footer: { text: `Loop mode: ${getLoopMode(queue)}` },
            }).withAuthor(message.author);
    
            await msg.edit({ embeds: [embed] });

        } catch (err) {
            logger.error(err);
            return await msg.edit({ embeds: [embedGenerator.error("Failed to fetch / play the requested track")] });
        }
    },
};

const getSoundgasmLink = async (link) => {
    const regex = /^https:\/\/soundgasm\.net\/.*/;
    if (!regex.test(link)) return null;

    const response = await fetch(link);
    const html = await response.text();

    const root = parse(html);
    const scriptContent = root.querySelectorAll("script").pop().text;

    const startIndex = scriptContent.indexOf("\"https://media.soundgasm.net/sounds/");
    const endIndex = scriptContent.indexOf(".m4a\"", startIndex) + 4;

    const m4aLink = scriptContent.substring(startIndex + 1, endIndex);
    return m4aLink;
};