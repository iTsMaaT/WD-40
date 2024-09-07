/**
 * imple function to check if a string is a valid URL
 * @param {string} string The string to check
 * @returns {boolean} True if the string is a valid URL, false otherwise
 */
const isURL = function(url) {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
};

module.exports = isURL;