const path = require('node:path');
const fs = require('node:fs');
const { readdirSync } = require('node:fs');
const { EmbedBuilder } = require("discord.js")
module.exports = {
    name: "help",
    description: "Lists commands",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {

        let categories = [];

        readdirSync("./commands/").forEach((dir) => {
            const commands = readdirSync(`./commands/${dir}/`).filter((file) =>
                file.endsWith(".js")
            );
        });

        const embed = new EmbedBuilder()
            .setTitle("List of all commands:")
            .addFields(categories)
            .setDescription(
                `Use \`${prefix}help\` followed by a command name to get more additional information on a command. For example: \`${prefix}help ban\`.`
            )
            .setTimestamp()

        let helpmessagebuilder = "";
        let categorymapper = {};
        client.commands.each((val) => {
          if(!val.private) {
            if(categorymapper[val.category]) {
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
}
