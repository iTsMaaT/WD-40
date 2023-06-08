const { Configuration, OpenAIApi } = require('openai');
const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const fs = require("fs/promises");
const CreateUniqueSeed = require("../../../utils/functions/CreateUniqueSeed.js");

module.exports = {
    name: "ask",
    description: "Ask a question to ChatGPT-3.5-turbo",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "type",
            description: "The user to check the info from.",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Change Personality", value: "personality", },
                { name: "Ask something", value: "prompt", },
            ],
        },
        {
            name: "data",
            description: "The message to ask or personality",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    execute: async (logger, interaction, client) => {

        const type = interaction.options.get("type").value;
        const prompt = interaction.options.get("data").value;
        interaction.deferReply();
        switch (type) {
        case "personality":
            if (message.member.permissions.has("Administrator")) {
                try {
                    await global.GuildManager.SetPersonality(message.guild, prompt);
                    interaction.editReply({ content: 'Prompt successfully changed.', allowedMentions: { repliedUser: false } });
                } catch (err) {
                    interaction.editReply({ content: `Error while changing the personality:\n${err}`, allowedMentions: { repliedUser: false }, ephemeral: true });
                }
            }
            break;
        case "prompt": {
            const conversationLog = [{ role: 'system', content: global.GuildManager.GetPersonality(interaction.guild).toString() }];
            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const openai = new OpenAIApi(configuration);

            conversationLog.push({
                role: 'user',
                content: prompt,
            });

            const result = await openai
                .createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: conversationLog,
                    // max_tokens: 256, // limit token usage
                })
                .catch((error) => {
                    logger.error(`OPENAI ERR: ${error}`);
                });

            if (result.data.choices[0].message.content.length < 2000) {
                await interaction.editReply({ content: result.data.choices[0].message.content, allowedMentions: { repliedUser: false } });
            } else {
                const discriminator = CreateUniqueSeed(message);
                await fs.writeFile(`./answer-${discriminator}.txt`, result.data.choices[0].message.content, { encoding: "utf8" });
                await interaction.editReply({ files: [`./answer-${discriminator}.txt`] });
                await fs.unlink(`./answer-${discriminator}.txt`);
            }
        }
        }

    }
};