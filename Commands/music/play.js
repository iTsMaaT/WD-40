module.exports = {
  name: "play",
  description: "Play a song",
  category: "music",
  execute(logger, client, message, args) {
    /*if (args[0].includes("open.spotify.com/")) {
      message.reply("Spotify links are not supported.");
      return;
    }*/
    const string = args.join(' ')

    play_embed = {
      color: 0xffffff,
      description: `Request received, fetching...`,
      timestamp: new Date(),
    }

    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")
    if (!string) return SendErrorEmbed(message, "Please enter a song URL or query to search.", "yellow")
    message.reply({ embeds: [play_embed], allowedMentions: { repliedUser: false } });

    client.distube.play(message.member.voice.channel, string, {
      member: message.member,
      textChannel: message.channel,
      message
    })
  }
}
