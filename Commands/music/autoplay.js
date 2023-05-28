const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")

module.exports = {
  name: 'autoplay',
  description: "Will find similar music to try and continue playing songs after the queue",
  category: "music",
  inVoiceChannel: true,
  execute: async (logger, client, message, args) => {
    const queue = client.distube.getQueue(message)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")

    const autoplay = queue.toggleAutoplay()
    AutoEmbed = {
      color: 0xffffff,
      title: `Autoplay`,
      description: autoplay ? 'On' : 'Off',
      timestamp: new Date(),
  }
  message.reply({ embeds: [AutoEmbed], allowedMentions: { repliedUser: false }} );
  }
}
