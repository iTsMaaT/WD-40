const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

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
async function fetchGeminiResponse(prompt, apiKey, model = "gemini-pro", safetySettings = null) {
    try {
        if (!safetySettings) {
            safetySettings = [
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
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({ model, safetySettings });

        const result = await modelInstance.generateContent(prompt);
        return result.response?.text() || "Sorry I don't feel comfortable answering that question.";

    } catch (error) {
        if (error.response && error.response.status === 401) 
            throw new Error("API key is invalid.");
        else 
            throw new Error(`An error occurred: ${error.stack}`);
    }
}

module.exports = { fetchGeminiResponse };