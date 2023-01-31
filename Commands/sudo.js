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
                const SudoID = args.shift();
                client.channels.cache.get(SudoID).send(args.join(' '));
                message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                logger.info(`Sudo -s used by ${message.author.tag} (${message.author.id}) in <#${SudoID}>, Message content : ${args.join(" ")}`);
            }
            else if (sudoprefix == "-r") {
                const ChannelID = args.shift();
                const MsgID = args.shift();
                client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MsgID })
                    .then(m => {
                        m.reply(args.join(' '));
                        message.reply({ content: "Sudo successful.", allowedMentions: { repliedUser: false } });
                        logger.info(`Sudo -r used by ${message.author.tag} (${message.author.id}) in <#${ChannelID}>, Message content : ${args.join(" ")}`);
                    }).catch(() => message.reply("Unable to find message."));
            }
        } else {
            message.reply(`You are not allowed to execute that command`);
        }
    }
}
