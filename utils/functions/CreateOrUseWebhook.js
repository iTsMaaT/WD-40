const CreateOrUseWebhook = async function(message, name) {
    const webhooks = await message.channel.fetchWebhooks();
    let webhook = webhooks.filter(webhook => webhook.name == name)[0];

    if (!webhook) {
        webhook = await message.channel.createWebhook({
            name: name
        });
    }
    return webhook;
};
module.exports = CreateOrUseWebhook;