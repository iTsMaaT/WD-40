const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const SendErrorEmbed = require("@functions/SendErrorEmbed");

module.exports = {
    name: 'userinfo',
    description: 'Gives info of a user',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "user",
            description: "The user to check the info from.",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    execute: async(logger, interaction, client) => {
        await interaction.deferReply();
        const guild = await client.guilds.fetch(interaction.guildId);
        const user = interaction.options.getUser("user");
        const id = user ?? interaction.user.id;
        
        let target;
        let status;

        try {
            target = await guild.members.fetch(id);
            status = await guild.presences.resolve(id);
        } catch (e) {
            if (e.code === 10007) {
                try {
                    target = await client.users.fetch(id);
                    status = null; // No presence information available
                } catch (err) {
                    console.log(err);
                    await interaction.editReply({ embeds: [{title: "User not found", color: 0xff0000, timestamp: new Date()}] });
                }
            } else {
                console.log(e);
                return await interaction.editReply({ embeds: [{title: "An error occured.", color: 0xff0000, timestamp: new Date()}] });
            }
        }

        try {
            var custom_status = status?.activities[0]?.state ?? "`No status`";
            var activity_name = status?.activities[1]?.name ?? "`No activity name`";
            var activity_details = status?.activities[1]?.details ?? "`No activity details`";
        } catch {
            custom_status = "-";
            activity_name = "-";
            activity_details = "-";
        }

        try {
            const presenceStatus = target?.presence?.status || "Offline";
            const userInfoEmbed = {
                title: "User Information",
                description: `User Information For: <@${target.id}>`,
                thumbnail: {
                    url: target.avatarURL({ dynamic: true }) || "",
                },
                fields: [
                    { name: "User ID", value: target.id },
                    { name: "Status", value: presenceStatus},
                    { name: "Account Age", value: `<t:${parseInt(target.user.createdTimestamp / 1000)}:R>` },
                    { name: "Member Since", value: `${target.joinedTimestamp ? `<t:${parseInt(target.joinedTimestamp / 1000)}:R>` : `-`}` },
                    { name: "Custom Status", value: custom_status },
                    { name: "Activity Title", value: activity_name },
                    { name: "Activity Details", value: activity_details },
                    { name: "Highest Role", value: target.roles?.highest?.name || "-" },
                ],
                timestamp: new Date(),
                color: 0xffffff,
            };

            await interaction.editReply({ embeds: [userInfoEmbed]  });
        } catch (err) {
            await interaction.editReply({ embeds: [{title: "An error occured.", color: 0xff0000, timestamp: new Date()}] });
        }
    }
};