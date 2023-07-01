const InfoFromMessageLink = function(link) {
    InfoArray = link.replace("https://discord.com/channels/", "").split("/");
    return InfoArray;
    /*
    [0]: Guild ID
    [1]: Chanel ID
    [2]: Message ID
    */
};
module.exports = InfoFromMessageLink;