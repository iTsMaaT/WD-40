const { SendErrorEmbed } = require("@functions/discordFunctions");
const { useQueue } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const googleTTS = require("google-tts-api");
const got = require("got");
const { PermissionFlagsBits } = require("discord.js");


module.exports = {
    name: "asktts",
    description: "Ask a question to PaLM, then play the response in the VC",
    usage: "< prompt >",
    category: "music",
    examples: ["what is the skull emoji used for"],
    permissions: [PermissionFlagsBits.Connect],
    cooldown: 10000,
    execute: async (logger, client, message, args) => {
        let response, connection, sent;
        const queue = useQueue(message.guild.id);

        const embed = {
            title: "",
            color: 0xffffff,
            timestamp: new Date(),
        };

        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");
        if (!args[0]) return SendErrorEmbed(message, "You must provide a prompt.", "yellow");
        if (queue || queue?.tracks || queue?.currentTrack) return SendErrorEmbed(message, "You must stop the music before playing TTS.", "yellow");

        try {
            embed.title = "Requesting a response from PaLM.";

            sent = await message.reply({ embeds: [embed] });

            const prompt = `When responding to the following prompt, try to condense your response. Make sure it is under 1000 characters. This prompt is gonna be played inside a Voice Chat, so please do not use markdown. Prompt: ${args.join(" ")}`;
            const result = await got(`${process.env.PALM_API_PROXY_URL}?api_key=${process.env.PALM_API_KEY}&prompt=${encodeURIComponent(prompt)}`, {
                timeout: {
                    request: 10000,
                },
            });
            
            response = limitString(JSON.parse(result.body).response, 1000);

        } catch (err) {
            if (err.name == "TimeoutError") return SendErrorEmbed(message, "I do not wish to answer that question. (Request timed out)", "yellow");
            SendErrorEmbed(message, "An error occurred.", "red");
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
            return SendErrorEmbed(message, "Connection to the voice channel failed", "red");
        }

        const audioUrls = googleTTS.getAllAudioUrls(response, {
            lang: "fr",
            slow: true,
            host: "https://translate.google.com",
            splitPunct: "-",
        });

        try {

            embed.title = "Playing the PaLM's response.";

            await sent.edit({ embeds: [embed] });

            const resources = audioUrls.map(audio => audio.url);

            let currentIndex = 0; // Keep track of the current audio index

            const playNextAudio = () => {
                if (currentIndex < resources.length) {
                    const resource = createAudioResource(resources[currentIndex]);

                    const player = createAudioPlayer();
                    connection.subscribe(player);
                    player.play(resource);

                    player.on(AudioPlayerStatus.Idle, () => {
                        player.stop();

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
            return SendErrorEmbed(message, "Error while trying to play the TTS", "red");
        }

        function limitString(string, limit) {
            if (string.length <= limit) 
                return string;
            else 
                return string.substring(0, limit - 3) + "...";
            
        }
    },
};
