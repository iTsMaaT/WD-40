const { useQueue } = require('discord-player');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const { SendErrorEmbed } = require("@functions/discordFunctions");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: 'tts',
    description: 'Play a text-to-speech message in the voice channel',
    usage: '< [Text]: text to say >',
    category: 'music',
    examples: ["i love eating baguettes"],
    permissions: [PermissionFlagsBits.Connect],
    async execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);
        let connection;

        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");
        if (!args[0]) return SendErrorEmbed(message, "You must provide a prompt.", "yellow");
        if (queue || queue?.tracks || queue?.currentTrack) return SendErrorEmbed(message, "You must stop the music before playing a TTS.", "yellow");

        if (args.filter(word => word.length > 200).length) return SendErrorEmbed(message, "The prompt contains a word longer than 200 characters", "yellow");

        const text = args.join(' ');

        if (text.length > 1000) return SendErrorEmbed(message, "The prompt must be shorter than 1000 characters", "yellow");

        try {
            connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
        } catch(err) {
            logger.error(err);
            return SendErrorEmbed(message, "Connection to the voice channel failed", "red");
        }

        const audioUrls = googleTTS.getAllAudioUrls(text, {
            lang: 'fr',
            slow: true,
            host: 'https://translate.google.com',
            splitPunct: '-',
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
            return SendErrorEmbed(message, "Error while trying to play the TTS", "red");
        }

        message.reply({ embeds: [{ title: "Playing the TTS", timestamp: new Date(), color: 0xffffff }] });
    },
};
