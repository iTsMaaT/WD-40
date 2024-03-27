const { prettyString } = require("@functions/formattingFunctions");
const CreateOrUseWebhook = async function(message, name) {
    const webhooks = await message.channel.fetchWebhooks();
    
    if (webhooks.size > 12) 
        for (const wh in webhooks) await webhook.delete();
    
    let webhook = webhooks.find(wh => wh.name == name);

    if (!webhook) {
        webhook = await message.channel.createWebhook({
            name: name,
        });
    }
    return webhook;
};

const id = function(mention) {
    const cleanId = mention.replace(/[<!@>]/g, "");
    if (!cleanId.match(/^\d+$/)) return null;
    return cleanId;
};

const SendErrorEmbed = async function(message, string, color, isSlash) {
    const embed = {
        title: prettyString(string.toString(), false, true),
        timestamp: new Date(),
        color: 0xffffff,
    };
    if (color == "red") embed.color = 0xff0000;
    else if (color == "yellow") embed.color = 0xffff00;
    if (isSlash) {
        if (!message.deferred) 
            await message.reply({ embeds: [embed] });
        else 
            await message.editReply({ embeds: [embed] });
    
    } else {
        await message.reply({ embeds: [embed] });
    }
};

/**
 * Reacts the provided string to a message
 */
const StringReact = function(client, ChannelID, MessageID, string) {
    const letters = string.toUpperCase().toString();

    for (i = 0; i < letters.length; i++) {
        if (letters[i] === " ") continue;
        const letter = letters[i];
        client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MessageID })
            .then(m => {
                m.react(String.fromCodePoint(letter.codePointAt(0) - 65 + 0x1f1e6));
            }).catch((err) => Logger.error("Error while reacting: " + err));
    }
};

const InfoFromMessageLink = function(link) {
    InfoArray = link.replace("https://discord.com/channels/", "").split("/");
    return InfoArray;
    /*
    [0]: Guild ID
    [1]: Channel ID
    [2]: Message ID
    */
};

const editOrSend = async (messageOptions, add) => {
    const channel = this;
    if (!channel.id) throw new Error("Invalid channel");

    try {
        const message = await message.channel.messages.fetch({ limit: 1 }).first();
        if (add) 
            message.edit(message.content + messageOptions?.content ?? messageOptions);
        else 
            message.edit(messageOptions);
    } catch (err) {
        channel.send(messageOptions);
    }
};

module.exports = { 
    CreateOrUseWebhook,
    id,
    SendErrorEmbed,
    StringReact,
    InfoFromMessageLink,
    editOrSend, 
};