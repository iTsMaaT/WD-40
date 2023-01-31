const path = require('node:path');
const fs = require('node:fs/promises');

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

function writeLogToFile(file, log) {
    fs.appendFile(file, `${log}\r\n`)
    .catch(() => console.log(`[${getDateTime()} - SEVERE] Unable to write to logfile ${file}`));
    console.log(`${log}`);
}


class Logger {

    constructor(options) {
        this.options = options;
        this.logFolder = path.join(this.options.root, 'logs');
        let date = getDate();
        fs.readFile(path.join(this.logFolder, `${date}.log.txt`)).then(() => {
            this.logFile = path.join(this.logFolder, `${getDateTime().replaceAll(':', '.')}.log.txt`);
        }).catch(() => {
            this.logFile = path.join(this.logFolder, `${date}.log.txt`);
        }).finally(() => {
            console.log(`Started logger in file: ${this.logFile}`);
            try{
                fs.writeFile(this.logFile, "", (err) => {});
            } catch(e){
                console.log(`Cannot write logfile (${this.logFile})`);
            }
        });
    }

    error(message){
        writeLogToFile(this.logFile, `[${getDateTime()} -   ERROR] ${message}`);
    }

    debug(message) {
        writeLogToFile(this.logFile, `[${getDateTime()} -   DEBUG] ${message}`);
    }

    info(message) {
        writeLogToFile(this.logFile, `[${getDateTime()} -    INFO] ${message}`);
    }

    warning(message) {
        writeLogToFile(this.logFile, `[${getDateTime()} - WARNING] ${message}`);
    }

    severe(message) {
        writeLogToFile(this.logFile, `[${getDateTime()} -  SEVERE] ${message}`);
    }

}

module.exports = Logger;