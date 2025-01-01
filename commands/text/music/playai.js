const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@guildManager");
const { fetchGeminiResponse } = require("@utils/helpers/fetchGeminiResponse");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "playai",
    description: "Give a song description, and AI will try to find the song for you",
    usage: {
        required: {
            "song": "song description",
        },
    },
    category: "music",
    examples: ["What's the title of the song with the guy that never gives you up?"],
    permissions: [PermissionsBitField.Flags.Connect],
    cooldown: 30000,
    async execute(logger, client, message, args, optionalArgs) {
        if (!args.length)
            return message.reply({ embeds: [embedGenerator.warning("Please provide a song description.")] });

        const songDescription = args.join(" ");
        const maxRetries = 3;
        let retries = 0;
        const wrongSongs = [];
        const playCommand = client.commands.get("play");

        const baseEmbed = () => embedGenerator.info({
            title: "AI Song Suggestion",
            description: "Processing your request. Please wait...",
            fields: [
                { name: "Retries", value: `${retries}/${maxRetries}`, inline: true },
                { name: "Status", value: "Waiting for AI response...", inline: true },
            ],
        });

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("yes")
                .setLabel("Yes")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("no")
                .setLabel("No")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger),
        );

        const reply = await message.reply({ embeds: [baseEmbed()], components: [actionRow] });

        while (retries < maxRetries) {
            try {
                // Update prompt to include feedback from previous failures
                let prompt = `Find the song according to this user description: ${songDescription}\n\n` +
                    "Note that I want your response to be in the format: [Title] - [Artist], with no other text in between.";

                if (wrongSongs.length > 0) 
                    prompt += `\n\nPrevious incorrect answers (this is a list of answers that the user already refuted as incorrect):\n${wrongSongs.join("\n")}`;

                const aiResponse = await fetchGeminiResponse(prompt, process.env.GEMINI_API_KEY);
                const regex = /^(.*) - (.*)$/;
                const match = aiResponse.match(regex);

                if (!match) {
                    retries++;
                    await reply.edit({
                        embeds: [
                            embedGenerator.info({
                                title: "AI Song Suggestion",
                                description: "The AI provided an invalid response. Retrying...",
                                fields: [
                                    { name: "Retries", value: `${retries}/${maxRetries}`, inline: true },
                                    { name: "Status", value: "Invalid AI response.", inline: true },
                                ],
                            }),
                        ],
                        components: [actionRow],
                    });
                    continue;
                }

                const [_, title, author] = match;

                // Update embed with the AI suggestion
                const suggestionEmbed = embedGenerator.info({
                    title: "AI Song Suggestion",
                    description: `Is this the song you are looking for?\n**Title:** ${title.trim().substring(0, 100)}\n**Artist:** ${author.trim().substring(0, 100)}`,
                    fields: [
                        { name: "Retries", value: `${retries}/${maxRetries}`, inline: true },
                        { name: "Status", value: "Awaiting your response.", inline: true },
                    ],
                });

                await reply.edit({ embeds: [suggestionEmbed], components: [actionRow] });

                const filter = (interaction) =>
                    ["yes", "no", "cancel"].includes(interaction.customId) &&
                    interaction.user.id === message.author.id;

                const interaction = await reply.awaitMessageComponent({ filter, time: 60000 }).catch(() => null);

                if (!interaction)
                {
                    actionRow.components.forEach(component => {
                        component.setDisabled(true);
                    });

                    return await reply.edit({
                        embeds: [
                            embedGenerator.error({
                                title: "Timeout",
                                description: "You did not respond in time. Please try again.",
                            }),
                        ],
                        components: [actionRow],
                    });}

                if (interaction.customId === "yes") {
                    actionRow.components.forEach(component => {
                        component.setDisabled(true);
                    });

                    await interaction.update({
                        embeds: [embedGenerator.info({
                            title: `Song to play will be: **${title}** by **${author}**`,
                            description: "The rest of this operation will be handled by the **play** command.",
                        })], components: [actionRow], 
                    });

                    await playCommand.execute(logger, client, message, [`${title} - ${author}`], {});

                    return;
                } else if (interaction.customId === "no") {
                    retries++;
                    wrongSongs.push(`${title} - ${author}`);

                    const noEmbed = embedGenerator.info({
                        title: "AI Song Suggestion",
                        description: "Retrying with updated feedback...",
                        fields: [
                            { name: "Retries", value: `${retries}/${maxRetries}`, inline: true },
                            { name: "Status", value: "Retrying...", inline: true },
                        ],
                    });
                    await interaction.update({ embeds: [noEmbed], components: [actionRow] });
                    continue;
                } else if (interaction.customId === "cancel") {
                    actionRow.components.forEach(component => {
                        component.setDisabled(true);
                    });

                    await interaction.update({
                        embeds: [embedGenerator.warning({
                            title: "Canceled",
                            description: "Song selection canceled.",
                        })], components: [actionRow], 
                    });
                    return;
                }
            } catch (error) {
                logger.error(`Error fetching AI response: ${error.message}`);

                actionRow.components.forEach(component => {
                    component.setDisabled(true);
                });

                await interaction.update({
                    embeds: [embedGenerator.error({
                        title: "Error",
                        description: "An error occurred while fetching the AI response. Please try again later.",
                    })], components: [actionRow], 
                });
                return;
            }
        }

        // Maximum retries reached
        actionRow.components.forEach(component => {
            component.setDisabled(true);
        });

        await reply.edit({
            embeds: [embedGenerator.warning({
                title: "Retries Exhausted",
                description: "Maximum retries reached. Please refine your description and try again.",
            })], components: [actionRow], 
        });
    },
};
