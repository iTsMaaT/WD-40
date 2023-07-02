const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed");

module.exports = {
    name: "deafenall",
    description: "Deafens all user in a channel except self",
    category: "admin",
    usage: "< -deafen / -undeafen >",
    admin: true,
    execute(logger, client, message, args) {
      
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
            return SendErrorEmbed(message, 'You need to be in a voice channel to use this command.', "yellow");
        }
      
        const voiceChannel = message.member.voice.channel;

        const embed = {
            color: 0xffffff,
            title: '',
            timestamp: new Date(),
        };
      
        // Check the argument to determine if deafening or undeafening
        const action = args[0]?.toLowerCase() ?? '-deafen';
        if (action === '-deafen') {
            // Deafen all members except the executor
            voiceChannel.members.forEach(async (member) => {
                if (member.id !== message.author.id) {
                    try {
                        await member.voice.setDeaf(true);
                    } catch (error) {
                        console.error(`Failed to deafen member ${member.user.tag}:`, error);
                    }
                }
            });
      
            embed.title = 'Successfully deafened all members except yourself.';
        } else if (action === '-undeafen') {
            // Undeafen all members
            voiceChannel.members.forEach(async (member) => {
                try {
                    await member.voice.setDeaf(false);
                } catch (error) {
                    console.error(`Failed to undeafen member ${member.user.tag}:`, error);
                }
            });
            
            embed.title = 'Successfully undeafened all members.';
            message.reply({ embeds: [enbed] });
        } else {
            SendErrorEmbed(message, 'Invalid argument. Please specify either "deafen" or "undeafen".', "yellow");
        }
    },
};
