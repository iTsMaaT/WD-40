const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder } = require("discord.js");
const embedGenerator = require("./embedGenerator");

/**
 * Creates a paginated message with buttons for pagination
 * @param {Message|CommandInteraction} messageOrInteraction The message or interaction to reply to
 * @param {Object} options The options for the pagination
 * @returns {Promise<Message>} The message that was sent
 */
const createPaginatedMessage = async function(messageOrInteraction, options) {
    const {
        firstPageOverride,
        embed,
        fields,
        filter = (interaction) => {
            const authorId = messageOrInteraction.author?.id || messageOrInteraction.user?.id;
            return interaction.user.id === authorId;
        },     
        filterEmbed = embedGenerator.warning("You are not allowed to interact with this message."),
        fieldsPerPage = 10,
        timeout = 120000,
        buttonLabels = {
            first: "◀◀",
            previous: "◀",
            next: "▶",
            last: "▶▶",
        },
    } = options;

    let workingEmbed;
    if (embed instanceof EmbedBuilder) 
        workingEmbed = embed;
    else 
        workingEmbed = embedGenerator.create(embed, embed.color || 0xffffff);
    

    if (!workingEmbed) throw new Error("Embed is missing");
    if (!fields) throw new Error("Fields are missing");
    if (isNaN(fieldsPerPage)) throw new Error("Fields per page is not a number");
    if (isNaN(timeout)) throw new Error("Timeout is not a number");
    if (fieldsPerPage < 0) throw new Error("Fields per page cannot be negative");
    if (!Array.isArray(fields)) throw new Error("Fields must be an array");

        
    const pages = [];
    if (firstPageOverride) pages.push(firstPageOverride);

    for (let i = 0; i < fields.length; i += fieldsPerPage) {
        const chunk = fields.slice(i, i + fieldsPerPage);
        pages.push(chunk);
    }

    let currentPage = 0;
    const buttons = [];

    // Buttons for pagination
    if (buttonLabels.first != null) {
        buttons.push(new ButtonBuilder()
            .setCustomId("first")
            .setLabel(buttonLabels.first)
            .setStyle(ButtonStyle.Success),
        );
    }

    if (buttonLabels.previous != null) {
        buttons.push(new ButtonBuilder()
            .setCustomId("previous")
            .setLabel(buttonLabels.previous)
            .setStyle(ButtonStyle.Primary),
        );
    }

    buttons.push(new ButtonBuilder()
        .setCustomId("page")
        .setLabel(`${currentPage + 1}/${pages.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );

    if (buttonLabels.next != null) {
        buttons.push(new ButtonBuilder()
            .setCustomId("next")
            .setLabel(buttonLabels.next)
            .setStyle(ButtonStyle.Primary),
        );
    }

    if (buttonLabels.last != null) {
        buttons.push(new ButtonBuilder()
            .setCustomId("last")
            .setLabel(buttonLabels.last)
            .setStyle(ButtonStyle.Success),
        );
    }

    const row = new ActionRowBuilder()
        .addComponents(...buttons);

    /**
     * Updates the page number
     */
    const updatePageNumber = () => {
        row.components.find(component => component.data.custom_id === "page")?.setLabel(`${currentPage + 1}/${pages.length}`);
    };

    /**
     * Updates the buttons
     */
    const updateButtons = () => {
        row.components.find(component => component.data.custom_id === "first")?.setDisabled(currentPage === 0);
        row.components.find(component => component.data.custom_id === "previous")?.setDisabled(currentPage === 0);
        row.components.find(component => component.data.custom_id === "next")?.setDisabled(currentPage === pages.length - 1);
        row.components.find(component => component.data.custom_id === "last")?.setDisabled(currentPage === pages.length - 1);
    };

    updateButtons();

    workingEmbed.setFields(pages[currentPage] || []);

    const sentMessage = await (async () => {
        const payload = {
            embeds: [workingEmbed],
            components: [row],
        };

        if (messageOrInteraction.replied || messageOrInteraction.deferred) 
            return await messageOrInteraction.editReply(payload);
        else if (messageOrInteraction.reply) 
            return await messageOrInteraction.reply(payload);
        else 
            return await messageOrInteraction.channel.send(payload);
        
    })();

    const collector = await sentMessage.createMessageComponentCollector({
        filter: (interaction) => {
            const authorId = messageOrInteraction.author?.id || messageOrInteraction.user.id;
            return interaction.user.id === authorId && filter(interaction);
        },
        time: timeout,
        dispose: true,
    });

    collector.on("collect", async interaction => {
        try {
            switch (interaction.customId) {
                case "first":
                    currentPage = 0;
                    break;
                case "previous":
                    currentPage--;
                    break;
                case "next":
                    currentPage++;
                    break;
                case "last":
                    currentPage = pages.length - 1;
                    break;
            }

            if (currentPage < 0) currentPage = 0;
            if (currentPage >= pages.length) currentPage = pages.length - 1;

            updatePageNumber();
            updateButtons();

            workingEmbed.setFields(pages[currentPage] || []);

            await interaction.update({
                embeds: [workingEmbed],
                components: [row],
            });
        } catch (error) {
            if (error.code === 50035) { // Invalid Form Body error
                await interaction.followUp({
                    content: "Failed to update the message. Please try again.",
                    ephemeral: true,
                });
            }
        }
    });
  
    collector.on("end", async () => {
        row.components.forEach(component => {
            component.setDisabled(true);
        });
  
        await sentMessage.edit({
            embeds: [workingEmbed],
            components: [row],
        });
    });

    collector.on("ignore", (interaction) => {
        interaction.reply({ embeds: [filterEmbed], flags: MessageFlags.Ephemeral });
    });
};

module.exports = {
    createPaginatedMessage,
};