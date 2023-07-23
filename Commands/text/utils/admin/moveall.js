const SendErrorEmbed = require("@functions/SendErrorEmbed");
const { ChannelType } = require("discord.js");

module.exports = {
    name: "moveall",
    description: "Moves all user in a channel to another except self",
    category: "admin",
    usage: "< channelID >",
    admin: true,
    aliases: ['mova'],
    execute(logger, client, message, args) {
  
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
            return SendErrorEmbed(message, 'You need to be in a voice channel to use this command.', "yellow");
        }
  
        // Check if a channel ID is provided
        const channelID = args[0];
        if (!channelID) {
            return SendErrorEmbed(message, 'Please provide a valid channel ID.', "yellow");
        }
  
        const voiceChannel = message.member.voice.channel;
        const targetChannel = message.guild.channels.cache.get(channelID);

        const embed = {
            color: 0xffffff,
            title: '',
            timestamp: new Date(),
        };
  
        // Check if the target channel exists and is a voice channel
        if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
            return SendErrorEmbed(message, 'Please provide a valid voice channel ID.', "yellow");
        }
  
        // Move all members except the executor to the target channel
        voiceChannel.members.forEach(async (member) => {
            if (member.id !== message.author.id) {
                try {
                    await member.voice.setChannel(targetChannel);
                } catch (error) {
                    logger.error(`Failed to move member ${member.user.tag}:`);
                }
            }
        });
  
        embed.title = 'Successfully moved all members to the specified channel.';
        message.reply({ embeds: [embed] });
    },
};
  