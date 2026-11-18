/* eslint-disable no-shadow */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import crypto from "node:crypto";
import https from "node:https";
import { StreamType } from "discord-player";
import { downloadTrack, ensureDir } from "./downloader.js";
import { AttachmentExtractor } from "@discord-player/extractor";
import { TTSExtractor } from "discord-player-tts";
import * as discordPlayerYoutubei from "discord-player-youtubei";
const { YoutubeExtractor, stream } = discordPlayerYoutubei;
import { DeezerExtractor, NodeDecryptor, JSDecryptor } from "discord-player-deezer";
const { SoundgasmExtractor } = require("discord-player-soundgasm");
import { SoundcloudExtractor } from "discord-player-soundcloud";
import { SpotifyExtractor } from "discord-player-spotify";
import { AppleMusicExtractor } from "discord-player-applemusic";
import { SubsonicExtractor } from "discord-player-subsonic";
import { YoutubeSabrExtractor } from "#utils/helpers/youtubei/youtubeiExtractor.js";
const DOWNLOAD_ROOT = path.resolve("./downloads");

/**
 * Starts the interceptor for the given player.
 * 
 * @param {Player} player - The player instance.
 */
function startInterceptor(player) {
    ensureDir(DOWNLOAD_ROOT);

    const interceptor = player.createStreamInterceptor({
        async shouldIntercept(queue, track, format, stream) {
            const dontIntercept = [ 
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

export { startInterceptor };