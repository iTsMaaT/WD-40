const { EmbedBuilder } = require("discord.js")
const fs = require('fs');
module.exports = {
  name: "queue",
  description: "Shows the current queue for songs",
  category: "music",
  execute(logger, client, message, args) {
    let prefix = global.GuildManager.GetPrefix(message.guild);
    const play = "▶️"
    const pause = "⏸️"
    const queue = client.distube.getQueue(message)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")

    if (parseInt(args[0]) <= 1 || parseInt(args[0]) === NaN || !args[0]) {
      const songs = queue.songs
        .map((song, pos) => {
          return `${pos === 0 ? `Behold, the server queue (max 20 at a time) \n Run ${prefix}queue <page number> to see more pages\n Current:` : `#${pos}.`
            } **${song.name}** \`[${song.formattedDuration
            }]\``;
        })
        .slice(0, 20)
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription(
          `${(`${queue.songs.length > 20 ? `1-20/${queue.songs.length}` : queue.songs.length } songs):`, queue.paused ? pause : play )}\n${songs}`
        );

      message.channel.send({
        embeds: [embed],
      });
    } else if (parseInt(args[0]) >= 2) {
      try {
        const songs = queue.songs
          .map((song, pos) => {
            return `${pos === parseInt(args[0]) * 20 - 20 ? `Behold, the server queue (max 20 at a time) \n Run ${prefix}queue <page number> to see more pages\n #${parseInt(args[0]) * 20 - 20}:` : `#${pos}.`
              } **${song.name}** \`[${song.formattedDuration
              }]\``;
          })
          .slice(parseInt(args[0]) * 20 - 20, parseInt(args[0]) * 20)
          .join("\n");

        const embed = new EmbedBuilder()
          .setColor("#ffffff")
          .setTitle(`**Page ${parseInt(args[0])}**`)
          .setDescription(
            `${(
              `${queue.songs.length > 20
                ? `${parseInt(args[0]) * 20 - 20}-${parseInt(args[0]) * 20}/${queue.songs.length}`
                : queue.songs.length
              } songs):`,
              queue.paused
                ? pause
                : play
            )}\n${songs}`
          );

        message.channel.send({
          embeds: [embed],
        });
      }
      catch (err) {
        const songs = queue.songs
          .map((song, pos) => {
            return `${pos === 0 ? `**An error occurred running your command. Is the page number invalid?** \n **${err}**\n Current:` : `#${pos}.`
              } **${song.name}** \`[${song.formattedDuration
              }]\``;
          })
          .slice(0, 20)
          .join("\n");

        const embed = new EmbedBuilder()
          .setColor("#ffffff")
          .setDescription(
            `${(`${queue.songs.length > 20 ? `1-20/${queue.songs.length}` : queue.songs.length } songs):`, queue.paused ? pause : play )}\n${songs}`
          );

        message.reply({
          embeds: [embed], allowedMentions: { repliedUser: false },
        });
      }
    }
  }
}
