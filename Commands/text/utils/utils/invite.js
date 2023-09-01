const { ChannelType, PermissionsBitField } = require('discord.js');
const SendErrorEmbed = require("@functions/SendErrorEmbed.js");

module.exports = {
    name: "invite",
    category: "utils",
    description: "Creates a invite to the rules or announcements channel",
    private: false,
    async execute(logger, client, message, args) {

        if (!message.member.permissions.has("Administrator") || !message.author.id == process.env.OWNER_ID) SendErrorEmbed(message, "You need to be administrator to execute this command", "yellow");

        const guild = message.guild;

        // Find the rules channel
        var rulesChannel = guild.channels.cache.find((ch) => (ch.name.includes('rule') || ch.name.includes('announcement') || ch.name.includes('general'))
      && ch.type === ChannelType.GuildText
      && ch.permissionsFor(guild.roles.everyone).has(PermissionsBitField.Flags.ViewChannel));

        if (!rulesChannel) {
            rulesChannel = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText);
        }

        if (!rulesChannel) {
            message.reply("Couldn't find a rules channel accessible by everyone.");
            return;
        }

        try {
            // Create an invite to the rules channel
            const invite = await rulesChannel.createInvite({
                maxUses: 1,
                maxAge: 604800, // 7 days in seconds
                unique: true
            });

            message.reply({ content: `Here's the invite to the server: ${invite.url}` });
        } catch (error) {
            console.error('Error creating invite:', error);
            message.reply('An error occurred while creating the invite.');
        }
    }
};
