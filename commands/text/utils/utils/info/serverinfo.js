const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "serverinfo",
    description: "Gives info of a server",
    category: "info",
    aliases: ["sinfo"],
    execute: async (logger, client, message, args, optionalArgs) => {
        try {
            const owner = await message.guild.fetchOwner();
  
            const serverInfoEmbed = {
                title: "Server Info",
                color: 0xffffff, // Embed color (you can change it to any color you like)
                thumbnail: {
                    url: message.guild.iconURL({ dynamic: true }) || "",
                },
                fields: [
                    {
                        name: "General",
                        value: 
`**Server name**: \`${message.guild.name}\` 
**Region**: ${message.guild.preferredLocale}
**Created at**: <t:${Math.floor(message.guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>)
**Owner**: ${owner}
**Server description**: ${message.guild.description || "-"}`,
                    },
                    {
                        name: "Users",
                        value: 
`**User count**: ${message.guild.members.cache.filter((m) => !m.user.bot).size}
**Bot count**: ${message.guild.members.cache.filter((m) => m.user.bot).size}
**Total**: ${message.guild.memberCount} ${message.guild.memberCount === 69 ? "(Nice)" : ""}`,
                    },
                ],
                timestamp: new Date(),
            };
  
            await message.reply({ embeds: [serverInfoEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Failed to get server info")] });
        }
    },
};