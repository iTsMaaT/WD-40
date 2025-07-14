const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, InteractionCollector } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue } = require("discord-player");
const config = require("@utils/config/configUtils");
const { prettyString } = require("@functions/formattingFunctions");

module.exports = {
    name: "filter",
    description: "Apply or clear audio filters",
    category: "music",
    private: false,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const ffmpegFilters = config.get("discordPlayer")?.ffmpegFilters || {};

        const queue = useQueue();
        const filter = args[0]?.toLowerCase();

        if (!queue || !queue.tracks) 
            return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

        if (!filter) {
            const availableFilters = Object.keys(ffmpegFilters);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("filterSelect")
                .setPlaceholder("Choose a filter to apply or view available filters")
                .addOptions(
                    [
                        {
                            label: "Clear Filters",
                            value: "clear",
                        },
                        {
                            label: "List Applied Filters",
                            value: "listFilters",
                        },
                        ...availableFilters.map(filterName => ({
                            label: prettyString(filterName, "first", false),
                            value: filterName,
                        })),
                    ],
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const replyMessage = await message.reply({
                embeds: [embedGenerator.info("Please select a filter to apply, clear, or list available filters.")],
                components: [row],
            });

            const filterCollector = replyMessage.createMessageComponentCollector({
                filter: interaction => interaction.user.id === message.author.id,
                time: 15000,
            });

            filterCollector.on("collect", async (interaction) => {
                if (!interaction.isStringSelectMenu()) return;

                const selectedFilter = interaction.values[0];

                if (selectedFilter === "clear") {
                    queue.filters.ffmpeg.setFilters(false);
                    await interaction.update({ embeds: [embedGenerator.info("All filters have been cleared.")], components: [] });
                } else if (selectedFilter === "listFilters") {
                    await interaction.update({
                        embeds: [
                            embedGenerator.info(
                                `Currently applied filters are\n: ${queue.filters.ffmpeg.filters.map(fil => {
                                    return Object.keys(ffmpegFilters).find(filterName => ffmpegFilters[filterName] === fil);
                                }).filter(Boolean).join("\n") || "None"}`,
                            ),
                        ],
                        components: [],
                    });
                } else if (Object.keys(ffmpegFilters).includes(selectedFilter)) {
                    queue.filters.ffmpeg.toggle(ffmpegFilters[selectedFilter]);
                    await interaction.update({
                        embeds: [
                            embedGenerator.info({
                                title: prettyString(selectedFilter, "first", false),
                                description: 
                                    `The [\`${selectedFilter}\`] filter has been ${
                                        !queue.filters.ffmpeg.filters.includes(selectedFilter) ? "applied" : "removed"
                                    }.`,
                                footer: { text: "Filters can take some time before changing" },
                            }),
                        ],
                        components: [],
                    });
                } else {
                    await interaction.update({
                        embeds: [embedGenerator.warning("Invalid filter selected.")],
                        components: [],
                    });
                }

                filterCollector.stop();
            });

            filterCollector.on("end", (collected, reason) => {
                if (reason === "time") {
                    replyMessage.edit({
                        embeds: [embedGenerator.warning("You took too long to select a filter.")],
                        components: [],
                    });
                }
            });

            return;
        }

        if (filter === "clear") {
            queue.filters.ffmpeg.clear();
            return await message.reply({ embeds: [embedGenerator.info("All filters have been cleared.")] });
        }

        const availableFilters = Object.keys(ffmpegFilters);

        if (!availableFilters.includes(filter)) {
            return await message.reply({ embeds: [embedGenerator.warning({
                title : "Invalid filter",
                description: `Available filters are: ${availableFilters.join(", ")}`,
            })] });
        }

        queue.filters.ffmpeg.toggle(ffmpegFilters[filter]);

        return await message.reply({
            embeds: [
                embedGenerator.info({
                    title: prettyString(selectedFilter, "first", false),
                    description: 
                        `The [\`${selectedFilter}\`] filter has been ${
                            !queue.filters.ffmpeg.filters.includes(selectedFilter) ? "applied" : "removed"
                        }.`,
                    footer: { text: "Filters can take some time before changing" },
                }),
            ],
        });
    },
};
