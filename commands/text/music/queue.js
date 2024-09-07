const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { useQueue, useMainPlayer, useHistory } = require("discord-player");
const prettyMs = require("pretty-ms");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const { all } = require("axios");

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
        const historyTracks = history.tracks?.data?.length > 0 ? history.tracks.data : []; // Reverse history if it's not empty
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
            const matches = bestMatch.matches.slice(0, 5); // Get the first 5 matches
        
            if (matches.length === 0) 
                return await message.reply({ embeds: [embedGenerator.error("No results found")] });
            
        
            // Find the length of the largest index for padding
            const maxIndexLength = tracks.length.toString().length;
        
            const description = matches.map(match => {
                const arrayPosition = tracks.findIndex(t => t.title === match.value);
                const paddedIndex = (arrayPosition + 1).toString().padStart(maxIndexLength, " ");
                return `[\`${paddedIndex}\`] - [${tracks[arrayPosition].title} - ${tracks[arrayPosition].author}](${tracks[arrayPosition].url})`;
            }).join("\n");
        
            return await message.reply({
                embeds: [embedGenerator.info({
                    title: `Search results for [${search}]`,
                    description: description,
                }).withAuthor(message.author)],
            });
        }
        

        const maxTrackIndexLength = tracks.length.toString().length;
        const maxHistoryIndexLength = historyTracks.length.toString().length;

        tracks.map((track, index) => {
            const paddedIndex = (index + 1).toString().padStart(maxTrackIndexLength, " ");
            trackFields.push({
                name: `[${paddedIndex}] - ${track.title} - ${track.author}`,
                value: `requested by : ${track.requestedBy?.displayName ?? "N/A"}`,
            });
        });

        historyTracks.map((track, index) => {
            const paddedIndex = (-1 * (index + 1)).toString().padStart(maxHistoryIndexLength + 1, " "); // +1 for the negative sign
            historyFields.push({
                name: `[${paddedIndex}] - ${track.title} - ${track.author}`,
                value: `requested by : ${track.requestedBy?.displayName ?? "N/A"}`,
            });
        });


        for (let i = 0; i < trackFields.length; i += fieldPerPage) {
            const chunk = trackFields.slice(i, i + fieldPerPage);
            trackPages.push(chunk);
        }

        for (let i = 0; i < historyFields.length; i += fieldPerPage) {
            const chunk = historyFields.slice(i, i + fieldPerPage);
            historyPages.push(chunk);
        }

        historyPages.reverse();
        
        const alltracks = [...historyPages, ...trackPages];
        console.log(alltracks);

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
            console.log(count);
            console.log(historyPages.length);
            row.components[0].setDisabled(count === historyPages.length);
            row.components[1].setDisabled(count === 0);
            row.components[2].setLabel(`${counter - historyPages.length} / ${alltracks.length - historyPages.length - 1}`);
            row.components[3].setDisabled(count === alltracks.length - 1);
            row.components[4].setDisabled(count === alltracks.length - 1);
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
