const { SendErrorEmbed } = require("@functions/discordFunctions");
const fetch = require("node-fetch");

module.exports = {
    name: "ask",
    description: "Ask a question to PaLM",
    usage: "<prompt>",
    category: "fun",
    examples: ["what are you used for?"],
    cooldown: 5000,
    execute: async (logger, client, message, args) => {
        try {
            const API_URL = process.env.PALM_API_PROXY_URL; // Replace with your API URL
            const apiKey = process.env.PALM_API_KEY; // Replace with your API key
            
            const prompt = args.join(" ");
            if (!prompt) return SendErrorEmbed(message, "Please provide a prompt.", "yellow");

            const queryParams = new URLSearchParams({
                api_key: apiKey,
                prompt: `When responding to the following prompt, try to condense your response. Make sure it is under 2000 characters. The response will be sent in a discord channel. You can use markdown. 
                The user that asked the prompt is named: ${message.author.username} (display name: ${message.author.displayName}).
                The prompt is: ${prompt}`,
                gemini: true,
            });

            const apiUrl = `${API_URL}?${queryParams.toString()}`;

            const result = await fetch(apiUrl);
            if (!result.ok) {
                let errorText;
                try {
                    const errorResponse = await result.json();
                    errorText = JSON.stringify(errorResponse);
                } catch (error) {
                    errorText = await result.text();
                }
                throw new Error(`API request failed with status ${result.status}. Error message: ${errorText}`);
            }

            const jsonResponse = await result.json();
            if (jsonResponse.response) 
                message.reply(limitString(jsonResponse.response, 2000));
            else 
                throw new Error("Unexpected JSON response format");
            

        } catch (err) {
            logger.error(err.stack);

            if (err.name === "AbortError") 
                return SendErrorEmbed(message, "I do not wish to answer that question. (Request timed out)", "yellow");
            else 
                SendErrorEmbed(message, "An error occurred.", "red");
            
        }

        function limitString(string, limit) {
            if (string.length <= limit) 
                return string;
            else 
                return string.substring(0, limit - 3) + "...";
        }
    },
};
