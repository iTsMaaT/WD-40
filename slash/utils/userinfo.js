const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: 'userinfo',
    description: 'Gives info of a user',
    type :ApplicationCommandType.ChatInput,
    options: [
        {
            name: "user",
            description: "The user to check the info from.",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    execute: async(logger, interaction, client) => {
        const guild = await client.guilds.fetch(interaction.guildId);
        const user = interaction.options.getUser("user");
        const id = user ?? interaction.user.id;
        //Info of the user executing the command
        try {
            
            const target = await guild.members.fetch(id);
            const status = await guild.presences.resolve(id);
            console.log(status);
            try {
                var custom_status = status.activities[0]?.state ?? "`No status`";
                var activity_name = status.activities[1]?.name ?? "`No activity name`";
                var activity_details = status.activities[1]?.details ?? "`No activity details`";
            } catch {
                custom_status = "`No status`";
                activity_name = "`No activity name`";
                activity_details = "`No activity details`";
            }
            interaction.reply({
                content: `
**User Informations For**: \`${target.user.tag}\`
        
**User ID**: ${target.user.id}
**Account age**: <t:${parseInt(target.user.createdTimestamp / 1000)}:R>
**Member of this server since**: <t:${parseInt(target.joinedTimestamp / 1000)}:R>
**Status**: ${custom_status}
**Activity Title**: ${activity_name}
**Activity Details**: ${activity_details}
**Highest Role**: ${target.roles.highest.name}



        `, allowedMentions: { repliedUser: false }
            });
            /***Roles**:
            ${target.roles.cache.map(r => r).join(" ")}*/
        } catch (err) {
            interaction.reply(`Invalid user / id, User offline or an error occurred\n\`${err}\``);
        }
    }
};