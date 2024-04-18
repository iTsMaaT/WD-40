const { repositories } = require("./db/tableManager.js");

const util = require("util");
/* function checkIfFolderExists(path) {
    try{
        fs.readdirSync(path);
    } catch(e ){
        fs.mkdirSync(path);
    }
}*/


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

/**
 * Write log messages to console, Discord, and database.
 * @param {string} header - The header for the log message.
 * @param {string} message - The log message.
 * @param {object} client - The Discord client object.
 * @param {string} type - The type of log message.
 * @returns {Promise<void>} A Promise indicating completion.
 */
async function writeLogToFile(header, message, client, type) {
    
    // Set the color based on the log type
    let color;
    switch (type) {
        case "ERROR":
            color = "\x1b[33m"; // Yellow
            break;
        case "SEVERE":
            color = "\x1b[31m"; // Red
            break;
        case "MUSIC":
            color = "\x1b[34m"; // Blue
            break;
        case "WARNING":
            color = "\x1b[35m"; // Magenta
            break;
        case "EVENT":
            color = "\x1b[32m"; // Green
            break;
        default:
            color = "\x1b[0m"; // Reset color
            break;
    }

    const formattedLog = util.format(message);
    // Adds color depending on log type, then the log header, then the log and finally a newline
    process.stdout.write(`${color}${header} ${formattedLog}\x1b[0m\n`);
    
    if (type == "CONSOLE" || type == "EVENT") return;
    client?.channels?.cache?.get("1069811223950016572")?.send(`\`\`\`${header} ${formattedLog}\`\`\``);
    
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


class Logger {

    /**
     * Create a Logger.
     * @param {object} options - The options for the Logger.
     * @param {object} options.client - The Discord client object.
     */
    constructor(options) {
        this.options = options;
    }

    error(message) {
        const stackTrace = new Error("Generated Stacktrace: ").stack;
        writeLogToFile(`[${getDateTime()} -   ERROR]`, message.stack || message + "\n" + stackTrace, this.options.client, "ERROR");
    }

    debug(message) {
        writeLogToFile(`[${getDateTime()} -   DEBUG]`, message, this.options.client, "DEBUG");
    }

    info(message) {
        writeLogToFile(`[${getDateTime()} -    INFO]`, message, this.options.client, "INFO");
    }

    console(message) {
        writeLogToFile(`[${getDateTime()} - CONSOLE]`, message, this.options.client, "CONSOLE");
    }

    warning(message) {
        writeLogToFile(`[${getDateTime()} - WARNING]`, message, this.options.client, "WARNING");
    }

    severe(message) {
        const stackTrace = new Error("Generated Stacktrace: ").stack;
        writeLogToFile(`[${getDateTime()} -  SEVERE]`, message.stack || message + "\n" + stackTrace, this.options.client, "SEVERE");
    }

    music(message) {
        writeLogToFile(`[${getDateTime()} -   MUSIC]`, message, this.options.client, "MUSIC");
    }

    event(message) {
        writeLogToFile(`[${getDateTime()} -   EVENT]`, message, this.options.client, "EVENT");
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
let instance = null;

/**
 * Instantiate the Logger with the provided client.
 * @param {object} client - The Discord client object.
 * @returns {Promise<void>} A Promise indicating completion.
 */
module.exports = (function logger(client) {
    if (!instance) {
        if (!client) throw new Error("Logger attempted to be instanciated without the client object");
        instance = new Logger({ client });
        Object.freeze(instance);
    }
    return instance;
});