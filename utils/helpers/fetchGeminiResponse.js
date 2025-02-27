const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const config = require("@utils/config/configUtils");

const DEFAULT_SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
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
async function fetchGeminiResponse(prompt, apiKey, model = config.get("defaultGeminiModel"), safetySettings = DEFAULT_SAFETY_SETTINGS) {
    if (!prompt) 
        throw new Error("Prompt is required.");
    
    if (!apiKey) 
        throw new Error("API key is required.");
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({ model, safetySettings });

        const result = await modelInstance.generateContent(prompt);
        return result.response?.text() || "Sorry I don't feel comfortable answering that question.";
    } catch (error) {
        if (error.response && error.response.status === 401) 
            throw new Error("API key is invalid.");
        else 
            throw new Error(`An error occurred: ${error.message}`);
    }
}

module.exports = { fetchGeminiResponse };