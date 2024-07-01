const fs = require("fs/promises");
module.exports = {
    name: "tinker",
    description: "Test command",
    category: "other",
    private: true,
    async execute(logger, client, message, args, found) {
        if (message.author.id != process.env.OWNER_ID) return;

        
    },
};