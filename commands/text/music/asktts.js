const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const googleTTS = require("google-tts-api");

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
    async execute(logger, client, message, args, optionalArgs) {
        let response, connection, sent;
        const queue = useQueue(message.guild.id);

        const embed = {
            title: "",
            color: 0xffffff,
            timestamp: new Date(),
        };

        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("You must provide a prompt.")] });
        if (queue || queue?.tracks || queue?.currentTrack) return await message.reply({ embeds: [embedGenerator.warning("You must stop the music before playing TTS.")] });
        
        embed.title = "Requesting a response from Gemini.";

        try {
            const API_URL = process.env.GEMINI_API_PROXY_URL; // Replace with your API URL
            const apiKey = process.env.GEMINI_API_KEY; // Replace with your API key
                
            const prompt = args.join(" ");
            if (!prompt) return await message.reply({ embeds: [embedGenerator.warning("Please provide a prompt.")] });
    
            const requestBody = {
                api_key: apiKey,
                prompt: `When responding to the following prompt, try to condense your response. Make sure it is under 2000 characters. The response will be heard in a discord voice channel using TTS. You can use markdown. 
                    The user that asked the prompt is named: ${message.author.username} (display name: ${message.author.displayName}).
                    The prompt is: ${prompt}`,
                gemini: true,
            };
    
    
            const result = await fetch(API_URL, { 
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                signal: AbortSignal.timeout(10000),
            });
            if (!result.ok) {
                let errorText;
                try {
                    const errorResponse = await result.json();
                    errorText = JSON.stringify(errorResponse);
                } catch (error) {
                    errorText = await result.text();
                }
                throw new Error(`API request failed with status ${result.status}. Error message: ${errorText}`);
            }

            const jsonResponse = await result.json();
            if (jsonResponse.response) {
                response = jsonResponse.response;
                await handleFollowup(firstReply, requestBody, API_URL);
            } else {
                throw new Error("Unexpected JSON response format");
            }
                
    
        } catch (err) {
            logger.error(err.stack);
    
            if (err.name === "AbortError") 
                return await message.reply({ embeds: [embedGenerator.warning("I do not wish to answer that question. (Request timed out)")] });
            else 
                return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
                
        }

        try {
            embed.title = "Joining the VC.";

            await sent.edit({ embeds: [embed] });

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
            lang: "fr",
            slow: true,
            host: "https://translate.google.com",
            splitPunct: "-",
        });

        try {

            embed.title = "Playing Gemini's response.";

            await sent.edit({ embeds: [embed] });

            const resources = audioUrls.map(audio => audio.url);

            let currentIndex = 0; // Keep track of the current audio index

            const playNextAudio = () => {
                if (currentIndex < resources.length) {
                    const resource = createAudioResource(resources[currentIndex]);

                    const vcPlayer = createAudioPlayer();
                    connection.subscribe(vcPlayer);
                    vcPlayer.play(resource);

                    vcPlayer.on(AudioPlayerStatus.Idle, () => {
                        vcPlayer.stop();

                        currentIndex++; // Move to the next audio index
                        playNextAudio(); // Play the next audio
                    });
                } else {
                    connection.destroy(); // No more audio elements, destroy the connection
                }
            };

            playNextAudio(); // Start playing the first audio
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Error while trying to play the TTS")] });
        }

        function limitString(string, limit) {
            if (string.length <= limit) 
                return string;
            else 
                return string.substring(0, limit - 3) + "...";
            
        }
    },
};