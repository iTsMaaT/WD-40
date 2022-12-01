module.exports = {
    name: "serverinfo",
    description: "Gives info of a user",
    execute: async(client, message, args) => {
        const owner = await message.guild.fetchOwner();
        message.reply({
            content: `
__General__
**Server name**: \`${message.guild.name}\`
    
**Created at**: <t:${parseInt(message.guild.createdTimestamp / 1000)}:R>
**Owner**: ${owner}
**Server description**: ${message.guild.description}

__Users__
**User count**: ${message.guild.members.cache.filter((m) => !m.user.bot).size}
**Bot count**: ${message.guild.members.cache.filter((m) => m.user.bot).size}
**Total**: ${message.guild.members.cache.filter((m) => m.user).size}

    `, allowedMentions: { repliedUser: false }
        })
        
    }
}