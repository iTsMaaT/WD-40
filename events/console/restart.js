module.exports = {
    name: "restart",
    execute(client, logger) {
        console.log("Restarting");
        process.exit(1);
    },
};