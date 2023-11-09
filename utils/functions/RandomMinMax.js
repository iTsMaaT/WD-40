/**
 * Returns a random Integer between @param min and @param max
 */
const RandomMinMax = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
module.exports = RandomMinMax;