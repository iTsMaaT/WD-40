module.exports = {
    name: "userinfo",
    description: "Gives info of a user",
    category: "utils",
    execute: async (logger, client, message, args) => {
        const guild = await client.guilds.fetch(message.guildId);
        
        let id;
        if (!args[0]) {
            id = message.author.id;
        } else {
            const rawId = args[0].replace(/[<!@>]/g, "");
            if (!rawId.match(/^\d+$/)) {
                return message.reply("Invalid user ID.");
            }
            id = rawId;
        }
        
        try {
            const target = await guild.members.fetch(id);
            const status = await guild.presences.resolve(id);
            
            try {
                var custom_status = status.activities[0]?.state ?? "`No status`";
                var activity_name = status.activities[1]?.name ?? "`No activity name`";
                var activity_details = status.activities[1]?.details ?? "`No activity details`";
            } catch {
                var custom_status = "`No status`";
                var activity_name = "`No activity name`";
                var activity_details = "`No activity details`";
            }
            
            userInfoEmbed = {
                title: "User Information",
                description: `User Informations For: **<@${id}>**`,
                fields: [
                    { name: "User ID", value: target.user.id },
                    { name: "Account Age", value: `<t:${parseInt(target.user.createdTimestamp / 1000)}:R>` },
                    { name: "Member Since", value: `<t:${parseInt(target.joinedTimestamp / 1000)}:R>` },
                    { name: "Status", value: custom_status },
                    { name: "Activity Title", value: activity_name },
                    { name: "Activity Details", value: activity_details },
                    { name: "Highest Role", value: target.roles.highest.name },
                ],
                timestamp: new Date(),
            };
            
            message.reply({ embeds: [userInfoEmbed], allowedMentions: { repliedUser: false } });
        } catch (err) {
            userInfoEmbed = {
                title: "Error",
                description: err,
                timestamp: new Date(),
            };
            message.reply({ embeds: [userInfoEmbed], allowedMentions: { repliedUser: false } });
        }
    }
};