const got = require("got");

module.exports = {
    name: "country",
    description: "See information about a country",
    usage: "< [Country name] >",
    category: "fun",
    execute(logger, client, message, args) {
        if (!args[0]) return message.channel.send("No country provided");
        message.channel.sendTyping();

        got(`https://restcountries.com/v3.1/name/${encodeURIComponent(args.slice(0).join(" "))}?fullText=true`)
            .then(response => {
                const json = JSON.parse(response.body);

                if (json.status === "404") return message.channel.reply({ content: "Couldn't find the specified country.", allowedMentions: { repliedUser: false } });

                const country = json[0];
                const currencies = Object.values(country.currencies).map(currency => `${currency.name} (${currency.symbol})`);
                const languages = Object.values(country.languages);

                const countryEmbed = {
                    color: 0xffffff,
                    title: country.name.common,
                    thumbnail: {
                        url: country.flags.png,
                    },
                    fields: [
                        { name: "Top level domain name", value: country.tld[0], inline: true },
                        { name: "Population", value: country.population, inline: true },
                        { name: "Independant", value: country.independent + " (" + country.status + ")", inline: true },
                        { name: "UN member", value: country.unMember, inline: true },
                        { name: "Currency", value: currencies.join(", "), inline: true },
                        { name: "Capital", value: country.capital[0], inline: true },
                        { name: "Continent", value: country.continents[0], inline: true },
                        { name: "Language(s)", value: languages.join(", ") },
                        { name: "Flag info", value: country.flags.alt }
                    ],
                    timestamp: new Date(),
                };

                if (country.coatOfArms) {
                    countryEmbed.thumbnail = {
                        url: country.coatOfArms.png,
                    };
                }

                message.channel.send({ embeds: [countryEmbed], allowedMentions: { repliedUser: false } });
            })
            .catch(error => {
                console.error("Error retrieving country information:", error);
                message.channel.send("An error occurred while retrieving country information. Please try again later.");
            });
    },
};
