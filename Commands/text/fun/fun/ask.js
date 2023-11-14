const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "ask",
    description: "Ask a question to PaLM",
    usage: "< prompt >",
    category: "fun",
    examples: ["what are you used for?"],
    cooldown: 5000,
    execute: async (logger, client, message, args) => {
        try {
            const prompt = `When responding to the following prompt, try to condense your response. Make sure it is under 2000 characters. Prompt: ${args.join(" ")}`;
            const result = await fetch(`${process.env.PALM_API_PROXY_URL}?api_key=${process.env.PALM_API_KEY}&prompt=${encodeURIComponent(prompt)}`, {
                signal: AbortSignal.timeout(10000),
            });
            
            const response = (await result.json()).response;
            message.reply(limitString(response, 2000));

        } catch (err) {
            logger.error(err.stack);
            if (err.name == "TimeoutError") return SendErrorEmbed(message, "I do not wish to answer that question. (Request timed out)", "yellow");
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
