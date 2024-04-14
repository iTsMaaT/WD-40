const path = require("node:path");
const fs = require("node:fs");

/**
 * Check if a folder exists at the given path. If not, create it.
 * @param {string} filePath - The path to the folder.
 */
function checkIfFolderExists(filePath) {
    try {
        fs.readdirSync(filePath);
    } catch (e) {
        fs.mkdirSync(filePath);
    }
}

/**
 * Read data from a JSON file.
 * @param {string} fileName - The path to the JSON file.
 * @returns {Object} The parsed JSON data.
 */
function readData(fileName) {
    let data = {};
    try {
        const fd = fs.readFileSync(fileName, { encoding: "utf8" });
        data = JSON.parse(fd);
    } catch (e) {
        fs.writeFileSync(fileName, "{}", (err) => { console.log(err); });
    }
    
    return data;
}

/**
 * Write data to a JSON file.
 * @param {string} fileName - The path to the JSON file.
 * @param {Object} data - The data to write.
 */
function writeData(fileName, data) {
    fs.writeFileSync(fileName, JSON.stringify(data, null, 4), { encoding: "utf8" });
}

/**
 * Class representing a file for saving data.
 */
class SaveFile {

    /**
     * Create a SaveFile instance.
     * @param {Object} options - The options for creating the SaveFile.
     * @param {string} options.root - The root directory where the file will be saved.
     * @param {string} options.fileName - The name of the file.
     */
    constructor(options) {
        const p = path.join(options.root, "saves");
        this.fileName = path.join(p, options.fileName);
        checkIfFolderExists(p);
        this.data = readData(this.fileName);
    }

    /**
     * Get the data stored in the file.
     * @returns {Object} The data stored in the file.
     */
    getData() {
        return this.data;
    }

    /**
     * Get the value corresponding to the given key from the stored data.
     * @param {string} key - The key of the value to retrieve.
     * @returns {*} The value corresponding to the given key.
     */
    getValue(key) {
        return this.data[key];
    }

    /**
     * Set the data to be stored in the file.
     * @param {Object} data - The data to be stored.
     */
    setData(data) {
        this.data = data;
        writeData(this.fileName, this.data);
    }

    /**
     * Set a value corresponding to the given key in the stored data.
     * @param {string} key - The key of the value to set.
     * @param {*} value - The value to set.
     */
    setValue(key, value) {
        this.data[key] = value;
        writeData(this.fileName, this.data);
    }

    /**
     * Delete a key-value pair from the stored data.
     * @param {string} key - The key to delete.
     */
    deleteKey(key) {
        delete this.data[key];
        writeData(this.fileName, this.data);
    }

}

module.exports = SaveFile;
