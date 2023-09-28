const fs = require("fs/promises");
module.exports = {
    name: "tinker",
    description: "Test command",
    category: "other",
    private: true,
    async execute(logger, client, message, args) {
        if (message.author.id != process.env.OWNER_ID) return;

        const messages = await global.prisma.message.findMany({
            where: {
                AND: {
                    GuildID: "747610874725925026",
                    UserID: "970784142486827008"
                }
            }
        });

        const AllMessagesArray = [];
        messages.forEach(obj => AllMessagesArray.push(obj.Content));
        const ArrayNoLinks = AllMessagesArray.filter(val => !/https?:\/\/[^\s]+/.test(val));
        let MessagesString = "";
        ArrayNoLinks.forEach(val => MessagesString += val + "\n");
        
        const fileName = `./Messages_data.txt`;
        await fs.writeFile(fileName, MessagesString, { encoding: 'utf8' });
    },
};