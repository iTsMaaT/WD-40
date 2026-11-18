const fs = require("node:fs");
const path = require("node:path");
const config = require("@utils/config/configUtils");
const logger = require("@utils/log");

const MODELS_DIR = path.join(__dirname, "aiModels");
const PROGRESS_LOG_STEP = 10; // Log every 10%

// One shared download per model file, so startup and the first >ask don't download twice
const pendingDownloads = new Map();

/**
 * Make sure the configured local AI model exists in utils/helpers/aiModels,
 * downloading it from `localAIModelURL` if it is missing.
 * @returns {Promise<string>} The absolute path of the model file
 */
function ensureLocalAIModel() {
    const fileName = path.basename(config.get("defaultLocalAIModel") || "");
    if (!fileName)
        return Promise.reject(new Error("defaultLocalAIModel is not set in the config."));

    const modelPath = path.join(MODELS_DIR, fileName);
    if (fs.existsSync(modelPath)) return Promise.resolve(modelPath);

    if (!pendingDownloads.has(modelPath)) {
        const download = downloadModel(fileName, modelPath)
            .finally(() => pendingDownloads.delete(modelPath));
        pendingDownloads.set(modelPath, download);
    }

    return pendingDownloads.get(modelPath);
}

/**
 * @param {string} fileName
 * @param {string} modelPath
 * @returns {Promise<string>}
 */
async function downloadModel(fileName, modelPath) {
    const modelUri = config.get("localAIModelURL");
    if (!modelUri) {
        throw new Error(`Local AI model "${fileName}" was not found in ${MODELS_DIR} and no localAIModelURL is configured. ` +
            "Set localAIModelURL in the config, or place the .gguf file there yourself.");
    }

    fs.mkdirSync(MODELS_DIR, { recursive: true });
    logger.info(`Local AI model "${fileName}" not found, downloading it from ${modelUri}...`);

    const { createModelDownloader } = await import("node-llama-cpp");
    let lastLoggedStep = -1;
    const downloader = await createModelDownloader({
        modelUri,
        dirPath: MODELS_DIR,
        fileName,
        showCliProgress: false,
        onProgress: ({ totalSize, downloadedSize }) => {
            if (!totalSize) return;
            const step = Math.floor((downloadedSize / totalSize) * 100 / PROGRESS_LOG_STEP);
            if (step === lastLoggedStep) return;
            lastLoggedStep = step;
            logger.info(`Downloading local AI model: ${step * PROGRESS_LOG_STEP}% (${formatMB(downloadedSize)} / ${formatMB(totalSize)} MB)`);
        },
    });

    const downloadedPath = await downloader.download();
    logger.info(`Local AI model downloaded to ${downloadedPath}`);
    return downloadedPath;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(1);
}

module.exports = { ensureLocalAIModel };
