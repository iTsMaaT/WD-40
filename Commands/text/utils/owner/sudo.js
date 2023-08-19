const infoFromMessageLink = require("@functions/InfoFromMessageLink");

module.exports = {
    name: "sudo",
    description: "Make the bot send a custom message / reply",
    category: "utils",
    private: true,
    execute: async (logger, client, message, args) => {
        const owner = await message.guild.fetchOwner();

        //Only server owner and iTsMaaT are allowed to execute this command
        if ((message.author.id == process.env.OWNER_ID || message.author.id == owner.id)) {
            //Sends a message in a given channel
            const sudoprefix = args.shift();
            if (sudoprefix == "-s") {
                const SudoID = args.shift();
                client.channels.cache.get(SudoID).send(args.join(' '));
                message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                logger.info(`Sudo -s used by ${message.author.tag} (${message.author.id}) in <#${SudoID}>, Message content : ${args.join(" ")}`);
            }
            //Replies to a given message in a given channel
            else if (sudoprefix == "-r") {
                const LinkArray = infoFromMessageLink(args.shift());
                const ChannelID = LinkArray[1];
                const MsgID = LinkArray[2];
                client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MsgID })
                    .then(m => {
                        m.reply(args.join(' '));
                        message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                        logger.info(`Sudo -r used by ${message.author.tag} (${message.author.id}) in <#${ChannelID}>, Message content : ${args.join(" ")}`);
                    }).catch(() => message.reply("Unable to find message."));
            }
            //Reacts to a given message in a given channel
            else if (sudoprefix == "-e") {
                if (args.length > 2) {
                    const ChannelID = args.shift();
                    const MsgID = args.shift();
                    const letters = args.shift().toUpperCase();

                    for (i = 0; i < letters.length; i++) {
                        if (letters[i] === " ") continue;
                        const letter = letters[i];
                        client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MsgID })
                            .then(m => {
                                m.react(String.fromCodePoint(letter.codePointAt(0) - 65 + 0x1f1e6));
                            }).catch((err) => message.reply("Unable to find message. " + err));
                    }
                    message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                    logger.info(`Sudo -e used by ${message.author.tag} (${message.author.id}) in <#${ChannelID}>`);
                }
                else {
                    const ChannelID = args.shift();
                    const MsgID = args.shift();
                    client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MsgID })
                        .then(m => {
                            m.reactions.removeAll();
                        }).catch((err) => message.reply("Failed to clear reactions: " + err));
                    message.reply({ content: "Emotes cleared.", allowedMentions: { repliedUser: false } });
                }
            }
            //DMs a given user
            else if (sudoprefix == "-dm") {
                try {
                    const UserID = args.shift();
                    client.users.send(UserID, args.join(' '));
                    message.reply({ content: `DM sent to <@${UserID}>`, allowedMentions: { repliedUser: false } });
                    logger.info(`Sudo -dm used by ${message.author.tag} (${message.author.id}) to <@${UserID}>`);
                } catch (err) {
                    logger.error(`Unable to DM <@${UserID}> (${UserID})`);
                }
            } 
            else if (sudoprefix == "-help") {
                //Help for the sudo
                message.reply({ content:
                `
**-s** : Sends a message in a channel (\`>sudo -s <Channel ID> <Message>\`)

**-r** : Replies to a message in a channel (\`>sudo -r <Message link> <Message>\`)

**-e** : Reacts to a message with letters from a string (\`>sudo -e  <Channel ID> <Message ID> <String that will be converted to emotes>\`)

**-dm** : DMs a specific user (\`>sudo -dm <User ID> <Message>\`)

                `, allowedMentions: { repliedUser: false } });

            }
            else {
                //Unknown parameter error
                message.reply(`Unknown parameter (use \`>sudo -help\` for help)`);
            }
            
        } else {
            //If normal user, blocks access to the command
            message.reply(`You are not allowed to execute that command`);
        }
    }
};
