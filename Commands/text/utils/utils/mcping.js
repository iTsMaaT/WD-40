const got = require("got");
const SendErrorEmbed = require("@functions/SendErrorEmbed");
const { AttachmentBuilder } = require("discord.js");

module.exports = {
    name: 'mcping',
    description: 'Ping a Minecraft server',
    usage: "< [IP]: mc server ip, [Port]: the port of the server (optional) >",
    category: "utils",
    async execute(logger, client, message, args) {

        if (args[1]) { var port = ":" + parseInt(args[1]); }
        got(`https://api.mcstatus.io/v2/status/java/${args[0]}${port ?? ""}`)
            .then(async response => {
                const server = JSON.parse(response.body);

                if (!server.online) return SendErrorEmbed(message, `${server.eula_blocked ? "The server is banned by Mojang." : "Server offline or nonexistant."}`, "red");


                if (server.icon) {
                    const data = server.icon.split(',')[1];
                    const buf = Buffer.from(data, 'base64');
                    var imgfile = new AttachmentBuilder(buf, 'img.png');
                }

                const serverStatusEmbed = {
                    title: `Server Status for ${server.host} (Port: ${server.port})`,
                    color: 0xffffff,
                    thumbnail: {
                        url: 'attachment://file.jpg' || "",
                    },
                    fields: [
                        { name: "Server Version", value: server.version.name_clean },
                        { name: "Players Online", value: `${server.players.online}/${server.players.max}` },
                        { name: "MOTD (May Not Display Accurately)", value: server.motd.clean ?? "`N/A`" },
                    ],
                    timestamp: new Date(),
                };

                if (server.players.list[0] && server.players.list.length < 10) {
                    const playerNames = [];

                    for (const player of server.players.list) {
                        playerNames.push(player.name_clean);
                    }
                    serverStatusEmbed.fields.push({ name: "Player list", value: playerNames.join(", ") });
                }

                if (server.icon) return message.reply({ embeds: [serverStatusEmbed], files: [imgfile] });
                message.reply({ embeds: [serverStatusEmbed] });
            });
    },
};
