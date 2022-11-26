const { channelLink } = require("discord.js")

module.exports = {
    /*name: "userinfo",
    description: "Gives info of a user",
    execute: async(client, message, args) =>{
        const guild = await client.guilds.fetch(message.guildId)
        if (!args[0]) {
            const id = message.author.id
            const target = await guild.members.fetch(id)
            const status = await guild.presences.resolve(id)
            const custom_status = status.activities[0]?.state ?? "`No status`"
            const activity_name = status.activities[1]?.name ?? "`No activity name`"
            const activity_details = status.activities[1]?.details ?? "`No activity details`"
            message.channel.send(`
**User Informations For**: \`${message.member.user.tag}\`
            
**User ID**: \`${target.user.id}\`
**Account age**: \`<t:${parseInt(target.user.createdTimestamp / 1000 )}:R>\`
**Member of this server since**: \`<t:${parseInt(target.joinedTimestamp / 1000)}:R>\`
**Status**: \`${custom_status}\`
**Activity Title**: \`${activity_name}\`
**Activity Details**: \`${activity_details}\`
**Roles**:
\`${target.roles.cache.map(r => r).join(" ")}\`


            `);
        }
    }*/
}