const SoundCloud = require("soundcloud.ts");
const {
    BaseExtractor,
    ExtractorInfo,
    Playlist,
    Track,
    Util,
} = require("discord-player");

const soundcloudTrackRegex = /^(https?:\/\/(m\.|www\.)?soundcloud\.com\/([\w-]+)\/([\w-]+)(.+)?)$/;
const soundcloudShortenedTrackRegex = /^https:\/\/on\.soundcloud\.com\/[a-zA-Z1-9]{0,17}$/;
const soundcloudPlaylistRegex = /^(https?:\/\/(m\.|www\.)?soundcloud\.com\/([\w-]+)\/sets\/([\w-]+)(.+)?)$/;

const filterSoundCloudPreviews = (tracks) => {
    const filtered = tracks.filter(t => t.policy?.toUpperCase() === "ALLOW" || !(t.duration === 30000 && t.full_duration > 30000));
    return filtered.length > 0 ? filtered : tracks;
};

class SoundCloudExtractor extends BaseExtractor {
    static identifier = "com.discord-player.soundcloudextractor";
    static instance = null;

    constructor(options = {}) {
        super(options);
        this.internal = new SoundCloud.default(options.clientId, options.oauthToken);
    }

    async activate() {
        this.protocols = ["scsearch", "soundcloud"];
        SoundCloudExtractor.instance = this;
    }

    async deactivate() {
        this.protocols = [];
        SoundCloudExtractor.instance = null;
    }

    async validate(query) {
        return typeof query === "string" &&
            [soundcloudTrackRegex, soundcloudShortenedTrackRegex, soundcloudPlaylistRegex].some(regex => regex.test(query));
    }

    createTrackObject(trackInfo, requestedBy, playlist = null) {
        const track = new Track(this.context.player, {
            title: trackInfo.title,
            url: trackInfo.permalink_url,
            duration: Util.buildTimeCode(Util.parseMS(trackInfo.duration)),
            description: trackInfo.description ?? "",
            thumbnail: trackInfo.artwork_url,
            views: trackInfo.playback_count,
            author: trackInfo.user.username,
            requestedBy,
            source: "soundcloud",
            engine: trackInfo,
            metadata: trackInfo,
            requestMetadata: async () => trackInfo,
            cleanTitle: trackInfo.title,
            playlist,
        });
        track.extractor = this;
        return track;
    }

    async getRelatedTracks(track, history) {
        const data = await this.internal.tracks.related(track.url, 5).catch(() => []);
        if (!data.length) return this.emptyResponse();

        const unique = filterSoundCloudPreviews(data).filter(t => !history.tracks.some(h => h.url === t.permalink_url));
        return this.createResponse(null, (unique.length ? unique : data).map(t => this.createTrackObject(t, track.requestedBy)));
    }

    async handle(query, context) {
        if (soundcloudPlaylistRegex.test(query)) {
            const data = await this.internal.playlists.get(query).catch(() => null);
            if (!data) return this.emptyResponse();

            const playlist = new Playlist(this.context.player, {
                title: data.title,
                description: data.description ?? "",
                thumbnail: data.artwork_url ?? data.tracks[0]?.artwork_url,
                type: "playlist",
                source: "soundcloud",
                author: { name: data.user.username, url: data.user.permalink_url },
                tracks: [],
                id: `${data.id}`,
                url: data.permalink_url,
                rawPlaylist: data,
            });
            
            playlist.tracks = data.tracks.map(song => this.createTrackObject(song, context.requestedBy, playlist));
            return { playlist, tracks: playlist.tracks };
        }

        if (soundcloudTrackRegex.test(query) || soundcloudShortenedTrackRegex.test(query)) {
            const trackInfo = await this.internal.tracks.get(query).catch(() => null);
            return trackInfo ? { playlist: null, tracks: [this.createTrackObject(trackInfo, context.requestedBy)] } : this.emptyResponse();
        }

        // Default case: treat as search
        let tracks = await this.internal.tracks.search({ q: query }).then(t => t.collection).catch(() => []);
        if (!tracks.length) tracks = await this.internal.tracks.searchAlt(query).catch(() => []);
        if (!tracks.length) return this.emptyResponse();

        return {
            playlist: null,
            tracks: filterSoundCloudPreviews(tracks).filter(t => t.streamable).map(t => this.createTrackObject(t, context.requestedBy)),
        };
    }

    emptyResponse() {
        return { playlist: null, tracks: [] };
    }

    async stream(info) {
        const url = await this.internal.util.streamLink(info.url).catch(() => null);
        if (!url) throw new Error("Could not extract stream from this track source");
        return url;
    }
}

module.exports = SoundCloudExtractor;
