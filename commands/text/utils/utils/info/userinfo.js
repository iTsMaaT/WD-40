const embedGenerator = require("@utils/helpers/embedGenerator");
const { prettyString } = require("@functions/formattingFunctions");
const { ActivityType } = require("discord.js");

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
    execute: async (logger, client, message, args, flags) => {
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
                    return await message.reply({ embeds: [embedGenerator.error("User not found.")] });
                }
            } else {
                logger.error(e);
                return await message.reply({ embeds: [embedGenerator.error("An error occurred while fetching the user.")] });
            }
        }

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

            message.reply({ embeds: [userInfoEmbed]  });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured.")] });
        }
    },
};
