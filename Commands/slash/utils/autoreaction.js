const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const SendErrorEmbed = require("@functions/SendErrorEmbed");
const emoteList = require("@root/utils/emojis.json");
const GuildManager = require("../../../utils/GuildManager");

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
                },
                {
                    name: "string",
                    description: "The string in messages that enables a reaction (you can use <link>, <attachment> or <media>)",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
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
                },
                {
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
        const ChannelPromptInput = interaction.options.get("channel-prompt").value;
        const StringInput = interaction.options.get("string").value;
        const EmotesInput = interaction.options.get("emotes")?.value;

        const autoreactions = GuildManager.getAutoReactions(message.guild.id);

        switch (subcommand) {
        case "list" : {
            if (!Object.keys(autoreactions)) return SendErrorEmbed(message, "Theres no auto-reactions in this guild", "yellow", true);

            const embed = {
                title: "List of auto-reactions",
                color: 0xffffff,
                timestamp: new Date(),
            };

            for (const key in autoreactions) {
                embed.fields.push({ name: autoreactions[key], value: `**${autoreactions[key].string}**:\n${autoreactions[key].emotes.join("|")}`});
            }

            message.reply({ embeds: [embed] });
            break;
        }
        case "remove": {
            if(!autoreactions[ChannelPromptInput]) return SendErrorEmbed(message, "There is no entry for that channel prompt", "yellow", true);

            autoreactions.removeReaction(ChannelPromptInput);
            const embed = {
                title: "Removed auto-reaction entry for channel prompt: " + ChannelPromptInput,
                color: 0xffffff,
                timestamp: new Date(),
            };

            message.reply({ embeds: [embed] });
            break;
        }
        case "add": {
            const emoteNames = [];
            const emotes = [];
    
            if (/^[a-z:0-9_]+$/.test(EmotesInput)) { 
                EmotesInput.replace(" ","").split("::").forEach(emote => {emoteNames.push(emote.trim(":"));});
                emoteNames.forEach(emote => {
                    const closestMatch = findClosestMatch(emote, emoteList);
                    if (closestMatch.closestDistance <= 5) emotes.push(emoteList[closestMatch.closestMatch]);
                });
            } else {
                emotes.push(...EmotesInput.replace(" ","").split(""));
            }

            const embed = {
                color: 0xffff00,
                title: "Auto-reactions",
                description: `
                Channel match prompt: **${ChannelPromptInput}**
                Entered string: **${StringInput}**
                Closest found emotes: ${emotes.join(" ")}
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
    
            const filter = (interaction) => {
                return interaction.user.id === message.author.id;
            };
                
            const ConfirmationMessage = await message.reply({
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
                    embed.description = `
                    Recommendation: use unicode emote instead of discord ones, since it will not need to find matches in a pre-determined list.
                    To do that, you need to add a backslash (\`\\\`) before the emote name
                    \`\`\`\\:<emote name>:\`\`\``
                        .replace(/^\s+/gm, '');
    
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

function findClosestMatch(input, values) {
    // Function to calculate the Levenshtein distance between two strings
    function levenshteinDistance(s1, s2) {
        const m = s1.length;
        const n = s2.length;
        const dp = [];
  
        for (let i = 0; i <= m; i++) {
            dp[i] = [i];
        }
  
        for (let j = 1; j <= n; j++) {
            dp[0][j] = j;
        }
  
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
  
        return dp[m][n];
    }
  
    // Initialize variables to keep track of the closest match and its distance
    let closestMatch = null;
    let closestDistance = Number.MAX_SAFE_INTEGER;
  
    // Loop through each value in the array
    for (const value in values) {
        // Calculate the Levenshtein distance between the input and the current value
        const distance = levenshteinDistance(input, value);
  
        // If the current distance is smaller than the closest distance, update the closest match
        if (distance < closestDistance) {
            closestMatch = value;
            closestDistance = distance;
        }
    }
  
    // Return an object containing the closest match, its distance, and potentially more info
    return {
        closestMatch,
        distance: closestDistance,
    };
}
  