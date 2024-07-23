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
        const genius = lyricsExtractor();

        if (!queue || !queue.tracks || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue / currently playing.")] });

        const track = (queue?.currentTrack?.title);
        const lyrics = await genius.search(track).catch(() => null);

        if (!lyrics) return await message.reply({ embeds: [embedGenerator.error("Couldn't find lyrics.")] });

        const trimmedLyrics = lyrics.lyrics.substring(0, 1997);

        const embed = embedGenerator.info({
            title: lyrics.title,
            url: lyrics.url,
            description: trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics,
        }).withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
};