const { ChannelType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "channelinfo",
    description: "Provides detailed information about a channel",
    usage: {
        required: {
            "channel": "The name, ID, or mention of the channel to get info from (optional)",
        },
    },
    category: "info",
    aliases: ["cinfo"],
    execute: async (logger, client, message, args, flags) => {
        let channel;

        // Determine the channel
        if (!args[0]) {
            channel = message.channel; // Default to the current channel
        } else {
            const rawId = args[0].replace(/[<!#>]/g, "");

            if (!rawId.match(/^\d+$/)) {
                channel = message.guild.channels.cache.find(
                    ch => ch.name.toLowerCase() === args.join(" ").toLowerCase(),
                );
            } else {
                channel = await message.guild.channels.fetch(rawId).catch(() => null);
            }
        }

        if (!channel) 
            return message.reply({ embeds: [embedGenerator.error("Channel not found.")] });
        

        try {
            const fields = [
                { name: "Channel ID", value: channel.id || "-" },
                { name: "Channel Type", value: ChannelType[channel.type] || "Unknown" },
                { name: "Category", value: channel.parent?.name || "None" },
                { name: "Position", value: channel.position.toString() || "-" },
                { name: "Created At", value: channel.createdTimestamp ? new Date(channel.createdTimestamp).toUTCString() : "-" },
                { name: "Topic", value: channel.topic || "No topic set" },
            ];

            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
                fields.push({ name: "NSFW", value: channel.nsfw ? "Yes" : "No" });
                fields.push({ name: "Slowmode", value: channel.rateLimitPerUser ? `${channel.rateLimitPerUser} seconds` : "None" });
            }

            if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                fields.push({ name: "Bitrate", value: channel.bitrate ? `${channel.bitrate} kbps` : "Unknown" });
                fields.push({ name: "User Limit", value: channel.userLimit ? `${channel.userLimit} users` : "No limit" });
            }

            const embed = embedGenerator.info({
                title: `Channel Information: ${channel.name}`,
                description: `Details for <#${channel.id}>`,
                fields,
            });

            message.reply({ embeds: [embed] });
        } catch (err) {
            logger.error(err);
            return message.reply({ embeds: [embedGenerator.error("An error occurred while fetching the channel information.")] });
        }
    },
};
