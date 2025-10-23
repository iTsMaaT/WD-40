const fs = require("fs/promises");
const formatDuration = require("@utils/functions/formatDuration");
const { repositories } = require("@root/utils/db/tableManager");
const { usage } = require("./activity");

module.exports = {
    name: "db",
    description: "Gives db info of a table",
    category: "owner",
    usage: {
        required: {
            "table": "table to get info of",
        },
        "list|l|t": {
            hasValue: false,
            description: "Lists all the tables",
        },
    },
    private: true,
    async execute(logger, client, message, args, flags) {
        let data;

        const tables = Object.keys(repositories);
        const tableList = tables.filter(name => !name.startsWith("_") && !name.startsWith("$"));

        if (flags["list|l|t"] || !args[0] || !tableList.includes(args[0])) return message.reply(`Tables: ${tableList.join(", ")}`);

        const tableName = args[0];
        const previousDate = Date.now();
        const sent = await message.reply({ content: "Fetching the DB..." });

        try {
            const columnFinder = await repositories[tableName].select().limit(1);
            if (!columnFinder[0]) return await sent.edit("This table is empty.");
            const firstColumn = Object.keys(columnFinder[0])[0];

            data = await repositories[tableName].select().orderBy(firstColumn, "desc").limit(2500);

            // Calculate the maximum length for each column
            const columnLengths = {};
            Object.keys(data[0]).forEach((column) => {
                const columnData = data.map((row) => String(row[column]));
                columnData.push(column); // Include the column name in the data array
                const maxLength = Math.max(...columnData.map((value) => value.length));
                columnLengths[column] = maxLength;
            });

            // Create the table header
            const tableHeader = Object.keys(data[0])
                .map((header) => header.padEnd(columnLengths[header]))
                .join(" | ");

            // Create the separator line
            const separatorLine = "-".repeat(tableHeader.length);

            // Create the table rows
            const tableRows = data.map((row) =>
                Object.entries(row)
                    .map(([key, value]) => String(value).padEnd(columnLengths[key]))
                    .join(" | "),
            );

            // Join the table header, separator line, and rows
            const table = [tableHeader, separatorLine, ...tableRows].join("\n");

            // Create a text file
            const fileName = `./${tableName}_data.txt`;
            await fs.writeFile(fileName, table, { encoding: "utf8" });
            const duration = Date.now() - previousDate;
            await sent.edit({ content: `Operation took ${formatDuration(duration)}`, files: [fileName] });
            await fs.unlink(fileName);
        } catch (error) {
            logger.error(error);
            sent.edit("An error occurred while fetching data.");
        }
    },
};
