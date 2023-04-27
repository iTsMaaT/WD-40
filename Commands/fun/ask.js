const { Configuration, OpenAIApi } = require('openai');
const Discord = require('discord.js');
const path = require("path");
const {Readable} = require("stream");
const fs = require("fs/promises");
module.exports = {
    name: "ask",
    description: "Ask a question to the OpenAI API",
    category: "fun",
    execute: async (logger, client, message, args) => {

        try {
        let conversationLog = [{ role: 'system', content: 'Answer as if you are annoying.' }];
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
          });
          const openai = new OpenAIApi(configuration);

          conversationLog.push({
            role: 'user',
            content: args.join(" "),
          });
    
          const result = await openai
          .createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
            // max_tokens: 256, // limit token usage
          })
          .catch((error) => {
            console.log(`OPENAI ERR: ${error}`);
          });

          if (result.data.choices[0].message.content.length < 2000) {
            await message.reply(result.data.choices[0].message.content);
          } else {
            let discriminator = Math.floor(Math.random() * 99999)+1;
            await fs.writeFile(`./answer-${discriminator}.txt`, result.data.choices[0].message.content, {encoding: "utf8"});
            await message.reply({ files: [`./answer-${discriminator}.txt`] });
            await fs.unlink(`./answer-${discriminator}.txt`);
          }
        } catch(e) {
           logger.error(e.stack) 
        }
    }
}