const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")

module.exports = {
  name: "play",
  description: "Play a song",
  usage: "< [Song]: song link or query >",
  category: "music",
  async execute(logger, client, message, args) {
    /*if (args[0].includes("open.spotify.com/")) {
      message.reply("Spotify links are not supported.");
      return;
    }*/
    const string = args.join(' ')
    const research = await player.search(string, {
      requestedBy: message.member,
      searchEngine: QueryType.AUTO
    });

    const queue = await player.createQueue(message.guild, {
      metadata: message.channel,
      spotifyBridge: true,
      initialVolume: 75,
      leaveOnEnd: true
    });

    if (!research || !research.tracks.length) return SendErrorEmbed(message, "No results found", "red")

    play_embed = {
      color: 0xffffff,
      description: `Request received, fetching...`,
      timestamp: new Date(),
    }

    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")
    if (!string) return SendErrorEmbed(message, "Please enter a song URL or query to search.", "yellow")

    try {
      if (!queue.connection) await queue.connect(message.member.voice.channel);
    } catch {
      await player.deleteQueue(message.guild.id);
      return SendErrorEmbed(message, "Unable to join voice channel.", "red")
    }

    message.reply({ embeds: [play_embed], allowedMentions: { repliedUser: false } });

    research.playlist ? queue.addTracks(research.tracks) : queue.addTrack(research.tracks[0]);

    if (!queue.playing) await queue.play();

  }
}
