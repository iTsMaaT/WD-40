const got = require("got");
const ToEngineerNotation = require("../../../utils/functions/ToEngineerNotation");
const prettyMilliseconds = require('pretty-ms');
const SendErrorEmbed = require("../../../utils/functions/SendErrorEmbed");

module.exports = {
    name: 'botinfo',
    description: 'Gives info about the Pterodactyl server',
    category: "utils",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        var serverName = "";
        var RAMlimit = "";
        var CPUlimit = "";
        var DISKlimit = "";
        var IPalias = "";
        var IPport = "";
        var RAMusage = "";
        var CPUusage = "";
        var DISKusage = "";
        var NETWORKin = "";
        var NETWORKout = "";
        var uptime = "";

        try {
            await got("https://dash.kpotatto.net/api/client/servers/adc0f433", {
                "method": "GET",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                }
            }).then(response => {
                try {
                    let json = JSON.parse(response.body);

                    serverName = json.attributes.name;
                    RAMlimit = json.attributes.limits.memory;
                    CPUlimit = json.attributes.limits.cpu;
                    DISKlimit = json.attributes.limits.disk
                    IPalias = json.attributes.relationships.allocations.data[0].attributes.ip_alias;
                    IPport = json.attributes.relationships.allocations.data[0].attributes.port;
                } catch (err) {
                    logger.error(err.stack)
                    SendErrorEmbed(message, "Failed to fetch from the API", "red", err)
                }
            })

            await got("https://dash.kpotatto.net/api/client/servers/adc0f433/resources", {
                "method": "GET",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                }
            }).then(response => {
                try {
                    let json = JSON.parse(response.body);

                    RAMusage = json.attributes.resources.memory_bytes;
                    CPUusage = json.attributes.resources.cpu_absolute;
                    DISKusage = json.attributes.resources.disk_bytes;
                    NETWORKin = json.attributes.resources.network_rx_bytes;
                    NETWORKout = json.attributes.resources.network_tx_bytes;
                    uptime = json.attributes.resources.uptime;
                } catch (err) {
                    logger.error(err.stack)
                    SendErrorEmbed(message, "Failed to fetch from the API", "red", err)
                }
            })

            const embed = {
                title: `Pterodactyl info for ${serverName} (${IPalias}:${IPport})`,
                color: 0xffffff,
                description: `Uptime: ${prettyMilliseconds(parseInt(uptime))}`,
                fields: [
                    {
                        name: "RAM usage",
                        value: `${ToEngineerNotation(parseInt(RAMusage))}B / ${ToEngineerNotation(parseInt(RAMlimit) * 1024 * 1024)}B`
                    }, {
                        name: "CPU usage",
                        value: `${CPUusage}% / ${CPUlimit}%`
                    }, {
                        name: "Disk usage",
                        value: `${ToEngineerNotation(parseInt(DISKusage))}B / ${ToEngineerNotation(parseInt(DISKlimit) * 1024 * 1024)}B`
                    }, {
                        name: "Network",
                        value: `IN: ${ToEngineerNotation(parseInt(NETWORKin))}B\nOUT: ${ToEngineerNotation(parseInt(NETWORKout))}B`
                    }
                ],
                footer: {
                    text: ''
                },
                timestamp: new Date(),
            };
            message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch (err) {
            logger.error(err.stack)
            SendErrorEmbed(message, "Error encountered.", "red", err)
        }

    }
}