const { useQueue, useMainPlayer } = require("discord-player");
const { lyricsExtractor } = require("@discord-player/extractor");
const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "lyrics",
    description: "Gives lyrics for the currently playing song",
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
        const player = useMainPlayer();

        if (!queue || !queue.tracks || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue / currently playing.")] });

        const results = await player.lyrics.search({ q: queue.currentTrack.title });
        if (!results) return await message.reply({ embeds: [embedGenerator.error("Couldn't find lyrics.")] });
        const lyrics = results[0];
        const plainLyrics = lyrics?.plainLyrics;

        if (!plainLyrics) return await message.reply({ embeds: [embedGenerator.error("Couldn't find lyrics.")] });

        const trimmedLyrics = plainLyrics.substring(0, 1997);

        const embed = embedGenerator.info({
            title: lyrics.name,
            description: trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics,
        }).setAuthor({ 
            name: lyrics.artistName,
        });

        await message.reply({ embeds: [embed] });
    },
};