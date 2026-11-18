const fs = require("fs/promises");
const path = require("path");
const { writeHeapSnapshot } = require("node:v8");

module.exports = {
    name: "profile",
    /**
     * Writes a V8 heap snapshot to the console profiler directory.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {string[]} args Console command arguments.
     */
    async execute(client, logger, args) {
        const profilerDir = path.join(__dirname, "profiler");
        await fs.mkdir(profilerDir, { recursive: true });

        const filename = path.join(profilerDir, `heap-${Date.now()}.heapsnapshot`);

        writeHeapSnapshot(filename);
        logger.info(`Heap snapshot saved: ${filename}`);
    },
};