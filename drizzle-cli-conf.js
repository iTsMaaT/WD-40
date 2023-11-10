const dotenv = require("dotenv");

dotenv.config();

export default {
    schema: "./schema",
    out: "./drizzle",
    driver: "mysql2",
    dbCredentials: {
        uri: process.env.DATABASE_URL,
    },
};