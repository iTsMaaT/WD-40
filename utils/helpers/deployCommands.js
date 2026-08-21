const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function updateCommands(client, logger) {
    const manifestPath = path.join(process.cwd(), "utils/commandManifest.json");
    if (!fs.existsSync(manifestPath)) {
        logger.warning("Command manifest not found, creating new one");
        fs.writeFileSync(manifestPath, JSON.stringify({}, null, 2));
    }

    const oldManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    const newManifest = {};
    for (const cmd of client.discoveredCommands) {
        const commandObj = {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options,
            type: cmd.type,
        };

        const commandString = JSON.stringify(commandObj);

        const hash = crypto
            .createHash("sha256")
            .update(commandString)
            .digest("hex");

        newManifest[cmd.name] = {
            hash,
            lastUpdated: Date.now(),
        };
    }

    const hasChanges = Object.keys(newManifest).some(cmdName => {
        return !oldManifest[cmdName] || oldManifest[cmdName].hash !== newManifest[cmdName].hash;
    });

    if (!hasChanges) {
        logger.info("Commands unchanged, skipping deployment");
        return;
    }

    logger.info("Command changes detected, deploying new commands...");
    await client.application.commands.set(client.discoveredCommands);
  
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2));
    logger.info("Commands deployed and manifest updated");
}

module.exports = { updateCommands };