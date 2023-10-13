module.exports = {
    name: "nick",
    description: "Changes the server nickname",
    category: "utils",
    private: true,
    execute: async (logger, client, message, args) => {
        if (message.author.id == process.env.OWNER_ID && args.length >= 1) {
            const member = message.guild.members.cache.get(client.user.id);

            // Tries to set the server nickname
            try {
                await member.setNickname(args.join(" "));
                message.reply("Server nickname changed.");
            } catch (err) {
                message.reply(`Nickname change failed.\n\`${err}\``);
            }
        } else if (message.author.id == process.env.OWNER_ID && args.length === 0) {
            const member = message.guild.members.cache.get(client.user.id);

            // Resets the server nickname to default
            try {
                await member.setNickname(null);
                message.reply({ content: "Server nickname set to default" });
            } catch (err) {
                message.reply(`Nickname reset failed.\n\`${err}\``);
            }
        } else {
            message.reply("You are not allowed to execute that command.");
        }
    },
};