module.exports = {
  name: 'autoplay',
  description: "Will find similar music to try and continue playing songs after the queue",
  category: "music",
  inVoiceChannel: true,
  execute: async (logger, client, message, args) => {
    const queue = client.distube.getQueue(message)
    if (!queue) {
      AutoEmbed = {
        color: 0xffff00,
        title: `There is nothing in the queue right now!`,
        timestamp: new Date(),
    }
    return message.reply({ embeds: [AutoEmbed], allowedMentions: { repliedUser: false }} );
    }
    const autoplay = queue.toggleAutoplay()
    AutoEmbed = {
      color: 0xff0000,
      title: `Autoplay`,
      description: autoplay ? 'On' : 'Off',
      timestamp: new Date(),
  }
  message.reply({ embeds: [AutoEmbed], allowedMentions: { repliedUser: false }} );
  }
}
