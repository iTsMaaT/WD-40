module.exports = {
    name: 'shuffle',
    description: "Shuffles the playlist",
    category: "music",
    inVoiceChannel: true,
    run: async (logger, client, message, args) => {
      const queue = client.distube.getQueue(message)
      if (!queue) return message.channel.send(`${client.emotes.error} | There is nothing in the queue right now!`)
      queue.shuffle()
      message.channel.send('Shuffled songs in the queue')
    }
  }