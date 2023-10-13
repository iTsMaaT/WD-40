module.exports = {
    name: "restart",
    execute(client, logger) {
        console.log("Restarting down");
        process.exit(1);
    },
};