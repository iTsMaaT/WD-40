module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    execute(logger, client, message, args) {
        message.channel.send("Shut the fuck up");
    }
}
