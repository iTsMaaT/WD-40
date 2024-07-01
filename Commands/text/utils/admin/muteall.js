const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "muteall",
    description: "Mutes all user in a channel except self",
    category: "admin",
    usage: {
        optional: {
            "mute|m": "Mute all users in the channel",
            "unmute|um": "Unmute all users in the channel",
        },
    },
    admin: true,
    permissions: ["MuteMembers"],
    aliases: ["ma"],
    execute(logger, client, message, args, found) {
  
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) 
            return SendErrorEmbed(message, "You need to be in a voice channel to use this command.", "yellow");
        
  
        const voiceChannel = message.member.voice.channel;

        const embed = {
            color: 0xffffff,
            title: "",
            timestamp: new Date(),
        };
  
        // Check the argument to determine if muting or unmuting
        if (found["-mute|m"] || Object.keys(found).length === 0) {
        // Mute all members except the executor
            voiceChannel.members.forEach(async (member) => {
                if (!member.user.bot && member.id !== message.author.id) {
                    try {
                        await member.voice.setMute(true);
                    } catch (error) {
                        logger.error(`Failed to mute member ${member.user.tag}:`);
                    }
                }
            });
  
            embed.title = "Successfully muted all members except yourself.";
        } else if (found["-unmute|um"]) {
        // Unmute all members
            voiceChannel.members.forEach(async (member) => {
                try {
                    await member.voice.setMute(false);
                } catch (error) {
                    logger.error(`Failed to unmute member ${member.user.tag}:`);
                }
            });
  
            embed.title = "Successfully unmuted all members.";
            message.reply({ embeds: [embed] });
        } else {
            SendErrorEmbed(message, "Invalid argument. Please specify either \"mute\" or \"unmute\".", "yellow");
        }
    },
};