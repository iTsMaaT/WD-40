const { Events } = require('discord.js');
const { blacklist, whitelist } = require("@root/utils/config.json");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(client, logger, message) {
        if (message.author.bot) return;
        if (superuser && (message.author.id != process.env.OWNER_ID || !whitelist.includes(message.author.id))) return;
        if (!message.guild) return;
        if (blacklist.includes(message.author.id)) return;

        //Gives the prefix if the bot is pinged
        if (message.content == "<@1036485458827415633>") {
            message.reply(`**Prefix** : ${prefix}\n**Help command** : ${prefix}help`);
        }

        //Snowflake reaction
        if (snowflakeData != []) {
            const expected = [parseInt(message.guildId), parseInt(message.author.id)];
            const exists = snowflakeData.filter(v => {
                return v.equals(expected);
            }).length >= 1;
            if (exists) {
                message.react('❄️');
            }
        }

        //Auto-responses
        if (global.GuildManager.GetResponses(message.guild)) {

            //Votes for the memes
            if (message.attachments.size > 0 || message.content.startsWith("https://") || message.content.startsWith("http://")) {
                if (message.channel.name.includes('meme')) {
                    message.react('👍')
                        .then(() => message.react('👎'))
                        .then(() => message.react('♻️'))
                        .then(() => message.react('💀'))
                        .then(() => message.react('🤨'))
                        .then(() => message.react("😎"));
                }
            }

            //skull reaction to skull emoji
            if (message.content.toLowerCase() == `💀`) {
                message.react('💀');
            }

            //Ping fail if doesnt have @everyone perm
            if (message.member && !message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) {
                message.reply("Ping fail L");
            }
        }
    },
};