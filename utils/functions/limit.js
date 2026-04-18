/**
 * Limits a number to a given range
 * @param {number} num - The number to limit
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} The limited number
 */
function limit(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

module.exports = limit;