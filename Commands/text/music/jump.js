const SendErrorEmbed = require("../../../utils/functions/SendErrorEmbed");
const { useQueue } = require('discord-player');

module.exports = {
    name: 'jump',
    description: "Skips to a precise song",
    usage: "< [Song]: number of the song to skip to >",
    category: "music",
    inVoiceChannel: true,
    execute: async (logger, client, message, args) => {
        const queue = useQueue(message.guild.id);
        const track = parseInt(args[0]);
        const jump = queue?.tracks.at(track);
        const position = queue?.node.getTrackPosition(jump);
        const tracks = queue?.tracks.map((track, id) => ({
            name: track.title,
            value: ++id
        }));

        if (jump?.title && !tracks.some((t) => t.name === jump.title)) {
            tracks.unshift({
                name: jump.title,
                value: position
            });
        }

        if (!queue || !queue.tracks) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow");

        if (!args[0]) return SendErrorEmbed(message, "Please enter a number to skip to.", "yellow");

        const trackResolvable = queue.tracks.at(jump);
        console.log(trackResolvable);

        if (isNaN(track) || !trackResolvable) return SendErrorEmbed(message, `Couldn't find song to skip to.`, "red");

        queue.node.jump(trackResolvable);
        return SendErrorEmbed(message, `Skiped to ${trackResolvable.title}`);

    }
};
