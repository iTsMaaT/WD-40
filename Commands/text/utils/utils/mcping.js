const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "mcping",
    description: "Ping a Minecraft server",
    usage: {
        required: {
            "ip": "the IP of the server",
            "port": "the port of the server (optional)",
        },
    },
    category: "utils",
    examples: ["Hypixel.net"],
    async execute(logger, client, message, args, found) {

        let port = "";
        if (args[1]) port = ":" + parseInt(args[1]);
        fetch(`https://api.mcstatus.io/v2/status/java/${args[0]}${port ?? ""}`)
            .then(async response => {
                const server = await response.json();

                if (!server.online) return SendErrorEmbed(message, `${server.eula_blocked ? "The server is banned by Mojang." : "Server offline or nonexistant."}`, "red");

                const serverStatusEmbed = {
                    title: `Server Status for ${server.host} (Port: ${server.port})`,
                    color: 0xffffff,
                    thumbnail: {
                        url: `https://api.mcstatus.io/v2/icon/${args[0]}${port ?? ""}` || "",
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
                
                message.reply({ embeds: [serverStatusEmbed] });
            });
    },
};
