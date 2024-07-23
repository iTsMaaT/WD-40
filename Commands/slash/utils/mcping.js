const { ApplicationCommandType, ApplicationCommandOptionType, AttachmentBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "mcping",
    description: "Ping a minecraft server",
    type :ApplicationCommandType.ChatInput,
    options: [
        {
            name: "ip",
            description: "The IP to lookup",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "port",
            description: "The port of the IP",
            type: ApplicationCommandOptionType.Integer,
            required: false,
        },
    ],
    async execute(logger, interaction, client) {
        const server_ip = interaction.options.get("ip").value;
        let server_port_string = interaction.options.get("port")?.value;

        if (server_port_string) server_port_string = ":" + parseInt(server_port_string);
        try {
            const server = await (await fetch(`https://api.mcstatus.io/v2/status/java/${server_ip}${server_port_string || ""}`)).json();

            if (!server.online) return await interaction.reply({ embeds: [embedGenerator.warning(`${server.eula_blocked ? "The server is banned by Mojang." : "Server offline or nonexistant."}`)] });

            const serverStatusEmbed = {
                title: `Server Status for ${server.host} (Port: ${server.port})`,
                color: 0xffffff,
                thumbnail: {
                    url: `https://api.mcstatus.io/v2/icon/${server_ip}${server_port_string ?? ""}` || "",
                },
                fields: [
                    { name: "Server Version", value: server.version.name_clean },
                    { name: "MOTD (May Not Display Accurately)", value: server.motd.clean ?? "`N/A`" },
                    { name: "Players Online", value: `${server.players.online}/${server.players.max}` },
                ],
                timestamp: new Date(),
            };

            if (server.players.list[0] && server.players.list.length < 10) {
                const playerNames = [];

                for (const player of server.players.list) 
                    playerNames.push(player.name_clean);
                    
                serverStatusEmbed.fields.push({ name: "Player list", value: playerNames.join(", ") });
            }
                
            interaction.editReply({ embeds: [serverStatusEmbed] });
        } catch (err) {
            logger.error(err);
            return await interaction.editReply({ embeds: [embedGenerator.error("An error occured.")] });
        }
    },
};