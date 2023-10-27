const { SendErrorEmbed } = require("@functions/discordFunctions");
const { PermissionFlagsBits } = require("discord.js");
const { Readable } = require("stream");
const { useQueue } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const fs = require("fs/promises");
const path = require("path");
const { default: got } = require("got");

module.exports = {
    name: "gamer",
    description: "Do not",
    category: "music",
    private: true,
    permissions: [PermissionFlagsBits.Connect],
    async execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);
        let connection;

        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");
        if (queue || queue?.tracks || queue?.currentTrack) return SendErrorEmbed(message, "You must stop the music before playing a TTS.", "yellow");

        try {
            connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
        } catch (err) {
            logger.error(err);
            return SendErrorEmbed(message, "Connection to the voice channel failed", "red");
        }

        const filePath = path.join(__dirname, "Base64Madness.txt");
        let base64Data = await fs.readFile(filePath, { encoding: "utf-8" });
        base64Data = base64Data.replace(/(\n|\s)/g, "");
        const buffer = Buffer.from(base64Data, "base64");
        const stream = new Readable();
        stream._read = () => {/**/};
        stream.push(buffer);
        stream.push(null);

        try {
            const player = createAudioPlayer();
            const resource = createAudioResource(stream);
            
            connection.subscribe(player);
            player.play(resource);

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy(); // No more audio elements, destroy the connection
            });

        } catch (err) {
            logger.error(err);
            return SendErrorEmbed(message, "Error while trying to play the TTS", "red");
        }

        message.reply({ embeds: [{ title: "Gaming", timestamp: new Date(), color: 0xffffff }] });
    },
};