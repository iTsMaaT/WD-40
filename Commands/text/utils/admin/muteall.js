const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

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
    permissions: [PermissionsBitField.Flags.MuteMembers],
    aliases: ["ma"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) 
            return await message.reply({ embeds: [embedGenerator.warning("You need to be in a voice channel to use this command.")] });
        
        const voiceChannel = message.member.voice.channel;
        if (!optionalArgs["mute|m"] && !optionalArgs["unmute|um"]) return await message.reply({ embeds: [embedGenerator.warning("Invalid argument. Please specify either \"-mute\" or \"-unmute\".")] });
        const deafenBool = optionalArgs["mute|m"] || Object.keys(optionalArgs).length === 0;

        voiceChannel.members.forEach(async (member) => {
            if (!member.user.bot && member.id !== message.author.id) {
                try {
                    await member.voice.setMute(deafenBool);
                } catch (error) {
                    logger.error(`Failed to ${deafenBool ? "mute" : "unmute"} member ${member.user.tag}:`);
                }
            }
        });

        const embed = embedGenerator.info(deafenBool ? "Successfully muted all members except yourself." : "Successfully unmuted all members.")
            .withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
};