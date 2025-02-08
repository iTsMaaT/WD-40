/**
 * Returns a random Integer between @param min and @param max
 */
const randomMinMax = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
module.exports = randomMinMax;