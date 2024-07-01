const { EmbedBuilder } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const { QueueRepeatMode, useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "loop",
    description: "Loop a desired song or queue",
    usage: {
        required: {
            name: "loop type",
            description: "The type of loop to set (Off, Song, Queue or Autoplay)",
        },
    },
    category: "music",
    examples: ["track"],
    execute(logger, client, message, args, found) {
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

        const queue = useQueue(message.guild.id);

        if (!queue || !queue.tracks) return SendErrorEmbed(message, "There is nothing playing.", "yellow");
        switch (args[0]?.toLowerCase() ?? "queue") {
            case "off":
                queue.setRepeatMode(QueueRepeatMode.OFF);
                break;
            case "song":
            case "track":
                queue.setRepeatMode(QueueRepeatMode.TRACK);
                break;
            case "queue":
                queue.setRepeatMode(QueueRepeatMode.QUEUE);
                break;
            case "autoplay":
                queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
                break;
            default:
                SendErrorEmbed(message, "Invalid loop type. (Needs to be: off, queue, song or autoplay)", "yellow");
        }

        const repeat_mode_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription(`Set repeat mode to \`${args[0] ?? "Queue"}\``)
            .setTimestamp();
        message.reply({ embeds: [repeat_mode_embed]  });
    },
}; 
