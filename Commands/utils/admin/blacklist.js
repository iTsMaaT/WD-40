
module.exports = {
    name: 'blacklist',
    description: 'Blacklist a user from using commands',
    category: 'utils',
    private: true,
    execute(logger, client, message, args) {
        
        if (message.author.id != 411996978583699456) return;

        if (!args[0]) {
            if (Object.keys(global.Blacklist).length == 0) return message.reply("Empty.")
            const blacklist = Object.keys(global.Blacklist).map(id => `<@${id}>`)
            message.reply({ content: `Blacklisted members:\n${blacklist.join('\n')}`, allowedMentions: { repliedUser: false } });
            return;
        }
        const rawid1 = args[0].replace("@", "");
        const rawdid2 = rawid1.replace("<", "");
        var id = rawdid2.replace(">", "");

        // Check if user is already blacklisted
        if (global.Blacklist[id]) return message.reply('that user is already blacklisted.');

        // Add the user to the blacklist
        Blacklist[id] = true;
        message.reply(`Successfully blacklisted <@${id}>.`);
    }
}