const SendErrorEmbed = require("../../../utils/functions/SendErrorEmbed");

module.exports = {
    name: "userinfo",
    description: "Gives info of a user",
    usage: "< [User]: the user to get info from (optional) >",
    category: "utils",
    execute: async (logger, client, message, args) => {
        let id;
        let target;
        let status;

        if (!args[0]) {
            id = message.author.id;
        } else {
            const rawId = args[0].replace(/[<!@>]/g, "");
            if (!rawId.match(/^\d+$/)) {
                return SendErrorEmbed(message, "Invalid user ID.");
            }
            id = rawId;
        }

        try {
            target = await message.guild.members.fetch(id);
            status = await message.guild.presences.resolve(id);
        } catch (e) {
            if (e.code === 10007) {
                try {
                    target = await client.users.fetch(id);
                    status = null; // No presence information available
                } catch (err) {
                    console.log(err);
                    return SendErrorEmbed(message, "User not found.", "red");
                }
            } else {
                console.log(e);
                return SendErrorEmbed(message, "An error occurred while fetching the user.", "red");
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
                    { name: "Account Age", value: `<t:${parseInt(target.createdTimestamp / 1000)}:R>` },
                    { name: "Member Since", value: `${target.joinedTimestamp ? `<t:${parseInt(target.joinedTimestamp / 1000)}:R>` : `-`}` },
                    { name: "Custom Status", value: custom_status },
                    { name: "Activity Title", value: activity_name },
                    { name: "Activity Details", value: activity_details },
                    { name: "Highest Role", value: target.roles?.highest?.name || "-" },
                ],
                timestamp: new Date(),
                color: 0xffffff,
            };

            message.reply({ embeds: [userInfoEmbed], allowedMentions: { repliedUser: false } });
        } catch (err) {
            SendErrorEmbed(message, "Error.", "red", err);
        }
    },
};
