const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const SendErrorEmbed = require("@functions/SendErrorEmbed");
const emoteList = require("@root/utils/emojis.json");
const findClosestMatch = require("@functions/findClosestMatch");

module.exports = {
    name: 'autoreaction',
    description: 'Adds reactions to chosen messages in chosen channels',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'add',
            description: "Add a auto-reaction",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "channel-prompt",
                    description: "The prompt that needs to be contained in the channel name",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100
                },{
                    name: "string",
                    description: "The string in messages that enables a reaction (you can use <link>, <attachment> or <media>)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },{
                    name: "emotes",
                    description: "The reactions (unicode emotes are preferred)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ]
        },
        {
            name: 'remove',
            description: "Remove a auto-reaction",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "channel-prompt",
                    description: "The prompt that needs to be contained in the channel name",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    max_length: 100
                },{
                    name: "string",
                    description: "The string in messages that enables a reaction (do <media> for attachment and links)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ]
        },
        {
            name: 'list',
            description: "Lists the auto-reactions for this guild",
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
    async execute(logger, interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const ChannelPromptInput = interaction.options.get("channel-prompt")?.value;
        const StringInput = interaction.options.get("string")?.value;
        const EmotesInput = interaction.options.get("emotes")?.value;
        
        const autoreactions = await global.GuildManager.getAutoReactions(interaction.guild.id);
        const reactions = await autoreactions.getReactions();

        switch (subcommand) {
        case "list" : {
            if (Object.keys(reactions).length === 0) return SendErrorEmbed(interaction, "Theres no auto-reactions in this guild", "yellow", true);

            const embed = {
                title: "List of auto-reactions",
                color: 0xffffff,
                timestamp: new Date(),
                fields: []
            };

            console.logger(reactions);
            for (const key in reactions) {
                embed.fields.push({ name: key, value: `**${reactions[key].string}**:\n${reactions[key].emotes}`});
            }

            interaction.reply({ embeds: [embed] });
            break;
        }
        case "remove": {
            if(!reactions[ChannelPromptInput]) return SendErrorEmbed(interaction, "There is no entry for that channel prompt", "yellow", true);

            autoreactions.removeReaction(ChannelPromptInput);
            const embed = {
                title: "Removed auto-reaction entry for channel prompt: " + ChannelPromptInput,
                color: 0xffffff,
                timestamp: new Date(),
            };

            interaction.reply({ embeds: [embed] });
            break;
        }
        case "add": {
            let emotes = [];
    
            if (/^[a-z:0-9_]+$/.test(EmotesInput)) {
                const emoteNames = EmotesInput.replace(" ","").trim(":").split("::");
                emoteNames.forEach(emote => {
                    const closestMatch = findClosestMatch(emote, emoteList);
                    if (closestMatch.closestDistance <= 5) emotes.push(emoteList[closestMatch.closestMatch]);
                });
            } else {
                emotes = [...EmotesInput.replace(" ","")].reduce((acc, val) => {
                    console.log(val);
                    if(Object.values(emoteList).includes(val)) acc.push(val);
                    return acc;
                }, []);
            }

            const embed = {
                color: 0xffff00,
                title: "Auto-reactions",
                description: `
                Channel match prompt: **${ChannelPromptInput}**
                Entered string: **${StringInput}**
                Closest found emotes: ${emotes.join("|")}
                Is everything accurate?`
                    .replace(/^\s+/gm, ''),
                timestamp: new Date(),
            };

            const YesRestart = new ButtonBuilder()
                .setCustomId('yes')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Success);
    
            const NoRestart = new ButtonBuilder()
                .setCustomId('no')
                .setLabel('No')
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
                time: 15000, // The time in milliseconds to wait for a response (15 seconds in this example).
                max: 1, // The maximum number of interactions to collect.
            });

            collector.on('collect', (interaction) => {
                if (interaction.customId === 'yes') {

                    autoreactions.addReaction(ChannelPromptInput, StringInput, EmotesInput);

                    embed.description = `Auto-reactions added successfuly`;
                        
                    ConfirmationMessage.edit({ embeds: [embed], components: [row] });
            
                } else if (interaction.customId === 'no') {
                    embed.description = `Cancelled`;
    
                    ConfirmationMessage.edit({ embeds: [embed], components: [row] }).then(() => {
                        row.components.forEach((component) => component.setDisabled(true));
                        ConfirmationMessage.edit({ components: [row] });
                    });
                }
                    
                interaction.update({
                    components: [row],
                });
            });
              
            collector.on('end', async () => {
                row.components.forEach((component) => component.setDisabled(true));
                await ConfirmationMessage.edit({ components: [row], embeds: [embed] });
            });
        }
        }
    },
};