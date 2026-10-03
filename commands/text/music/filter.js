const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue } = require("discord-player");
const config = require("@utils/config/configUtils");
const { prettyString } = require("@functions/formattingFunctions");

// Discord allows at most 25 options in a select menu (2 are used by Clear and List)
const MAX_FILTER_OPTIONS = 23;

module.exports = {
    name: "filter",
    description: "Apply or clear audio filters (multiple filters can be toggled at once)",
    category: "music",
    private: false,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const ffmpegFilters = config.get("discordPlayer")?.ffmpegFilters || {};
        const availableFilters = Object.keys(ffmpegFilters);
        const queue = useQueue();

        if (!queue || !queue.tracks)
            return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

        const filterManager = queue.metadata.filterManager;
        if (!filterManager || typeof queue.metadata.changeFilter !== "function")
            return await message.reply({ embeds: [embedGenerator.error("Filters are not ready for the current track.")] });

        const appliedEmbed = () => {
            const enabled = filterManager.getEnabled();
            return embedGenerator.info({
                title: "🎛️ Applied Filters",
                description: enabled.length > 0
                    ? enabled.map(name => `🟢 **${prettyString(name, "first", false)}**`).join("\n")
                    : "*No filters are currently applied.*",
                footer: { text: `${enabled.length} active • Volume ${filterManager.volume}%` },
            });
        };

        const changesEmbed = ({ enabled, disabled }) => {
            const lines = [
                ...enabled.map(name => `🟢 **${prettyString(name, "first", false)}** applied`),
                ...disabled.map(name => `🔴 **${prettyString(name, "first", false)}** removed`),
            ];
            const active = filterManager.getEnabled();
            return embedGenerator.info({
                title: "Filters Updated",
                description: `${lines.join("\n")}\n\n**Active:** ${
                    active.length > 0 ? active.map(name => prettyString(name, "first", false)).join(", ") : "None"
                }`,
                footer: { text: "Filters can take some time before changing" },
            });
        };

        const clearEmbed = () => embedGenerator.info("All filters have been cleared.");

        // Resolves case-insensitive names, returns the matched filters and the unknown inputs
        const resolveFilters = (inputs) => {
            const valid = [];
            const invalid = [];
            for (const input of inputs) {
                const match = availableFilters.find(name => name.toLowerCase() === input.toLowerCase());
                if (match) valid.push(match);
                else invalid.push(input);
            }
            return { valid, invalid };
        };

        const requested = args
            .join(" ")
            .split(/[\s,]+/)
            .map(arg => arg.trim())
            .filter(Boolean);

        if (requested.length === 0) {
            const options = [
                { label: "Clear Filters", value: "clear" },
                { label: "List Applied Filters", value: "listFilters" },
                ...availableFilters.slice(0, MAX_FILTER_OPTIONS).map(filterName => ({
                    label: prettyString(filterName, "first", false),
                    value: filterName,
                    emoji: filterManager.isToggled(filterName) ? "🟢" : "⚪",
                })),
            ];

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("filterSelect")
                .setPlaceholder("Choose one or more filters to toggle")
                .setMinValues(1)
                .setMaxValues(options.length)
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            const replyMessage = await message.reply({
                embeds: [appliedEmbed()],
                components: [row],
            });

            const filterCollector = replyMessage.createMessageComponentCollector({
                filter: interaction => interaction.user.id === message.author.id,
                time: 30000,
            });

            filterCollector.on("collect", async interaction => {
                if (!interaction.isStringSelectMenu()) return;

                const latency = Date.now() - interaction.createdTimestamp;
                if (latency > 1500) logger.warning(`[filter] Select menu interaction received ${latency}ms late (event loop busy?)`);

                // Acknowledge first so Discord doesn't show "interaction failed"
                let acknowledged = true;
                try {
                    await interaction.deferUpdate();
                } catch (error) {
                    acknowledged = false;
                    logger.error(`[filter] Failed to acknowledge select menu interaction: ${error.message}`);
                }

                const selected = interaction.values;
                let embed;

                try {
                    if (selected.includes("clear")) {
                        filterManager.clear();
                        embed = clearEmbed();
                    } else {
                        const filtersToToggle = selected.filter(value => availableFilters.includes(value));
                        if (filtersToToggle.length > 0) embed = changesEmbed(filterManager.toggleMany(filtersToToggle));
                        else embed = appliedEmbed();
                    }
                } catch (error) {
                    logger.error(`[filter] Failed to apply filters: ${error.message}`);
                    embed = embedGenerator.error(error.message);
                }

                const payload = { embeds: [embed], components: [] };
                try {
                    if (acknowledged) await interaction.editReply(payload);
                    else await replyMessage.edit(payload);
                } catch (error) {
                    logger.error(`[filter] Failed to update filter message: ${error.message}`);
                }

                filterCollector.stop("done");
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

        const lowered = requested.map(arg => arg.toLowerCase());

        if (lowered.includes("clear")) {
            filterManager.clear();
            return await message.reply({ embeds: [clearEmbed()] });
        }

        if (lowered.length === 1 && (lowered[0] === "list" || lowered[0] === "listfilters"))
            return await message.reply({ embeds: [appliedEmbed()] });

        const { valid, invalid } = resolveFilters(requested);

        if (valid.length === 0) {
            return await message.reply({
                embeds: [embedGenerator.warning({
                    title: "Invalid filter",
                    description: `Available filters are: ${availableFilters.join(", ")}`,
                })],
            });
        }

        const result = filterManager.toggleMany(valid);
        const embed = changesEmbed(result);

        if (invalid.length > 0) embed.addFields({ name: "⚠️ Ignored", value: invalid.map(name => `\`${name}\``).join(", ") });

        return await message.reply({ embeds: [embed] });
    },
};
