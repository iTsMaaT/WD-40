module.exports = {
  name: 'autoplay',
  description: "Will find similar music to try and continue playing songs after the queue",
  category: "music",
  inVoiceChannel: true,
  execute: async (logger, client, message, args) => {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`There is nothing in the queue right now!`)
    const autoplay = queue.toggleAutoplay()
    message.channel.send(`AutoPlay: \`${autoplay ? 'On' : 'Off'}\``)
  }
}
