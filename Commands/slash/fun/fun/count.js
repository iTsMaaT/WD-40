const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed");
module.exports = {
    name: "count",
    description: "Counts the number of time a prompt as been said",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "string",
            description: "The string to fetch",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: "guild",
            description: "The guild to search from",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: "channel",
            description: "The channel to search from",
            type: ApplicationCommandOptionType.Channel,
            required: false,
        },
        {
            name: "user",
            description: "The user to search from",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    execute: async (logger, interaction, client) => {
        //interaction.deferReply();
        await interaction.deferReply();
        const String = interaction.options.get("string");
        const GuildID = interaction.options.get("guild");
        const Channel = interaction.options.get("channel");
        const User = interaction.options.getUser("user");
        var filter = {};
        var link = "";

        if (String) {
            filter.Content = { contains: String.value };
        }

        if (GuildID) {
            filter.GuildID = GuildID.value;
        }

        if (Channel) {
            filter.ChannelID = Channel.value;
        }

        if (User) {
            filter.UserID = User.id;
        }

        const count = await global.prisma.message.count({
            where: filter
        });
        const last = (await global.prisma.message.findMany({
            where: filter,
            take: 1,
            orderBy: {
                ID: 'desc'
            }
        }))[0];
        if (!last || !count) return await SendErrorEmbed(interaction, "None found.");

        if (last) link = `https://discord.com/channels/${last.GuildID}/${last.ChannelID}/${last.MessageID}`;

        if (count && last && link) {
            const embed = {
                color: 0xffffff,
                title: `Counting for:`,
                description: `
Guild ID: ${GuildID?.value ? await client.guilds.cache.get(GuildID.value).name : "**-**"}
Channel: ${Channel?.value ? await client.channels.fetch(Channel).name : "**-**"}
User: ${User ? await User.tag : "**-**"}
Prompt: ${String?.value ?? "**-**"}
                `,
                fields: [
                    { name: "Count", value: count, inline: false },
                    { name: "Link", value: `[Last message sent](${link})`, inline: false },
                ],
                timestamp: new Date(),
            };
            await interaction.editReply({ embeds: [embed], allowedMentions: { RepliedUser: false } });
        }
    }
};