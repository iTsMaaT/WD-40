const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "mcskin",
    description: "Gives the Minecraft skin of a user",
    usage: {
        required: {
            "username / UUID": "the username or UUID of the user",
        },
    },
    category: "utils",
    examples: ["Notch"],
    async execute(logger, client, message, args, optionalArgs) {
        const name = args[0] ?? "mhf_steve";
    
        try {
            const MCSkinEmbed = {
                title: `Minecraft skin for **${args[0] ?? "Steve"}**`,
                color: 0xffffff,
                thumbnail: {
                    url: `https://mc-heads.net/avatar/${name}`,
                },
                image: {
                    url: `https://mc-heads.net/skin/${name}`,
                }, url: `https://mc-heads.net/user/${name}`,
                timestamp: new Date(),
                footer: { text: "Defaults to Steve if no arguments are provided" },
            };
            message.reply({ embeds: [MCSkinEmbed, { image: { url: `https://mc-heads.net/body/${name}` }, url: `https://mc-heads.net/user/${name}` }] });
        } catch (err) {
            SendErrorEmbed(message, "An unknown error occured", "red");
            logger.error(err);
        }
    },
};