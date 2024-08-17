const { useQueue } = require("discord-player");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const extractNumbersAndStrings = require("@utils/functions/extractNumbersAndStrings");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "remove",
    description: "Removes a given track from the queue",
    usage: {
        required: {
            "song number or title": "the song number or title in the queue to remove",
        },
    },
    category: "music",
    examples: ["3", "\"Never Gonna Give You Up\""],
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const queue = useQueue(message.guild.id);

            if (!queue || !queue.tracks || !queue.currentTrack) 
                return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue / currently playing.")] });

            if (!args[0]) 
                return await message.reply({ embeds: [embedGenerator.error("Please enter a number or title to remove.")] });

            const fullQuery = args.join(" ");
            const matchedQueries = extractNumbersAndStrings(fullQuery);
            if (matchedQueries.length !== 1) 
                return await message.reply({ embeds: [embedGenerator.error("Please enter a valid number or title.")] });
            
            const query = matchedQueries[0];
            const targetPosition = isNaN(query) 
                ? queue.tracks.map(track => track.title).indexOf(findBestMatch(algorithms.FUZZY_MATCH, query, queue.tracks.data.map(track => track.title)).match)
                : parseInt(query) - 1;

            if (targetPosition >= queue.tracks.data.length || targetPosition < 0) 
                return await message.reply({ embeds: [embedGenerator.error("Please enter a number between 1 and " + queue.tracks.data.length)] });

            const trackResolvable = queue.tracks.at(targetPosition);

            if (!trackResolvable) 
                return await message.reply({ embeds: [embedGenerator.error("Couldn't find song to remove.")] });

            const removeConfirmationEmbed = embedGenerator.info({
                title: "Remove song?",
                description: `Are you sure you want to remove [${trackResolvable.title}](${trackResolvable.url}) from the queue?`,
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("confirmRemove")
                    .setLabel("Remove")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Secondary),
            );

            const removeConfirmationMessage = await message.reply({
                embeds: [removeConfirmationEmbed],
                components: [row],
            });

            try {
                const interaction = await removeConfirmationMessage.awaitMessageComponent({
                    filter: (inter) => inter.user.id === message.author.id,
                    time: 15000,
                });

                if (interaction.customId === "confirmRemove") {
                    await removeConfirmationMessage.edit({ embeds: [embedGenerator.info({ title: "Removing song..." })] });
                    queue.node.remove(trackResolvable);

                    removeConfirmationEmbed.data.title = "Removed song";
                    removeConfirmationEmbed.data.description = `[${trackResolvable.title}](${trackResolvable.url}) was removed from the queue.`;
                    await removeConfirmationMessage.edit({ embeds: [removeConfirmationEmbed] });
                } else if (interaction.customId === "cancel") {
                    await removeConfirmationMessage.edit({ embeds: [embedGenerator.info({ title: "Cancelled" })] });
                }

                row.components.forEach((component) => component.setDisabled(true));
                await interaction.update({ components: [row] });
            } catch (error) {
                logger.error(error);
                await removeConfirmationMessage.edit({ embeds: [embedGenerator.error("An error occurred while removing the song")] });
            }

        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};