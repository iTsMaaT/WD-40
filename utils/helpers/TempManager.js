const fs = require("fs");
const path = require("path");
const logger = require("../log.js");

/**
 * Manages temporary files and directories with automatic cleanup
 * @class
 */
class TempManager {
    /**
     * Creates a new TempManager instance
     * @param {Object} options - Configuration options
     * @param {number} [options.maxAge=3600000] - Maximum age of temp files in milliseconds (default: 1 hour)
     * @param {number} [options.cleanupInterval=900000] - Interval between cleanup runs in milliseconds (default: 15 minutes)
     */
    constructor(options = {}) {
        this.tempDir = path.join(process.cwd(), "utils", "temp");
        this.maxAge = options.maxAge || 1000 * 60 * 60; // Default: 1 hour
        this.cleanupInterval = options.cleanupInterval || 1000 * 60 * 15; // Default: 15 minutes
        
        this.ensureTempDirExists();
        this.startCleanupInterval();
    }

    /**
     * Ensures the temporary directory exists, creates it if necessary
     * @private
     */
    ensureTempDirExists() {
        try {
            if (!fs.existsSync(this.tempDir)) 
                fs.mkdirSync(this.tempDir, { recursive: true });
            
        } catch (err) {
            logger.error(`Failed to create temp directory: ${err}`);
        }
    }

    /**
     * Creates a temporary file with the specified prefix, extension, and data
     * @param {string} prefix - Prefix for the temporary file name
     * @param {string} [extension=""] - File extension including the dot (e.g., ".txt")
     * @param {string|Buffer} [data=""] - Data to write to the file
     * @returns {string|null} The path to the created file, or null if creation failed
     */
    createTempFile(prefix, extension = "", data = "") {
        try {
            const fileName = `${prefix}-${Date.now()}${extension}`;
            const filePath = path.join(this.tempDir, fileName);
            fs.writeFileSync(filePath, data);
            return filePath;
        } catch (err) {
            logger.error(`Failed to create temp file: ${err}`);
            return null;
        }
    }

    /**
     * Deletes a temporary file at the specified path
     * @param {string} filePath - Path to the file to delete
     * @returns {boolean} True if the file was deleted successfully, false otherwise
     */
    deleteTempFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
        } catch (err) {
            logger.error(`Failed to delete temp file ${filePath}: ${err}`);
        }
        return false;
    }

    /**
     * Cleans up old temporary files that exceed the maximum age
     * @private
     */
    cleanupOldFiles() {
        try {
            const now = Date.now();
            const files = fs.readdirSync(this.tempDir);

            files.forEach(file => {
                const filePath = path.join(this.tempDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtimeMs;

                if (age > this.maxAge) {
                    this.deleteTempFile(filePath);
                    logger.debug(`Deleted old temp file: ${file}`);
                }
            });
        } catch (err) {
            logger.error(`Failed to cleanup temp files: ${err}`);
        }
    }

    /**
     * Starts the automatic cleanup interval
     * @private
     */
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldFiles();
        }, this.cleanupInterval);
    }

    /**
     * Stops the automatic cleanup interval
     * Should be called when the TempManager instance is no longer needed
     */
    stopCleanupInterval() {
        if (this.cleanupInterval) 
            clearInterval(this.cleanupInterval);
    }
}

module.exports = TempManager;