const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
const { QueryType } = require('discord-player');

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

    if (!research.hasTracks()) return SendErrorEmbed(message, "No results found", "red")

    play_embed = {
      color: 0xffffff,
      description: `Request received, fetching...`,
      timestamp: new Date(),
    }

    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")
    if (!string) return SendErrorEmbed(message, "Please enter a song URL or query to search.", "yellow")

    message.reply({ embeds: [play_embed], allowedMentions: { repliedUser: false } });

    const res = await player.play(message.member.voice.channel.id, research, {
      nodeOptions: {
        metadata: {
          channel: message.channel,
          requestedBy: message.author
        },
        leaveOnEmptyCooldown: 300000,
        leaveOnEmpty: true,
        leaveOnEnd: false,
        bufferingTimeout: 0,
        volume: 75,

      }
    });

  }
}
