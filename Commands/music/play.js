const { EmbedBuilder } = require("discord.js")
module.exports = {
  name: "play",
  description: "Play a song",
  category: "music",
  execute(logger, client, message, args) {
    /*if (args[0].includes("open.spotify.com/")) {
      message.reply("Spotify links are not supported.");
      return;
    }*/
    if (!message.member.voice.channel) {
      const must_be_in_vc_embed = new EmbedBuilder()
        .setColor("#ffff00")
        .setDescription(`You must be in a voice channel!`)
        .setTimestamp()
      return message.channel.send({ embeds: [must_be_in_vc_embed] })
    }
    const string = args.join(' ')
    if (!message.member.voice.channel) {
      const must_be_in_vc_embed = new EmbedBuilder()
        .setColor("#ffff00")
        .setDescription(`You must be in a voice channel!`)
        .setTimestamp()
      return message.channel.send({ embeds: [must_be_in_vc_embed] })
    }
    const no_query_embed = new EmbedBuilder()
      .setColor("#ffff00")
      .setDescription(`Please enter a song URL or query to search.`)
      .setTimestamp()
    if (!string) return message.channel.send({ embeds: [no_query_embed] })
    client.distube.play(message.member.voice.channel, string, {
      member: message.member,
      textChannel: message.channel,
      message
    })
  }
}
