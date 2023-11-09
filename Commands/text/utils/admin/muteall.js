const { SendErrorEmbed } = require("@functions/discordFunctions");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "muteall",
    description: "Mutes all user in a channel except self",
    category: "admin",
    usage: "< -mute / -unmute >",
    admin: true,
    permissions: [PermissionFlagsBits.MuteMembers],
    aliases: ["ma"],
    execute(logger, client, message, args) {
  
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
        const action = args[0]?.toLowerCase() ?? "-mute";
        if (action === "-mute") {
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
        } else if (action === "-unmute") {
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