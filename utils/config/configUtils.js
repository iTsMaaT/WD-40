const fs = require("fs");
const path = require("path");

class Config {
    constructor() {
        this.configFilePath = path.resolve(__dirname, "config.json");
        this.loadBaseConfig();
    }

    /**
     * Load the base configuration from a JSON file.
     * @private
     */
    loadBaseConfig() {
    /**
     * @type {BaseConfig}
     */
        this.baseConfig = require(this.configFilePath);  // Load the base config using require
        this.config = { ...this.baseConfig };            // Create a copy of the base config
    }

    /**
     * Get the value of a specific configuration key.
     * @param {keyof BaseConfig} key
     * @returns {any}
     */
    get(key) {
        return this.config[key];
    }

    /**
     * Set the value of a specific configuration key in memory.
     * @param {keyof BaseConfig} key
     * @param {any} value
     * @returns {Config}
     */
    set(key, value) {
        this.config[key] = value;
        return this;
    }

    /**
     * Reset a specific configuration key to its original value in memory.
     * @param {keyof BaseConfig} key
     * @returns {Config}
     * @throws {Error} If the key does not exist in the base configuration.
     */
    reset(key) {
        if (key in this.baseConfig) 
            this.config[key] = this.baseConfig[key];
        else 
            throw new Error(`Key "${key}" does not exist in the base configuration.`);
    
        return this;
    }

    /**
     * Reset all configuration keys to their original values in memory.
     * @returns {Config}
     */
    resetAll() {
        this.config = { ...this.baseConfig };
        return this;
    }

    /**
     * Check if a specific configuration key exists.
     * @param {keyof BaseConfig} key
     * @returns {boolean}
     */
    has(key) {
        return key in this.config;
    }

    /**
     * Get all configuration key-value pairs.
     * @returns {BaseConfig}
     */
    getAll() {
        return this.config;
    }
    
    /**
     * Remove a specific key from the configuration.
     * @param {keyof BaseConfig} key
     * @returns {Config}
     */
    delete(key) {
        if (key in this.config) 
            delete this.config[key];
        else 
            throw new Error(`Key "${key}" does not exist in the configuration.`);

        return this;
    }

    /**
     * Save the current configuration back to the original config file.
     * @returns {Config}
     */
    save() {
        fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2), "utf-8");
        return this;
    }
}

// Singleton instance
const configInstance = new Config();

module.exports = configInstance;
