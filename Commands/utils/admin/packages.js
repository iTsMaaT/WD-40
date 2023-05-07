const { EmbedBuilder, Embed } = require('discord.js');
const { version: discordjsVersion } = require('discord.js');
const { dependencies } = require('../../../package.json');

module.exports = {
    name: "packages",
    description: "Lists the packages and versions",
    category: "fun",
    private: true,
    async execute(logger, client, message, args) {
        const embed = new EmbedBuilder()
            .setTitle('Installed Packages')
            .setColor('#ffffff')
            .setDescription('The following packages are installed:')
            .addFields({ name: 'discord.js', value: discordjsVersion, inline: true });
            

        const fields = [];
        for (const [packageName, packageVersion] of Object.entries(dependencies)) {
            fields.push({ name: packageName, value: packageVersion, inline: true });
        }
        
        embed.addFields(fields)
        .setTimestamp()
        .setFooter({ text: `[Server: ${process.env.SERVER}]` });
        message.channel.send({ embeds: [embed] });
    }
}