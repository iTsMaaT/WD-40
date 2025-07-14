module.exports = {
    name: "logs",
    execute(client, logger, args) {
        const mode = args[0]?.toLowerCase();
        if (!mode || !["all", "error"].includes(mode)) {
            console.log(`Usage: logs <all|error>\nCurrent mode: ${logger.getConsoleLogMode()}`);
            return;
        }
        logger.setConsoleLogMode(mode);
        console.warning(`Console log mode set to: ${mode}`);
    },
};