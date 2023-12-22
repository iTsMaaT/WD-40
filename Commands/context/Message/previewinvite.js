const { ApplicationCommandType } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "Preview Invite",
    type: ApplicationCommandType.Message,
    execute: async (logger, interaction, client) => {
        await interaction.deferReply();

        const regex = /(https?:\/\/|http?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite|discord.com\/invite)\/[^\s/]+?(?=\b)/;
        const text = interaction.targetMessage.content;
        const invites = text.match(regex);

        const inviteCode = invites[0]?.replace("https://discord.gg/", "")?.replace("https://discord.com/invite/", "");
        if (!inviteCode || inviteCode == "") SendErrorEmbed(interaction, "Couldn't find invite code", "red");
  
        {try {
            const invite = await interaction.client.fetchInvite(inviteCode);
  
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
  
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply("An error occurred while fetching invite information.");
        }}
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