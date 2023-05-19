const util = require('minecraft-server-util');

module.exports = {
  name: 'mcping',
  description: 'Ping a Minecraft server',
  category: "utils",
  async execute(logger, client, message, args) {
    message.channel.sendTyping();
    const options = {
        enableSRV: true // SRV record lookup
    };
    const serverIP = args[0];
    const serverPortString = args[1] ?? "25565";
    const serverPort = parseInt(serverPortString);

    if (!args[0]) {
      const errorEmbed = {
        title: "Server IP Required",
        color: 0xffff00, 
        description: "Please specify the server IP.",
      };
      message.channel.send({ embeds: [errorEmbed] });
    } else {
      try {
        const result = await util.status(serverIP, serverPort, options);

        const serverStatusEmbed = {
          title: `Server Status for ${serverIP} (Port: ${serverPort})`,
          color: 0xffffff, 
          fields: [
            { name: "Server Version", value: result.version.protocol },
            { name: "Players Online", value: `${result.players.online}/${result.players.max}` },
            { name: "MOTD (May Not Display Accurately)", value: result.motd.clean },
            { name: "Latency", value: `${result.roundTripLatency}ms` },
          ],
          timestamp: new Date(),
        };

        message.channel.send({ embeds: [serverStatusEmbed] });
      } catch (error) {
        logger.error(error);
        const errorEmbed = {
          title: "Error",
          color: 0xff0000, // Embed color for error (you can change it to any color you like)
          description: "There was an error performing your command.\nThe server was unable to be pinged or you entered incorrect information.",
          footer: {
            text: "The base port is 25565. If it didn't work without the port, it might mean the port isn't 25565.",
          },
          timestamp: new Date(),
        };
        message.channel.send({ embeds: [errorEmbed] });
      }
    }
  },
};
