const { ApplicationCommandType } = require("discord.js");

module.exports = {
    name: 'User information',
    type: ApplicationCommandType.User,
    execute: async(logger, interaction, client) => {
        const target = interaction.targetMember;
        const status = target.presence;

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
            const presenceStatus = target.presence?.status || "Offline";
            const userInfoEmbed = {
                title: "User Information",
                description: `User Information For: ${target.toString()}`,
                thumbnail: {
                    url: target.user.avatarURL({ dynamic: true }) || "",
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

            await interaction.reply({ embeds: [userInfoEmbed] });
        } catch (err) {
            console.error(err);
            SendErrorEmbed(interaction, "Error.", "red", err);
        }

    },
};