const { SendErrorEmbed } = require("@functions/discordFunctions");
const { QueryType } = require("discord-player");
const { SoundCloudExtractor } = require("@discord-player/extractor");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "gamer",
    description: "Do not",
    category: "music",
    private: true,
    permissions: [PermissionFlagsBits.Connect],
    async execute(logger, client, message, args) {

        const filePath = "path/to/your/attachment/file.ext";

        // Create a new attachment object with the file path
        const attachment = { attachment: filePath };

        // Modify the message object to include the attachment
        message.attachments = new Map();
        message.attachments.set("file.ext", attachment);

        // Now you can execute the play command with the modified message
        client.commands.get("play").execute(logger, client, message, args);
    },
};