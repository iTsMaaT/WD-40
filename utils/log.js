const { repositories } = require("./db/tableManager.js");
const { editOrSend } = require("./functions/discordFunctions.js");
const { colorText, foregroundColor, backgroundColor, textStyle } = require("./functions/consoleColor.js");
const Sentry = require("@sentry/node");

const util = require("util");

/**
 * Get the current date in the format DD-MM-YYYY.
 * @returns {string} The formatted date in EDT/EST.
 */
function getDate() {
    return new Date().toLocaleDateString("en-GB", { timeZone: "America/New_York" }).replace(/\//g, "-");
}

/**
 * Get the current date and time in the format DD-MM-YYYY HH:MM:SS.mmm.
 * @returns {string} The formatted date and time in EDT/EST.
 */
function getDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString("en-GB", { timeZone: "America/New_York" }).replace(/\//g, "-");
    const time = now.toLocaleTimeString("en-GB", {
        timeZone: "America/New_York",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

    return `${date} ${time}.${milliseconds}`;
}


class Logger {

    /**
     * Create a Logger.
     * @param {object} options - The options for the Logger.
     * @param {object} options.client - The Discord client object.
     */
    constructor(options) {
        this.options = options;
        this.types = {
            "error": "ERROR",
            "debug": "DEBUG",
            "info": "INFO",
            "console": "CONSOLE",
            "warning": "WARNING",
            "severe": "SEVERE",
            "music": "MUSIC",
            "event": "EVENT",
        };
    }

    /**
 * Write log messages to console, Discord, and database.
 * @param {string} header - The header for the log message.
 * @param {string} message - The log message.
 * @param {object} client - The Discord client object.
 * @param {string} type - The type of log message.
 * @returns {Promise<void>} A Promise indicating completion.
 */
    async writeLogToFile(message, type) {

        const getColorByType = (text, logType) => {
            switch (logType) {
                case "ERROR":
                    return colorText(text, foregroundColor.red);
                case "SEVERE":
                    return colorText(text, foregroundColor.red);
                case "MUSIC":
                    return colorText(text, foregroundColor.blue);
                case "WARNING":
                    return colorText(text, foregroundColor.yellow);
                case "EVENT":
                    return colorText(text, foregroundColor.magenta);
                case "INFO":
                    return colorText(text, foregroundColor.green);
                default:
                    return colorText(text, foregroundColor.white);
            }
        };

        const getLongestTypeLength = Object.keys(this.types).reduce((a, b) => a.length > b.length ? a : b).length;
        const header = `[${getDateTime()} - ${type.padStart(getLongestTypeLength, " ")}]`;

        const formattedLog = util.format(message);
        // Adds color depending on log type, then the log header, then the log and finally a newline
        process.stdout.write(getColorByType(`${header} ${formattedLog}`, type) + "\n"); 
    
        if (type == "CONSOLE" || type == "EVENT") return;
    
        try {
            await repositories.logs.insert({
                value: formattedLog,
                type: type,
            });
        } catch (ex) {
            console.logger(`\x1b[31m[${getDateTime()} - SEVERE] Unable to write to database\x1b[0m`);
            console.logger(ex);
        }
    }

    error(message) {
        if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
            let sError;
            if (message.stack) 
                sError = message;
            else 
                sError = new Error(message);
            
            Sentry.withScope((scope) => {
                scope.setLevel("error");
                Sentry.captureException(sError);
            });
        }
        const stackTrace = new Error("Generated Stacktrace: ").stack;
        this.writeLogToFile(message.stack || message + "\n" + stackTrace, this.types.error);
    }

    debug(message) {
        this.writeLogToFile(message, this.types.debug);
    }

    info(message) {
        this.writeLogToFile(message, this.types.info);
    }

    console(message) {
        this.writeLogToFile(message, this.types.console);
    }

    warning(message) {
        if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
            Sentry.withScope((scope) => {
                scope.setLevel("warning");
                Sentry.captureException(new Error(message));
            });
        }
        this.writeLogToFile(message, this.types.warning);
    }

    severe(message) {
        if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
            let sError;
            if (message.stack) 
                sError = message;
            else 
                sError = new Error(message);
            
            Sentry.withScope((scope) => {
                scope.setLevel("fatal");
                Sentry.captureException(sError);
            });
        }
        const stackTrace = new Error("Generated Stacktrace: ").stack;
        this.writeLogToFile(message.stack || message + "\n" + stackTrace, this.types.severe);
    }

    music(message) {
        this.writeLogToFile(message, this.types.music);
    }

    event(message) {
        this.writeLogToFile(message, this.types.event);
    }
}


/**
 * Represents a logger object with various logging methods.
 * @typedef {Object} Logger
 * @property {function} error - Log an error message.
 * @property {function} debug - Log a debug message.
 * @property {function} info - Log an info message.
 * @property {function} console - Log a message to console only.
 * @property {function} warning - Log a warning message.
 * @property {function} severe - Log a severe message.
 * @property {function} music - Log a music-related message.
 * @property {function} event - Log an event-related message.
 */
const logger = new Logger();
Object.freeze(logger);
module.exports = logger;