/* eslint-disable no-useless-catch */
/* eslint-disable no-empty */
/* eslint-disable no-empty-function */
/* eslint-disable no-control-regex */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const https = require("node:https");
const { PassThrough } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { StreamType } = require("discord-player");

const DOWNLOAD_ROOT = path.resolve("./downloads");
const MAX_CONCURRENT = 2;
const metadataCache = new Map();

/** @type {Set<Promise<void>>} */
const activeJobs = new Set();

/** @type {Array<() => Promise<void>>} */
const queue = [];

/** @type {Set<string>} */
const knownHashes = new Set();

/**
 * Ensures a directory exists (recursive).
 * @param {string} dir
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) 
        fs.mkdirSync(dir, { recursive: true });
    
}

/**
 * Sanitizes a string for safe filesystem usage.
 * @param {string} [str]
 * @returns {string}
 */
function sanitize(str = "Unknown") {
    return str.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim() || "Unknown";
}

/**
 * Adds a job to the queue.
 * @param {() => Promise<void>} job
 */
function enqueue(job) {
    queue.push(job);
    processQueue();
}

/**
 * Processes queued jobs with concurrency limit.
 */
function processQueue() {
    if (activeJobs.size >= MAX_CONCURRENT) return;

    const job = queue.shift();
    if (!job) return;

    const promise = job();
    activeJobs.add(promise);

    promise.finally(() => {
        activeJobs.delete(promise);
        processQueue();
    });
}

/**
 * Fetches a thumbnail from a URL.
 * @param {string | undefined} url
 * @returns {Promise<Buffer|null>}
 */
function fetchThumbnail(url) {
    return new Promise((resolve) => {
        if (!url) return resolve(null);

        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                return resolve(null);
            }

            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", () => resolve(null));
    });
}

/**
 * Fetch metadata from MusicBrainz
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<{ album?: string, year?: string } | null>}
 */
function fetchMetadata(title, artist) {
    const query = encodeURIComponent(`recording:${title} AND artist:${artist}`);
    const url = `https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&limit=1`;

    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                "User-Agent": "YourBot/1.0 (your@email.com)",
            },
        }, (res) => {
            let data = "";

            res.on("data", (c) => (data += c));
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    const rec = json.recordings?.[0];

                    if (!rec) return resolve(null);

                    const release = rec.releases?.[0];

                    resolve({
                        album: release?.title,
                        year: release?.date?.split("-")[0],
                    });
                } catch {
                    resolve(null);
                }
            });
        }).on("error", () => resolve(null));
    });
}

async function fetchMetadataCached(title, artist) {
    const key = `${title}|${artist}`;

    if (metadataCache.has(key)) 
        return metadataCache.get(key);
    

    const data = await fetchMetadata(title, artist);
    metadataCache.set(key, data);

    return data;
}

/**
 * Converts an image buffer (webp/png/etc) to JPEG using FFmpeg
 * @param {Buffer} input
 * @returns {Promise<Buffer|null>}
 */
function convertToJpeg(input) {
    return new Promise((resolve) => {
        const ffmpeg = spawn("ffmpeg", [
            "-loglevel", "error",
            "-i", "pipe:0",
            "-f", "image2",
            "-vcodec", "mjpeg",
            "pipe:1",
        ], {
            stdio: ["pipe", "pipe", "ignore"],
        });

        const chunks = [];

        ffmpeg.stdout.on("data", (c) => chunks.push(c));
        ffmpeg.stdout.on("end", () => {
            resolve(Buffer.concat(chunks));
        });

        ffmpeg.on("error", () => resolve(null));
        ffmpeg.on("close", () => resolve(Buffer.concat(chunks)));

        ffmpeg.stdin.write(input);
        ffmpeg.stdin.end();
    });
}

/**
 * Main entry point for downloading a track.
 * Attempts stream-based download first, falls back to interceptor stream.
 *
 * @param {import("discord-player").Track} track
 * @param {{ queueCtx: any, format: number, stream: any } | undefined} fallbackData
 */
