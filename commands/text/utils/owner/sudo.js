const { extractMessageInfo } = require("@functions/discordFunctions");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "sudo",
    description: "Make the bot send a custom message / reply",
    category: "owner",
    usage: {
        required: {
            "link": "link to the message to send",
            "message": "message to send",
        },
        optional: {
            "send|s": {
                hasValue: false,
                description: "Type of action to perform",
            },
            "reply|r": {
                hasValue: false,
                description: "Replies to a message",
            },
            "dm|d": {
                hasValue: false,
                description: "DMs a specific user",
            },
            "emote|e": {
                hasValue: false,
                description: "Reacts to a message with letters from a string",
            },
            "clear|c": {
                hasValue: false,
                description: "Clears all reactions from a message",
            }, 
        },
    },
    private: true,
    async execute(logger, client, message, args, flags) {
        try {
            const messageLink = args.shift();
            const sudoMessage = args.join(" ");
            const [guildID, channelID, messageID] = extractMessageInfo(messageLink).catch(() => null);

            if (!flags["send|s"] && !flags["reply|r"] && !flags["emote|e"] && !flags["clear|c"] && !flags["dm|d"]) {
                await message.reply({ embed : [embedGenerator.error({ title: "Missing parameter", description: "You must specify a parameter" })] });
                return;
            }

            if (flags["send|s"]) {
                await client.channels.cache.get(channelID).send(sudoMessage);
                await message.reply({ embeds: [embedGenerator.success("Send sudo successful.")] });
                logger.info(`Sudo -s used by ${message.author.displayName} (${message.author.id}) in <#${channelID}>, Message content : ${sudoMessage}`);
            }
        
            if (flags["reply|r"]) {
                const toReply = await client.channels.cache.get(channelID).messages.fetch({ cache: false, message: messageID });
                await toReply.reply(sudoMessage);
                await message.reply({ embeds: [embedGenerator.success("Reply sudo successful.")] });
                logger.info(`Sudo -r used by ${message.author.displayName} (${message.author.id}) in <#${channelID}>, Message content : ${sudoMessage}`);
            }

            if (flags["emote|e"]) {
                const sudoMessageNoSpace = sudoMessage.replace(/\s/g, "").toUpperCase();
                const toReply = await client.channels.cache.get(channelID).messages.fetch({ cache: false, message: messageID });
                for (i = 0; i < sudoMessageNoSpace.length; i++) {
                    if (sudoMessageNoSpace[i] === " ") continue;
                    const letter = sudoMessageNoSpace[i];
                    await toReply.react(String.fromCodePoint(letter.codePointAt(0) - 65 + 0x1f1e6)).catch(() => null);
                }
                await message.reply({ embeds: [embedGenerator.success("Emote sudo successful.")] });
                logger.info(`Sudo -e used by ${message.author.displayName} (${message.author.id}) in <#${channelID}>, Message content : ${sudoMessage}`);
            }

            if (flags["clear|c"]) {
                const toReply = await client.channels.cache.get(channelID).messages.fetch({ cache: false, message: messageID });
                toReply.reactions.removeAll();
                await message.reply({ embeds: [embedGenerator.success("Emote sudo successful.")] });
                logger.info(`Sudo -c used by ${message.author.displayName} (${message.author.id}) in <#${channelID}>, Message content : ${sudoMessage}`);
            }

            if (flags["dm|d"]) {
                const UserID = messageLink;
                client.users.send(UserID, sudoMessage);
                await message.reply({ embeds: [embedGenerator.success("DM sudo successful.")] });
                logger.info(`Sudo -dm used by ${message.author.displayName} (${message.author.id}) to <@${UserID}>, Message content : ${sudoMessage}`);
            }
        } catch (err) {
            logger.error(err);
            await message.reply({ embeds: [embedGenerator.error({ title: "Something went wrong", description: `\`\`\`\n${err}\`\`\`` })] });
        }
    },
};
