const { Configuration, OpenAIApi } = require('openai');
const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const fs = require("fs/promises");
module.exports = {
  name: "ask",
  description: "Ask a question to ChatGPT-3.5-turbo (>ask -p <...> for changing the personality prompt)",
  type :ApplicationCommandType.ChatInput,
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
const prompt = interaction.options.get("data").value

    switch(type) {
      case "personality":
        if (message.member.permissions.has("Administrator")) {
          try {
          await global.GuildManager.SetPersonality(message.guild, prompt);
            interaction.reply({ content: 'Prompt successfully changed.', allowedMentions: { repliedUser: false } });
          } catch (err) {
            interaction.reply({ content: `Error while changing the personality:\n${err}`, allowedMentions: { repliedUser: false }, ephemeral: true });
          }
        }
      break;
      case "prompt":
        let conversationLog = [{ role: 'system', content: global.GuildManager.GetPersonality(interaction.guild).toString() }];
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        let prevMessages = await interaction.channel.messages.fetch({ limit: 10 });
        prevMessages.reverse();

        prevMessages.forEach((msg) => {
          if (msg.author.id !== client.user.id && interaction.user.bot) return;
          if (msg.author.id !== interaction.user.id) return;

          conversationLog.push({
            role: 'user',
            content: msg.content,
          });
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
          await interaction.reply({ content: result.data.choices[0].message.content, allowedMentions: { repliedUser: false } });
        } else {
          let discriminator = Math.floor(Math.random() * 99999) + 1;
          await fs.writeFile(`./answer-${discriminator}.txt`, result.data.choices[0].message.content, { encoding: "utf8" });
          await message.reply({ files: [`./answer-${discriminator}.txt`] });
          await fs.unlink(`./answer-${discriminator}.txt`);
        }
      break;
    }

  }
}