module.exports = {
    name: "activity",
    description: "Changes the bot's activity status",
    execute(logger, client, message, args) {
        if (message.author.id == 411996978583699456 && args.length != 0) {
            client.user.setActivity(args.join(' '));
            message.reply('Activity changed.');
        }
        else {
            client.user.setActivity(`Time to be annoying!`);
            message.reply({ content: 'Activity set to default', allowedMentions: { repliedUser: false } });
        }
    }
}