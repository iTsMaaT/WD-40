const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("discord-voip");
const { Readable } = require("stream");
const { getAllAudioUrls } = require("google-tts-api");
const { fetchGeminiResponse } = require("@utils/helpers/fetchGeminiResponse");
const config = require("@utils/config/configUtils");

module.exports = {
    name: "asktts",
    description: "Ask a question to Gemini, then play the response in the VC",
    usage: {
        required: {
            "prompt": "The prompt to ask Gemini",
        },
    },
    category: "music",
    examples: ["what is the skull emoji used for"],
    permissions: [PermissionsBitField.Flags.Connect],
    cooldown: 30000,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args) {
        let geminiResponse, sent;
        const player = useMainPlayer();
        const queue = useQueue();
        const playerConfig = config.get("discordPlayerConf");

        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("You must provide a prompt.")] });
        if (queue || queue?.tracks || queue?.currentTrack) return await message.reply({ embeds: [embedGenerator.warning("You must stop the music before playing TTS.")] });

        try {
            const apiKey = process.env.GEMINI_API_KEY; // Replace with your API key
            const prompt = args.join(" ");
            if (!prompt) return await message.reply({ embeds: [embedGenerator.warning("Please provide a prompt.")] });
            const owner = await message.guild.fetchOwner();

            sent = await message.reply({ embeds: [embedGenerator.info("Asking Gemini...")] });

            const environmentInfo = {
                guildName: message.guild.name,
                ownerDisplayName: owner.displayName,
                ownerId: owner.id,
                channelId: message.channel.id,
                channelName: message.channel.name,
                currentTime: (new Date()).toUTCString(),
                authorUsername: message.author.username,
                authorDisplayName: message.author.displayName,
                authorId: message.author.id,
            };

            // Fetch Gemini's response using the helper function
            geminiResponse = await fetchGeminiResponse(
                `Consider the following in your responses:
                - Be conversational
                - Do not use emojis nor markdown, as you will be heard in a discord voice chat.
        
                Information about your environment:
                - The server you are in is called: ${environmentInfo.guildName}
                - The server is owned by: ${environmentInfo.ownerDisplayName}
                - The channel you are in is called: ${environmentInfo.channelName}
                - Current time (UTC): ${environmentInfo.currentTime}
                - Do not use emojis nor markdown, as you will be heard in a discord voice chat.
        
                You are not a personal assistant and cannot complete tasks for people. You only have access to a limited number of text chats in this channel. You cannot access any other information on Discord. You can't see images or avatars. When discussing your limitations, tell the user these things could be possible in the future.
                When responding to the following prompt, try to condense your response as much as possible.
                Make sure it is under 2000 characters. 
                The response will be sent in a discord channel. You can use markdown. Also, make sure to use pings so it integrates better with the Discord server.
                The user that asked the prompt is named: ${environmentInfo.authorUsername} (display name: ${environmentInfo.authorDisplayName}).
                The prompt is: ${prompt}`,
                apiKey,
            );

        } catch (err) {
            logger.error(err);

            if (err.message.includes("API key is invalid")) 
                return await message.reply({ embeds: [embedGenerator.error("Invalid API key. Please check your configuration.")] });
            else if (err.name === "AbortError") 
                return await message.reply({ embeds: [embedGenerator.warning("I do not wish to answer that question. (Request timed out)")] });
            else 
                return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }

        try {
            await sent.edit({ embeds: [embedGenerator.info("Getting the TTS...")] });

            const track = (await player.search(`tts:${geminiResponse.substring(0, 1000)}`)).tracks[0];

            if (queue && queue.currentTrack) {
                queue.prepend(track, 0);
                queue.node.skip();
            } else {
                await player.play(message.member.voice.channel.id, track, {
                    nodeOptions: {
                        metadata: {
                            channel: message.channel,
                            client: message.guild.members.me,
                            requestedBy: message.user,
                            guild: message.guild,
                            probableBridgeSource: "TTS",
                        },
                        ...playerConfig.globalPlayerNodeOptions,
                    },
                });
            }

            return await sent.edit({ embeds: [embedGenerator.info("TTS started!")] });
        } catch (err) {
            logger.error(err);
            return await sent.edit({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};