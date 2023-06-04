const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
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
        const String = interaction.options.get("string");
        const GuildID = interaction.options.get("guild");
        const Channel = interaction.options.get("channel");
        const User = interaction.options.get("user");
        var filter = {}; 
        var link = "";

        if(String) {
            filter.Content = { contains: String.value };
        }

        if(GuildID) {
            filter.GuildID = GuildID.value;
        }

        if(Channel) {
            filter.ChannelID = Channel.value;
        }

        if(User) {
            filter.User = User.value;
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
        console.log(last);

        if (last) link = `https://discord.com/channels/${last.GuildID}/${last.ChannelID}/${last.MessageID}`;

        if (count && last && link) {
            const embed = {
                color: 0xffffff,
                title: `Counting for:`,
                description: `
Guild ID: ${GuildID?.value ? await client.guilds.fetch(GuildID).name : "None"}
Channel ID: ${Channel?.value ? await client.channels.fetch(Channel).name : "None"}
User ID: ${User?.value ? await client.users.fetch(User).tag : "None"}
Prompt: ${String?.value ?? "None"}
                `,
                fields: [
                    { name: "Count", value: count, inline: false },
                    { name: "Link", value: `[Last message sent](${link})`, inline: false },
                ],
                timestamp: new Date(),
            };
            interaction.reply({ embeds: [embed], allowedMentions: {RepliedUser: false} });
        }
    }
};