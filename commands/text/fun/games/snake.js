const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "snake",
    description: "Play a game of Snake directly in Discord!",
    category: "games",
    async execute(logger, client, message, args) {
        const gridSize = 10;
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 },
        };

        const snake = [{ x: 5, y: 5 }];
        let direction = directions.right;
        let apple = spawnApple();
        let score = 0;
        let gameActive = true;

        function spawnApple() {
            let newApple;
            do {
                newApple = {
                    x: Math.floor(Math.random() * gridSize),
                    y: Math.floor(Math.random() * gridSize),
                };
            } while (snake.some(segment => segment.x === newApple.x && segment.y === newApple.y));
            return newApple;
        }

        function renderGrid() {
            const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill("⬛"));

            snake.forEach(segment => {
                grid[segment.y][segment.x] = "🟩";
            });

            grid[apple.y][apple.x] = "🍎";

            return grid.map(row => row.join("")).join("\n");
        }

        const updateGameEmbed = () => embedGenerator.info({
            title: "Snake Game",
            description: `${renderGrid()}\n\nScore: **${score}**`,
            footer: { text: "Use the buttons to control the snake!" },
        });

        const controls = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("up")
                    .setLabel("⬆️")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("left")
                    .setLabel("⬅️")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("down")
                    .setLabel("⬇️")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("right")
                    .setLabel("➡️")
                    .setStyle(ButtonStyle.Primary),
            );

        const gameMessage = await message.reply({
            embeds: [updateGameEmbed()],
            components: [controls],
        });

        const collector = gameMessage.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async interaction => {
            if (interaction.user.id !== message.author.id) 
                return interaction.reply({ content: "This game isn't for you!", flags: MessageFlags.Ephemeral });
            

            switch (interaction.customId) {
                case "up":
                    if (direction !== directions.down) direction = directions.up;
                    break;
                case "down":
                    if (direction !== directions.up) direction = directions.down;
                    break;
                case "left":
                    if (direction !== directions.right) direction = directions.left;
                    break;
                case "right":
                    if (direction !== directions.left) direction = directions.right;
                    break;
            }

            interaction.deferUpdate();
        });

        const gameInterval = setInterval(() => {
            if (!gameActive) {
                clearInterval(gameInterval);
                return;
            }

            const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

            if (
                head.x < 0 || head.x >= gridSize ||
                head.y < 0 || head.y >= gridSize ||
                snake.some(segment => segment.x === head.x && segment.y === head.y)
            ) {
                gameActive = false;
                const endEmbed = embedGenerator.info({
                    title: "Game Over",
                    description: `You crashed! Final Score: **${score}**`,
                    footer: { text: "Better luck next time!" },
                });
                gameMessage.edit({ embeds: [endEmbed], components: [] });
                return;
            }

            snake.unshift(head);

            if (head.x === apple.x && head.y === apple.y) {
                score++;
                apple = spawnApple();
            } else {
                snake.pop();
            }

            gameMessage.edit({ embeds: [updateGameEmbed()] });
        }, 1000);

        collector.on("end", () => {
            gameActive = false;
            const timeoutEmbed = embedGenerator.info({
                title: "Game Over",
                description: `Time's up! Final Score: **${score}**`,
                footer: { text: "Thanks for playing!" },
            });
            gameMessage.edit({ embeds: [timeoutEmbed], components: [] });
        });
    },
};
