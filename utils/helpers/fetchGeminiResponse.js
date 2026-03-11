const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require("@google/genai");
const config = require("@utils/config/configUtils");

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
 * Fetches a response from the Gemini API.
 * 
 * @param {string} prompt - The prompt to generate a response from.
 * @param {string} apiKey - The API key to use for the request.
 * @param {string} model - The model to use for the request.
 * @param {Array} safetySettings - The safety settings to use for the request.
 * 
 * @returns {Promise<string>} The response from the Gemini API.
 */
async function fetchGeminiResponse(
    prompt,
    apiKey, 
    model = config.get("defaultGeminiModel"), 
    safetySettings = DEFAULT_SAFETY_SETTINGS, 
    temperature = 2,
) {
    if (!prompt) 
        throw new Error("Prompt is required.");
    
    if (!apiKey) 
        throw new Error("API key is required.");
    
    try {
        const genAI = new GoogleGenAI({ apiKey });

        const response = await genAI.models.generateContent({ 
            contents: prompt,
            model, 
            config: {
                safetySettings,
                temperature,
            },
        });

        return response.text || "Sorry I don't feel comfortable answering that question.";
    } catch (error) {
        if (error.response && error.response.status === 401) 
            throw new Error("API key is invalid.", { cause: error });
        else 
            throw new Error(`An error occurred: ${error.message}`, { cause: error });
    }
}

module.exports = { fetchGeminiResponse };