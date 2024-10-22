const { ApplicationCommandType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "User information",
    type: ApplicationCommandType.User,
    execute: async (logger, interaction, client) => {
        const target = interaction.targetMember ?? await client.users.fetch(interaction.targetId);
        const status = target.presence;

        let custom_status, activity_name, activity_details;
        try {
            custom_status = status?.activities[0]?.state ?? "`No status`";
            activity_name = status?.activities[1]?.name ?? "`No activity name`";
            activity_details = status?.activities[1]?.details ?? "`No activity details`";
        } catch {
            custom_status = "-";
            activity_name = "-";
            activity_details = "-";
        }

        try {
            const presenceStatus = target?.presence?.status || "Offline";
            const userInfoEmbed = {
                title: target.globalName,
                description: `User Information For: <@${target.id}>`,
                thumbnail: {
                    url: target.avatarURL({ dynamic: true }) || "",
                },
                fields: [
                    { name: "User ID", value: target.id || "-" },
                    { name: "Status", value: presenceStatus || "-" },
                    { name: "Account Age", value: `${target?.user?.createdTimestamp ? `<t:${parseInt(target?.user?.createdTimestamp / 1000)}:R>` : "-"}` },
                    { name: "Member Since", value: `${target.joinedTimestamp ? `<t:${parseInt(target?.joinedTimestamp / 1000)}:R>` : "-"}` },
                    { name: "Custom Status", value: custom_status || "-" },
                    { name: "Activity Title", value: activity_name || "-" },
                    { name: "Activity Details", value: activity_details || "-" },
                    { name: "Highest Role", value: target.roles?.highest?.name || "-" },
                ],
                timestamp: new Date(),
                color: 0xffffff,
            };

            await interaction.editReply({ embeds: [userInfoEmbed]  });
        } catch (err) {
            console.log(err);
            await interaction.editReply({ embeds: [embedGenerator.error("An error occured.")] });
        }

    },
};