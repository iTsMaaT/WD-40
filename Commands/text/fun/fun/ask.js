const SendErrorEmbed = require('@functions/SendErrorEmbed');
const got = require("got");
module.exports = {
    name: "ask",
    description: "Ask a question to PaLM",
    usage: "< prompt >",
    category: "fun",
    cooldown: 5000,
    execute: async (logger, client, message, args) => {
        try {
            const prompt = `When responding to the following prompt, try to condense your response. Make sure it is under 2000 characters. Prompt: ${args.join(" ")}`;
            const result = await got(`${process.env.PALM_API_PROXY_URL}?api_key=${process.env.PALM_API_KEY}&prompt=${encodeURIComponent(prompt)}`);
            const response = JSON.parse(result.body).response;
        
            message.reply(limitString(response, 2000));

        } catch(err) {
            SendErrorEmbed(message, "An error occured.", "red");
        }

        function limitString(string, limit) {
            if (string.length <= limit) {
                return string;
            } else {
                return string.substring(0, limit - 3) + "...";
            }
        }
    }
};