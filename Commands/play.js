const { EmbedBuilder } = require("discord.js")
module.exports = {
  name: "play",
  description: "Play a song",
  execute(logger, client, message, args) {
    if (!message.member.voice.channel) {
      const must_be_in_vc_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`You must be in a voice channel!`)
        .setTimestamp()
      return message.channel.send({ embeds: [must_be_in_vc_embed] })
    }
    const string = args.join(' ')
    if (!message.member.voice.channel) {
      const must_be_in_vc_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`You must be in a voice channel!`)
        .setTimestamp()
      return message.channel.send({ embeds: [must_be_in_vc_embed] })
    }
    const no_query_embed = new EmbedBuilder()
      .setColor("#FF0000")
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
