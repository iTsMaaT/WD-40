const embedGenerator = require("@utils/helpers/embedGenerator");
const { fetchAIResponse } = require("@utils/helpers/fetchAIResponse");

const MAX_REPLIES = 5;
const MAX_HISTORY_TURNS = 6;
const ASK_SYSTEM_PROMPT = `Answer the user's latest message directly and briefly, in plain text.
You are a Discord bot. You can answer questions, explain things, write short texts and make lists or tier lists.
If the user asks what you can do or how you can help, tell them those things.
For a list request, output only the list.
Keep replies under 2000 characters.
Avoid assisting with actionable real-world harm or crime.`;

module.exports = {
    name: "ask",
    description: "Ask a question to the configured AI model",
    usage: {
        required: {
            "question": "The question to ask the AI",
        },
    },
    category: "fun",
    examples: ["what are you used for?"],
    cooldown: 20000,
    cooldownGroup: "AI",
    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    execute: async (logger, client, message, args, flags) => {
        try {
            const prompt = args.join(" ").trim();
            if (!prompt)
                return await message.reply({ embeds: [embedGenerator.warning("Please provide a prompt.")] });

            const response = await fetchAIResponse(
                prompt,
                process.env.GEMINI_API_KEY,
                undefined,
                undefined,
                undefined,
                undefined,
                ASK_SYSTEM_PROMPT,
            );

            if (!response)
                throw new Error("Unexpected response from the API.");

            const firstReply = await message.reply(limitString(response, 2000));
            await handleFollowup(firstReply, [
                { role: "user", content: prompt },
                { role: "assistant", content: response },
            ]);
        } catch (err) {
            logger.error(err);
            if (err.message.includes("API key is invalid"))
                return await message.reply({ embeds: [embedGenerator.error("Invalid API key. Please check your configuration.")] });
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }

        function limitString(string, limit) {
            if (string.length <= limit)
                return string;
            return string.substring(0, limit - 3) + "...";
        }

        async function handleFollowup(firstReply, history) {
            let replyCount = 1;
            let currentReply = firstReply;

            while (replyCount < MAX_REPLIES) {
                const filter = (reply) => reply.author.id === message.author.id;
                const reply = (await message.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 30000,
                    errors: [],
                })).first();
                if (!reply || !reply.reference) return;

                const reference = await message.channel.messages.fetch(reply.reference.messageId);
                if (reference.id !== currentReply.id) return;

                await reply.channel.sendTyping();
                const response = await fetchAIResponse(
                    reply.content,
                    process.env.GEMINI_API_KEY,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    ASK_SYSTEM_PROMPT,
                    history.slice(-MAX_HISTORY_TURNS),
                );

                if (!response)
                    throw new Error("Unexpected response from the API.");

                history.push(
                    { role: "user", content: reply.content },
                    { role: "assistant", content: response },
                );

                currentReply = await reply.reply(limitString(response, 2000));
                replyCount++;
            }
        }
    },
};
