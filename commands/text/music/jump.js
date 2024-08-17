const embedGenerator = require("@utils/helpers/embedGenerator"); 
const { useQueue } = require("discord-player");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const extractNumbersAndStrings = require("@utils/functions/extractNumbersAndStrings");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "jump",
    description: "Skips to a precise song in the queue",
    usage: {
        required: {
            "song number or title": "the song number or title in the queue to jump to, titles must be encased in quotes(\"<title>\")",
        },
    },
    category: "music",
    aliases: ["skipto"],
    examples: ["3", "\"Never Gonna Give You Up\""],
    inVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);

        if (!message.member.voice.channel) 
            return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        if (!args[0]) 
            return await message.reply({ embeds: [embedGenerator.error("Please enter a number or title to skip to.")] });
        if (!queue || !queue.tracks) 
            return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue.")] });

        const fullQuery = args.join(" ");
        const matchedQueries = extractNumbersAndStrings(fullQuery);
        if (matchedQueries.length !== 1) 
            return await message.reply({ embeds: [embedGenerator.error("Please enter a valid number or title. (refer to the help command for more info)")] });
        
        const query = matchedQueries[0];
        const targetPosition = isNaN(query) 
            ? queue.tracks.map(track => track.title).indexOf(findBestMatch(algorithms.FUZZY_MATCH, query, queue.tracks.data.map(track => track.title)).match)
            : parseInt(query) - 1;

        if (targetPosition >= queue.tracks.data.length || targetPosition < 0) 
            return await message.reply({ embeds: [embedGenerator.error("Please enter a number between 1 and " + queue.tracks.data.length)] });

        const trackResolvable = queue.tracks.at(targetPosition);

        if (!trackResolvable) 
            return await message.reply({ embeds: [embedGenerator.error("Couldn't find song to skip to.")] });

        const jumpConfirmationEmbed = embedGenerator.info({
            title: "Jump to song?",
            description: `Skip to [${trackResolvable.title}](${trackResolvable.url})`,
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("confirmJump")
                .setLabel("Jump")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger),
        );

        const jumpConfirmationMessage = await message.reply({
            embeds: [jumpConfirmationEmbed],
            components: [row],
        });

        try {
            const interaction = await jumpConfirmationMessage.awaitMessageComponent({
                filter: (inter) => inter.user.id === message.author.id,
                time: 15000,
            });

            if (interaction.customId === "confirmJump") {
                await jumpConfirmationMessage.edit({ embeds: [embedGenerator.info({ title: "Jumping to song..." })] });
                queue.node.skipTo(trackResolvable);
                jumpConfirmationEmbed.data.title = "Jumped to song";
                await jumpConfirmationMessage.edit({ embeds: [jumpConfirmationEmbed] });
            } else if (interaction.customId === "cancel") {
                await jumpConfirmationMessage.edit({ embeds: [embedGenerator.info({ title: "Cancelled" })] });
            }

            row.components.forEach((component) => component.setDisabled(true));
            await interaction.update({ components: [row] });
        } catch (error) {
            logger.error(error);
            await jumpConfirmationMessage.edit({ embeds: [embedGenerator.error("An error occurred while jumping to the song")] });
        }
    },
};