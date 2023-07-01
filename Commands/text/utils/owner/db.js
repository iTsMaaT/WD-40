const fs = require('fs/promises');
const prettyMilliseconds = require('pretty-ms');

module.exports = {
    name: 'db',
    description: 'Gives db info of a table',
    category: 'fun',
    private: true,
    async execute(logger, client, message, args) {
        if (message.author.id != process.env.OWNER_ID) return;

        if (!args) {
            return message.reply('Please provide a table name!');
        }
        const tableName = args[0];
        const sent = await message.reply({content: `Fetching the DB...`, fetchReply: true });

        try {
            const data = await global.prisma[tableName].findMany({
                orderBy: {
                    ID: 'desc',
                },
                take: 2500,
            });

            // Calculate the maximum length for each column
            const columnLengths = {};
            Object.keys(data[0]).forEach(column => {
                const maxLength = Math.max(...data.map(row => String(row[column]).length));
                columnLengths[column] = maxLength;
            });

            // Create the table header
            const tableHeader = Object.keys(data[0])
                .map(header => header.padEnd(columnLengths[header]))
                .join(' | ');

            // Create the separator line
            const separatorLine = '-'.repeat(tableHeader.length);

            // Create the table rows
            const tableRows = data.map(row =>
                Object.entries(row)
                    .map(([key, value]) => String(value).padEnd(columnLengths[key]))
                    .join(' | ')
            );

            // Join the table header, separator line, and rows
            const table = [tableHeader, separatorLine, ...tableRows].join('\n');

            // Create a text file
            const fileName = `./${tableName}_data.txt`;
            await fs.writeFile(fileName, table, { encoding: 'utf8' });
            await sent.edit(`Operation took ${prettyMilliseconds(Date.now() - sent.createdTimestamp)}`);
            await message.reply({ files: [fileName] });
            await fs.unlink(fileName);
        } catch (error) {
            console.error(error.stack);
            sent.edit('An error occurred while fetching data.');
        }
    },
};
