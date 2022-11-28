const { channelLink } = require("discord.js")

module.exports = {
    name: "userinfo",
    description: "Gives info of a user",
    execute: async (client, message, args) => {
        const guild = await client.guilds.fetch(message.guildId);
        if (!args[0]) {
            try {
                const id = message.author.id;
                const target = await guild.members.fetch(id);
                const status = await guild.presences.resolve(id);
                try {
                    global.custom_status = status.activities[0]?.state ?? "`No status`";
                    global.activity_name = status.activities[1]?.name ?? "`No activity name`";
                    global.activity_details = status.activities[1]?.details ?? "`No activity details`";
                } catch {
                    global.custom_status = "`No status`";
                    global.activity_name = "`No activity name`";
                    global.activity_details = "`No activity details`";
                }
                message.reply({
                    content: `
**User Informations For**: \`${message.member.user.tag}\`
            
**User ID**: ${target.user.id}
**Account age**: <t:${parseInt(target.user.createdTimestamp / 1000)}:R>
**Member of this server since**: <t:${parseInt(target.joinedTimestamp / 1000)}:R>
**Status**: ${custom_status}
**Activity Title**: ${activity_name}
**Activity Details**: ${activity_details}



            `, allowedMentions: { repliedUser: false }
                });
                /***Roles**:
                ${target.roles.cache.map(r => r).join(" ")}*/
            } catch (err) {
                message.reply(`Invalid user / id, User offline or an error occurred\n${err}`);
            }
        } else if (args.length == 1) {
            try {
                const rawid1 = args[0].replace("@", "");
                const rawdid2 = rawid1.replace("<", "");
                const id = rawdid2.replace(">", "");
                const target = await guild.members.fetch(id);
                const status = await guild.presences.resolve(id);
                try {
                    global.custom_status = status.activities[0]?.state ?? "`No status`";
                    global.activity_name = status.activities[1]?.name ?? "`No activity name`";
                    global.activity_details = status.activities[1]?.details ?? "`No activity details`";
                } catch {
                    global.custom_status = "`No status`";
                    global.activity_name = "`No activity name`";
                    global.activity_details = "`No activity details`";
                }
                message.reply({
                    content: `
**User Informations For**: \`${target.user.tag}\`
                
**User ID**: ${target.user.id}
**Account age**: <t:${parseInt(target.user.createdTimestamp / 1000)}:R>
**Member of this server since**: <t:${parseInt(target.joinedTimestamp / 1000)}:R>
**Status**: ${custom_status}
**Activity Title**: ${activity_name}
**Activity Details**: ${activity_details}
    
    
    
                `, allowedMentions: { repliedUser: false }
                });
                /***Roles**:
                ${target.roles.cache.map(r => r).join(" ")}*/
            } catch (err) {
                message.reply(`Invalid user / id, User offline or an error occurred\n\`${err}\``);
            }
        }
    }
}