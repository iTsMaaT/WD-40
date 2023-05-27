const { Events } = require('discord.js');
const FetchReddit = require("../utils/functions/FetchReddit.js");
const getExactDate = require('../utils/functions/getExactDate.js');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(client, logger, message) {
        if (message.author.bot) return;
        if (superuser && message.author.id != USERID.itsmaat) return;
        if (!message.guild) return;
        if (Blacklist[message.author.id]) return;

        try {
            await global.prisma.message.create({
                data: {
                    MessageID: BigInt(parseInt(message.id)),
                    UserID: BigInt(parseInt(message.author.id)),
                    ChannelID: BigInt(parseInt(message.channel.id)),
                    GuildID: BigInt(parseInt(message.guild.id)),
                    //Timestamp: new Date(new Date(message.createdTimestamp).toLocaleString("en-US", {timeZone: "America/Toronto"})),
                    Content: message.content,
                }
            })
        } catch (ex) {
            console.log(`[${getExactDate()} - SEVERE] Unable to write to database`)
            console.log(ex)
        }

        //Gives the prefix if the bot is pinged
        if (message.content == "<@1036485458827415633>") {
            message.reply(`**Prefix** : ${prefix}\n**Help command** : ${prefix}help`);
        }

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

        //Auto-responses
        if (global.GuildManager.GetResponses(message.guild)) {

            //Sends furry porn in DMs of anyone that says "sex"
            if (message.content.toLowerCase() == "sex") {
                message.author.send({ embeds: [await FetchReddit(message, true, "furrypornsubreddit", "yiff", "furryonhuman")] })

            }

            //reacts S-T-F-U when gros gaming or smartass is said
            if (message.content.toLowerCase().includes("gros gaming") || message.content.toLowerCase().includes("smartass") || (message.content.toLowerCase().includes("edging") && !message.author.id == USERID.dada129)) {
                message.react('🇸')
                    .then(() => message.react('🇹'))
                    .then(() => message.react('🇫'))
                    .then(() => message.react('🇺'));
            }

            //Deletes the message if it has edging and is said by dada
            if (message.content.toLowerCase().includes("edging") && message.author.id == USERID.dada129) {
                message.delete();
            }

            //what? eveeeer
            if (message.content.toLowerCase() == `what` || message.content == `what?` || message.content == `What?` ||
                message.content.toLowerCase() == `who` || message.content == `who?` || message.content == `Who?`) {
                message.reply("ever!");
            }

            //ever what?
            if (message.content.toLowerCase() == `ever`) {
                message.reply("What?");
            }

            //skull reaction to skull emoji
            if (message.content.toLowerCase() == `💀`) {
                message.react('💀');
            }

            //Snowflake reaction
            if (snowflakeData != []) {
                let expected = [parseInt(message.guildId), parseInt(message.author.id)];
                let exists = snowflakeData.filter(v => {
                    return v.equals(expected);
                }).length >= 1;
                if (exists) {
                    message.react('❄️');
                }
            }

            //reacts :gorilla: when pinging iTsMaaT
            if (message.content.includes("<@411996978583699456>")) {
                message.react('🦍');
            }

            //reacts :chipmunk: when pinging phildiop
            if (message.content.includes("<@348281625173295114>")) {
                message.react('🐿️');
            }

            //answers your mom when asking who's at break
            if (message.content.toLowerCase().includes("en pause")) {
                message.channel.send("Ta mère");
            }

            //Ping fail if doesnt have @everyone perm
            if (message.member && !message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) {
                message.reply("Ping fail L");
            }

            //answers bruh to bruh
            if (message.content.toLowerCase() == "bruh") {
                message.reply("bruh");
            }

            //Reacts the stuff meme when a message includes "stuff"
            if (message.content.toLowerCase().includes("stuff")) {
                message.react("<:stuff:1099738190966960179>");
            }

            //Replies when someone does a mogus reference
            if (message.content.toLowerCase() == "sus" || message.content.toLowerCase() == "amogus" || message.content.toLowerCase() == "among us") {
                //message.reply("No.");
            }
        }
    },
};