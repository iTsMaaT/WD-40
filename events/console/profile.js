const fs = require("fs/promises");
const path = require("path");
const { writeHeapSnapshot } = require("node:v8");

module.exports = {
    name: "profile",
    async execute(client, logger, args) {
        const profilerDir = path.join(__dirname, "profiler");
        await fs.mkdir(profilerDir, { recursive: true });

        const filename = path.join(profilerDir, `heap-${Date.now()}.heapsnapshot`);

        writeHeapSnapshot(filename);
        logger.info(`Heap snapshot saved: ${filename}`);
    },
};