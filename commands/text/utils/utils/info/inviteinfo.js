const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "inviteinfo",
    description: "Gives info on an invite",
    category: "info",
    aliases: ["iinfo"],
    async execute(logger, client, message, args, flags) {

        const inviteCode = args[0].replace("https://discord.gg/", "").replace("https://discord.com/invite/", "");
  
        try {
            const invite = await message.client.fetchInvite(inviteCode);
  
            const guildInfo = {
                Name: invite.guild.name,
                ID: invite.guild.id,
                "Member Count": invite.guild?.memberCount || invite.memberCount,
                Icon: invite.guild.iconURL({ dynamic: true }),
                Features: invite.guild.features.join(", "),
            };
  
            const channelInfo = {
                Name: invite.channel.name,
                ID: invite.channel.id,
                Type: invite.channel.type,
                NSFW: invite.channel.nsfw,
            };
  
            const inviterInfo = {
                Tag: invite.inviter?.tag || "-",
                ID: invite.inviter?.id || "-",
                Username: invite.inviter?.username || "-",
                Discriminator: invite.inviter?.discriminator || "-",
                Avatar: invite.inviter?.avatarURL({ dynamic: true }) || "-",
            };
  
            const inviteInfo = {
                Code: invite.code,
                "Presence Count": invite.presenceCount,
                "Member Count": invite.memberCount,
                Temporary: invite.temporary || "-",
                "Max Age": invite.maxAge || "-",
                Uses: invite.uses || "-",
                "Max Uses": invite.maxUses || "-",
                "Inviter ID": invite.inviterId,
                "Channel ID": invite.channelId,
                "Created Timestamp": invite.createdTimestamp || "-",
                "Expires Timestamp": invite.expiresTimestamp || "-",
                "Guild Scheduled Event": invite.guildScheduledEvent || "-",
            };
  
            const embed = {
                title: "Invite Information",
                color: 0xffffff,
                thumbnail: { url: guildInfo.Icon },
                fields: [
                    { name: "Guild", value: formatObject(guildInfo) },
                    { name: "Channel", value: formatObject(channelInfo) },
                    { name: "Inviter", value: formatObject(inviterInfo) },
                    { name: "Invite", value: formatObject(inviteInfo) },
                ],
                timestamp: new Date(),
            };
  
            // ensure no field exceeds Discord's limits
            for (const f of embed.fields) {
                f.name = truncate(f.name, 256);
                f.value = truncate(f.value, 1024);
            }
  
            await message.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(error);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred while fetching invite information.")] });
        }
    },
};
  
function truncate(str, maxLen) {
    if (str == null) return "-";
    str = String(str);
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + "...";
}
  
function formatObject(obj, maxLen = 1024) {
    let formatted = "";
    for (const key in obj) {
        let value = obj[key] !== null ? obj[key] : "-";
        value = truncate(value, maxLen);     // cut each individual property
        formatted += `**${key}:** ${value}\n`;
    }
    if (formatted.length > maxLen) 
        formatted = truncate(formatted, maxLen);
    
    return formatted;
}
