const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { getLoopMode } = require("@utils/helpers/playerHelpers");
const { QueryType, useMainPlayer, useQueue, QueryResolver } = require("discord-player");
const { SpotifyExtractor } = require("discord-player-spotify");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const config = require("@utils/config/configUtils");
const { searchWithPriorities, getProbableBridgeSource } = require("@utils/helpers/playerHelpers");
const fs = require("fs");
const isURL = require("@utils/functions/isURL");
const { simpleFolderSearch } = require("simple-folder-search");

module.exports = {
    name: "play",
    description: "Play a song (works best with Deezer or Soundcloud links (YouTube breaks often))", 
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
    examples: ["never gonna give you up", "https://www.youtube.com/watch?v=dQw4w9WgXcQ -pn", "https://open.spotify.com/album/3tH2uMqhU1hP9BBOkDkXIZ -s -pn"],
    permissions: [PermissionsBitField.Flags.Connect],
    cooldown: 1000,
    inVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const player = useMainPlayer();
        const queue = useQueue();
        const playerConfig = config.get("discordPlayer");

        // if (await player.play(message.member.voice.channel.id, args.join(" "), { nodeOptions: {
        //    metadata: {
        //        channel: message.channel,
        //        client: message.guild.members.me,
        //        requestedBy: message.user,
        //        guild: message.guild,
        //        probableBridgeSource: "balls",
        //    },
        //    verifyFallbackStream: true,
        //    ...playerConfig.globalPlayerNodeOptions,
        // } })) return;

        const attachment = message.attachments.first()?.attachment;
        let string = args.join(" ") || "Never gonna give you up";

        
        if (!string && !attachment) 
            return await message.reply({ embeds: [embedGenerator.warning("Please enter a song URL or query to search.")] });
        
        const queryType = await awareQueryResolver(string, player, playerConfig);
        if (!isURL(string)) {
            queryType.canStream = false;
            queryType.type = "search";
        }

        if (isURL(string) && string.includes("deezer")) string = await unshortenURL(string);

        if (
            (string.includes("youtube.com") || string.includes("youtu.be")) 
            && (queryType.type === "track" || queryType.type === null)
            && !playerConfig.extractors.Youtubei.enabled 
            && playerConfig.extractors.Youtubei.config.attemptYoutubeSearchEvenIfDisabled.usingEmbed
        ) {
            const messageEmbeds = message.embeds || [];
            for (const embed of messageEmbeds) {
                if (embed.provider?.name === "YouTube") {
                    string = embed.title;
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

            if (!queryType.canStream && queryType.type !== "playlist") {
                if (
                    queryType.extractor?.identifier === SpotifyExtractor.identifier 
                    && queryType.type === "track" 
                    && playerConfig.extractors.Spotify.enabled
                ) {
                    research = await player.search(string, {
                        requestedBy: message.member,
                        searchEngine: `ext:${SpotifyExtractor.identifier}`,
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
                    if (!playerConfig.extractors.Youtubei.enabled && (string.includes("youtube.com") || string.includes("youtu.be"))) { 
                        footerText = playerConfig.extractors.Youtubei.config.attemptYoutubeSearchEvenIfDisabled.usingEmbed
                            ? "YouTube extraction is disabled, to support YouTube links, the YouTube embed must be visible (and it stillmight fail)"
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

                choicesEmbed.data.fields.push({ name: "0 - Cancel", value: "Cancels the request" });
                research.tracks.slice(0, 10).forEach((track, index) => {
                    choicesEmbed.data.fields.push({ name: `${index + 1} - ${track.title}`, value: `By ${track.author}` });
                });

                await sentMessage.edit({ embeds: [choicesEmbed] });

                const filter = (m) => m.author.id === message.author.id && !isNaN(m.content);
                await message.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ["time", "channelDelete", "guildDelete", "messageDelete"] })
                    .then((collected) => {
                        const responseMessage = collected.first();
                        choice = (parseInt(responseMessage.content)) - 1;
                        responseMessage.delete().catch(() => null);
                    })
                    .catch(() => choice = 0);
            } else {
                research = await player.search(string, { requestedBy: message.member });
                if (!research.hasTracks()) {
                    return await sentMessage.edit({ embeds: [embedGenerator.warning({
                        description: "No results found",
                        footer: { 
                            text: !playerConfig.extractors.Youtubei.enabled && (string.includes("youtube.com") || string.includes("youtu.be")) ? "Youtube has been disabled, for more info, use the help command and go in the support server." : undefined,
                        },
                    })] });
                }
            }

            if (choice === -1) return await sentMessage.edit({ embeds: [embedGenerator.warning("Play request cancelled")] });
            if (choice !== null && (choice < 0 || choice >= research.tracks.length))
                return await sentMessage.edit({ embeds: [embedGenerator.warning("Invalid choice, please enter a valid number")] });

            if (research?.tracks?.length + (queue?.size ?? 0) > playerConfig.globalPlayerNodeOptions.maxSize) 
                return await sentMessage.edit({ embeds: [embedGenerator.warning(`Cannot enqueue more than ${playerConfig.maxQueueSize} tracks.`)] });
            

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
                                probableBridgeSource: getProbableBridgeSource(playerConfig, queryType.canStream),
                            },
                            verifyFallbackStream: false,
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
                    { name: "Force play next", value: optionalArgs["playnext|pn"] && queue ? "Yes" : "No", inline: true },
                    { name: "Extractor", value: `\`${finalTrack.extractor?.identifier || "N/A"}\`` },
                    { name: "Probable bridge source ( [\\▶] = upon fail, falls back to...)", value: getProbableBridgeSource(playerConfig, queryType.canStream) },
                ],
                footer: { text: `Loop mode: ${getLoopMode(queue)}` },
            }).withAuthor(message.author);

            if (finalSearchResult?.playlist) 
                embed.data.fields.push({ name: "Playlist", value: `[${finalSearchResult.playlist.title}](${finalSearchResult.playlist.url})` });

            await sentMessage.edit({ embeds: [embed] });
            if (!playerConfig.extractors.Youtubei.enabled && (string.includes("youtube.com") || string.includes("youtu.be")) && playerConfig.extractors.Youtubei.config.attemptYoutubeSearchEvenIfDisabled.usingEmbed)
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
async function awareQueryResolver(query, player, playerConfig) {
    const extractors = player.extractors.store;
    const result = { extractor: null, type: null, canStream: false };
    const extractorConfig = Object.entries(playerConfig?.extractors) || {};

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
                const configEntry = extractorConfig.find(
                    ext => extractor.identifier.toLowerCase().includes(ext[0].toLowerCase()),
                );
                result.canStream = configEntry ? !!configEntry[1].canStream : false;
                break;
            }
        } catch {
            result.extractor = null;
            break;
        }
    }

    return result;
}

/**
 * Unshortens a URL using a HEAD request
 * 
 * @param {string} url - The URL to unshorten
 * @returns {Promise<string>} The unshortened URL or the original URL if an error occurs
 */
async function unshortenURL(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(7000),
        });

        const { origin, pathname } = new URL(response.url);
        return origin + pathname;
    } catch (error) {
        console.error("Failed to unshorten:", error.message);
        return url;
    }
}