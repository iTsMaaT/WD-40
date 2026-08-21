const { BG, GOOG_API_KEY, USER_AGENT, buildURL } = require("bgutils-js");
const { JSDOM } = require("jsdom");
const { createCanvas, ImageData: CanvasImageData } = require("@napi-rs/canvas");

const TV_USER_AGENT = "Mozilla/5.0 (Linux arm64-v8a; Android 10) Cobalt/25.lts.30.1034958-gold (unlike Gecko) v8/8.8.278.17-jit gles Starboard/15, Sony_ATV_sdm845_13140765/52.1.C.0.268 (KDDI, SOV38) com.google.android.youtube.tv/5.30.301";

let domWindow;
let initializationPromise = null;
let botguardClient;
let webPoMinter;
let activeScriptId = null;
let CanvasPatched = false;

/**
 * Patches the jsdom canvas implementation so YouTube's BotGuard scripts can
 * create and serialize 2D canvases in this Node.js environment.
 *
 * @param {Window} window
 * @returns {void}
 */
function patchCanvasSupport(window) {
    if (CanvasPatched) return;

    const HTMLCanvasElement = window.HTMLCanvasElement;
    if (!HTMLCanvasElement) return;

    Object.defineProperty(HTMLCanvasElement.prototype, "_napiCanvasState", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: null,
    });

    HTMLCanvasElement.prototype.getContext = function(type, options) {
        if (type !== "2d") return null;

        const width = Number.isFinite(this.width) && this.width > 0 ? this.width : 300;
        const height = Number.isFinite(this.height) && this.height > 0 ? this.height : 150;

        const state = this._napiCanvasState || {};

        if (!state.canvas) {
            state.canvas = createCanvas(width, height);
        } else if (state.canvas.width !== width || state.canvas.height !== height) {
            state.canvas.width = width;
            state.canvas.height = height;
        }

        state.context = state.canvas.getContext("2d", options);
        this._napiCanvasState = state;
        return state.context;
    };

    HTMLCanvasElement.prototype.toDataURL = function(...args) {
        if (!this._napiCanvasState?.canvas) {
            const width = Number.isFinite(this.width) && this.width > 0 ? this.width : 300;
            const height = Number.isFinite(this.height) && this.height > 0 ? this.height : 150;
            this._napiCanvasState = {
                canvas: createCanvas(width, height),
                context: null,
            };
        }

        return this._napiCanvasState.canvas.toDataURL(...args);
    };

    if (!window.ImageData) window.ImageData = CanvasImageData;

    if (!Reflect.has(globalThis, "ImageData")) {
        Object.defineProperty(globalThis, "ImageData", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: CanvasImageData,
        });
    }

    CanvasPatched = true;
}

/**
 * Creates and caches the DOM globals required by the BotGuard runtime.
 *
 * @param {string} userAgent
 * @returns {Window}
 */
function ensureDomEnvironment(userAgent) {
    if (domWindow) return domWindow;

    const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
        url: "https://www.youtube.com/",
        referrer: "https://www.youtube.com/",
        userAgent,
    });

    domWindow = dom.window;

    const globalAssignments = {
        window: domWindow,
        document: domWindow.document,
        location: domWindow.location,
        origin: domWindow.origin,
        navigator: domWindow.navigator,
        HTMLElement: domWindow.HTMLElement,
        atob: domWindow.atob,
        btoa: domWindow.btoa,
        crypto: domWindow.crypto,
        performance: domWindow.performance,
    };

    for (const [key, value] of Object.entries(globalAssignments)) {
        if (!Reflect.has(globalThis, key)) {
            Object.defineProperty(globalThis, key, {
                configurable: true,
                enumerable: false,
                writable: true,
                value,
            });
        }
    }

    if (!Reflect.has(globalThis, "self")) {
        Object.defineProperty(globalThis, "self", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: globalThis,
        });
    }

    patchCanvasSupport(domWindow);

    return domWindow;
}

/**
 * Clears the cached BotGuard client state and removes the injected script.
 *
 * @returns {void}
 */
function resetBotGuardState() {
    if (botguardClient?.shutdown) {
        try {
            botguardClient.shutdown();
        } finally {
            // No actions needed
        }
    }

    if (activeScriptId && domWindow?.document) domWindow.document.getElementById(activeScriptId)?.remove();

    botguardClient = undefined;
    webPoMinter = undefined;
    activeScriptId = null;
    initializationPromise = null;
}

/**
 * Initializes or refreshes the BotGuard WebPo minter for an Innertube session.
 *
 * @param {import("youtubei.js").default} innertube
 * @param {{ forceRefresh?: boolean }} [options]
 * @returns {Promise<WebMinter>}
 */
