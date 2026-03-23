/* eslint-disable no-shadow */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { PassThrough } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const crypto = require("node:crypto");
const https = require("node:https");
const { StreamType } = require("discord-player");
const { downloadTrack } = require("./downloader");
const { ensureDir } = require("./downloader");
const { AttachmentExtractor } = require("@discord-player/extractor");
const { TTSExtractor } = require("discord-player-tts");
const { YoutubeiExtractor, stream } = require("discord-player-youtubei");
const { DeezerExtractor, NodeDecryptor, JSDecryptor } = require("discord-player-deezer");
const { SoundgasmExtractor } = require("discord-player-soundgasm");
const { SoundcloudExtractor } = require("discord-player-soundcloud");
const { SpotifyExtractor } = require("discord-player-spotify");
const { AppleMusicExtractor } = require("discord-player-applemusic");
const { SubsonicExtractor } = require("discord-player-subsonic");
const { YoutubeSabrExtractor } = require("@utils/helpers/youtubei/youtubeiExtractor.js");
const DOWNLOAD_ROOT = path.resolve("./downloads");

function startInterceptor(player) {
    ensureDir(DOWNLOAD_ROOT);

    const interceptor = player.createStreamInterceptor({
        async shouldIntercept(queue, track, format, stream) {
            dontIntercept = [ 
                AttachmentExtractor.identifier, 
                TTSExtractor.identifier, 
                SubsonicExtractor.identifier, 
                SoundgasmExtractor.identifier, 
            ];
            if (dontIntercept.includes(track.extractor.identifier)) return false;
            return true;
        },
    });

    interceptor.onStream(async (queue, track, format, stream) => {
        try {
            downloadTrack(track, { queue, format, stream });
        } catch (err) {
            console.error("[INTERCEPT ERROR]", err);
        }
    });
}

module.exports = { startInterceptor };