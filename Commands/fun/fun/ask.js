const { Configuration, OpenAIApi } = require('openai');
const fs = require("fs/promises");
module.exports = {
  name: "ask",
  description: "Ask a question to ChatGPT-3.5-turbo (>ask -p <...> for changing the personality prompt)",
  category: "fun",
  execute: async (logger, client, message, args) => {

    try {
      if (args[0] == "-p" && message.member.permissions.has("Administrator") && message.author.id == 411996978583699456) {
        args.shift();
        await global.GuildManager.SetPersonality(message.guild, args.join(" "));
        message.reply({ content: 'Prompt successfully changed.', allowedMentions: { repliedUser: false } });
      } else if (args[1]) {
        let conversationLog = [{ role: 'system', content: global.GuildManager.GetPersonality(message.guild).toString() }];
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        let prevMessages = await message.channel.messages.fetch({ limit: 10 });
        prevMessages.reverse();

        prevMessages.forEach((msg) => {
          if (msg.author.id !== client.user.id && message.author.bot) return;
          if (msg.author.id !== message.author.id) return;

          conversationLog.push({
            role: 'user',
            content: msg.content.replace(">ask", ""),
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
          await message.reply(result.data.choices[0].message.content);
        } else {
          let discriminator = Math.floor(Math.random() * 99999) + 1;
          await fs.writeFile(`./answer-${discriminator}.txt`, result.data.choices[0].message.content, { encoding: "utf8" });
          await message.reply({ files: [`./answer-${discriminator}.txt`] });
          await fs.unlink(`./answer-${discriminator}.txt`);
        }
      } else {
        message.reply("Invalid prompt.")
      }
    } catch (e) {
      logger.error(e);
    }
  }
}