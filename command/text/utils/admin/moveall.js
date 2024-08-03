const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { ChannelType } = require("discord.js");

module.exports = {
    name: "moveall",
    description: "Moves all user in a channel to another except self",
    category: "admin",
    usage: {
        required: { 
            "channelID": "ID of the channel to move all users to",
        },
    },
    admin: true,
    permissions: [PermissionsBitField.Flags.MoveMembers],
    aliases: ["mova"],
    async execute(logger, client, message, args, optionalArgs) {
  
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) 
            return await message.reply({ embeds: [embedGenerator.warning("You need to be in a voice channel to use this command.")] });
        
  
        // Check if a channel ID is provided
        const channelID = args[0];
        if (!channelID) 
            return await message.reply({ embeds: [embedGenerator.warning("Please provide a valid channel ID.")] });
        
  
        const voiceChannel = message.member.voice.channel;
        const targetChannel = message.guild.channels.cache.get(channelID);
  
        // Check if the target channel exists and is a voice channel
        if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) 
            return await message.reply({ embeds: [embedGenerator.warning("Please provide a valid voice channel ID.")] });
        
  
        // Move all members except the executor to the target channel
        voiceChannel.members.forEach(async (member) => {
            if (!member.user.bot && member.id !== message.author.id) {
                try {
                    await member.voice.setChannel(targetChannel);
                } catch (error) {
                    logger.error(`Failed to move member ${member.user.tag}:`);
                }
            }
        });
  
        const embed = embedGenerator.info("Successfully moved all members to the specified channel.")
            .withAuthor(message.author);
        message.reply({ embeds: [embed] });
    },
};
  