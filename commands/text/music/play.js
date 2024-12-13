const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { getLoopMode } = require("@utils/helpers/playerHelpers");
const { QueryType, useMainPlayer, useQueue, QueryResolver } = require("discord-player");
const config = require("@utils/config/configUtils");
const { parse } = require("node-html-parser");
const { useStats } = require("@utils/helpers/playerHelpers");

module.exports = {
    name: "play",
    description: "Play a song (works best with YouTube or Soundcloud links)",
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
    cooldown: 1,
    async execute(logger, client, message, args, optionalArgs) {
        const MAX_QUEUE_SIZE = 10000;

        const player = useMainPlayer();
        const queue = useQueue(message.guild.id);
        const playerConfig = config.get("discordPlayerConf");
        let res, research, specificSearch;
        
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });

        const attachment = message.attachments.first()?.attachment;

        let string = args.join(" ");
        if (!string) string = playerConfig.removeYoutube ? undefined : "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        if (!string) return await message.reply({ embeds: [embedGenerator.warning("Please enter a song URL or query to search.")] });
        const stringQueryType = QueryResolver.resolve(string).type;

        const isYoutube = 
        stringQueryType == QueryType.YOUTUBE_SEARCH ||
        stringQueryType == QueryType.YOUTUBE || 
        stringQueryType == QueryType.YOUTUBE_PLAYLIST || 
        stringQueryType == QueryType.YOUTUBE_VIDEO;

        if (stringQueryType === QueryType.YOUTUBE_VIDEO && playerConfig.removeYoutube && playerConfig.attemptYoutubeSearchEvenIfDisabled) {
            const messageEmbeds = message.embeds || [];
            for (const embed of messageEmbeds) {
                if (embed.provider?.name === "YouTube") {
                    string = `${embed.title} - ${embed.author.name}`;
                    break;
                }
            }
        }

        const sentMessage = await message.reply({ embeds: [embedGenerator.info({
            description: "Request received, fetching...",
            footer: { text: "Age restricted videos might not work." },
        })] });
        
        try {
            if (stringQueryType === QueryType.AUTO_SEARCH || stringQueryType === QueryType.SPOTIFY_SONG) {
                
                if (stringQueryType === QueryType.SPOTIFY_SONG) {
                    research = await player.search(string, {
                        requestedBy: message.member,
                        searchEngine: QueryType.SPOTIFY_SONG,
                    });
                    if (!research.hasTracks()) return await sentMessage.edit({ embeds: [embedGenerator.warning("No results found")] });
                    if (research && research.hasTracks()) specificSearch = `${research.tracks[0].title} - ${research.tracks[0].author}`;
                    else if (!linkRegex.test(string)) specificSearch = string;
                } else {
                    specificSearch = string;
                }

                research = await player.search(specificSearch, {
                    requestedBy: message.member,
                    searchEngine: QueryType.AUTO_SEARCH,
                });

                if (!research.hasTracks()) {
                    let footerText = "";
                    
                    if (playerConfig.removeYoutube && isYoutube) {
                        footerText = "Youtube has been disabled, for more info, use the help command and go in the support server.";
                        if (playerConfig.attemptYoutubeSearchEvenIfDisabled) 
                            footerText = "YouTube extraction is disabled, to support YouTube links, the YouTube embed must be visible";
                    }

                    return await sentMessage.edit({ embeds: [embedGenerator.warning({
                        description: "No results found",
                        footer: { text: footerText || undefined },
                    })] });
                }

                const choicesEmbed = embedGenerator.info({
                    title: "Type in chat the number you want to play",
                    description: "Not entering a number will make it play the best match",
                    fields: [],
                    timestamp: new Date(),
                });

                const choices = research.tracks.slice(0, 10);
                choices.map((track, index) => {
                    choicesEmbed.data.fields.push({ name: `${index + 1} - ${track.title}`, value: `By ${track.author}` });
                });

                await sentMessage.edit({ embeds: [choicesEmbed] });

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
                    searchEngine: !playerConfig.removeYoutube ? QueryType.YOUTUBE_SEARCH : QueryType.AUTO_SEARCH,
                });

                if (!research.hasTracks()) {return await sentMessage.edit({ embeds: [embedGenerator.warning({
                    description: "No results found",
                    footer: { 
                        text: playerConfig.removeYoutube && isYoutube ? "Youtube has been disabled, for more info, use the help command and go in the support server." : undefined,
                    },
                })] });}
            }

            if (research?.tracks?.length + (queue?.size ?? 0) > MAX_QUEUE_SIZE) return await sentMessage.edit({ embeds: [embedGenerator.error(`Cannot enqueue more than ${MAX_QUEUE_SIZE} tracks.`)] });

            let finalTrack, finalSearchResult;
            if (optionalArgs["shuffle|s"]) await research?.tracks?.shuffle();

            if (optionalArgs["playnext|pn"] && queue) {
                for (const track of research.tracks.reverse()) queue.insertTrack(track, 0);
                finalTrack = research.tracks[0];
                finalSearchResult = research;
            } else {
                const playResult = await player.play(message.member.voice.channel.id, attachment ?? research, {
                    nodeOptions: {
                        metadata: {
                            channel: message.channel,
                            client: message.guild.members.me,
                            requestedBy: message.user,
                            guild: message.guild,
                        },
                        volume: 50,
                        maxSize: MAX_QUEUE_SIZE,
                        bufferingTimeout: 15000,
                        leaveOnStop: true,
                        leaveOnStopCooldown: 0,
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 15000,
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 300000,
                        skipOnNoStream: true,
                    },
                });
                finalTrack = playResult.track;
                finalSearchResult = playResult.searchResult;
            }
            
            logger.music(`Playing [${finalTrack.title}] in [${message.member.voice.channel.name}]`);

            embed = embedGenerator.info({
                title: `${finalSearchResult.hasPlaylist() ? "Playlist" : "Track"} ${!queue?.currentTrack ? "now playing!" : "enqueued!"}`,
                thumbnail: { url: finalTrack.thumbnail },
                description: `[${finalTrack.title}](${finalTrack.url})`,
                fields: [
                    { name: "Pre-shuffled", value: optionalArgs["shuffle|s"] ? "Yes" : "No" },
                    { name: "Will play next", value: optionalArgs["playnext|pn"] && queue ? "Yes" : "No" },
                ],
                footer: { text: `Loop mode: ${getLoopMode(queue)}` },
            }).withAuthor(message.author);

            if (finalSearchResult?.playlist) embed.data.fields.push({ name: "Playlist", value: finalSearchResult.playlist.title });

            await sentMessage.edit({ embeds: [embed] });
            if (isYoutube && playerConfig.attemptYoutubeSearchEvenIfDisabled) await message.channel.send({ embeds: [embedGenerator.warning("Youtube links might not be accurate as YouTube extraction is disabled")] });
        } catch (err) {
            logger.error(err);
            return await sentMessage.edit({ embeds: [embedGenerator.error("Failed to fetch / play the requested track")] });
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

async function searchWithPriorities() {
    for (const priority of config.streamPriorities) {
        if ((priority === "youtube" && config.removeYoutube) ||
            (priority === "deezer" && config.removeDeezer)) 
            continue;
        

        let queryType;
        try {
            switch (priority) {
                case "youtube":
                    queryType = QueryType.YOUTUBE_SEARCH;
                    break;
                case "deezer":
                    queryType = QueryType.DEEZER_SEARCH;
                    break;
                case "soundcloud":
                    queryType = QueryType.SOUNDCLOUD_SEARCH;
                    break;
                default:
                    return null;
            }

        } catch (err) {
            return null;
        }
        return queryType;
    }

    return null;
}