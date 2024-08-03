const cron = require("cron");
const RandomMinMax = require("@utils/functions/RandomMinMax");
const config = require("@utils/config/configUtils");
const { ActivityType } = require("discord.js");
const logger = require("@utils/log");

const updateActivities = (client) => {
    const activities = config.get("activities");
    const part1 = RandomMinMax(1, 255);
    const part2 = RandomMinMax(1, 255);
    const part3 = RandomMinMax(1, 255);
    const part4 = RandomMinMax(1, 255);
    let port = 0;
    if (Math.random() < 0.5)
        port = 25565;
    else 
        port = RandomMinMax(24500, 26000);

    // Combine the parts into a valid IPv4 address
    const ipAddress = `${part1}.${part2}.${part3}.${part4}:${port}`;

    for (let i = 0; i < activities.length; i++) {
        activities[i].name = activities[i].name.replace("Placeholder01", (100 / activities.length).toFixed(2));
        activities[i].name = activities[i].name.replace("Placeholder02", activities.length - 1);
        activities[i].name = activities[i].name.replace("Placeholder03", ipAddress);
        activities[i].name = activities[i].name.replace("Placeholder04", client.guilds.cache.size);

        // Set the activity with type and name
    }
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setActivity(randomActivity.name, { type: randomActivity.type });
};

const job = new cron.CronJob("0 3 * * *", updateActivities, null, true, "America/New_York");

const activateRotator = (client, server) => {
    server = "prod";
    if (server !== "dev") {
        updateActivities(client);
        job.start();
    } else {
        client.user.setActivity("Under maintenance...", { type: ActivityType.Custom });
    }
};

module.exports = {
    activateRotator,
    updateActivities,
};