function downloadTrack(track, fallbackData) {
    enqueue(async () => {
        try {
            await downloadViaStream(track);
        } catch (err) {
            console.log("[FALLBACK] stream() failed → raw stream\n", err);

            if (!fallbackData) {
                console.log("[NO FALLBACK AVAILABLE]");
                return;
            }

            await downloadViaRaw(
                fallbackData.queueCtx,
                track,
                fallbackData.format,
                fallbackData.stream,
            );
        }
    });
}

/**
 * Downloads a track using track.stream().
 * @param {import("discord-player").Track} track
 */
async function downloadViaStream(track) {
    const title = sanitize(track.title);
    const artist = sanitize(track.author || "Unknown Artist");
    let album = track.metadata?.album;
    let year = null;

    if (!album) {
        const meta = await fetchMetadataCached(track.title, track.author);
        album = meta?.album;
        year = meta?.year || null;
    }

    album = sanitize(album || "Unknown Album");

    const outputDir = path.join(DOWNLOAD_ROOT, artist, album);
    ensureDir(outputDir);

    const outputPath = path.join(outputDir, `${title}.mp3`);

    if (fs.existsSync(outputPath)) {
        console.log(`[SKIP EXISTS] ${outputPath}`);
        return;
    }

    console.log(`[STREAM DOWNLOAD] ${artist} - ${title}`);

    let stream;
    try {
        stream = await Promise.race([
            track.extractor.stream(track),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Stream timeout")), 10000)),
        ]);
    } catch (e) {
        throw e;
    }

    const hash = crypto.createHash("sha1");
    let hashing = true;

    stream.on("data", (c) => {
        if (hashing) hash.update(c);
    });

    let thumbBuffer = await fetchThumbnail(
        track.thumbnail || track.raw?.thumbnails?.[0]?.url,
    );

    // ---- Detect WebP ----
    const isWebp =
    thumbBuffer &&
    thumbBuffer.subarray(0, 4).toString() === "RIFF" &&
    thumbBuffer.subarray(8, 12).toString() === "WEBP";

    if (isWebp) {
        console.log("[THUMBNAIL] WebP detected → converting to JPEG");

        const converted = await convertToJpeg(thumbBuffer);

        if (converted && converted.length > 0) {
            thumbBuffer = converted;
        } else {
            console.log("[THUMBNAIL] Conversion failed → skipping");
            thumbBuffer = null;
        }
    }
    const args = ["-loglevel", "error", "-i", "pipe:0"];

    if (thumbBuffer) {
        args.push(
            "-f", "image2pipe",
            "-i", "pipe:3",
            "-map", "0:a",
            "-map", "1:v",
            "-c:v", "mjpeg",
            "-id3v2_version", "3",
            "-metadata:s:v", "title=Album cover",
            "-metadata:s:v", "comment=Cover (front)",
        );
    }

    if (!thumbBuffer) args.push("-vn");
    args.push(
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "192k",
        "-metadata", `title=${title}`,
        "-metadata", `artist=${artist}`,
        "-metadata", `album=${album}`,
    );

    if (year) 
        args.push("-metadata", `date=${year}`);

    args.push("-f", "mp3", outputPath);

    const ffmpeg = spawn("ffmpeg", args, {
        stdio: ["pipe", "ignore", "inherit", "pipe"],
    });

    ffmpeg.stdin.on("error", () => {});
    stream.on("error", () => {});

    stream.pipe(ffmpeg.stdin);

    if (thumbBuffer && ffmpeg.stdio[3] && !ffmpeg.stdio[3].destroyed) {
        ffmpeg.stdio[3].write(thumbBuffer);
        ffmpeg.stdio[3].end();
    }

    const code = await new Promise((r) => ffmpeg.on("close", r));

    if (code !== 0) {
        console.log(`[FFMPEG ERROR] ${title} (code ${code})`);
        fs.rmSync(outputPath, { force: true });
        return;
    }
    hashing = false;

    const digest = hash.digest("hex");

    if (!fs.existsSync(outputPath)) return;

    const stats = fs.statSync(outputPath);

    if (stats.size < 100_000) {
        fs.rmSync(outputPath, { force: true });
        return;
    }

    if (knownHashes.has(digest)) {
        console.log(`[DUPLICATE] ${title}`);
        fs.rmSync(outputPath, { force: true });
        return;
    }

    knownHashes.add(digest);

    console.log(`[DONE] ${outputPath}`);
}

