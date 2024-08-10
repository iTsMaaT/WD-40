const { getLiveChat, LiveChatEvents, ChatMessageType } = require("discord-player-youtubei");
const embedGenerator = require("@utils/helpers/embedGenerator");
const cat = require("@root/commands/text/fun/posts/cat");

const liveChatEnabled = new Set();
const activeChats = new Map();
const messageBuffers = new Map(); // Map of {buffer, bufferSize, timer} objects
const MAX_MESSAGE_SIZE = 1000; // Discord's message size limit (in characters)
const FLUSH_INTERVAL = 7000; // 5 seconds

const flushBuffer = async (channel) => {
    const buffer = messageBuffers?.get(channel.id)?.buffer;
    if (buffer.length > 0) {
        await channel.sendTyping();
        await channel.send({ embeds: [embedGenerator.info({
            title: "Live Chat",
            description: "```" + buffer.join("\n") + "```",
        })] });
        messageBuffers.set(channel.id, { buffer: [], bufferSize: 0, timer: null });
    }
};

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

const handleMessageCreate = async (channel, message) => {
    if (message.type === ChatMessageType.Regular || message.type === ChatMessageType.Premium) {
        const formattedMessage = `[${message.author.username}] ${message.content}`;

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

const enableLiveChat = async (url, channel) => {
    liveChatEnabled.add(channel.id);
    console.log(`Live chat enabled for ${channel.name}`);

    try {
        const chat = await getLiveChat(url); // must be live video. or else it will throw an error
        activeChats.set(channel.id, chat);
        messageBuffers.set(channel.id, { buffer: [], bufferSize: 0, timer: null });

        const messageListener = async (message) => {
            await handleMessageCreate(channel, message);
        };

        chat.on(LiveChatEvents.MessageCreate, messageListener);

        // Store the listener function so it can be removed later
        activeChats.set(channel.id, { chat, messageListener });
    } catch (error) {
        console.error(`Failed to enable live chat for ${channel.name}: ${error.message}`);
        liveChatEnabled.delete(channel.id);
    }
};

const disableLiveChat = async (channel) => {
    liveChatEnabled.delete(channel.id);
    const chatData = activeChats.get(channel.id);

    if (chatData) {
        const { chat, messageListener } = chatData;
        chat.off(LiveChatEvents.MessageCreate, messageListener); // Remove the event listener
        activeChats.delete(channel.id);
    }

    await flushBuffer(channel); // Send any remaining messages in the buffer
    messageBuffers.delete(channel.id);
    console.log(`Live chat disabled for ${channel.name}`);
};

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
};
