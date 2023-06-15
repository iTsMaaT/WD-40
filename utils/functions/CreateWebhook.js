const CreateOrUseWebhook = async function(message, name) {
    let webhook = message.channel.fetchWebhooks();
    webhook = webhook.filter(webhook => webhook.name == name)[0];

    if (!webhook) {
        webhook = await message.channel.createWebhook({
            name: name
        });
    }
    return webhook;
};
module.exports = CreateOrUseWebhook;