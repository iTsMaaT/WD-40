const GetUniqueValues = function (input) {
    const uniqueValues = [];
    const valueCounts = new Map();

    // Determine the type of the input
    const inputType = Array.isArray(input) ? 'array' : typeof input;

    // Handle array input
    if (inputType === 'array') {
        for (const value of input) {
            valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        }
    }
    // Handle collection input
    else if (inputType === 'object') {
        for (const value of Object.values(input)) {
            valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        }
    }

    // Add unique values to the result array
    for (const [value, count] of valueCounts) {
        if (count === 1) {
            uniqueValues.push(value);
        }
    }

    return uniqueValues;
};
module.exports = GetUniqueValues;