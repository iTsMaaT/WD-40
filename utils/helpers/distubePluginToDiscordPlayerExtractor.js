const {
    PlayableExtractorPlugin,
    ExtractorPlugin,
    InfoExtractorPlugin,
    Song,
    Playlist: DistubePlaylist,
} = require("distube");
const {
    BaseExtractor,
    ExtractorSearchContext,
    Track,
    Playlist,
    ExtractorInfo,
    Player,
    GuildQueueHistory,
    ExtractorExecutionContext,
} = require("discord-player");
const { Readable } = require("stream");

/**
 * Convert a Distube plugin to a discord-player extractor
 * @param plugin - The Distube plugin to convert
 * @param options - Options for the plugin
 * 
 * @returns A discord-player extractor
 */
function distubePluginToExtractor(
    plugin,
    options,
) {
    const distubePluginInstance = new plugin(options);

    const extractorClass = class extends BaseExtractor {
        constructor(context) {
            super(context);
            this.plugin = distubePluginInstance;
        }

        static identifier = `com.distube.${distubePluginInstance.constructor.name}`;

        async activate() {
            this.protocols = [distubePluginInstance.constructor.name];
        }

        async deactivate() {
            this.protocols = [];
        }

        async validate(url) {
            if (typeof this.plugin.validate === "function") 
                return await this.plugin.validate(url);
            
            return false;
        }

        async handle(url, context) {
            let result;
            if (typeof this.plugin.resolve === "function" && isUrl(url)) 
                result = await this.plugin.resolve(url, options);
            else if (plugin.prototype instanceof ExtractorPlugin && typeof plugin.prototype.searchSong === "function" && !isUrl(url)) 
                result = await new plugin(options).searchSong(url, options);
            else 
                throw new Error("Plugin cannot search or resolve URL");
            

            if (!result) 
                throw new Error("No result returned from plugin.");
            

            if (Array.isArray(result)) {
                const tracks = result.map((song) => distubeSongToDiscordPlayerTrack(song, this.context.player));
                return {
                    playlist: null,
                    tracks,
                };
            } else if (result instanceof Song) {
                const track = distubeSongToDiscordPlayerTrack(result, this.context.player);
                return {
                    playlist: null,
                    tracks: [track],
                };
            } else if (result instanceof DistubePlaylist) {
                const tracks = result.songs.map((song) => distubeSongToDiscordPlayerTrack(song, this.context.player));
                const playlist = new Playlist(this.context.player, {
                    id: result.id || "unknown-id",
                    url: result.url || "",
                    title: result.name || "Unknown",
                    description: "",
                    thumbnail: result.thumbnail || "",
                    type: "playlist",
                    source: "arbitrary",
                    author: {
                        name: result.user?.username || "Unknown",
                        url: "",
                    },
                    tracks,
                });
                return {
                    playlist,
                    tracks,
                };
            } else {
                throw new Error("Unknown result type from plugin.");
            }
        }

        async stream(info) {
            if (
                "getStreamURL" in this.plugin &&
                typeof this.plugin.getStreamURL === "function"
            ) {
                const distubeSong = discordPlayerTrackToDistubeSong(info);
                return this.plugin.getStreamURL(distubeSong);
            }

            const result = await this.context.requestBridge(info, this);
            if (result.result) throw new Error("Could not bridge this track");
            return result.result;
        }

        async getRelatedTracks(track, history) {
            if (typeof this.plugin.getRelatedSongs === "function") {
                const relatedSongs = await this.plugin.getRelatedSongs(discordPlayerTrackToDistubeSong(track));
                const tracks = relatedSongs.map((song) => distubeSongToDiscordPlayerTrack(song, this.context.player));
                return {
                    playlist: null,
                    tracks,
                };
            }
            return {
                playlist: null,
                tracks: [],
            };
        }
    };

    return extractorClass;
}

function distubeSongToDiscordPlayerTrack(song, player) {
    return new Track(player, {
        title: song.name,
        description: "",
        author: song.uploader?.name || "Unknown",
        url: song.url,
        thumbnail: song.thumbnail || "",
        duration: song.formattedDuration,
        views: song.views || 0,
        requestedBy: song.member?.user || null,
        source: "arbitrary",
    });
}

function discordPlayerTrackToDistubeSong(song) {
    return new Song({
        name: song.title,
        url: song.url,
        thumbnail: song.thumbnail,
        duration: timeFormatToMs(song.duration),
        views: song.views,
        uploader: {
            name: song.author,
        },
        plugin: null,
        source: "arbitrary",
        playFromSource: false,
        id: song.url,
    });
}

function isUrl(input) {
    try {
        const url = new URL(input);
        return ["https:", "http:"].includes(url.protocol);
    } catch (e) {
        return false;
    }
}

function timeFormatToMs(time) {
    const parts = time.split(":").map(Number);
    return parts.reduce((acc, part, index) => {
        return acc + part * Math.pow(60, parts.length - index - 1);
    }, 0);
}

module.exports = { distubePluginToExtractor };
