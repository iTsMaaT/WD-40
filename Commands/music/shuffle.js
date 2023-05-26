module.exports = {
    name: 'shuffle',
    description: "Shuffles the playlist",
    category: "music",
    inVoiceChannel: true,
    execute: async (logger, client, message, args) => {
      const queue = client.distube.getQueue(message)
      if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")
      
      queue.shuffle()
      message.channel.send('Shuffled songs in the queue')
    }
  }