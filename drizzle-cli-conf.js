const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    schema: "./schema",
    out: "./drizzle",
    driver: "mysql2",
    dbCredentials: {
        uri: process.env.DATABASE_URL,
    },
};