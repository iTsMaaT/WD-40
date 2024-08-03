const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "nick",
    description: "Changes the server nickname",
    category: "utils",
    usage: {
        required: {
            "nickname": "nickname to set",
        },
    },
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const newNickname = args.join(" ");
            const member = message.guild.members.cache.get(client.user.id);
            
            await member.setNickname(newNickname || null);
            await message.reply({ embeds: [embedGenerator.success(`Server nickname changed to ${newNickname || "default"}`)] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Nickname change failed.")] });
        }
    },
};