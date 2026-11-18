import fs from "fs/promises";
import path from "path";
import { writeHeapSnapshot } from "node:v8";

export default {
    name: "profile",
    /**
     * Writes a V8 heap snapshot to the console profiler directory.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {string[]} args Console command arguments.
     */
    async execute(client, logger, args) {
        const profilerDir = path.join(import.meta.dirname, "profiler");
        await fs.mkdir(profilerDir, { recursive: true });

        const filename = path.join(profilerDir, `heap-${Date.now()}.heapsnapshot`);

        writeHeapSnapshot(filename);
        logger.info(`Heap snapshot saved: ${filename}`);
    },
};