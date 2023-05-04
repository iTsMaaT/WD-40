const USERID = require("../../../UserIDs.js");
module.exports = {
    name: "help",
    description: "Lists commands",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        //Finds all command files and separate them from categories, then use page to list the commands per category, -admin shows the private ones (admin or iTsMaaT only)

        let helpmessagebuilder = "";
        let prefix = global.GuildManager.GetPrefix(message.guild);
        helpmessagebuilder += `**The prefix is:** \`${prefix}\`\n\n`
        let categorymapper = {};
        client.commands.each((val) => {
            if (!val.private) {
                if (categorymapper[val.category]) {
                    categorymapper[val.category] += (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                } else {
                    categorymapper[val.category] = (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                }
            }
        })
        let categories = Object.keys(categorymapper);
        if (!args[0]) {

            var CategoriesPage = "__Command categories__ (`>help <page number>` to see the commands)\n"
            for (let i = 0; i < categories.length; i++) {
                CategoriesPage += `**Page ${i + 1}** : ${categories[i].toUpperCase()}\n`;
            }

            return message.channel.send(CategoriesPage);
        } else if (args[0] > 0 && args[0] <= categories.length) {
            let page = args[0];
            let HelpMessage = `__Commands for category : **${categories[page - 1]}**__\n`;
            HelpMessage += categorymapper[categories[page - 1]];
            message.reply({ content: HelpMessage, allowedMentions: { repliedUser: false } });
        } else if (isNaN(args[0])) {
            if (args[0] == "-admin" && message.author.id == USERID.itsmaat) {
                categorymapper = {};

                client.commands.each((val) => {
                    if (val.private) {
                        if (categorymapper[val.category]) {
                            categorymapper[val.category] += (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                        } else {
                            categorymapper[val.category] = (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                        }
                    }
                })
                Object.keys(categorymapper).forEach(k => {
                    helpmessagebuilder += `__**${k.toUpperCase()}**__\r\n${categorymapper[k]}\r\n`;
                });
                return message.channel.send(helpmessagebuilder);

            } else {
                message.reply("The page you asked for is not a number.");
            }
        } else {
            message.reply("Page out of range.");
        }
    }
}







/*else if (args[0] == "-admin" && message.author.id == USERID.itsmaat) {
    
    let helpmessagebuilder = "";
    let categorymapper = {};
    client.commands.each((val) => {
        if (val.private) {
            if (categorymapper[val.category]) {
                categorymapper[val.category] += (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
            } else {
                categorymapper[val.category] = (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
            }
        }
    })

    Object.keys(categorymapper).forEach(k => {
        i += 1;
        helpmessagebuilder += `__**${k.toUpperCase()}**__\r\n${categorymapper[k]}\r\n`;
        if (i % 2 == 0) {
            message.channel.send(helpmessagebuilder + "_ _");
            helpmessagebuilder = "";
        }
    });

    return;
*/