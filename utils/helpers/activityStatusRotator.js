const cron = require("cron");
const randomMinMax = require("@root/utils/functions/randomMinMax");
const config = require("@utils/config/configUtils");
const { ActivityType } = require("discord.js");
const logger = require("@utils/log");

/**
 * Generates a random IP address.
 * @returns {string} The generated IP address.
 */
const generateIpAddress = () => {
    const parts = Array.from({ length: 4 }, () => randomMinMax(1, 255));
    const port = randomMinMax(100, 65530);
    return `${parts.join(".")}:${port}`;
};

/**
 * Updates the bot's activities with the configured activities.
 * @param {import("discord.js").Client} client - The Discord client.
 */
const updateActivities = (client) => {
    const activities = config.get("activities");
    if (!activities || !Array.isArray(activities)) {
        logger.error("Activities configuration is missing or invalid.");
        throw new Error("Activities configuration is missing or invalid.");
    }

    const ipAddress = generateIpAddress();
    
    activities.forEach(activity => {
        activity.name = activity.name
            .replace("{statusChance}", 1 / activities.length * 100)
            .replace("{statusCount}", activities.length - 1)
            .replace("{ipAddress}", ipAddress)
            .replace("{guildCount}", client.guilds.cache.size);
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
        new cron.CronJob("0 3 * * *", () => updateActivities(client), null, true, "America/New_York");
    } else {
        client.user.setActivity("Under maintenance...", { type: ActivityType.Custom });
    }
};

module.exports = {
    activateRotator,
    updateActivities,
};