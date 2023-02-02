const { Guild } = require("discord.js");
const USERID = require("../UserIDs.js");
module.exports = {
    name: "sudo",
    description: "make the bot send a custom message / reply",
    execute: async(logger, client, message, args) => {
        const owner = await message.guild.fetchOwner();
        if ((message.author.id == USERID.itsmaat || message.author.id == owner.id) && args.length > 1) {
            let sudoprefix = args.shift();
            if (sudoprefix == "-s") {
                let SudoID = args.shift();
                client.channels.cache.get(SudoID).send(args.join(' '));
                message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                logger.info(`Sudo -s used by ${message.author.tag} (${message.author.id}) in <#${SudoID}>, Message content : ${args.join(" ")}`);
            }
            else if (sudoprefix == "-r") {
                let ChannelID = args.shift();
                let MsgID = args.shift();
                client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MsgID })
                    .then(m => {
                        m.reply(args.join(' '));
                        message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                        logger.info(`Sudo -r used by ${message.author.tag} (${message.author.id}) in <#${ChannelID}>, Message content : ${args.join(" ")}`);
                    }).catch(() => message.reply("Unable to find message."));
            }
            else if (sudoprefix == "-e") {
                let ChannelID = args.shift();
                let MsgID = args.shift();
                let letters = args.shift().toUpperCase();
                
                for (i = 0; i < letters.length; i++) {
                    if (letters[i] === " ") continue;
                    let letter = letters[i];
                    client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MsgID })
                    .then(m => {
                        m.react(String.fromCodePoint(letter.codePointAt(0) - 65 + 0x1f1e6));
                    }).catch((err) => message.reply("Unable to find message. " + err));
                }
                message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                logger.info(`Sudo -e used by ${message.author.tag} (${message.author.id}) in <#${ChannelID}>`);
            }
        } else {
            message.reply(`You are not allowed to execute that command`);
        }
    }
}
