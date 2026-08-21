const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

const requiredPermissions = [
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.CreateGuildExpressions,
    PermissionsBitField.Flags.CreateInstantInvite,
    PermissionsBitField.Flags.DeafenMembers,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.ManageGuildExpressions,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ManageWebhooks,
    PermissionsBitField.Flags.MoveMembers,
    PermissionsBitField.Flags.MuteMembers,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.UseExternalStickers,
    PermissionsBitField.Flags.ViewAuditLog,
    PermissionsBitField.Flags.ViewChannel,
];

module.exports = {
    name: "invitebot",
    aliases: ["addbot", "botinvite"],
    description: "Generates a link to invite the bot to another server",
    category: "utils",
    async execute(logger, client, message, args, flags) {
        const inviteLink = client.generateInvite({
            scopes: ["bot", "applications.commands"],
            permissions: requiredPermissions,
        });

        await message.reply({
            embeds: [embedGenerator.info({
                title: "Bot invite link",
                description: `[Click here to add me to another server](${inviteLink})`,
            }).withAuthor(message.author)],
        });
    },
};
