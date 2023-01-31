module.exports = {
    name: "test",
    desciption: "test command",
    execute(logger, client, message, args) {
        message.channel.send("Shut the fuck up");
    }
}
