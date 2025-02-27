const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { getLoopMode } = require("@utils/helpers/playerHelpers");
const { QueryType, useMainPlayer, useQueue, QueryResolver } = require("discord-player");
const config = require("@utils/config/configUtils");
const { searchWithPriorities, getProbableBridgeSource } = require("@utils/helpers/playerHelpers");
const fs = require("fs");
const isURL = require("@utils/functions/isURL");
const { simpleFolderSearch } = require("simple-folder-search");

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
                description: "puts the song(s) on top of the queue",
            },
        },
    },
    category: "music",
    examples: ["never gonna give you up"],
    permissions: [PermissionsBitField.Flags.Connect],
    cooldown: 1000,
    inVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const player = useMainPlayer();
        const queue = useQueue();
        const playerConfig = config.get("discordPlayerConf");
        const attachment = message.attachments.first()?.attachment;
        let string = args.join(" ") || (playerConfig.removeYoutube ? undefined : "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

        if (!string) 
            return await message.reply({ embeds: [embedGenerator.warning("Please enter a song URL or query to search.")] });
        
        const stringQueryType = QueryResolver.resolve(string).type;
        const isYoutube = [QueryType.YOUTUBE_SEARCH, QueryType.YOUTUBE, QueryType.YOUTUBE_PLAYLIST, QueryType.YOUTUBE_VIDEO].includes(stringQueryType);
        const isSoundcloud = [QueryType.SOUNDCLOUD_SEARCH, QueryType.SOUNDCLOUD, QueryType.SOUNDCLOUD_PLAYLIST, QueryType.SOUNDCLOUD_TRACK].includes(stringQueryType);
        const needsBridge = stringQueryType === QueryType.AUTO_SEARCH || stringQueryType === QueryType.SPOTIFY_SONG;
        const doesntNeedBridge = isYoutube || isSoundcloud || stringQueryType === QueryType.ARBITRARY;

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
            let research, specificSearch, choice = null;

            if (needsBridge) {
                if (stringQueryType === QueryType.SPOTIFY_SONG) {
                    research = await player.search(string, {
                        requestedBy: message.member,
                        searchEngine: QueryType.SPOTIFY_SONG,
                    });
                    if (!research.hasTracks()) return await sentMessage.edit({ embeds: [embedGenerator.warning("No results found")] });
                    specificSearch = research.tracks[0]?.title ? `${research.tracks[0].title} - ${research.tracks[0].author}` : string;
                } else {
                    specificSearch = string;
                }

                research = await player.search(specificSearch, {
                    requestedBy: message.member,
                    searchEngine: "ext:" + searchWithPriorities(playerConfig),
                });

                if (!research.hasTracks()) {
                    let footerText = "";
                    if (playerConfig.removeYoutube && isYoutube) {
                        footerText = playerConfig.attemptYoutubeSearchEvenIfDisabled
                            ? "YouTube extraction is disabled, to support YouTube links, the YouTube embed must be visible"
                            : "Youtube has been disabled, for more info, use the help command and go in the support server.";
                    }
                    return await sentMessage.edit({ embeds: [embedGenerator.warning({
                        description: "No results found",
                        footer: { text: footerText || undefined },
                    })] });
                }

                const musicPath = process.cwd() + "/music";
                let fileTrack = null;
                if (fs.existsSync(musicPath)) {
                    const files = await simpleFolderSearch(musicPath, playerConfig.supportedFileExtensions, string, { minimumScore: 0.4 });
                    if (files.length) {
                        try {
                            fileTrack = await player.search(files[0], { 
                                requestedBy: message.member,
                                searchEngine: QueryType.FILE,
                            });
                        } catch {
                            fileTrack = null;
                        }
                    }
                }

                const choicesEmbed = embedGenerator.info({
                    title: "Type in chat the number you want to play",
                    description: "Not entering a number will make it play the best match",
                    fields: [],
                    timestamp: new Date(),
                });

                if (fileTrack) {
                    fileTrack.tracks[0].title = "[Local file] " + fileTrack.tracks[0].title;
                    research.tracks.unshift(fileTrack.tracks[0]);
                }

                research.tracks.slice(0, 10).forEach((track, index) => {
                    choicesEmbed.data.fields.push({ name: `${index + 1} - ${track.title}`, value: `By ${track.author}` });
                });

                await sentMessage.edit({ embeds: [choicesEmbed] });

                const filter = (m) => m.author.id === message.author.id;
                await message.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ["time"] })
                    .then((collected) => {
                        const responseMessage = collected.first();
                        choice = parseInt(responseMessage.content) - 1;
                        responseMessage.delete().catch(() => null);
                    })
                    .catch(() => choice = 0);
            } else {
                research = await player.search(string, { requestedBy: message.member });
                if (!research.hasTracks()) {
                    return await sentMessage.edit({ embeds: [embedGenerator.warning({
                        description: "No results found",
                        footer: { 
                            text: playerConfig.removeYoutube && isYoutube ? "Youtube has been disabled, for more info, use the help command and go in the support server." : undefined,
                        },
                    })] });
                }
            }

            if (research?.tracks?.length + (queue?.size ?? 0) > playerConfig.maxQueueSize) 
                return await sentMessage.edit({ embeds: [embedGenerator.error(`Cannot enqueue more than ${playerConfig.maxQueueSize} tracks.`)] });
            

            if (optionalArgs["shuffle|s"] && !choice) await research?.tracks?.shuffle();

            let finalTrack, finalSearchResult;
            if (optionalArgs["playnext|pn"] && queue) {
                const tracksToInsert = choice !== null ? [research.tracks[choice]] : research.tracks.reverse();
                for (const track of tracksToInsert) 
                    queue.insertTrack(track, 0);
                
                finalTrack = research.tracks[choice ?? 0];
                finalSearchResult = research;
            } else {
                const playResult = await player.play(
                    message.member.voice.channel.id,
                    attachment ?? (choice !== null ? research.tracks[choice] : research),
                    {
                        nodeOptions: {
                            metadata: {
                                channel: message.channel,
                                client: message.guild.members.me,
                                requestedBy: message.user,
                                guild: message.guild,
                                probableBridgeSource: getProbableBridgeSource(playerConfig, !needsBridge && doesntNeedBridge),
                            },
                            verifyFallbackStream: true,
                            ...playerConfig.globalPlayerNodeOptions,
                        },
                    },
                );
                finalTrack = playResult.track;
                finalSearchResult = playResult.searchResult;
            }

            logger.music(`Playing [${finalTrack.title}] in [${message.member.voice.channel.name}]`);

            embed = embedGenerator.info({
                title: `${finalSearchResult.hasPlaylist() ? "Playlist" : "Track"} ${!queue?.currentTrack ? "now playing!" : "enqueued!"}`,
                thumbnail: { url: finalTrack.thumbnail },
                description: isURL(finalTrack.url) ? `[${finalTrack.title}](${finalTrack.url})` : finalTrack.title,
                fields: [
                    { name: "Pre-shuffled", value: optionalArgs["shuffle|s"] ? "Yes" : "No", inline: true },
                    { name: "Will play next", value: optionalArgs["playnext|pn"] && queue ? "Yes" : "No", inline: true },
                    { name: "Extractor", value: `\`${finalTrack.extractor?.identifier || "N/A"}\`` },
                    { name: "Probable bridge source ( [\\▶] = upon fail, falls back to...)", value: getProbableBridgeSource(playerConfig, !needsBridge && doesntNeedBridge) },
                ],
                footer: { text: `Loop mode: ${getLoopMode(queue)}` },
            }).withAuthor(message.author);

            if (finalSearchResult?.playlist) 
                embed.data.fields.push({ name: "Playlist", value: `[${finalSearchResult.playlist.title}](${finalSearchResult.playlist.url})` });
            

            await sentMessage.edit({ embeds: [embed] });
            if (playerConfig.removeYoutube && isYoutube && playerConfig.attemptYoutubeSearchEvenIfDisabled) 
                await message.channel.send({ embeds: [embedGenerator.warning("Youtube links might not be accurate as YouTube extraction is disabled")] });
            
        } catch (err) {
            logger.error(err);
            await sentMessage.edit({ embeds: [embedGenerator.error("Failed to fetch / play the requested track")] });
        }
    },
};

/**
 * Attempts to find an extractor and type for a given query
 * 
 * @param {string} query 
 * @param {Player} player 
 * @returns {Promise<{ extractor: Extractor | null, type: string }>}
 */
async function awareQueryResolver(query, player) {
    const extractors = player.extractors.store;
    const result = { extractor: null, type: null };

    if (!query || !extractors || !extractors.size) return result;

    const maybeTrack = ["track", "song", "music", "audio", "video", "watch"];
    const maybePlaylist = ["playlist", "album", "mix", "compilation", "set", "queue", "list"];
    const maybeSearch = ["search", "find", "look", "query", "get", "play"];

    if (maybeTrack.some(word => query.includes(word))) result.type = "track";
    else if (maybePlaylist.some(word => query.includes(word))) result.type = "playlist";
    else if (maybeSearch.some(word => query.includes(word))) result.type = "search";

    const sortedExtractors = Array.from(extractors.values()).sort((a, b) => b.priority - a.priority);

    for (const extractor of sortedExtractors) {
        try {
            if (await extractor.validate(query, QueryResolver.resolve(query).type)) {
                result.extractor = extractor;
                break;
            }
        } catch {
            result.extractor = null;
            break;
        }
    }

    return result;
}