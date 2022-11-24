module.exports = {
    name: "nick",
    description: "Changes the bot's nickname",
    execute(client, message, args) {
        if (message.author.id == itsmaat && args.length != 0) {
            client.user.setUsername(args.join(' '));
            message.reply('Nickname changed.');
        }
        else if (message.author.id == itsmaat && args.length == 0) {
            client.user.setUsername(`WD-40`);
            message.reply({ content: 'Nickname set to default', allowedMentions: { repliedUser: false } });
        } else {
            message.reply(`You are not allowed to execute that command`);
        }
    }
}