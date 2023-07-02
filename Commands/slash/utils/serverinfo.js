module.exports = {
    name: "serverinfo",
    description: "Gives info of a server",
    execute: async(logger, interaction, client) => {
        const owner = await interaction.guild.fetchOwner();
        interaction.reply({
            content: `
__General__
**Server name**: \`${interaction.guild.name}\`
    
**Created at**: <t:${parseInt(interaction.guild.createdTimestamp / 1000)}:D> (<t:${parseInt(interaction.guild.createdTimestamp / 1000)}:R>)
**Owner**: ${owner}
**Server description**: ${interaction.guild.description}

__Users__
**User count**: ${interaction.guild.members.cache.filter((m) => !m.user.bot).size}
**Bot count**: ${interaction.guild.members.cache.filter((m) => m.user.bot).size}
**Total**: ${interaction.guild.members.cache.filter((m) => m.user).size} ${ interaction.guild.members.cache.filter((m) => m.user).size == 69 ? "(Nice)" : ""}  

${ interaction.guild.members.cache.filter((m) => m.user).size == 42 ? "This is the answer to life!" : ""}`//Easter egg for 42 and 69 members
        });
    }
};