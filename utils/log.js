const { repositories } = require("./db/tableManager.js");
const { editOrSend } = require("./functions/discordFunctions.js");
const { colorText, foregroundColor, backgroundColor, textStyle } = require("./functions/consoleColor.js");
const Sentry = require("@sentry/node");
const databaseManager = require("@root/utils/db/databaseManager");
const util = require("util");
const getExactDate = require("@functions/getExactDate");

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
            "command": "COMMAND",
        };
        this.logCounts = {
            "severe": 0,
            "error": 0,
            "warning": 0,
            "info": 0,
            "debug": 0,
            "event": 0,
            "music": 0,
            "console": 0,
            "command": 0,
        };

        this.consoleLogMode = "all"; // "all" or "error"
        this.allowedTypes = {
            all: null, // null means allow all
            error: ["ERROR", "WARNING", "SEVERE"],
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
    async writeLogToFile(message, type, ...args) {
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
                    return text;
            }
        };

        const getLongestTypeLength = Object.keys(this.types).reduce((a, b) => a.length > b.length ? a : b).length;
        const header = `[${getExactDate()} - ${type.padStart(getLongestTypeLength, " ")}]`;

        // Format the message and args
        const formattedMessage = args.length === 0
            ? (typeof message === "object"
                ? util.inspect(message, { colors: true, depth: null })
                : String(message))
            : util.format(message, ...args);

        // Adds color depending on log type, then the log header, then the log and finally a newline
        const allowed = this.allowedTypes[this.consoleLogMode];
        if (!allowed || allowed.includes(type)) 
            process.stdout.write(getColorByType(`${header} ${formattedMessage}`, type) + "\n");
        

        if (type == "CONSOLE" || type == "EVENT") return;

        if (databaseManager.dbExists()) {
            try {
                await repositories.logs.insert({
                    value: formattedMessage,
                    type: type,
                });
            } catch (ex) {
                console.logger(`\x1b[31m[${getExactDate()} - SEVERE] Unable to write to database\x1b[0m`);
                console.logger(ex);
            }
        }
    }

    setConsoleLogMode(mode) {
        if (!["all", "error"].includes(mode)) throw new Error("Invalid log mode");
        this.consoleLogMode = mode;
    }
    
    getConsoleLogMode() {
        return this.consoleLogMode;
    }

    console(message, ...args) {
        this.logCounts.console++;
        this.writeLogToFile(message, this.types.console, ...args);
    }

    warning(message, ...args) {
        this.logCounts.warning++;
        if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
            Sentry.withScope((scope) => {
                scope.setLevel("warning");
                Sentry.captureException(new Error(util.format(message, ...args)));
            });
        }
        this.writeLogToFile(message, this.types.warning, ...args);
    }

    error(message, ...args) {
        if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
            let sError;
            if (message.stack) 
                sError = message;
            else 
                sError = new Error(util.format(message, ...args));
            
            Sentry.withScope((scope) => {
                scope.setLevel("error");
                Sentry.captureException(sError);
            });
        }
        const stackTrace = new Error("Generated Stacktrace: ").stack;
        this.writeLogToFile(util.format(message, ...args) + "\n" + stackTrace, this.types.error);
    }

    debug(message, ...args) {
        this.writeLogToFile(message, this.types.debug, ...args);
        this.logCounts.debug++;
    }

    info(message, ...args) {
        this.writeLogToFile(message, this.types.info, ...args);
        this.logCounts.info++;
    }

    severe(message, ...args) {
        this.logCounts.severe++;
        if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
            let sError;
            if (message.stack) 
                sError = message;
            else 
                sError = new Error(util.format(message, ...args));
            
            Sentry.withScope((scope) => {
                scope.setLevel("fatal");
                Sentry.captureException(sError);
            });
        }
        const stackTrace = new Error("Generated Stacktrace: ").stack;
        this.writeLogToFile(message.stack || message + "\n" + stackTrace, this.types.severe, ...args);
    }

    music(message, ...args) {
        this.logCounts.music++;
        this.writeLogToFile(message, this.types.music, ...args);
    }

    event(message, ...args) {
        this.logCounts.event++;
        this.writeLogToFile(message, this.types.event, ...args);
    }

    command(message, ...args) {
        this.logCounts.command++;
        this.writeLogToFile(message, this.types.command, ...args);
    }

    async getAllTimeLogCount(type) {
        try {
            if (databaseManager.dbExists()) {
                const allTimeLogs = await repositories.logs.select();
                if (!type) return allTimeLogs.length;
                return allTimeLogs.filter(log => log.type == type.toUpperCase()).length;
            } else {
                return this.getTotalLogCount();
            }
        } catch (ex) {
            this.error(ex);
            return -1;
        }
    }

    getTotalLogCount() {
        return Object.values(this.logCounts).reduce((acc, count) => acc + count, 0);
    }

    format(error, excludedPaths = ["/node_modules/", "node:internal/modules"], maxLines = Infinity) {
        if (!(error instanceof Error)) 
            return String(error);
    
        if (!error.stack) 
            return error.message || String(error);
        
        const formatted = error.stack;
        
        return formatted
            .split("\n")
            .filter(line => !excludedPaths.some(path => line.includes(path)))
            .slice(0, maxLines)
            .join("\n");
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
module.exports = logger;