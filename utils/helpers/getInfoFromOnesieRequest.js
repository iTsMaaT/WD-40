const crypto = require("crypto");
const { UniversalCache, Constants, YT, Innertube, Utils } = require("youtubei.js");
const { base64ToU8, PART, Protos, QUALITY,  GoogleVideo } = require("googlevideo");
const { PassThrough, Readable } = require("stream");
const { JSDOM } = require("jsdom");
const { BG, BgConfig } = require("bgutils-js");

/**
 * Gets a Youtube video info from a Onesie request
 * 
 * @param {string} youtubeUrl 
 * @param {Innertube} innertubeClient 
 * @param {string} potoken 
 * @returns 
 */
async function getVideoInfoFromOnesieRequest(youtubeUrl, innertubeClient, potoken) {

    /**
     * Encrypts a request
     * 
     * @param {string} clientKey 
     * @param {Buffer} data 
     * @returns 
     */
    async function encryptRequest(clientKey, data) {
        if (clientKey.length !== 32) throw new Error("Invalid client key length");
    
        const aesKeyData = clientKey.slice(0, 16);
        const hmacKeyData = clientKey.slice(16, 32);
        const iv = crypto.randomBytes(16);
    
        const cipher = crypto.createCipheriv("aes-128-ctr", aesKeyData, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    
        const hmac = crypto.createHmac("sha256", hmacKeyData)
            .update(Buffer.concat([encrypted, iv]))
            .digest();
    
        return { encrypted, hmac, iv };
    };

    async function decryptResponse(iv, hmac, data, clientKey) {
        const aesKeyData = clientKey.slice(0, 16);
        const hmacKeyData = clientKey.slice(16, 32);

        // Verify HMAC
        const expectedHmac = crypto.createHmac("sha256", hmacKeyData)
            .update(Buffer.concat([data, iv]))
            .digest();
        if (!expectedHmac.equals(hmac)) throw new Error("HMAC mismatch");

        // Decrypt
        const decipher = crypto.createDecipheriv("aes-128-ctr", aesKeyData, iv);
        return Buffer.concat([decipher.update(data), decipher.final()]);
    }

    /**
     * Gets the YouTube TV client config
     * 
     * @returns 
     */
    async function getYouTubeTVClientConfig() {
        const tvConfigResponse = await fetch("https://www.youtube.com/tv_config?action_get_config=true&client=lb4&theme=cl", {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version",
            },
        });
      
        const tvConfig = await tvConfigResponse.text();
        if (!tvConfig.startsWith(")]}")) throw new Error("Invalid response from YouTube TV config endpoint.");
      
        const tvConfigJson = JSON.parse(tvConfig.slice(4));
        const webPlayerContextConfig = tvConfigJson.webPlayerContextConfig.WEB_PLAYER_CONTEXT_CONFIG_ID_LIVING_ROOM_WATCH;
        const onesieHotConfig = webPlayerContextConfig.onesieHotConfig;
      
        return {
            clientKeyData: base64ToU8(onesieHotConfig.clientKey),
            encryptedClientKey: base64ToU8(onesieHotConfig.encryptedClientKey),
            onesieUstreamerConfig: base64ToU8(onesieHotConfig.onesieUstreamerConfig),
            baseUrl: onesieHotConfig.baseUrl,
        };
    }

    /**
     * Prepares a Onesie request
     * 
     * @param {object} videoId 
     * @param {string} poToken 
     * @param {object} clientConfig 
     * @param {Innertube} innertube 
     * @returns 
     */
    async function prepareOnesieRequest({ videoId, poToken, clientConfig, innertube }) {
        const { clientKeyData, encryptedClientKey, onesieUstreamerConfig } = clientConfig;
        const clonedInnerTubeContext = JSON.parse(JSON.stringify(innertube.session.context));

        // Use TV client for better compatibility
        clonedInnerTubeContext.client.clientName = Constants.CLIENTS.TV.NAME;
        clonedInnerTubeContext.client.clientVersion = Constants.CLIENTS.TV.VERSION;

        const params = {
            playbackContext: {
                contentPlaybackContext: {
                    vis: 0,
                    splay: false,
                    lactMilliseconds: "-1",
                    signatureTimestamp: innertube.session.player?.sts,
                },
            },
            videoId,
        };
    
        if (poToken) {
            if (typeof poToken !== "string" || !/^[A-Za-z0-9+/=]+$/.test(poToken)) 
                throw new Error("Invalid poToken format");
            
            params.serviceIntegrityDimensions = { poToken };
        }
    
        const playerRequestJson = { context: clonedInnerTubeContext, ...params };
    
        const headers = [
            { name: "Content-Type", value: "application/json" },
            { name: "User-Agent", value: innertube.session.context.client.userAgent },
            { name: "X-Goog-Visitor-Id", value: innertube.session.context.client.visitorData },
        ];
    
        const onesieRequest = Protos.OnesiePlayerRequest.encode({
            url: "https://youtubei.googleapis.com/youtubei/v1/player?key=AIzaSyDCU8hByM-4DrUqRUYnGn-3llEO78bcxq8",
            headers,
            body: JSON.stringify(playerRequestJson),
            proxiedByTrustedBandaid: true,
            skipResponseEncryption: false, // <--- changed
        }).finish();

        const { encrypted, hmac, iv } = await encryptRequest(clientKeyData, onesieRequest);

        const body = Protos.OnesieRequest.encode({
            urls: [],
            playerRequest: {
                encryptedClientKey,
                encryptedOnesiePlayerRequest: encrypted,
                enableCompression: true, // <--- changed
                hmac: hmac,
                iv: iv,
                TQ: true,
                serializeResponseAsJson: true,
            },
            clientAbrState: {
                timeSinceLastManualFormatSelectionMs: 0,
                lastManualDirection: 0,
                lastManualSelectedResolution: QUALITY.HD720,
                stickyResolution: QUALITY.HD720,
                playerTimeMs: 0,
                visibility: 0,
            },
            streamerContext: {
                field5: [],
                field6: [],
                poToken: poToken ? base64ToU8(poToken) : undefined,
                playbackCookie: undefined,
                clientInfo: {
                    clientName: Constants.CLIENT_NAME_IDS.WEB,
                    clientVersion: clonedInnerTubeContext.client.clientVersion,
                },
            },
            bufferedRanges: [],
            onesieUstreamerConfig,
        }).finish();

        const videoIdBytes = base64ToU8(videoId);
    
        const encodedVideoIdChars = [];
        for (const byte of videoIdBytes) 
            encodedVideoIdChars.push(byte.toString(16).padStart(2, "0"));
        
    
        const encodedVideoId = encodedVideoIdChars.join("");
    
        return { body, encodedVideoId };
    }

    const videoId = new URL(youtubeUrl).searchParams.get("v");
    if (!videoId) throw new Error("Invalid YouTube URL");

    const innertube = innertubeClient || await Innertube.create({ cache: new UniversalCache(true) });
    const clientConfig = await getYouTubeTVClientConfig();
    const onesieRequest = await prepareOnesieRequest({ videoId, clientConfig, innertube, poToken: potoken });

    const redirectorResponse = await fetch(`https://redirector.googlevideo.com/initplayback?source=youtube&itag=0&pvi=0&pai=0&owc=yes&cmo:sensitive_content=yes&alr=yes&id=${Math.round(Math.random() * 1E5)}`, { method: "GET" });
    const redirectorResponseUrl = await redirectorResponse.text();

    if (!redirectorResponseUrl.startsWith("https://"))
        throw new Error("Invalid redirector response");

    let url = `${redirectorResponseUrl.split("/initplayback")[0]}${clientConfig.baseUrl}`;

    const queryParams = [];
    queryParams.push(`id=${onesieRequest.encodedVideoId}`);
    queryParams.push("opr=1");
    queryParams.push("por=1");
    queryParams.push("rn=1");
    queryParams.push("cmo:sensitive_content=yes");

    url += `&${queryParams.join("&")}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "accept": "*/*",
            "content-type": "application/octet-stream", // <--- changed
        },
        referrer: "https://www.youtube.com/",
        body: onesieRequest.body,
    });

    const arrayBuffer = await response.arrayBuffer();
    const googUmp = new GoogleVideo.UMP(new GoogleVideo.ChunkedDataBuffer([new Uint8Array(arrayBuffer)]));

    const onesie = [];

    googUmp.parse((part) => {
        const data = part.data.chunks[0];
        switch (part.type) {
            case PART.SABR_ERROR:
                console.log("[SABR_ERROR]:", Protos.SabrError.decode(data));
                break;
            case PART.ONESIE_HEADER:
                onesie.push(Protos.OnesieHeader.decode(data));
                break;
            case PART.ONESIE_DATA:
                onesie[onesie.length - 1].data = data;
                break;
            default:
                break;
        }
    });

    const onesiePlayerResponse = onesie.find((header) => header.type === Protos.OnesieHeaderType.PLAYER_RESPONSE); // <--- changed

    if (onesiePlayerResponse) {
        let responseData = onesiePlayerResponse.data;

        // Decrypt first if needed
        if (
            onesiePlayerResponse.cryptoParams &&
        onesiePlayerResponse.cryptoParams.iv &&
        onesiePlayerResponse.cryptoParams.hmac
        ) {
            responseData = await decryptResponse(
                onesiePlayerResponse.cryptoParams.iv,
                onesiePlayerResponse.cryptoParams.hmac,
                responseData,
                clientConfig.clientKeyData,
            );
        }

        // Then decompress if needed
        if (
            onesiePlayerResponse.cryptoParams &&
        onesiePlayerResponse.cryptoParams.compressionType === 1
        ) {
            const zlib = require("zlib");
            if (responseData[0] === 0x1f && responseData[1] === 0x8b) 
                responseData = zlib.gunzipSync(responseData);
            else 
                console.warn("compressionType is 1 but data is not GZIP, skipping decompression");
        
        }

        const playerResponse = Protos.OnesiePlayerResponse.decode(responseData);

        if (playerResponse.onesieProxyStatus !== Protos.OnesieProxyStatus.ONESIE_PROXY_STATUS_OK) {
            console.error("Onesie proxy status:", playerResponse.onesieProxyStatus);
            console.error("PlayerResponse body (raw):", playerResponse.body);
            throw new Error("Onesie proxy status not OK");
        }

        if (playerResponse.httpStatus !== 200)
            throw new Error("Http status not OK");

        const videoInfo = new YT.VideoInfo([{
            success: true,
            status_code: 200,
            data: JSON.parse(new TextDecoder().decode(playerResponse.body)),
        }], innertube.actions, "");

        return videoInfo;
    }

    throw new Error("Player response not found");
}

/**
 * Creates a readable from a web stream
 * 
 * @param {ReadableStream} readStream 
 * @param {number} highWaterMark 
 * @returns 
 */
function createReadableFromWeb(
    readStream,
    highWaterMark = 1024 * 512,
) {
    const readable = new PassThrough({
        highWaterMark,
    });
  
    // run out of order
    (async () => {
        let shouldListen = true;
  
        for await (const chunk of Utils.streamToIterable(readStream)) {
            if (readable.destroyed) continue;
  
            const shouldWrite = readable.write(chunk);
  
            if (!shouldWrite && shouldListen) {
                shouldListen = false;
                await new Promise((res) => {
                    readable.once("drain", () => {
                        shouldListen = true;
                        res();
                    });
                });
            }
        }
    })();
  
    readable._destroy = () => {
        readStream.cancel();
        readable.destroyed = true;
        readable.destroy();
    };
  
    return readable;
}

/**
 * Gets a PoToken from an Innertube instance
 * 
 * @param {Innertube} innertube 
 * @param {object} init 
 * @returns 
 */
async function getPoToken(innertube, init) {
    const requestKey = "O43z0dpjhgX20SCx4KAo";
    const visitorData = innertube.session.context.client.visitorData;
  
    if (!visitorData) throw new Error("Could not get visitor data");
  
    const bgConfig = {
        fetch: (input) =>
            fetch(input, init),
        globalObj: globalThis,
        identifier: visitorData,
        requestKey,
    };
  
    const dom = new JSDOM();
    Object.assign(globalThis, {
        window: dom.window,
        document: dom.window.document,
    });
  
    const bgChallenge = await BG.Challenge.create(bgConfig);
  
    if (!bgChallenge) throw new Error("Could not get challenge");
  
    const interpreterJavascript =
      bgChallenge.interpreterJavascript
          .privateDoNotAccessOrElseSafeScriptWrappedValue;
  
    if (interpreterJavascript) 
        new Function(interpreterJavascript)();
    else throw new Error("Could not load VM");
  
    const poTokenResult = {
        ...(await BG.PoToken.generate({
            program: bgChallenge.program,
            globalName: bgChallenge.globalName,
            bgConfig,
        })),
        visitorData,
    };

    try {
        globalThis.document.close();
    } catch {
    // no-op
    }
    // Clean up after jsdom is ran
    delete globalThis.window;
    delete globalThis.document;
  
    return poTokenResult;
}

module.exports = { getVideoInfoFromOnesieRequest, createReadableFromWeb, getPoToken };
