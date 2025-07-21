const { PermissionsBitField } = require("discord.js");
const { prettyString } = require("@functions/formattingFunctions");
const { WebhookClient } = require("discord.js");

/**
 * Creates a webhook if it doesn't exist, or returns a new one with a valid token.
 * @param {Channel} channel The channel object
 * @param {string} name The name of the webhook
 * @returns {Promise<WebhookClient>} The webhook client with token
 */
async function createOrUseWebhook(channel, name) {
    const webhooks = await channel.fetchWebhooks();
        
    // Delete oldest webhooks if there are too many
    if (webhooks.size >= 10) {
        const oldestWebhooks = Array.from(webhooks.values())
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            .slice(0, 3); // Delete the 3 oldest

        for (const webhook of oldestWebhooks) 
            await webhook.delete("Deleting old webhooks to stay within limits.");
            
    }

    let webhook = webhooks.find(wh => wh.name === name);

    if (!webhook) {
        webhook = await channel.createWebhook({
            name: name,
            reason: "Webhook creation requested",
        });
    } else {
        await webhook.delete("Recreating webhook to ensure token availability.");
        webhook = await channel.createWebhook({
            name: name,
            reason: "Recreated webhook to retrieve token.",
        });
    }

    return new WebhookClient({ id: webhook.id, token: webhook.token });
}


/**
 * Extracts the ID from a mention
 * @param {string} mention The mention
 * @returns {string} The ID
 */
const id = function(mention) {
    const cleanId = mention.replace(/[<!@>]/g, "");
    if (!/^\d+$/.test(cleanId)) return null;
    return cleanId;
};

/**
 * Reacts the provided string to a message
 * @param {Client} client The client
 * @param {string} ChannelID The channel ID
 * @param {string} MessageID The message ID
 * @param {string} string The string to react
 */
const stringReact = function(client, ChannelID, MessageID, string) {
    const letters = string.toUpperCase().toString();

    for (i = 0; i < letters.length; i++) {
        if (letters[i] === " ") continue;
        const letter = letters[i];
        client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MessageID })
            .then(m => {
                m.react(String.fromCodePoint(letter.codePointAt(0) - 65 + 0x1f1e6));
            }).catch(() => null);
    }
};

/**
 * Extracts information from a Discord message link
 * @param {string} link The Discord message link
 * @returns {Object} An object containing guildId, channelId, and messageId
 */
const extractMessageInfo = function(link) {
    if (typeof link !== "string" || !link.startsWith("https://discord.com/channels/")) 
        throw new Error("Invalid Discord message link.");
    

    const parts = link.replace("https://discord.com/channels/", "").split("/");
    if (parts.length !== 3) 
        throw new Error("Message link must contain guildId, channelId, and messageId.");
    

    const [guildId, channelId, messageId] = parts;

    return {
        guildId,
        channelId,
        messageId,
    };
};

/**
 * Edits the latest message in a channel or sends a new one.
 * @param {Channel} channel The channel object
 * @param {string|object} messageOptions The message options (string or object with `content`)
 * @param {boolean} add Whether to add new content to the existing message
 */
async function editOrSend(channel, messageOptions, add) {
    if (!channel?.id) throw new Error("Invalid channel");

    try {
        const messages = await channel.messages.fetch({ limit: 1 });
        const message = messages.first();

        const newContent = typeof messageOptions === "object" ? messageOptions.content : messageOptions;
        let updatedContent;

        if (message) {
            let oldContent = message.content.trim();
            const wasCodeBlock = oldContent.startsWith("```") && oldContent.endsWith("```");
            const isCodeBlock = newContent.startsWith("```") && newContent.endsWith("```");

            if (wasCodeBlock) oldContent = oldContent.slice(3, -3).trim();
            let cleanNewContent = newContent;
            if (isCodeBlock) cleanNewContent = newContent.slice(3, -3).trim();

            if (add) 
                updatedContent = `${wasCodeBlock ? "```\n" : ""}${oldContent}\n${cleanNewContent}${wasCodeBlock ? "\n```" : ""}`;
            else 
                updatedContent = `${wasCodeBlock ? "```\n" : ""}${cleanNewContent}${wasCodeBlock ? "\n```" : ""}`;
            

            await message.edit(updatedContent);
        } else {
            await channel.send(newContent);
        }
    } catch (err) {
        const fallbackContent = typeof messageOptions === "object" ? messageOptions.content : messageOptions;
        await channel.send(fallbackContent);
    }
}

/**
 * Creates an embed with multiple images
 * @param {object} embedOBJ The embed object
 * @param {string} ...links The image links
 * @returns {Array} The embed array
 */
function multipleImageEmbed(embedOBJ, ...links) {
    if (!links || links.length == 0 || !Array.isArray(links)) return [embedOBJ];
    const mainLink = links[0];
    const embedParts = [];
    embedOBJ.url = mainLink;
    for (const link of links) 
        embedParts.push({ image: { url: link }, url: mainLink });

    return [embedOBJ, ...embedParts];  
}

/**
 * Gets the permission array names from a permission bitfield
 * @param {Array<number>} flags The permission bitfield array
 * @returns {Array<string>} The permission array names
 */
function getPermissionArrayNames(flags) {
    return new PermissionsBitField(flags).toArray();
}

/**
 * Fetches all guilds from the client
 * @param {Client} client The client to fetch guilds from
 * @returns {Promise<Map<string, Guild>>} A map of all guilds
 */
async function fetchAllGuildsPaginated() {
    const allGuilds = new Map();
    let after = undefined;
    const limit = 100; // Discord's max per page

    while (true) {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (after) params.append("after", after);

        const res = await fetch(`https://discord.com/api/v10/users/@me/guilds?${params}`, {
            headers: {
                Authorization: `Bot ${process.env.SERVER === "dev" && process.env.DEV_TOKEN ? process.env.DEV_TOKEN : process.env.TOKEN}`,
            },
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Discord API error: ${res.status} - ${err}`);
        }

        const guilds = await res.json();
        for (const g of guilds) allGuilds.set(g.id, g);

        if (guilds.length < limit) break; // done paginating
        after = guilds[guilds.length - 1].id;
    }

    return allGuilds;
}

module.exports = { 
    createOrUseWebhook,
    id,
    stringReact,
    extractMessageInfo,
    editOrSend, 
    multipleImageEmbed,
    getPermissionArrayNames,
    fetchAllGuildsPaginated,
};