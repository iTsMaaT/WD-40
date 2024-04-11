const { repositories } = require("./db/tableManager.js");

const util = require("util");
/* function checkIfFolderExists(path) {
    try{
        fs.readdirSync(path);
    } catch(e ){
        fs.mkdirSync(path);
    }
}*/

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

function getDateTime() {
    const d = new Date();
    const time = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0") + "." + String(d.getMilliseconds()).padStart(3, "0");

    return getDate() + " " + time;
}

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

    constructor(options) {
        this.options = options;
    }

    error(message) {
        writeLogToFile(`[${getDateTime()} -   ERROR]`, message, this.options.client, "ERROR");
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
        writeLogToFile(`[${getDateTime()} -  SEVERE]`, message, this.options.client, "SEVERE");
    }

    music(message) {
        writeLogToFile(`[${getDateTime()} -   MUSIC]`, message, this.options.client, "MUSIC");
    }

    event(message) {
        writeLogToFile(`[${getDateTime()} -   EVENT]`, message, this.options.client, "EVENT");
    }
}

module.exports = Logger;