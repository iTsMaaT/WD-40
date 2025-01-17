const { getLiveChat, LiveChatEvents, ChatMessageType } = require("discord-player-youtubei");
const { useQueue } = require("discord-player");
const embedGenerator = require("@utils/helpers/embedGenerator");

const liveChatEnabled = new Set();
const activeChats = new Map();
const messageBuffers = new Map(); // Map of {buffer, bufferSize, timer} objects
const MAX_MESSAGE_SIZE = 1000;
const FLUSH_INTERVAL = 7000;

/**
 * Flush the buffer of messages to the channel.
 * 
 * @param {TextChannel} channel - The channel to flush the buffer to.
 * @returns {Promise<void>} A promise that resolves when the buffer is flushed.
 */
const flushBuffer = async (channel) => {
    const buffer = messageBuffers?.get(channel.id)?.buffer;
    if (buffer.length > 0) {
        await channel.sendTyping();
        await channel.send({ embeds: [embedGenerator.info({
            title: "Live Chat",
            description: "```" + buffer.join("\n") + "```",
            footer: { text: "{} = Premium message" },
        })] });
        messageBuffers.set(channel.id, { buffer: [], bufferSize: 0, timer: null });
    }
};

/**
 * Add a message to the buffer.
 * 
 * @param {TextChannel} channel - The channel to add the message to.
 * @param {string} message - The message to add.
 */
const addMessageToBuffer = (channel, message) => {
    let bufferData = messageBuffers.get(channel.id);
    
    // Initialize if bufferData does not exist
    if (!bufferData) {
        bufferData = { buffer: [], bufferSize: 0, timer: null };
        messageBuffers.set(channel.id, bufferData);
    }
    
    bufferData.buffer.push(message);
    bufferData.bufferSize += message.length + 1; // +1 for the newline character

    // If no timer is set, set one
    if (!bufferData.timer) 
        bufferData.timer = setTimeout(() => flushBuffer(channel), FLUSH_INTERVAL);
    
};

/**
 * Handle a message create event for a channel.
 * 
 * @param {TextChannel} channel - The channel the message was sent in.
 * @param {Message} message - The message that was sent.
 * @returns {Promise<void>} A promise that resolves when the message is handled.
 */
const handleMessageCreate = async (channel, message) => {
    const queue = useQueue(channel.guild.id);
    if (!queue || !queue.currentTrack?.raw?.live) {
        channel.send({ embeds: [embedGenerator.warning("Live chat got disabled automatically")] });
        await disableLiveChat(channel);
        return;
    }

    let formattedMessage;
    if (message.type === ChatMessageType.Regular || message.type === ChatMessageType.Premium) {
        if (message.type === ChatMessageType.Premium) 
            formattedMessage = `[{ ${message.author.username} }] ${message.content}`;
        else 
            formattedMessage = `[${message.author.username}] ${message.content}`;

        if (formattedMessage.length > MAX_MESSAGE_SIZE) {
            const chunks = formattedMessage.match(new RegExp(`.{1,${MAX_MESSAGE_SIZE}}`, "g"));
            for (const chunk of chunks) 
                await channel.send(chunk);
            
        } else {
            addMessageToBuffer(channel, formattedMessage);

            const { bufferSize } = messageBuffers.get(channel.id);
            if (bufferSize >= MAX_MESSAGE_SIZE) 
                await flushBuffer(channel);
            
        }
    }
};

/**
 * Enable live chat for a channel.
 * 
 * @param {string} url - The URL of the video to enable live chat for.
 * @param {TextChannel} channel - The channel to enable live chat for.
 * @returns {Promise<void>} A promise that resolves when live chat is enabled.
 */
const enableLiveChat = async (url, channel) => {
    liveChatEnabled.add(channel.id);

    try {
        const chat = await getLiveChat(url); // must be live video. or else it will throw an error
        activeChats.set(channel.id, chat);
        messageBuffers.set(channel.id, { buffer: [], bufferSize: 0, timer: null });

        const messageListener = async (message) => {
            await handleMessageCreate(channel, message);
        };

        chat.on(LiveChatEvents.MessageCreate, messageListener);
        chat.on(LiveChatEvents.StreamEnd, () => disableLiveChat(channel));

        // Store the listener function so it can be removed later
        activeChats.set(channel.id, { chat, messageListener });
    } catch (error) {
        logger.error(`Failed to enable live chat for ${channel.name}: ${error.message}`);
        liveChatEnabled.delete(channel.id);
    }
};

/**
 * Disable live chat for a channel.
 * 
 * @param {TextChannel} channel - The channel to disable live chat for.
 * @returns {Promise<void>} A promise that resolves when live chat is disabled.
 */
const disableLiveChat = async (channel) => {
    liveChatEnabled.delete(channel.id);
    const chatData = activeChats.get(channel.id);

    if (chatData) {
        const { chat, messageListener } = chatData;
        await chat.destroy();
        activeChats.delete(channel.id);
    }

    messageBuffers.delete(channel.id);
};

/**
 * Toggle live chat for a channel.
 * 
 * @param {string} url - The URL of the video to toggle live chat for.
 * @param {TextChannel} channel - The channel to toggle live chat for.
 * @returns {Promise<boolean>} A promise that resolves to true if live chat is enabled, false if it is disabled.
 */
const toggleLiveChat = async function(url, channel) {
    let enabled;
    if (!liveChatEnabled.has(channel.id)) {
        await enableLiveChat(url, channel);
        enabled = true;
    } else { 
        await disableLiveChat(channel);
        enabled = false;
    }

    return enabled;
};

module.exports = {
    toggleLiveChat,
    disableLiveChat,
};
