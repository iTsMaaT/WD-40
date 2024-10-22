const { PermissionsBitField } = require("discord.js");
const { useQueue, useMainPlayer } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const googleTTS = require("google-tts-api");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "tts",
    description: "Play a text-to-speech message in the voice channel",
    usage: {
        required: {
            "string": "The text that will be speeched",
        },
    },
    category: "music",
    examples: ["i love eating baguettes"],
    permissions: [PermissionsBitField.Flags.Connect],
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        let connection;

        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You must provide a prompt.")] });
        if (queue || queue?.tracks || queue?.currentTrack) return await message.reply({ embeds: [embedGenerator.warning("You must stop the music before playing a TTS.")] });

        if (args.filter(word => word.length > 200).length) return await message.reply({ embeds: [embedGenerator.warning("The prompt contains a word longer than 200 characters")] });

        const text = args.join(" ");

        if (text.length > 1000) return await message.reply({ embeds: [embedGenerator.warning("The prompt must be shorter than 1000 characters")] });

        try {
            connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Connection to the voice channel failed")] });
        }

        const audioUrls = googleTTS.getAllAudioUrls(text, {
            lang: "fr",
            slow: true,
            host: "https://translate.google.com",
            splitPunct: "-",
        });

        try {
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
            return await message.reply({ embeds: [embedGenerator.error("Error while trying to play the TTS")] });
        }

        message.reply({ embeds: [{ title: "Playing the TTS", timestamp: new Date(), color: 0xffffff }] });
    },
};