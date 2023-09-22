module.exports = {
    name: "shutdown",
    execute(client, logger) {
        console.log("Shutting down");
        process.exit();
    }
};