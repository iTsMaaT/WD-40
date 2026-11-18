import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import config from "#utils/config/configUtils.js";
import { askLocalAI } from "#utils/helpers/askLocalAI.js";

const DEFAULT_SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    }, {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    }, {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    }, {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

/**
 * Fetches a response from the configured local or external AI provider.
 *
 * @param {string} prompt - The prompt to generate a response from.
 * @param {string} apiKey - The API key to use for the external provider.
 * @param {string} model - The external model to use for the request.
 * @param {Array} safetySettings - The safety settings for the external request.
 * @param {number} temperature - The external model's temperature.
 * @param {"local"|"external"} providerOverride - Optional provider for this request.
 * @param {string} systemPrompt - Optional system instructions for this request.
 * @param {{role: "user"|"assistant", content: string}[]} history - Optional previous conversation turns.
 * @returns {Promise<string>}
 */
async function fetchAIResponse(
    prompt,
    apiKey,
    model = config.get("defaultGeminiModel"),
    safetySettings = DEFAULT_SAFETY_SETTINGS,
    temperature = 2,
    providerOverride = config.get("aiModelProvider"),
    systemPrompt,
    history = [],
) {
    if (typeof prompt !== "string" || !prompt.trim())
        throw new Error("Prompt is required.");

    const provider = providerOverride;
    if (provider === "local")
        return askLocalAI(prompt, systemPrompt, history);

    if (provider !== "external")
        throw new Error(`Unsupported AI model provider: "${provider}". Use "local" or "external".`);

    if (!apiKey)
        throw new Error("API key is required.");

    try {
        const genAI = new GoogleGenAI({ apiKey });
        const response = await genAI.models.generateContent({
            contents: [
                ...history.map((turn) => ({
                    role: turn.role === "assistant" ? "model" : "user",
                    parts: [{ text: turn.content }],
                })),
                { role: "user", parts: [{ text: prompt }] },
            ],
            model,
            config: {
                safetySettings,
                temperature,
                ...(systemPrompt && { systemInstruction: systemPrompt }),
            },
        });

        return response.text || "Sorry I don't feel comfortable answering that question.";
    } catch (error) {
        if (error.response && error.response.status === 401)
            throw new Error("API key is invalid.", { cause: error });

        throw new Error(`An error occurred: ${error.message}`, { cause: error });
    }
}

export { fetchAIResponse };
