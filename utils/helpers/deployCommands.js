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

    // Create new manifest from current commands with hashes
    const newManifest = {};
    for (const cmd of client.discoveredCommands) {
    // Create a command object with all relevant properties
        const commandObj = {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options,
            type: cmd.type,
        };

        // Create a deterministic string representation of the command
        const commandString = JSON.stringify(commandObj);

        // Generate hash of the command
        const hash = crypto
            .createHash("sha256")
            .update(commandString)
            .digest("hex");

        newManifest[cmd.name] = {
            hash,
            lastUpdated: Date.now(),
        };
    }

    // Check if any command hashes have changed
    const hasChanges = Object.keys(newManifest).some(cmdName => {
        return !oldManifest[cmdName] || oldManifest[cmdName].hash !== newManifest[cmdName].hash;
    });

    if (!hasChanges) {
        logger.info("Commands unchanged, skipping deployment");
        return;
    }

    // Commands have changed, deploy new ones
    logger.info("Command changes detected, deploying new commands...");
    await client.application.commands.set(client.discoveredCommands);
  
    // Save new manifest
    fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2));
    logger.info("Commands deployed and manifest updated");
}

module.exports = { updateCommands };