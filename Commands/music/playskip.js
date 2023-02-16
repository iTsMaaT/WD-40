module.exports = {
  name: 'playskip',
  description: "Skips the entire queue to play a song",
  inVoiceChannel: true,
  category: "music",
  execute: async (logger, client, message, args) => {
    const string = args.join(' ')
    if (!string) return message.channel.send(`${client.emotes.error} | Please enter a song url or query to search.`)
    client.distube.play(message.member.voice.channel, string, {
      member: message.member,
      textChannel: message.channel,
      message,
      skip: true
    })
  }
}
