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
  
        const voiceChannel = message.member.voice.channel;
  
        // Check the argument to determine if muting or unmuting
        const action = args[0]?.toLowerCase() ?? 'mute';
        if (action === 'mute') {
        // Mute all members except the executor
            voiceChannel.members.forEach(async (member) => {
                if (member.id !== message.author.id) {
                    try {
                        await member.voice.setMute(true);
                    } catch (error) {
                        console.error(`Failed to mute member ${member.user.tag}:`, error);
                    }
                }
            });
  
            message.reply('Successfully muted all members except yourself.');
        } else if (action === 'unmute') {
        // Unmute all members
            voiceChannel.members.forEach(async (member) => {
                try {
                    await member.voice.setMute(false);
                } catch (error) {
                    console.error(`Failed to unmute member ${member.user.tag}:`, error);
                }
            });
  
            message.reply('Successfully unmuted all members.');
        } else {
            message.reply('Invalid argument. Please specify either "mute" or "unmute".');
        }
    }
};