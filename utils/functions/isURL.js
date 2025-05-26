/**
 * Validates whether a given string is a fully qualified URL.
 * @param {string} string The string to validate.
 * @returns {boolean} True if the string is a valid URL, false otherwise.
 */
const isURL = function(string) {
    try {
        return ["http:", "https:"].includes(new URL(string).protocol);
    } catch {
        return false;
    }
};

module.exports = isURL;
