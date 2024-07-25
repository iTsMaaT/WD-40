const { ApplicationCommandType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "Preview Invite",
    type: ApplicationCommandType.Message,
    async execute(logger, interaction, client) {
        const regex = /(https?:\/\/|http?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite|discord.com\/invite)\/[^\s/]+?(?=\b)/g;
        const text = interaction.targetMessage.content;
        const invites = text.match(regex);
        if (!invites) return await interaction.editReply({ embeds: [embedGenerator.warning("Couldn't find invite code")], ephemeral: true });
        console.log(invites);

        const invitecodes = [];
        for (const invite of invites) {
            const inviteArray = invite.split("/");
            invitecodes.push(inviteArray[inviteArray.length - 1]);
        }
        
        if (!invitecodes || invitecodes.length <= 0) return await interaction.editReply({ embeds: [embedGenerator.warning("Couldn't find invite code")], ephemeral: true });
  
        await interaction.editReply({ embeds: [embedGenerator.info("Fetching invite information...")], ephemeral: true });
        for (const inv of invitecodes) {
            try {
                const invite = await interaction.client.fetchInvite(inv);
  
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
  
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ embeds: [embedGenerator.error("An error occurred while fetching invite information.")], ephemeral: true });
            }
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