/**
 * Fallback downloader using intercepted raw stream.
 * @param {*} queueCtx
 * @param {import("discord-player").Track} track
 * @param {number} format
 * @param {*} stream
 */
async function downloadViaRaw(queueCtx, track, format, stream) {
    const title = sanitize(track.title);
    const artist = sanitize(track.author || "Unknown Artist");
    let album = track.metadata?.album;
    let year = null;

    if (!album) {
        const meta = await fetchMetadataCached(track.title, track.author);
        album = meta?.album;
        year = meta?.year || null;
    }

    album = sanitize(album || "Unknown Album");

    const outputDir = path.join(DOWNLOAD_ROOT, artist, album);
    ensureDir(outputDir);

    const outputPath = path.join(outputDir, `${title}.mp3`);

    if (fs.existsSync(outputPath)) return;

    console.log(`[RAW FALLBACK] ${artist} - ${title}`);

    const passthrough = new PassThrough();
    const hashStream = new PassThrough();

    stream.interceptors.add(passthrough);
    stream.interceptors.add(hashStream);

    const hash = crypto.createHash("sha1");
    hashStream.on("data", (c) => hash.update(c));

    let aborted = false;
    stream.on("close", () => (aborted = true));
    stream.on("error", () => (aborted = true));

    let thumbBuffer = await fetchThumbnail(
        track.thumbnail || track.raw?.thumbnails?.[0]?.url,
    );

    // ---- Detect WebP ----
    const isWebp =
    thumbBuffer &&
    thumbBuffer.subarray(0, 4).toString() === "RIFF" &&
    thumbBuffer.subarray(8, 12).toString() === "WEBP";

    if (isWebp) {
        console.log("[THUMBNAIL] WebP detected → converting to JPEG");

        const converted = await convertToJpeg(thumbBuffer);

        if (converted && converted.length > 0) {
            thumbBuffer = converted;
        } else {
            console.log("[THUMBNAIL] Conversion failed → skipping");
            thumbBuffer = null;
        }
    }

    const inputArgs =
        format === StreamType.Opus
            ? ["-f", "opus", "-i", "pipe:0"]
            : ["-f", "s16le", "-ar", "48000", "-ac", "2", "-i", "pipe:0"];

    const args = ["-loglevel", "error", ...inputArgs];

    if (thumbBuffer) {
        args.push(
            "-f", "image2pipe",
            "-i", "pipe:3",
            "-map", "0:a",
            "-map", "1:v",
            "-c:v", "mjpeg",
            "-id3v2_version", "3",
            "-metadata:s:v", "title=Album cover",
            "-metadata:s:v", "comment=Cover (front)",
        );
    }

    if (!thumbBuffer) args.push("-vn");
    args.push(
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "192k",
        "-metadata", `title=${title}`,
        "-metadata", `artist=${artist}`,
        "-metadata", `album=${album}`,
    );


    if (year) 
        args.push("-metadata", `date=${year}`);

    args.push("-f", "mp3", outputPath);

    const ffmpeg = spawn("ffmpeg", args, {
        stdio: ["pipe", "ignore", "inherit", "pipe"],
    });

    ffmpeg.stdin.on("error", () => {});

    (async () => {
        try {
            await pipeline(passthrough, ffmpeg.stdin);
        } catch {}
    })();

    if (thumbBuffer && ffmpeg.stdio[3] && !ffmpeg.stdio[3].destroyed) {
        ffmpeg.stdio[3].write(thumbBuffer);
        ffmpeg.stdio[3].end();
    }

    const code = await new Promise((r) => ffmpeg.on("close", r));

    if (code !== 0) {
        console.log(`[FFMPEG ERROR] ${title} (code ${code})`);
        fs.rmSync(outputPath, { force: true });
        return;
    }

    if (aborted || !fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { force: true });
        return;
    }

    const stats = fs.statSync(outputPath);
    if (stats.size < 100_000) {
        fs.rmSync(outputPath, { force: true });
        return;
    }

    const digest = hash.digest("hex");

    if (knownHashes.has(digest)) {
        fs.rmSync(outputPath, { force: true });
        return;
    }

    knownHashes.add(digest);

    console.log(`[DONE RAW] ${outputPath}`);
}

module.exports = { downloadTrack, ensureDir };