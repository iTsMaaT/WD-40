const { repositories } = require("./db/tableManager.js");
const { editOrSend } = require("./functions/discordFunctions.js");
const { colorText, foregroundColor, backgroundColor, textStyle } = require("./functions/consoleColor.js");

const util = require("util");

/**
 * Get the current date in the format DD-MM-YYYY.
 * @returns {string} The formatted date.
 */
function getDate() {
    // Récupère la date
    const today = new Date();
    // Récupère le jour
    const dd = String(today.getDate()).padStart(2, "0");
    // Récupère le mois (Att! Janvier est 0)
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    // Récupère l'année
    const yyyy = today.getFullYear();
    // Retourne la date formatté
    return dd + "-" + mm + "-" + yyyy;
}


/**
 * Get the current date and time in the format DD-MM-YYYY HH:MM:SS.mmm.
 * @returns {string} The formatted date and time.
 */
function getDateTime() {
    const d = new Date();
    const time = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0") + "." + String(d.getMilliseconds()).padStart(3, "0");

    return getDate() + " " + time;
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
        this.writeLogToFile(message, this.types.warning);
        if (message == "[YOUTUBEJS][Player]:") logger.severe("Youtube player not working.");
    }

    severe(message) {
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