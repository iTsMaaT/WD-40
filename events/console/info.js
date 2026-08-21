const changelog = require("@root/changelogs.json");
const formatDuration = require("@utils/functions/formatDuration.js");

module.exports = {
    name: "info",
    execute(client, logger) {
        const uptime = formatDuration(client.uptime, false, true);
        const WDVersion = changelog.slice(-1).map(({ version }) => { return version; }).join();
        console.logger(`
        Bot Information:
        - Version: ${WDVersion}
        - Ping: ${client.ws.ping + "ms"}
        - Uptime: ${uptime}
        - Server Count: ${client.guilds.cache.size}
        - User Count: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`
            .replace(/^\s+/gm, ""));
    },
};