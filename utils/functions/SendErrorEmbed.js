const prettyString = require("./prettyString");

const SendErrorEmbed = function(message, string, color, err) {
    embed = {
        title: prettyString(string.toString()),
        timestamp: new Date(),
        color: 0xffffff,
    };
    if (color = "red") embed.color = 0xff0000
    if (color = "yellow") embed.color = 0xffff00
    if (err) embed.description = err
    return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
}
module.exports = SendErrorEmbed;