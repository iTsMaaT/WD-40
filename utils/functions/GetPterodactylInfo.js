const ToEngineerNotation = require("./ToEngineerNotation");
const prettyMilliseconds = require('pretty-ms');
const got = require("got");

const GetPterodactylInfo = async function () {
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
    var BOTuptime = "";

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
                BOTuptime = json.attributes.resources.uptime;
            } catch (err) {
                logger.error(err.stack)
            }
        })
    } catch (err) {
        logger.error(err.stack)
    }

    info = {
        ram: {
            limit: {
                raw: parseInt(RAMlimit) * 1024 * 1024,
                clean: `${ToEngineerNotation(parseInt(RAMlimit) * 1024 * 1024)}b`
            },
            usage: {
                raw: parseInt(RAMusage),
                clean: `${ToEngineerNotation(parseInt(RAMusage))}b`
            },
            pourcentage: {
                raw: parseInt(RAMusage) / (parseInt(RAMlimit) * 1024 * 1024) * 100,
                clean: (parseInt(RAMusage) / (parseInt(RAMlimit) * 1024 * 1024) * 100).toFixed(2) + "%"
            }
        },
        disk: {
            limit: {
                raw: parseInt(DISKlimit) * 1024 * 1024,
                clean: `${ToEngineerNotation(parseInt(DISKlimit) * 1024 * 1024)}b`
            },
            usage: {
                raw: parseInt(DISKusage),
                clean: `${ToEngineerNotation(parseInt(DISKusage))}b`
            },
            pourcentage: {
                raw: parseInt(DISKusage) / (parseInt(DISKlimit) * 1024 * 1024) * 100,
                clean: (parseInt(DISKusage) / (parseInt(DISKlimit) * 1024 * 1024) * 100).toFixed(2) + "%"
            }
        },
        cpu: {
            limit: CPUlimit,
            usage: CPUusage
        },
        network: {
            download: {
                raw: NETWORKin,
                clean: `${ToEngineerNotation(parseInt(NETWORKin))}b`
            },
            upload: {
                raw: NETWORKout,
                clean: `${ToEngineerNotation(parseInt(NETWORKout))}b`
            },
        },
        uptime: {
            raw: parseInt(BOTuptime),
            clean: prettyMilliseconds(parseInt(BOTuptime))
        },
        main: {
            name: serverName,
            ip: IPalias,
            port: IPport
        }
    }
    //console.log(info)
    return info
}
module.exports = GetPterodactylInfo;