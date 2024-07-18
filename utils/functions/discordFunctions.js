const { PermissionsBitField } = require("discord.js");
const { prettyString } = require("@functions/formattingFunctions");

/**
 * Creates a webhook if it doesn't exist, or returns the existing one
 * @param {Message} message The message object
 * @param {string} name The name of the webhook
 * @returns {webhook} The webhook
 */
const CreateOrUseWebhook = async function(message, name) {
    const webhooks = await message.channel.fetchWebhooks();
    
    if (webhooks.size > 12) 
        for (const wh in webhooks) await wh.delete();
    
    let webhook = webhooks.find(wh => wh.name == name);

    if (!webhook) {
        webhook = await message.channel.createWebhook({
            name: name,
        });
    }
    return webhook;
};

/**
 * Extracts the ID from a mention
 * @param {string} mention The mention
 * @returns {string} The ID
 */
const id = function(mention) {
    const cleanId = mention.replace(/[<!@>]/g, "");
    if (!cleanId.match(/^\d+$/)) return null;
    return cleanId;
};

/**
 * Sends an error embed
 * @param {Message} message The message object
 * @param {string} string The error message
 * @param {string} color The color of the embed
 * @param {boolean} isSlash Whether the message is a slash command
 */
const SendErrorEmbed = async function(message, string, color) {
    const embed = {
        title: prettyString(string.toString(), false, true),
        timestamp: new Date(),
        color: 0xffffff,
    };
    if (color == "red") embed.color = 0xff0000;
    else if (color == "yellow") embed.color = 0xffff00;
    if (message.deferred)
        await message.editReply({ embeds: [embed] });
    else
        await message.reply({ embeds: [embed] });
};

/**
 * Reacts the provided string to a message
 * @param {Client} client The client
 * @param {string} ChannelID The channel ID
 * @param {string} MessageID The message ID
 * @param {string} string The string to react
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

/**
 * Extracts the information from a message link
 * @param {string} link The message link
 * @returns {Array} The information array
 */
const InfoFromMessageLink = function(link) {
    InfoArray = link.replace("https://discord.com/channels/", "").split("/");
    return InfoArray;
    /*
    [0]: Guild ID
    [1]: Channel ID
    [2]: Message ID
    */
};

/**
 * Edits or sends a message
 * @param {Channel} channel The channel object
 * @param {string|object} messageOptions The message options
 * @param {boolean} add Whether to add or edit
 */
async function editOrSend(channel, messageOptions, add) {
    if (!channel.id) throw new Error("Invalid channel");

    try {
        const messages = await channel.messages.fetch();
        const message = messages.first();
        let fullNewContent;
        let newContent = typeof messageOptions == "object" ? messageOptions.content : messageOptions;
        let oldContent = message.content.trim();
        const wasCodeBlock = (oldContent.startsWith("```") && oldContent.endsWith("```"));
        const isCodeBlock = (oldContent.startsWith("```") && oldContent.endsWith("```"));
        console.log(wasCodeBlock);
        if (wasCodeBlock) oldContent = oldContent.replaceAll("```", "");
        if (isCodeBlock) newContent = newContent.replaceAll("```", "");
        console.log(oldContent);

        console.log(message.content);
        console.log(isCodeBlock);
        console.log(wasCodeBlock);

        if (add) {
            if (wasCodeBlock && isCodeBlock) 
                fullNewContent = `\`\`\`${oldContent}\n${typeof messageOptions == "object" ? messageOptions.content : messageOptions}`;
            else
                fullNewContent = `${wasCodeBlock ? "```\n" : "" }${oldContent}${wasCodeBlock ? "\n```" : "" }${wasCodeBlock && isCodeBlock ? "\n" : "" }${isCodeBlock ? "```\n" : "" }${oldContent}\n${typeof messageOptions == "object" ? messageOptions.content : messageOptions}${isCodeBlock ? "\n```" : "" }`;
        } else {
            fullNewContent = `${wasCodeBlock ? "```" : "" }${typeof messageOptions == "object" ? messageOptions.content : messageOptions}${wasCodeBlock ? "```" : "" }`;
        }
        console.log(fullNewContent);
        message.edit(fullNewContent);

    } catch (err) {
        console.log(err);
        await channel.send(typeof messageOptions == "object" ? messageOptions.content : messageOptions);
    }
}

/**
 * Creates an embed with multiple images
 * @param {object} embedOBJ The embed object
 * @param {string} ...links The image links
 * @returns {Array} The embed array
 */
function multipleImageEmbed(embedOBJ, ...links) {
    if (!links || links.length == 0) throw new Error("Image links missing");
    const mainLink = links[0];
    const embedParts = [];
    embedOBJ.url = mainLink;
    for (const link of links) 
        embedParts.push({ image: { url: link }, url: mainLink });

    return [embedOBJ, ...embedParts];  
}

/**
 * Gets the permission array names from a permission bitfield
 * @param {number} flags The permission bitfield
 * @returns {Array} The permission array names
 */
function getPermissionArrayNames(flags) {
    const array = [];
    const set = new Set(); // Use a Set to store unique values

    for (const flag of flags) {
        for (const [key, value] of Object.entries(PermissionsBitField.Flags)) {
            if (value === flag && !set.has(key)) {
                array.push(key);
                set.add(key); // Add the key to the set to track uniqueness
            }
        }
    }

    return array;
}

module.exports = { 
    CreateOrUseWebhook,
    id,
    SendErrorEmbed,
    StringReact,
    InfoFromMessageLink,
    editOrSend, 
    multipleImageEmbed,
    getPermissionArrayNames,
};