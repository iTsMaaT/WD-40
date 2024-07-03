const { SendErrorEmbed } = require("@functions/discordFunctions");
const { prettyString } = require("@functions/formattingFunctions");

module.exports = {
    name: "userinfo",
    description: "Gives info of a user",
    usage: {
        required: {
            "user": "the username / ID / mention of the user to get info from (optional)",
        },
    },
    category: "info",
    aliases: ["uinfo"],
    execute: async (logger, client, message, args, optionalArgs) => {
        let id;
        let target;
        let status;

        if (!args[0]) {
            id = message.author.id;
        } else {
            const rawId = args[0].replace(/[<!@>]/g, "");
            id = rawId;
            if (!rawId.match(/^\d+$/)) 
                id = client.users.cache.find(u => u.username.toLowerCase() === args.join(" ").toLowerCase()).id;
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
                    logger.log(err);
                    return SendErrorEmbed(message, "User not found.", "red");
                }
            } else {
                logger.error(e);
                return SendErrorEmbed(message, "An error occurred while fetching the user.", "red");
            }
        }

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
                    { name: "Custom Status", value: custom_status || "-" },
                    { name: "Activity Title", value: activity_name || "-" },
                    { name: "Activity Details", value: activity_details || "-" },
                    { name: "Highest Role", value: target.roles?.highest?.name || "-" },
                ],
                timestamp: new Date(),
                color: 0xffffff,
            };

            message.reply({ embeds: [userInfoEmbed]  });
        } catch (err) {
            logger.error(err);
            SendErrorEmbed(message, "An error occured.", "red");
        }
    },
};
