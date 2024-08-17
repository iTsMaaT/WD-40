const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { useQueue, useMainPlayer, useHistory } = require("discord-player");
const prettyMs = require("pretty-ms");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");

module.exports = {
    name: "queue",
    description: "Shows the current queue for songs",
    usage: {
        optional: {
            "search|s": {
                description: "Searches for a song in the queue",
            },
        },
    },
    category: "music",
    aliases: ["q"],
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        const history = useHistory(message.guild.id);

        if (!queue || !queue.tracks || !queue.currentTrack || queue.tracks.data.length === 0) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue / currently playing.")] });
        const tracks = queue.tracks ? queue.tracks.data : [];
        const historyTracks = history.tracks?.data?.length > 0 ? history.tracks.data.reverse() : []; // Reverse history if it's not empty
        const currentTrack = queue.currentTrack;

        const fieldPerPage = 10;
        let counter = 0;
        const trackPages = [];
        const historyPages = [];
        const trackFields = [];
        const historyFields = [];

        if (optionalArgs["search|s"]) {
            const search = args.join(" ");
            const bestMatch = findBestMatch(algorithms.FUZZY_MATCH, search, tracks.map(track => track.title));
            const arrayPosition = tracks.map(track => track.title).indexOf(bestMatch.match);

            if (arrayPosition === -1) return await message.reply({ embeds: [embedGenerator.error("No results found")] });

            return await message.reply({ embeds: [embedGenerator.info({
                title: `Search results for [${search}]`,
                description: `${arrayPosition + 1} - [${tracks[arrayPosition].title} - ${tracks[arrayPosition].author}](${tracks[arrayPosition].url})`,
            }).withAuthor(message.author)] });
        }

        tracks.map((track, index) => {
            trackFields.push({ name: `${index + 1} - ${track.title} - ${track.author}`, value: `requested by : ${track.requestedBy?.displayName ?? "N/A"}` });
        });

        historyTracks.map(track => {
            historyFields.push({ name: `${track.title} - ${track.author}`, value: `requested by : ${track.requestedBy?.displayName ?? "N/A"}` });
        });

        for (let i = 0; i < trackFields.length; i += fieldPerPage) {
            const chunk = trackFields.slice(i, i + fieldPerPage);
            trackPages.push(chunk);
        }

        for (let i = 0; i < historyFields.length; i += fieldPerPage) {
            const chunk = historyFields.slice(i, i + fieldPerPage);
            historyPages.push(chunk);
        }

        const alltracks = [...historyPages, ...trackPages];

        const FirstPage = new ButtonBuilder()
            .setCustomId("first")
            .setLabel("Page 0")
            .setStyle(ButtonStyle.Success);

        const LastPage = new ButtonBuilder()
            .setCustomId("last")
            .setLabel("▶▶")
            .setStyle(ButtonStyle.Success);

        const NextPage = new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary);

        const PreviousPage = new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary);

        const PageNumber = new ButtonBuilder()
            .setCustomId("page")
            .setLabel(`${counter - historyPages.length} / ${alltracks.length - historyPages.length - 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder()
            .addComponents(FirstPage, PreviousPage, PageNumber, NextPage, LastPage);

        const setEmbed = (count) => {
            const embed = {
                title: "Queue for the current guild",
                description: `Currently playing : **${currentTrack.title}** - ${currentTrack.author}`,
                color: 0xffffff,
                fields: alltracks[count],
                footer: { text: `Estimated time left: ${prettyMs(queue.estimatedDuration)}` },
            };
            if ((counter - historyPages.length) < 0) embed.title = "History for the current guild";

            return embed;
        };

        const updateComponents = (count) => {
            row.components[0].setDisabled(count === historyPages.length);
            row.components[1].setDisabled(count === 0);
            row.components[2].setLabel(`${counter - historyPages.length} / ${alltracks.length - historyPages.length - 1}`);
            row.components[3].setDisabled(count === trackPages.length);
            row.components[4].setDisabled(count === trackPages.length);
        };

        counter = historyPages.length;
        updateComponents(counter);

        const helpMessage = await message.reply({
            embeds: [setEmbed(counter)],
            components: [row],
            allowedMentions: { repliedUser: false },
        });

        const filter = (interaction) => {
            if (interaction.user.id === message.author.id) return true;
        };

        const collector = helpMessage.createMessageComponentCollector({
            filter,
            time: 120000,
            dispose: true,
        });
        
        collector.on("collect", async (interaction) => {
            if (interaction.customId === "next") 
                counter++;
            else if (interaction.customId === "previous") 
                counter--;
            else if (interaction.customId === "first") 
                counter = historyPages.length;
            else if (interaction.customId === "last") 
                counter = alltracks.length - 1;
            
            if (counter < 0) counter = 0;
            if (counter > alltracks.length) counter = alltracks.length;

            updateComponents(counter);

            helpMessage.edit({
                embeds: [setEmbed(counter)],
                components: [row],
            });

            await interaction.update({
                embeds: [setEmbed(counter)],
                components: [row],
            });
        });

        collector.on("end", async () => {
            row.components.forEach(component => {
                component.setDisabled(true);
            });
            await helpMessage.edit({
                embeds: [setEmbed(counter)],
                components: [row],
            });
        });
    },
};
