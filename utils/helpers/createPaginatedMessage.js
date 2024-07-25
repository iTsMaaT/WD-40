const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

/**
 * Creates a paginated message with buttons for pagination
 * @param {Message} message The message to reply to
 * @param {Object} options The options for the pagination
 * @param {Object} options.firstPageOverride The fields to use for the first page
 * @param {Object} options.embed The embed to use for the message
 * @param {Array<Object>} options.fields The fields to use for the message
 * @param {Number} options.fieldsPerPage The number of fields per page
 * @param {Number} options.timeout The timeout for the collector
 * @param {Object} options.buttonLabels The labels for the buttons
 * @returns {Promise<Message>} The message that was sent
 */
const createPaginatedMessage = async function(message, options) {
    const {
        firstPageOverride,
        embed,
        fields,
        fieldsPerPage = 10,
        timeout = 120000,
        buttonLabels = {
            first: "◀◀",
            previous: "◀",
            next: "▶",
            last: "▶▶",
        },
    } = options;
    if (!embed) throw new Error("Embed is missing");
    if (!fields) throw new Error("Fields are missing");
    if (isNaN(fieldsPerPage)) throw new Error("Fields per page is not a number");
    if (isNaN(timeout)) throw new Error("Timeout is not a number");
    if (fieldsPerPage < 0) throw new Error("Fields per page cannot be negative");
        
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

    const updatePageNumber = () => {
        row.components.find(component => component.data.custom_id === "page")?.setLabel(`${currentPage + 1}/${pages.length}`);
    };

    const updateButtons = () => {
        row.components.find(component => component.data.custom_id === "first")?.setDisabled(currentPage === 0);
        row.components.find(component => component.data.custom_id === "previous")?.setDisabled(currentPage === 0);
        row.components.find(component => component.data.custom_id === "next")?.setDisabled(currentPage === pages.length - 1);
        row.components.find(component => component.data.custom_id === "last")?.setDisabled(currentPage === pages.length - 1);
    };

    updateButtons();

    embed.fields = pages[currentPage];

    const sentMessage = await message.reply({
        embeds: [embed],
        components: [row],
    });

    const collector = await sentMessage.createMessageComponentCollector({
        filter: interaction => interaction.user.id === message.author.id,
        time: timeout,
        dispose: true,
    });

    collector.on("collect", async interaction => {
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

        console.log(currentPage);

        if (currentPage < 0) currentPage = 0;
        if (currentPage >= pages.length) currentPage = pages.length - 1;

        updatePageNumber();
        updateButtons();

        embed.fields = pages[currentPage];

        await interaction.update({
            embeds: [embed],
            components: [row],
        });
    });
  
    collector.on("end", async () => {
        row.components.forEach(component => {
            component.setDisabled(true);
        });
  
        await sentMessage.edit({
            embeds: [embed],
            components: [row],
        });
    });
};

module.exports = {
    createPaginatedMessage,
};