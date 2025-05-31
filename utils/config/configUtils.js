const fs = require("fs");
const path = require("path");

/**
 * Represents the base configuration object.
 * 
 * @typedef {Object} BaseConfig
 */
class Config {
    constructor() {
        this.configFilePath = process.env.CONFIG_FILEPATH || path.resolve(__dirname, "../../utils/config/config.jsonc");
        
        this.envConfig = {
            OWNER_ID: process.env.OWNER_ID,
            STATUS_CHANNEL_ID: process.env.STATUS_CHANNEL_ID,
            MEMBERS_UPDATE_ID: process.env.MEMBERS_UPDATE_ID,
            SUGGESTION_CHANNEL_ID: process.env.SUGGESTION_CHANNEL_ID,
            GUILD_UPDATE_ID: process.env.GUILD_UPDATE_ID,
            LIVE_UPDATE_CHANNEL_ID: process.env.LIVE_UPDATE_CHANNEL_ID,
            GUILD_BLACKLIST: process.env.GUILD_BLACKLIST?.split(",").map(s => s.trim()) || [],
            GLOBAL_BLACKLIST: process.env.GLOBAL_BLACKLIST?.split(",").map(s => s.trim()) || [],
            SUPERUSER_WHITELIST: process.env.SUPERUSER_WHITELIST?.split(",").map(s => s.trim()) || [],
        };
        this.loadBaseConfig();
    }

    /**
     * Strip comments from a JSON string.
     * @param {string} jsonString
     * @returns {string}
     */
    stripJsonComments(jsonString) {
        let insideString = false;
        let insideSingleLineComment = false;
        let insideMultiLineComment = false;
        let result = "";
        let prevChar = "";
        
        for (let i = 0; i < jsonString.length; i++) {
            const currentChar = jsonString[i];
            const nextChar = jsonString[i + 1];
      
            if (insideSingleLineComment) {
                if (currentChar === "\n" || currentChar === "\r") {
                    insideSingleLineComment = false;
                    result += currentChar;
                }
                continue;
            }
      
            if (insideMultiLineComment) {
                if (currentChar === "*" && nextChar === "/") {
                    insideMultiLineComment = false;
                    i++; // Skip '/'
                }
                continue;
            }
      
            if (insideString) {
                if (currentChar === "\"" && prevChar !== "\\") 
                    insideString = false;
            
                result += currentChar;
            } else if (currentChar === "\"" && !insideString) {
                insideString = true;
                result += currentChar;
            } else if (currentChar === "/" && nextChar === "/") {
                insideSingleLineComment = true;
                i++; // Skip nextChar
            } else if (currentChar === "/" && nextChar === "*") {
                insideMultiLineComment = true;
                i++; // Skip nextChar
            } else {
                result += currentChar;
            }
      
            prevChar = currentChar;
        }
      
        return result;
    }      

    /**
     * Load the base configuration from a JSON file.
     * @private
     */
    loadBaseConfig() {
        const fileContent = fs.readFileSync(this.configFilePath, "utf-8");
        const strippedFileContent = this.stripJsonComments(fileContent);
        this.baseConfig = JSON.parse(strippedFileContent);
        this.config = { ...this.baseConfig, ...this.envConfig };
    }   

    /**
     * Reload the configuration from the file.
     * @returns {Config}
     */
    reload() {
        delete require.cache[require.resolve(this.configFilePath)];
    
        this.loadBaseConfig();
        return this;
    }

    /**
     * Get the value of a specific configuration key.
     * @param {keyof BaseConfig} key
     * @returns {any}
     */
    get(key) {
        if (this.config["warnForConfigNotInBaseConfig"] && !(key in this.baseConfig) && !(key in this.envConfig)) 
            console.warn(`The key "${key}" does not exist in the base configuration.`);

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
        // this.reload();
        return this;
    }

    /**
     * Reset a specific configuration key to its original value in memory.
     * @param {keyof BaseConfig} key
     * @returns {Config}
     */
    reset(key) {
        if (key in this.baseConfig) 
            this.config[key] = this.baseConfig[key];
        else 
            this.config[key] = undefined;
    
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
     * Get all configuration keys.
     * @returns {keyof BaseConfig[]}
     */
    getAllBaseConfig() {
        return this.baseConfig;
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
}

// Singleton instance
const configInstance = new Config();

module.exports = configInstance;
