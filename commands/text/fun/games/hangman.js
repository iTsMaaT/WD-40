const { MessageFlags, PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@guildManager");
const words = require("./hangman words.js").words;

module.exports = {
    name: "hangman",
    description: "Play a game of Hangman!",
    category: "games",
    permissions: [PermissionsBitField.Flags.ManageMessages],
    async execute(logger, client, message, args, flags) {
        const prefix = GuildManager.GetPrefix(message.guild.id);

        // List of words for the game
        const word = words[Math.floor(Math.random() * words.length)].toUpperCase(); // Random word in uppercase

        // Game state variables
        const guessedLetters = [];
        const incorrectGuesses = [];
        const maxAttempts = 6;

        // Function to create display of the word with blanks for unguessed letters
        const getWordDisplay = () => {
            let filledWord = "";

            for (letter of word) {
                if (guessedLetters.includes(letter)) 
                    filledWord += letter;
                else 
                    filledWord += "\\_";
            }

            return filledWord;
        };

        // Embed showing game instructions and initial state
        const initialEmbed = embedGenerator.info({
            title: "Hangman Game",
            description: `Guess the word by typing a letter!\n\n**${getWordDisplay()}**`,
            footer: { text: `Incorrect guesses allowed: ${maxAttempts}` },
        });

        const gameMessage = await message.reply({ embeds: [initialEmbed] });

        // Collector for handling letter guesses
        const collector = message.channel.createMessageCollector({
            filter: msg => msg.author.id === message.author.id,
            time: 120000, // 2 minutes timeout
        });

        collector.on("collect", async msg => {
            if (msg.content.startsWith(prefix) && client.commands.get(msg.content.split(" ")[0].replace(prefix, "").toLowerCase())) {
                collector.stop();

                // Optionally, edit the game message to show it was canceled
                if (gameMessage.editable) {
                    const canceledEmbed = embedGenerator.info({
                        title: "Hangman Game",
                        description: "The game was canceled because a new command was issued.",
                    });
                    gameMessage.edit({ embeds: [canceledEmbed] });
                }

                // Delete the command message that canceled the game
                return;
            }

            // Only keep one character (first letter of the message)
            const letter = msg.content.trim().toUpperCase().charAt(0);

            // Ignore non-alphabet characters or previously guessed letters
            if (!/^[A-Z]$/.test(letter) || guessedLetters.includes(letter) || incorrectGuesses.includes(letter)) {
                await msg.delete();
                return message.channel.send({ content: "Please enter a new letter that hasn't been guessed.", flags: MessageFlags.Ephemeral });
            }

            // If the letter is in the word
            if (word.includes(letter)) 
                guessedLetters.push(letter);
            else 
                incorrectGuesses.push(letter);
            
            // Update the display
            const wordDisplay = getWordDisplay();
            const win = wordDisplay.split(" ").join("") === word;
            const lose = incorrectGuesses.length >= maxAttempts;

            // Generate result message
            let resultDescription = `**Word:** ${wordDisplay}\n\n**Incorrect guesses**: ${incorrectGuesses.join(", ")}`;
            if (win) 
                resultDescription += "\n\n🎉 **You won!** You guessed the word correctly!";
            else if (lose) 
                resultDescription += `\n\n💀 **You lost!** The word was **${word}**.`;
            else 
                resultDescription += `\n\nAttempts left: **${maxAttempts - incorrectGuesses.length}**`;
            

            // Update the embed
            const updatedEmbed = embedGenerator.info({
                title: "Hangman Game",
                description: resultDescription,
                footer: { text: win || lose ? "Game Over" : "Keep guessing!" },
            });

            await gameMessage.edit({ embeds: [updatedEmbed] });

            await msg.delete().catch(() => null);

            // End the game if the player has won or lost
            if (win || lose) 
                collector.stop();
            
        });

        // Handle game timeout
        collector.on("end", async (collected, reason) => {
            if (reason === "time" && gameMessage.editable) {
                const timeoutEmbed = embedGenerator.info({
                    title: "Hangman Game",
                    description: `You took too long to make a guess. The game has ended.\n\nThe word was **${word}**.`,
                });
                await gameMessage.edit({ embeds: [timeoutEmbed] });
            }
        });
    },
};
