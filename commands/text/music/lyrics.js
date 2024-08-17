const { useQueue, useMainPlayer } = require("discord-player");
const { lyricsExtractor } = require("@discord-player/extractor");
const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "lyrics",
    description: "Gives lyrics for the currently playing song",
    category: "music",
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        const player = useMainPlayer();

        if (!queue || !queue.tracks || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue / currently playing.")] });

        const results = await player.lyrics.search({ q: queue.currentTrack });
        if (!results) return await message.reply({ embeds: [embedGenerator.error("Couldn't find lyrics.")] });
        const lyrics = results[0];
        const plainLyrics = lyrics?.plainLyrics;

        if (!plainLyrics) return await message.reply({ embeds: [embedGenerator.error("Couldn't find lyrics.")] });

        const trimmedLyrics = plainLyrics.lyrics.substring(0, 1997);

        const embed = embedGenerator.info({
            title: lyrics.trackName,
            url: lyrics.url,
            description: trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics,
        }).setAuthor({ name: lyrics.artistName });

        await message.reply({ embeds: [embed] });
    },
};