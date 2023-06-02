const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
    name: "playnext",
    description: "Puts a music up next in the queue",
    category: "music",
    usage: "< [Song]: song link or query >",
    async execute(logger, client, message, args) {
        const queue = player.getQueue(message.guild.id)
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")

        const string = args.join(' ')
        const research = await player.search(string, {
            requestedBy: message.member,
            searchEngine: QueryType.AUTO
        });

        if (!research || !research.tracks.length) return SendErrorEmbed(message, "No results found", "red")
        if (research.playlist) return SendErrorEmbed(message, "This command doesn't support playlists.", "red")

        queue.insert(res.tracks[0], 0)


        const song_playing_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription(`The song has been added to the queue.`)
            .setTimestamp()
        message.reply({ embeds: [song_playing_embed], allowedMentions: { repliedUser: false } });
    }
}