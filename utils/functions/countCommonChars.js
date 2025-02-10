/**
 * Count the number of common characters in the given strings.
 * @param {...string} strings - The strings to count the common characters in.
 * @returns {number} The number of common characters.
 */
function countCommonChars(...strings) {
    if (strings.length === 0) return 0;
    return [...new Set(strings[0])]
        .filter(char => strings.every(str => str.includes(char)))
        .length;
}

module.exports = countCommonChars;