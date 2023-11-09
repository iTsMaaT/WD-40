const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "autoresponse",
    description: "Responds something to chosen messages in chosen channels",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "add",
            description: "Add a auto-response",
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
                    description: "The string in messages that enables a response (or <link>, <attachment>, <media> or <all>)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100,
                }, {
                    name: "response",
                    description: "The response",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: "remove",
            description: "Remove a auto-response",
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
                    description: "The string in messages that enables a response (or <link>, <attachment>, <media> or <all>)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100,
                },
            ],
        },
        {
            name: "removeall",
            description: "Removes all auto-responses for a channel prompt",
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
            description: "Lists the auto-responses for this guild",
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
    async execute(logger, interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const ChannelPromptInput = interaction.options.get("channel-prompt")?.value;
        const StringInput = interaction.options.get("string")?.value;
        const ResponseInput = interaction.options.get("response")?.value;
        
        const autoresponses = await global.GuildManager.getAutoResponses(interaction.guild.id);
        const responses = await autoresponses.getResponses();

        if ((subcommand == "add" || subcommand == "remove" || subcommand == "removeall") && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return SendErrorEmbed(interaction, "You must be a administrator to execute this action", "yellow", true);

        switch (subcommand) {
            case "list": {
                if (Object.keys(responses).length === 0) return SendErrorEmbed(interaction, "There are no auto-responses in this guild", "yellow", true);
            
                const embed = {
                    title: "List of auto-responses",
                    color: 0xffffff,
                    timestamp: new Date(),
                    fields: [],
                };
            
                for (const channelPrompt in responses) {
                    const entries = responses[channelPrompt];
                    let fieldValue = "";
            
                    for (const entry of entries) 
                        fieldValue += `String: ${entry.string}\nResponses: ${entry.response}\n\n`;
                    
            
                    embed.fields.push({ name: channelPrompt, value: fieldValue });
                }
            
                interaction.reply({ embeds: [embed] });
                break;
            }
            
            case "remove": {
                if (!responses[ChannelPromptInput]) return SendErrorEmbed(interaction, "There is no entry for that channel prompt", "yellow", true);

                autoresponses.removeResponse(ChannelPromptInput, StringInput);
                const embed = {
                    title: `Removed auto-response entry for channel prompt: **${ChannelPromptInput}**`,
                    color: 0xffffff,
                    timestamp: new Date(),
                };

                interaction.reply({ embeds: [embed] });
                break;
            }
            case "removeall": {
                if (!responses[ChannelPromptInput]) return SendErrorEmbed(interaction, "There is no entry for that channel prompt", "yellow", true);

                autoresponses.removeResponse(ChannelPromptInput);
                const embed = {
                    title: `Removed auto-response entry for channel prompt: **${ChannelPromptInput}**`,
                    color: 0xffffff,
                    timestamp: new Date(),
                };

                interaction.reply({ embeds: [embed] });
                break;
            }
            case "add": {

                if (Object.keys(responses).length >= 20) return SendErrorEmbed(interaction, "You cannot have more than 20 auto-responses", "yellow", true);

                if (responses[ChannelPromptInput]) {
                    const existingEntry = responses[ChannelPromptInput].find(entry => entry.string === StringInput);
                    if (existingEntry) return SendErrorEmbed(interaction, "An entry for that channel prompt and string combination already exists.", "red", true);
                }

                const embed = {
                    color: 0xffff00,
                    title: "Auto-responses",
                    description: `
                Channel match prompt: **${ChannelPromptInput}**
                Entered string: **${StringInput}**
                Entered response: ${ResponseInput}
                Is everything accurate?`
                        .replace(/^\s+/gm, ""),
                    timestamp: new Date(),
                };

                const YesButton = new ButtonBuilder()
                    .setCustomId("yes")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success);
    
                const NoButton = new ButtonBuilder()
                    .setCustomId("no")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger);
    
                const row = new ActionRowBuilder()
                    .addComponents(YesButton, NoButton);
    
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

                        autoresponses.addResponse(ChannelPromptInput, StringInput, ResponseInput);

                        embed.description = `
                    **Auto-response added successfuly**:
                    Channel match prompt: **${ChannelPromptInput}**
                    String match: **${StringInput}**
                    Response: ${ResponseInput}`
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