const { SendErrorEmbed } = require("@functions/discordFunctions");
const GuildManager = require("@root/utils/GuildManager.js");

module.exports = {
    name: "ask",
    description: "Ask a question to Gemini",
    usage: {
        required: {
            name: "question",
            description: "The question to ask Gemini",
        },
    },
    category: "fun",
    examples: ["what are you used for?"],
    cooldown: 10000,
    execute: async (logger, client, message, args, found) => {
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
                signal: AbortSignal.timeout(10000),
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
            if (jsonResponse.response) {
                const firstReply = await message.reply(limitString(jsonResponse.response, 2000));
                await handleFollowup(firstReply, requestBody, API_URL);
            } else {
                throw new Error("Unexpected JSON response format");
            }
            

        } catch (err) {
            logger.error(err);

            if (err.name === "TimeoutError") 
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

        async function handleFollowup(firstReply, requestBody, API_URL) {
            const filter = (m) => m.author.id === message.author.id;
            const reply = (await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: [] })).first();
            if (!reply || !reply.reference) return;

            const reference = await message.channel.messages.fetch(reply.reference.messageId);
            if (reference.id !== firstReply.id) return;
            
            const prefix = GuildManager.GetPrefix(message.guild);
            const replyContent = reply.content;
            await reply.channel.sendTyping();

            requestBody.prompt = `
                    Consider the following in your responses:
                    - Be conversational
                    - Add unicode emoji to be more playful in your responses
                    - Write spoilers using spoiler tags.
                    - Format text using markdown.
            
                    Information about your environment:
                     - The server you are in is called: ${message.guild.name}
                     - The channel you are in is called: <#${message.channel.id}> (Or ${message.channel.name} if you only want the raw name)
                     - Discord uses a system to specify channels, which is what you see as what the channel is called, always use that and not the raw name, and always send it directly, whithout formatting, so it gets sent correctly on discord.
                     - Current time: ${(new Date()).toUTCString()}
            
                    When responding, try to condense your response as much as possible.
                    Make sure it is under 2000 characters. 
                    The response will be sent in a discord channel. You can use markdown. Also, make sure to use pings so it integrates better with the Discord server.
                    The user that asked the prompt is named: ${message.author.username} (display name: ${message.author.displayName}) (To ping on discord, type: <@${message.author.id}>).
                    
                    You now are replying to someone's reply that he told you, the original thing the person asked is: ${message.content.replace(`${prefix}ask`), ""}
                    To which you replied: ${firstReply.content}
                    You then need to respond to this user's reply, which was: ${replyContent}
                    You will not be able to respond afterwards`;

            const result = await fetch(API_URL, { 
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                signal: AbortSignal.timeout(10000),
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
                await reply.reply(limitString(jsonResponse.response, 2000));
            else  
                throw new Error("Unexpected JSON response format");
            
        }
    },
};
