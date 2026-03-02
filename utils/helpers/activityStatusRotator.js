const cron = require("cron");
const randomMinMax = require("@root/utils/functions/randomMinMax");
const config = require("@utils/config/configUtils");
const { ActivityType } = require("discord.js");
const logger = require("@utils/log");

/**
 * Generates a random public IPv4 address.
 * @returns {string} The generated public IP address.
 */
const generateIpAddress = () => {
    // List of public IPv4 ranges (start, end) as [a, b, c, d]
    const publicRanges = [
        // 1.0.0.0 - 9.255.255.255
        [[1, 0, 0, 0], [9, 255, 255, 255]],
        // 11.0.0.0 - 126.255.255.255 (excluding 10.0.0.0/8)
        [[11, 0, 0, 0], [126, 255, 255, 255]],
        // 128.0.0.0 - 172.15.255.255 (excluding 127.0.0.0/8)
        [[128, 0, 0, 0], [172, 15, 255, 255]],
        // 172.32.0.0 - 191.255.255.255 (excluding 172.16.0.0/12)
        [[172, 32, 0, 0], [191, 255, 255, 255]],
        // 192.0.1.0 - 192.88.98.255 (excluding 192.0.0.0/24, 192.168.0.0/16)
        [[192, 0, 1, 0], [192, 88, 98, 255]],
        // 192.88.100.0 - 192.167.255.255 (excluding 192.88.99.0/24)
        [[192, 88, 100, 0], [192, 167, 255, 255]],
        // 192.169.0.0 - 198.17.255.255 (excluding 192.168.0.0/16)
        [[192, 169, 0, 0], [198, 17, 255, 255]],
        // 198.20.0.0 - 223.255.255.255 (excluding 198.18.0.0/15, 224.0.0.0/4+)
        [[198, 20, 0, 0], [223, 255, 255, 255]],
    ];

    // Helper to generate a random IP within a range
    function randomIpInRange(start, end) {
        const ip = [];
        for (let i = 0; i < 4; i++) 
            ip.push(randomMinMax(start[i], end[i]));
        
        return ip;
    }

    // Pick a random range
    const range = publicRanges[randomMinMax(0, publicRanges.length - 1)];
    const parts = randomIpInRange(range[0], range[1]);
    const port = randomMinMax(100, 65530);
    return `${parts.join(".")}:${port}`;
};

/**
 * Updates the bot's activities with the configured activities.
 * @param {import("discord.js").Client} client - The Discord client.
 */
const updateActivities = async (client) => {
    const activities = config.get("activities");
    if (!activities || !Array.isArray(activities)) {
        logger.error("Activities configuration is missing or invalid.");
        throw new Error("Activities configuration is missing or invalid.");
    }

    const guilds = await client.guilds.fetch();
    const guildCount = guilds.size;

    const ipAddress = generateIpAddress();

    activities.forEach(activity => {
        activity.name = activity.name
            .replace("{statusChance}", (1 / activities.length * 100).toFixed(2))
            .replace("{statusCount}", activities.length - 1)
            .replace("{ipAddress}", ipAddress)
            .replace("{guildCount}", guildCount);
    });

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setActivity(randomActivity.name, { type: randomActivity.type });
};

/**
 * Activates the activity status rotator.
 * @param {import("discord.js").Client} client - The Discord client.
 * @param {string} server - The server environment.
 */
const activateRotator = (client, server) => {
    if (server !== "dev") {
        updateActivities(client);
        new cron.CronJob(config.get("cronJobs").activityStatusRotator, () => updateActivities(client), null, true, config.get("timeZone"));
    } else {
        client.user.setActivity("Under maintenance...", { type: ActivityType.Custom });
    }
};

module.exports = {
    activateRotator,
    updateActivities,
};