const embedGenerator = require("@utils/helpers/embedGenerator"); 
const { useQueue, useMainPlayer } = require("discord-player");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const extractNumbersAndStrings = require("@utils/functions/extractNumbersAndStrings");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "move",
    description: "Moves a song to a specific position in the queue",
    usage: {
        required: {
            "from": "the song number to go from",
            "to": "the song number to go to",
        },
    },
    category: "music",
    examples: ["3 5"],
    inVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.tracks) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue.")] });

        const fullQuery = args.join(" ");
        const matchedQueries = extractNumbersAndStrings(fullQuery);
        if (matchedQueries.length !== 2) return await message.reply({ embeds: [embedGenerator.error("Please enter two numbers / queries")] });
        const fromQuery = matchedQueries[0];
        const toQuery = matchedQueries[1];

        const fromPosition = isNaN(fromQuery) ? queue.tracks.map(track => track.title).indexOf(findBestMatch(algorithms.FUZZY_MATCH, fromQuery, queue.tracks.data.map(track => track.title)).match) : parseInt(fromQuery) - 1;
        const toPosition = isNaN(toQuery) ? queue.tracks.map(track => track.title).indexOf(findBestMatch(algorithms.FUZZY_MATCH, toQuery, queue.tracks.data.map(track => track.title)).match) : parseInt(fromQuery) - 1;      

        if (fromPosition > queue.tracks.data.length || toPosition > queue.tracks.data.length) 
            return await message.reply({ embeds: [embedGenerator.error("Please enter a number between 1 and " + queue.tracks.data.length)] });

        const moveConfirmationEmbed = embedGenerator.info({
            title: "Move song?",
            description: `from [${queue.tracks.data[fromPosition].title}](${queue.tracks.data[fromPosition].url}) to [${queue.tracks.data[toPosition].title}](${queue.tracks.data[toPosition].url})`,
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("moveSong")
                .setLabel("Move")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger),
        );

        const moveConfirmationMessage = await message.reply({
            embeds: [moveConfirmationEmbed],
            components: [row],
        });

        try {
            const interaction = await moveConfirmationMessage.awaitMessageComponent({
                filter: (inter) => inter.user.id === message.author.id,
                time: 15000,
            });

            if (interaction.customId === "moveSong") {
                await moveConfirmationMessage.edit({ embeds: [embedGenerator.info({ title: "Moving song..." })] });
                queue.node.move(queue.tracks.data[fromPosition], toPosition);
                moveConfirmationEmbed.data.title = "Moved song";
                await moveConfirmationMessage.edit({ embeds: [moveConfirmationEmbed] });
            } else if (interaction.customId === "cancel") {
                await moveConfirmationMessage.edit({ embeds: [embedGenerator.info({ title: "Cancelled" })] });
            }

            row.components.forEach((component) => component.setDisabled(true));
            await interaction.update({ components: [row] });
        } catch (error) {
            logger.error(error);
            await moveConfirmationMessage.edit({ embeds: [embedGenerator.error("An error occured while moving the song")] });
        }

    },
};