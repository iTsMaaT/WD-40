const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "ask",
    description: "Ask a question to PaLM",
    usage: "<prompt>",
    category: "fun",
    examples: ["what are you used for?"],
    cooldown: 10000,
    execute: async (logger, client, message, args) => {
        try {
            const API_URL = process.env.PALM_API_PROXY_URL; // Replace with your API URL
            const apiKey = process.env.PALM_API_KEY; // Replace with your API key
            
            const prompt = args.join(" ");
            if (!prompt) return SendErrorEmbed(message, "Please provide a prompt.", "yellow");
            const owner = await message.guild.fetchOwner();
            const requestBody = {
                api_key: apiKey,
                prompt: `
                    Consider the following in your responses:
                    - Be conversational
                    - Add unicode emoji to be more playful in your responses
                    - Write spoilers using spoiler tags.
                    - Format text using markdown.
            
                    Information about your environment:
                     - The server you are in is called: ${message.guild.name}
                     - The server is owned by: ${owner.displayName} (To ping on discord, type: <@${owner.id}>)
                     - The channel you are in is called: <#${message.channel.id}> (Or ${message.channel.name} if you only want the raw name)
                     - Discord uses a system to specify channels, which is what you see as what the channel is called, always use that and not the raw name, and always send it directly, whithout formatting, so it gets sent correctly on discord.
                     - Current time: ${(new Date()).toUTCString()}
            
                    You are not a personal assistant and cannot complete tasks for people. You only have access to a limited number of text chats in this channel. You cannot access any other information on Discord. You can't see images or avatars. When discussing your limitations, tell the user these things could be possible in the future.
                    When responding to the following prompt, try to condense your response as much as possible.
                    Make sure it is under 2000 characters. 
                    The response will be sent in a discord channel. You can use markdown. Also, make sure to use pings so it integrates better with the Discord server.
                    The user that asked the prompt is named: ${message.author.username} (display name: ${message.author.displayName}) (To ping on discord, type: <@${message.author.id}>).
                    The prompt is: ${prompt}`,
                gemini: true,
            };
            
            const result = await fetch(API_URL, { 
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
            });
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
