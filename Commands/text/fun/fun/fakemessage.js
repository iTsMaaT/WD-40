const id = require("@functions/id");
const CreateOrUseWebhook = require("@functions/CreateOrUseWebhook");
const SendErrorEmbed = require("@functions/SendErrorEmbed.js");

module.exports = {
    name: 'fakemessage',
    description: 'Create a fake message using webhooks',
    category: 'fun',
    aliases: ['fmsg'],
    async execute(logger, client, message, args) {
        let UserID;

        if (!args[0]) return SendErrorEmbed(message, "You must provide a prompt", "yellow");

        if (id(args[0])) {
            UserID = id(args.shift());
        } else {
            UserID = message.author.id;
        }

        const User = await message.guild.members.fetch(UserID).catch(err => {
            return SendErrorEmbed(message, "Couldn't fetch the user", "red");
        });

        // Create a webhook in the target channel
        const webhook = await CreateOrUseWebhook(message, 'FakeMessage');

        // Send the fake message using the webhook
        await webhook.send({
            username: User.nickname || User.user.username,
            avatarURL: User.displayAvatarURL({ format: 'png' }),
            content: args.join(" ")
        });

        // Delete the webhook after sending the fake message
        webhook.delete();
        message.delete();

    },
};
