const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")

module.exports = {
  name: 'skipto',
  description: "Skips to a precise song",
  category: "music",
  inVoiceChannel: true,
  execute: async (logger, client, message, args) => {
    const queue = client.distube.getQueue(message)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")

    if (!args[0]) return SendErrorEmbed(message, "Please enter a number to skip to.", "yellow")

    const num = Number(args[0])
    if (isNaN(num)) return SendErrorEmbed(message, "Invalid number.", "yellow")

    await client.distube.jump(message, num).then(song => {
      message.channel.send({ embeds: [{
        color: 0xffffff,
        title: `Skipped to: ${song.name}.`,
        timestamp: new Date(),
    }] })
    })
  }
}
