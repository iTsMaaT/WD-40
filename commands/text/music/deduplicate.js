const embedGenerator = require("@utils/helpers/embedGenerator");
const { QueryType, useMainPlayer, useQueue, QueryResolver } = require("discord-player");

module.exports = {
    name: "deduplicate",
    description: "Removes duplicate tracks from the queue",
    aliases: ["dd"],
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();

        if (!queue || queue.isEmpty()) 
            return message.reply({ embeds: [embedGenerator.error("There is nothing in the queue.")] });
        
        const uniqueTracks = [];
        const trackUrls = new Set();
        let removedCount = 0;

        for (const track of queue.tracks.data) {
            if (!trackUrls.has(track.url)) {
                uniqueTracks.push(track);
                trackUrls.add(track.url);
            } else {
                removedCount++;
            }
        }

        // Update the queue with the unique tracks
        queue.tracks.clear();
        uniqueTracks.forEach(track => queue.tracks.add(track));

        if (removedCount === 0) return await message.reply({ embeds: [embedGenerator.warning("No duplicate tracks were found.")] });

        const embedMessage = `Deduplicated the queue. **${removedCount}** ${removedCount === 1 ? "track was" : "tracks were"} removed.`;
        
        return await message.reply({ embeds: [embedGenerator.info(embedMessage)] });
    },
};
