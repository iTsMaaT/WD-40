const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const emoteList = require("@utils/emojis.json");
const findClosestMatch = require("@utils/algorithms/findClosestMatch.js");
const GuildManager = require("@utils/GuildManager");

module.exports = {
    name: "autoreaction",
    description: "Adds reactions to chosen messages in chosen channels",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "add",
            description: "Add a auto-reaction",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "channel-prompt",
                    description: "The prompt that needs to be contained in the channel name",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100,
                }, {
                    name: "string",
                    description: "The string in messages that enables a reaction (or <link>, <attachment>, <media> or <all>)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100,
                }, {
                    name: "emotes",
                    description: "The reactions (unicode emotes are preferred)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: "remove",
            description: "Remove a auto-reaction",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "channel-prompt",
                    description: "The prompt that needs to be contained in the channel name",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100,
                }, {
                    name: "string",
                    description: "The string in messages that enables a reaction (or <link>, <attachment>, <media> or <all>)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100,
                },
            ],
        },
        {
            name: "removeall",
            description: "Removes all auto-reactions for a channel prompt",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "channel-prompt",
                    description: "The prompt that needs to be contained in the channel name",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100,
                },
            ],
        },
        {
            name: "list",
            description: "Lists the auto-reactions for this guild",
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
    async execute(logger, interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const ChannelPromptInput = interaction.options.get("channel-prompt")?.value;
        const StringInput = interaction.options.get("string")?.value;
        const EmotesInput = interaction.options.get("emotes")?.value;
        
        const autoreactions = await GuildManager.getAutoReactions(interaction.guild.id);
        const reactions = await autoreactions.getReactions();

        if ((subcommand == "add" || subcommand == "remove" || subcommand == "removeall") && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return SendErrorEmbed(interaction, "You must be a administrator to execute this action", "yellow", true);

        switch (subcommand) {
            case "list": {
                if (Object.keys(reactions).length === 0) return SendErrorEmbed(interaction, "There are no auto-reactions in this guild", "yellow", true);
            
                const embed = {
                    title: "List of auto-reactions",
                    color: 0xffffff,
                    timestamp: new Date(),
                    fields: [],
                };
            
                for (const channelPrompt in reactions) {
                    const entries = reactions[channelPrompt];
                    let fieldValue = "";
            
                    for (const entry of entries) 
                        fieldValue += `String: ${entry.string}\nEmotes: ${entry.emotes.split(";").join("|")}\n\n`;
                    
            
                    embed.fields.push({ name: channelPrompt, value: fieldValue });
                }
            
                interaction.reply({ embeds: [embed] });
                break;
            }
            
            case "remove": {
                if (!reactions[ChannelPromptInput]) return SendErrorEmbed(interaction, "There is no entry for that channel prompt", "yellow", true);

                autoreactions.removeReaction(ChannelPromptInput, StringInput);
                const embed = {
                    title: `Removed auto-reaction entry for channel prompt: **${ChannelPromptInput}**`,
                    color: 0xffffff,
                    timestamp: new Date(),
                };

                interaction.reply({ embeds: [embed] });
                break;
            }
            case "removeall": {
                if (!reactions[ChannelPromptInput]) return SendErrorEmbed(interaction, "There is no entry for that channel prompt", "yellow", true);

                autoreactions.removeReaction(ChannelPromptInput);
                const embed = {
                    title: `Removed auto-reaction entry for channel prompt: **${ChannelPromptInput}**`,
                    color: 0xffffff,
                    timestamp: new Date(),
                };

                interaction.reply({ embeds: [embed] });
                break;
            }
            case "add": {

                if (Object.keys(reactions).length >= 20) return SendErrorEmbed(interaction, "You cannot have more than 20 auto-reactions", "yellow", true);

                if (reactions[ChannelPromptInput]) {
                    const existingEntry = reactions[ChannelPromptInput].find(entry => entry.string === StringInput);
                    if (existingEntry) return SendErrorEmbed(interaction, "An entry for that channel prompt and string combination already exists.", "red", true);
                }

                let emotes = [];
    
                if (/^[a-z:0-9_]+$/.test(EmotesInput)) {
                    const emoteNames = EmotesInput.replace(" ", "").trim(":").split("::");
                    emoteNames.forEach(emote => {
                        const closestMatch = findClosestMatch(emote, emoteList);
                        if (closestMatch.closestDistance <= 5) emotes.push(emoteList[closestMatch.closestMatch]);
                    });
                } else {
                    emotes = [...EmotesInput.replace(" ", "")].reduce((acc, val) => {
                        if (Object.values(emoteList).includes(val)) acc.push(val);
                        return acc;
                    }, []);
                }

                if (emotes.length == 0) return SendErrorEmbed(interaction, "No compatible emotes found", "red", true);
                const embed = {
                    color: 0xffff00,
                    title: "Auto-reactions",
                    description: `
                Channel match prompt: **${ChannelPromptInput}**
                Entered string: **${StringInput}**
                Closest found emotes: ${emotes.join("|")}
                Is everything accurate?`
                        .replace(/^\s+/gm, ""),
                    timestamp: new Date(),
                    footer: { text: "Custom emotes are not supported." },
                };

                const YesRestart = new ButtonBuilder()
                    .setCustomId("yes")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success);
    
                const NoRestart = new ButtonBuilder()
                    .setCustomId("no")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger);
    
                const row = new ActionRowBuilder()
                    .addComponents(YesRestart, NoRestart);
    
                const filter = (ButtonInteraction) => {
                    return ButtonInteraction.user.id === interaction.user.id;
                };
                
                const ConfirmationMessage = await interaction.reply({
                    embeds: [embed],
                    components: [row],
                });
    
                const collector = ConfirmationMessage.createMessageComponentCollector({
                    filter,
                    time: 60_000, // The time in milliseconds to wait for a response.
                    max: 1, // The maximum number of interactions to collect.
                });

                collector.on("collect", async (collectorInteraction) => {
                    if (collectorInteraction.customId === "yes") {

                        autoreactions.addReaction(ChannelPromptInput, StringInput, emotes.join(";"));

                        embed.description = `
                    **Auto-reaction added successfuly**:
                    Channel match prompt: **${ChannelPromptInput}**
                    String match: **${StringInput}**
                    Reaction emotes: ${emotes.join("|")}`
                            .replace(/^\s+/gm, "");
                        embed.color = 0xffffff;
            
                    } else if (collectorInteraction.customId === "no") {
                    
                        embed.description = "Cancelled";
                        embed.color = 0xff0000;

                    }

                    row.components.forEach((component) => component.setDisabled(true));
                    await ConfirmationMessage.edit({ embeds: [embed], components: [row] });
                    
                    await collectorInteraction.update({
                        components: [row],
                    });
                });
              
                collector.on("end", async () => {
                    row.components.forEach((component) => component.setDisabled(true));
                    await ConfirmationMessage.edit({ components: [row], embeds: [embed] });
                });
            }
        }
    },
};