async function initializeBotGuard(innertube, { forceRefresh } = {}) {
    if (forceRefresh) resetBotGuardState();
    if (webPoMinter) return webPoMinter;
    if (initializationPromise) return await initializationPromise;

    const userAgent = innertube.session.context.client.userAgent || USER_AGENT;
    ensureDomEnvironment(userAgent);

    initializationPromise = (async () => {
        // YouTube now binds the initial attestation challenge to yt.config_.EVENT_ID for WEB/MWEB
        // TV client challenges aren't part of that experiment (yet)
        const tvConfigResponse = await fetch("https://www.youtube.com/tv_config?action_get_config=true&client=lb4&theme=cl", {
            headers: {
                "accept": "*/*",
                "user-agent": TV_USER_AGENT,
            },
            referrer: "https://www.youtube.com/tv",
        });

        const tvConfigText = await tvConfigResponse.text();
        if (!tvConfigText.startsWith(")]}'")) throw new Error("Invalid response from YouTube TV config endpoint.");

        const tvConfigJson = JSON.parse(tvConfigText.slice(4));
        const challenge = JSON.parse(tvConfigJson.challengeParams.R)?.bgChallenge;

        if (!challenge) throw new Error("Failed to retrieve BotGuard challenge.");

        const interpreterUrl = challenge.interpreterUrl?.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue;

        if (!interpreterUrl) throw new Error("BotGuard challenge did not provide an interpreter URL.");

        if (!domWindow.document.getElementById(interpreterUrl)) {
            const interpreterResponse = await fetch(`https:${interpreterUrl}`, {
                headers: {
                    "user-agent": userAgent,
                },
            });

            const interpreterJavascript = await interpreterResponse.text();

            if (!interpreterJavascript) throw new Error("Failed to download BotGuard interpreter script.");

            const script = domWindow.document.createElement("script");
            script.type = "text/javascript";
            script.id = interpreterUrl;
            script.textContent = interpreterJavascript;
            domWindow.document.head.appendChild(script);
            activeScriptId = script.id;

            const executeInterpreter = new domWindow.Function(interpreterJavascript);
            executeInterpreter.call(domWindow);
        }

        botguardClient = await BG.BotGuardClient.create({
            program: challenge.program,
            globalName: challenge.globalName,
            globalObj: globalThis,
        });

        const webPoSignalOutput = [];
        const botguardSnapshot = await botguardClient.snapshot({ webPoSignalOutput });

        const integrityResponse = await fetch(buildURL("GenerateIT", true), {
            method: "POST",
            headers: {
                "content-type": "application/json+protobuf",
                "x-goog-api-key": GOOG_API_KEY,
                "x-user-agent": "grpc-web-javascript/0.1",
                "user-agent": userAgent,
            },
            body: JSON.stringify([ tvConfigJson.challengeRequestKey, botguardSnapshot ]),
        });

        const [integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken] = await integrityResponse.json();

        if (typeof integrityToken !== "string") throw new Error("BotGuard integrity token generation failed.");

        webPoMinter = await BG.WebPoMinter.create({ integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken }, webPoSignalOutput);

        return webPoMinter;
    })()
        .catch((error) => {
            resetBotGuardState();
            throw error;
        })
        .finally(() => {
            initializationPromise = null;
        });

    return await initializationPromise;
}

/**
 * Ensures a content binding exists before generating or minting a token.
 *
 * @param {string | undefined | null} binding
 * @returns {string}
 */
function requireBinding(binding) {
    if (!binding) throw new Error("Content binding is required to mint a WebPo Token");
    return binding;
}

/**
 * @typedef {Object} WebMinter
 * @property {(binding: string | undefined | null) => string} generatePlaceholder
 * @property {(binding: string | undefined | null) => Promise<string>} mint
 */

/**
 * @param {import("youtubei.js").default} innertube
 * @param {{ forceRefresh?: boolean }} [options]
 * @returns {Promise<WebMinter>}
 */
async function getWebPoMinter(innertube, options = {}) {
    const minter = await initializeBotGuard(innertube, options);

    return {
        generatePlaceholder(binding) {
            return BG.PoToken.generateColdStartToken(requireBinding(binding));
        },
        async mint(binding) {
            return await minter.mintAsWebsafeString(requireBinding(binding));
        },
    };
}

function invalidateWebPoMinter() {
    resetBotGuardState();
}

module.exports = {
    getWebPoMinter,
    invalidateWebPoMinter,
};