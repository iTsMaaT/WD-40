const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const got = require("got");

module.exports = {
    name: "ask",
    description: "Ask a question to PaLM",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "prompt",
            description: "The question to ask Google's AI",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    cooldown: 5000,
    execute: async (logger, interaction, client) => {
        await interaction.deferReply();
        
        try {
            const prompt = `When responding to the following prompt, try to condense your response. Make sure it is under 2000 characters. Prompt: ${interaction.options.get("prompt").value}`;
            const result = await got(`${process.env.PALM_API_PROXY_URL}?api_key=${process.env.PALM_API_KEY}&prompt=${encodeURIComponent(prompt)}`, {
                timeout: {
                    request: 10000
                }
            });
            
            const response = JSON.parse(result.body).response;
            interaction.editReply(limitString(response, 2000));

        } catch(err) {
            logger.error(err.stack);
            const ErrorEmbed = {
                title: "An error occured.",
                timestamp: new Date(),
                color: 0xff0000,
            };

            if (err.name == 'TimeoutError') {
                ErrorEmbed.title = "I do not wish to answer that question. (Request timed out)";
                ErrorEmbed.color = 0xffff00;
            }

            await interaction.editReply({ embeds: [ErrorEmbed] });
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