/**
 * Config class for managing the bot's configuration.
 * @typedef {Object} Config
 */
class Config {
    constructor() {
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
        this.baseConfig = require("./config.json");  // Load the base config using require
        this.config = { ...this.baseConfig };        // Create a copy of the base config
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
     * Set the value of a specific configuration key.
     * @param {keyof BaseConfig} key
     * @param {any} value
     */
    set(key, value) {
        this.config[key] = value;
    }
  
    /**
     * Reset a specific configuration key to its original value.
     * @param {keyof BaseConfig} key
     * @throws {Error} If the key does not exist in the base configuration.
     */
    reset(key) {
        if (key in this.baseConfig) 
            this.config[key] = this.baseConfig[key];
        else 
            throw new Error(`Key "${key}" does not exist in the base configuration.`);
      
    }
  
    /**
     * Reset all configuration keys to their original values.
     */
    resetAll() {
        this.config = { ...this.baseConfig };
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
}
  
// Singleton instance
const configInstance = new Config();
Object.freeze(configInstance);
  
module.exports = configInstance;
  