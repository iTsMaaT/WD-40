// Must be the first import of the entry point: ES modules evaluate their imports
// before the importing module's body, so anything reading process.env at load
// time (config, database manager, ...) needs the .env file loaded beforehand.
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";
import packageJson from "#root/package.json" with { type: "json" };

dotenv.config({ quiet: true });

if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
    const packageJSONVersion = packageJson.version.split(".");
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        release: packageJSONVersion,
    });
}
