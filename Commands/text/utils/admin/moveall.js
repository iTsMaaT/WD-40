module.exports = {
    name: "muteall",
    description: "Deafens all user in a channel except self",
    category: "admin",
    usage: "< -mute / -unmute >",
    admin: true,
    private: true,
    execute(logger, client, message, args) {
  
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
            return message.reply('You need to be in a voice channel to use this command.');
        }
  
        // Check if a channel ID is provided
        const channelID = args[0];
        if (!channelID) {
            return message.reply('Please provide a valid channel ID.');
        }
  
        const voiceChannel = message.member.voice.channel;
        const targetChannel = message.guild.channels.cache.get(channelID);
  
        // Check if the target channel exists and is a voice channel
        if (!targetChannel || targetChannel.type !== 'GUILD_VOICE') {
            return message.reply('Please provide a valid voice channel ID.');
        }
  
        // Move all members except the executor to the target channel
        voiceChannel.members.forEach(async (member) => {
            if (member.id !== message.author.id) {
                try {
                    await member.voice.setChannel(targetChannel);
                } catch (error) {
                    console.error(`Failed to move member ${member.user.tag}:`, error);
                }
            }
        });
  
        message.reply('Successfully moved all members to the specified channel.');
    },
};
  