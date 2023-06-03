const { useQueue } = require('discord-player');
const { lyricsExtractor } = require('@discord-player/extractor')
const { EmbedBuilder } = require("discord.js")

module.exports = {
    name: "lyrics",
    description: "Removes a given track",
    usage: "< [Track]: track to remove >",
    category: "music",
    async execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id)
        const genius = lyricsExtractor();

        if (!queue || !queue.tracks || !queue.currentTrack) return SendErrorEmbed(message, "There is nothing in the queue / currently playing.", "yellow")

        const track =(queue?.currentTrack?.title);
		const lyrics = await genius.search(track).catch(() => null);

        if (!lyrics) return SendErrorEmbed(message, "Couldn't find lyrics.", "red")

        const trimmedLyrics = lyrics.lyrics.substring(0, 1997);

        const embed = new EmbedBuilder()
			.setTitle(lyrics.title)
			.setURL(lyrics.url)
			.setDescription(trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics)
			.setColor(0xffffff);
        message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
}