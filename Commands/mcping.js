const util = require('minecraft-server-util');
const { EmbedBuilder } = require('discord.js');
const options = {
    timeout: 1000 * 5, // timeout in milliseconds
    enableSRV: true // SRV record lookup
};
module.exports = {
    name: 'mcping',
    description: 'Ping a minecraft server',
    execute(logger, client, message, args) {
        const server_ip = args[0]
        const server_port_string = args[1] ?? "25565"
        const server_port = parseInt(server_port_string)
        if (!args[0]) {
            message.channel.send("Please specify the server ip.")
        } else {
            util.status(server_ip, server_port, options)
                .then((result) => {

                    const string1 = JSON.stringify(result);// turn the object into a string
                    const string = JSON.parse(string1);// make the string parsable

                    message.channel.send(`
__Server status for ${server_ip} (Port : ${server_port})__

**Server version:** ${string.version.protocol}
**Players Online:** ${string.players.online}
**Max Players:** ${string.players.max}
**MOTD (May Not Display Accurately):**\n${string.motd.clean}
**Latency:** ${string.roundTripLatency}ms
    `)
        }).catch((error) => {
            logger.error(error);// if the server was unable to be pinged or something else happened
            message.channel.send(`
__There was an error preforming your command__
The server was unable to be pinged or you mis-typed the info

The base port is 25565, if it didn't work without the port, it means the port isn't 25565
    
    `)
            });
        }
    }
}