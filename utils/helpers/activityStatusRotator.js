const cron = require("cron");
const RandomMinMax = require("@root/utils/functions/randomMinMax");
const config = require("@utils/config/configUtils");
const { ActivityType } = require("discord.js");
const logger = require("@utils/log");

const generateIpAddress = () => {
    const parts = Array.from({ length: 4 }, () => RandomMinMax(1, 255));
    const port = RandomMinMax(100, 65530);
    return `${parts.join(".")}:${port}`;
};

const updateActivities = (client) => {
    const activities = config.get("activities");
    if (!activities || !Array.isArray(activities)) {
        logger.error("Activities configuration is missing or invalid.");
        return;
    }

    const ipAddress = generateIpAddress();
    
    activities.forEach(activity => {
        activity.name = activity.name
            .replace("{statusChance}", Math.floor(Math.random() * 100))
            .replace("{statusCount}", activities.length - 1)
            .replace("{ipAddress}", ipAddress)
            .replace("{guildCount}", client.guilds.cache.size);
    });

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setActivity(randomActivity.name, { type: randomActivity.type });
};

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