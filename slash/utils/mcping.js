const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const got = require("got");
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed");
const { AttachmentBuilder } = require("discord.js");

const options = {
    timeout: 1000 * 5, // timeout in milliseconds
    enableSRV: true // SRV record lookup
};
module.exports = {
    name: 'mcping',
    description: 'Ping a minecraft server',
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
    execute(logger, interaction, client) {
        interaction.deferReply();
        const server_ip = interaction.options.get("ip").value;
        const server_port_string = interaction.options.get("port")?.value;
        if (server_port_string) { var port = ":" + parseInt(server_port_string) }
        got(`https://api.mcstatus.io/v2/status/java/${server_ip}${port ?? ""}`)
          .then(async response => {
            const server = JSON.parse(response.body);
    
            if (!server.online) return SendErrorEmbed(message, `${server.eula_blocked ? "The server is banned by Mojang." : "Server offline or nonexistent."}`, "red");
    
            
            if (server.icon) {
              let data = server.icon.split(',')[1];
              let buf = Buffer.from(data, 'base64');
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
    
            if (server.icon) return interaction.editReply({ embeds: [serverStatusEmbed], files: [imgfile], allowedMentions: { repliedUser: false } });
            interaction.editReply({ embeds: [serverStatusEmbed], allowedMentions: { repliedUser: false } });
          })
        }
    }