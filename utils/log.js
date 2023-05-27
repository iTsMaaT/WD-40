const path = require('node:path');
const fs = require('node:fs');

function checkIfFolderExists(path) {
    try{
        fs.readdirSync(path)
    } catch(e ){
        fs.mkdirSync(path);
    }
}

function getDate() {
    // Récupère la date
    var today = new Date();
    // Récupère le jour
    var dd = String(today.getDate()).padStart(2, '0');
    // Récupère le mois (Att! Janvier est 0)
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    //Récupère l'année
    var yyyy = today.getFullYear();
    // Retourne la date formatté
    return dd + '-' + mm + '-' + yyyy;
}

function getDateTime() {
    var d = new Date();
    var time = String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0') + ":" + String(d.getSeconds()).padStart(2, '0') + '.' + String(d.getMilliseconds()).padStart(3, '0');

    return getDate() + ' ' + time;
}

async function writeLogToFile(log, client, type) {
    try{
        await global.prisma.logs.create({
            data: {
                Value: log,
                Type: type
            }
        })
    } catch(ex) {
        console.log(`[${getDateTime()} - SEVERE] Unable to write to database`)
        console.log(ex)
    }
    console.log(`${log}`);
    client?.channels?.cache?.get("1069811223950016572")?.send(`\`\`\`${log}\`\`\``);
}


class Logger {

    constructor(options) {
        this.options = options;
    }

    error(message){
        writeLogToFile(`[${getDateTime()} -   ERROR] ${message}`, this.options.client, "ERROR");
    }

    debug(message) {
        writeLogToFile(`[${getDateTime()} -   DEBUG] ${message}`, this.options.client, "DEBUG");
    }

    info(message) {
        writeLogToFile(`[${getDateTime()} -    INFO] ${message}`, this.options.client, "INFO");
    }

    warning(message) {
        writeLogToFile(`[${getDateTime()} - WARNING] ${message}`, this.options.client, "WARNING");
    }

    severe(message) {
        writeLogToFile(`[${getDateTime()} -  SEVERE] ${message}`, this.options.client, "SEVERE");
    }

    music(message) {
        writeLogToFile(`[${getDateTime()} -   MUSIC] ${message}`, this.options.client, "MUSIC");
    }

}

module.exports = Logger;