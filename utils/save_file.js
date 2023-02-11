const path = require('node:path');
const fs = require('node:fs');

function checkIfFolderExists(path) {
    try{
        fs.readdirSync(path)
    } catch(e ){
        fs.mkdirSync(path);
    }
}

function readData(fileName){
    let data = {};
    try{
        const fd = fs.readFileSync(fileName, {encoding: 'utf8'});
        data = JSON.parse(fd);
    } catch (e){
        fs.writeFileSync(fileName, "{}", (err) => {});
    }
    
    return data;
}

function writeData(fileName, data){
    fs.writeFileSync(fileName, JSON.stringify(data, null, 4), {encoding: 'utf8'});
}

class SaveFile {

    data = {};
    fileName = "";

    constructor(options) {
        let p = path.join(options.root, 'saves');
        this.fileName = path.join(p, options.fileName);
        checkIfFolderExists(p);
        this.data = readData(this.fileName);
    }

    getData() {
        return this.data;
    }

    getValue(key) {
        return this.data[key];
    }

    setData(data) {
        this.data = data;
        writeData(this.fileName, this.data);
    }

    setValue(key, value){
        this.data[key] = value;
        writeData(this.fileName, this.data);
    }

    deleteKey(key) {
        delete this.data[key];
        writeData(this.fileName, this.data);
    }

}

module.exports = SaveFile;