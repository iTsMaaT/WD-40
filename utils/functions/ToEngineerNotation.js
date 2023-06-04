const ToEngineerNotation = function(number) {
    if (number === 0) return '0';

    const k = 1024;
    const sizes = ['', 'K', 'M', 'G', 'T', 'P'];

    // Calculate the logarithm of the value in base 'k' (1024)
    const i = Math.floor(Math.log(number) / Math.log(k));

    // Calculate the value in the appropriate unit
    const formattedValue = parseFloat((number / Math.pow(k, i)).toFixed(2));

    // Combine the formatted value with the unit
    return formattedValue + ' ' + sizes[i];
};
module.exports = ToEngineerNotation;