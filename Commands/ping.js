const prettyMilliseconds = require('pretty-ms');
//gives ping and uptime, or can give ping a precise number of times with a custom delay inbetween
module.exports = {
    name: "ping",
    description: "gives ping and uptime, or can give ping a precise number of times with a custom delay inbetween",
    async execute(logger, client, message, args) {
        if (args.length == 2) {
            if (args[0] <= 10 && args[1] >= 1 && args[1] <= 3) {
                for (let i = 0; i < args[0]; i++) {
                    setTimeout(function () {
                        message.channel.send(`Ping : \`${client.ws.ping}ms\``);
                    }, 1000 * args[1] * i)
                }
            } else {
                message.reply("Error: Maximum amount of 10 pings with time inbetween 1s and 3s.")
            }
        }
        else if (args.length == 1) {
            if (args[0] <= 10) {
                for (let i = 0; i < args[0]; i++) {
                    setTimeout(function () {
                        message.channel.send(`Ping : \`${client.ws.ping}ms\``);
                    }, 1000 * i);
                }
            } else {
                message.reply("Error: Maximum amount of 10 pings.")
            }
        }
        else if (args.length == 0) {
            const guild = await client.guilds.fetch(message.guildId);
            const target = await guild.members.fetch("1036485458827415633");
            const sent = await message.channel.send({ content: 'Pinging...', fetchReply: true });

            sent.edit(`

My ping is \`${client.ws.ping}ms\`
Uptime : \`${prettyMilliseconds(client.uptime)}\`
Round trip latency : \`${sent.createdTimestamp - message.createdTimestamp}ms\`
Bot's age : <t:${parseInt(target.user.createdTimestamp / 1000)}:R>
            `);

        }
        else {
            message.channel.reply(`Please enter either 1 or 2 arguments.`);
        }
    }
}
