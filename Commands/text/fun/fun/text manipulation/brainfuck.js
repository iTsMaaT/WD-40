const SendErrorEmbed = require("@functions/SendErrorEmbed");

module.exports = {
    name: "brainfuck",
    description: "Translates a string to brainfuck",
    category: "text manipulation",
    usage: "< String >",
    aliases: ['bf'],
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        if (!args[0]) return SendErrorEmbed(message, "Please provide a string to translate", "yellow");
        const bf = stringToBF(args.join(" "));
        try {
            if (bf.length < 2000) {
                await message.reply(`\`\`\`brainfuck\n${bf}\`\`\``);
            } else {
                SendErrorEmbed(message, "The result is too long (>2000)", "yellow");
            }
        } catch(err) {
            logger.error(err.stack);
            return SendErrorEmbed(message, "An error occured", "red");
        }

        function charToBF(char) {
            let buffer = "[-]>[-]<";
            for (let i = 0; i < Math.floor(char.charCodeAt(0) / 10); i++) {
                buffer += "+";
            }
            buffer += "[>++++++++++<-]>";
            for (let i = 0; i < char.charCodeAt(0) % 10; i++) {
                buffer += "+";
            }
            buffer += ".<";
            return buffer;
        }
          
        function deltaToBF(delta) {
            let buffer = "";
            for (let i = 0; i < Math.floor(Math.abs(delta) / 10); i++) {
                buffer += "+";
            }
          
            if (delta > 0) {
                buffer += "[>++++++++++<-]>";
            } else {
                buffer += "[>----------<-]>";
            }
          
            for (let i = 0; i < Math.abs(delta) % 10; i++) {
                if (delta > 0) {
                    buffer += "+";
                } else {
                    buffer += "-";
                }
            }
            buffer += ".<";
            return buffer;
        }
          
        function stringToBF(string, commented) {
            let buffer = "";
            if (string === null || string === undefined) {
                return buffer;
            }
            for (let i = 0; i < string.length; i++) {
                if (i === 0) {
                    buffer += charToBF(string[i]);
                } else {
                    const delta = string.charCodeAt(i) - string.charCodeAt(i - 1);
                    buffer += deltaToBF(delta);
                }
                if (commented) {
                    buffer += " " + string[i].replace(/[+-<>[],.]/g, "") + "\n";
                }
            }
            return buffer;
        }
    }
};