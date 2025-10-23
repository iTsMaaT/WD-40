const { tokenToObject } = require("discord-player-youtubei");
const { DisTubeError, ExtractorPlugin, Playlist, Song } = require("distube");
const {
    Innertube,
    UniversalCache,
    Log,
    ClientType,
    Platform,
    YTNodes,
} = require("youtubei.js");

function extractYoutubeId(url) {
    const regex =
    /^(?:https?:\/\/)?(?:(?:www|m)\.)?(?:youtube\.com|youtu\.be|music\.youtube\.com)(?:\/(?:(?:watch\?v=|embed\/|v\/|shorts\/|live\/)?([\w-]{11}))(?:\S+)?|\/playlist\?list=((?:PL|UU|LL|RD|OL)[\w-]{16,41}))(?:\S+)?/;
    const match = url.match(regex);

    if (match) {
        const client = url.includes("music.youtube.com")
            ? "youtube_music"
            : "youtube";
        if (match[1]) {
            return {
                id: match[1],
                isPlaylist: false,
                client: client,
            };
        } else if (match[2]) {
            return {
                id: match[2],
                isPlaylist: true,
                client: client,
            };
        }
    }

    return {
        id: null,
    };
}

Log.setLevel(Log.Level.NONE);

class YoutubePlugin extends ExtractorPlugin {
    constructor(configs) {
        super();
        this.configs = configs;
        this.ytInfo = null;   // For info/search/resolve
        this.ytStream = null; // For streaming
    }

    async init(distube) {
        super.init(distube);
        // Info instance: IOS, no login
        this.ytInfo = await Innertube.create({
            client_type: ClientType.IOS,
            cache: new UniversalCache(false),
        });
        // Stream instance: TV_EMBEDDED, with login
        this.ytStream = await Innertube.create({
            player_id: "0004de42",
            client_type: ClientType.TV_EMBEDDED,
            cache: new UniversalCache(false),
        });
        await this.ytStream.session.signIn(tokenToObject(process.env.YOUTUBE_ACCESS_STRING));
        const info = await this.ytStream.account.getInfo();
        console.log(info.contents?.contents
            ? `Signed into YouTube using the name: ${info.contents.contents[0].is(YTNodes.AccountItem) ? (info.contents.contents[0].as(YTNodes.AccountItem).account_name.text ?? "UNKNOWN ACCOUNT") : "UNKNOWN ACCOUNT"}`
            : `Signed into YouTube using the client name: ${this.ytStream.session.client_name}@${this.ytStream.session.client_version}`);
    }

    validate(url) {
        const id = extractYoutubeId(url).id;
        if (!id) 
            return false;
    
        return true;
    }

    async getStreamURL(song) {
        try {
            if (!song.url)
            {throw new DisTubeError(
                "INVALID_SONG",
                "Cannot get stream URL from an invalid song.",
            );}
            const info = await this.ytStream.getBasicInfo(new URL(song.url).searchParams.get("v"), {
                client: "TV",
            });
            let format;
            if (info.basic_info.is_live) {
                format = info.streaming_data.hls_manifest_url;
            } else {
                const format251 = info.streaming_data.adaptive_formats.find(
                    (f) => f.itag === 251,
                );
                format = format251.decipher(this.ytStream.session.player);
            }
            if (!format) throw new DisTubeError("NO_STREAM_URL");
            return format;
        } catch (e) {
            console.error("Error fetching stream URL:", e);
        }
    }

    async searchSong(query, options) {
        const result = await this.ytInfo.search(query.trim(), {
            type: "video",
        });
        const info = await this.ytInfo.getBasicInfo(result.results[0].video_id);
        return new YoutubeSong(this, info, options);
    }

    async resolve(url, options) {
        const validated = extractYoutubeId(url);
        if (!validated.id) throw new DisTubeError("CANNOT_RESOLVE_SONG");
        if (validated.isPlaylist) {
            const pl = await this.ytInfo.getPlaylist(validated.id);
            const promises = pl.items
                .filter((i) => i.id !== undefined)
                .map(async (i) => {
                    const song = await this.ytInfo.getBasicInfo(i.id);
                    return song;
                });
            const songs = await Promise.all(promises);
            return new YoutubePlaylist(
                this,
                {
                    id: pl.endpoint.payload.playlistId,
                    name: pl.info.title,
                    url: `https://www.youtube.com/playlist?list=${pl.endpoint.payload.playlistId}`,
                    thumbnail: pl.info.thumbnails.sort((a, b) => b.width - a.width)[0]
                        .url,
                    songs,
                },
                options,
            );
        } else {
            const info = await this.ytInfo.getBasicInfo(validated.id);
            return new YoutubeSong(this, info, options);
        }
    }

    async getRelatedSongs(song) {
        throw new DisTubeError("NO_RELATED_SONGS");
    }
}

class YoutubeSong extends Song {
    /**
   *
   * @param {ExtractorPlugin} plugin
   * @param {import("youtubei.js").YT.VideoInfo} info
   * @param {*} options
   */
    constructor(plugin, info, options) {
        super(
            {
                plugin,
                source: "youtube",
                playFromSource: true,
                id: info.basic_info.id,
                url: `https://www.youtube.com/watch?v=${info.basic_info.id}`,
                name: info.basic_info.title,
                thumbnail: info.basic_info.thumbnail.sort(
                    (a, b) => b.width - a.width,
                )[0].url,
                duration: info.basic_info.duration,
                isLive: info.basic_info.is_live,
                ageRestricted: false,
                views: info.basic_info.view_count,
                likes: info.basic_info.like_count,
                uploader: {
                    name: info.basic_info.author,
                    url: `https://www.youtube.com/channel/${info.basic_info.channel_id}`,
                },
            },
            options,
        );
    }
}

class YoutubePlaylist extends Playlist {
    /**
   *
   * @param {*} plugin
   * @param {Object} info
   * @param {import("youtubei.js").YT.VideoInfo[]} info.songs
   */
    constructor(plugin, info, options) {
        const songs = info.songs.map(
            (s) =>
                new Song({
                    plugin,
                    source: "youtube",
                    playFromSource: true,
                    id: s.basic_info.id,
                    url: `https://www.youtube.com/watch?v=${s.basic_info.id}`,
                    name: s.basic_info.title,
                    thumbnail: s.basic_info.thumbnail.sort((a, b) => b.width - a.width)[0]
                        .url,
                    duration: s.basic_info.duration,
                    isLive: s.basic_info.is_live,
                    ageRestricted: false,
                    views: s.basic_info.view_count,
                    likes: s.basic_info.like_count,
                    uploader: {
                        name: s.basic_info.author,
                        url: `https://www.youtube.com/channel/${s.basic_info.channel_id}`,
                    },
                }),
        );
        super(
            {
                source: "youtube",
                id: info.id,
                name: info.name,
                url: info.url,
                thumbnail: info.thumbnail,
                songs,
            },
            options,
        );
    }
}

module.exports = {
    YoutubePlugin,
};