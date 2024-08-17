const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const googleTTS = require("google-tts-api");
const { fetchGeminiResponse } = require("@utils/helpers/fetchGeminiResponse");

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
    cooldown: 10000,
    async execute(logger, client, message, args) {
        let connection, sent;
        const queue = useQueue(message.guild.id);
        const embed = {
            title: "",
            color: 0xffffff,
            timestamp: new Date(),
        };

        // Validation checks
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("You must provide a prompt.")] });
        if (queue || queue?.tracks || queue?.currentTrack) return await message.reply({ embeds: [embedGenerator.warning("You must stop the music before playing TTS.")] });

        embed.title = "Requesting a response from Gemini.";

        try {
            const apiKey = process.env.GEMINI_API_KEY; // Replace with your API key
            const prompt = args.join(" ");
            if (!prompt) return await message.reply({ embeds: [embedGenerator.warning("Please provide a prompt.")] });
            const owner = await message.guild.fetchOwner();

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
            response = await fetchGeminiResponse(
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
            logger.error(err.stack);

            if (err.message.includes("API key is invalid")) 
                return await message.reply({ embeds: [embedGenerator.error("Invalid API key. Please check your configuration.")] });
            else if (err.name === "AbortError") 
                return await message.reply({ embeds: [embedGenerator.warning("I do not wish to answer that question. (Request timed out)")] });
            else 
                return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
            
        }

        // Joining the Voice Channel
        try {
            embed.title = "Joining the VC.";
            sent = await message.reply({ embeds: [embed] });

            connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Connection to the voice channel failed")] });
        }

        const audioUrls = googleTTS.getAllAudioUrls(response, {
            lang: "en", // Change this if you need a different language
            slow: false, // Change this to true if you want the TTS to be slower
            host: "https://translate.google.com",
            splitPunct: "-",
        });

        // Play the TTS response in the VC
        try {
            embed.title = "Playing Gemini's response.";
            await sent.edit({ embeds: [embed] });

            const resources = audioUrls.map(audio => audio.url);
            let currentIndex = 0;

            const playNextAudio = () => {
                if (currentIndex < resources.length) {
                    const resource = createAudioResource(resources[currentIndex]);
                    const vcPlayer = createAudioPlayer();
                    connection.subscribe(vcPlayer);
                    vcPlayer.play(resource);

                    vcPlayer.on(AudioPlayerStatus.Idle, () => {
                        vcPlayer.stop();
                        currentIndex++;
                        playNextAudio();
                    });
                } else {
                    connection.destroy();
                }
            };

            playNextAudio();
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Error while trying to play the TTS")] });
        }
    },
};