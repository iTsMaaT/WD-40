const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { useQueue, useMainPlayer } = require("discord-player");
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "queue",
    description: "Shows the current queue for songs",
    category: "music",
    aliases: ["q"],
    async execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);
        
        if (!queue || !queue.tracks || !queue.currentTrack) return SendErrorEmbed(message, "There is nothing in the queue / currently playing.", "yellow");

        const firstTrack = queue.currentTrack;
        const tracks = queue.tracks;

        // Finds all command files and separate them from categories, then use page to list the commands per category

        let counter = 0;
        const trackPages = [];
        const fields = [];
        tracks.map(track => {
            fields.push({ name: `${track.title} - ${track.author}`, value: `requested by : ${track.requestedBy?.displayName ?? "N/A"}` });
        });

        for (let i = 0; i < fields.length; i += 10) {
            const chunk = fields.slice(i, i + 10);
            trackPages.push(chunk);
        }

        const FisrtPage = new ButtonBuilder()
            .setCustomId("first")
            .setLabel("◀◀")
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
            .setLabel(`${counter} / ${trackPages.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder()
            .addComponents(FisrtPage, PreviousPage, PageNumber, NextPage, LastPage);

        const setEmbed = (count) => {
            const embed = {
                title: "Queue for the current guild",
                description: `Currently playing : **${firstTrack.title}** - ${firstTrack.author}`,
                color: 0xffffff,
                fields: trackPages[count],
            };

            return embed;
        };

        row.components[0].setDisabled(true);
        row.components[1].setDisabled(true);
        const helpMessage = await message.reply({
            embeds: [setEmbed(counter)],
            components: [row],
            allowedMentions: { repliedUser: false },
        });


        const filter = (interaction) => {
            if (interaction.user.id == message.author.id) return true;
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
                counter = 0;
            else if (interaction.customId === "last") 
                counter = trackPages.length;
            
            if (counter < 0) counter = 0;
            if (counter >= trackPages.length) counter = trackPages.length;

            // Update the label to show the current page number
            row.components[2].setLabel(`${counter} / ${trackPages.length}`);


            await row.components[0].setDisabled(counter == 0);
            await row.components[1].setDisabled(counter == 0);
            await row.components[3].setDisabled(counter == trackPages.length);
            await row.components[4].setDisabled(counter == trackPages.length);
            

            helpMessage.edit({
                embeds: [setEmbed(counter)],
                components: [row],
                allowedMentions: { repliedUser: false },
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
                allowedMentions: { repliedUser: false },
            });
        });
    },
};
