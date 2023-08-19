const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: "ask",
    description: "Ask a question to ChatGPT-3.5-turbo",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "data",
            description: "The prompt",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    execute: async (logger, interaction, client) => {
        interaction.deferReply();

        try {
            const prompt = `When responding to the following prompt, try to condense your response. Make sure it is under 2000 characters. Prompt: ${interaction.options.get("data").value}`;
            const result = await got(`${process.env.PALM_API_PROXY_URL}?api_key=${process.env.PALM_API_KEY}&prompt=${encodeURIComponent(prompt)}`);
            const response = JSON.parse(result.body).response;
        
            interaction.editReply(limitString(response, 2000));

        } catch(err) {
            SendErrorEmbed(interaction, "An error occured.", "red");
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