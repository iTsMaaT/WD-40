module.exports = {
    name: "serverinfo",
    description: "Gives info of a server",
    category: "utils",
    execute: async (logger, client, message, args) => {
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
                    value: `**Server name**: \`${message.guild.name}\`
                  **Created at**: <t:${Math.floor(message.guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>)
                  **Owner**: ${owner}
                  **Server description**: ${message.guild.description || "None"}`,
                },
                {
                    name: "Users",
                    value: `**User count**: ${message.guild.members.cache.filter((m) => !m.user.bot).size}
                  **Bot count**: ${message.guild.members.cache.filter((m) => m.user.bot).size}
                  **Total**: ${message.guild.memberCount} ${
    message.guild.memberCount === 69 ? "(Nice)" : ""
}${message.guild.memberCount === 42 ? " This is the answer to life!" : ""}`,
                },
            ],
            timestamp: new Date(),
        };
  
        message.reply({ embeds: [serverInfoEmbed], allowedMentions: { repliedUser: false } });
    },
};