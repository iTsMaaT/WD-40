const { useQueue } = require('discord-player');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const SendErrorEmbed = require("@functions/SendErrorEmbed");

module.exports = {
    name: 'tts',
    description: 'Play a text-to-speech message in the voice channel',
    usage: '< [Text]: text to say >',
    category: 'music',
    async execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);
        let connection;

        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");
        if (!args[0]) return SendErrorEmbed(message, "You must provide a prompt.", "yellow");
        if (queue || queue?.tracks || queue?.currentTrack) return SendErrorEmbed(message, "You must stop the music before playing TTS.", "yellow");

        const text = args.join(' ');

        if (text.lenght > 200) return SendErrorEmbed(message, "The prompt must be shorter than 200 characters", "yellow");

        try {
            connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.channel.guild.id,
                adapterCreator: message.channel.guild.voiceAdapterCreator,
            });
        } catch(err) {
            logger.error(err);
            return SendErrorEmbed(message, "Connection the the voice channel failed", "red");
        }

        const url = googleTTS.getAudioUrl(text, {
            lang: 'fr',
            slow: true,
            host: 'https://translate.google.com',
        });

        try {
            const resource = createAudioResource(url, {
                inlineVolume: true
            });

            const player = createAudioPlayer();
            connection.subscribe(player);
            player.play(resource);
        } catch (err) {
            logger.error(err);
            return SendErrorEmbed(message, "Error while trying to play the TTS", "red");
        }

        connection.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        message.reply({ embeds: [{title : "Attempting to join the Voice Channel...", timestamp : new Date()}] });
    },
};
