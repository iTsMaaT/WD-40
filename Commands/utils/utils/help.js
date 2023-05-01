const path = require('node:path');
const fs = require('node:fs');
const { readdirSync } = require('node:fs');
const { EmbedBuilder } = require("discord.js")
const USERID = require("../../../UserIDs.js");
module.exports = {
    name: "help",
    description: "Lists commands",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        //Finds all command files and separate them from categories, -all shows all and -admin shows the private ones (admin or iTsMaaT only)
        if (!args[0]) {

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

            Object.keys(categorymapper).forEach(k => {
                helpmessagebuilder += `__**${k.toUpperCase()}**__\r\n${categorymapper[k]}\r\n`;
            });

            return message.channel.send(helpmessagebuilder);
        }
        else if (args[0] == "-admin" && message.author.id == USERID.itsmaat) {
            
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
                helpmessagebuilder += `__**${k.toUpperCase()}**__\r\n${categorymapper[k]}\r\n`;
            });

            return message.channel.send(helpmessagebuilder);
        }
        else if (args[0] == "-all" && message.author.id == USERID.itsmaat) {
            let helpmessagebuilder = "";
            let categorymapper = {};
            client.commands.each((val) => {
                if (categorymapper[val.category]) {
                    categorymapper[val.category] += (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                } else {
                    categorymapper[val.category] = (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                }
            })

            Object.keys(categorymapper).forEach(k => {
                helpmessagebuilder += `__**${k.toUpperCase()}**__\r\n${categorymapper[k]}\r\n`;
            });

            return message.channel.send(helpmessagebuilder);
        }
    }
}
