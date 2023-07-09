const { Configuration, OpenAIApi } = require('openai');
const fs = require("fs/promises");
const SendErrorEmbed = require('@functions/SendErrorEmbed');
module.exports = {
    name: "ask",
    description: "Ask a question to ChatGPT-3.5-turbo",
    usage: "< -p: Personality, [ANY]: The prompt>",
    category: "fun",
    execute: async (logger, client, message, args) => {
        message.channel.sendTyping();

        try {
            if (args[0] == "-p" && message.member.permissions.has("Administrator") && message.author.id == process.env.OWNER_ID) {
                args.shift();
                await global.GuildManager.SetPersonality(message.guild, args.join(" "));
                message.reply({ content: 'Prompt successfully changed.', allowedMentions: { repliedUser: false } });
            } else if (args[0]) {
                const perso = global.GuildManager.GetPersonality(message.guild)?.toString();
                if (!perso) { 
                    global.GuildManager.init(message.guild);
                    global.GuildManager.GetPersonality(message.guild).toString();
                }
                const conversationLog = [{ role: 'system', content: perso}];
                const configuration = new Configuration({
                    apiKey: process.env.OPENAI_API_KEY,
                });
                const openai = new OpenAIApi(configuration);

                const prevMessages = await message.channel.messages.fetch({ limit: 10 });
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
                        if (error.response.status === 429) return SendErrorEmbed(message, "Funds needed to keep running", "yellow");
                    });

                if (result.data.choices[0].message.content.length < 2000) {
                    await message.reply({ content: result.data.choices[0].message.content, allowedMentions: { repliedUser: true }});
                } else {
                    const discriminator = Math.floor(Math.random() * 99999) + 1;
                    await fs.writeFile(`./answer-${discriminator}.txt`, result.data.choices[0].message.content, { encoding: "utf8" });
                    await message.reply({ files: [`./answer-${discriminator}.txt`] });
                    await fs.unlink(`./answer-${discriminator}.txt`);
                }
            } else {
                SendErrorEmbed(message, "Invalid prompt.", "yellow");
            }
        } catch (e) {
            logger.error(e.stack);
            SendErrorEmbed(message, "An error occured", "red");
        }
    }
};