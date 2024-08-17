const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@root/utils/GuildManager.js");
const { fetchGeminiResponse } = require("@utils/helpers/fetchGeminiResponse");

module.exports = {
    name: "ask",
    description: "Ask a question to Gemini",
    usage: {
        required: {
            "question": "The question to ask Gemini",
        },
    },
    category: "fun",
    examples: ["what are you used for?"],
    cooldown: 10000,
    execute: async (logger, client, message, args, optionalArgs) => {
        try {
            const apiKey = process.env.GEMINI_API_KEY; // Replace with your API key
            
            const prompt = args.join(" ");
            if (!prompt) return await message.reply({ embeds: [embedGenerator.warning("Please provide a prompt.")] });

            const owner = await message.guild.fetchOwner();
            const environmentInfo = {
                guildName: message.guild.name,
                ownerDisplayName: owner.displayName,
                ownerId: owner.id,
                channelId: message.channel.id,
                channelName: message.channel.name,
                currentTime: (new Date()).toUTCString(),
                authorUsername: message.author.username,
                authorDisplayName: message.author.displayName,
                authorId: message.author.id,
            };

            const fullPrompt = `
                Consider the following in your responses:
                - Be conversational
                - Add unicode emoji to be more playful in your responses
                - Write spoilers using spoiler tags.
                - Format text using markdown.
        
                Information about your environment:
                - The server you are in is called: ${environmentInfo.guildName}
                - The server is owned by: ${environmentInfo.ownerDisplayName} (To ping on discord, type: <@${environmentInfo.ownerId}>)
                - The channel you are in is called: <#${environmentInfo.channelId}> (Or ${environmentInfo.channelName} if you only want the raw name)
                - Discord uses a system to specify channels, which is what you see as what the channel is called, always use that and not the raw name, and always send it directly, without formatting, so it gets sent correctly on discord.
                - Current time (UTC): ${environmentInfo.currentTime}
        
                You are not a personal assistant and cannot complete tasks for people. You only have access to a limited number of text chats in this channel. You cannot access any other information on Discord. You can't see images or avatars. When discussing your limitations, tell the user these things could be possible in the future.
                When responding to the following prompt, try to condense your response as much as possible.
                Make sure it is under 2000 characters. 
                The response will be sent in a discord channel. You can use markdown. Also, make sure to use pings so it integrates better with the Discord server.
                The user that asked the prompt is named: ${environmentInfo.authorUsername} (display name: ${environmentInfo.authorDisplayName}) (To ping on discord, type: <@${environmentInfo.authorId}>).
                The prompt is: ${prompt}`;

            const response = await fetchGeminiResponse(fullPrompt, apiKey);

            if (response) {
                const firstReply = await message.reply(limitString(response, 2000));
                await handleFollowup(firstReply, environmentInfo, apiKey);
            } else {
                throw new Error("Unexpected response from the API.");
            }

        } catch (err) {
            if (err.message.includes("API key is invalid")) {
                logger.error(err.message);
                return await message.reply({ embeds: [embedGenerator.error("Invalid API key. Please check your configuration.")] });
            } else {
                logger.error(err);
                return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
            }
        }

        function limitString(string, limit) {
            if (string.length <= limit) 
                return string;
            else 
                return string.substring(0, limit - 3) + "...";
        }

        async function handleFollowup(firstReply, environmentInfo, apiKey) {
            const filter = (m) => m.author.id === message.author.id;
            const reply = (await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: [] })).first();
            if (!reply || !reply.reference) return;

            const reference = await message.channel.messages.fetch(reply.reference.messageId);
            if (reference.id !== firstReply.id) return;

            const prefix = GuildManager.GetPrefix(message.guild);
            const replyContent = reply.content;
            await reply.channel.sendTyping();

            const newPrompt = `
                You now are replying to someone's reply that he told you, the original thing the person asked is: ${message.content.replace(`${prefix}ask`, "")}
                To which you replied: ${firstReply.content}
                You then need to respond to this user's reply, which was: ${replyContent}
                You will not be able to respond afterwards`;

            const response = await fetchGeminiResponse(newPrompt, apiKey);

            if (response) 
                await reply.reply(limitString(response, 2000));
            else 
                throw new Error("Unexpected response from the API.");
            
        }
    },
};
