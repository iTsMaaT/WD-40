const prettyString = require("./prettyString");
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

const id = function(mention) {
    const id = mention.replace(/[<!@>]/g, "");
    if (!id.match(/^\d+$/)) return null;
    return id;
};

const SendErrorEmbed = async function(message, string, color, isSlash) {
    var embed = {
        title: prettyString(string.toString(), false, true),
        timestamp: new Date(),
        color: 0xffffff,
    };
    if (color == "red") embed.color = 0xff0000;
    else if (color == "yellow") embed.color = 0xffff00;
    if (isSlash) {
        try{
            await message.reply({ embeds: [embed] });
        } catch(err) {
            await message.editReply({ embeds: [embed] });
        }
    } else {
        await message.reply({ embeds: [embed] });
    }
};

/**
 * Reacts the provided string to a message
 */
const StringReact = function (client, ChannelID, MessageID, string) {
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

module.exports = { CreateOrUseWebhook, id, SendErrorEmbed, StringReact, InfoFromMessageLink };