const embedGenerator = require("@utils/helpers/embedGenerator");
const { ChannelType } = require("discord.js");

module.exports = {
    name: "serverinfo",
    description: "Gives info about the server",
    category: "info",
    aliases: ["sinfo"],
    execute: async (logger, client, message, args, optionalArgs) => {
        try {
            const guild = message.guild;
            const owner = await guild.fetchOwner();

            const channels = guild.channels.cache;
            const textChannels = channels.filter((ch) => ch.type === ChannelType.GuildText).size;
            const voiceChannels = channels.filter((ch) => ch.type === ChannelType.GuildVoice).size;
            const threadChannels = channels.filter((ch) => [ChannelType.PublicThread, ChannelType.PrivateThread].includes(ch.type)).size;
            const stageChannels = channels.filter((ch) => ch.type === ChannelType.GuildStageVoice).size;
            const categoryChannels = channels.filter((ch) => ch.type === ChannelType.GuildCategory).size;

            const members = guild.members.cache;
            const userCount = members.filter((m) => !m.user.bot).size;
            const botCount = members.filter((m) => m.user.bot).size;

            const boosts = guild.premiumSubscriptionCount;
            const boostTier = guild.premiumTier;

            const roleCount = guild.roles.cache.size;
            const emojiCount = guild.emojis.cache.size;

            const serverInfoEmbed = {
                title: "Server Info",
                color: 0xffffff,
                thumbnail: {
                    url: guild.iconURL({ dynamic: true }) || "",
                },
                fields: [
                    {
                        name: "General",
                        value: 
                            `Server Name: **${guild.name}**\n` + 
                            `Region: **${guild.preferredLocale}**\n` + 
                            `Created At: <t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)\n` + 
                            `Owner: **${owner}**\n` + 
                            `Description: **${guild.description || "No description available"}**`,
                    },
                    {
                        name: "Users",
                        value: 
                            `Users: **${userCount}**\n` + 
                            `Bots: **${botCount}**\n` + 
                            `Total Members: **${guild.memberCount}**\n` +
                            `Online: **${members.filter((m) => m.presence?.status === "online").size}**\n` + 
                            `Do Not Disturb: **${members.filter((m) => m.presence?.status === "dnd").size}**\n` + 
                            `Idle: **${members.filter((m) => m.presence?.status === "idle").size}**\n` + 
                            `Offline: **${members.filter((m) => m.presence?.status === "offline").size}**`,
                    },
                    {
                        name: "Channels",
                        value: 
                            `Text Channels: **${textChannels}**\n` + 
                            `Voice Channels: **${voiceChannels}**\n` + 
                            `Thread Channels: **${threadChannels}**\n` + 
                            `Stage Channels: **${stageChannels}**\n` + 
                            `Category Channels: **${categoryChannels}**\n` + 
                            `Total Channels: **${channels.size}**`,
                    },
                    {
                        name: "Server Features",
                        value: 
                            `Boosts: **${boosts}**\n` + 
                            `Boost Tier: **${boostTier}**\n` + 
                            `Roles: **${roleCount}**\n` + 
                            `Emojis: **${emojiCount}**\n` + 
                            `Invites: **${guild.invites.size ?? 0}**\n` + 
                            `Verification Level: **${guild.verificationLevel}**`,
                    },
                    {
                        name: "Member Activity",
                        value: 
                            `Text Activity: **${members.filter((m) => m.presence?.activities.some((activity) => activity.type === "PLAYING")).size}**\n` +
                            `Listening to Music: **${members.filter((m) => m.presence?.activities.some((activity) => activity.type === "LISTENING")).size}**\n` + 
                            `Streaming: **${members.filter((m) => m.presence?.activities.some((activity) => activity.type === "STREAMING")).size}**`,
                    },
                    {
                        name: "Voice Channels",
                        value: 
                            `Total VCs: **${voiceChannels}**\n` + 
                            `Users in VCs: **${members.filter((m) => m.voice.channel).size}**`,
                    },
                    {
                        name: "Server Statistics",
                        value: 
                            `Roles Count: **${roleCount}**\n` + 
                            `Emojis: **${emojiCount}**\n` + 
                            `Total Bans: **${guild.bans.cache.size}**\n` + 
                            `Total Invites: **${guild.invites.cache.size}**`,
                    },
                ],
                
                
                timestamp: new Date(),
            };

            await message.reply({ embeds: [serverInfoEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Failed to get server info")] });
        }
    },
};
