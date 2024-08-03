const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "deafenall",
    description: "Deafens all user in a channel except self",
    category: "admin",
    usage: {
        optional: {
            "deafen|d": "Deafen all users in the channel",
            "undeafen|und": "Undeafen all users in the channel",
        },
    },
    admin: true,
    permissions: [PermissionsBitField.Flags.DeafenMembers],
    aliases: ["deafa"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) 
            return await message.reply({ embeds: [embedGenerator.warning("You need to be in a voice channel to use this command.")] });
        
        const voiceChannel = message.member.voice.channel;
        if (!optionalArgs["deafen|d"] && !optionalArgs["undeafen|und"]) return await message.reply({ embeds: [embedGenerator.warning("Invalid argument. Please specify either \"-deafen\" or \"-undeafen\".")] });
        const deafenBool = optionalArgs["deafen|d"] || Object.keys(optionalArgs).length === 0;

        voiceChannel.members.forEach(async (member) => {
            if (!member.user.bot && member.id !== message.author.id) {
                try {
                    await member.voice.setDeaf(deafenBool);
                } catch (error) {
                    logger.error(`Failed to ${deafenBool ? "deafen" : "undeafen"} member ${member.user.tag}:`);
                }
            }
        });

        const embed = embedGenerator.info(deafenBool ? "Successfully deafened all members except yourself." : "Successfully undeafened all members.")
            .withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
};
