/**
 * Extract numbers and strings from a string.
 * @param {string} input - The input string.
 * @returns {number[] | string[]} An array of numbers and strings.
 */
const extractNumbersAndStrings = (input) => {
    const regex = /(\d+)|"([^"]*)"/g;
    const result = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
        if (match[1] !== undefined) 
            result.push(Number(match[1]));
        else if (match[2] !== undefined) 
            result.push(match[2]);
    }

    return result;
};

module.exports = extractNumbersAndStrings;