module.exports = {
    name: "inviteinfo",
    description: "Gives info on an invite",
    category: "info",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
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
                footer: { text: `${invite.guild.available ? "" : "The server is unavailable"}` },
            };
  
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await message.reply("An error occurred while fetching invite information.");
        }
    },
};
  
function formatObject(obj) {
    let formatted = "";
    for (const key in obj) {
        const value = obj[key] !== null ? obj[key] : "-";
        formatted += `**${key}:** ${value}\n`;
    }
    return formatted;
}
  