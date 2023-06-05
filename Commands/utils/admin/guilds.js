module.exports = {
    name: 'guilds',
    category: 'utils',
    description: 'Makes a list of the guilds the bot is in',
    private: true,
    execute(logger, client, message, args) {
        if (message.author.id === process.env.OWNER_ID) {
            const guilds = client.guilds.cache;
            const guildCount = guilds.size;
            let totalUsers = 0;
            let totalBots = 0;
  
            // Create the embed
            const embed = {
                title: 'Guilds List',
                color: 0xffffff,
                description: '',
                fields: [],
                footer: {
                    text: ''
                }
            };
  
            // Add fields for each guild
            guilds.forEach(guild => {
                const userCount = guild.memberCount;
                const botCount = guild.members.cache.filter(member => member.user.bot).size;
                const totalCount = userCount + botCount;
  
                totalUsers += userCount;
                totalBots += botCount;
  
                const field = {
                    name: `${guild.name} (${guild.id})`,
                    value: `Users: ${userCount} | Bots: ${botCount} | Total: ${totalCount}`
                };
  
                embed.fields.push(field);
            });
  
            // Set the footer text
            embed.description = `Total Guilds: ${guildCount} | Users: ${totalUsers} | Bots: ${totalBots} | Total: ${totalUsers + totalBots}`;
  
            // Send the embed
            message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        }
    }
};
  
  

/* Antoine stupide (it works ig)
            console.log(client.guilds.cache.map(guild => guild.name).reduce((previous,current) => {
                return previous + "\n" + current
            }, "").substring(2))
            */