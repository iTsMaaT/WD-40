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
    const album = sanitize(track.metadata?.album || "Unknown Album");

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

    const thumbBuffer = await fetchThumbnail(
        track.thumbnail || track.raw?.thumbnails?.[0]?.url,
    );

    const args = ["-loglevel", "error", "-i", "pipe:0"];

    if (thumbBuffer) args.push("-i", "pipe:3");

    args.push(
        "-vn",
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "192k",
        "-metadata", `title=${title}`,
        "-metadata", `artist=${artist}`,
        "-metadata", `album=${album}`,
    );

    if (thumbBuffer) 
        args.push("-map", "0:a", "-map", "1:v", "-id3v2_version", "3");
    

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
    const album = sanitize(track.metadata?.album || "Unknown Album");

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

    const thumbBuffer = await fetchThumbnail(
        track.thumbnail || track.raw?.thumbnails?.[0]?.url,
    );

    const inputArgs =
        format === StreamType.Opus
            ? ["-f", "opus", "-i", "pipe:0"]
            : ["-f", "s16le", "-ar", "48000", "-ac", "2", "-i", "pipe:0"];

    const args = ["-loglevel", "error", ...inputArgs];

    if (thumbBuffer) args.push("-i", "pipe:3");

    args.push("-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k");

    if (thumbBuffer) 
        args.push("-map", "0:a", "-map", "1:v", "-id3v2_version", "3");
    

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