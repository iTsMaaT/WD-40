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
            const userCountArray = [];
            const botCountArray = [];
            guilds.forEach(guild => {
                userCountArray.push(guild.memberCount);
                botCountArray.push(guild.members.cache.filter(member => member.user.bot).size);
            });
            

            // Add fields for each guild
            guilds.forEach(guild => {
                const botCount = guild.members.cache.filter(member => member.user.bot).size;
                const userCount = guild.memberCount - botCount;
                const totalCount = guild.memberCount;

                const userPadding = ' '.repeat(Math.max(userCountArray).toString().length - userCount.toString().length);
                const botPadding = ' '.repeat(Math.max(botCountArray).toString().length - botCount.toString().length);
  
                totalUsers += userCount;
                totalBots += botCount;
  
                const field = {
                    name: `${guild.name} (${guild.id})`,
                    value: `\`Users: ${userCount}${userPadding} | Bots: ${botCount}${botPadding} | Total: ${totalCount}\``
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