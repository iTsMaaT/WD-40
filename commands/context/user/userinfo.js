const { ApplicationCommandType, ActivityType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { prettyString } = require("@functions/formattingFunctions");

module.exports = {
    name: "User information",
    type: ApplicationCommandType.User,
    execute: async (logger, interaction, client) => {
        const target = interaction.targetMember ?? await client.users.fetch(interaction.targetId);
        const status = target.presence;

        const status_type = status?.activities[0]?.type ?? null;
        const custom_status = status?.activities[0]?.state ?? status?.activities[0]?.name ?? "`No status`";
        const activity_name = status?.activities[1]?.name ?? "`No activity name`";
        const activity_details = status?.activities[1]?.details ?? "`No activity details`";
        let status_type_name;

        switch (status_type) {
            case ActivityType.Custom:
                status_type_name = "";
                break;
            case ActivityType.Playing:
                status_type_name = "**Playing **";
                break;
            case ActivityType.Listening:
                status_type_name = "**Listening **";
                break;
            case ActivityType.Competing:
                status_type_name = "**Competing **";
                break;
            case ActivityType.Streaming:
                status_type_name = "**Streaming **";
                break;
            case ActivityType.Watching:
                status_type_name = "**Watching **";
                break;
            default:
                status_type_name = "";
                break;
        }

        const highest_role = target?.roles?.highest ? `<@&${target.roles.highest.id}>` : null;

        try {
            const FullClientStatus = target?.presence?.clientStatus;
            let ClientSatus = "";
            for (const key in FullClientStatus) {
                if (Object.prototype.hasOwnProperty.call(FullClientStatus, key))
                    ClientSatus += `${prettyString(key, "first", false)}: \`${prettyString(FullClientStatus[key], "first", false)}\n\``;
            }

            const userInfoEmbed = {
                title: target.displayName,
                description: `User Information For: <@${target.id}>`,
                thumbnail: {
                    url: target.avatarURL({ dynamic: true }) || "",
                },
                fields: [
                    { name: "User ID", value: target.id || "-" },
                    { name: "Status", value: ClientSatus || "Offline" },
                    { name: "Account Age", value: `${target?.user?.createdTimestamp ? `<t:${parseInt(target?.user?.createdTimestamp / 1000)}:R>` : "-"}` },
                    { name: "Member Since", value: `${target.joinedTimestamp ? `<t:${parseInt(target?.joinedTimestamp / 1000)}:R>` : "-"}` },
                    { name: "Custom Status", value: status_type_name + custom_status || "-" },
                    { name: "Activity Title", value: activity_name || "-" },
                    { name: "Activity Details", value: activity_details || "-" },
                    { name: "Highest Role", value: highest_role || "-" },
                ],
                timestamp: new Date(),
                color: 0xffffff,
            };

            await interaction.editReply({ embeds: [userInfoEmbed] });
        } catch (err) {
            logger.error(err);
            return await interaction.editReply({ embeds: [embedGenerator.error("An error occured.")] });
        }
    },
};