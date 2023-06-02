const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")

module.exports = {
  name: 'jump',
  description: "Skips to a precise song",
  usage: "< [Song]: number of the song to skip to >",
  category: "music",
  inVoiceChannel: true,
  execute: async (logger, client, message, args) => {
    const queue = player.getQueue(message.guild.id)
    const track = args.join(' ')
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")

    if (!args[0]) return SendErrorEmbed(message, "Please enter a number to skip to.", "yellow")

    const num = Number(args[0])
    if (isNaN(track)) {
      for (let song of queue.tracks) {
        if (song.title === track || song.url === track) {
          queue.skipTo(song);
          return SendErrorEmbed(message, `Skiped to ${track}`)
        }
      }
    return SendErrorEmbed(message, `Couldn't find song to skip to.`, "red")
    } else {
      const index = track - 1;
      const trackname = queue.tracks[index].title;
      if (!trackname) return SendErrorEmbed(message, `Couldn't find song to skip to.`, "red")
        
      queue.skipTo(index);
      return SendErrorEmbed(message, `Skiped to ${trackname}`)
    }

  }
}
