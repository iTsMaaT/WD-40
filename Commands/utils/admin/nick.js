const USERID = require("../../../UserIDs.js");
module.exports = {
    name: "nick",
    description: "Changes the bot's nickname",
    category: "utils",
    private: true,
    execute: async (logger, client, message, args) => {
        if (message.author.id == USERID.itsmaat && args.length != 0) {
            //Tries to set the username
            try {
            client.user.setUsername(args.join(' '));
            message.reply('Nickname changed.');
            }
            catch(err) {
                message.reply(`Name change failed.\n\`${err}\``)
            }
        }
        //if no args, puts the name back to normal
        else if (message.author.id == USERID.itsmaat && args.length == 0) {
            client.user.setUsername(`WD-40`);
            message.reply({ content: 'Nickname set to default', allowedMentions: { repliedUser: false } });
        } else {
            message.reply(`You are not allowed to execute that command`);
        }
    }
}